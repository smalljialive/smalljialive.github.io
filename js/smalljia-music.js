(function () {
  "use strict";

  if (window.__smallJiaMusicScriptReady) {
    if (typeof window.__smallJiaMusicBoot === "function") window.__smallJiaMusicBoot();
    return;
  }
  window.__smallJiaMusicScriptReady = true;

  const STORAGE = {
    favorites: "smalljia_music_favorites_v2",
    recent: "smalljia_music_recent_v2",
    state: "smalljia_music_player_state_v2",
  };
  const RECENT_LIMIT = 50;
  const SEARCH_LIMIT = 20;
  const FALLBACK_COVER = "/img/favicon.ico";
  const ENGINE_TIMEOUT = 12000;

  let activeApp = null;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
    const urlId = String(raw.url_id || raw.urlId || id || "");
    const picId = String(raw.pic_id || raw.picId || id || "");
    const lyricId = String(raw.lyric_id || raw.lyricId || id || "");
    const key = id ? `${server}:${id}` : `${name}::${artist}`.toLowerCase();

    return { id, server, name, artist, album, cover, url, lrc, urlId, picId, lyricId, key, index };
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
    urlId: track.urlId || track.id || "",
    picId: track.picId || track.id || "",
    lyricId: track.lyricId || track.id || "",
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

  const extractString = (payload, preferredKeys = []) => {
    if (payload === null || payload === undefined) return "";
    if (typeof payload === "string") return payload.trim().replace(/^"|"$/g, "");
    if (Array.isArray(payload)) {
      for (const item of payload) {
        const value = extractString(item, preferredKeys);
        if (value) return value;
      }
      return "";
    }
    if (typeof payload === "object") {
      const keys = [...preferredKeys, "url", "pic", "lrc", "lyric", "data"];
      for (const key of keys) {
        if (payload[key] !== undefined) {
          const value = extractString(payload[key], preferredKeys);
          if (value) return value;
        }
      }
    }
    return "";
  };

  const fetchTextOrJson = async url => {
    const response = await fetch(url, { credentials: "omit", cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      return text;
    }
  };

  const fetchJson = async url => {
    const response = await fetch(url, { credentials: "omit", cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  };

  const metingUrl = (server, type, id) => {
    const template = window.meting_api || "https://meting-api-omega.vercel.app/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
    const nonce = `${Date.now()}${Math.random().toString(36).slice(2)}`;
    return template
      .replace(":server", encodeURIComponent(server || "netease"))
      .replace(":type", encodeURIComponent(type))
      .replace(":id", encodeURIComponent(id || ""))
      .replace(":auth", "")
      .replace(":r", nonce);
  };

  class SmallJiaMusicApp {
    constructor(root) {
      this.root = root;
      this.server = String(root.dataset.musicServer || "netease").toLowerCase();
      this.playlistId = String(root.dataset.musicId || "");
      this.configuredVolume = Number(root.dataset.musicVolume);
      this.aplayer = null;
      this.queue = [];
      this.searchResults = [];
      this.currentTrack = null;
      this.lyrics = [];
      this.currentLyricIndex = -1;
      this.lyricToken = 0;
      this.destroyed = false;
      this.searchTimer = null;
      this.searchSeq = 0;
      this.lastStateSave = 0;
      this.favorites = readStorage(STORAGE.favorites, []);
      this.recent = readStorage(STORAGE.recent, []);
      this.state = readStorage(STORAGE.state, {});
      this.loopMode = this.state.loopMode === "one" ? "one" : "list";
      this.dom = {};
    }

    async init() {
      this.cacheDom();
      this.bindStaticUi();
      this.renderFavorites();
      this.renderRecent();
      this.setSearchStatus("输入歌曲名或歌手开始搜索");
      this.setSourceState("loading");

      try {
        if (!this.root.querySelector("meting-js") && window.anzhiyu?.getCustomPlayList) {
          window.anzhiyu.getCustomPlayList();
        }
      } catch (error) {
        console.warn("SmallJia Music: could not request Meting initialization", error);
      }

      this.aplayer = await this.waitForAPlayer();
      if (this.destroyed) return;

      if (!this.aplayer) {
        this.setSourceState("error");
        this.showToast("播放器引擎加载失败，请刷新页面重试");
        this.setNowPlaceholder("播放器未连接", "Meting / APlayer 未初始化");
        return;
      }

      this.setSourceState("ready");
      this.bindAPlayer();
      this.restorePlayerState();
      this.syncQueue();
      this.syncCurrentTrack(true);
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

    bindStaticUi() {
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
          this.setSearchStatus("输入歌曲名或歌手开始搜索");
          this.searchResults = [];
          this.renderTrackList(this.dom.searchResults, []);
          return;
        }
        if (query.length < 2) return;
        this.searchTimer = setTimeout(() => this.search(query), 550);
      });

      this.dom.queueShortcut?.addEventListener("click", () => this.switchView("queue"));
      this.dom.currentFavorite?.addEventListener("click", () => {
        if (this.currentTrack) this.toggleFavorite(this.currentTrack);
      });

      this.dom.play?.addEventListener("click", () => {
        if (!this.aplayer) return this.showToast("播放器还没有准备好");
        this.aplayer.toggle();
      });
      this.dom.prev?.addEventListener("click", () => this.aplayer?.skipBack());
      this.dom.next?.addEventListener("click", () => this.aplayer?.skipForward());
      this.dom.shuffle?.addEventListener("click", () => this.playRandom());
      this.dom.loop?.addEventListener("click", () => this.toggleLoop());

      this.dom.progress?.addEventListener("input", () => {
        const duration = this.aplayer?.audio?.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;
        const ratio = Number(this.dom.progress.value) / 100;
        this.aplayer.seek(duration * ratio);
      });

      this.dom.volume?.addEventListener("input", () => {
        if (!this.aplayer) return;
        const volume = Math.max(0, Math.min(1, Number(this.dom.volume.value) / 100));
        this.aplayer.volume(volume, true);
        this.saveState(true);
      });
    }

    async waitForAPlayer() {
      const started = Date.now();
      while (!this.destroyed && Date.now() - started < ENGINE_TIMEOUT) {
        const meting = this.root.querySelector("#anMusic-page-meting meting-js, meting-js");
        if (meting?.aplayer?.list?.audios) return meting.aplayer;
        await sleep(120);
      }
      return null;
    }

    bindAPlayer() {
      const ap = this.aplayer;
      if (!ap) return;

      ap.on("listswitch", () => {
        setTimeout(() => {
          this.syncQueue();
          this.syncCurrentTrack(true);
        }, 0);
      });
      ap.on("loadedmetadata", () => {
        this.updateProgress();
        this.syncCurrentTrack(false);
        this.restoreSavedPosition();
      });
      ap.on("loadeddata", () => {
        this.updateProgress();
        this.syncCurrentTrack(false);
      });
      ap.on("play", () => {
        this.updatePlayButton(true);
        this.syncCurrentTrack(false);
        this.addRecent(this.currentTrack);
      });
      ap.on("pause", () => this.updatePlayButton(false));
      ap.on("timeupdate", () => {
        this.updateProgress();
        this.updateLyric();
        this.saveState(false);
      });
      ap.on("ended", () => {
        if (this.loopMode === "one" && ap.audio) {
          ap.seek(0);
          ap.play();
        }
      });
      ap.on("error", () => this.showToast("当前歌曲播放失败，可尝试下一首"));

      this.updatePlayButton(!ap.audio?.paused);
      this.applyLoopMode();
    }

    restorePlayerState() {
      if (!this.aplayer) return;
      const fallback = Number.isFinite(this.configuredVolume) ? this.configuredVolume : 0.5;
      const volume = Number.isFinite(Number(this.state.volume)) ? Number(this.state.volume) : fallback;
      const normalized = Math.max(0, Math.min(1, volume));
      this.aplayer.volume(normalized, true);
      if (this.dom.volume) this.dom.volume.value = String(Math.round(normalized * 100));
      this.applyLoopMode();

      const currentKey = this.state.currentKey;
      if (currentKey) {
        const audios = this.aplayer.list?.audios || [];
        const index = audios.findIndex((raw, i) => normalizeTrack(raw, i, this.server).key === currentKey);
        if (index >= 0 && index !== this.aplayer.list.index) this.aplayer.list.switch(index);
      }
    }

    restoreSavedPosition() {
      if (!this.aplayer?.audio || !this.currentTrack) return;
      if (this.state.currentKey !== this.currentTrack.key) return;
      if (this.state.positionRestored) return;
      const position = Number(this.state.position);
      const duration = this.aplayer.audio.duration;
      if (Number.isFinite(position) && position > 2 && Number.isFinite(duration) && position < duration - 3) {
        try {
          this.aplayer.seek(position);
        } catch (_) {}
      }
      this.state.positionRestored = true;
    }

    syncQueue() {
      if (!this.aplayer?.list?.audios) return;
      this.queue = this.aplayer.list.audios.map((raw, index) => normalizeTrack(raw, index, this.server));
      if (this.dom.queueCount) this.dom.queueCount.textContent = String(this.queue.length);
      this.renderTrackList(this.dom.homeList, this.queue.slice(0, 16));
      this.renderTrackList(this.dom.queueList, this.queue);
    }

    syncCurrentTrack(loadLyrics = false) {
      if (!this.aplayer?.list?.audios?.length) {
        this.setNowPlaceholder("歌单为空", "没有可播放歌曲");
        return;
      }
      const index = Number.isInteger(this.aplayer.list.index) ? this.aplayer.list.index : 0;
      const raw = this.aplayer.list.audios[index] || this.aplayer.list.audios[0];
      const track = normalizeTrack(raw, index, this.server);
      const changed = !this.currentTrack || this.currentTrack.key !== track.key;
      this.currentTrack = track;

      const cover = track.cover && /^https?:|^\//i.test(track.cover) ? track.cover : FALLBACK_COVER;
      if (this.dom.nowCover) this.dom.nowCover.src = cover;
      if (this.dom.barCover) this.dom.barCover.src = cover;
      if (this.dom.nowTitle) this.dom.nowTitle.textContent = track.name;
      if (this.dom.nowArtist) this.dom.nowArtist.textContent = track.artist;
      if (this.dom.nowAlbum) this.dom.nowAlbum.textContent = track.album || "SmallJia Music";
      if (this.dom.barTitle) this.dom.barTitle.textContent = track.name;
      if (this.dom.barArtist) this.dom.barArtist.textContent = track.artist;
      if (this.dom.musicBg) this.dom.musicBg.style.backgroundImage = track.cover ? `url("${String(track.cover).replace(/"/g, "")}")` : "none";
      this.updateFavoriteButton();
      this.markActiveRows();

      if (changed || loadLyrics) this.loadLyrics(track);
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

      let text = track.lrc || "";
      try {
        if (text && /^https?:/i.test(text)) {
          const response = await fetch(text, { credentials: "omit", cache: "no-store" });
          if (response.ok) text = await response.text();
        }
        if ((!text || parseLrc(text).length === 0) && (track.lyricId || track.id)) {
          const payload = await fetchTextOrJson(metingUrl(track.server, "lrc", track.lyricId || track.id));
          text = extractString(payload, ["lrc", "lyric"]) || (typeof payload === "string" ? payload : "");
          if (!text) {
            const fallback = await fetchTextOrJson(metingUrl(track.server, "lyric", track.lyricId || track.id));
            text = extractString(fallback, ["lyric", "lrc"]) || (typeof fallback === "string" ? fallback : "");
          }
        }
      } catch (error) {
        console.warn("SmallJia Music: lyric lookup failed", error);
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
        node.dataset.index = String(index);
        node.addEventListener("click", () => this.aplayer?.seek(line.time));
        box.appendChild(node);
      });
    }

    updateLyric() {
      if (!this.lyrics.length || !this.aplayer?.audio) return;
      const time = this.aplayer.audio.currentTime || 0;
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
      const active = nodes[index];
      if (active) active.scrollIntoView({ block: "center", behavior: "smooth" });
    }

    updateProgress() {
      if (!this.aplayer?.audio) return;
      const current = this.aplayer.audio.currentTime || 0;
      const duration = this.aplayer.audio.duration || 0;
      if (this.dom.currentTime) this.dom.currentTime.textContent = formatTime(current);
      if (this.dom.duration) this.dom.duration.textContent = formatTime(duration);
      if (this.dom.progress && Number.isFinite(duration) && duration > 0) {
        this.dom.progress.value = String(Math.max(0, Math.min(100, (current / duration) * 100)));
      }
    }

    updatePlayButton(isPlaying) {
      if (!this.dom.play) return;
      this.dom.play.textContent = isPlaying ? "❚❚" : "▶";
      this.dom.play.setAttribute("aria-label", isPlaying ? "暂停" : "播放");
    }

    playRandom() {
      if (!this.aplayer?.list?.audios?.length) return this.showToast("播放队列为空");
      const length = this.aplayer.list.audios.length;
      let index = Math.floor(Math.random() * length);
      if (length > 1 && index === this.aplayer.list.index) index = (index + 1) % length;
      this.aplayer.list.switch(index);
      this.aplayer.play();
    }

    toggleLoop() {
      this.loopMode = this.loopMode === "one" ? "list" : "one";
      this.applyLoopMode();
      this.saveState(true);
      this.showToast(this.loopMode === "one" ? "已切换为单曲循环" : "已切换为列表循环");
    }

    applyLoopMode() {
      if (this.aplayer?.audio) this.aplayer.audio.loop = this.loopMode === "one";
      if (this.dom.loop) {
        this.dom.loop.classList.toggle("active", this.loopMode === "one");
        this.dom.loop.title = this.loopMode === "one" ? "单曲循环" : "列表循环";
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
      if (target === "search") this.dom.searchInput?.focus();
    }

    async search(rawQuery) {
      const query = String(rawQuery || "").trim();
      if (!query) {
        this.setSearchStatus("请输入歌曲名或歌手名");
        return;
      }
      const seq = ++this.searchSeq;
      this.switchView("search");
      this.setSearchStatus(`正在搜索“${query}”…`);
      this.renderTrackList(this.dom.searchResults, []);

      try {
        const payload = await fetchJson(metingUrl(this.server, "search", query));
        if (seq !== this.searchSeq || this.destroyed) return;
        const list = normalizeList(payload)
          .slice(0, SEARCH_LIMIT)
          .map((raw, index) => normalizeTrack(raw, index, this.server));
        this.searchResults = list;
        this.renderTrackList(this.dom.searchResults, list);
        this.setSearchStatus(list.length ? `找到 ${list.length} 个结果，点击即可播放` : `没有找到“${query}”`);
      } catch (error) {
        console.error("SmallJia Music: search failed", error);
        if (seq !== this.searchSeq) return;
        this.setSearchStatus("搜索失败，请稍后再试");
        this.showToast("在线搜索暂时不可用");
      }
    }

    async playTrack(track) {
      if (!track) return;
      if (!this.aplayer) return this.showToast("播放器引擎还没有准备好");

      const existingIndex = this.findQueueIndex(track);
      if (existingIndex >= 0) {
        this.aplayer.list.switch(existingIndex);
        this.aplayer.play();
        return;
      }

      this.showToast(`正在准备：${track.name}`);
      try {
        const resolved = await this.resolveTrack(track);
        if (!resolved.url) throw new Error("没有可用播放地址");
        const audio = {
          name: resolved.name,
          artist: resolved.artist,
          url: resolved.url,
          cover: resolved.cover || FALLBACK_COVER,
          lrc: resolved.lrc || "",
          theme: "#425aef",
          smalljiaId: resolved.id,
          smalljiaServer: resolved.server,
          album: resolved.album,
          url_id: resolved.urlId,
          pic_id: resolved.picId,
          lyric_id: resolved.lyricId,
        };
        this.aplayer.list.add([audio]);
        const newIndex = this.aplayer.list.audios.length - 1;
        this.syncQueue();
        this.aplayer.list.switch(newIndex);
        this.aplayer.play();
      } catch (error) {
        console.error("SmallJia Music: play search track failed", error);
        this.showToast("这首歌暂时无法获取播放地址");
      }
    }

    async resolveTrack(track) {
      const result = { ...track };
      const tasks = [];

      if (!result.url || !/^https?:/i.test(result.url)) {
        tasks.push(
          fetchTextOrJson(metingUrl(result.server, "url", result.urlId || result.id))
            .then(payload => {
              result.url = extractString(payload, ["url"]);
            })
            .catch(error => console.warn("SmallJia Music: URL resolve failed", error))
        );
      }
      if (!result.cover || !/^https?:|^\//i.test(result.cover)) {
        tasks.push(
          fetchTextOrJson(metingUrl(result.server, "pic", result.picId || result.id))
            .then(payload => {
              result.cover = extractString(payload, ["pic", "url"]);
            })
            .catch(error => console.warn("SmallJia Music: cover resolve failed", error))
        );
      }
      if (!result.lrc || /^https?:/i.test(result.lrc)) {
        tasks.push(
          fetchTextOrJson(metingUrl(result.server, "lrc", result.lyricId || result.id))
            .then(payload => {
              const text = extractString(payload, ["lrc", "lyric"]);
              if (text) result.lrc = text;
            })
            .catch(error => console.warn("SmallJia Music: lrc resolve failed", error))
        );
      }

      await Promise.all(tasks);
      return result;
    }

    findQueueIndex(track) {
      if (!track) return -1;
      return this.queue.findIndex(item => item.key === track.key || (track.id && item.id === track.id && item.server === track.server));
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
      if (!this.currentTrack) return;
      this.root.querySelectorAll(".sjm-track-row").forEach(row => {
        row.classList.toggle("active", row.dataset.trackKey === this.currentTrack.key);
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
      this.refreshVisibleFavoriteButtons();
    }

    updateFavoriteButton() {
      if (!this.dom.currentFavorite || !this.currentTrack) return;
      const liked = this.isFavorite(this.currentTrack);
      this.dom.currentFavorite.classList.toggle("active", liked);
      this.dom.currentFavorite.textContent = liked ? "♥ 已收藏" : "♡ 收藏";
    }

    refreshVisibleFavoriteButtons() {
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
      const tracks = this.favorites.map((item, index) => normalizeTrack(item, index, item.server || this.server));
      this.renderTrackList(this.dom.favoriteList, tracks);
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
      const tracks = this.recent.map((item, index) => normalizeTrack(item, index, item.server || this.server));
      this.renderTrackList(this.dom.recentList, tracks);
    }

    setSearchStatus(text) {
      if (this.dom.searchStatus) this.dom.searchStatus.textContent = text;
    }

    setSourceState(state) {
      this.root.classList.toggle("sjm-engine-error", state === "error");
      const text = this.dom.sourceChip?.querySelector("span:last-child");
      if (!text) return;
      if (state === "loading") text.textContent = "正在连接音乐服务";
      else if (state === "error") text.textContent = "音乐服务连接失败";
      else text.textContent = "网易云在线曲库";
    }

    showToast(message) {
      const box = this.dom.toast;
      if (!box) return;
      box.textContent = message;
      box.classList.add("show");
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => box.classList.remove("show"), 2200);
    }

    saveState(force) {
      if (!this.aplayer) return;
      const now = Date.now();
      if (!force && now - this.lastStateSave < 3000) return;
      this.lastStateSave = now;
      const volume = Number(this.dom.volume?.value || 50) / 100;
      this.state = {
        volume,
        loopMode: this.loopMode,
        currentKey: this.currentTrack?.key || "",
        position: this.aplayer.audio?.currentTime || 0,
      };
      writeStorage(STORAGE.state, this.state);
    }

    destroy() {
      this.destroyed = true;
      clearTimeout(this.searchTimer);
      clearTimeout(this.toastTimer);
      this.saveState(true);
    }
  }

  const boot = () => {
    if (!window.location.pathname.startsWith("/music/")) return;
    const root = document.getElementById("anMusic-page");
    if (!root) return;
    if (activeApp?.root === root && !activeApp.destroyed) return;
    if (activeApp) activeApp.destroy();
    activeApp = new SmallJiaMusicApp(root);
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
