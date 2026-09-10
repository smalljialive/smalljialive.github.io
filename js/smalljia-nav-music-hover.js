(function () {
  "use strict";

  const VERSION = "20260910-2";
  if (window.__smallJiaNavMusicHoverVersion === VERSION) return;
  window.__smallJiaNavMusicHoverVersion = VERSION;

  const STYLE_ID = "smalljia-nav-music-hover-style";

  const installStyle = () => {
    const oldStyle = document.getElementById(STYLE_ID);
    if (oldStyle) oldStyle.remove();
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
    if (!nav || nav.dataset.smalljiaHoverBound === VERSION) return;
    nav.dataset.smalljiaHoverBound = VERSION;

    const collapse = () => nav.classList.remove("stretch");
    const expand = () => nav.classList.add("stretch");

    nav.addEventListener("mouseenter", expand);
    nav.addEventListener("mouseleave", collapse);

    const observer = new MutationObserver(() => {
      if (!nav.matches(":hover") && nav.classList.contains("stretch")) {
        nav.classList.remove("stretch");
      }
    });
    observer.observe(nav, { attributes: true, attributeFilter: ["class"] });

    if (!nav.matches(":hover")) collapse();
  };

  const boot = () => {
    installStyle();
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      bind();
      if (document.getElementById("nav-music") || tries > 100) clearInterval(timer);
    }, 100);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  document.addEventListener("pjax:complete", () => setTimeout(bind, 0));
})();
