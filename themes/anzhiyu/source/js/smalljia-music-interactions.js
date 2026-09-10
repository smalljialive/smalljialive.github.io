(function () {
  "use strict";

  const VERSION = "20260910-1";
  if (window.__smallJiaMusicInteractionsVersion === VERSION) return;
  window.__smallJiaMusicInteractionsVersion = VERSION;

  const STYLE_ID = "smalljia-music-interactions-style";
  let observer = null;
  let rafId = 0;

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #anMusic-page .sjm-track-row.sjm-row-actions-grouped {
        grid-template-columns: 50px minmax(0, 1fr) auto !important;
      }
      #anMusic-page .sjm-row-actions-cluster {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        min-width: max-content;
        margin-left: 4px;
      }
      #anMusic-page .sjm-row-actions-cluster .sjm-track-source,
      #anMusic-page .sjm-row-actions-cluster .sjm-row-action,
      #anMusic-page .sjm-row-actions-cluster .sjm-row-playlist-action,
      #anMusic-page .sjm-row-actions-cluster .sjm-row-playlist-remove {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      #anMusic-page .sjm-row-actions-cluster .sjm-row-playlist-action {
        order: 2;
      }
      #anMusic-page .sjm-row-actions-cluster .sjm-row-playlist-remove {
        order: 2;
      }
      #anMusic-page .sjm-row-actions-cluster .sjm-track-source {
        order: 1;
      }
      #anMusic-page .sjm-row-actions-cluster .sjm-row-action {
        order: 3;
      }
      @media screen and (max-width: 520px) {
        #anMusic-page .sjm-track-row.sjm-row-actions-grouped {
          grid-template-columns: 44px minmax(0, 1fr) auto !important;
        }
        #anMusic-page .sjm-row-actions-cluster {
          gap: 4px;
          margin-left: 2px;
        }
        #anMusic-page .sjm-row-actions-cluster .sjm-track-source {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const groupRowActions = root => {
    if (!root) return;
    root.querySelectorAll(".sjm-track-row").forEach(row => {
      let cluster = Array.from(row.children).find(child => child.classList?.contains("sjm-row-actions-cluster"));
      const actions = Array.from(row.children).filter(child => child.matches?.(
        ".sjm-track-source, .sjm-row-action, .sjm-row-playlist-action, .sjm-row-playlist-remove"
      ));
      if (!actions.length && !cluster) return;
      if (!cluster) {
        cluster = document.createElement("div");
        cluster.className = "sjm-row-actions-cluster";
        cluster.setAttribute("aria-label", "歌曲操作");
        row.appendChild(cluster);
      }
      actions.forEach(action => cluster.appendChild(action));
      row.classList.add("sjm-row-actions-grouped");
    });
  };

  const scheduleGrouping = root => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => groupRowActions(root));
  };

  const installRowObserver = root => {
    if (observer) observer.disconnect();
    groupRowActions(root);
    observer = new MutationObserver(() => scheduleGrouping(root));
    observer.observe(root, { childList: true, subtree: true });
  };

  const isTypingTarget = target => {
    if (!(target instanceof Element)) return false;
    return !!target.closest("input, textarea, select, button, a, [contenteditable='true'], [role='textbox']");
  };

  const hasOpenDialog = () => {
    const auth = document.getElementById("sjm-auth-modal");
    if (auth && !auth.hidden) return true;
    const playlist = document.querySelector(".sjm-playlist-modal.active:not([hidden])");
    return !!playlist;
  };

  const onKeyDown = event => {
    if (event.code !== "Space" && event.key !== " ") return;
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const root = document.getElementById("anMusic-page");
    if (!root || isTypingTarget(event.target) || hasOpenDialog()) return;
    const app = window.SmallJiaMusic;
    if (!app || typeof app.togglePlay !== "function") return;
    event.preventDefault();
    app.togglePlay();
  };

  const boot = () => {
    const root = document.getElementById("anMusic-page");
    if (!root) return;
    ensureStyle();
    installRowObserver(root);
  };

  if (!window.__smallJiaMusicSpacebarBound) {
    window.__smallJiaMusicSpacebarBound = true;
    document.addEventListener("keydown", onKeyDown, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", () => setTimeout(boot, 0));
})();
