(function () {
  "use strict";

  const VERSION = "20260911-1";
  if (window.__smallJiaMusicPlaybackContextVersion === VERSION) return;
  window.__smallJiaMusicPlaybackContextVersion = VERSION;

  let controller = null;
  let bootTimer = null;

  const normalizeText = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const sameTrack = (a, b) => {
    if (!a || !b) return false;
    if (a.key && b.key && String(a.key) === String(b.key)) return true;
    const aId = String(a.id || a.songid || a.songId || "");
    const bId = String(b.id || b.songid || b.songId || "");
    const aSource = String(a.server || a.source || "netease").toLowerCase();
    const bSource = String(b.server || b.source || "netease").toLowerCase();
    if (aId && bId && aId === bId && aSource === bSource) return true;
    return normalizeText(a.name || a.title) === normalizeText(b.name || b.title)
      && normalizeText(a.artist || a.author) === normalizeText(b.artist || b.author);
  };

  class PlaybackContextController {
    constructor(root, app, library) {
      this.root = root;
      this.app = app;
      this.library = library;
      this.context = { mode: "sequence", source: "queue", playlistId: "" };
      this.originalNext = app.next.bind(app);
      this.originalPrevious = app.previous.bind(app);
      this.nativeNext = typeof library.originalNext === "function"
        ? library.originalNext
        : this.originalNext;
      this.originalDiscoverAndPlay = typeof library.discoverAndPlay === "function"
        ? library.discoverAndPlay.bind(library)
        : null;
      this.wrappedDiscoverAndPlay = null;
      this.onRootClick = event => this.capturePlaybackOrigin(event);
    }

    init() {
      this.root.addEventListener("click", this.onRootClick, true);
      this.patchDiscovery();
      this.patchNavigation();
      this.publishContext();
    }

    patchDiscovery() {
      if (!this.originalDiscoverAndPlay) return;
      this.wrappedDiscoverAndPlay = (...args) => {
        this.setDiscoverContext();
        return this.originalDiscoverAndPlay(...args);
      };
      this.library.discoverAndPlay = this.wrappedDiscoverAndPlay;
    }

    patchNavigation() {
      const owner = this;
      this.app.next = function (fromEnded = false) {
        return owner.next(fromEnded);
      };
      this.app.previous = function () {
        return owner.previous();
      };
      this.app.__playbackContextController = this;
    }

    publishContext() {
      this.root.dataset.playbackContext = this.context.mode === "discover"
        ? "discover"
        : this.context.source;
      window.SmallJiaMusicPlaybackContext = this;
    }

    setDiscoverContext() {
      this.context = { mode: "discover", source: "discover", playlistId: "" };
      this.publishContext();
    }

    setSequenceContext(source, playlistId = "") {
      this.context = { mode: "sequence", source, playlistId };
      this.publishContext();
    }

    capturePlaybackOrigin(event) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (target.closest("#sjm-discover-next")) {
        this.setDiscoverContext();
        return;
      }

      if (target.closest("#sjm-play-custom-playlist")) {
        this.setSequenceContext("playlist", this.library.selectedPlaylistId || "");
        return;
      }

      if (target.closest("#sjm-shuffle")) {
        this.setSequenceContext("queue");
        return;
      }

      const playTarget = target.closest(".sjm-track-cover, .sjm-track-meta");
      if (!playTarget) return;
      const row = playTarget.closest(".sjm-track-row");
      if (!row) return;

      const container = row.parentElement;
      if (!container) return;

      switch (container.id) {
        case "sjm-custom-playlist-tracks":
          this.setSequenceContext("playlist", this.library.selectedPlaylistId || "");
          break;
        case "sjm-discovery-list":
          this.setDiscoverContext();
          break;
        case "sjm-search-results":
          this.setSequenceContext("search");
          break;
        case "sjm-favorite-list":
          this.setSequenceContext("favorites");
          break;
        case "sjm-recent-list":
          this.setSequenceContext("recent");
          break;
        case "sjm-home-list":
        case "sjm-queue-list":
          this.setSequenceContext("queue");
          break;
        default:
          break;
      }
    }

    tracksForContext() {
      const source = this.context.source;
      if (source === "playlist") {
        const id = this.context.playlistId;
        const playlist = Array.isArray(this.library.playlists)
          ? this.library.playlists.find(item => item?.id === id)
          : null;
        return Array.isArray(playlist?.tracks) ? playlist.tracks : [];
      }
      if (source === "search") return Array.isArray(this.app.searchResults) ? this.app.searchResults : [];
      if (source === "favorites") return Array.isArray(this.app.favorites) ? this.app.favorites : [];
      if (source === "recent") return Array.isArray(this.app.recent) ? this.app.recent : [];
      return Array.isArray(this.app.queue) ? this.app.queue : [];
    }

    findCurrentIndex(tracks) {
      const current = this.app.currentTrack;
      if (!current || !tracks.length) return -1;
      return tracks.findIndex(track => sameTrack(track, current));
    }

    async playContextOffset(offset, fromEnded = false) {
      const tracks = this.tracksForContext();
      if (!tracks.length) return false;
      const currentIndex = this.findCurrentIndex(tracks);
      if (currentIndex < 0) return false;
      const nextIndex = (currentIndex + offset + tracks.length) % tracks.length;
      const track = tracks[nextIndex];
      if (!track) return false;
      await this.app.playTrack(track);
      if (!fromEnded) {
        this.app.showToast?.(offset > 0 ? "已切换到下一首" : "已切换到上一首");
      }
      return true;
    }

    async next(fromEnded = false) {
      if (this.context.mode === "discover") {
        if (!fromEnded || this.library.discoveryAuto) {
          await this.library.discoverAndPlay?.();
        }
        return;
      }

      if (await this.playContextOffset(1, fromEnded)) return;
      return this.nativeNext(fromEnded);
    }

    async previous() {
      if (this.context.mode === "sequence" && await this.playContextOffset(-1, false)) return;
      return this.originalPrevious();
    }

    destroy() {
      this.root.removeEventListener("click", this.onRootClick, true);
      if (this.app.__playbackContextController === this) {
        this.app.next = this.originalNext;
        this.app.previous = this.originalPrevious;
        delete this.app.__playbackContextController;
      }
      if (this.wrappedDiscoverAndPlay && this.library.discoverAndPlay === this.wrappedDiscoverAndPlay && this.originalDiscoverAndPlay) {
        this.library.discoverAndPlay = this.originalDiscoverAndPlay;
      }
      if (window.SmallJiaMusicPlaybackContext === this) window.SmallJiaMusicPlaybackContext = null;
    }
  }

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
        if (controller?.root === root && controller.app === app) return;
        controller?.destroy();
        controller = new PlaybackContextController(root, app, library);
        controller.init();
        return;
      }
      if (attempts >= 120 || !document.body.contains(root)) {
        clearInterval(bootTimer);
        bootTimer = null;
      }
    }, 100);
  };

  const destroy = () => {
    clearInterval(bootTimer);
    bootTimer = null;
    controller?.destroy();
    controller = null;
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", () => setTimeout(boot, 0));
  document.addEventListener("pjax:send", destroy);
})();
