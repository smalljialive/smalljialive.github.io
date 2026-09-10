(function () {
  "use strict";

  const VERSION = "20260910-1";
  if (window.__smallJiaMusicBackendRouterVersion === VERSION) return;
  window.__smallJiaMusicBackendRouterVersion = VERSION;

  const SUPABASE_API = "https://yluidpgnvfurcomnexjr.supabase.co/functions/v1/music-proxy";
  const LEGACY_GD_HOST = "music-api.gdstudio.xyz";
  const OLD_PROXY_HOST = "smalljia-music-proxy-small-jias-projects.vercel.app";
  const SOURCE_KEY = "smalljia_music_source_preference_v1";
  const ROUTED_TYPES = new Set(["search", "url", "lyric", "pic"]);
  const originalFetch = window.fetch.bind(window);

  const rewriteUrl = raw => {
    let url;
    try { url = new URL(raw, window.location.href); }
    catch (_) { return raw; }

    const source = (url.searchParams.get("source") || "").toLowerCase();
    const type = (url.searchParams.get("types") || "").toLowerCase();
    const shouldRouteOldProxy = url.hostname === OLD_PROXY_HOST && ROUTED_TYPES.has(type);
    const shouldRouteDirect = url.hostname === LEGACY_GD_HOST && ROUTED_TYPES.has(type)
      && (source === "tencent" || (source === "kuwo" && type === "url"));

    if (!shouldRouteOldProxy && !shouldRouteDirect) return raw;
    const target = new URL(SUPABASE_API);
    url.searchParams.forEach((value, key) => target.searchParams.append(key, value));
    return target.toString();
  };

  window.fetch = function (input, init) {
    const raw = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
    if (!raw) return originalFetch(input, init);
    const next = rewriteUrl(raw);
    if (next === raw) return originalFetch(input, init);

    if (typeof input === "string" || input instanceof URL) return originalFetch(next, init);
    try {
      const request = new Request(next, input);
      return originalFetch(request, init);
    } catch (_) {
      return originalFetch(next, init);
    }
  };

  const labels = {
    auto: "自动选源 · 多音源",
    netease: "网易云 · GD-Studio",
    kuwo: "酷我 · GD / XCloud",
    tencent: "QQ音乐 · QQ线路",
  };

  const refreshSourceUi = () => {
    const root = document.getElementById("anMusic-page");
    if (!root) return;

    const select = root.querySelector("#sjm-source-select");
    if (select) {
      select.querySelector('option[value="kugou"]')?.remove();
      if (select.value === "kugou" || localStorage.getItem(SOURCE_KEY) === "kugou") {
        localStorage.setItem(SOURCE_KEY, "auto");
        select.value = "auto";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else if (localStorage.getItem(SOURCE_KEY) === "kugou") {
      localStorage.setItem(SOURCE_KEY, "auto");
    }

    root.querySelectorAll('.sjm-source-option[data-value="kugou"]').forEach(node => node.remove());

    const current = localStorage.getItem(SOURCE_KEY) || "auto";
    const chip = root.querySelector(".sjm-source-chip span:last-child");
    if (chip && labels[current]) chip.textContent = labels[current];
  };

  const scheduleRefresh = () => {
    refreshSourceUi();
    setTimeout(refreshSourceUi, 0);
    setTimeout(refreshSourceUi, 250);
  };

  window.addEventListener("smalljia:music-source-change", () => setTimeout(refreshSourceUi, 0));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleRefresh, { once: true });
  else scheduleRefresh();
  document.addEventListener("pjax:complete", scheduleRefresh);
})();
