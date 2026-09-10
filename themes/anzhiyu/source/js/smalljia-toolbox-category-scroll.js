(function () {
  "use strict";

  const SELECTOR = ".sj-toolbox-chips";
  const DRAG_THRESHOLD = 6;

  const syncScrollable = (chips) => {
    const canScroll = chips.scrollWidth - chips.clientWidth > 2;
    chips.classList.toggle("sjtb-can-scroll", canScroll);
    if (canScroll) chips.setAttribute("aria-label", "分类导航，可左右拖动浏览更多分类");
    else chips.removeAttribute("aria-label");
  };

  const bind = (chips) => {
    if (!chips || chips.dataset.sjtbCategoryScrollBound === "1") return;
    chips.dataset.sjtbCategoryScrollBound = "1";

    let pointerId = null;
    let startX = 0;
    let startScrollLeft = 0;
    let dragging = false;
    let suppressClick = false;

    const finishDrag = (cancelled) => {
      if (pointerId !== null && chips.hasPointerCapture && chips.hasPointerCapture(pointerId)) {
        try { chips.releasePointerCapture(pointerId); } catch (_) {}
      }
      pointerId = null;
      dragging = false;
      chips.classList.remove("sjtb-dragging");
      if (cancelled) suppressClick = false;
    };

    chips.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      if (chips.scrollWidth <= chips.clientWidth + 2) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = chips.scrollLeft;
      dragging = false;
      suppressClick = false;
    });

    chips.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointerId) return;
      const deltaX = event.clientX - startX;
      if (!dragging && Math.abs(deltaX) < DRAG_THRESHOLD) return;

      if (!dragging) {
        dragging = true;
        suppressClick = true;
        chips.classList.add("sjtb-dragging");
        try { chips.setPointerCapture(pointerId); } catch (_) {}
      }

      event.preventDefault();
      chips.scrollLeft = startScrollLeft - deltaX;
    });

    chips.addEventListener("pointerup", () => finishDrag(false));
    chips.addEventListener("pointercancel", () => finishDrag(true));
    chips.addEventListener("lostpointercapture", () => {
      pointerId = null;
      dragging = false;
      chips.classList.remove("sjtb-dragging");
    });

    chips.addEventListener("click", (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);

    chips.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (chips.scrollWidth <= chips.clientWidth + 2) return;
      const amount = Math.max(120, Math.round(chips.clientWidth * 0.45));
      chips.scrollBy({ left: event.key === "ArrowRight" ? amount : -amount, behavior: "smooth" });
    });

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => syncScrollable(chips));
      resizeObserver.observe(chips);
    }

    requestAnimationFrame(() => syncScrollable(chips));
  };

  const bindAll = () => {
    document.querySelectorAll(SELECTOR).forEach(bind);
  };

  const boot = () => {
    window.setTimeout(bindAll, 0);
    window.setTimeout(bindAll, 120);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  document.addEventListener("pjax:complete", boot);
})();
