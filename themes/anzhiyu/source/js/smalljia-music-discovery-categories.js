(function () {
  "use strict";

  const GLOBAL_KEY = "__smallJiaDiscoveryCategoriesLoaded";
  const BOOT_KEY = "__smallJiaDiscoveryCategoriesBoot";
  const STORAGE_KEY = "smalljia_music_discovery_category_v1";
  const HISTORY_KEY = "smalljia_music_discovery_history_v1";
  const DIRECT_API = "https://music-api.gdstudio.xyz/api.php";
  const PROXY_API = "https://smalljia-music-proxy-small-jias-projects.vercel.app/api/music";
  const HISTORY_LIMIT = 30;
  const CACHE_TTL = 15 * 60 * 1000;

  const CATEGORIES = [
    { key: "sad", label: "伤感", seeds: ["伤感歌曲", "失恋情歌", "深夜伤感", "emo 华语"] },
    { key: "quiet", label: "安静", seeds: ["安静音乐", "轻音乐", "夜晚安静", "静心"] },
    { key: "healing", label: "治愈", seeds: ["治愈系", "温柔治愈", "放松音乐", "暖心歌曲"] },
    { key: "pop", label: "流行", seeds: ["华语流行", "流行音乐", "热门流行", "流行金曲"] },
    { key: "rock", label: "摇滚", seeds: ["华语摇滚", "经典摇滚", "摇滚乐", "独立摇滚"] },
    { key: "folk", label: "民谣", seeds: ["华语民谣", "城市民谣", "独立民谣", "民谣精选"] },
    { key: "rnb", label: "R&B", seeds: ["R&B", "华语 R&B", "节奏布鲁斯", "R&B 情歌"] },
    { key: "rap", label: "说唱", seeds: ["华语说唱", "中文说唱", "Hip-Hop", "说唱精选"] },
    { key: "electronic", label: "电子", seeds: ["电子音乐", "EDM", "电音", "电子舞曲"] },
    { key: "instrumental", label: "纯音乐", seeds: ["纯音乐", "钢琴纯音乐", "轻音乐 纯音乐", "治愈纯音乐"] },
    { key: "nostalgia", label: "怀旧", seeds: ["经典老歌", "怀旧金曲", "华语老歌", "粤语经典"] },
    { key: "guofeng", label: "国风", seeds: ["国风音乐", "古风歌曲", "中国风", "古风精选"] },
  ];

  const cache = new Map();

  const getSelectedKey = () => {
    const value = localStorage.getItem(STORAGE_KEY) || "";
    return CATEGORIES.some(item => item.key === value) ? value : "";
  };

  const setSelectedKey = key => {
    if (key && CATEGORIES.some(item => item.key === key)) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const selectedCategory = () => CATEGORIES.find(item => item.key === getSelectedKey()) || null;

  const normalizeText = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const artistText = value => {
    if (Array.isArray(value)) {
      return value.map(item => typeof item === "string" ? item : item?.name || "").filter(Boolean).join(" / ") || "未知歌手";
    }
    if (value && typeof value === "object") return value.name || value.artist || "未知歌手";
    return String(value || "未知歌手");
  };

  const normalizeList = payload => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload.result)) return payload.result;
    if (Array.isArray(payload?.result?.songs)) return payload.result.songs;
    if (Array.isArray(payload.songs)) return payload.songs;
    return [];
  };

  const extractUrl = payload => {
    if (!payload) return "";
    if (typeof payload === "string") {
      const value = payload.trim().replace(/^"|"$/g, "");
      return /^https?:\/\//i.test(value) ? value.replace(/^http:\/\//i, "https://") : "";
    }
    if (Array.isArray(payload)) {
      for (const item of payload) {
        const value = extractUrl(item);
        if (value) return value;
      }
      return "";
    }
    if (typeof payload === "object") {
      for (const key of ["url", "pic", "cover", "data"]) {
        if (payload[key] !== undefined) {
          const value = extractUrl(payload[key]);
          if (value) return value;
        }
      }
    }
    return "";
  };

  const normalizeTrack = (raw = {}) => {
    const source = String(raw.source || raw.server || "netease").toLowerCase();
    const id = String(raw.id || raw.url_id || raw.urlId || raw.songid || raw.songId || "");
    const urlId = String(raw.url_id || raw.urlId || id);
    const lyricId = String(raw.lyric_id || raw.lyricId || id);
    const picId = String(raw.pic_id || raw.picId || id);
    const name = raw.name || raw.title || raw.songName || "未知歌曲";
    const artist = artistText(raw.artist || raw.artists || raw.author || raw.singer);
    const albumValue = raw.album;
    const album = typeof albumValue === "string" ? albumValue : albumValue?.name || raw.albumName || "";
    const coverRaw = raw.cover || raw.pic || raw.picUrl || raw.albumPic || "";
    const cover = /^https?:\/\//i.test(coverRaw) ? String(coverRaw).replace(/^http:\/\//i, "https://") : "";
    const key = id ? `${source}:${id}` : `${name}::${artist}`.toLowerCase();
    return {
      id,
      server: source,
      source,
      name,
      artist,
      album,
      cover,
      url: /^https?:\/\//i.test(raw.url || "") ? raw.url : "",
      lrc: raw.lrc || raw.lyric || "",
      key,
      __gdStudio: { source, urlId, lyricId, picId },
    };
  };

  const sameTrack = (a, b) => {
    if (!a || !b) return false;
    if (a.id && b.id && String(a.id) === String(b.id) && String(a.server || a.source || "netease") === String(b.server || b.source || "netease")) return true;
    return normalizeText(a.name) === normalizeText(b.name) && normalizeText(a.artist) === normalizeText(b.artist);
  };

  const buildUrl = (base, params) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    return url.toString();
  };

  const requestAt = async (base, params, timeout = 10000) => {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeout);
    try {
      const response = await fetch(buildUrl(base, params), {
        signal: abort.signal,
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json, text/plain, */*" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      try { return JSON.parse(text); } catch (_) { return text; }
    } finally {
      clearTimeout(timer);
    }
  };

  const requestApi = async params => {
    try { return await requestAt(DIRECT_API, params); }
    catch (directError) {
      try { return await requestAt(PROXY_API, params); }
      catch (proxyError) {
        const error = new Error(proxyError?.message || "music API unavailable");
        error.cause = directError;
        throw error;
      }
    }
  };

  const shuffled = items => [...items].sort(() => Math.random() - 0.5);

  const loadCategoryPool = async category => {
    const cached = cache.get(category.key);
    if (cached && Date.now() - cached.at < CACHE_TTL && cached.tracks.length) return cached.tracks;

    const tracks = [];
    const seeds = shuffled(category.seeds).slice(0, 3);
    for (const seed of seeds) {
      try {
        const payload = await requestApi({
          types: "search",
          source: "netease",
          name: seed,
          count: 40,
          pages: 1 + Math.floor(Math.random() * 3),
        });
        normalizeList(payload)
          .map(raw => normalizeTrack({ ...raw, source: raw.source || "netease" }))
          .filter(track => track.id && track.name)
          .forEach(track => {
            if (!tracks.some(item => sameTrack(item, track))) tracks.push(track);
          });
      } catch (_) {}
      if (tracks.length >= 60) break;
    }

    if (!tracks.length) throw new Error(`没有找到「${category.label}」分类歌曲`);
    cache.set(category.key, { at: Date.now(), tracks });
    return tracks;
  };

  const hydrateCover = async track => {
    if (track.cover && /^https?:\/\//i.test(track.cover)) return track;
    const picId = track?.__gdStudio?.picId || track.id;
    if (!picId) return track;
    try {
      const payload = await requestApi({ types: "pic", source: track.server || "netease", id: picId, size: 500 });
      const cover = extractUrl(payload);
      if (cover) track.cover = cover;
    } catch (_) {}
    return track;
  };

  const updateCategoryUi = lib => {
    const root = lib?.root;
    if (!root) return;
    const selected = selectedCategory();
    root.querySelectorAll("[data-sjm-discovery-category]").forEach(button => {
      const key = button.dataset.sjmDiscoveryCategory || "";
      const active = selected ? key === selected.key : key === "all";
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (lib.dom?.discoverRoute) {
      lib.dom.discoverRoute.textContent = selected ? `网易云 · ${selected.label}` : "网易云 · 随机发现";
    }
    if (lib.dom?.discoverStatus && !lib.discoveryBusy) {
      lib.dom.discoverStatus.textContent = selected
        ? `已选择「${selected.label}」，点击“随机来一首”将在该分类中随机。`
        : "未限定分类，点击“随机来一首”将从网易云整体随机。";
    }
  };

  const injectCategoryUi = lib => {
    const view = lib?.dom?.discoverView;
    if (!view || view.querySelector("#sjm-discovery-categories")) return;

    const headDescription = view.querySelector(".sjm-page-head .sjm-library-head p, .sjm-page-head p");
    if (headDescription) headDescription.textContent = "可以先选择想听的分类，也可以保持“全部”，继续从网易云整体随机发现。";

    const panel = document.createElement("div");
    panel.id = "sjm-discovery-categories";
    panel.className = "sjm-discovery-category-panel";
    panel.innerHTML = `
      <div class="sjm-discovery-category-title">
        <span class="sjm-eyebrow">MOOD & GENRE</span>
        <strong>选择想听的类型</strong>
        <small>不选分类时保持整体随机</small>
      </div>
      <div class="sjm-discovery-category-list" role="group" aria-label="随机听歌分类">
        <button type="button" class="sjm-discovery-category" data-sjm-discovery-category="all" aria-pressed="true">全部</button>
        ${CATEGORIES.map(item => `<button type="button" class="sjm-discovery-category" data-sjm-discovery-category="${item.key}" aria-pressed="false">${item.label}</button>`).join("")}
      </div>`;

    const card = view.querySelector(".sjm-discover-card");
    if (card) card.parentNode.insertBefore(panel, card);
    else view.appendChild(panel);

    panel.addEventListener("click", event => {
      const button = event.target instanceof Element ? event.target.closest("[data-sjm-discovery-category]") : null;
      if (!button) return;
      const key = button.dataset.sjmDiscoveryCategory || "";
      const current = getSelectedKey();
      setSelectedKey(key === "all" || key === current ? "" : key);
      updateCategoryUi(lib);
      const selected = selectedCategory();
      lib.app?.showToast?.(selected ? `随机分类：${selected.label}` : "已切换为全部随机");
    });

    updateCategoryUi(lib);
  };

  const playFromCategory = async (lib, category) => {
    if (lib.discoveryBusy) return;
    lib.discoveryBusy = true;
    if (lib.dom?.discoverNext) lib.dom.discoverNext.disabled = true;
    if (lib.dom?.discoverStatus) lib.dom.discoverStatus.textContent = `正在从「${category.label}」分类随机找歌…`;

    try {
      const tracks = await loadCategoryPool(category);
      let track = typeof lib.pickRandom === "function"
        ? lib.pickRandom(tracks)
        : tracks[Math.floor(Math.random() * tracks.length)];
      if (!track) throw new Error("没有可用随机歌曲");
      track = await hydrateCover(track);

      const history = Array.isArray(lib.discoveryHistory) ? lib.discoveryHistory : [];
      lib.discoveryHistory = [track, ...history.filter(item => !sameTrack(item, track))].slice(0, HISTORY_LIMIT);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(lib.discoveryHistory)); } catch (_) {}
      lib.renderDiscovery?.();

      if (lib.dom?.discoverRoute) lib.dom.discoverRoute.textContent = `网易云 · ${category.label}`;
      if (lib.dom?.discoverStatus) lib.dom.discoverStatus.textContent = `随机到：${track.name} · ${track.artist}（${category.label}）`;
      await lib.app.playTrack(track);
      setTimeout(() => lib.app.switchView("discover"), 80);
    } catch (error) {
      console.warn("SmallJia Music category discovery failed", error);
      if (lib.dom?.discoverStatus) lib.dom.discoverStatus.textContent = `「${category.label}」分类暂时没有可用歌曲，可以稍后再试或切换其他分类。`;
      lib.app?.showToast?.(`「${category.label}」随机暂时不可用`);
    } finally {
      lib.discoveryBusy = false;
      if (lib.dom?.discoverNext) lib.dom.discoverNext.disabled = false;
    }
  };

  const patchLibrary = lib => {
    if (!lib?.app || lib.__discoveryCategoriesPatched) return false;
    lib.__discoveryCategoriesPatched = true;
    const originalDiscoverAndPlay = lib.discoverAndPlay.bind(lib);
    lib.__discoverAndPlayWithoutCategory = originalDiscoverAndPlay;
    lib.discoverAndPlay = async () => {
      const category = selectedCategory();
      if (!category) return originalDiscoverAndPlay();
      return playFromCategory(lib, category);
    };
    injectCategoryUi(lib);
    return true;
  };

  const boot = () => {
    if (!window.location.pathname.startsWith("/music/")) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const lib = window.SmallJiaMusicLibrary;
      if (lib?.app && lib?.dom?.discoverView) {
        clearInterval(timer);
        patchLibrary(lib);
      }
      if (attempts > 120) clearInterval(timer);
    }, 100);
  };

  if (window[GLOBAL_KEY]) {
    window[BOOT_KEY]?.();
    return;
  }
  window[GLOBAL_KEY] = true;
  window[BOOT_KEY] = boot;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
})();
