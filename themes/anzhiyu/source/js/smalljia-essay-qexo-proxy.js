(function () {
  "use strict";

  if (window.__smallJiaEssayQexoProxyInstalled) return;
  window.__smallJiaEssayQexoProxyInstalled = true;

  const SOURCE_PREFIX = "https://small-tan.vercel.app/pub/talks/";
  const PROXY_URL = "https://yluidpgnvfurcomnexjr.supabase.co/functions/v1/qexo-talks-proxy";
  const nativeFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    try {
      const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input?.url;
      if (rawUrl && rawUrl.startsWith(SOURCE_PREFIX)) {
        const source = new URL(rawUrl);
        const proxy = new URL(PROXY_URL);
        source.searchParams.forEach((value, key) => proxy.searchParams.set(key, value));
        return nativeFetch(proxy.toString(), init);
      }
    } catch (error) {
      console.warn("SmallJia essay: Qexo proxy rewrite failed", error);
    }
    return nativeFetch(input, init);
  };
})();
