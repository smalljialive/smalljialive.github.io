(function () {
  "use strict";

  const VERSION = "20260910-1";
  if (window.__smallJiaMusicSourceSelectorVersion === VERSION) return;
  window.__smallJiaMusicSourceSelectorVersion = VERSION;

  const STORAGE_KEY = "smalljia_music_source_preference_v1";
  const DIRECT_API = "https://music-api.gdstudio.xyz/api.php";
  const PROXY_API = "https://smalljia-music-proxy-small-jias-projects.vercel.app/api/music";
  const SOURCE_OPTIONS = [
    { value: "auto", label: "自动选源" },
    { value: "netease", label: "网易云" },
    { value: "kuwo", label: "酷我" },
    { value: "tencent", label: "QQ音乐" },
    { value: "kugou", label: "酷狗" },
  ];
  const AUTO_ORDER = ["kuwo", "tencent", "netease", "kugou"];
  const SOURCE_LABELS = Object.fromEntries(SOURCE_OPTIONS.map(item => [item.value, item.label]));
  const FETCH_TIMEOUT = 9000;

  const normalizeText = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const artistText = value => {
    if (Array.isArray(value)) return value.map(item => typeof item === "string" ? item : item?.name || "").filter(Boolean).join(" / ") || "未知歌手";
    if (value && typeof value === "object") return value.name || value.artist || "未知歌手";
    return String(value || "未知歌手");
  };

  const getPreference = () => {
    const value = localStorage.getItem(STORAGE_KEY) || "auto";
    return SOURCE_OPTIONS.some(item => item.value === value) ? value : "auto";
  };

  const setPreference = value => {
    const next = SOURCE_OPTIONS.some(item => item.value === value) ? value : "auto";
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("smalljia:music-source-change", { detail: { source: next } }));
    return next;
  };

  const buildUrl = (base, params) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    return url.toString();
  };

  const requestAt = async (base, params) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const response = await fetch(buildUrl(base, params), {
        signal: controller.signal,
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
    catch (_) { return requestAt(PROXY_API, params); }
  };

  const listFromPayload = payload => {
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
      for (const key of ["url", "play_url", "playUrl", "data"]) {
        const value = extractUrl(payload[key]);
        if (value) return value;
      }
    }
    return "";
  };

  const normalizeTrack = (raw, source) => {
    const actualSource = String(raw?.source || source || "netease").toLowerCase();
    const id = String(raw?.id || raw?.url_id || raw?.urlId || raw?.songid || raw?.songId || "");
    const urlId = String(raw?.url_id || raw?.urlId || id);
    const lyricId = String(raw?.lyric_id || raw?.lyricId || id);
    const picId = String(raw?.pic_id || raw?.picId || id);
    const artist = artistText(raw?.artist || raw?.artists || raw?.author || raw?.singer);
    const albumValue = raw?.album;
    const album = typeof albumValue === "string" ? albumValue : albumValue?.name || raw?.albumName || "";
    const coverRaw = raw?.pic || raw?.cover || raw?.picUrl || raw?.albumPic || "";
    const cover = /^https?:\/\//i.test(coverRaw) ? String(coverRaw).replace(/^http:\/\//i, "https://") : "";
    return {
      id,
      server: actualSource,
      source: actualSource,
      name: raw?.name || raw?.title || raw?.songName || "未知歌曲",
      artist,
      album,
      cover,
      url: "",
      lrc: "",
      key: id ? `${actualSource}:${id}` : `${raw?.name || "未知歌曲"}::${artist}`.toLowerCase(),
      __gdStudio: { source: actualSource, urlId, lyricId, picId },
    };
  };

  const score = (candidate, target) => {
    const cn = normalizeText(candidate.name);
    const tn = normalizeText(target?.name);
    const ca = normalizeText(candidate.artist);
    const ta = normalizeText(target?.artist);
    let value = 0;
    if (cn === tn) value += 100;
    else if (cn.includes(tn) || tn.includes(cn)) value += 55;
    if (ca === ta) value += 50;
    else if (ca.includes(ta) || ta.includes(ca)) value += 28;
    if (target?.album && normalizeText(candidate.album) === normalizeText(target.album)) value += 12;
    return value;
  };

  const hasPlayableUrl = async track => {
    const source = track?.server || track?.source || "netease";
    const id = track?.__gdStudio?.urlId || track?.id;
    if (!id) return false;
    for (const br of [999, 740, 320, 320000, 192, 128]) {
      try {
        const payload = await requestApi({ types: "url", source, id, br });
        if (extractUrl(payload)) return true;
      } catch (_) {}
    }
    return false;
  };

  const searchOneSource = async (source, query, count) => {
    const payload = await requestApi({ types: "search", source, name: query, count: count || 20, pages: 1 });
    return listFromPayload(payload).map(raw => normalizeTrack(raw, source)).filter(track => track.id);
  };

  const candidateSources = track => {
    const pref = getPreference();
    if (pref !== "auto") return [pref];
    const current = String(track?.server || track?.source || "").toLowerCase();
    return [...new Set([current, ...AUTO_ORDER].filter(Boolean))];
  };

  const findPlayableMatch = async target => {
    const query = `${target?.name || ""} ${target?.artist || ""}`.trim();
    if (!query) return null;
    for (const source of candidateSources(target)) {
      try {
        const list = await searchOneSource(source, query, 12);
        list.sort((a, b) => score(b, target) - score(a, target));
        const best = list[0];
        if (!best || score(best, target) < 70) continue;
        if (await hasPlayableUrl(best)) return best;
      } catch (error) {
        console.warn(`SmallJia Music: source ${source} match failed`, error);
      }
    }
    return null;
  };

  const renderSourceBadge = app => {
    const pref = getPreference();
    const chip = app?.dom?.sourceChip?.querySelector("span:last-child");
    if (chip) chip.textContent = pref === "auto" ? "自动选源 · GD-Studio" : `${SOURCE_LABELS[pref]} · GD-Studio`;
  };

  const injectSelector = root => {
    const form = root?.querySelector("#sjm-search-form");
    if (!form || form.querySelector("#sjm-source-select")) return;
    const wrap = document.createElement("label");
    wrap.className = "sjm-source-select-wrap";
    wrap.title = "选择搜索与播放优先音源";
    wrap.innerHTML = `<span class="sjm-source-select-icon">♫</span><select id="sjm-source-select" aria-label="选择音乐源">${SOURCE_OPTIONS.map(item => `<option value="${item.value}">${item.label}</option>`).join("")}</select><span class="sjm-source-select-arrow">⌄</span>`;
    const icon = form.querySelector(".sjm-search-icon");
    form.insertBefore(wrap, icon || form.firstChild);
    const select = wrap.querySelector("select");
    select.value = getPreference();
    select.addEventListener("change", () => {
      const source = setPreference(select.value);
      const app = window.SmallJiaMusic;
      renderSourceBadge(app);
      app?.showToast?.(source === "auto" ? "已切换为自动选源" : `已切换到${SOURCE_LABELS[source]}`);
    });
  };

  const patch = app => {
    if (!app || app.__sourceSelectorPatched || typeof app.playTrack !== "function") return false;
    app.__sourceSelectorPatched = true;
    injectSelector(app.root);
    renderSourceBadge(app);

    const originalSearch = app.search.bind(app);
    const originalPlayTrack = app.playTrack.bind(app);
    const originalSelectIndex = app.selectIndex.bind(app);

    app.search = async function (rawQuery) {
      const query = String(rawQuery || "").trim();
      const pref = getPreference();
      if (!query) return this.setSearchStatus?.("请输入歌曲名或歌手名");
      if (pref === "auto") return originalSearch(rawQuery);

      const seq = ++this.searchSeq;
      this.switchView("search");
      this.setSearchStatus?.(`正在通过${SOURCE_LABELS[pref]}搜索“${query}”…`);
      this.renderTrackList(this.dom.searchResults, []);
      try {
        const list = await searchOneSource(pref, query, 30);
        if (seq !== this.searchSeq || this.destroyed) return;
        this.searchResults = list;
        this.renderTrackList(this.dom.searchResults, list);
        this.setSearchStatus?.(list.length ? `找到 ${list.length} 个${SOURCE_LABELS[pref]}结果，点击即可播放` : `${SOURCE_LABELS[pref]}没有找到“${query}”`);
        renderSourceBadge(this);
      } catch (error) {
        if (seq !== this.searchSeq || this.destroyed) return;
        console.warn("SmallJia Music: selected source search failed", error);
        this.searchResults = [];
        this.renderTrackList(this.dom.searchResults, []);
        this.setSearchStatus?.(`${SOURCE_LABELS[pref]}当前不可用，请切换其他源或自动选源`);
        this.showToast?.(`${SOURCE_LABELS[pref]}搜索暂时不可用`);
      }
    };

    app.playTrack = async function (track) {
      if (!track) return;
      const pref = getPreference();
      const currentSource = String(track.server || track.source || "").toLowerCase();
      const forceRematch = pref !== "auto" && currentSource !== pref;
      if (forceRematch || !track.id) {
        this.showToast?.(`正在${pref === "auto" ? "自动选源" : `尝试${SOURCE_LABELS[pref]}`}：${track.name}`);
        const match = await findPlayableMatch(track);
        if (match) {
          match.name = track.name || match.name;
          match.artist = track.artist || match.artist;
          match.album = track.album || match.album;
          return originalPlayTrack(match);
        }
        this.showToast?.(pref === "auto" ? "多个音源都没有找到可播放版本" : `${SOURCE_LABELS[pref]}没有找到可播放版本`);
        return;
      }
      return originalPlayTrack(track);
    };

    app.selectIndex = async function (index, autoplay = true, restorePosition = false) {
      if (!this.queue?.length) return originalSelectIndex(index, autoplay, restorePosition);
      const normalizedIndex = ((index % this.queue.length) + this.queue.length) % this.queue.length;
      const track = this.queue[normalizedIndex];
      const pref = getPreference();
      const currentSource = String(track?.server || track?.source || "").toLowerCase();
      const needsMatch = !track?.id || (pref !== "auto" && currentSource !== pref);
      if (needsMatch) {
        this.showToast?.(`正在${pref === "auto" ? "自动选源" : `尝试${SOURCE_LABELS[pref]}`}：${track?.name || "歌曲"}`);
        const match = await findPlayableMatch(track);
        if (!match) {
          this.showToast?.(pref === "auto" ? "多个音源都没有找到可播放版本" : `${SOURCE_LABELS[pref]}没有找到可播放版本`);
          return;
        }
        Object.assign(track, match, {
          name: track.name || match.name,
          artist: track.artist || match.artist,
          album: track.album || match.album,
        });
      }
      return originalSelectIndex(normalizedIndex, autoplay, restorePosition);
    };

    window.SmallJiaMusicSource = {
      get: getPreference,
      set: value => {
        const next = setPreference(value);
        const select = app.root?.querySelector("#sjm-source-select");
        if (select) select.value = next;
        renderSourceBadge(app);
        return next;
      },
      options: SOURCE_OPTIONS.slice(),
      labels: { ...SOURCE_LABELS },
      findPlayableMatch,
    };
    return true;
  };

  const boot = () => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const app = window.SmallJiaMusic;
      if (patch(app) || attempts > 120) clearInterval(timer);
    }, 100);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
})();
