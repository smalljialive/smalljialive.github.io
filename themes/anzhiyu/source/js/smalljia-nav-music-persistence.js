(function () {
  "use strict";

  const VERSION = "20260910-1";
  if (window.__smallJiaNavMusicPersistenceVersion === VERSION) return;
  window.__smallJiaNavMusicPersistenceVersion = VERSION;

  const MUSIC_PATH_RE = /^\/music(?:\/|$)/i;

  const getNavMeting = () => document.querySelector("#nav-music meting-js");

  const getNavPlayer = () => {
    const meting = getNavMeting();
    if (meting?.aplayer) return meting.aplayer;

    const nav = document.getElementById("nav-music");
    if (!nav || !Array.isArray(window.aplayers)) return null;
    return window.aplayers.find(player => {
      if (!player) return false;
      const container = player.container || player.template?.container || null;
      const audio = player.audio || null;
      return (container instanceof Node && nav.contains(container)) || (audio instanceof Node && nav.contains(audio));
    }) || null;
  };

  const pauseNavMusic = reason => {
    const player = getNavPlayer();
    if (!player) return false;

    try {
      if (player.audio && !player.audio.paused) player.pause?.();
      else if (!player.audio && typeof player.pause === "function") player.pause();

      const nav = document.getElementById("nav-music");
      nav?.classList.remove("stretch");
      if (reason) nav?.setAttribute("data-smalljia-paused-by", reason);
      return true;
    } catch (error) {
      console.warn("SmallJia nav music: pause failed", error);
      return false;
    }
  };

  const isMusicPage = () => MUSIC_PATH_RE.test(window.location.pathname || "");

  const pauseForCurrentRoute = () => {
    if (isMusicPage()) pauseNavMusic("music-page");
  };

  const isEssayMediaTarget = target => {
    if (!(target instanceof Element)) return false;
    const essay = target.closest("#essay_page");
    if (!essay) return false;
    return !!(
      target.closest(".bber-content-video") ||
      target.closest("video") ||
      target.closest(".bber-music")
    );
  };

  const anchorGoesToMusic = target => {
    if (!(target instanceof Element)) return false;
    const anchor = target.closest("a[href]");
    if (!anchor) return false;
    try {
      const url = new URL(anchor.href, window.location.href);
      return url.origin === window.location.origin && MUSIC_PATH_RE.test(url.pathname);
    } catch (_) {
      return false;
    }
  };

  const onDocumentClick = event => {
    if (anchorGoesToMusic(event.target)) {
      pauseNavMusic("music-page");
      return;
    }
    if (isEssayMediaTarget(event.target)) pauseNavMusic("essay-media");
  };

  const onMediaPlay = event => {
    const media = event.target;
    if (!(media instanceof HTMLMediaElement)) return;
    const nav = document.getElementById("nav-music");
    if (nav?.contains(media)) return;

    if (isMusicPage() || media.closest?.("#essay_page")) {
      pauseNavMusic(isMusicPage() ? "music-page" : "essay-media");
    }
  };

  const boot = () => {
    pauseForCurrentRoute();
  };

  document.addEventListener("click", onDocumentClick, true);
  document.addEventListener("play", onMediaPlay, true);
  document.addEventListener("pjax:complete", () => setTimeout(boot, 0));
  window.addEventListener("popstate", () => setTimeout(boot, 0));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    setTimeout(boot, 0);
  }

  window.SmallJiaNavMusicPersistence = {
    version: VERSION,
    getPlayer: getNavPlayer,
    pause: pauseNavMusic,
    pauseForCurrentRoute,
  };
})();
