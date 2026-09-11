(function () {
  "use strict";

  const VERSION = "20260911-1";
  if (window.__smallJiaNavMusicHoverVersion === VERSION) return;
  window.__smallJiaNavMusicHoverVersion = VERSION;

  const STYLE_ID = "smalljia-nav-music-hover-style";
  let retryTimer = null;
  let retryIndex = 0;
  const RETRY_DELAYS = [300, 900, 1800];

  const installStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* SmallJia: nav music stays compact while playing; hover alone expands it. */
      #nav-music.playing {
        animation: none !important;
        border: 0 !important;
        box-shadow: var(--anzhiyu-shadow-border) !important;
      }

      #nav-music.playing .aplayer {
        background: var(--card-bg) !important;
        border: var(--style-border) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        transform: none !important;
      }

      #nav-music.playing .aplayer.aplayer-withlrc .aplayer-info {
        color: var(--anzhiyu-fontcolor) !important;
      }

      #nav-music.playing .aplayer.aplayer-withlrc .aplayer-pic {
        box-shadow: none !important;
        transform: rotate(0deg) scale(1) !important;
        border: var(--style-border-always) !important;
        animation-play-state: paused !important;
      }

      /* Keep playback progress visible on the white compact player. */
      #nav-music .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played,
      #nav-music.playing .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played {
        background: var(--anzhiyu-main) !important;
        background-color: var(--anzhiyu-main) !important;
        opacity: 0.2 !important;
        animation: none !important;
        animation-play-state: paused !important;
      }

      #nav-music:hover .aplayer .aplayer-info .aplayer-controller .aplayer-bar-wrap .aplayer-bar .aplayer-played {
        opacity: 0.26 !important;
      }

      #nav-music #nav-music-hoverTips {
        display: none !important;
      }

      #nav-music:not(:hover) .aplayer.aplayer-withlrc .aplayer-lrc,
      #nav-music.stretch:not(:hover) .aplayer.aplayer-withlrc .aplayer-lrc {
        width: 0 !important;
        min-width: 0 !important;
        margin-left: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        opacity: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }

      #nav-music:hover .aplayer.aplayer-withlrc .aplayer-lrc {
        width: 200px !important;
        min-width: 200px !important;
        margin-left: 8px !important;
        opacity: 1 !important;
        overflow: hidden !important;
        pointer-events: auto !important;
      }

      #nav-music:hover .aplayer .aplayer-lrc p {
        color: var(--anzhiyu-secondtext) !important;
      }

      #nav-music:hover .aplayer .aplayer-lrc p.aplayer-lrc-current {
        color: var(--anzhiyu-main) !important;
      }
    `;
    document.head.appendChild(style);
  };

  const bind = () => {
    installStyle();
    const nav = document.getElementById("nav-music");
    if (!nav) return false;
    if (nav.dataset.smalljiaHoverBound === VERSION) return true;
    nav.dataset.smalljiaHoverBound = VERSION;

    const collapse = () => nav.classList.remove("stretch");
    const expand = () => nav.classList.add("stretch");

    nav.addEventListener("mouseenter", expand, { passive: true });
    nav.addEventListener("mouseleave", collapse, { passive: true });

    const observer = new MutationObserver(() => {
      if (!nav.matches(":hover") && nav.classList.contains("stretch")) {
        nav.classList.remove("stretch");
      }
    });
    observer.observe(nav, { attributes: true, attributeFilter: ["class"] });

    if (!nav.matches(":hover")) collapse();
    return true;
  };

  const stopRetry = () => {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    retryIndex = 0;
  };

  const scheduleBind = () => {
    stopRetry();
    if (bind()) return;

    const tryBind = () => {
      if (bind()) {
        stopRetry();
        return;
      }
      if (retryIndex >= RETRY_DELAYS.length) {
        stopRetry();
        return;
      }
      retryTimer = setTimeout(tryBind, RETRY_DELAYS[retryIndex++]);
    };

    retryTimer = setTimeout(tryBind, RETRY_DELAYS[retryIndex++]);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleBind, { once: true });
  } else {
    scheduleBind();
  }

  document.addEventListener("pjax:complete", () => setTimeout(scheduleBind, 0));
})();
