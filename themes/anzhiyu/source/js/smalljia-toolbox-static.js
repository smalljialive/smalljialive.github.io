(function () {
  "use strict";

  const VERSION = "20260910-static-1";
  const FAVORITES_KEY = "smalljia_toolbox_favorites_v1";
  const RECENT_KEY = "smalljia_toolbox_recent_v1";
  const DEFAULT_VISIBLE = 10;
  const RECENT_LIMIT = 10;

  const safeParse = (raw, fallback) => {
    try {
      const value = JSON.parse(raw || "");
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  };

  const normalizeUrl = (value) => {
    try {
      const url = new URL(value, window.location.href);
      url.hash = "";
      return url.href.replace(/\/$/, "");
    } catch (_) {
      return String(value || "").replace(/\/$/, "");
    }
  };

  const getFavorites = () => {
    const value = safeParse(localStorage.getItem(FAVORITES_KEY), []);
    return new Set(Array.isArray(value) ? value.map(normalizeUrl) : []);
  };

  const saveFavorites = (favorites) => {
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites))); } catch (_) {}
  };

  const getRecent = () => {
    const value = safeParse(localStorage.getItem(RECENT_KEY), []);
    return Array.isArray(value) ? value : [];
  };

  const itemFromCard = (card) => ({
    url: card.dataset.normUrl || normalizeUrl(card.dataset.url),
    href: card.dataset.href || card.dataset.url,
    name: card.dataset.name || "网站",
    desc: card.dataset.desc || "打开网站",
    avatar: card.dataset.avatar || "",
    category: card.dataset.category || "网站",
    tag: card.dataset.tag || card.dataset.category || "网站"
  });

  const makeIcon = (item) => {
    const wrap = document.createElement("span");
    wrap.className = "sj-toolbox-card-icon" + (item.avatar ? " has-image" : "");

    const fallback = document.createElement("span");
    fallback.className = "sj-toolbox-card-fallback";
    fallback.textContent = String(item.name || "站").slice(0, 1).toUpperCase();
    wrap.appendChild(fallback);

    if (item.avatar) {
      const img = document.createElement("img");
      img.src = item.avatar;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => img.remove(), { once: true });
      wrap.appendChild(img);
    }
    return wrap;
  };

  const makeMini = (item, removableFavorite) => {
    const row = document.createElement("div");
    row.className = "sj-toolbox-mini";
    row.dataset.url = item.url;
    row.dataset.href = item.href || item.url;
    row.dataset.name = item.name || "网站";
    row.dataset.desc = item.desc || "";
    row.dataset.avatar = item.avatar || "";
    row.dataset.category = item.category || "网站";

    const link = document.createElement("a");
    link.className = "sj-toolbox-mini-link no-text-decoration";
    link.href = item.href || item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer nofollow";
    link.appendChild(makeIcon(item));

    const copy = document.createElement("span");
    copy.className = "sj-toolbox-mini-copy";
    const title = document.createElement("strong");
    title.textContent = item.name || "网站";
    const meta = document.createElement("span");
    meta.textContent = item.category || "网站";
    copy.appendChild(title);
    copy.appendChild(meta);
    link.appendChild(copy);
    row.appendChild(link);

    if (removableFavorite) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sj-toolbox-mini-star active";
      button.dataset.favoriteUrl = item.url;
      button.textContent = "★";
      button.title = "从我的常用移除";
      row.appendChild(button);
    }
    return row;
  };

  const mount = () => {
    const app = document.querySelector(".sj-toolbox-app");
    if (!app) {
      document.body && document.body.classList.remove("sj-toolbox-ready");
      return;
    }
    if (app.dataset.staticBound === VERSION) return;
    app.dataset.staticBound = VERSION;
    document.body && document.body.classList.add("sj-toolbox-ready");

    const cards = Array.from(app.querySelectorAll(".sj-toolbox-card"));
    cards.forEach((card) => { card.dataset.normUrl = normalizeUrl(card.dataset.url); });
    const chips = Array.from(app.querySelectorAll("[data-category-filter]"));
    const search = app.querySelector(".sj-toolbox-search");
    const clearSearch = app.querySelector(".sj-toolbox-search-clear");
    const resultNote = app.querySelector(".sj-toolbox-result-note");
    const empty = app.querySelector(".sj-toolbox-empty");
    const favoriteCount = app.querySelector("[data-favorite-count]");
    const smart = app.querySelector(".sj-toolbox-smart");
    const cardMap = new Map(cards.map((card) => [card.dataset.normUrl, card]));
    const sectionViews = Array.from(app.querySelectorAll(".sj-toolbox-section")).map((section) => ({
      section,
      category: section.dataset.category || "",
      cards: Array.from(section.querySelectorAll(".sj-toolbox-card")),
      more: section.querySelector(":scope > .sj-toolbox-more")
    }));
    const favorites = getFavorites();
    const state = { category: "__all__", query: "" };
    let searchTimer = null;

    const renderFavoriteState = () => {
      app.querySelectorAll("[data-favorite-url]").forEach((button) => {
        const url = normalizeUrl(button.dataset.favoriteUrl);
        const active = favorites.has(url);
        button.classList.toggle("active", active);
        button.textContent = active ? "★" : "☆";
        button.setAttribute("aria-pressed", active ? "true" : "false");
        button.title = active ? "从我的常用移除" : "收藏到我的常用";
      });
      if (favoriteCount) favoriteCount.textContent = String(favorites.size);
    };

    const renderSmart = () => {
      if (!smart) return;
      const favPanel = smart.querySelector('[data-panel="favorites"]');
      const recentPanel = smart.querySelector('[data-panel="recent"]');
      const favGrid = favPanel && favPanel.querySelector(".sj-toolbox-mini-grid");
      const recentGrid = recentPanel && recentPanel.querySelector(".sj-toolbox-mini-grid");
      if (!favGrid || !recentGrid) return;

      const favoriteItems = cards
        .filter((card) => favorites.has(card.dataset.normUrl))
        .slice(0, 8)
        .map(itemFromCard);
      const favCount = favPanel.querySelector(".sj-toolbox-smart-count");
      if (favCount) favCount.textContent = favorites.size ? favorites.size + " 个" : "";
      favGrid.replaceChildren();
      if (!favoriteItems.length) {
        const tip = document.createElement("div");
        tip.className = "sj-toolbox-smart-empty";
        tip.textContent = "点击网站卡片右上角的 ☆，把常用入口放到这里。";
        favGrid.appendChild(tip);
      } else {
        const frag = document.createDocumentFragment();
        favoriteItems.forEach((item) => frag.appendChild(makeMini(item, true)));
        favGrid.appendChild(frag);
      }

      const recentItems = getRecent().slice(0, 8).map((entry) => {
        const card = cardMap.get(normalizeUrl(entry.url));
        return card ? itemFromCard(card) : entry;
      }).filter(Boolean);
      recentGrid.replaceChildren();
      if (!recentItems.length) {
        const tip = document.createElement("div");
        tip.className = "sj-toolbox-smart-empty";
        tip.textContent = "你打开过的网站会自动出现在这里。";
        recentGrid.appendChild(tip);
      } else {
        const frag = document.createDocumentFragment();
        recentItems.forEach((item) => frag.appendChild(makeMini(item, false)));
        recentGrid.appendChild(frag);
      }
      renderFavoriteState();
    };

    const recordRecent = (item) => {
      const url = normalizeUrl(item.url);
      const recent = getRecent().filter((entry) => normalizeUrl(entry.url) !== url);
      recent.unshift({
        url,
        href: item.href || item.url,
        name: item.name,
        desc: item.desc,
        avatar: item.avatar,
        category: item.category,
        at: Date.now()
      });
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, RECENT_LIMIT))); } catch (_) {}
      renderSmart();
    };

    const updateChipState = () => {
      chips.forEach((chip) => {
        const active = chip.dataset.categoryFilter === state.category;
        chip.classList.toggle("active", active);
        chip.setAttribute("aria-pressed", active ? "true" : "false");
      });
    };

    const applyFilters = () => {
      const query = state.query.trim().toLowerCase();
      const isSearch = Boolean(query);
      let totalMatches = 0;

      sectionViews.forEach((view) => {
        const expanded = view.section.dataset.expanded === "1";
        const categorySelected = state.category === "__all__" || state.category === "__favorites__" || state.category === view.category;
        let sectionMatches = 0;

        view.cards.forEach((card) => {
          const favoriteMatch = state.category !== "__favorites__" || favorites.has(card.dataset.normUrl);
          const categoryMatch = state.category === "__all__" || state.category === "__favorites__" || card.dataset.category === state.category;
          const queryMatch = !query || String(card.dataset.search || "").includes(query);
          const matches = categoryMatch && favoriteMatch && queryMatch;
          if (matches) sectionMatches += 1;

          let visible = matches;
          if (visible && !isSearch && state.category !== "__favorites__" && !expanded) {
            visible = Number(card.dataset.order || 0) < DEFAULT_VISIBLE;
          }
          card.classList.toggle("sj-toolbox-hidden", !visible);
        });

        if (categorySelected) totalMatches += sectionMatches;
        view.section.classList.toggle("sj-toolbox-hidden", !categorySelected || sectionMatches === 0);

        if (view.more) {
          const showMore = categorySelected && !isSearch && state.category !== "__favorites__" && view.cards.length > DEFAULT_VISIBLE;
          view.more.classList.toggle("sj-toolbox-hidden", !showMore);
          const remaining = Math.max(0, view.cards.length - DEFAULT_VISIBLE);
          view.more.textContent = expanded ? "收起" : "显示更多（" + remaining + "）";
        }
      });

      if (empty) empty.classList.toggle("visible", totalMatches === 0);
      if (clearSearch) clearSearch.classList.toggle("visible", Boolean(state.query));
      updateChipState();

      if (resultNote) {
        if (query) resultNote.textContent = "找到 " + totalMatches + " 个匹配网站";
        else if (state.category === "__favorites__") resultNote.textContent = "我的常用：" + totalMatches + " 个网站";
        else if (state.category !== "__all__") resultNote.textContent = "分类“" + state.category + "”：" + totalMatches + " 个网站";
        else resultNote.textContent = "按分类浏览，共 " + totalMatches + " 个网站";
      }
    };

    const toggleFavorite = (rawUrl) => {
      const url = normalizeUrl(rawUrl);
      if (favorites.has(url)) favorites.delete(url);
      else favorites.add(url);
      saveFavorites(favorites);
      renderSmart();
      applyFilters();
    };

    app.addEventListener("click", (event) => {
      const favoriteButton = event.target.closest("[data-favorite-url]");
      if (favoriteButton && app.contains(favoriteButton)) {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(favoriteButton.dataset.favoriteUrl);
        return;
      }

      const chip = event.target.closest("[data-category-filter]");
      if (chip && app.contains(chip)) {
        state.category = chip.dataset.categoryFilter || "__all__";
        applyFilters();
        return;
      }

      const more = event.target.closest(".sj-toolbox-more");
      if (more && app.contains(more)) {
        const section = more.closest(".sj-toolbox-section");
        if (section) {
          section.dataset.expanded = section.dataset.expanded === "1" ? "0" : "1";
          applyFilters();
        }
        return;
      }

      const cardLink = event.target.closest(".sj-toolbox-card-link");
      if (cardLink && app.contains(cardLink)) {
        const card = cardLink.closest(".sj-toolbox-card");
        if (card) recordRecent(itemFromCard(card));
        return;
      }

      const miniLink = event.target.closest(".sj-toolbox-mini-link");
      if (miniLink && app.contains(miniLink)) {
        const row = miniLink.closest(".sj-toolbox-mini");
        if (row) {
          recordRecent({
            url: normalizeUrl(row.dataset.url),
            href: row.dataset.href || row.dataset.url,
            name: row.dataset.name || "网站",
            desc: row.dataset.desc || "",
            avatar: row.dataset.avatar || "",
            category: row.dataset.category || "网站"
          });
        }
      }
    });

    if (search) {
      search.addEventListener("input", () => {
        state.query = search.value || "";
        clearTimeout(searchTimer);
        searchTimer = window.setTimeout(applyFilters, 60);
      });
    }

    if (clearSearch) {
      clearSearch.addEventListener("click", () => {
        if (!search) return;
        search.value = "";
        state.query = "";
        applyFilters();
        search.focus();
      });
    }

    const clearRecent = app.querySelector(".sj-toolbox-clear-recent");
    if (clearRecent) {
      clearRecent.addEventListener("click", () => {
        try { localStorage.removeItem(RECENT_KEY); } catch (_) {}
        renderSmart();
      });
    }

    renderSmart();
    applyFilters();
  };

  if (!window.__smallJiaToolboxShortcutBound) {
    window.__smallJiaToolboxShortcutBound = true;
    document.addEventListener("keydown", (event) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      if (active && /INPUT|TEXTAREA|SELECT/.test(active.tagName)) return;
      const search = document.querySelector(".sj-toolbox-app .sj-toolbox-search");
      if (!search) return;
      event.preventDefault();
      search.focus();
    });
  }

  const boot = () => window.setTimeout(mount, 0);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  document.addEventListener("pjax:complete", boot);
})();
