(function () {
  "use strict";

  if (!/^\/link\/?$/i.test(window.location.pathname || "")) return;
  if (window.__smallJiaLinkNavPlayerFix) return;
  window.__smallJiaLinkNavPlayerFix = true;

  const SILENT_PREFIX = "data:audio/wav";
  const MAX_ATTEMPTS = 80;
  let attempts = 0;
  let timer = null;
  let resolveRequested = false;

  const getPlayer = () => document.querySelector("#nav-music meting-js")?.aplayer || null;

  const currentEntry = ap => {
    const audios = ap?.list?.audios || [];
    const index = Number.isInteger(ap?.list?.index) ? ap.list.index : 0;
    return { audios, index, audio: audios[index] || null };
  };

  const isRealUrl = audio => {
    const url = String(audio?.url || "");
    return /^https?:\/\//i.test(url) && !url.startsWith(SILENT_PREFIX);
  };

  const setTip = text => {
    const tip = document.getElementById("nav-music-hoverTips");
    if (tip && !window.anzhiyu_musicPlaying) tip.textContent = text;
  };

  const syncMediaSource = (ap, audio) => {
    if (!ap?.audio || !isRealUrl(audio)) return false;

    let target = String(audio.url || "");
    try { target = new URL(target, window.location.href).href; } catch (_) {}

    let current = ap.audio.currentSrc || ap.audio.src || "";
    try { current = current ? new URL(current, window.location.href).href : ""; } catch (_) {}

    if (current === target) return true;

    const wasPlaying = !ap.audio.paused;
    try {
      ap.audio.src = audio.url;
      ap.audio.load();
      if (wasPlaying) {
        const playPromise = ap.audio.play();
        if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
      }
      return true;
    } catch (error) {
      console.warn("SmallJia link nav music: failed to sync resolved audio source", error);
      return false;
    }
  };

  const dailyListReady = ({ audios }) => {
    if (!audios.length) return false;
    if (audios.length > 1) return true;
    const only = audios[0];
    return String(only?.name || "") !== "日常" || String(only?.artist || "") !== "SmallJia";
  };

  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const prepare = () => {
    const ap = getPlayer();
    if (!ap?.list?.audios?.length) return false;

    const entry = currentEntry(ap);
    if (isRealUrl(entry.audio)) {
      syncMediaSource(ap, entry.audio);
      stop();
      setTip("点击播放");
      return true;
    }

    if (dailyListReady(entry) && typeof ap.list.switch === "function" && !resolveRequested) {
      resolveRequested = true;
      setTip("音乐准备中…");
      try {
        // daily-player 会在这里接管 switch，只解析当前这一首，不加载完整 MetingJS 歌单。
        ap.list.switch(entry.index);
      } catch (error) {
        console.warn("SmallJia link nav music: resolve request failed", error);
      }
    }

    return false;
  };

  const poll = () => {
    if (prepare()) return;
    attempts += 1;
    if (attempts >= MAX_ATTEMPTS) {
      stop();
      setTip("点击重试音乐");
      return;
    }
    timer = setTimeout(poll, attempts < 16 ? 250 : 500);
  };

  // 如果用户过早点击，继续触发当前歌曲解析；一旦 URL 已解析则确保真正写入 audio.src。
  document.addEventListener("click", event => {
    if (!(event.target instanceof Element) || !event.target.closest("#nav-music")) return;
    const ap = getPlayer();
    if (!ap) return;

    const entry = currentEntry(ap);
    if (isRealUrl(entry.audio)) {
      syncMediaSource(ap, entry.audio);
      return;
    }

    setTip("音乐准备中…");
    if (dailyListReady(entry) && typeof ap.list.switch === "function") {
      try { ap.list.switch(entry.index); } catch (_) {}
    }
    if (!timer) timer = setTimeout(poll, 0);
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      timer = setTimeout(poll, 250);
    }, { once: true });
  } else {
    timer = setTimeout(poll, 250);
  }
})();
