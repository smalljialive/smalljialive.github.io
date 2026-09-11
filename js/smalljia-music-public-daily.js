(function () {
  "use strict";

  const VERSION = "20260911-1";
  if (window.__smallJiaMusicPublicDailyVersion === VERSION) return;
  window.__smallJiaMusicPublicDailyVersion = VERSION;

  const TARGET_NAME = "日常";
  const SUPABASE_ROOT = "https://yluidpgnvfurcomnexjr.supabase.co";
  const SUPABASE_REST = `${SUPABASE_ROOT}/rest/v1`;
  const SUPABASE_KEY = "sb_publishable_ouIhEhTVrbsU98a0klTEdA_DEHjJvhT";
  const FALLBACK_COVER = "/img/music-placeholder.svg";

  let installedFor = null;
  let bootTimer = null;

  const normalize = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const publicHeaders = () => ({
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
  });

  const serializeTrack = row => ({
    id: row.source_track_id || "",
    server: row.source || "netease",
    source: row.source || "netease",
    name: row.name || "未知歌曲",
    artist: row.artist || "未知歌手",
    album: row.album || "",
    cover: row.cover || FALLBACK_COVER,
    url: "",
    lrc: "",
    key: row.track_key || `${row.name || "未知歌曲"}::${row.artist || "未知歌手"}`.toLowerCase(),
    __gdStudio: {
      source: row.source || "netease",
      urlId: row.url_id || row.source_track_id || "",
      lyricId: row.lyric_id || row.source_track_id || "",
      picId: row.pic_id || row.source_track_id || "",
    },
    __publicDaily: true,
  });

  const cloneTrack = track => ({
    ...track,
    __gdStudio: track?.__gdStudio ? { ...track.__gdStudio } : undefined,
    __publicDaily: true,
  });

  const fetchPublicDaily = async () => {
    const playlistUrl = `${SUPABASE_REST}/playlists?select=id,name&is_public=eq.true&name=eq.${encodeURIComponent(TARGET_NAME)}&limit=1`;
    const playlistResponse = await fetch(playlistUrl, {
      headers: publicHeaders(),
      credentials: "omit",
      cache: "no-store",
    });
    if (!playlistResponse.ok) throw new Error(`public playlist HTTP ${playlistResponse.status}`);
    const playlists = await playlistResponse.json();
    const playlist = Array.isArray(playlists) ? playlists[0] : null;
    if (!playlist?.id) return null;

    const fields = "track_key,source,source_track_id,name,artist,album,cover,lyric_id,pic_id,url_id,sort_order";
    const trackUrl = `${SUPABASE_REST}/playlist_tracks?select=${fields}&playlist_id=eq.${encodeURIComponent(playlist.id)}&order=sort_order.asc`;
    const trackResponse = await fetch(trackUrl, {
      headers: publicHeaders(),
      credentials: "omit",
      cache: "no-store",
    });
    if (!trackResponse.ok) throw new Error(`public tracks HTTP ${trackResponse.status}`);
    const rows = await trackResponse.json();
    const tracks = (Array.isArray(rows) ? rows : []).map(serializeTrack);
    if (!tracks.length) return null;

    return {
      id: `public:${playlist.id}`,
      cloudId: playlist.id,
      name: playlist.name || TARGET_NAME,
      createdAt: 0,
      tracks,
      __public: true,
      __readOnly: true,
    };
  };

  const install = async (root, app, library) => {
    if (installedFor === library) return;
    installedFor = library;

    let publicDaily = null;
    try {
      publicDaily = await fetchPublicDaily();
    } catch (error) {
      console.warn("SmallJia Music: public Daily fetch failed", error);
    }
    if (!publicDaily || installedFor !== library || !document.body.contains(root)) return;

    library.publicDaily = publicDaily;

    const hasLocalDaily = () => Array.isArray(library.playlists)
      && library.playlists.some(item => !item?.__public && normalize(item?.name) === normalize(TARGET_NAME));

    const localDaily = () => Array.isArray(library.playlists)
      ? library.playlists.find(item => !item?.__public && normalize(item?.name) === normalize(TARGET_NAME)) || null
      : null;

    const originalSelectedPlaylist = library.selectedPlaylist?.bind(library);
    const originalRenderPlaylists = library.renderPlaylists?.bind(library);
    const originalUpdateCounts = library.updateCounts?.bind(library);
    const originalDecorateRemovals = library.decoratePlaylistRemovals?.bind(library);
    const originalRename = library.renameSelectedPlaylist?.bind(library);
    const originalDelete = library.deleteSelectedPlaylist?.bind(library);
    const originalAddTrack = library.addTrackToPlaylist?.bind(library);

    library.selectedPlaylist = function () {
      if (this.selectedPlaylistId === publicDaily.id && !hasLocalDaily()) return publicDaily;
      return originalSelectedPlaylist ? originalSelectedPlaylist() : null;
    };

    library.updateCounts = function () {
      originalUpdateCounts?.();
      if (this.dom?.playlistCount) {
        this.dom.playlistCount.textContent = String((this.playlists?.length || 0) + (hasLocalDaily() ? 0 : 1));
      }
    };

    library.decoratePlaylistRemovals = function () {
      const selected = this.selectedPlaylist?.();
      if (selected?.__public) {
        this.dom?.playlistTracks?.querySelectorAll(".sjm-row-playlist-remove").forEach(node => node.remove());
        return;
      }
      originalDecorateRemovals?.();
    };

    library.renameSelectedPlaylist = function () {
      if (this.selectedPlaylist?.()?.__public) {
        this.app?.showToast?.("公开歌单为只读，不能重命名");
        return;
      }
      return originalRename?.();
    };

    library.deleteSelectedPlaylist = function () {
      if (this.selectedPlaylist?.()?.__public) {
        this.app?.showToast?.("公开歌单会一直保留给访客，不能删除");
        return;
      }
      return originalDelete?.();
    };

    library.addTrackToPlaylist = async function (track, playlist) {
      if (playlist?.__public) {
        this.app?.showToast?.("公开歌单为只读，请加入你自己的歌单");
        return;
      }
      return originalAddTrack?.(track, playlist);
    };

    library.renderPlaylists = function () {
      const ownDaily = localDaily();
      if (ownDaily && this.selectedPlaylistId === publicDaily.id) this.selectedPlaylistId = ownDaily.id;
      if (!ownDaily && !this.selectedPlaylistId) this.selectedPlaylistId = publicDaily.id;

      originalRenderPlaylists?.();

      if (!ownDaily && this.dom?.playlistGrid) {
        let card = this.dom.playlistGrid.querySelector('[data-sjm-public-daily="true"]');
        if (!card) {
          card = document.createElement("button");
          card.type = "button";
          card.dataset.sjmPublicDaily = "true";
          card.className = "sjm-custom-playlist-card";
          card.innerHTML = `<span class="sjm-custom-playlist-icon">☁</span><span class="sjm-custom-playlist-copy"><strong>${TARGET_NAME}</strong><small>公开歌单 · ${publicDaily.tracks.length} 首歌曲</small></span><span class="sjm-custom-playlist-arrow">›</span>`;
          card.addEventListener("click", () => {
            this.selectedPlaylistId = publicDaily.id;
            this.renderPlaylists();
          });
          this.dom.playlistGrid.prepend(card);
        }
        card.classList.toggle("active", this.selectedPlaylistId === publicDaily.id);
      }

      const selected = this.selectedPlaylist?.();
      if (selected?.__public) {
        if (this.dom?.playlistMeta) this.dom.playlistMeta.textContent = `${selected.tracks.length} 首歌曲 · SmallJia 公开歌单 · 所有人可见`;
        if (this.dom?.playlistRename) this.dom.playlistRename.disabled = true;
        if (this.dom?.playlistDelete) this.dom.playlistDelete.disabled = true;
        if (this.dom?.playlistPlay) this.dom.playlistPlay.disabled = !selected.tracks.length;
      }
      this.updateCounts?.();
    };

    const installDefaultQueue = () => {
      if (Array.isArray(app.queue) && app.queue.length) return false;
      app.queue = publicDaily.tracks.map(cloneTrack);
      app.currentIndex = -1;
      app.currentTrack = null;
      app.lyrics = [];
      app.currentLyricIndex = -1;
      app.root?.setAttribute("data-default-playlist", "public-daily");
      app.root?.setAttribute("data-public-daily-default", "true");
      app.renderQueue?.();
      app.setNowPlaceholder?.("选择一首歌开始播放", "SmallJia 公开歌单 · 日常");

      const homeList = app.dom?.homeList || root.querySelector("#sjm-home-list");
      const section = homeList?.closest(".sjm-section");
      const title = section?.querySelector(".sjm-section-head h3");
      if (title) title.textContent = `公开歌单 · ${TARGET_NAME}`;

      const queueView = root.querySelector('[data-sjm-view="queue"] .sjm-page-head p');
      if (queueView) queueView.textContent = `默认显示 SmallJia 公开「${TARGET_NAME}」歌单；从其他列表点歌后会切换到对应播放上下文。`;

      const chip = app.dom?.sourceChip?.querySelector("span:last-child");
      if (chip) chip.textContent = `公开歌单 · ${TARGET_NAME}`;
      return true;
    };

    installDefaultQueue();
    library.renderPlaylists?.();

    const patchPlaybackContext = () => {
      const context = window.SmallJiaMusicPlaybackContext;
      if (!context || context.library !== library || context.__publicDailyPatched) return false;
      context.__publicDailyPatched = true;
      const originalTracksForContext = context.tracksForContext.bind(context);
      context.tracksForContext = function () {
        if (this.context?.source === "playlist" && this.context?.playlistId === publicDaily.id && !hasLocalDaily()) {
          return publicDaily.tracks;
        }
        return originalTracksForContext();
      };
      return true;
    };

    if (!patchPlaybackContext()) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        if (patchPlaybackContext() || attempts > 100 || !document.body.contains(root)) clearInterval(timer);
      }, 100);
    }

    window.SmallJiaMusicPublicDaily = {
      playlist: publicDaily,
      refresh: async () => {
        const fresh = await fetchPublicDaily();
        if (!fresh) return null;
        publicDaily = fresh;
        library.publicDaily = fresh;
        if (root.dataset.publicDailyDefault === "true") {
          app.queue = fresh.tracks.map(cloneTrack);
          app.renderQueue?.();
        }
        library.renderPlaylists?.();
        return fresh;
      },
    };
  };

  const boot = () => {
    if (!window.location.pathname.startsWith("/music/")) return;
    const root = document.getElementById("anMusic-page");
    if (!root) return;

    clearInterval(bootTimer);
    let attempts = 0;
    bootTimer = setInterval(() => {
      attempts += 1;
      const app = window.SmallJiaMusic;
      const library = window.SmallJiaMusicLibrary;
      if (app?.root === root && library?.app === app) {
        clearInterval(bootTimer);
        bootTimer = null;
        install(root, app, library);
        return;
      }
      if (attempts > 160 || !document.body.contains(root)) {
        clearInterval(bootTimer);
        bootTimer = null;
      }
    }, 100);
  };

  const destroy = () => {
    clearInterval(bootTimer);
    bootTimer = null;
    installedFor = null;
    window.SmallJiaMusicPublicDaily = null;
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", () => setTimeout(boot, 0));
  document.addEventListener("pjax:send", destroy);
})();
