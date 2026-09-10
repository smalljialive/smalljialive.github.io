(function () {
  "use strict";

  const VERSION = "20260910-2";
  if (window.__smallJiaMusicInteractionsVersion === VERSION) return;
  window.__smallJiaMusicInteractionsVersion = VERSION;

  const STYLE_ID = "smalljia-music-interactions-style";
  let observer = null;
  let rafId = 0;

  const ensureStyle = () => {
    const existing = document.getElementById(STYLE_ID);
    if (existing) existing.remove();
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
      #anMusic-page .sjm-row-actions-cluster .sjm-row-playlist-action,
      #anMusic-page .sjm-row-actions-cluster .sjm-row-playlist-remove {
        order: 2;
      }
      #anMusic-page .sjm-row-actions-cluster .sjm-track-source {
        order: 1;
      }
      #anMusic-page .sjm-row-actions-cluster .sjm-row-action {
        order: 3;
      }
      #anMusic-page .sjm-player-extra {
        grid-template-columns: 22px minmax(70px, 1fr) 42px !important;
        gap: 8px !important;
      }
      #anMusic-page .sjm-volume-value {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 38px;
        height: 25px;
        padding: 0 6px;
        border: 1px solid rgba(74, 92, 134, .08);
        border-radius: 8px;
        background: rgba(67, 87, 130, .055);
        color: #69778d;
        font-family: inherit;
        font-size: 10px;
        font-weight: 750;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        letter-spacing: .01em;
        white-space: nowrap;
        transition: .15s ease;
      }
      #anMusic-page .sjm-player-extra:focus-within .sjm-volume-value {
        border-color: rgba(66, 90, 239, .16);
        background: rgba(66, 90, 239, .075);
        color: #425aef;
      }
      [data-theme='dark'] #anMusic-page .sjm-volume-value {
        border-color: rgba(255,255,255,.08);
        background: rgba(255,255,255,.06);
        color: rgba(255,255,255,.62);
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

  const closeSourceMenus = except => {
    document.querySelectorAll(".sjm-source-select-wrap.sjm-source-customized.open").forEach(wrap => {
      if (wrap !== except) {
        wrap.classList.remove("open");
        wrap.querySelector(".sjm-source-trigger")?.setAttribute("aria-expanded", "false");
      }
    });
  };

  const setupSourceMenu = root => {
    const wrap = root?.querySelector(".sjm-source-select-wrap");
    const select = wrap?.querySelector("#sjm-source-select");
    if (!wrap || !select) return;

    if (!wrap.classList.contains("sjm-source-customized")) {
      wrap.classList.add("sjm-source-customized");
      select.classList.add("sjm-source-native-select");
      select.tabIndex = -1;

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "sjm-source-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");
      trigger.innerHTML = '<span class="sjm-source-trigger-icon">♫</span><span class="sjm-source-trigger-label"></span><span class="sjm-source-trigger-arrow">⌄</span>';

      const menu = document.createElement("div");
      menu.className = "sjm-source-menu";
      menu.setAttribute("role", "listbox");
      Array.from(select.options).forEach(option => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "sjm-source-option";
        item.dataset.value = option.value;
        item.setAttribute("role", "option");
        item.textContent = option.textContent || option.value;
        menu.appendChild(item);
      });

      wrap.append(trigger, menu);

      const sync = () => {
        const selected = select.options[select.selectedIndex];
        const label = trigger.querySelector(".sjm-source-trigger-label");
        if (label) label.textContent = selected?.textContent || "自动选源";
        menu.querySelectorAll(".sjm-source-option").forEach(item => {
          const active = item.dataset.value === select.value;
          item.classList.toggle("active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
        });
      };

      trigger.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const nextOpen = !wrap.classList.contains("open");
        closeSourceMenus(wrap);
        wrap.classList.toggle("open", nextOpen);
        trigger.setAttribute("aria-expanded", nextOpen ? "true" : "false");
      });

      menu.addEventListener("click", event => {
        const item = event.target.closest(".sjm-source-option");
        if (!item) return;
        event.preventDefault();
        event.stopPropagation();
        if (select.value !== item.dataset.value) {
          select.value = item.dataset.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        sync();
        wrap.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      });

      select.addEventListener("change", sync);
      window.addEventListener("smalljia:music-source-change", sync);
      sync();
    }
  };

  const bindVolumeValue = root => {
    const input = root?.querySelector("#sjm-volume");
    const container = input?.closest(".sjm-player-extra");
    if (!input || !container) return;

    let value = container.querySelector("#sjm-volume-value");
    if (!value) {
      value = document.createElement("span");
      value.id = "sjm-volume-value";
      value.className = "sjm-volume-value";
      value.setAttribute("aria-live", "polite");
      value.setAttribute("aria-label", "当前音量");
      container.appendChild(value);
    }

    const sync = () => {
      const numeric = Math.max(0, Math.min(100, Math.round(Number(input.value) || 0)));
      value.textContent = `${numeric}%`;
      value.title = `当前音量 ${numeric}%`;
    };

    if (!input.dataset.sjmVolumeValueBound) {
      input.dataset.sjmVolumeValueBound = "1";
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
    }

    const audio = window.SmallJiaMusic?.audio;
    if (audio && !audio.__sjmVolumeValueBound) {
      audio.__sjmVolumeValueBound = true;
      audio.addEventListener("volumechange", () => {
        const numeric = Math.round(Math.max(0, Math.min(1, audio.volume)) * 100);
        input.value = String(numeric);
        sync();
      });
    }

    sync();
    setTimeout(sync, 150);
  };

  const enhanceUi = root => {
    if (!root) return;
    groupRowActions(root);
    setupSourceMenu(root);
    bindVolumeValue(root);
  };

  const scheduleEnhance = root => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => enhanceUi(root));
  };

  const installObserver = root => {
    if (observer) observer.disconnect();
    enhanceUi(root);
    observer = new MutationObserver(() => scheduleEnhance(root));
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
    installObserver(root);
  };

  if (!window.__smallJiaMusicSpacebarBound) {
    window.__smallJiaMusicSpacebarBound = true;
    document.addEventListener("keydown", onKeyDown, true);
  }

  if (!window.__smallJiaMusicSourceMenuGlobalBound) {
    window.__smallJiaMusicSourceMenuGlobalBound = true;
    document.addEventListener("click", () => closeSourceMenus());
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeSourceMenus();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", () => setTimeout(boot, 0));
})();
