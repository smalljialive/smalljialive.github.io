// NetEase Enhanced adapter: isolated and disabled until a permitted backend is configured.
// The endpoint must run on a separately hosted Node.js service. No login cookies are
// accepted from the browser, and paid/restricted audio is never substituted.
(function (root) {
  "use strict";
  const MAX_TIMEOUT = 6000;
  const parseSong = song => ({
    id: String(song?.id || ""),
    name: String(song?.name || ""),
    artist: Array.isArray(song?.ar) ? song.ar.map(a => a?.name).filter(Boolean).join(" / ") : "",
    album: String(song?.al?.name || ""),
    cover: typeof song?.al?.picUrl === "string" ? song.al.picUrl : "",
    source: "netease",
    server: "netease"
  });
  const request = async (base, route, params, fetcher = fetch) => {
    const url = new URL(route, base.endsWith("/") ? base : base + "/");
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MAX_TIMEOUT);
    try {
      const response = await fetcher(url.toString(), { signal: controller.signal, credentials: "omit", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Provider HTTP " + response.status);
      return await response.json();
    } finally { clearTimeout(timer); }
  };
  const create = (config = {}) => {
    const base = config.baseUrl;
    if (!base || !/^https:\/\//.test(base)) throw new Error("HTTPS NetEase backend URL required");
    const fetcher = config.fetcher || fetch;
    return {
      async search(keywords, limit = 20) {
        const payload = await request(base, "cloudsearch", { keywords, limit: Math.min(30, Math.max(1, limit)), type: 1 }, fetcher);
        return (payload?.result?.songs || []).map(parseSong).filter(song => song.id);
      },
      async url(id) {
        const payload = await request(base, "song/url/v1", { id, level: "standard" }, fetcher);
        const audio = payload?.data?.[0];
        // Reject preview-only, unavailable and restricted responses. An API HTTP
        // success or non-null URL alone does not establish playable rights.
        if (payload?.code !== 200 && payload?.code !== undefined) return "";
        if (!audio || Number(audio.fee || 0) > 0 || audio.freeTrialInfo || typeof audio.url !== "string") return "";
        try {
          const parsed = new URL(audio.url);
          if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) return "";
        } catch (_) { return ""; }
        return audio.url;
      }
    };
  };
  // Not registered with SmallJiaMusicSource until real backend and audio tests pass.
  root.SmallJiaNeteaseEnhancedAdapter = { create };
})(typeof window === "undefined" ? globalThis : window);
