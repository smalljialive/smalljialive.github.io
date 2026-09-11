(function () {
  "use strict";

  if (window.__smallJiaMusicFullscreenLoaded) return;
  window.__smallJiaMusicFullscreenLoaded = true;

  const FALLBACK_COVER = "/img/favicon.ico";
  const PREVIEW_MIN = 20;
  const PREVIEW_MAX = 36;
  let controller = null;

  const formatTime = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  class MusicFullscreenController {
    constructor(root) {
      this.root = root;
      this.app = null;
      this.audio = null;
      this.syncTimer = null;
      this.boundAudio = null;
      this.active = false;
      this.mode = null;
      this.renderedTrackKey = "";
      this.renderedLyricLength = -1;
      this.lastNonZeroVolume = 0.5;
      this.onKeydown = event => {
        if (event.key !== "Escape" || !this.active) return;
        // 网站全屏没有浏览器 Fullscreen 状态，需要我们自己响应 Esc。
        // 屏幕全屏的 Esc 由浏览器处理，fullscreenchange 再负责收起沉浸层。
        if (this.mode === "web" || !document.fullscreenElement) this.close(false);
      };
      this.onFullscreenChange = () => {
        if (this.active && this.mode === "screen" && !document.fullscreenElement) {
          this.close(false);
        }
      };
    }

    init() {
      this.cacheDom();
      this.prepareEntryButtons();
      this.bindUi();
      this.waitForApp();
    }

    cacheDom() {
      const byId = id => this.root.querySelector(`#${id}`) || document.getElementById(id);
      this.dom = {
        screenOpen: byId("sjm-fullscreen-open"),
        webOpen: byId("sjm-web-fullscreen-open"),
        overlay: byId("sjm-fullscreen"),
        close: byId("sjm-fullscreen-close"),
        bg: byId("sjm-fullscreen-bg"),
        vinyl: byId("sjm-fullscreen-vinyl"),
        cover: byId("sjm-fullscreen-cover"),
        title: byId("sjm-fullscreen-title"),
        artist: byId("sjm-fullscreen-artist"),
        album: byId("sjm-fullscreen-album"),
        play: byId("sjm-fullscreen-play"),
        prev: byId("sjm-fullscreen-prev"),
        next: byId("sjm-fullscreen-next"),
        progress: byId("sjm-fullscreen-progress"),
        current: byId("sjm-fullscreen-current"),
        duration: byId("sjm-fullscreen-duration"),
        volume: byId("sjm-fullscreen-volume"),
        volumeValue: byId("sjm-fullscreen-volume-value"),
        mute: byId("sjm-fullscreen-mute"),
        lyrics: byId("sjm-fullscreen-lyrics"),
        previewMain: byId("sjm-preview-badge"),
        previewFullscreen: byId("sjm-fullscreen-preview"),
      };
    }

    prepareEntryButtons() {
      const screenButton = this.dom.screenOpen;
      if (!screenButton) return;

      screenButton.textContent = "▣ 屏幕全屏";
      screenButton.title = "进入电脑屏幕全屏听歌";
      screenButton.setAttribute("aria-label", "进入电脑屏幕全屏听歌");

      let webButton = this.root.querySelector("#sjm-web-fullscreen-open");
      if (!webButton) {
        webButton = document.createElement("button");
        webButton.id = "sjm-web-fullscreen-open";
        webButton.type = "button";
        webButton.className = screenButton.className || "sjm-soft-button";
        webButton.textContent = "⛶ 网页全屏";
        webButton.title = "在当前浏览器窗口内全屏听歌";
        webButton.setAttribute("aria-label", "进入网页全屏听歌");
        screenButton.parentNode?.insertBefore(webButton, screenButton);
      }
      this.dom.webOpen = webButton;
    }

    bindUi() {
      this.dom.webOpen?.addEventListener("click", () => this.open("web"));
      this.dom.screenOpen?.addEventListener("click", () => this.open("screen"));
      this.dom.close?.addEventListener("click", () => this.close(true));
      this.dom.play?.addEventListener("click", () => this.app?.togglePlay());
      this.dom.prev?.addEventListener("click", () => this.app?.previous());
      this.dom.next?.addEventListener("click", () => this.app?.next());
      this.dom.progress?.addEventListener("input", () => {
        if (!this.audio || !Number.isFinite(this.audio.duration) || this.audio.duration <= 0) return;
        this.audio.currentTime = this.audio.duration * (Number(this.dom.progress.value) / 100);
      });
      this.dom.volume?.addEventListener("input", () => this.setVolumeFromControl());
      this.dom.mute?.addEventListener("click", () => this.toggleMute());
      document.addEventListener("keydown", this.onKeydown);
      document.addEventListener("fullscreenchange", this.onFullscreenChange);
    }

    waitForApp() {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        const app = window.SmallJiaMusic;
        if (app?.audio && app.root === this.root) {
          clearInterval(timer);
          this.attachApp(app);
          return;
        }
        if (attempts >= 100 || !document.body.contains(this.root)) clearInterval(timer);
      }, 100);
    }

    attachApp(app) {
      this.app = app;
      this.audio = app.audio;
      if (this.audio.volume > 0) this.lastNonZeroVolume = this.audio.volume;
      if (this.boundAudio === this.audio) return;
      this.boundAudio = this.audio;
      ["play", "pause", "loadedmetadata", "durationchange", "timeupdate", "emptied", "volumechange"].forEach(eventName => {
        this.audio.addEventListener(eventName, () => this.sync());
      });
      this.sync();
    }

    setVolumeFromControl() {
      if (!this.audio || !this.dom.volume) return;
      const next = clamp(Number(this.dom.volume.value) / 100, 0, 1);
      this.audio.muted = false;
      this.audio.volume = next;
      if (next > 0) this.lastNonZeroVolume = next;
      if (this.app?.dom?.volume) this.app.dom.volume.value = String(Math.round(next * 100));
      this.app?.saveState?.(true);
      this.syncVolume();
    }

    toggleMute() {
      if (!this.audio) return;
      const muted = this.audio.muted || this.audio.volume <= 0;
      if (muted) {
        const restored = clamp(this.lastNonZeroVolume || 0.5, 0.05, 1);
        this.audio.muted = false;
        this.audio.volume = restored;
        if (this.app?.dom?.volume) this.app.dom.volume.value = String(Math.round(restored * 100));
      } else {
        if (this.audio.volume > 0) this.lastNonZeroVolume = this.audio.volume;
        this.audio.muted = true;
      }
      this.app?.saveState?.(true);
      this.syncVolume();
    }

    syncVolume() {
      if (!this.audio) return;
      if (this.audio.volume > 0 && !this.audio.muted) this.lastNonZeroVolume = this.audio.volume;
      const effective = this.audio.muted ? 0 : clamp(this.audio.volume, 0, 1);
      const percent = Math.round(effective * 100);
      if (this.dom.volume) this.dom.volume.value = String(percent);
      if (this.dom.volumeValue) {
        this.dom.volumeValue.textContent = `${percent}%`;
        this.dom.volumeValue.title = `当前音量 ${percent}%`;
      }
      if (this.dom.mute) {
        const icon = percent === 0 ? "🔇" : percent < 50 ? "🔉" : "🔊";
        this.dom.mute.textContent = icon;
        this.dom.mute.title = percent === 0 ? "取消静音" : "静音";
        this.dom.mute.setAttribute("aria-label", percent === 0 ? "取消静音" : "静音");
      }
    }

    showOverlay(mode) {
      if (!this.dom.overlay) return false;
      this.active = true;
      this.mode = mode;
      this.dom.overlay.dataset.fullscreenMode = mode;
      this.dom.overlay.classList.add("active");
      this.dom.overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("sjm-fullscreen-open");
      this.sync(true);
      clearInterval(this.syncTimer);
      this.syncTimer = setInterval(() => this.sync(), 350);
      return true;
    }

    async open(mode = "web") {
      if (!this.showOverlay(mode)) return;

      // 网页全屏只覆盖浏览器视口，保留地址栏、标签栏和系统任务栏。
      if (mode === "web") return;

      // 屏幕全屏才调用浏览器 Fullscreen API。
      if (this.dom.overlay.requestFullscreen && !document.fullscreenElement) {
        try {
          await this.dom.overlay.requestFullscreen();
        } catch (_) {
          // 浏览器拒绝 Fullscreen 时自动退化为网页全屏，而不是直接关闭。
          this.mode = "web";
          this.dom.overlay.dataset.fullscreenMode = "web";
          this.app?.showToast?.("浏览器未允许屏幕全屏，已切换为网页全屏");
        }
      } else {
        this.mode = "web";
        this.dom.overlay.dataset.fullscreenMode = "web";
      }
    }

    async close(exitNative) {
      const wasScreen = this.mode === "screen";
      this.active = false;
      this.mode = null;
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      this.dom.overlay?.classList.remove("active");
      this.dom.overlay?.removeAttribute("data-fullscreen-mode");
      this.dom.overlay?.setAttribute("aria-hidden", "true");
      document.body.classList.remove("sjm-fullscreen-open");
      if (exitNative && wasScreen && document.fullscreenElement && document.exitFullscreen) {
        try { await document.exitFullscreen(); } catch (_) {}
      }
    }

    sync(forceLyrics = false) {
      if (!this.app || !this.audio) return;
      const track = this.app.currentTrack;
      const cover = track?.cover && /^https?:|^\//i.test(track.cover) ? track.cover : FALLBACK_COVER;

      if (track) {
        if (this.dom.cover) this.dom.cover.src = cover;
        if (this.dom.title) this.dom.title.textContent = track.name || "未知歌曲";
        if (this.dom.artist) this.dom.artist.textContent = track.artist || "未知歌手";
        if (this.dom.album) this.dom.album.textContent = track.album || "SmallJia Music";
        if (this.dom.bg) this.dom.bg.style.backgroundImage = cover !== FALLBACK_COVER ? `url("${String(cover).replace(/"/g, "")}")` : "none";
      }

      const playing = !this.audio.paused && !this.audio.ended;
      if (this.dom.play) {
        this.dom.play.textContent = playing ? "❚❚" : "▶";
        this.dom.play.setAttribute("aria-label", playing ? "暂停" : "播放");
      }
      this.dom.vinyl?.classList.toggle("is-playing", playing);

      const current = this.audio.currentTime || 0;
      const duration = this.audio.duration || 0;
      if (this.dom.current) this.dom.current.textContent = formatTime(current);
      if (this.dom.duration) this.dom.duration.textContent = formatTime(duration);
      if (this.dom.progress) {
        this.dom.progress.value = Number.isFinite(duration) && duration > 0 ? String((current / duration) * 100) : "0";
      }

      this.syncVolume();
      this.syncPreviewBadge(duration);
      this.syncLyrics(forceLyrics || this.renderedTrackKey !== (track?.key || "") || this.renderedLyricLength !== (this.app.lyrics?.length || 0));
      this.highlightLyric();
    }

    syncPreviewBadge(duration) {
      const suspectedPreview = Number.isFinite(duration) && duration >= PREVIEW_MIN && duration <= PREVIEW_MAX;
      [this.dom.previewMain, this.dom.previewFullscreen].forEach(node => {
        if (!node) return;
        node.hidden = !suspectedPreview;
        if (suspectedPreview) node.textContent = `可能为试听片段 · ${Math.round(duration)} 秒`;
      });
    }

    syncLyrics(force) {
      if (!force || !this.dom.lyrics) return;
      const lyrics = Array.isArray(this.app.lyrics) ? this.app.lyrics : [];
      this.renderedTrackKey = this.app.currentTrack?.key || "";
      this.renderedLyricLength = lyrics.length;
      this.dom.lyrics.innerHTML = "";

      if (!lyrics.length) {
        const empty = document.createElement("div");
        empty.className = "sjm-empty";
        empty.innerHTML = '<div class="sjm-empty-icon">♫</div><div class="sjm-empty-title">暂无同步歌词</div><div class="sjm-empty-text">部分歌曲可能没有可用歌词。</div>';
        this.dom.lyrics.appendChild(empty);
        return;
      }

      lyrics.forEach((line, index) => {
        const node = document.createElement("button");
        node.type = "button";
        node.className = "sjm-fullscreen-lyric-line";
        node.dataset.index = String(index);
        node.textContent = line.text;
        node.addEventListener("click", () => {
          if (Number.isFinite(line.time)) this.audio.currentTime = line.time;
        });
        this.dom.lyrics.appendChild(node);
      });
    }

    highlightLyric() {
      const lyrics = Array.isArray(this.app?.lyrics) ? this.app.lyrics : [];
      if (!lyrics.length || !this.dom.lyrics) return;
      const time = this.audio.currentTime || 0;
      let index = -1;
      for (let i = 0; i < lyrics.length; i += 1) {
        if (lyrics[i].time <= time + 0.15) index = i;
        else break;
      }
      const nodes = [...this.dom.lyrics.querySelectorAll(".sjm-fullscreen-lyric-line")];
      nodes.forEach((node, i) => {
        node.classList.toggle("active", i === index);
        node.classList.toggle("near", Math.abs(i - index) === 1);
      });
      if (this.active && index >= 0) {
        nodes[index]?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    destroy() {
      clearInterval(this.syncTimer);
      document.removeEventListener("keydown", this.onKeydown);
      document.removeEventListener("fullscreenchange", this.onFullscreenChange);
      document.body.classList.remove("sjm-fullscreen-open");
      if (document.fullscreenElement === this.dom.overlay && document.exitFullscreen) {
        try { document.exitFullscreen(); } catch (_) {}
      }
    }
  }

  const boot = () => {
    if (!window.location.pathname.startsWith("/music/")) return;
    const root = document.getElementById("anMusic-page");
    if (!root) return;
    if (controller?.root === root) return;
    controller?.destroy();
    controller = new MusicFullscreenController(root);
    controller.init();
    window.SmallJiaMusicFullscreen = controller;
  };

  const destroy = () => {
    controller?.destroy();
    controller = null;
    window.SmallJiaMusicFullscreen = null;
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
  document.addEventListener("pjax:send", destroy);
})();
