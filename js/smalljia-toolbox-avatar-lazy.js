(function () {
  "use strict";

  const SELECTOR = ".sj-toolbox-card-icon img[data-sjtb-src]";
  const MAX_CONCURRENT = 6;
  const ROOT_MARGIN = "180px 0px";

  let observer = null;
  let started = false;
  let activeLoads = 0;
  const queue = [];

  const finishOne = () => {
    activeLoads = Math.max(0, activeLoads - 1);
    pumpQueue();
  };

  const loadImage = (img) => {
    if (!img || !img.isConnected) return;

    const src = img.dataset.sjtbSrc;
    if (!src) return;

    img.dataset.sjtbAvatarState = "loading";
    activeLoads += 1;

    const finish = (success) => {
      if (success) {
        const wrap = img.closest(".sj-toolbox-card-icon");
        if (wrap) wrap.classList.add("has-image");
        img.dataset.sjtbAvatarState = "loaded";
        img.removeAttribute("data-sjtb-src");
      } else {
        img.dataset.sjtbAvatarState = "error";
        img.remove();
      }
      finishOne();
    };

    img.addEventListener("load", () => finish(true), { once: true });
    img.addEventListener("error", () => finish(false), { once: true });
    img.src = src;
  };

  function pumpQueue() {
    while (activeLoads < MAX_CONCURRENT && queue.length) {
      const img = queue.shift();
      if (!img || !img.isConnected) continue;
      if (img.dataset.sjtbAvatarState !== "queued") continue;
      loadImage(img);
    }
  }

  const enqueue = (img) => {
    if (!img || !img.isConnected) return;
    if (img.dataset.sjtbAvatarState) return;
    if (!img.dataset.sjtbSrc) return;

    img.dataset.sjtbAvatarState = "queued";
    queue.push(img);
    pumpQueue();
  };

  const refresh = () => {
    const images = document.querySelectorAll(SELECTOR);
    if (!images.length) return;

    if (!observer) {
      images.forEach(enqueue);
      return;
    }

    images.forEach((img) => {
      if (!img.dataset.sjtbAvatarState) observer.observe(img);
    });
  };

  const start = () => {
    if (started) {
      refresh();
      return;
    }
    started = true;

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          enqueue(entry.target);
        });
      }, { root: null, rootMargin: ROOT_MARGIN, threshold: 0.01 });
    }

    refresh();
  };

  const startAfterPageLoad = () => {
    if (document.readyState === "complete") {
      window.setTimeout(start, 0);
    } else {
      window.addEventListener("load", () => window.setTimeout(start, 0), { once: true });
    }
  };

  startAfterPageLoad();

  document.addEventListener("pjax:complete", () => {
    window.setTimeout(() => {
      start();
      refresh();
    }, 0);
  });
})();
