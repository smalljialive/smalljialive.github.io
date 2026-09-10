(function () {
  "use strict";

  if (window.__smallJiaMusicLibraryLoaded) return;
  window.__smallJiaMusicLibraryLoaded = true;

  const STORAGE = {
    playlists: "smalljia_music_custom_playlists_v1",
    discovery: "smalljia_music_discovery_history_v1",
    discoveryAuto: "smalljia_music_discovery_auto_v1",
  };
  const DIRECT_API = "https://music-api.gdstudio.xyz/api.php";
  const PROXY_API = "https://smalljia-music-proxy-small-jias-projects.vercel.app/api/music";
  const FALLBACK_COVER = "/img/music-placeholder.svg";
  const DISCOVERY_LIMIT = 30;
  const NETEASE_CHARTS = [
    { id: "3778678", name: "网易云热歌榜" },
    { id: "3779629", name: "网易云新歌榜" },
    { id: "19723756", name: "网易云飙升榜" },
    { id: "2884035", name: "网易云原创榜" },
  ];
  const DISCOVERY_SEEDS = ["华语流行", "民谣", "独立音乐", "摇滚", "R&B", "治愈", "Live", "翻唱", "城市民谣"];

  let controller = null;

  const readJSON = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  };

  const writeJSON = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };

  const esc = value => String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));

  const normalizeText = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const artistText = value => {
    if (Array.isArray(value)) return value.map(item => typeof item === "string" ? item : item?.name || "").filter(Boolean).join(" / ") || "未知歌手";
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

  const normalizeTrack = (raw = {}, sourceFallback = "netease") => {
    const source = String(raw.source || raw.server || sourceFallback || "netease").toLowerCase();
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

  const serializeTrack = track => ({
    id: track?.id || "",
    server: track?.server || track?.source || "netease",
    source: track?.source || track?.server || "netease",
    name: track?.name || "未知歌曲",
    artist: track?.artist || "未知歌手",
    album: track?.album || "",
    cover: track?.cover || "",
    url: track?.url || "",
    lrc: track?.lrc || "",
    key: track?.key || `${track?.name || "未知歌曲"}::${track?.artist || "未知歌手"}`.toLowerCase(),
    __gdStudio: track?.__gdStudio ? { ...track.__gdStudio } : undefined,
  });

  const sameTrack = (a, b) => {
    if (!a || !b) return false;
    if (a.id && b.id && String(a.id) === String(b.id) && String(a.server || a.source || "netease") === String(b.server || b.source || "netease")) return true;
    return normalizeText(a.name) === normalizeText(b.name) && normalizeText(a.artist) === normalizeText(b.artist);
  };

  const scoreTrack = (candidate, target) => {
    const name = normalizeText(candidate.name);
    const wantedName = normalizeText(target.name);
    const artist = normalizeText(candidate.artist);
    const wantedArtist = normalizeText(target.artist);
    let score = 0;
    if (name === wantedName) score += 70;
    else if (name.includes(wantedName) || wantedName.includes(name)) score += 42;
    if (artist === wantedArtist) score += 35;
    else if (artist.includes(wantedArtist) || wantedArtist.includes(artist)) score += 20;
    if (target.album && normalizeText(candidate.album) === normalizeText(target.album)) score += 12;
    return score;
  };

  const resolveCatalogTrack = async track => {
    if (track?.id) return serializeTrack(track);
    const query = `${track?.name || ""} ${track?.artist || ""}`.trim();
    if (!query) return serializeTrack(track);
    const candidates = [];
    for (const source of ["netease", "kuwo"]) {
      try {
        const payload = await requestApi({ types: "search", source, name: query, count: 12, pages: 1 });
        normalizeList(payload).forEach(raw => candidates.push(normalizeTrack({ ...raw, source: raw.source || source }, source)));
      } catch (_) {}
      if (candidates.some(item => scoreTrack(item, track) >= 70)) break;
    }
    if (!candidates.length) return serializeTrack(track);
    candidates.sort((a, b) => scoreTrack(b, track) - scoreTrack(a, track));
    return serializeTrack({ ...candidates[0], name: track.name || candidates[0].name, artist: track.artist || candidates[0].artist, album: track.album || candidates[0].album });
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

  class MusicLibraryController {
    constructor(app) {
      this.app = app;
      this.root = app.root;
      this.playlists = readJSON(STORAGE.playlists, []);
      this.discoveryHistory = readJSON(STORAGE.discovery, []);
      this.discoveryAuto = localStorage.getItem(STORAGE.discoveryAuto) === "1";
      this.selectedPlaylistId = this.playlists[0]?.id || "";
      this.chartCache = new Map();
      this.discoveryBusy = false;
      this.originalRenderTrackList = null;
      this.originalNext = null;
      this.dom = {};
    }

    init() {
      this.injectViews();
      this.cacheDom();
      this.bindUi();
      this.patchApp();
      this.renderPlaylists();
      this.renderDiscovery();
      this.decorateExistingLists();
      this.updateCounts();
    }

    injectViews() {
      const nav = this.root.querySelector(".sjm-nav");
      const main = this.root.querySelector(".sjm-main");
      if (!nav || !main) return;

      if (!this.root.querySelector('[data-sjm-view-target="discover"]')) {
        const discoverNav = document.createElement("button");
        discoverNav.className = "sjm-nav-item";
        discoverNav.type = "button";
        discoverNav.dataset.sjmViewTarget = "discover";
        discoverNav.innerHTML = '<span class="sjm-nav-icon">✦</span><span>随机听歌</span><em>NEW</em>';
        const queueNav = nav.querySelector('[data-sjm-view-target="queue"]');
        nav.insertBefore(discoverNav, queueNav || null);
      }

      if (!this.root.querySelector('[data-sjm-view-target="playlists"]')) {
        const playlistNav = document.createElement("button");
        playlistNav.className = "sjm-nav-item";
        playlistNav.type = "button";
        playlistNav.dataset.sjmViewTarget = "playlists";
        playlistNav.innerHTML = '<span class="sjm-nav-icon">▤</span><span>我的歌单</span><em id="sjm-custom-playlist-count">0</em>';
        const recentNav = nav.querySelector('[data-sjm-view-target="recent"]');
        nav.insertBefore(playlistNav, recentNav || null);
      }

      if (!this.root.querySelector('[data-sjm-view="discover"]')) {
        const section = document.createElement("section");
        section.className = "sjm-view sjm-library-view";
        section.dataset.sjmView = "discover";
        section.innerHTML = `
          <div class="sjm-page-head sjm-library-head">
            <div><span class="sjm-eyebrow">DISCOVER</span><h2>网易云随机听歌</h2><p>从网易云热歌榜、新歌榜、飙升榜和原创榜随机抽歌，换点平时不会主动搜索的音乐。</p></div>
            <span class="sjm-search-badge" id="sjm-discover-route">网易云 · 随机发现</span>
          </div>
          <article class="sjm-discover-card">
            <div class="sjm-discover-mark">✦</div>
            <div class="sjm-discover-copy"><span class="sjm-eyebrow">RANDOM RADIO</span><h3>不知道听什么，就随机来一首</h3><p id="sjm-discover-status">点击按钮开始随机发现。听到喜欢的歌，可以直接加入自己的歌单。</p></div>
            <div class="sjm-discover-actions">
              <button id="sjm-discover-next" class="sjm-discover-primary" type="button">🎲 随机来一首</button>
              <button id="sjm-discover-auto" class="sjm-soft-button" type="button">连续随机：${this.discoveryAuto ? "开" : "关"}</button>
            </div>
          </article>
          <div class="sjm-section sjm-discovery-history-section">
            <div class="sjm-section-head"><div><span class="sjm-eyebrow">RECENT DISCOVERY</span><h3>最近随机到的歌曲</h3></div></div>
            <div id="sjm-discovery-list" class="sjm-track-list sjm-track-list-large"></div>
          </div>`;
        main.appendChild(section);
      }

      if (!this.root.querySelector('[data-sjm-view="playlists"]')) {
        const section = document.createElement("section");
        section.className = "sjm-view sjm-library-view";
        section.dataset.sjmView = "playlists";
        section.innerHTML = `
          <div class="sjm-page-head sjm-library-head">
            <div><span class="sjm-eyebrow">MY PLAYLISTS</span><h2>我的歌单</h2><p>自己创建歌单，把搜索、随机发现和正在播放的歌曲收进来。数据仅保存在当前浏览器。</p></div>
            <button id="sjm-new-playlist" class="sjm-discover-primary" type="button">＋ 新建歌单</button>
          </div>
          <div id="sjm-custom-playlist-grid" class="sjm-custom-playlist-grid"></div>
          <div id="sjm-custom-playlist-detail" class="sjm-custom-playlist-detail">
            <div class="sjm-section-head sjm-playlist-detail-head">
              <div><span class="sjm-eyebrow">PLAYLIST</span><h3 id="sjm-custom-playlist-title">还没有歌单</h3><p id="sjm-custom-playlist-meta">新建一个歌单开始收藏喜欢的歌曲。</p></div>
              <div class="sjm-playlist-detail-actions">
                <button id="sjm-play-custom-playlist" class="sjm-soft-button" type="button">▶ 播放歌单</button>
                <button id="sjm-rename-playlist" class="sjm-soft-button" type="button">✎ 重命名</button>
                <button id="sjm-delete-playlist" class="sjm-soft-button sjm-danger-button" type="button">删除</button>
              </div>
            </div>
            <div id="sjm-custom-playlist-tracks" class="sjm-track-list sjm-track-list-large"></div>
          </div>`;
        main.appendChild(section);
      }

      if (!this.root.querySelector("#sjm-current-add-playlist")) {
        const actions = this.root.querySelector(".sjm-now-actions");
        const button = document.createElement("button");
        button.id = "sjm-current-add-playlist";
        button.className = "sjm-soft-button sjm-add-playlist-button";
        button.type = "button";
        button.textContent = "＋ 加入歌单";
        if (actions) actions.insertBefore(button, actions.children[1] || null);
      }

      if (!this.root.querySelector("#sjm-playlist-modal")) {
        const modal = document.createElement("div");
        modal.id = "sjm-playlist-modal";
        modal.className = "sjm-playlist-modal";
        modal.hidden = true;
        modal.innerHTML = `
          <button class="sjm-playlist-modal-backdrop" type="button" data-sjm-modal-close aria-label="关闭"></button>
          <div class="sjm-playlist-modal-panel" role="dialog" aria-modal="true" aria-labelledby="sjm-playlist-modal-title">
            <div class="sjm-playlist-modal-head"><div><span class="sjm-eyebrow">ADD TO PLAYLIST</span><h3 id="sjm-playlist-modal-title">加入歌单</h3></div><button type="button" class="sjm-playlist-modal-close" data-sjm-modal-close>×</button></div>
            <div id="sjm-playlist-modal-targets" class="sjm-playlist-modal-targets"></div>
            <div class="sjm-playlist-create-inline"><input id="sjm-playlist-new-name" maxlength="30" placeholder="新歌单名称"><button id="sjm-playlist-create-and-add" type="button">新建并加入</button></div>
          </div>`;
        this.root.appendChild(modal);
      }
    }

    cacheDom() {
      const byId = id => this.root.querySelector(`#${id}`);
      this.dom = {
        discoverNav: this.root.querySelector('[data-sjm-view-target="discover"]'),
        playlistsNav: this.root.querySelector('[data-sjm-view-target="playlists"]'),
        discoverView: this.root.querySelector('[data-sjm-view="discover"]'),
        playlistsView: this.root.querySelector('[data-sjm-view="playlists"]'),
        playlistCount: byId("sjm-custom-playlist-count"),
        discoverNext: byId("sjm-discover-next"),
        discoverAuto: byId("sjm-discover-auto"),
        discoverStatus: byId("sjm-discover-status"),
        discoverRoute: byId("sjm-discover-route"),
        discoverList: byId("sjm-discovery-list"),
        newPlaylist: byId("sjm-new-playlist"),
        playlistGrid: byId("sjm-custom-playlist-grid"),
        playlistTitle: byId("sjm-custom-playlist-title"),
        playlistMeta: byId("sjm-custom-playlist-meta"),
        playlistTracks: byId("sjm-custom-playlist-tracks"),
        playlistPlay: byId("sjm-play-custom-playlist"),
        playlistRename: byId("sjm-rename-playlist"),
        playlistDelete: byId("sjm-delete-playlist"),
        currentAdd: byId("sjm-current-add-playlist"),
        modal: byId("sjm-playlist-modal"),
        modalTargets: byId("sjm-playlist-modal-targets"),
        modalName: byId("sjm-playlist-new-name"),
        modalCreate: byId("sjm-playlist-create-and-add"),
      };
      if (this.dom.discoverNav && !this.app.dom.navItems.includes(this.dom.discoverNav)) this.app.dom.navItems.push(this.dom.discoverNav);
      if (this.dom.playlistsNav && !this.app.dom.navItems.includes(this.dom.playlistsNav)) this.app.dom.navItems.push(this.dom.playlistsNav);
      if (this.dom.discoverView && !this.app.dom.views.includes(this.dom.discoverView)) this.app.dom.views.push(this.dom.discoverView);
      if (this.dom.playlistsView && !this.app.dom.views.includes(this.dom.playlistsView)) this.app.dom.views.push(this.dom.playlistsView);
    }

    bindUi() {
      this.dom.discoverNav?.addEventListener("click", () => {
        this.app.switchView("discover");
        if (!this.discoveryHistory.length) this.discoverAndPlay();
      });
      this.dom.playlistsNav?.addEventListener("click", () => {
        this.app.switchView("playlists");
        this.renderPlaylists();
      });
      this.dom.discoverNext?.addEventListener("click", () => this.discoverAndPlay());
      this.dom.discoverAuto?.addEventListener("click", () => this.toggleDiscoveryAuto());
      this.dom.newPlaylist?.addEventListener("click", () => this.createPlaylistPrompt());
      this.dom.playlistRename?.addEventListener("click", () => this.renameSelectedPlaylist());
      this.dom.playlistDelete?.addEventListener("click", () => this.deleteSelectedPlaylist());
      this.dom.playlistPlay?.addEventListener("click", () => this.playSelectedPlaylist());
      this.dom.currentAdd?.addEventListener("click", () => {
        if (!this.app.currentTrack) return this.app.showToast?.("当前还没有正在播放的歌曲");
        this.openAddModal(this.app.currentTrack);
      });
      this.root.querySelectorAll("[data-sjm-modal-close]").forEach(node => node.addEventListener("click", () => this.closeAddModal()));
      this.dom.modalCreate?.addEventListener("click", () => this.createAndAddFromModal());
      this.dom.modalName?.addEventListener("keydown", event => {
        if (event.key === "Enter") this.createAndAddFromModal();
      });
    }

    patchApp() {
      if (!this.app.__libraryRenderPatched) {
        this.app.__libraryRenderPatched = true;
        this.originalRenderTrackList = this.app.renderTrackList.bind(this.app);
        this.app.renderTrackList = (container, tracks) => {
          this.originalRenderTrackList(container, tracks);
          this.decorateRows(container, tracks || []);
          if (container === this.dom.playlistTracks) this.decoratePlaylistRemovals();
        };
      }

      if (!this.app.__libraryNextPatched) {
        this.app.__libraryNextPatched = true;
        this.originalNext = this.app.next.bind(this.app);
        this.app.next = (fromEnded = false) => {
          if (fromEnded && this.discoveryAuto) {
            this.discoverAndPlay();
            return;
          }
          return this.originalNext(fromEnded);
        };
      }
    }

    decorateExistingLists() {
      const mappings = [
        [this.app.dom.homeList, this.app.queue?.slice(0, 16) || []],
        [this.app.dom.queueList, this.app.queue || []],
        [this.app.dom.searchResults, this.app.searchResults || []],
        [this.app.dom.favoriteList, this.app.favorites || []],
        [this.app.dom.recentList, this.app.recent || []],
      ];
      mappings.forEach(([container, tracks]) => this.decorateRows(container, tracks));
    }

    decorateRows(container, tracks) {
      if (!container) return;
      container.querySelectorAll(".sjm-track-row").forEach(row => {
        if (row.querySelector(".sjm-row-playlist-action")) return;
        const track = tracks.find(item => item.key === row.dataset.trackKey) || this.findTrack(row.dataset.trackKey);
        if (!track) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sjm-row-playlist-action";
        button.title = "加入歌单";
        button.setAttribute("aria-label", `把 ${track.name || "歌曲"} 加入歌单`);
        button.textContent = "+";
        button.addEventListener("click", event => {
          event.stopPropagation();
          this.openAddModal(track);
        });
        row.appendChild(button);
      });
    }

    decoratePlaylistRemovals() {
      const playlist = this.selectedPlaylist();
      if (!playlist || !this.dom.playlistTracks) return;
      this.dom.playlistTracks.querySelectorAll(".sjm-track-row").forEach(row => {
        if (row.querySelector(".sjm-row-playlist-remove")) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sjm-row-playlist-remove";
        button.title = "从歌单移除";
        button.textContent = "×";
        button.addEventListener("click", event => {
          event.stopPropagation();
          playlist.tracks = playlist.tracks.filter(track => track.key !== row.dataset.trackKey);
          this.savePlaylists();
          this.renderPlaylists();
        });
        row.appendChild(button);
      });
    }

    findTrack(key) {
      const groups = [this.app.queue, this.app.searchResults, this.app.favorites, this.app.recent, this.discoveryHistory];
      for (const group of groups) {
        const found = Array.isArray(group) ? group.find(item => item.key === key) : null;
        if (found) return found;
      }
      for (const playlist of this.playlists) {
        const found = playlist.tracks?.find(item => item.key === key);
        if (found) return found;
      }
      return null;
    }

    selectedPlaylist() {
      return this.playlists.find(item => item.id === this.selectedPlaylistId) || null;
    }

    savePlaylists() {
      writeJSON(STORAGE.playlists, this.playlists);
      this.updateCounts();
    }

    updateCounts() {
      if (this.dom.playlistCount) this.dom.playlistCount.textContent = String(this.playlists.length);
    }

    makePlaylist(name) {
      const clean = String(name || "").trim().slice(0, 30);
      if (!clean) return null;
      const playlist = { id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: clean, createdAt: Date.now(), tracks: [] };
      this.playlists.unshift(playlist);
      this.selectedPlaylistId = playlist.id;
      this.savePlaylists();
      return playlist;
    }

    createPlaylistPrompt() {
      const name = window.prompt("给新歌单起个名字", "我的歌单");
      if (name === null) return;
      const playlist = this.makePlaylist(name);
      if (!playlist) return this.app.showToast?.("歌单名称不能为空");
      this.renderPlaylists();
      this.app.showToast?.(`已创建歌单「${playlist.name}」`);
    }

    renameSelectedPlaylist() {
      const playlist = this.selectedPlaylist();
      if (!playlist) return;
      const name = window.prompt("修改歌单名称", playlist.name);
      if (name === null) return;
      const clean = name.trim().slice(0, 30);
      if (!clean) return this.app.showToast?.("歌单名称不能为空");
      playlist.name = clean;
      this.savePlaylists();
      this.renderPlaylists();
    }

    deleteSelectedPlaylist() {
      const playlist = this.selectedPlaylist();
      if (!playlist) return;
      if (!window.confirm(`删除歌单「${playlist.name}」？歌单里的歌曲记录会一起删除。`)) return;
      this.playlists = this.playlists.filter(item => item.id !== playlist.id);
      this.selectedPlaylistId = this.playlists[0]?.id || "";
      this.savePlaylists();
      this.renderPlaylists();
    }

    renderPlaylists() {
      if (!this.dom.playlistGrid) return;
      this.dom.playlistGrid.innerHTML = "";
      if (!this.playlists.length) {
        this.dom.playlistGrid.innerHTML = '<button type="button" class="sjm-empty-playlist-card" id="sjm-empty-new-playlist"><strong>＋ 创建第一个歌单</strong><span>把随机听到或搜索到的好歌慢慢收进来</span></button>';
        this.root.querySelector("#sjm-empty-new-playlist")?.addEventListener("click", () => this.createPlaylistPrompt());
      } else {
        this.playlists.forEach(playlist => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `sjm-custom-playlist-card${playlist.id === this.selectedPlaylistId ? " active" : ""}`;
          button.innerHTML = `<span class="sjm-custom-playlist-icon">♫</span><span class="sjm-custom-playlist-copy"><strong>${esc(playlist.name)}</strong><small>${playlist.tracks?.length || 0} 首歌曲</small></span><span class="sjm-custom-playlist-arrow">›</span>`;
          button.addEventListener("click", () => {
            this.selectedPlaylistId = playlist.id;
            this.renderPlaylists();
          });
          this.dom.playlistGrid.appendChild(button);
        });
      }

      const selected = this.selectedPlaylist();
      if (!selected) {
        if (this.dom.playlistTitle) this.dom.playlistTitle.textContent = "还没有歌单";
        if (this.dom.playlistMeta) this.dom.playlistMeta.textContent = "新建一个歌单开始收藏喜欢的歌曲。";
        [this.dom.playlistPlay, this.dom.playlistRename, this.dom.playlistDelete].forEach(node => { if (node) node.disabled = true; });
        if (this.dom.playlistTracks) this.app.renderTrackList(this.dom.playlistTracks, []);
        return;
      }

      [this.dom.playlistPlay, this.dom.playlistRename, this.dom.playlistDelete].forEach(node => { if (node) node.disabled = false; });
      if (this.dom.playlistTitle) this.dom.playlistTitle.textContent = selected.name;
      if (this.dom.playlistMeta) this.dom.playlistMeta.textContent = `${selected.tracks.length} 首歌曲 · 保存在当前浏览器`;
      if (this.dom.playlistPlay) this.dom.playlistPlay.disabled = !selected.tracks.length;
      this.app.renderTrackList(this.dom.playlistTracks, selected.tracks || []);
      this.decoratePlaylistRemovals();
    }

    async addTrackToPlaylist(track, playlist) {
      if (!track || !playlist) return;
      this.app.showToast?.("正在准备歌曲信息…");
      const resolved = await resolveCatalogTrack(track);
      if (playlist.tracks.some(item => sameTrack(item, resolved))) {
        this.app.showToast?.(`「${resolved.name}」已经在「${playlist.name}」里`);
        return;
      }
      playlist.tracks.push(serializeTrack(resolved));
      this.savePlaylists();
      this.renderPlaylists();
      this.app.showToast?.(`已加入「${playlist.name}」`);
    }

    openAddModal(track) {
      if (!track) return;
      this.pendingTrack = track;
      if (!this.playlists.length) this.makePlaylist("我喜欢的");
      if (!this.dom.modal || !this.dom.modalTargets) return;
      this.dom.modalTargets.innerHTML = "";
      this.playlists.forEach(playlist => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sjm-playlist-target";
        button.innerHTML = `<span>♫</span><span><strong>${esc(playlist.name)}</strong><small>${playlist.tracks.length} 首歌曲</small></span><em>＋</em>`;
        button.addEventListener("click", async () => {
          await this.addTrackToPlaylist(this.pendingTrack, playlist);
          this.closeAddModal();
        });
        this.dom.modalTargets.appendChild(button);
      });
      this.dom.modal.hidden = false;
      requestAnimationFrame(() => this.dom.modal.classList.add("active"));
    }

    closeAddModal() {
      if (!this.dom.modal) return;
      this.dom.modal.classList.remove("active");
      setTimeout(() => { if (this.dom.modal) this.dom.modal.hidden = true; }, 180);
      this.pendingTrack = null;
    }

    async createAndAddFromModal() {
      const name = this.dom.modalName?.value.trim() || "";
      if (!name) return this.app.showToast?.("请输入歌单名称");
      const pendingTrack = this.pendingTrack;
      const playlist = this.makePlaylist(name);
      if (!playlist) return;
      if (this.dom.modalName) this.dom.modalName.value = "";
      await this.addTrackToPlaylist(pendingTrack, playlist);
      this.closeAddModal();
    }

    async playSelectedPlaylist() {
      const playlist = this.selectedPlaylist();
      if (!playlist?.tracks?.length) return;
      this.app.queue = playlist.tracks.map(serializeTrack);
      this.app.renderQueue?.();
      await this.app.playTrack(this.app.queue[0]);
      this.app.switchView("home");
      this.app.showToast?.(`正在播放「${playlist.name}」`);
    }

    toggleDiscoveryAuto() {
      this.discoveryAuto = !this.discoveryAuto;
      localStorage.setItem(STORAGE.discoveryAuto, this.discoveryAuto ? "1" : "0");
      if (this.dom.discoverAuto) this.dom.discoverAuto.textContent = `连续随机：${this.discoveryAuto ? "开" : "关"}`;
      this.dom.discoverAuto?.classList.toggle("active", this.discoveryAuto);
      this.app.showToast?.(this.discoveryAuto ? "连续随机已开启" : "连续随机已关闭");
    }

    async loadChart(chart) {
      if (this.chartCache.has(chart.id)) return this.chartCache.get(chart.id);
      const attempts = [
        { types: "playlist", source: "netease", id: chart.id },
        { types: "playlist", id: chart.id },
      ];
      for (const params of attempts) {
        try {
          const payload = await requestApi(params);
          const list = normalizeList(payload).map(raw => normalizeTrack({ ...raw, source: raw.source || "netease" }, "netease")).filter(track => track.id && track.name);
          if (list.length) {
            this.chartCache.set(chart.id, list);
            return list;
          }
        } catch (_) {}
      }
      return [];
    }

    async fallbackDiscovery() {
      const seed = DISCOVERY_SEEDS[Math.floor(Math.random() * DISCOVERY_SEEDS.length)];
      const payload = await requestApi({ types: "search", source: "netease", name: seed, count: 30, pages: 1 });
      return { label: `网易云 · ${seed}`, tracks: normalizeList(payload).map(raw => normalizeTrack({ ...raw, source: raw.source || "netease" }, "netease")).filter(track => track.id) };
    }

    pickRandom(tracks) {
      if (!tracks.length) return null;
      const recent = this.discoveryHistory.slice(0, 20);
      const candidates = tracks.filter(track => !recent.some(item => sameTrack(item, track)));
      const pool = candidates.length ? candidates : tracks;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    async discoverAndPlay() {
      if (this.discoveryBusy) return;
      this.discoveryBusy = true;
      if (this.dom.discoverNext) this.dom.discoverNext.disabled = true;
      if (this.dom.discoverStatus) this.dom.discoverStatus.textContent = "正在从网易云随机找歌…";
      try {
        const charts = [...NETEASE_CHARTS].sort(() => Math.random() - 0.5);
        let tracks = [];
        let label = "网易云随机发现";
        for (const chart of charts) {
          tracks = await this.loadChart(chart);
          if (tracks.length) { label = chart.name; break; }
        }
        if (!tracks.length) {
          const fallback = await this.fallbackDiscovery();
          tracks = fallback.tracks;
          label = fallback.label;
        }
        let track = this.pickRandom(tracks);
        if (!track) throw new Error("没有可用随机歌曲");
        track = await hydrateCover(track);
        this.discoveryHistory = [serializeTrack(track), ...this.discoveryHistory.filter(item => !sameTrack(item, track))].slice(0, DISCOVERY_LIMIT);
        writeJSON(STORAGE.discovery, this.discoveryHistory);
        this.renderDiscovery();
        if (this.dom.discoverRoute) this.dom.discoverRoute.textContent = label;
        if (this.dom.discoverStatus) this.dom.discoverStatus.textContent = `随机到：${track.name} · ${track.artist}`;
        await this.app.playTrack(track);
        setTimeout(() => this.app.switchView("discover"), 80);
      } catch (error) {
        console.warn("SmallJia Music discovery failed", error);
        if (this.dom.discoverStatus) this.dom.discoverStatus.textContent = "随机线路暂时不可用，可以稍后再试。";
        this.app.showToast?.("网易云随机听歌暂时不可用");
      } finally {
        this.discoveryBusy = false;
        if (this.dom.discoverNext) this.dom.discoverNext.disabled = false;
      }
    }

    renderDiscovery() {
      if (!this.dom.discoverList) return;
      this.app.renderTrackList(this.dom.discoverList, this.discoveryHistory || []);
      if (!this.discoveryHistory.length) {
        this.dom.discoverList.innerHTML = '<div class="sjm-library-empty"><strong>还没有随机记录</strong><span>点“随机来一首”，这里会留下最近发现的歌曲。</span></div>';
      }
      if (this.dom.discoverAuto) {
        this.dom.discoverAuto.textContent = `连续随机：${this.discoveryAuto ? "开" : "关"}`;
        this.dom.discoverAuto.classList.toggle("active", this.discoveryAuto);
      }
    }
  }

  const boot = () => {
    if (!window.location.pathname.startsWith("/music/")) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const app = window.SmallJiaMusic;
      if (app?.root && typeof app.renderTrackList === "function" && app.dom?.views) {
        clearInterval(timer);
        if (controller?.app === app) return;
        controller = new MusicLibraryController(app);
        controller.init();
        window.SmallJiaMusicLibrary = controller;
      }
      if (attempts > 120) clearInterval(timer);
    }, 100);
  };

  const destroy = () => {
    controller = null;
    window.SmallJiaMusicLibrary = null;
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
  document.addEventListener("pjax:send", destroy);
})();
