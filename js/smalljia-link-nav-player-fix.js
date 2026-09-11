(function () {
  "use strict";

  if (!/^\/link\/?$/i.test(window.location.pathname || "")) return;
  if (window.__smallJiaLinkNavMusicLazy) return;
  window.__smallJiaLinkNavMusicLazy = true;

  const config = window.__smallJiaLinkMusicConfig || {};
  const nav = document.getElementById("nav-music");
  const host = nav?.querySelector("meting-js");
  if (!nav || !host) return;

  const SILENT_URL = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  const FALLBACK_COVER = "/img/music-placeholder.svg";
  const state = {
    phase: "idle",
    promise: null,
    player: null,
  };

  const setTip = text => {
    const tip = document.getElementById("nav-music-hoverTips");
    if (tip && !window.anzhiyu_musicPlaying) tip.textContent = text;
  };

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const loadCss = href => {
    if (!href) return;
    if (document.querySelector(`link[data-smalljia-link-music-css="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.smalljiaLinkMusicCss = href;
    document.head.appendChild(link);
  };

  const loadScript = src => {
    if (!src) return Promise.reject(new Error("missing script url"));
    const existing = Array.from(document.scripts).find(item => item.src === new URL(src, location.href).href);
    if (existing?.dataset.smalljiaLoaded === "true") return Promise.resolve();

    return new Promise((resolve, reject) => {
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.smalljiaLinkMusicLoader = "true";
      script.addEventListener("load", () => {
        script.dataset.smalljiaLoaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", () => reject(new Error(`failed to load ${src}`)), { once: true });
      document.body.appendChild(script);
    });
  };

  const createPlayer = () => {
    if (host.aplayer) return host.aplayer;
    if (typeof APlayer !== "function") throw new Error("APlayer is not available");

    const player = new APlayer({
      container: host,
      fixed: false,
      mini: false,
      autoplay: false,
      theme: "var(--anzhiyu-main)",
      loop: "all",
      order: "random",
      preload: "none",
      volume: Number(config.volume) || 0.5,
      mutex: true,
      lrcType: 0,
      audio: [{
        name: "音乐准备中",
        artist: "SmallJia",
        url: SILENT_URL,
        cover: FALLBACK_COVER,
        lrc: "",
      }],
    });

    host.aplayer = player;
    window.aplayers = Array.isArray(window.aplayers) ? window.aplayers : [];
    if (!window.aplayers.includes(player)) window.aplayers.push(player);
    return player;
  };

  const hasDailyList = player => {
    const audios = player?.list?.audios || [];
    if (!audios.length) return false;
    if (audios.length > 1) return true;
    return String(audios[0]?.name || "") !== "音乐准备中";
  };

  const currentEntry = player => {
    const audios = player?.list?.audios || [];
    const index = Number.isInteger(player?.list?.index) ? player.list.index : 0;
    return { index, audio: audios[index] || audios[0] || null };
  };

  const isRealAudio = audio => /^https?:\/\//i.test(String(audio?.url || ""));

  const waitFor = async (predicate, timeoutMs, intervalMs) => {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const result = predicate();
      if (result) return result;
      await wait(intervalMs);
    }
    return null;
  };

  const syncResolvedSource = (player, audio) => {
    if (!player?.audio || !isRealAudio(audio)) return false;
    const target = String(audio.url);
    if (player.audio.src !== target && player.audio.currentSrc !== target) {
      player.audio.src = target;
      player.audio.load();
    }
    return true;
  };

  const prepare = () => {
    if (state.phase === "ready") return Promise.resolve(state.player);
    if (state.promise) return state.promise;

    state.phase = "loading";
    setTip("正在加载音乐…");

    state.promise = (async () => {
      loadCss(config.aplayerCss);
      await loadScript(config.aplayerJs);

      const player = createPlayer();
      state.player = player;

      // APlayer 创建完成后才加载自定义音乐逻辑。Link 首屏不再执行任何歌单请求、
      // 轮询或远程解析，只有用户第一次点击播放器时才开始初始化。
      await loadScript(config.dailyJs);
      await Promise.all([
        loadScript(config.hoverJs),
        loadScript(config.persistenceJs),
      ]);

      const dailyReady = await waitFor(() => hasDailyList(player), 12000, 150);
      if (!dailyReady) throw new Error("daily playlist initialization timed out");

      // daily-player 已经 patch 了 list.switch；主动选择当前曲目，只解析这一首。
      let entry = currentEntry(player);
      if (!isRealAudio(entry.audio) && typeof player.list?.switch === "function") {
        player.list.switch(entry.index);
      }

      const resolved = await waitFor(() => {
        entry = currentEntry(player);
        return isRealAudio(entry.audio) ? entry.audio : null;
      }, 15000, 150);

      if (!resolved) throw new Error("current track resolution timed out");
      syncResolvedSource(player, resolved);

      state.phase = "ready";
      setTip("音乐已就绪 · 点击播放");
      return player;
    })().catch(error => {
      state.phase = "error";
      state.promise = null;
      console.warn("SmallJia link nav music: lazy initialization failed", error);
      setTip("音乐加载失败 · 点击重试");
      throw error;
    });

    return state.promise;
  };

  // Link 直开/刷新时，第一次点击只负责加载播放器和解析第一首歌。
  // 准备完成后第二次点击走主题原生 anzhiyu.musicToggle()，从而保持浏览器播放策略稳定。
  nav.addEventListener("click", event => {
    if (state.phase === "ready") return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (state.phase === "loading") {
      setTip("正在加载音乐…");
      return;
    }

    prepare().catch(() => {});
  }, true);

  setTip("点击加载音乐");

  window.SmallJiaLinkNavMusic = {
    prepare,
    get phase() { return state.phase; },
    get player() { return state.player; },
  };
})();
