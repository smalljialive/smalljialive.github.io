(function () {
  "use strict";

  const VERSION = "20260910-1";
  if (window.__smallJiaMusicSourceRetryVersion === VERSION) return;
  window.__smallJiaMusicSourceRetryVersion = VERSION;

  const cache = new Map();
  const CACHE_TTL = 10 * 60 * 1000;

  const normalize = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const cacheKey = (track, pref) => `${pref}:${normalize(track?.name)}:${normalize(track?.artist)}`;

  const getPlayableMatch = async (track, sourceApi) => {
    const pref = sourceApi.get();
    const key = cacheKey(track, pref);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL) return hit.track ? { ...hit.track, __gdStudio: hit.track.__gdStudio ? { ...hit.track.__gdStudio } : undefined } : null;
    const match = await sourceApi.findPlayableMatch(track);
    cache.set(key, { at: Date.now(), track: match ? { ...match, __gdStudio: match.__gdStudio ? { ...match.__gdStudio } : undefined } : null });
    return match;
  };

  const patch = app => {
    const sourceApi = window.SmallJiaMusicSource;
    if (!app || !sourceApi?.findPlayableMatch || app.__sourceRetryPatched) return false;
    app.__sourceRetryPatched = true;

    const originalPlayTrack = app.playTrack.bind(app);
    const originalSelectIndex = app.selectIndex.bind(app);

    app.playTrack = async function (track) {
      if (!track) return;
      const pref = sourceApi.get();
      this.showToast?.(`正在${pref === "auto" ? "自动检查多个音源" : `检查${sourceApi.labels?.[pref] || pref}`}：${track.name}`);
      try {
        const match = await getPlayableMatch(track, sourceApi);
        if (!match) {
          this.showToast?.(pref === "auto" ? "网易云、酷我、QQ等音源均未找到可播放版本" : `${sourceApi.labels?.[pref] || pref}没有找到可播放版本`);
          return;
        }
        match.name = track.name || match.name;
        match.artist = track.artist || match.artist;
        match.album = track.album || match.album;
        return originalPlayTrack(match);
      } catch (error) {
        console.warn("SmallJia Music: source retry failed", error);
        return originalPlayTrack(track);
      }
    };

    app.selectIndex = async function (index, autoplay = true, restorePosition = false) {
      if (!this.queue?.length) return originalSelectIndex(index, autoplay, restorePosition);
      const normalizedIndex = ((index % this.queue.length) + this.queue.length) % this.queue.length;
      const track = this.queue[normalizedIndex];
      const pref = sourceApi.get();
      this.showToast?.(`正在${pref === "auto" ? "自动检查多个音源" : `检查${sourceApi.labels?.[pref] || pref}`}：${track?.name || "歌曲"}`);
      try {
        const match = await getPlayableMatch(track, sourceApi);
        if (!match) {
          this.showToast?.(pref === "auto" ? "网易云、酷我、QQ等音源均未找到可播放版本" : `${sourceApi.labels?.[pref] || pref}没有找到可播放版本`);
          return;
        }
        Object.assign(track, match, {
          name: track.name || match.name,
          artist: track.artist || match.artist,
          album: track.album || match.album,
        });
        return originalSelectIndex(normalizedIndex, autoplay, restorePosition);
      } catch (error) {
        console.warn("SmallJia Music: queue source retry failed", error);
        return originalSelectIndex(normalizedIndex, autoplay, restorePosition);
      }
    };

    window.addEventListener("smalljia:music-source-change", () => cache.clear());
    return true;
  };

  const boot = () => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (patch(window.SmallJiaMusic) || attempts > 120) clearInterval(timer);
    }, 100);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
})();
