(function () {
  "use strict";

  if (window.__smallJiaNativeMusicLoaded) return;
  window.__smallJiaNativeMusicLoaded = true;

  const STORAGE = {
    favorites: "smalljia_music_favorites_v3",
    recent: "smalljia_music_recent_v3",
    state: "smalljia_music_player_state_v3",
  };
  const RECENT_LIMIT = 50;
  const SEARCH_LIMIT = 20;
  const FALLBACK_COVER = "/img/favicon.ico";
  const DEFAULT_API = "https://meting-api-omega.vercel.app/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
  const FALLBACK_API = "https://meting.mikus.ink/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";

  let activeApp = null;

  const readStorage = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("SmallJia Music: storage read failed", error);
      return fallback;
    }
  };

  const writeStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("SmallJia Music: storage write failed", error);
    }
  };

  const artistText = value => {
    if (Array.isArray(value)) {
      return value
        .map(item => (typeof item === "string" ? item : item?.name || item?.artist || ""))
        .filter(Boolean)
        .join(" / ") || "未知歌手";
    }
    if (value && typeof value === "object") return value.name || value.artist || "未知歌手";
    return value || "未知歌手";
  };

  const normalizeList = payload => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload.result)) return payload.result;
    if (payload.result && Array.isArray(payload.result.songs)) return payload.result.songs;
    if (Array.isArray(payload.songs)) return payload.songs;
    return [];
  };

  const normalizeTrack = (raw = {}, index = -1, fallbackServer = "netease") => {
    const server = String(raw.smalljiaServer || raw.server || raw.source || fallbackServer || "netease").toLowerCase();
    const id = String(raw.smalljiaId || raw.id || raw.songid || raw.songId || raw.url_id || raw.urlId || "");
    const name = raw.name || raw.title || raw.songName || "未知歌曲";
    const artist = artistText(raw.artist || raw.author || raw.artists || raw.singer);
    const albumValue = raw.album;
    const album = typeof albumValue === "string" ? albumValue : albumValue?.name || raw.albumName || "";
    const cover = raw.cover || raw.pic || raw.picUrl || raw.albumPic || raw.img || "";
    const url = raw.url || raw.src || "";
    const lrc = raw.lrc || raw.lyric || raw.lyrics || "";
    const key = id ? `${server}:${id}` : `${name}::${artist}`.toLowerCase();
    return { id, server, name, artist, album, cover, url, lrc, key, index };
  };

  const serializeTrack = track => ({
    id: track.id || "",
    server: track.server || "netease",
    name: track.name || "未知歌曲",
    artist: track.artist || "未知歌手",
    album: track.album || "",
    cover: track.cover || "",
    url: track.url || "",
    lrc: track.lrc || "",
    key: track.key || `${track.name}::${track.artist}`.toLowerCase(),
  });

  const formatTime = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const parseLrc = text => {
    if (!text || typeof text !== "string") return [];
    const rows = [];
    const timeReg = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g;
    text.split(/\r?\n/).forEach(line => {
      const content = line.replace(timeReg, "").trim();
      let match;
      timeReg.lastIndex = 0;
      while ((match = timeReg.exec(line)) !== null) {
        const time = Number(match[1]) * 60 + Number(match[2]);
        if (Number.isFinite(time) && content) rows.push({ time, text: content });
      }
    });
    return rows.sort((a, b) => a.time - b.time);
  };

  const unique = values => [...new Set(values.filter(Boolean))];

  const apiTemplates = () => {
    const configured = typeof window.meting_api === "string" ? window.meting_api : "";
    return unique([configured, DEFAULT_API, FALLBACK_API]);
  };

  const apiUrl = (template, server, type, id) => {
    const nonce = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    return template
      .replace(":server", encodeURIComponent(server || "netease"))
      .replace(":type", encodeURIComponent(type))
      .replace(":id", encodeURIComponent(id || ""))
      .replace(":auth", "")
      .replace(":r", nonce);
  };

  const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal, credentials: "omit", cache: "no-store" });
    } finally {
      clearTimeout(timer);
    }
  };

  class SmallJiaNativeMusic {
    constructor(root) {
      this.root = root;
      this.server = String(root.dataset.musicServer || "netease").toLowerCase();
      this.playlistId = String(root.dataset.musicId || "");
      this.configuredVolume = Number(root.dataset.musicVolume);
      this.audio = new Audio();
      this.audio.preload = "metadata";
      this.queue = [];
      this.searchResults = [];
      this.currentIndex = -1;
      this.currentTrack = null;
      this.lyrics = [];
      this.currentLyricIndex = -1;
      this.lyricToken = 0;
      this.audioCandidateIndex = 0;
      this.audioCandidates = [];
      this.destroyed = false;
      this.searchTimer = null;
      this.searchSeq = 0;
      this.toastTimer = null;
      this.lastStateSave = 0;
      this.restorePositionPending = true;
      this.favorites = readStorage(STORAGE.favorites, []);
      this.recent = readStorage(STORAGE.recent, []);
      this.state = readStorage(STORAGE.state, {});
      this.loopMode = this.state.loopMode === "one" ? "one" : "list";
      this.dom = {};
    }

    async init() {
      this.cacheDom();
      this.bindUi();
      this.bindAudio();
      this.restoreVolume();
      this.renderFavorites();
      this.renderRecent();
      this.setSearchStatus("输入歌曲名或歌手开始搜索");
      this.setSourceState("loading");

      try {
        const result = await this.requestList("playlist", this.playlistId);
        if (this.destroyed) return;
        this.queue = result.list.slice(0, 300).map((raw, index) => normalizeTrack(raw, index, this.server));
        this.setSourceState("ready", result.label);
        this.restoreInitialTrack();
        this.renderQueue();
      } catch (error) {
        console.error("SmallJia Music: default playlist failed", error);
        this.setSourceState("error");
        this.setNowPlaceholder("歌单加载失败", "仍可尝试在线搜索");
        this.renderQueue();
        this.showToast("默认歌单加载失败，可尝试在线搜索");
      }
    }

    cacheDom() {
      const byId = id => this.root.querySelector(`#${id}`) || document.getElementById(id);
      this.dom = {
        navItems: [...this.root.querySelectorAll("[data-sjm-view-target]")],
        views: [...this.root.querySelectorAll("[data-sjm-view]")],
        searchForm: byId("sjm-search-form"),
        searchInput: byId("sjm-search-input"),
        searchStatus: byId("sjm-search-status"),
        searchResults: byId("sjm-search-results"),
        homeList: byId("sjm-home-list"),
        favoriteList: byId("sjm-favorite-list"),
        recentList: byId("sjm-recent-list"),
        queueList: byId("sjm-queue-list"),
        favoriteCount: byId("sjm-favorite-count"),
        recentCount: byId("sjm-recent-count"),
        queueCount: byId("sjm-queue-count"),
        nowCover: byId("sjm-now-cover"),
        nowTitle: byId("sjm-now-title"),
        nowArtist: byId("sjm-now-artist"),
        nowAlbum: byId("sjm-now-album"),
        currentFavorite: byId("sjm-current-favorite"),
        queueShortcut: byId("sjm-queue-shortcut"),
        lyrics: byId("sjm-lyrics"),
        musicBg: byId("sjm-music-bg"),
        barCover: byId("sjm-bar-cover"),
        barTitle: byId("sjm-bar-title"),
        barArtist: byId("sjm-bar-artist"),
        play: byId("sjm-play"),
        prev: byId("sjm-prev"),
        next: byId("sjm-next"),
        shuffle: byId("sjm-shuffle"),
        loop: byId("sjm-loop"),
        progress: byId("sjm-progress"),
        currentTime: byId("sjm-current-time"),
        duration: byId("sjm-duration"),
        volume: byId("sjm-volume"),
        toast: byId("sjm-toast"),
        sourceChip: this.root.querySelector(".sjm-source-chip"),
      };
    }

    bindUi() {
      this.dom.navItems.forEach(button => {
        button.addEventListener("click", () => this.switchView(button.dataset.sjmViewTarget));
      });

      this.dom.searchForm?.addEventListener("submit", event => {
        event.preventDefault();
        this.search(this.dom.searchInput?.value || "");
      });

      this.dom.searchInput?.addEventListener("input", () => {
        clearTimeout(this.searchTimer);
        const query = this.dom.searchInput.value.trim();
        if (!query) {
          this.searchResults = [];
          this.setSearchStatus("输入歌曲名或歌手开始搜索");
          this.renderTrackList(this.dom.searchResults, []);
          return;
        }
        if (query.length < 2) return;
        this.searchTimer = setTimeout(() => this.search(query), 500);
      });

      this.dom.queueShortcut?.addEventListener("click", () => this.switchView("queue"));
      this.dom.currentFavorite?.addEventListener("click", () => {
        if (this.currentTrack) this.toggleFavorite(this.currentTrack);
      });
      this.dom.play?.addEventListener("click", () => this.togglePlay());
      this.dom.prev?.addEventListener("click", () => this.previous());
      this.dom.next?.addEventListener("click", () => this.next());
      this.dom.shuffle?.addEventListener("click", () => this.random());
      this.dom.loop?.addEventListener("click", () => this.toggleLoop());

      this.dom.progress?.addEventListener("input", () => {
        if (!Number.isFinite(this.audio.duration) || this.audio.duration <= 0) return;
        this.audio.currentTime = this.audio.duration * (Number(this.dom.progress.value) / 100);
      });

      this.dom.volume?.addEventListener("input", () => {
        this.audio.volume = Math.max(0, Math.min(1, Number(this.dom.volume.value) / 100));
        this.saveState(true);
      });
    }

    bindAudio() {
      this.audio.addEventListener("play", () => {
        this.updatePlayButton(true);
        this.addRecent(this.currentTrack);
      });
      this.audio.addEventListener("pause", () => this.updatePlayButton(false));
      this.audio.addEventListener("timeupdate", () => {
        this.updateProgress();
        this.updateLyric();
        this.saveState(false);
      });
      this.audio.addEventListener("loadedmetadata", () => {
        this.updateProgress();
        this.restoreSavedPosition();
      });
      this.audio.addEventListener("durationchange", () => this.updateProgress());
      this.audio.addEventListener("ended", () => {
        if (this.loopMode === "one") {
          this.audio.currentTime = 0;
          this.audio.play().catch(() => {});
        } else {
          this.next(true);
        }
      });
      this.audio.addEventListener("error", () => this.handleAudioError());
    }

    restoreVolume() {
      const fallback = Number.isFinite(this.configuredVolume) ? this.configuredVolume : 0.5;
      const stored = Number(this.state.volume);
      const volume = Number.isFinite(stored) ? stored : fallback;
      this.audio.volume = Math.max(0, Math.min(1, volume));
      if (this.dom.volume) this.dom.volume.value = String(Math.round(this.audio.volume * 100));
      this.updateLoopButton();
    }

    async requestList(type, id) {
      let lastError = null;
      const templates = apiTemplates();
      for (let i = 0; i < templates.length; i += 1) {
        const template = templates[i];
        try {
          const url = apiUrl(template, this.server, type, id);
          const response = await fetchWithTimeout(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const payload = await response.json();
          const list = normalizeList(payload);
          if (!list.length) throw new Error("empty response");
          return { list, template, label: i === 0 ? "主线路" : "备用线路" };
        } catch (error) {
          lastError = error;
          console.warn(`SmallJia Music: ${type} API failed, trying fallback`, error);
        }
      }
      throw lastError || new Error("music API unavailable");
    }

    audioUrls(track) {
      const direct = track?.url && /^https?:/i.test(track.url) ? track.url : "";
      const generated = track?.id
        ? apiTemplates().map(template => apiUrl(template, track.server || this.server, "url", track.id))
        : [];
      return unique([direct, ...generated]);
    }

    lyricUrls(track) {
      const direct = track?.lrc && /^https?:/i.test(track.lrc) ? track.lrc : "";
      const generated = track?.id
        ? apiTemplates().map(template => apiUrl(template, track.server || this.server, "lrc", track.id))
        : [];
      return unique([direct, ...generated]);
    }

    restoreInitialTrack() {
      if (!this.queue.length) {
        this.setNowPlaceholder("歌单为空", "可以使用在线搜索");
        return;
      }
      const savedKey = this.state.currentKey;
      let index = savedKey ? this.queue.findIndex(track => track.key === savedKey) : -1;
      if (index < 0) index = 0;
      this.selectIndex(index, false, true);
    }

    selectIndex(index, autoplay = true, restorePosition = false) {
      if (!this.queue.length) return;
      const normalizedIndex = ((index % this.queue.length) + this.queue.length) % this.queue.length;
      const track = this.queue[normalizedIndex];
      this.currentIndex = normalizedIndex;
      this.currentTrack = track;
      this.restorePositionPending = restorePosition;
      this.audioCandidates = this.audioUrls(track);
      this.audioCandidateIndex = 0;
      this.updateCurrentUi();
      this.loadLyrics(track);

      if (!this.audioCandidates.length) {
        this.showToast("这首歌没有可用播放地址");
        return;
      }

      this.audio.src = this.audioCandidates[0];
      this.audio.load();
      if (autoplay) this.audio.play().catch(error => {
        console.warn("SmallJia Music: play rejected", error);
        this.showToast("浏览器阻止了播放，请再点击一次播放按钮");
      });
      this.saveState(true);
    }

    async playTrack(track) {
      if (!track) return;
      let index = this.queue.findIndex(item => item.key === track.key);
      if (index < 0) {
        const appended = normalizeTrack(serializeTrack(track), this.queue.length, track.server || this.server);
        this.queue.push(appended);
        index = this.queue.length - 1;
        this.renderQueue();
      }
      this.selectIndex(index, true, false);
    }

    togglePlay() {
      if (!this.currentTrack) {
        if (this.queue.length) this.selectIndex(0, true, false);
        else this.showToast("当前没有可播放歌曲");
        return;
      }
      if (!this.audio.src) {
        this.selectIndex(this.currentIndex >= 0 ? this.currentIndex : 0, true, false);
        return;
      }
      if (this.audio.paused) this.audio.play().catch(() => this.showToast("播放失败，请换一首试试"));
      else this.audio.pause();
    }

    previous() {
      if (!this.queue.length) return;
      if (this.audio.currentTime > 5) {
        this.audio.currentTime = 0;
        return;
      }
      this.selectIndex(this.currentIndex - 1, true, false);
    }

    next(fromEnded = false) {
      if (!this.queue.length) return;
      const index = this.currentIndex >= 0 ? this.currentIndex + 1 : 0;
      this.selectIndex(index, true, false);
      if (!fromEnded) this.showToast("已切换到下一首");
    }

    random() {
      if (!this.queue.length) return this.showToast("播放队列为空");
      let index = Math.floor(Math.random() * this.queue.length);
      if (this.queue.length > 1 && index === this.currentIndex) index = (index + 1) % this.queue.length;
      this.selectIndex(index, true, false);
    }

    toggleLoop() {
      this.loopMode = this.loopMode === "one" ? "list" : "one";
      this.updateLoopButton();
      this.saveState(true);
      this.showToast(this.loopMode === "one" ? "已切换为单曲循环" : "已切换为列表循环");
    }

    updateLoopButton() {
      if (!this.dom.loop) return;
      this.dom.loop.classList.toggle("active", this.loopMode === "one");
      this.dom.loop.title = this.loopMode === "one" ? "单曲循环" : "列表循环";
    }

    handleAudioError() {
      if (this.destroyed || !this.currentTrack) return;
      const nextCandidate = this.audioCandidateIndex + 1;
      if (nextCandidate < this.audioCandidates.length) {
        this.audioCandidateIndex = nextCandidate;
        const shouldPlay = !this.audio.paused || this.audio.currentTime > 0;
        this.audio.src = this.audioCandidates[nextCandidate];
        this.audio.load();
        if (shouldPlay) this.audio.play().catch(() => {});
        this.showToast("主音源不可用，正在尝试备用线路");
        return;
      }
      this.updatePlayButton(false);
      this.showToast("当前歌曲暂时无法播放，请尝试下一首");
    }

    updateCurrentUi() {
      const track = this.currentTrack;
      if (!track) return;
      const cover = track.cover && /^https?:|^\//i.test(track.cover) ? track.cover : FALLBACK_COVER;
      if (this.dom.nowCover) this.dom.nowCover.src = cover;
      if (this.dom.barCover) this.dom.barCover.src = cover;
      if (this.dom.nowTitle) this.dom.nowTitle.textContent = track.name;
      if (this.dom.nowArtist) this.dom.nowArtist.textContent = track.artist;
      if (this.dom.nowAlbum) this.dom.nowAlbum.textContent = track.album || "SmallJia Music";
      if (this.dom.barTitle) this.dom.barTitle.textContent = track.name;
      if (this.dom.barArtist) this.dom.barArtist.textContent = track.artist;
      if (this.dom.musicBg) this.dom.musicBg.style.backgroundImage = cover !== FALLBACK_COVER ? `url("${cover.replace(/"/g, "")}")` : "none";
      this.updateFavoriteButton();
      this.markActiveRows();
      this.updateProgress();
    }

    setNowPlaceholder(title, artist) {
      if (this.dom.nowTitle) this.dom.nowTitle.textContent = title;
      if (this.dom.nowArtist) this.dom.nowArtist.textContent = artist;
      if (this.dom.barTitle) this.dom.barTitle.textContent = title;
      if (this.dom.barArtist) this.dom.barArtist.textContent = artist;
    }

    async loadLyrics(track) {
      const token = ++this.lyricToken;
      this.lyrics = [];
      this.currentLyricIndex = -1;
      this.renderLyrics([]);

      let text = track.lrc && !/^https?:/i.test(track.lrc) ? track.lrc : "";
      if (!parseLrc(text).length) {
        const urls = this.lyricUrls(track);
        for (const url of urls) {
          try {
            const response = await fetchWithTimeout(url, {}, 8000);
            if (!response.ok) continue;
            const candidate = await response.text();
            if (parseLrc(candidate).length) {
              text = candidate;
              break;
            }
          } catch (error) {
            console.warn("SmallJia Music: lyric fallback failed", error);
          }
        }
      }

      if (token !== this.lyricToken || this.destroyed) return;
      this.lyrics = parseLrc(text);
      this.renderLyrics(this.lyrics);
    }

    renderLyrics(lines) {
      const box = this.dom.lyrics;
      if (!box) return;
      box.innerHTML = "";
      if (!lines.length) {
        const empty = document.createElement("div");
        empty.className = "sjm-empty sjm-lyrics-empty";
        empty.innerHTML = '<div class="sjm-empty-icon">♫</div><div class="sjm-empty-title">暂无同步歌词</div><div class="sjm-empty-text">部分歌曲可能没有可用歌词。</div>';
        box.appendChild(empty);
        return;
      }
      lines.forEach((line, index) => {
        const node = document.createElement("div");
        node.className = "sjm-lyric-line";
        node.textContent = line.text;
        node.addEventListener("click", () => {
          if (Number.isFinite(line.time)) this.audio.currentTime = line.time;
        });
        box.appendChild(node);
      });
    }

    updateLyric() {
      if (!this.lyrics.length) return;
      const time = this.audio.currentTime || 0;
      let index = -1;
      for (let i = 0; i < this.lyrics.length; i += 1) {
        if (this.lyrics[i].time <= time + 0.15) index = i;
        else break;
      }
      if (index === this.currentLyricIndex) return;
      this.currentLyricIndex = index;
      const nodes = [...(this.dom.lyrics?.querySelectorAll(".sjm-lyric-line") || [])];
      nodes.forEach((node, i) => {
        node.classList.toggle("active", i === index);
        node.classList.toggle("near", Math.abs(i - index) === 1);
      });
      nodes[index]?.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    updateProgress() {
      const current = this.audio.currentTime || 0;
      const duration = this.audio.duration || 0;
      if (this.dom.currentTime) this.dom.currentTime.textContent = formatTime(current);
      if (this.dom.duration) this.dom.duration.textContent = formatTime(duration);
      if (this.dom.progress) {
        this.dom.progress.value = Number.isFinite(duration) && duration > 0 ? String((current / duration) * 100) : "0";
      }
    }

    restoreSavedPosition() {
      if (!this.restorePositionPending || !this.currentTrack) return;
      this.restorePositionPending = false;
      if (this.state.currentKey !== this.currentTrack.key) return;
      const position = Number(this.state.position);
      const duration = this.audio.duration;
      if (Number.isFinite(position) && position > 2 && Number.isFinite(duration) && position < duration - 3) {
        try {
          this.audio.currentTime = position;
        } catch (_) {}
      }
    }

    updatePlayButton(playing) {
      if (!this.dom.play) return;
      this.dom.play.textContent = playing ? "❚❚" : "▶";
      this.dom.play.setAttribute("aria-label", playing ? "暂停" : "播放");
    }

    async search(rawQuery) {
      const query = String(rawQuery || "").trim();
      if (!query) return this.setSearchStatus("请输入歌曲名或歌手名");
      const seq = ++this.searchSeq;
      this.switchView("search");
      this.setSearchStatus(`正在搜索“${query}”…`);
      this.renderTrackList(this.dom.searchResults, []);

      try {
        const result = await this.requestList("search", query);
        if (seq !== this.searchSeq || this.destroyed) return;
        this.searchResults = result.list.slice(0, SEARCH_LIMIT).map((raw, index) => normalizeTrack(raw, index, this.server));
        this.renderTrackList(this.dom.searchResults, this.searchResults);
        this.setSourceState("ready", result.label);
        this.setSearchStatus(this.searchResults.length ? `找到 ${this.searchResults.length} 个结果，点击即可播放` : `没有找到“${query}”`);
      } catch (error) {
        console.error("SmallJia Music: search failed", error);
        if (seq !== this.searchSeq) return;
        this.setSearchStatus("搜索失败，请稍后再试");
        this.showToast("在线搜索暂时不可用");
      }
    }

    switchView(name) {
      const target = name || "home";
      this.root.dataset.currentView = target;
      this.dom.views.forEach(view => view.classList.toggle("active", view.dataset.sjmView === target));
      this.dom.navItems.forEach(button => button.classList.toggle("active", button.dataset.sjmViewTarget === target));
      if (target === "favorites") this.renderFavorites();
      if (target === "recent") this.renderRecent();
      if (target === "queue") this.renderTrackList(this.dom.queueList, this.queue);
      if (target === "search") setTimeout(() => this.dom.searchInput?.focus(), 0);
    }

    renderQueue() {
      if (this.dom.queueCount) this.dom.queueCount.textContent = String(this.queue.length);
      this.renderTrackList(this.dom.homeList, this.queue.slice(0, 16));
      this.renderTrackList(this.dom.queueList, this.queue);
    }

    renderTrackList(container, tracks) {
      if (!container) return;
      container.innerHTML = "";
      if (!tracks?.length) {
        const empty = document.createElement("div");
        empty.className = "sjm-empty";
        empty.innerHTML = '<div class="sjm-empty-icon">♫</div><div class="sjm-empty-title">这里还没有歌曲</div><div class="sjm-empty-text">可以从默认歌单或在线搜索开始。</div>';
        container.appendChild(empty);
        return;
      }

      tracks.forEach(track => {
        const row = document.createElement("article");
        row.className = "sjm-track-row";
        row.dataset.trackKey = track.key;

        const coverButton = document.createElement("button");
        coverButton.type = "button";
        coverButton.className = "sjm-track-cover";
        coverButton.title = `播放 ${track.name}`;
        const img = document.createElement("img");
        img.src = track.cover || FALLBACK_COVER;
        img.alt = "";
        img.loading = "lazy";
        img.addEventListener("error", () => {
          if (img.src !== new URL(FALLBACK_COVER, location.href).href) img.src = FALLBACK_COVER;
        }, { once: true });
        const playIcon = document.createElement("span");
        playIcon.textContent = "▶";
        coverButton.append(img, playIcon);

        const meta = document.createElement("button");
        meta.type = "button";
        meta.className = "sjm-track-meta";
        const title = document.createElement("strong");
        title.className = "sjm-track-name";
        title.textContent = track.name;
        const sub = document.createElement("span");
        sub.className = "sjm-track-sub";
        sub.textContent = track.album ? `${track.artist} · ${track.album}` : track.artist;
        meta.append(title, sub);

        const source = document.createElement("span");
        source.className = "sjm-track-source";
        source.textContent = track.server === "netease" ? "网易云" : track.server;

        const favorite = document.createElement("button");
        favorite.type = "button";
        favorite.className = "sjm-row-action";
        const liked = this.isFavorite(track);
        favorite.classList.toggle("active", liked);
        favorite.textContent = liked ? "♥" : "♡";
        favorite.title = liked ? "取消收藏" : "收藏";

        coverButton.addEventListener("click", () => this.playTrack(track));
        meta.addEventListener("click", () => this.playTrack(track));
        favorite.addEventListener("click", event => {
          event.stopPropagation();
          this.toggleFavorite(track);
        });

        row.append(coverButton, meta, source, favorite);
        container.appendChild(row);
      });
      this.markActiveRows();
    }

    markActiveRows() {
      this.root.querySelectorAll(".sjm-track-row").forEach(row => {
        row.classList.toggle("active", !!this.currentTrack && row.dataset.trackKey === this.currentTrack.key);
      });
    }

    isFavorite(track) {
      return !!track && this.favorites.some(item => item.key === track.key);
    }

    toggleFavorite(track) {
      if (!track) return;
      const index = this.favorites.findIndex(item => item.key === track.key);
      if (index >= 0) {
        this.favorites.splice(index, 1);
        this.showToast("已取消收藏");
      } else {
        this.favorites.unshift(serializeTrack(track));
        this.showToast("已加入我的收藏");
      }
      writeStorage(STORAGE.favorites, this.favorites);
      this.renderFavorites();
      this.updateFavoriteButton();
      this.refreshFavoriteButtons();
    }

    updateFavoriteButton() {
      if (!this.dom.currentFavorite) return;
      const liked = this.isFavorite(this.currentTrack);
      this.dom.currentFavorite.classList.toggle("active", liked);
      this.dom.currentFavorite.textContent = liked ? "♥ 已收藏" : "♡ 收藏";
    }

    refreshFavoriteButtons() {
      this.root.querySelectorAll(".sjm-track-row").forEach(row => {
        const button = row.querySelector(".sjm-row-action");
        if (!button) return;
        const liked = this.favorites.some(item => item.key === row.dataset.trackKey);
        button.classList.toggle("active", liked);
        button.textContent = liked ? "♥" : "♡";
      });
    }

    renderFavorites() {
      if (this.dom.favoriteCount) this.dom.favoriteCount.textContent = String(this.favorites.length);
      this.renderTrackList(this.dom.favoriteList, this.favorites.map((item, index) => normalizeTrack(item, index, item.server || this.server)));
    }

    addRecent(track) {
      if (!track) return;
      const serialized = serializeTrack(track);
      this.recent = this.recent.filter(item => item.key !== serialized.key);
      this.recent.unshift(serialized);
      this.recent = this.recent.slice(0, RECENT_LIMIT);
      writeStorage(STORAGE.recent, this.recent);
      this.renderRecent();
    }

    renderRecent() {
      if (this.dom.recentCount) this.dom.recentCount.textContent = String(this.recent.length);
      this.renderTrackList(this.dom.recentList, this.recent.map((item, index) => normalizeTrack(item, index, item.server || this.server)));
    }

    setSearchStatus(text) {
      if (this.dom.searchStatus) this.dom.searchStatus.textContent = text;
    }

    setSourceState(state, routeLabel = "") {
      this.root.classList.toggle("sjm-engine-error", state === "error");
      const text = this.dom.sourceChip?.querySelector("span:last-child");
      if (!text) return;
      if (state === "loading") text.textContent = "正在连接音乐服务";
      else if (state === "error") text.textContent = "音乐服务连接失败";
      else text.textContent = routeLabel === "备用线路" ? "网易云在线曲库 · 备用线路" : "网易云在线曲库";
    }

    showToast(message) {
      const box = this.dom.toast;
      if (!box) return;
      box.textContent = message;
      box.classList.add("show");
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => box.classList.remove("show"), 2300);
    }

    saveState(force) {
      const now = Date.now();
      if (!force && now - this.lastStateSave < 3000) return;
      this.lastStateSave = now;
      this.state = {
        volume: this.audio.volume,
        loopMode: this.loopMode,
        currentKey: this.currentTrack?.key || "",
        position: this.audio.currentTime || 0,
      };
      writeStorage(STORAGE.state, this.state);
    }

    destroy() {
      this.destroyed = true;
      clearTimeout(this.searchTimer);
      clearTimeout(this.toastTimer);
      this.saveState(true);
      this.audio.pause();
      this.audio.removeAttribute("src");
      try { this.audio.load(); } catch (_) {}
    }
  }

  const boot = () => {
    if (!window.location.pathname.startsWith("/music/")) return;
    const root = document.getElementById("anMusic-page");
    if (!root) return;
    if (activeApp?.root === root && !activeApp.destroyed) return;
    if (activeApp) activeApp.destroy();
    activeApp = new SmallJiaNativeMusic(root);
    window.SmallJiaMusic = activeApp;
    activeApp.init().catch(error => {
      console.error("SmallJia Music: initialization failed", error);
      activeApp?.showToast("音乐馆初始化失败，请刷新页面重试");
    });
  };

  const destroy = () => {
    if (activeApp) activeApp.destroy();
    activeApp = null;
    window.SmallJiaMusic = null;
  };

  window.__smallJiaMusicBoot = boot;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
  document.addEventListener("pjax:send", destroy);
})();
