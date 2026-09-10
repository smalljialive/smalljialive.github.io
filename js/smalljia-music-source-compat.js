(function () {
  "use strict";

  const VERSION = "20260910-1";
  if (window.__smallJiaMusicSourceCompatVersion === VERSION) return;
  window.__smallJiaMusicSourceCompatVersion = VERSION;

  const PROXY_API = "https://smalljia-music-proxy-small-jias-projects.vercel.app/api/music";
  const MEDIA_PROXY = "https://music-proxy.gdstudio.org/";
  const SOURCE_LABELS = { auto: "自动选源", netease: "网易云", kuwo: "酷我", tencent: "QQ音乐" };
  const AUTO_ORDER = ["kuwo", "tencent", "netease"];
  const FETCH_TIMEOUT = 10000;

  const normalize = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const artistText = value => {
    if (Array.isArray(value)) return value.map(item => typeof item === "string" ? item : item?.name || "").filter(Boolean).join(" / ") || "未知歌手";
    if (value && typeof value === "object") return value.name || value.artist || "未知歌手";
    return String(value || "未知歌手");
  };

  const buildUrl = (base, params) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    return url.toString();
  };

  const requestProxy = async params => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const response = await fetch(buildUrl(PROXY_API, params), {
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json, text/plain, */*" },
      });
      if (!response.ok) throw new Error(`GD signed proxy HTTP ${response.status}`);
      const text = await response.text();
      try { return JSON.parse(text); } catch (_) { return text; }
    } finally {
      clearTimeout(timer);
    }
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
      return /^https?:\/\//i.test(value) ? value : "";
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
    return {
      id,
      server: actualSource,
      source: actualSource,
      name: raw?.name || raw?.title || raw?.songName || "未知歌曲",
      artist,
      album,
      cover: /^https?:\/\//i.test(coverRaw) ? String(coverRaw) : "",
      url: "",
      lrc: "",
      key: id ? `${actualSource}:${id}` : `${raw?.name || "未知歌曲"}::${artist}`.toLowerCase(),
      __gdStudio: { source: actualSource, urlId, lyricId, picId },
    };
  };

  const score = (candidate, target) => {
    const cn = normalize(candidate.name);
    const tn = normalize(target?.name);
    const ca = normalize(candidate.artist);
    const ta = normalize(target?.artist);
    let value = 0;
    if (cn === tn) value += 100;
    else if (cn.includes(tn) || tn.includes(cn)) value += 55;
    if (ca === ta) value += 50;
    else if (ca.includes(ta) || ta.includes(ca)) value += 28;
    if (target?.album && normalize(candidate.album) === normalize(target.album)) value += 12;
    return value;
  };

  const searchTencent = async (query, count = 30) => {
    const payload = await requestProxy({ types: "search", source: "tencent", name: query, count, pages: 1 });
    return listFromPayload(payload).map(raw => normalizeTrack(raw, "tencent")).filter(track => track.id);
  };

  const hasTencentUrl = async track => {
    const id = track?.__gdStudio?.urlId || track?.id;
    if (!id) return false;
    for (const br of [999, 740, 320, 192, 128]) {
      try {
        const payload = await requestProxy({ types: "url", source: "tencent", id, br });
        if (extractUrl(payload)) return true;
      } catch (_) {}
    }
    return false;
  };

  const findTencentMatch = async target => {
    const query = `${target?.name || ""} ${target?.artist || ""}`.trim();
    if (!query) return null;
    const list = await searchTencent(query, 12);
    list.sort((a, b) => score(b, target) - score(a, target));
    for (const candidate of list.slice(0, 4)) {
      if (score(candidate, target) < 70) continue;
      if (await hasTencentUrl(candidate)) return candidate;
    }
    return null;
  };

  const mediaProxyUrl = url => {
    if (!/^https?:\/\//i.test(String(url || ""))) return "";
    return `${MEDIA_PROXY}${url}`;
  };

  const enhanceMediaFallback = (app, autoplay) => {
    const track = app?.currentTrack;
    const source = String(track?.server || track?.source || "").toLowerCase();
    if (!app?.audio || !["kuwo", "tencent"].includes(source)) return;
    const current = app.audio.currentSrc || app.audio.src || track?.url || "";
    if (!/^https?:\/\//i.test(current)) return;
    const fallback = mediaProxyUrl(current);
    if (!fallback) return;

    const candidates = Array.isArray(app.audioCandidates) ? app.audioCandidates.slice() : [];
    if (current.startsWith("http://")) {
      app.audioCandidates = [fallback];
      app.audioCandidateIndex = 0;
      app.audio.src = fallback;
      app.audio.load();
      if (autoplay) app.audio.play().catch(() => app.showToast?.(`${SOURCE_LABELS[source]}播放代理暂时不可用`));
      return;
    }

    if (!candidates.includes(fallback)) candidates.push(fallback);
    app.audioCandidates = candidates.length ? candidates : [current, fallback];
  };

  const removeKugouUi = root => {
    try {
      if (localStorage.getItem("smalljia_music_source_preference_v1") === "kugou") {
        localStorage.setItem("smalljia_music_source_preference_v1", "auto");
      }
    } catch (_) {}
    root?.querySelector('#sjm-source-select option[value="kugou"]')?.remove();
    root?.querySelector('.sjm-source-option[data-source="kugou"]')?.remove();
  };

  const patch = app => {
    const sourceApi = window.SmallJiaMusicSource;
    if (!app || !sourceApi || app.__currentGdCompatPatched) return false;
    app.__currentGdCompatPatched = true;
    removeKugouUi(app.root);

    if (Array.isArray(sourceApi.options)) {
      sourceApi.options = sourceApi.options.filter(item => item.value !== "kugou");
    }
    if (sourceApi.labels) delete sourceApi.labels.kugou;

    const previousFind = sourceApi.findPlayableMatch?.bind(sourceApi);
    sourceApi.findPlayableMatch = async target => {
      const pref = sourceApi.get?.() || "auto";
      if (pref === "tencent") return findTencentMatch(target);
      if (pref !== "auto") return previousFind ? previousFind(target) : null;

      if (previousFind) {
        const old = await previousFind(target);
        if (old && String(old.server || old.source || "") !== "kugou") return old;
      }
      try { return await findTencentMatch(target); } catch (_) { return null; }
    };

    const previousSearch = app.search.bind(app);
    app.search = async function (rawQuery) {
      const pref = sourceApi.get?.() || "auto";
      if (pref !== "tencent") return previousSearch(rawQuery);
      const query = String(rawQuery || "").trim();
      if (!query) return this.setSearchStatus?.("请输入歌曲名或歌手名");
      const seq = ++this.searchSeq;
      this.switchView("search");
      this.setSearchStatus?.(`正在通过 QQ音乐搜索“${query}”…`);
      this.renderTrackList(this.dom.searchResults, []);
      try {
        const list = await searchTencent(query, 30);
        if (seq !== this.searchSeq || this.destroyed) return;
        this.searchResults = list;
        this.renderTrackList(this.dom.searchResults, list);
        this.setSearchStatus?.(list.length ? `找到 ${list.length} 个 QQ音乐结果，点击即可播放` : `QQ音乐没有找到“${query}”`);
      } catch (error) {
        console.warn("SmallJia Music: current Tencent source failed", error);
        if (seq !== this.searchSeq || this.destroyed) return;
        this.searchResults = [];
        this.renderTrackList(this.dom.searchResults, []);
        this.setSearchStatus?.("QQ音乐新版接口暂时不可用，请切换自动、酷我或网易云");
        this.showToast?.("QQ音乐源暂时不可用");
      }
    };

    const previousSelectIndex = app.selectIndex.bind(app);
    app.selectIndex = async function (index, autoplay = true, restorePosition = false) {
      const result = await previousSelectIndex(index, autoplay, restorePosition);
      enhanceMediaFallback(this, autoplay);
      return result;
    };

    window.addEventListener("smalljia:music-source-change", () => setTimeout(() => removeKugouUi(app.root), 0));
    return true;
  };

  const boot = () => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const app = window.SmallJiaMusic;
      if (patch(app) || attempts > 150) clearInterval(timer);
      if (app?.root) removeKugouUi(app.root);
    }, 100);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
})();
