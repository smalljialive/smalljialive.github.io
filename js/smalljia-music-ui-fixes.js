(function () {
  "use strict";

  const VERSION = "20260910-1";
  if (window.__smallJiaMusicUiFixesVersion === VERSION) return;
  window.__smallJiaMusicUiFixesVersion = VERSION;

  const STYLE_ID = "smalljia-music-ui-fixes-style";
  let observer = null;
  let rafId = 0;

  const normalize = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const sameTrack = (a, b) => {
    if (!a || !b) return false;
    const as = String(a.server || a.source || "netease").toLowerCase();
    const bs = String(b.server || b.source || "netease").toLowerCase();
    if (a.id && b.id && String(a.id) === String(b.id) && as === bs) return true;
    const an = normalize(a.name);
    const bn = normalize(b.name);
    if (!an || an !== bn) return false;
    const aa = normalize(a.artist);
    const ba = normalize(b.artist);
    if (!aa || !ba) return aa === ba;
    return aa === ba || aa.includes(ba) || ba.includes(aa);
  };

  const text = (node, value) => {
    if (node && node.textContent !== value) node.textContent = value;
  };

  const ensureStyle = () => {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
      #anMusic-page .sjm-main { position:relative; overflow:visible!important; }
      #anMusic-page .sjm-topbar { position:relative; z-index:5000!important; overflow:visible!important; }
      #anMusic-page .sjm-search-form { position:relative; z-index:5100!important; overflow:visible!important; }
      #anMusic-page .sjm-source-select-wrap { position:relative; z-index:5200!important; overflow:visible!important; }
      #anMusic-page .sjm-source-menu { z-index:999999!important; }
      #anMusic-page .sjm-view, #anMusic-page .sjm-now-grid { position:relative; z-index:1; }
      #anMusic-page #sjm-queue-shortcut { display:none!important; }
      #anMusic-page #sjm-current-add-playlist.sjm-playlist-added,
      #anMusic-page .sjm-row-playlist-action.sjm-playlist-added {
        border-color:rgba(69,158,120,.2)!important;
        background:rgba(69,158,120,.09)!important;
        color:#3d8d6b!important;
      }
      #anMusic-page .sjm-playlist-target.sjm-playlist-target-added,
      #anMusic-page .sjm-playlist-target.sjm-playlist-target-added:disabled {
        opacity:.62;
        cursor:default!important;
        filter:none;
      }
      #anMusic-page .sjm-playlist-target.sjm-playlist-target-added em {
        color:#3d8d6b;
        font-weight:900;
      }
      [data-theme='dark'] #anMusic-page #sjm-current-add-playlist.sjm-playlist-added,
      [data-theme='dark'] #anMusic-page .sjm-row-playlist-action.sjm-playlist-added {
        border-color:rgba(105,205,158,.24)!important;
        background:rgba(105,205,158,.11)!important;
        color:#8ddbb7!important;
      }
    `;
  };

  const library = () => window.SmallJiaMusicLibrary || null;

  const containing = (lib, track) => {
    if (!lib || !track || !Array.isArray(lib.playlists)) return [];
    return lib.playlists.filter(pl => Array.isArray(pl.tracks) && pl.tracks.some(item => sameTrack(item, track)));
  };

  const rowTrack = (lib, row) => {
    const key = row?.dataset?.trackKey || "";
    if (key && typeof lib?.findTrack === "function") {
      const found = lib.findTrack(key);
      if (found) return found;
    }
    const app = lib?.app || window.SmallJiaMusic;
    for (const group of [app?.queue, app?.searchResults, app?.favorites, app?.recent, lib?.discoveryHistory]) {
      const found = Array.isArray(group) ? group.find(item => item?.key === key) : null;
      if (found) return found;
    }
    return null;
  };

  const refreshCurrent = root => {
    const lib = library();
    const button = root?.querySelector("#sjm-current-add-playlist");
    if (!button) return;
    const track = lib?.app?.currentTrack || window.SmallJiaMusic?.currentTrack;
    const list = containing(lib, track);
    const added = list.length > 0;
    const names = list.map(item => item.name).filter(Boolean);
    button.classList.toggle("sjm-playlist-added", added);
    text(button, added ? "✓ 歌单已有" : "＋ 加入歌单");
    button.title = added ? `已加入：${names.join("、")}；点击可加入其他歌单` : "把当前歌曲加入歌单";
  };

  const refreshRows = root => {
    const lib = library();
    if (!lib || !root) return;
    root.querySelectorAll(".sjm-track-row").forEach(row => {
      const button = row.querySelector(".sjm-row-playlist-action");
      if (!button) return;
      const track = rowTrack(lib, row);
      const list = containing(lib, track);
      const added = list.length > 0;
      const names = list.map(item => item.name).filter(Boolean);
      button.classList.toggle("sjm-playlist-added", added);
      text(button, added ? "✓" : "+");
      button.title = added ? `已在歌单：${names.join("、")}` : "加入歌单";
    });
  };

  const refreshModal = () => {
    const lib = library();
    const track = lib?.pendingTrack;
    const holder = lib?.dom?.modalTargets;
    if (!lib || !track || !holder || !Array.isArray(lib.playlists)) return;
    const targets = Array.from(holder.querySelectorAll(".sjm-playlist-target"));
    targets.forEach((button, index) => {
      const pl = lib.playlists[index];
      if (!pl) return;
      const added = Array.isArray(pl.tracks) && pl.tracks.some(item => sameTrack(item, track));
      button.classList.toggle("sjm-playlist-target-added", added);
      button.disabled = added;
      button.title = added ? `「${track.name || "这首歌"}」已经在「${pl.name}」里` : `加入「${pl.name}」`;
      text(button.querySelector("em"), added ? "✓" : "＋");
      text(button.querySelector("small"), `${pl.tracks?.length || 0} 首歌曲${added ? " · 已有" : ""}`);
    });
  };

  const refresh = root => {
    refreshCurrent(root);
    refreshRows(root);
    refreshModal();
  };

  const dedupe = lib => {
    if (!lib || !Array.isArray(lib.playlists)) return false;
    let changed = false;
    lib.playlists.forEach(pl => {
      if (!Array.isArray(pl.tracks) || pl.tracks.length < 2) return;
      const unique = [];
      pl.tracks.forEach(track => {
        if (unique.some(item => sameTrack(item, track))) changed = true;
        else unique.push(track);
      });
      if (unique.length !== pl.tracks.length) pl.tracks = unique;
    });
    return changed;
  };

  const patchLibrary = root => {
    const lib = library();
    if (!lib || lib.__smallJiaPlaylistStatePatched) return;
    lib.__smallJiaPlaylistStatePatched = true;

    if (typeof lib.addTrackToPlaylist === "function") {
      const originalAdd = lib.addTrackToPlaylist.bind(lib);
      lib.addTrackToPlaylist = async function (track, playlist) {
        if (track && playlist?.tracks?.some(item => sameTrack(item, track))) {
          this.app?.showToast?.(`「${track.name || "这首歌"}」已经在「${playlist.name}」里`);
          refresh(this.root || root);
          return false;
        }
        const result = await originalAdd(track, playlist);
        if (dedupe(this) && typeof this.savePlaylists === "function") this.savePlaylists();
        refresh(this.root || root);
        return result;
      };
    }

    if (typeof lib.openAddModal === "function") {
      const originalOpen = lib.openAddModal.bind(lib);
      lib.openAddModal = function (track) {
        const result = originalOpen(track);
        requestAnimationFrame(() => refresh(this.root || root));
        return result;
      };
    }

    if (typeof lib.renderPlaylists === "function") {
      const originalRender = lib.renderPlaylists.bind(lib);
      lib.renderPlaylists = function (...args) {
        const result = originalRender(...args);
        requestAnimationFrame(() => refresh(this.root || root));
        return result;
      };
    }

    if (dedupe(lib) && typeof lib.savePlaylists === "function") {
      lib.savePlaylists();
      lib.app?.showToast?.("已自动清理歌单中的重复歌曲");
    }
    refresh(root);
  };

  const enhance = root => {
    if (!root) return;
    ensureStyle();
    root.querySelector("#sjm-queue-shortcut")?.remove();
    patchLibrary(root);
    refresh(root);
  };

  const schedule = root => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => enhance(root));
  };

  const boot = () => {
    const root = document.getElementById("anMusic-page");
    if (!root) return;
    if (observer) observer.disconnect();
    enhance(root);
    observer = new MutationObserver(() => schedule(root));
    observer.observe(root, { childList:true, subtree:true, characterData:true });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", () => setTimeout(boot, 0));
  window.addEventListener("storage", () => {
    const root = document.getElementById("anMusic-page");
    if (root) schedule(root);
  });
})();
