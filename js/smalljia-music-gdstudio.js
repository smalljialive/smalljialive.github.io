(function () {
  "use strict";

  if (window.__smallJiaGDStudioProviderLoaded) return;
  window.__smallJiaGDStudioProviderLoaded = true;

  const DIRECT_API = "https://music-api.gdstudio.xyz/api.php";
  const PROXY_API = "https://smalljia-music-proxy-small-jias-projects.vercel.app/api/music";
  const SEARCH_SOURCES = ["netease", "kuwo"];
  const GD_SOURCES = new Set(["netease", "kuwo", "tencent", "kugou", "migu", "joox", "tidal", "qobuz", "ytmusic", "deezer", "spotify"]);
  const FETCH_TIMEOUT = 10000;
  const COVER_CONCURRENCY = 6;
  const FALLBACK_COVER = "/img/favicon.ico";

  const artistText = value => {
    if (Array.isArray(value)) return value.map(item => (typeof item === "string" ? item : item?.name || "")).filter(Boolean).join(" / ") || "未知歌手";
    if (value && typeof value === "object") return value.name || value.artist || "未知歌手";
    return value || "未知歌手";
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
      if (!response.ok) throw new Error(`${base === DIRECT_API ? "GD direct" : "GD proxy"} HTTP ${response.status}`);
      const text = await response.text();
      try { return JSON.parse(text); } catch (_) { return text; }
    } finally {
      clearTimeout(timer);
    }
  };

  const requestGD = async params => {
    let directError = null;
    try {
      return { payload: await requestAt(DIRECT_API, params), route: "direct" };
    } catch (error) {
      directError = error;
      console.warn("SmallJia Music: GD-Studio direct request failed, trying proxy", error);
    }
    try {
      return { payload: await requestAt(PROXY_API, params), route: "proxy" };
    } catch (proxyError) {
      const error = new Error(`GD-Studio direct and proxy unavailable: ${proxyError?.message || proxyError}`);
      error.cause = directError;
      throw error;
    }
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
        if (payload[key] !== undefined) {
          const value = extractUrl(payload[key]);
          if (value) return value;
        }
      }
    }
    return "";
  };

  const extractLyric = payload => {
    if (!payload) return "";
    if (typeof payload === "string") return payload;
    if (Array.isArray(payload)) {
      for (const item of payload) {
        const value = extractLyric(item);
        if (value) return value;
      }
      return "";
    }
    if (typeof payload === "object") {
      const original = payload.lyric || payload.lrc || payload.data?.lyric || payload.data?.lrc || "";
      return typeof original === "string" ? original : "";
    }
    return "";
  };

  const normalizeMediaUrl = value => {
    if (typeof value !== "string") return "";
    const url = value.trim();
    if (!/^https?:\/\//i.test(url)) return "";
    return url.replace(/^http:\/\//i, "https://");
  };

  const directImage = value => normalizeMediaUrl(value);

  const normalizeSearchSong = (song, index) => {
    const source = String(song.source || "netease").toLowerCase();
    const id = String(song.id || song.url_id || song.urlId || "");
    const urlId = String(song.url_id || song.urlId || id);
    const lyricId = String(song.lyric_id || song.lyricId || id);
    const picId = String(song.pic_id || song.picId || id);
    const artist = artistText(song.artist || song.artists || song.author || song.singer);
    const albumValue = song.album;
    const album = typeof albumValue === "string" ? albumValue : albumValue?.name || song.albumName || "";
    const cover = directImage(song.pic || song.cover || song.picUrl || song.albumPic || "");
    return {
      id,
      server: source,
      source,
      name: song.name || song.title || "未知歌曲",
      artist,
      album,
      cover,
      url: "",
      lrc: "",
      key: id ? `${source}:${id}` : `${song.name || "未知歌曲"}::${artist}`.toLowerCase(),
      index,
      __gdStudio: { source, urlId, lyricId, picId },
    };
  };

  const normalizeSearchPayload = payload => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
  };

  const dedupeTracks = tracks => {
    const seen = new Set();
    return tracks.filter(track => {
      if (seen.has(track.key)) return false;
      seen.add(track.key);
      return true;
    }).map((track, index) => ({ ...track, index }));
  };

  const search = async keyword => {
    try {
      const aggregate = await requestAt(DIRECT_API, {
        types: "search",
        source: "netease,kuwo",
        name: keyword,
        count: 30,
        pages: 1,
      });
      const list = normalizeSearchPayload(aggregate);
      if (list.length) return dedupeTracks(list.slice(0, 30).map(normalizeSearchSong));
    } catch (error) {
      console.warn("SmallJia Music: GD aggregate search failed", error);
    }

    const settled = await Promise.allSettled(
      SEARCH_SOURCES.map(async source => {
        const { payload } = await requestGD({ types: "search", source, name: keyword, count: 15, pages: 1 });
        return normalizeSearchPayload(payload).map((song, index) => normalizeSearchSong({ ...song, source: song.source || source }, index));
      })
    );

    const merged = settled.flatMap(item => item.status === "fulfilled" ? item.value : []);
    if (!merged.length && settled.every(item => item.status === "rejected")) throw new Error("GD-Studio search unavailable");
    return dedupeTracks(merged).slice(0, 30);
  };

  const resolveAudio = async track => {
    const source = String(track?.__gdStudio?.source || track?.server || track?.source || "netease").toLowerCase();
    const id = String(track?.__gdStudio?.urlId || track?.id || "");
    if (!id || !GD_SOURCES.has(source)) return "";

    for (const br of [999, 740, 320, 320000, 192, 128]) {
      try {
        const { payload } = await requestGD({ types: "url", source, id, br });
        const url = extractUrl(payload);
        if (url) return url;
      } catch (error) {
        console.warn(`SmallJia Music: GD audio ${source}/${br} failed`, error);
      }
    }
    return "";
  };

  const resolveLyric = async track => {
    const source = String(track?.__gdStudio?.source || track?.server || track?.source || "netease").toLowerCase();
    const id = String(track?.__gdStudio?.lyricId || track?.id || "");
    if (!id || !GD_SOURCES.has(source)) return "";
    try {
      const { payload } = await requestGD({ types: "lyric", source, id });
      return extractLyric(payload);
    } catch (_) {
      return "";
    }
  };

  const resolveCover = async track => {
    if (directImage(track?.cover)) return directImage(track.cover);
    const source = String(track?.__gdStudio?.source || track?.server || track?.source || "netease").toLowerCase();
    const id = String(track?.__gdStudio?.picId || track?.id || "");
    if (!id || !GD_SOURCES.has(source)) return "";
    try {
      const { payload } = await requestGD({ types: "pic", source, id, size: 500 });
      return normalizeMediaUrl(extractUrl(payload));
    } catch (_) {
      return "";
    }
  };

  const hydrateSearchCovers = async tracks => {
    const pending = tracks.filter(track => !directImage(track.cover) && track?.__gdStudio?.picId);
    if (!pending.length) return tracks;
    let cursor = 0;
    const worker = async () => {
      while (cursor < pending.length) {
        const track = pending[cursor++];
        try {
          const cover = await resolveCover(track);
          if (cover) track.cover = cover;
        } catch (_) {}
      }
    };
    const workers = Array.from({ length: Math.min(COVER_CONCURRENCY, pending.length) }, () => worker());
    await Promise.all(workers);
    return tracks;
  };

  const resolveTrack = async track => {
    const [url, lrc, cover] = await Promise.all([resolveAudio(track), resolveLyric(track), resolveCover(track)]);
    return { ...track, url, lrc: lrc || track.lrc || "", cover: cover || track.cover || FALLBACK_COVER };
  };

  const patch = app => {
    if (!app || app.__gdStudioPatched || typeof app.renderTrackList !== "function") return false;
    app.__gdStudioPatched = true;

    const originalSelectIndex = app.selectIndex.bind(app);
    const originalPlayTrack = app.playTrack.bind(app);
    const originalSetSourceState = app.setSourceState.bind(app);
    let selectToken = 0;

    app.setSourceState = function (state, routeLabel) {
      originalSetSourceState(state, routeLabel);
      if (state !== "ready") return;
      const text = this.dom?.sourceChip?.querySelector("span:last-child");
      if (text) text.textContent = "GD-Studio 直连 · 代理备用";
    };

    app.search = async function (rawQuery) {
      const query = String(rawQuery || "").trim();
      if (!query) return this.setSearchStatus("请输入歌曲名或歌手名");
      const seq = ++this.searchSeq;
      this.switchView("search");
      this.setSearchStatus(`正在通过 GD-Studio 搜索“${query}”…`);
      this.renderTrackList(this.dom.searchResults, []);
      try {
        const list = await search(query);
        if (seq !== this.searchSeq || this.destroyed) return;
        this.setSearchStatus(list.length ? `找到 ${list.length} 个结果，正在加载真实歌曲封面…` : `GD-Studio 没有找到“${query}”`);
        if (list.length) await hydrateSearchCovers(list);
        if (seq !== this.searchSeq || this.destroyed) return;
        this.searchResults = list;
        this.renderTrackList(this.dom.searchResults, list);
        this.setSourceState("ready", "GD-Studio");
        this.setSearchStatus(list.length ? `找到 ${list.length} 个 GD-Studio 结果，点击即可播放` : `GD-Studio 没有找到“${query}”`);
      } catch (error) {
        console.warn("SmallJia Music: GD-Studio search failed", error);
        if (seq !== this.searchSeq || this.destroyed) return;
        this.searchResults = [];
        this.renderTrackList(this.dom.searchResults, []);
        this.setSearchStatus("GD-Studio 当前不可用，请稍后再试");
        this.showToast("GD-Studio 直连和备用代理均不可用");
      }
    };

    app.playTrack = async function (track) {
      if (!track) return;
      const source = String(track.server || track.source || "netease").toLowerCase();
      if (!track.id || !GD_SOURCES.has(source)) {
        this.switchView("home");
        return originalPlayTrack(track);
      }
      this.showToast(`正在准备：${track.name}`);
      const resolved = await resolveTrack(track);
      if (!resolved.url) {
        this.showToast("GD-Studio 没有返回可播放音源");
        return;
      }
      const index = this.queue.findIndex(item => item.key === resolved.key);
      if (index >= 0) Object.assign(this.queue[index], resolved);
      this.switchView("home");
      return originalPlayTrack(resolved);
    };

    app.selectIndex = async function (index, autoplay = true, restorePosition = false) {
      if (!this.queue?.length) return;
      const token = ++selectToken;
      const normalizedIndex = ((index % this.queue.length) + this.queue.length) % this.queue.length;
      const baseTrack = this.queue[normalizedIndex];
      const source = String(baseTrack?.server || baseTrack?.source || "netease").toLowerCase();
      if (!baseTrack?.id || !GD_SOURCES.has(source)) return originalSelectIndex(index, autoplay, restorePosition);

      this.currentIndex = normalizedIndex;
      this.currentTrack = baseTrack;
      this.restorePositionPending = restorePosition;
      this.updateCurrentUi();

      const resolved = await resolveTrack(baseTrack);
      if (token !== selectToken || this.destroyed) return;
      if (!resolved.url) {
        this.showToast("GD-Studio 没有返回可播放音源");
        return;
      }

      Object.assign(this.queue[normalizedIndex], resolved);
      this.currentTrack = this.queue[normalizedIndex];
      this.updateCurrentUi();
      this.loadLyrics(this.currentTrack);
      this.audioCandidates = [resolved.url];
      this.audioCandidateIndex = 0;
      this.audio.src = resolved.url;
      this.audio.load();
      if (autoplay) this.audio.play().catch(() => this.showToast("当前 GD-Studio 音源播放失败"));
      this.saveState(true);
    };

    const chipText = app.dom?.sourceChip?.querySelector("span:last-child");
    if (chipText) chipText.textContent = "GD-Studio 直连 · 代理备用";
    app.root?.setAttribute("data-music-provider", "gdstudio-direct");
    return true;
  };

  const tryPatch = () => patch(window.SmallJiaMusic);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(tryPatch, 0), { once: true });
  else setTimeout(tryPatch, 0);
  document.addEventListener("pjax:complete", () => setTimeout(tryPatch, 0));
  let attempts = 0;
  const timer = setInterval(() => { attempts += 1; if (tryPatch() || attempts > 80) clearInterval(timer); }, 100);
})();
