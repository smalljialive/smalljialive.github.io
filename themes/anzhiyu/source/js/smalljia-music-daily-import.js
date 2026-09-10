(function () {
  "use strict";

  const MIGRATION_KEY = "smalljia_music_queue_to_daily_v1";
  const TARGET_NAME = "日常";

  const normalize = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

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
    if (a.key && b.key && a.key === b.key) return true;
    if (a.id && b.id && String(a.id) === String(b.id) && String(a.server || a.source || "netease") === String(b.server || b.source || "netease")) return true;
    return normalize(a.name) === normalize(b.name) && normalize(a.artist) === normalize(b.artist);
  };

  const migrate = () => {
    if (localStorage.getItem(MIGRATION_KEY) === "1") return true;

    const app = window.SmallJiaMusic;
    const library = window.SmallJiaMusicLibrary;
    if (!app || !library || !Array.isArray(app.queue) || !app.queue.length) return false;
    if (!app.__personalCatalogInstalled && app.root?.getAttribute("data-default-playlist") !== "personal-97") return false;
    if (!Array.isArray(library.playlists)) return false;

    let playlist = library.playlists.find(item => normalize(item?.name) === normalize(TARGET_NAME));
    if (!playlist) {
      if (typeof library.makePlaylist === "function") playlist = library.makePlaylist(TARGET_NAME);
      if (!playlist) {
        playlist = {
          id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: TARGET_NAME,
          createdAt: Date.now(),
          tracks: [],
        };
        library.playlists.unshift(playlist);
      }
    }

    if (!Array.isArray(playlist.tracks)) playlist.tracks = [];

    let added = 0;
    app.queue.forEach(track => {
      const item = serializeTrack(track);
      if (!playlist.tracks.some(existing => sameTrack(existing, item))) {
        playlist.tracks.push(item);
        added += 1;
      }
    });

    library.selectedPlaylistId = playlist.id;
    if (typeof library.savePlaylists === "function") library.savePlaylists();
    else {
      try { localStorage.setItem("smalljia_music_custom_playlists_v1", JSON.stringify(library.playlists)); } catch (_) {}
    }
    if (typeof library.renderPlaylists === "function") library.renderPlaylists();

    localStorage.setItem(MIGRATION_KEY, "1");
    app.showToast?.(added > 0
      ? `已将播放队列 ${added} 首歌曲加入「${TARGET_NAME}」`
      : `播放队列歌曲已全部在「${TARGET_NAME}」中`);
    return true;
  };

  const boot = () => {
    if (localStorage.getItem(MIGRATION_KEY) === "1") return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (migrate() || attempts > 150) clearInterval(timer);
    }, 100);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
})();
