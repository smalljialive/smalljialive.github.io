(function () {
  "use strict";

  if (window.__smallJiaMusicScrollFixLoaded) return;
  window.__smallJiaMusicScrollFixLoaded = true;

  let observers = [];

  const scrollInside = (container, line, behavior) => {
    if (!container || !line) return;
    const containerRect = container.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    const target = container.scrollTop
      + (lineRect.top - containerRect.top)
      - (container.clientHeight / 2)
      + (lineRect.height / 2);
    const top = Math.max(0, target);

    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top, behavior: behavior === "smooth" ? "smooth" : "auto" });
    } else {
      container.scrollTop = top;
    }
  };

  const patchLine = (container, line) => {
    if (!line || line.dataset.sjmScrollPatched === "1") return;
    line.dataset.sjmScrollPatched = "1";

    // The native lyric code calls scrollIntoView whenever the active lyric changes.
    // Override it only for lyric lines so the lyric panel scrolls without moving the page.
    line.scrollIntoView = options => {
      const behavior = options && typeof options === "object" ? options.behavior : "auto";
      scrollInside(container, line, behavior);
    };
  };

  const patchContainer = container => {
    if (!container || container.dataset.sjmScrollContainerPatched === "1") return;
    container.dataset.sjmScrollContainerPatched = "1";

    const patchAll = () => {
      container.querySelectorAll(".sjm-lyric-line, .sjm-fullscreen-lyric-line").forEach(line => patchLine(container, line));
    };

    patchAll();
    const observer = new MutationObserver(patchAll);
    observer.observe(container, { childList: true, subtree: true });
    observers.push(observer);
  };

  const boot = () => {
    if (!window.location.pathname.startsWith("/music/")) return;
    patchContainer(document.getElementById("sjm-lyrics"));
    patchContainer(document.getElementById("sjm-fullscreen-lyrics"));
  };

  const destroy = () => {
    observers.forEach(observer => observer.disconnect());
    observers = [];
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);

  document.addEventListener("pjax:complete", () => setTimeout(boot, 0));
  document.addEventListener("pjax:send", destroy);
})();
