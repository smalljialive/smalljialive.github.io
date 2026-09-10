(function () {
  "use strict";

  const VERSION = "20260910-1";
  if (window.__smallJiaToolboxVersion === VERSION) return;
  window.__smallJiaToolboxVersion = VERSION;

  const FAVORITES_KEY = "smalljia_toolbox_favorites_v1";
  const RECENT_KEY = "smalljia_toolbox_recent_v1";
  const DEFAULT_VISIBLE = 10;
  const RECENT_LIMIT = 10;
  const CARD_SELECTOR = ".flink-list-item, .telescopic-site-card-group > .site-card, .flexcard-flink-list > .flink-list-card";

  const safeParse = (raw, fallback) => {
    try {
      const value = JSON.parse(raw || "");
      return value == null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  };

  const getFavorites = () => {
    const value = safeParse(localStorage.getItem(FAVORITES_KEY), []);
    return new Set(Array.isArray(value) ? value : []);
  };

  const saveFavorites = (set) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
    } catch (_) {}
  };

  const getRecent = () => {
    const value = safeParse(localStorage.getItem(RECENT_KEY), []);
    return Array.isArray(value) ? value : [];
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

  const text = (node) => (node && node.textContent ? node.textContent.trim() : "");

  const getImage = (root) => {
    const candidates = [
      root.querySelector("img.cf-friends-avatar"),
      root.querySelector(".site-card-avatar img"),
      root.querySelector(".info img.flink-avatar"),
      root.querySelector("img.flink-avatar"),
      root.querySelector("img")
    ].filter(Boolean);
    const img = candidates[0];
    if (!img) return "";
    return img.getAttribute("cf-src") || img.getAttribute("data-lazy-src") || img.getAttribute("src") || "";
  };

  const extractItem = (root, category, index) => {
    const anchor = root.matches("a[href]")
      ? root
      : root.querySelector("a.cf-friends-link[href], a.info[href], a[href]");
    if (!anchor) return null;

    const nameNode = root.querySelector(".flink-item-name, .site-card-text .title, .flink-sitename, .cf-friends-name");
    const descNode = root.querySelector(".flink-item-desc, .site-card-text .desc");
    const tagNode = root.querySelector(".site-card-tag");
    const href = anchor.href || anchor.getAttribute("href") || "";
    const name = text(nameNode) || anchor.getAttribute("title") || href;
    const desc = text(descNode) || root.getAttribute("data-title") || anchor.getAttribute("data-title") || "";
    const url = normalizeUrl(href);
    if (!url || !name) return null;

    return {
      id: category + "::" + index + "::" + url,
      url,
      href,
      name,
      desc,
      category,
      avatar: getImage(root),
      tag: text(tagNode)
    };
  };

  const extractSections = (source) => {
    const children = Array.from(source.children);
    const headingIndexes = [];
    children.forEach((node, index) => {
      if (node.tagName === "H2") headingIndexes.push(index);
    });

    return headingIndexes.map((start, sectionIndex) => {
      const end = headingIndexes[sectionIndex + 1] == null ? children.length : headingIndexes[sectionIndex + 1];
      const heading = children[start];
      const category = text(heading).replace(/\s*\(\d+\)\s*$/, "").trim();
      const range = children.slice(start + 1, end);
      const descNode = range.find((node) => node.classList && node.classList.contains("flink-desc"));
      const roots = [];
      const seen = new Set();

      range.forEach((node) => {
        if (node.matches && node.matches(CARD_SELECTOR) && !seen.has(node)) {
          seen.add(node);
          roots.push(node);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll(CARD_SELECTOR).forEach((root) => {
            if (!seen.has(root)) {
              seen.add(root);
              roots.push(root);
            }
          });
        }
      });

      const items = roots.map((root, index) => extractItem(root, category, index)).filter(Boolean);
      return {
        id: "sj-toolbox-section-" + sectionIndex,
        category,
        desc: text(descNode),
        items
      };
    }).filter((section) => section.category && section.items.length);
  };

  const ensureStyle = () => {
    if (document.getElementById("smalljia-toolbox-style")) return;
    const link = document.createElement("link");
    link.id = "smalljia-toolbox-style";
    link.rel = "stylesheet";
    link.href = "/css/smalljia-toolbox.css?v=20260910-1";
    document.head.appendChild(link);
  };

  const isLinkPage = () => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return path === "/link" || (document.body && document.body.dataset.type === "link");
  };

  const makeIcon = (item) => {
    const wrap = document.createElement("span");
    wrap.className = "sj-toolbox-card-icon";

    const fallback = document.createElement("span");
    fallback.className = "sj-toolbox-card-fallback";
    fallback.textContent = (item.name || "站").slice(0, 1).toUpperCase();
    wrap.appendChild(fallback);

    if (item.avatar) {
      const img = document.createElement("img");
      img.src = item.avatar;
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("load", () => wrap.classList.add("has-image"), { once: true });
      img.addEventListener("error", () => img.remove(), { once: true });
      wrap.appendChild(img);
    }
    return wrap;
  };

  const recordRecent = (item, renderSmart) => {
    const recent = getRecent().filter((entry) => normalizeUrl(entry.url) !== item.url);
    recent.unshift({
      url: item.url,
      href: item.href,
      name: item.name,
      desc: item.desc,
      avatar: item.avatar,
      category: item.category,
      at: Date.now()
    });
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, RECENT_LIMIT)));
    } catch (_) {}
    if (typeof renderSmart === "function") renderSmart();
  };

  const makeCard = (item, favorites, onFavorite, renderSmart) => {
    const card = document.createElement("article");
    card.className = "sj-toolbox-card";
    card.dataset.url = item.url;
    card.dataset.category = item.category;
    card.dataset.search = [item.name, item.desc, item.category, item.url, item.tag].join(" ").toLowerCase();

    const favorite = document.createElement("button");
    favorite.type = "button";
    favorite.className = "sj-toolbox-favorite";
    favorite.dataset.favoriteUrl = item.url;
    favorite.setAttribute("aria-label", "收藏 " + item.name);
    favorite.title = "收藏到我的常用";

    const syncFavorite = () => {
      const active = favorites.has(item.url);
      favorite.classList.toggle("active", active);
      favorite.textContent = active ? "★" : "☆";
      favorite.title = active ? "从我的常用移除" : "收藏到我的常用";
      favorite.setAttribute("aria-pressed", active ? "true" : "false");
    };
    syncFavorite();

    favorite.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onFavorite(item.url);
    });

    const link = document.createElement("a");
    link.className = "sj-toolbox-card-link no-text-decoration";
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer nofollow";
    link.addEventListener("click", () => recordRecent(item, renderSmart));
    link.appendChild(makeIcon(item));

    const body = document.createElement("span");
    body.className = "sj-toolbox-card-body";

    const top = document.createElement("span");
    top.className = "sj-toolbox-card-title-row";
    const title = document.createElement("strong");
    title.className = "sj-toolbox-card-title";
    title.textContent = item.name;
    const arrow = document.createElement("span");
    arrow.className = "sj-toolbox-card-arrow";
    arrow.textContent = "↗";
    top.appendChild(title);
    top.appendChild(arrow);

    const desc = document.createElement("span");
    desc.className = "sj-toolbox-card-desc";
    desc.textContent = item.desc || "打开网站";

    const meta = document.createElement("span");
    meta.className = "sj-toolbox-card-meta";
    meta.textContent = item.tag || item.category;

    body.appendChild(top);
    body.appendChild(desc);
    body.appendChild(meta);
    link.appendChild(body);
    card.appendChild(link);
    card.appendChild(favorite);
    return card;
  };

  const mount = () => {
    if (!isLinkPage()) {
      document.body && document.body.classList.remove("sj-toolbox-ready");
      return;
    }

    ensureStyle();
    const container = document.querySelector("#article-container");
    const source = container && container.querySelector(":scope > .flink");
    if (!container || !source || container.querySelector(":scope > .sj-toolbox-app")) return;

    const sections = extractSections(source);
    if (!sections.length) return;
    const items = sections.flatMap((section) => section.items);
    const favorites = getFavorites();
    const expanded = new Set();
    const state = { category: "__all__", query: "" };

    const app = document.createElement("div");
    app.className = "sj-toolbox-app";

    const hero = document.createElement("section");
    hero.className = "sj-toolbox-hero";
    hero.innerHTML = `
      <div class="sj-toolbox-hero-copy">
        <span class="sj-toolbox-eyebrow">SMALLJIA TOOLBOX</span>
        <h1>百宝箱</h1>
        <p>把真正好用的网站和工具，整理成随手就能找到的入口。</p>
        <div class="sj-toolbox-stats"></div>
      </div>
      <div class="sj-toolbox-search-wrap">
        <span class="sj-toolbox-search-icon" aria-hidden="true">⌕</span>
        <input class="sj-toolbox-search" type="search" autocomplete="off" placeholder="搜索网站、用途或关键词…" aria-label="搜索百宝箱">
        <kbd>/</kbd>
        <button class="sj-toolbox-search-clear" type="button" aria-label="清空搜索">×</button>
      </div>
    `;
    hero.querySelector(".sj-toolbox-stats").textContent = items.length + " 个网站 · " + sections.length + " 个分类";
    app.appendChild(hero);

    const filterWrap = document.createElement("section");
    filterWrap.className = "sj-toolbox-filter-wrap";
    const chips = document.createElement("div");
    chips.className = "sj-toolbox-chips";
    filterWrap.appendChild(chips);
    const resultNote = document.createElement("div");
    resultNote.className = "sj-toolbox-result-note";
    filterWrap.appendChild(resultNote);
    app.appendChild(filterWrap);

    const smart = document.createElement("section");
    smart.className = "sj-toolbox-smart";
    smart.innerHTML = `
      <div class="sj-toolbox-smart-panel" data-panel="favorites">
        <div class="sj-toolbox-smart-head"><div><span class="sj-toolbox-smart-kicker">QUICK ACCESS</span><h2>★ 我的常用</h2></div><span class="sj-toolbox-smart-count"></span></div>
        <div class="sj-toolbox-mini-grid"></div>
      </div>
      <div class="sj-toolbox-smart-panel" data-panel="recent">
        <div class="sj-toolbox-smart-head"><div><span class="sj-toolbox-smart-kicker">RECENT</span><h2>最近使用</h2></div><button type="button" class="sj-toolbox-clear-recent">清空</button></div>
        <div class="sj-toolbox-mini-grid"></div>
      </div>
    `;
    app.appendChild(smart);

    const sectionsWrap = document.createElement("div");
    sectionsWrap.className = "sj-toolbox-sections";
    app.appendChild(sectionsWrap);

    const empty = document.createElement("div");
    empty.className = "sj-toolbox-empty";
    empty.innerHTML = "<strong>没有找到匹配的网站</strong><span>换一个关键词，或者切回“全部”试试。</span>";
    app.appendChild(empty);

    const syncAllFavoriteButtons = () => {
      app.querySelectorAll("[data-favorite-url]").forEach((button) => {
        const active = favorites.has(button.dataset.favoriteUrl);
        button.classList.toggle("active", active);
        button.textContent = active ? "★" : "☆";
        button.setAttribute("aria-pressed", active ? "true" : "false");
        button.title = active ? "从我的常用移除" : "收藏到我的常用";
      });
    };

    const toggleFavorite = (url) => {
      if (favorites.has(url)) favorites.delete(url);
      else favorites.add(url);
      saveFavorites(favorites);
      syncAllFavoriteButtons();
      renderSmart();
      applyFilters();
    };

    const makeMini = (item, removableFavorite) => {
      const row = document.createElement("div");
      row.className = "sj-toolbox-mini";
      const link = document.createElement("a");
      link.href = item.href || item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer nofollow";
      link.className = "sj-toolbox-mini-link no-text-decoration";
      link.appendChild(makeIcon(item));
      const copy = document.createElement("span");
      copy.className = "sj-toolbox-mini-copy";
      const title = document.createElement("strong");
      title.textContent = item.name;
      const meta = document.createElement("span");
      meta.textContent = item.category || "网站";
      copy.appendChild(title);
      copy.appendChild(meta);
      link.appendChild(copy);
      link.addEventListener("click", () => recordRecent(item, renderSmart));
      row.appendChild(link);
      if (removableFavorite) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sj-toolbox-mini-star active";
        btn.dataset.favoriteUrl = item.url;
        btn.textContent = "★";
        btn.title = "从我的常用移除";
        btn.addEventListener("click", () => toggleFavorite(item.url));
        row.appendChild(btn);
      }
      return row;
    };

    const renderSmart = () => {
      const favPanel = smart.querySelector('[data-panel="favorites"]');
      const favGrid = favPanel.querySelector(".sj-toolbox-mini-grid");
      const favoriteItems = items.filter((item) => favorites.has(item.url)).slice(0, 8);
      favPanel.querySelector(".sj-toolbox-smart-count").textContent = favorites.size ? favorites.size + " 个" : "";
      favGrid.innerHTML = "";
      if (!favoriteItems.length) {
        const tip = document.createElement("div");
        tip.className = "sj-toolbox-smart-empty";
        tip.textContent = "点击网站卡片右上角的 ☆，把常用入口放到这里。";
        favGrid.appendChild(tip);
      } else {
        favoriteItems.forEach((item) => favGrid.appendChild(makeMini(item, true)));
      }

      const recentGrid = smart.querySelector('[data-panel="recent"] .sj-toolbox-mini-grid');
      recentGrid.innerHTML = "";
      const map = new Map(items.map((item) => [item.url, item]));
      const recentItems = getRecent().slice(0, 8).map((entry) => map.get(normalizeUrl(entry.url)) || entry).filter(Boolean);
      if (!recentItems.length) {
        const tip = document.createElement("div");
        tip.className = "sj-toolbox-smart-empty";
        tip.textContent = "你打开过的网站会自动出现在这里。";
        recentGrid.appendChild(tip);
      } else {
        recentItems.forEach((item) => recentGrid.appendChild(makeMini(item, false)));
      }
      syncAllFavoriteButtons();
    };

    const sectionViews = sections.map((section) => {
      const sectionEl = document.createElement("section");
      sectionEl.className = "sj-toolbox-section";
      sectionEl.dataset.category = section.category;

      const head = document.createElement("div");
      head.className = "sj-toolbox-section-head";
      const copy = document.createElement("div");
      const title = document.createElement("h2");
      title.textContent = section.category;
      const desc = document.createElement("p");
      desc.textContent = section.desc || "收藏的网站与工具";
      copy.appendChild(title);
      copy.appendChild(desc);
      const count = document.createElement("span");
      count.className = "sj-toolbox-section-count";
      count.textContent = section.items.length + " 个";
      head.appendChild(copy);
      head.appendChild(count);
      sectionEl.appendChild(head);

      const grid = document.createElement("div");
      grid.className = "sj-toolbox-grid";
      section.items.forEach((item) => grid.appendChild(makeCard(item, favorites, toggleFavorite, renderSmart)));
      sectionEl.appendChild(grid);

      const more = document.createElement("button");
      more.type = "button";
      more.className = "sj-toolbox-more";
      more.addEventListener("click", () => {
        if (expanded.has(section.id)) expanded.delete(section.id);
        else expanded.add(section.id);
        applyFilters();
      });
      sectionEl.appendChild(more);
      sectionsWrap.appendChild(sectionEl);
      return { section, sectionEl, grid, more };
    });

    const addChip = (label, value, count) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sj-toolbox-chip";
      button.dataset.filter = value;
      const labelSpan = document.createElement("span");
      labelSpan.textContent = label;
      button.appendChild(labelSpan);
      if (count != null) {
        const countSpan = document.createElement("em");
        countSpan.textContent = count;
        button.appendChild(countSpan);
      }
      button.addEventListener("click", () => {
        state.category = value;
        state.query = "";
        search.value = "";
        applyFilters();
      });
      chips.appendChild(button);
    };

    addChip("全部", "__all__", items.length);
    addChip("★ 常用", "__favorites__", favorites.size);
    sections.forEach((section) => addChip(section.category, section.category, section.items.length));

    const search = hero.querySelector(".sj-toolbox-search");
    const clearSearch = hero.querySelector(".sj-toolbox-search-clear");

    const refreshFavoriteChip = () => {
      const chip = chips.querySelector('[data-filter="__favorites__"] em');
      if (chip) chip.textContent = favorites.size;
    };

    const applyFilters = () => {
      const query = state.query.trim().toLowerCase();
      let visibleTotal = 0;
      const defaultBrowse = state.category === "__all__" && !query;

      sectionViews.forEach(({ section, sectionEl, grid, more }) => {
        const categoryMatch = state.category === "__all__" || state.category === "__favorites__" || state.category === section.category;
        let sectionVisible = 0;
        const cards = Array.from(grid.children);
        cards.forEach((card, index) => {
          const itemUrl = card.dataset.url;
          const favoriteMatch = state.category !== "__favorites__" || favorites.has(itemUrl);
          const searchMatch = !query || card.dataset.search.includes(query);
          const pass = categoryMatch && favoriteMatch && searchMatch;
          const collapsedOut = defaultBrowse && !expanded.has(section.id) && index >= DEFAULT_VISIBLE;
          const show = pass && !collapsedOut;
          card.classList.toggle("sj-toolbox-hidden", !show);
          if (pass) sectionVisible += 1;
          if (show) visibleTotal += 1;
        });

        sectionEl.classList.toggle("sj-toolbox-hidden", !categoryMatch || sectionVisible === 0);
        const canFold = defaultBrowse && section.items.length > DEFAULT_VISIBLE;
        more.classList.toggle("sj-toolbox-hidden", !canFold);
        if (canFold) {
          const isExpanded = expanded.has(section.id);
          more.textContent = isExpanded
            ? "收起 ↑"
            : "展开另外 " + (section.items.length - DEFAULT_VISIBLE) + " 个 ↓";
        }
      });

      chips.querySelectorAll(".sj-toolbox-chip").forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.filter === state.category);
      });
      refreshFavoriteChip();
      smart.classList.toggle("sj-toolbox-hidden", !defaultBrowse);
      clearSearch.classList.toggle("visible", Boolean(query));
      empty.classList.toggle("visible", visibleTotal === 0);

      if (defaultBrowse) resultNote.textContent = "按分类浏览，或直接搜索全部 " + items.length + " 个网站";
      else if (state.category === "__favorites__") resultNote.textContent = "我的常用 · " + visibleTotal + " 个网站";
      else if (query) resultNote.textContent = "找到 " + visibleTotal + " 个相关网站";
      else resultNote.textContent = state.category + " · " + visibleTotal + " 个网站";
    };

    search.addEventListener("input", () => {
      state.query = search.value;
      if (state.query) state.category = "__all__";
      applyFilters();
    });
    clearSearch.addEventListener("click", () => {
      search.value = "";
      state.query = "";
      search.focus();
      applyFilters();
    });

    smart.querySelector(".sj-toolbox-clear-recent").addEventListener("click", () => {
      try { localStorage.removeItem(RECENT_KEY); } catch (_) {}
      renderSmart();
    });

    renderSmart();
    applyFilters();

    source.classList.add("sj-toolbox-source-hidden");
    source.parentNode.insertBefore(app, source);
    document.body.classList.add("sj-toolbox-ready");

    if (!window.__smallJiaToolboxKeyHandlerBound) {
      window.__smallJiaToolboxKeyHandlerBound = true;
      document.addEventListener("keydown", (event) => {
        if (!isLinkPage()) return;
        const active = document.activeElement;
        const editable = active && (active.matches("input, textarea, select") || active.isContentEditable);
        if (event.key === "/" && !editable) {
          const input = document.querySelector(".sj-toolbox-search");
          if (input) {
            event.preventDefault();
            input.focus();
          }
        } else if (event.key === "Escape") {
          const input = document.querySelector(".sj-toolbox-search");
          if (input && input.value) {
            input.value = "";
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.blur();
          }
        }
      });
    }
  };

  const boot = () => setTimeout(mount, 0);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  document.addEventListener("pjax:complete", boot);
})();
