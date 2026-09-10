(function () {
  "use strict";

  const ROOT = document.documentElement;
  const SCROLL_CLASS = "sjtb-page-scrolling";
  const SETTLE_DELAY = 120;
  let settleTimer = null;

  const isToolboxPage = () => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    return path === "/link" || Boolean(document.querySelector(".sj-toolbox-app"));
  };

  const endScrollState = () => {
    clearTimeout(settleTimer);
    settleTimer = null;
    ROOT.classList.remove(SCROLL_CLASS);
  };

  const beginScrollState = () => {
    if (!isToolboxPage()) return;
    if (!ROOT.classList.contains(SCROLL_CLASS)) ROOT.classList.add(SCROLL_CLASS);
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(endScrollState, SETTLE_DELAY);
  };

  /* wheel/touchmove fire before or alongside visual scrolling, which prevents
   * hover transitions from repeatedly starting as cards pass under the pointer.
   */
  window.addEventListener("wheel", beginScrollState, { passive: true });
  window.addEventListener("touchmove", beginScrollState, { passive: true });
  window.addEventListener("scroll", beginScrollState, { passive: true });

  if ("onscrollend" in window) {
    window.addEventListener("scrollend", endScrollState, { passive: true });
  }

  document.addEventListener("pjax:send", endScrollState);
  document.addEventListener("pjax:complete", endScrollState);
  window.addEventListener("blur", endScrollState);
})();
