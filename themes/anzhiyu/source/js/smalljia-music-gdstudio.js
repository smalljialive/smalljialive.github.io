(function () {
  "use strict";

  if (window.__smallJiaGDStudioProviderLoaded) return;
  window.__smallJiaGDStudioProviderLoaded = true;

  const API_BASE = "https://music-api.gdstudio.xyz/api.php";
  const SEARCH_SOURCES = "netease,kuwo";
  const GD_SOURCES = new Set(["netease", "kuwo", "tencent", "kugou", "migu", "joox", "tidal", "qobuz", "ytmusic", "deezer", "spotify"]);
  const FETCH_TIMEOUT = 10000;
  const FALLBACK_COVER = "/img/favicon.ico";

  const unique = values => [...new Set(values.filter(Boolean))];

  const artistText = value => {
    if (Array.isArray(value)) return value.map(item => (typeof item === "string" ? item : item?.name || "")).filter(Boolean).join(" / ") || "未知歌手";
    if (value && typeof value === "object") return value.name || value.artist || "未知歌手";
    return value || "未知歌手";
  };

  const request = async params => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const url = new URL(API_BASE);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
      });
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json, text/plain, */*" },
      });
      if (!response.ok) throw new Error(`GD-Studio HTTP ${response.status}`);
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (_) {
        return text;
      }
    } finally {
      clearTimeout(timer);
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
      if (typeof original === "string" && original.trim()) return original;
    }
    return "";
  };

  const directImage = value => typeof value === "string" && /^https?:\/\//i.test(value) ? value : "";

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

  const search = async keyword => {
    const payload = await request({
      types: "search",
      source: SEARCH_SOURCES,
      name: keyword,
      count: 20,
      pages: 1,
    });
    if (!Array.isArray(payload)) throw new Error("GD-Studio search returned invalid data");
    return payload.slice(0, 20).map(normalizeSearchSong);
  };

  const resolveAudio = async track => {
    const source = String(track?.__gdStudio?.source || track?.server || track?.source || "netease").toLowerCase();
    const id = String(track?.__gdStudio?.urlId || track?.id || "");
    if (!id || !GD_SOURCES.has(source)) return "";

    for (const br of [320000, 320]) {
      try {
        const payload = await request({ types: "url", source, id, br });
        const url = extractUrl(payload);
        if (url) return url;
      } catch (error) {
        console.warn(`SmallJia Music: GD-Studio audio ${source}/${br} failed`, error);
      }
    }
    return "";
  };

  const resolveLyric = async track => {
    const source = String(track?.__gdStudio?.source || track?.server || track?.source || "netease").toLowerCase();
    const id = String(track?.__gdStudio?.lyricId || track?.id || "");
    if (!id || !GD_SOURCES.has(source)) return "";
    try {
      return extractLyric(await request({ types: "lyric", source, id }));
    } catch (error) {
      console.warn("SmallJia Music: GD-Studio lyric failed", error);
      return "";
    }
  };

  const resolveCover = async track => {
    if (directImage(track?.cover)) return track.cover;
    const source = String(track?.__gdStudio?.source || track?.server || track?.source || "netease").toLowerCase();
    const id = String(track?.__gdStudio?.picId || track?.id || "");
    if (!id || !GD_SOURCES.has(source)) return "";
    try {
      return extractUrl(await request({ types: "pic", source, id }));
    } catch (error) {
      console.warn("SmallJia Music: GD-Studio cover failed", error);
      return "";
    }
  };

  const resolveTrack = async track => {
    const [url, lrc, cover] = await Promise.all([
      resolveAudio(track),
      resolveLyric(track),
      resolveCover(track),
    ]);
    return {
      ...track,
      url: url || track.url || "",
      lrc: lrc || track.lrc || "",
      cover: cover || track.cover || FALLBACK_COVER,
    };
  };

  const patch = app => {
    if (!app || app.__gdStudioPatched || typeof app.renderTrackList !== "function") return false;
    app.__gdStudioPatched = true;

    const originalSearch = app.search.bind(app);
    const originalSelectIndex = app.selectIndex.bind(app);
    const originalPlayTrack = app.playTrack.bind(app);
    const originalSetSourceState = app.setSourceState.bind(app);
    let selectToken = 0;

    app.setSourceState = function (state, routeLabel) {
      originalSetSourceState(state, routeLabel);
      if (state !== "ready") return;
      const text = this.dom?.sourceChip?.querySelector("span:last-child");
      if (text) text.textContent = "GD-Studio 主线路 · Meting 备用";
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
        this.searchResults = list;
        this.renderTrackList(this.dom.searchResults, list);
        this.setSourceState("ready", "GD-Studio");
        this.setSearchStatus(list.length ? `GD-Studio 找到 ${list.length} 个结果，点击即可播放` : `没有找到“${query}”`);
      } catch (error) {
        console.warn("SmallJia Music: GD-Studio search failed, falling back to Meting", error);
        if (seq !== this.searchSeq || this.destroyed) return;
        this.showToast("GD-Studio 搜索暂时不可用，已切换备用线路");
        return originalSearch(query);
      }
    };

    app.playTrack = async function (track) {
      if (!track) return;
      const source = String(track.server || track.source || "netease").toLowerCase();
      if (!track.id || !GD_SOURCES.has(source)) return originalPlayTrack(track);

      this.showToast(`GD-Studio 正在准备：${track.name}`);
      try {
        const resolved = await resolveTrack(track);
        if (!resolved.url) throw new Error("GD-Studio returned no playable URL");
        const index = this.queue.findIndex(item => item.key === resolved.key);
        if (index >= 0) Object.assign(this.queue[index], resolved);
        return originalPlayTrack(resolved);
      } catch (error) {
        console.warn("SmallJia Music: GD-Studio track resolve failed, using Meting fallback", error);
        this.showToast("GD-Studio 音源不可用，正在尝试备用线路");
        return originalPlayTrack(track);
      }
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

      let resolved = baseTrack;
      try {
        const gdResolved = await resolveTrack(baseTrack);
        if (token !== selectToken || this.destroyed) return;
        if (gdResolved.url) {
          resolved = gdResolved;
          Object.assign(this.queue[normalizedIndex], gdResolved);
          this.currentTrack = this.queue[normalizedIndex];
          this.updateCurrentUi();
          this.loadLyrics(this.currentTrack);
        }
      } catch (error) {
        console.warn("SmallJia Music: GD-Studio select resolve failed", error);
      }

      if (token !== selectToken || this.destroyed) return;
      if (!resolved.url) return originalSelectIndex(index, autoplay, restorePosition);

      const metingFallbacks = typeof this.audioUrls === "function" ? this.audioUrls(baseTrack) : [];
      this.audioCandidates = unique([resolved.url, ...metingFallbacks]);
      this.audioCandidateIndex = 0;
      this.audio.src = this.audioCandidates[0];
      this.audio.load();
      if (autoplay) {
        this.audio.play().catch(error => {
          console.warn("SmallJia Music: GD-Studio playback rejected", error);
          this.showToast("播放失败，正在尝试备用线路");
          this.handleAudioError();
        });
      }
      this.saveState(true);
    };

    const chipText = app.dom?.sourceChip?.querySelector("span:last-child");
    if (chipText) chipText.textContent = "GD-Studio 主线路 · Meting 备用";
    app.root?.setAttribute("data-music-provider", "gdstudio");
    return true;
  };

  const tryPatch = () => patch(window.SmallJiaMusic);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(tryPatch, 0), { once: true });
  } else {
    setTimeout(tryPatch, 0);
  }

  document.addEventListener("pjax:complete", () => setTimeout(tryPatch, 0));

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (tryPatch() || attempts > 80) clearInterval(timer);
  }, 100);
})();
