const anzhiyu = {
  debounce: (func, wait = 0, immediate = false) => {
    let timeout;
    return (...args) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  throttle: function (func, wait, options = {}) {
    let timeout, context, args;
    let previous = 0;

    const later = () => {
      previous = options.leading === false ? 0 : new Date().getTime();
      timeout = null;
      func.apply(context, args);
      if (!timeout) context = args = null;
    };

    const throttled = (...params) => {
      const now = new Date().getTime();
      if (!previous && options.leading === false) previous = now;
      const remaining = wait - (now - previous);
      context = this;
      args = params;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
    };

    return throttled;
  },

  sidebarPaddingR: () => {
    const innerWidth = window.innerWidth;
    const clientWidth = document.body.clientWidth;
    const paddingRight = innerWidth - clientWidth;
    if (innerWidth !== clientWidth) {
      document.body.style.paddingRight = paddingRight + "px";
    }
  },

  copyPageUrl: async function (url = window.location.href) {
    const text = url || window.location.href;
    let clipboardError = null;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        anzhiyu.snackbarShow("复制链接地址成功", false, 2000);
        return true;
      } catch (error) {
        clipboardError = error;
      }
    }

    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, input.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      clipboardError = clipboardError || error;
    } finally {
      input.remove();
    }

    if (copied) {
      anzhiyu.snackbarShow("复制链接地址成功", false, 2000);
      return true;
    }

    console.error("复制链接地址失败:", clipboardError || new Error("document.execCommand copy failed"));
    anzhiyu.snackbarShow("复制链接地址失败，请手动复制", false, 3000);
    return false;
  },

  snackbarShow: (text, showActionFunction = false, duration = 2000, actionText = false) => {
    const { position, bgLight, bgDark } = GLOBAL_CONFIG.Snackbar;
    const bg = document.documentElement.getAttribute("data-theme") === "light" ? bgLight : bgDark;
    const root = document.querySelector(":root");
    root.style.setProperty("--anzhiyu-snackbar-time", duration + "ms");

    Snackbar.show({
      text: text,
      backgroundColor: bg,
      onActionClick: showActionFunction,
      actionText: actionText,
      showAction: actionText,
      duration: duration,
      pos: position,
      customClass: "snackbar-css",
    });
  },

  loadComment: (dom, callback) => {
    if ("IntersectionObserver" in window) {
      const observerItem = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            callback();
            observerItem.disconnect();
          }
        },
        { threshold: [0] }
      );
      observerItem.observe(dom);
    } else {
      callback();
    }
  },

  scrollToDest: (pos, time = 500) => {
    const currentPos = window.pageYOffset;
    if ("scrollBehavior" in document.documentElement.style) {
      window.scrollTo({
        top: pos,
        behavior: "smooth",
      });
      return;
    }

    let start = null;
    pos = +pos;
    window.requestAnimationFrame(function step(currentTime) {
      start = !start ? currentTime : start;
      const progress = currentTime - start;
      if (currentPos < pos) {
        window.scrollTo(0, ((pos - currentPos) * progress) / time + currentPos);
      } else {
        window.scrollTo(0, currentPos - ((currentPos - pos) * progress) / time);
      }
      if (progress < time) {
        window.requestAnimationFrame(step);
      } else {
        window.scrollTo(0, pos);
      }
    });
  },

  initJustifiedGallery: function (selector) {
    const runJustifiedGallery = i => {
      if (!anzhiyu.isHidden(i)) {
        fjGallery(i, {
          itemSelector: ".fj-gallery-item",
          rowHeight: i.getAttribute("data-rowHeight"),
          gutter: 4,
          onJustify: function () {
            this.$container.style.opacity = "1";
          },
        });
      }
    };

    if (Array.from(selector).length === 0) runJustifiedGallery(selector);
    else
      selector.forEach(i => {
        runJustifiedGallery(i);
      });
  },

  animateIn: (ele, text) => {
    ele.style.display = "block";
    ele.style.animation = text;
  },

  animateOut: (ele, text) => {
    ele.addEventListener("animationend", function f() {
      ele.style.display = "";
      ele.style.animation = "";
      ele.removeEventListener("animationend", f);
    });
    ele.style.animation = text;
  },

  /**
   * @param {*} selector
   * @param {*} eleType the type of create element
   * @param {*} options object key: value
   */
  wrap: (selector, eleType, options) => {
    const creatEle = document.createElement(eleType);
    for (const [key, value] of Object.entries(options)) {
      creatEle.setAttribute(key, value);
    }
    selector.parentNode.insertBefore(creatEle, selector);
    creatEle.appendChild(selector);
  },

  isHidden: ele => ele.offsetHeight === 0 && ele.offsetWidth === 0,

  getEleTop: ele => {
    let actualTop = ele.offsetTop;
    let current = ele.offsetParent;

    while (current !== null) {
      actualTop += current.offsetTop;
      current = current.offsetParent;
    }

    return actualTop;
  },

  loadLightbox: ele => {
    const service = GLOBAL_CONFIG.lightbox;

    if (service === "mediumZoom") {
      const zoom = mediumZoom(ele);
      zoom.on("open", e => {
        const photoBg = document.documentElement.getAttribute("data-theme") === "dark" ? "#121212" : "#fff";
        zoom.update({
          background: photoBg,
        });
      });
    }

    if (service === "fancybox") {
      Array.from(ele).forEach(i => {
        if (i.parentNode.tagName !== "A") {
          const dataSrc = i.dataset.lazySrc || i.src;
          const dataCaption = i.title || i.alt || "";
          anzhiyu.wrap(i, "a", {
            href: dataSrc,
            "data-fancybox": "gallery",
            "data-caption": dataCaption,
            "data-thumb": dataSrc,
          });
        }
      });

      if (!window.fancyboxRun) {
        Fancybox.bind("[data-fancybox]", {
          Hash: false,
          Thumbs: {
            autoStart: false,
          },
        });
        window.fancyboxRun = true;
      }
    }
  },

  setLoading: {
    add: ele => {
      const html = `
        <div class="loading-container">
          <div class="loading-item">
            <div></div><div></div><div></div><div></div><div></div>
          </div>
        </div>
      `;
      ele.insertAdjacentHTML("afterend", html);
    },
    remove: ele => {
      ele.nextElementSibling.remove();
    },
  },

  updateAnchor: anchor => {
    if (anchor !== window.location.hash) {
      if (!anchor) anchor = location.pathname;
      const title = GLOBAL_CONFIG_SITE.title;
      window.history.replaceState(
        {
          url: location.href,
          title,
        },
        title,
        anchor
      );
    }
  },

  getScrollPercent: (currentTop, ele) => {
    const docHeight = ele.clientHeight;
    const winHeight = document.documentElement.clientHeight;
    const headerHeight = ele.offsetTop;
    const contentMath =
      docHeight > winHeight ? docHeight - winHeight : document.documentElement.scrollHeight - winHeight;
    const scrollPercent = (currentTop - headerHeight) / contentMath;
    const scrollPercentRounded = Math.round(scrollPercent * 100);
    const percentage = scrollPercentRounded > 100 ? 100 : scrollPercentRounded <= 0 ? 0 : scrollPercentRounded;
    return percentage;
  },

  addGlobalFn: (key, fn, name = false, parent = window) => {
    const globalFn = parent.globalFn || {};
    const keyObj = globalFn[key] || {};

    if (name && keyObj[name]) return;

    name = name || Object.keys(keyObj).length;
    keyObj[name] = fn;
    globalFn[key] = keyObj;
    parent.globalFn = globalFn;
  },

  addEventListenerPjax: (ele, event, fn, option = false) => {
    ele.addEventListener(event, fn, option);
    anzhiyu.addGlobalFn("pjax", () => {
      ele.removeEventListener(event, fn, option);
    });
  },

  removeGlobalFnEvent: (key, parent = window) => {
    const { globalFn = {} } = parent;
    const keyObj = globalFn[key] || {};
    const keyArr = Object.keys(keyObj);
    if (!keyArr.length) return;
    keyArr.forEach(i => {
      keyObj[i]();
    });
    delete parent.globalFn[key];
  },

  //更改主题色
  changeThemeMetaColor: function (color) {
    // console.info(`%c ${color}`, `font-size:36px;color:${color};`);
    if (themeColorMeta !== null) {
      themeColorMeta.setAttribute("content", color);
    }
  },

  //顶栏自适应主题色
  initThemeColor: function () {
    let themeColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--anzhiyu-bar-background")
      .trim()
      .replace('"', "")
      .replace('"', "");
    const currentTop = window.scrollY || document.documentElement.scrollTop;
    if (currentTop > 26) {
      if (anzhiyu.is_Post()) {
        themeColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--anzhiyu-meta-theme-post-color")
          .trim()
          .replace('"', "")
          .replace('"', "");
      }
      if (themeColorMeta.getAttribute("content") === themeColor) return;
      this.changeThemeMetaColor(themeColor);
    } else {
      if (themeColorMeta.getAttribute("content") === themeColor) return;
      this.changeThemeMetaColor(themeColor);
    }
  },
  //是否是文章页
  is_Post: function () {
    return typeof GLOBAL_CONFIG_SITE !== "undefined" && GLOBAL_CONFIG_SITE.isPost === true;
  },
  //监测是否在页面开头
  addNavBackgroundInit: function () {
    var scrollTop = 0,
      bodyScrollTop = 0,
      documentScrollTop = 0;
    if ($bodyWrap) {
      bodyScrollTop = $bodyWrap.scrollTop;
    }
    if (document.documentElement) {
      documentScrollTop = document.documentElement.scrollTop;
    }
    scrollTop = bodyScrollTop - documentScrollTop > 0 ? bodyScrollTop : documentScrollTop;

    if (scrollTop != 0) {
      pageHeaderEl.classList.add("nav-fixed");
      pageHeaderEl.classList.add("nav-visible");
    }
  },
  // 下载图片
  downloadImage: async function (imgsrc, name) {
    rm.hideRightMenu();
    if (rm.downloadimging) {
      anzhiyu.snackbarShow("有正在进行中的下载，请稍后再试");
      return;
    }

    rm.downloadimging = true;
    anzhiyu.snackbarShow("正在下载图片，请稍后", false, 3000);
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("图片加载失败或不允许跨域读取"));
        image.src = imgsrc;
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("浏览器无法创建图片画布");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => {
          if (result) resolve(result);
          else reject(new Error("无法生成下载图片"));
        }, "image/png");
      });

      let sourceName = "image";
      try {
        const pathname = new URL(imgsrc, window.location.href).pathname;
        const rawName = decodeURIComponent(pathname.split("/").pop() || "");
        sourceName = rawName.replace(/\.[^.]+$/, "") || "image";
      } catch (error) {
        console.warn("无法从图片地址解析文件名，将使用默认名称", error);
      }
      const requestedName = name ? String(name).replace(/\.[^.]+$/, "") : sourceName;
      const fileName = `${requestedName || "image"}.png`;

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = fileName;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      anzhiyu.snackbarShow("图片下载已开始", false, 2000);
    } catch (error) {
      console.error("图片下载失败:", error);
      anzhiyu.snackbarShow("图片下载失败，请检查图片地址或跨域限制", false, 3000);
    } finally {
      rm.downloadimging = false;
    }
  },
  //禁止图片右键单击
  stopImgRightDrag: function () {
    var img = document.getElementsByTagName("img");
    for (var i = 0; i < img.length; i++) {
      img[i].addEventListener("dragstart", function () {
        return false;
      });
    }
  },
  //滚动到指定id
  scrollTo: function (id) {
    var domTop = document.querySelector(id).offsetTop;
    window.scrollTo(0, domTop - 80);
  },
  //隐藏侧边栏
  hideAsideBtn: () => {
    // Hide aside
    const $htmlDom = document.documentElement.classList;
    $htmlDom.contains("hide-aside")
      ? saveToLocal.set("aside-status", "show", 2)
      : saveToLocal.set("aside-status", "hide", 2);
    $htmlDom.toggle("hide-aside");
    $htmlDom.contains("hide-aside")
      ? document.querySelector("#consoleHideAside").classList.add("on")
      : document.querySelector("#consoleHideAside").classList.remove("on");
  },
  // 热评切换
  switchCommentBarrage: function () {
    let commentBarrage = document.querySelector(".comment-barrage");
    if (commentBarrage) {
      if (window.getComputedStyle(commentBarrage).display === "flex") {
        commentBarrage.style.display = "none";
        anzhiyu.snackbarShow("✨ 已关闭评论弹幕");
        document.querySelector(".menu-commentBarrage-text").textContent = "显示热评";
        document.querySelector("#consoleCommentBarrage").classList.remove("on");
        localStorage.setItem("commentBarrageSwitch", "false");
      } else {
        commentBarrage.style.display = "flex";
        document.querySelector(".menu-commentBarrage-text").textContent = "关闭热评";
        document.querySelector("#consoleCommentBarrage").classList.add("on");
        anzhiyu.snackbarShow("✨ 已开启评论弹幕");
        localStorage.removeItem("commentBarrageSwitch");
      }
    }
    rm && rm.hideRightMenu();
  },
  initPaginationObserver: () => {
    const commentElement = document.getElementById("post-comment");
    const paginationElement = document.getElementById("pagination");

    if (commentElement && paginationElement) {
      new IntersectionObserver(entries => {
        const commentBarrage = document.querySelector(".comment-barrage");

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            paginationElement.classList.add("show-window");
            if (commentBarrage) {
              commentBarrage.style.bottom = "-200px";
            }
          } else {
            paginationElement.classList.remove("show-window");
            if (commentBarrage) {
              commentBarrage.style.bottom = "0px";
            }
          }
        });
      }).observe(commentElement);
    }
  },
  // 初始化即刻
  initIndexEssay: function () {
    if (!document.getElementById("bbTimeList")) return;
    setTimeout(() => {
      let essay_bar_swiper = new Swiper(".essay_bar_swiper_container", {
        passiveListeners: true,
        direction: "vertical",
        loop: true,
        autoplay: {
          disableOnInteraction: true,
          delay: 3000,
        },
        mousewheel: true,
      });

      let essay_bar_comtainer = document.getElementById("bbtalk");
      if (essay_bar_comtainer !== null) {
        essay_bar_comtainer.onmouseenter = function () {
          essay_bar_swiper.autoplay.stop();
        };
        essay_bar_comtainer.onmouseleave = function () {
          essay_bar_swiper.autoplay.start();
        };
      }
    }, 100);
  },
  scrollByMouseWheel: function ($list, $target) {
    const scrollHandler = function (e) {
      $list.scrollLeft -= e.wheelDelta / 2;
      e.preventDefault();
    };
    $list.addEventListener("mousewheel", scrollHandler, { passive: false });
    if ($target) {
      $target.classList.add("selected");
      $list.scrollLeft = $target.offsetLeft - $list.offsetLeft - ($list.offsetWidth - $target.offsetWidth) / 2;
    }
  },
  // catalog激活
  catalogActive: function () {
    const $list = document.getElementById("catalog-list");
    if ($list) {
      const pathname = decodeURIComponent(window.location.pathname);
      const catalogListItems = $list.querySelectorAll(".catalog-list-item");

      let $catalog = null;
      catalogListItems.forEach(item => {
        if (pathname.startsWith(item.id)) {
          $catalog = item;
          return;
        }
      });

      anzhiyu.scrollByMouseWheel($list, $catalog);
    }
  },
  // Page Tag 激活
  tagsPageActive: function () {
    const $list = document.getElementById("tag-page-tags");
    if ($list) {
      const $tagPageTags = document.getElementById(decodeURIComponent(window.location.pathname));
      anzhiyu.scrollByMouseWheel($list, $tagPageTags);
    }
  },
  // 修改时间显示"最近"
  diffDate: function (d, more = false, simple = false) {
    const dateNow = new Date();
    const datePost = new Date(d);
    const dateDiff = dateNow.getTime() - datePost.getTime();
    const minute = 1000 * 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;

    let result;
    if (more) {
      const monthCount = dateDiff / month;
      const dayCount = dateDiff / day;
      const hourCount = dateDiff / hour;
      const minuteCount = dateDiff / minute;

      if (monthCount >= 1) {
        result = datePost.toLocaleDateString().replace(/\//g, "-");
      } else if (dayCount >= 1) {
        result = parseInt(dayCount) + " " + GLOBAL_CONFIG.date_suffix.day;
      } else if (hourCount >= 1) {
        result = parseInt(hourCount) + " " + GLOBAL_CONFIG.date_suffix.hour;
      } else if (minuteCount >= 1) {
        result = parseInt(minuteCount) + " " + GLOBAL_CONFIG.date_suffix.min;
      } else {
        result = GLOBAL_CONFIG.date_suffix.just;
      }
    } else if (simple) {
      const monthCount = dateDiff / month;
      const dayCount = dateDiff / day;
      const hourCount = dateDiff / hour;
      const minuteCount = dateDiff / minute;
      if (monthCount >= 1) {
        result = datePost.toLocaleDateString().replace(/\//g, "-");
      } else if (dayCount >= 1 && dayCount <= 3) {
        result = parseInt(dayCount) + " " + GLOBAL_CONFIG.date_suffix.day;
      } else if (dayCount > 3) {
        result = datePost.getMonth() + 1 + "/" + datePost.getDate();
      } else if (hourCount >= 1) {
        result = parseInt(hourCount) + " " + GLOBAL_CONFIG.date_suffix.hour;
      } else if (minuteCount >= 1) {
        result = parseInt(minuteCount) + " " + GLOBAL_CONFIG.date_suffix.min;
      } else {
        result = GLOBAL_CONFIG.date_suffix.just;
      }
    } else {
      result = parseInt(dateDiff / day);
    }
    return result;
  },

  // 修改即刻中的时间显示
  changeTimeInEssay: function () {
    document.querySelector("#bber") &&
      document.querySelectorAll("#bber time").forEach(function (e) {
        var t = e,
          datetime = t.getAttribute("datetime");
        (t.innerText = anzhiyu.diffDate(datetime, true)), (t.style.display = "inline");
      });
  },
  // 修改相册集中的时间
  changeTimeInAlbumDetail: function () {
    document.querySelector("#album_detail") &&
      document.querySelectorAll("#album_detail time").forEach(function (e) {
        var t = e,
          datetime = t.getAttribute("datetime");
        (t.innerText = anzhiyu.diffDate(datetime, true)), (t.style.display = "inline");
      });
  },
  // 刷新瀑布流
  reflashEssayWaterFall: function () {
    const waterfallEl = document.getElementById("waterfall");
    if (waterfallEl) {
      setTimeout(function () {
        waterfall(waterfallEl);
        waterfallEl.classList.add("show");
      }, 800);
    }
  },
  sayhi: function () {
    const $sayhiEl = document.getElementById("author-info__sayhi");

    const getTimeState = () => {
      const hour = new Date().getHours();
      let message = "";

      if (hour >= 0 && hour <= 5) {
        message = "睡个好觉，保证精力充沛";
      } else if (hour > 5 && hour <= 10) {
        message = "一日之计在于晨";
      } else if (hour > 10 && hour <= 14) {
        message = "吃饱了才有力气干活";
      } else if (hour > 14 && hour <= 18) {
        message = "集中精力，攻克难关";
      } else if (hour > 18 && hour <= 24) {
        message = "不要太劳累了，早睡更健康";
      }

      return message;
    };

    if ($sayhiEl) {
      $sayhiEl.innerHTML = getTimeState();
    }
  },

  // 友链注入预设评论
  addFriendLink() {
    var input = document.getElementsByClassName("el-textarea__inner")[0];
    if (!input) return;
    const evt = new Event("input", { cancelable: true, bubbles: true });
    const defaultPlaceholder =
      "昵称（请勿包含博客等字样）：\n网站地址（要求博客地址，请勿提交个人主页）：\n头像图片url（请提供尽可能清晰的图片，我会上传到我自己的图床）：\n描述：\n站点截图（可选）：\n";
    input.value = this.getConfigIfPresent(GLOBAL_CONFIG.linkPageTop, "addFriendPlaceholder", defaultPlaceholder);
    input.dispatchEvent(evt);
    input.focus();
    input.setSelectionRange(-1, -1);
  },
  // 获取配置，如果为空则返回默认值
  getConfigIfPresent: function (config, configKey, defaultValue) {
    if (!config) return defaultValue;
    if (!config.hasOwnProperty(configKey)) return defaultValue;
    if (!config[configKey]) return defaultValue;
    return config[configKey];
  },
  //切换音乐播放状态
  musicToggle: function (changePaly = true) {
    const navMeting = document.querySelector("#nav-music meting-js");
    const navAplayer = navMeting?.aplayer;
    if (!navAplayer) {
      anzhiyu.snackbarShow("音乐播放器加载中，请稍后重试", false, 2000);
      rm && rm.hideRightMenu();
      return;
    }

    if (!anzhiyu_musicFirst) {
      anzhiyu_musicFirst = anzhiyu.musicBindEvent();
      if (!anzhiyu_musicFirst) {
        anzhiyu.snackbarShow("音乐播放器加载中，请稍后重试", false, 2000);
        rm && rm.hideRightMenu();
        return;
      }
    }
    let msgPlay = '<i class="anzhiyufont anzhiyu-icon-play"></i><span>播放音乐</span>';
    let msgPause = '<i class="anzhiyufont anzhiyu-icon-pause"></i><span>暂停音乐</span>';
    if (anzhiyu_musicPlaying) {
      navMusicEl.classList.remove("playing");
      const menuMusicToggle = document.getElementById("menu-music-toggle");
      if (menuMusicToggle) menuMusicToggle.innerHTML = msgPlay;
      document.getElementById("nav-music-hoverTips").innerHTML = "音乐已暂停";
      document.querySelector("#consoleMusic")?.classList.remove("on");
      anzhiyu_musicPlaying = false;
      navMusicEl.classList.remove("stretch");
    } else {
      navMusicEl.classList.add("playing");
      const menuMusicToggle = document.getElementById("menu-music-toggle");
      if (menuMusicToggle) menuMusicToggle.innerHTML = msgPause;
      document.querySelector("#consoleMusic")?.classList.add("on");
      anzhiyu_musicPlaying = true;
      navMusicEl.classList.add("stretch");
    }
    if (changePaly) navAplayer.toggle();
    rm && rm.hideRightMenu();
  },
  // 音乐伸缩
  musicTelescopic: function () {
    if (navMusicEl.classList.contains("stretch")) {
      navMusicEl.classList.remove("stretch");
    } else {
      navMusicEl.classList.add("stretch");
    }
  },

  //音乐上一曲
  musicSkipBack: function () {
    const navAplayer = navMusicEl?.querySelector("meting-js")?.aplayer;
    if (!navAplayer) {
      anzhiyu.snackbarShow("音乐播放器加载中，请稍后重试", false, 2000);
      rm && rm.hideRightMenu();
      return;
    }
    navAplayer.skipBack();
    rm && rm.hideRightMenu();
  },

  //音乐下一曲
  musicSkipForward: function () {
    const navAplayer = navMusicEl?.querySelector("meting-js")?.aplayer;
    if (!navAplayer) {
      anzhiyu.snackbarShow("音乐播放器加载中，请稍后重试", false, 2000);
      rm && rm.hideRightMenu();
      return;
    }
    navAplayer.skipForward();
    rm && rm.hideRightMenu();
  },

  //获取音乐中的名称
  musicGetName: function () {
    const title = document.querySelector("#nav-music .aplayer-title");
    return title?.innerText?.trim() || "";
  },

  //初始化console图标
  initConsoleState: function () {
    //初始化隐藏边栏
    const $htmlDomClassList = document.documentElement.classList;
    $htmlDomClassList.contains("hide-aside")
      ? document.querySelector("#consoleHideAside").classList.add("on")
      : document.querySelector("#consoleHideAside").classList.remove("on");
  },

  // 显示打赏中控台
  rewardShowConsole: function () {
    // 判断是否为赞赏打开控制台
    consoleEl.classList.add("reward-show");
    anzhiyu.initConsoleState();
  },
  // 显示中控台
  showConsole: function () {
    consoleEl.classList.add("show");
    anzhiyu.initConsoleState();
  },

  //隐藏中控台
  hideConsole: function () {
    if (consoleEl.classList.contains("show")) {
      // 如果是一般控制台，就关闭一般控制台
      consoleEl.classList.remove("show");
    } else if (consoleEl.classList.contains("reward-show")) {
      // 如果是打赏控制台，就关闭打赏控制台
      consoleEl.classList.remove("reward-show");
    }
    // 获取center-console元素
    const centerConsole = document.getElementById("center-console");

    // 检查center-console是否被选中
    if (centerConsole.checked) {
      // 取消选中状态
      centerConsole.checked = false;
    }
  },
  // 取消加载动画
  hideLoading: function () {
    document.getElementById("loading-box").classList.add("loaded");
  },
  // 将音乐缓存播放
  cacheAndPlayMusic() {
    let cacheData = null;
    const rawCache = localStorage.getItem("musicData");
    if (rawCache) {
      try {
        cacheData = JSON.parse(rawCache);
      } catch (error) {
        console.warn("音乐缓存已损坏，将重新加载", error);
        localStorage.removeItem("musicData");
      }
    }

    const currentTime = Date.now();
    if (
      cacheData &&
      Number.isFinite(cacheData.timestamp) &&
      currentTime - cacheData.timestamp < 24 * 60 * 60 * 1000 &&
      Array.isArray(cacheData.songs) &&
      cacheData.songs.length > 0
    ) {
      anzhiyu.playMusic(cacheData.songs);
      return;
    }

    fetch("/json/music.json")
      .then(response => {
        if (!response.ok) throw new Error(`音乐列表请求失败：${response.status}`);
        return response.json();
      })
      .then(songs => {
        if (!Array.isArray(songs) || songs.length === 0) {
          throw new Error("音乐列表为空或格式无效");
        }
        const freshCache = {
          timestamp: Date.now(),
          songs,
        };
        localStorage.setItem("musicData", JSON.stringify(freshCache));
        anzhiyu.playMusic(songs);
      })
      .catch(error => {
        console.error("音乐列表加载失败:", error);
        localStorage.removeItem("musicData");
        anzhiyu.snackbarShow("音乐列表加载失败，请稍后重试", false, 3000);
      });
  },
  // 播放音乐
  playMusic(songs) {
    if (!Array.isArray(songs) || songs.length === 0) {
      console.warn("没有可播放的音乐数据");
      anzhiyu.snackbarShow("暂无可播放的歌曲", false, 2500);
      return;
    }
    const anMusicPage = document.getElementById("anMusic-page");
    const metingAplayer = anMusicPage?.querySelector("meting-js")?.aplayer;
    if (!metingAplayer?.list?.audios) {
      console.warn("音乐播放器尚未准备完成");
      anzhiyu.snackbarShow("音乐播放器尚未准备完成，请稍后重试", false, 2500);
      return;
    }
    const randomIndex = Math.floor(Math.random() * songs.length);
    const randomSong = songs[randomIndex];
    const allAudios = metingAplayer.list.audios;
    if (!selectRandomSong.includes(randomSong.name)) {
      // 如果随机到的歌曲已经未被随机到过，就添加进metingAplayer.list
      metingAplayer.list.add([randomSong]);
      // 播放最后一首(因为是添加到了最后)
      metingAplayer.list.switch(allAudios.length);
      // 添加到已被随机的歌曲列表
      selectRandomSong.push(randomSong.name);
    } else {
      // 随机到的歌曲已经在播放列表中了
      // 直接继续随机直到随机到没有随机过的歌曲，如果全部随机过了就切换到对应的歌曲播放即可
      let songFound = false;
      while (!songFound) {
        const newRandomIndex = Math.floor(Math.random() * songs.length);
        const newRandomSong = songs[newRandomIndex];
        if (!selectRandomSong.includes(newRandomSong.name)) {
          metingAplayer.list.add([newRandomSong]);
          metingAplayer.list.switch(allAudios.length);
          selectRandomSong.push(newRandomSong.name);
          songFound = true;
        }
        // 如果全部歌曲都已被随机过，跳出循环
        if (selectRandomSong.length === songs.length) {
          break;
        }
      }
      if (!songFound) {
        // 如果全部歌曲都已被随机过，切换到对应的歌曲播放
        const palyMusicIndex = allAudios.findIndex(song => song.name === randomSong.name);
        if (palyMusicIndex != -1) metingAplayer.list.switch(palyMusicIndex);
      }
    }

  },
  // 音乐节目切换背景
  changeMusicBg: function (isChangeBg = true) {
    const anMusicBg = document.getElementById("an_music_bg");

    if (isChangeBg) {
      // player listswitch 会进入此处
      const musiccover = document.querySelector("#anMusic-page .aplayer-pic");
      if (anMusicBg && musiccover) anMusicBg.style.backgroundImage = musiccover.style.backgroundImage;
    } else {
      // 第一次进入，等待播放器加载；离开页面或超时后停止轮询
      let attempts = 0;
      const maxAttempts = 100;
      const timer = setInterval(() => {
        if (!window.location.pathname.startsWith("/music/")) {
          clearInterval(timer);
          return;
        }

        const musiccover = document.querySelector("#anMusic-page .aplayer-pic");
        if (musiccover) {
          clearInterval(timer);
          anzhiyu.addEventListenerMusic();
          anzhiyu.changeMusicBg();

          const navMeting = document.querySelector("#nav-music meting-js");
          if (navMeting?.aplayer && !navMeting.aplayer.audio.paused) {
            anzhiyu.musicToggle();
          }
          return;
        }

        attempts += 1;
        if (attempts >= maxAttempts) {
          clearInterval(timer);
          console.warn("音乐播放器加载超时，已停止等待");
        }
      }, 100);
    }
  },
  ensureMetingLifecycleGuard: function () {
    const MetingElement = window.customElements?.get("meting-js");
    const prototype = MetingElement?.prototype;
    if (!prototype || prototype.__anzhiyuLifecycleGuarded) return;

    prototype.__anzhiyuLifecycleGuarded = true;
    const originalDisconnectedCallback = prototype.disconnectedCallback;
    const originalLoadPlayer = prototype._loadPlayer;

    const aplayerPrototype = window.APlayer?.prototype;
    if (aplayerPrototype && !aplayerPrototype.__anzhiyuDestroyedSkipGuarded) {
      aplayerPrototype.__anzhiyuDestroyedSkipGuarded = true;
      const originalSkipForward = aplayerPrototype.skipForward;
      const originalSkipBack = aplayerPrototype.skipBack;
      if (typeof originalSkipForward === "function") {
        aplayerPrototype.skipForward = function (...args) {
          if (this.__anzhiyuDestroyed || !this.container?.isConnected) return;
          return originalSkipForward.apply(this, args);
        };
      }
      if (typeof originalSkipBack === "function") {
        aplayerPrototype.skipBack = function (...args) {
          if (this.__anzhiyuDestroyed || !this.container?.isConnected) return;
          return originalSkipBack.apply(this, args);
        };
      }
    }

    prototype.disconnectedCallback = function () {
      const aplayer = this.aplayer;
      if (this.lock || !aplayer || aplayer.__anzhiyuDestroyed) return;
      aplayer.__anzhiyuDestroyed = true;
      try {
        if (typeof originalDisconnectedCallback === "function") {
          originalDisconnectedCallback.call(this);
        } else if (typeof aplayer.destroy === "function") {
          aplayer.destroy();
        }
      } catch (error) {
        console.warn("Meting 播放器销毁异常已拦截", error);
      }
    };

    if (typeof originalLoadPlayer === "function") {
      prototype._loadPlayer = function (data) {
        if (!this.isConnected) return;
        return originalLoadPlayer.call(this, data);
      };
    }

    if (!anzhiyu.musicPageKeyCleanupBound) {
      document.addEventListener("pjax:send", () => {
        if (anzhiyu.musicPageKeydownHandler) {
          document.removeEventListener("keydown", anzhiyu.musicPageKeydownHandler);
          anzhiyu.musicPageKeydownHandler = null;
        }
      });
      anzhiyu.musicPageKeyCleanupBound = true;
    }
  },

  // 获取自定义播放列表
  getCustomPlayList: function () {
    if (!window.location.pathname.startsWith("/music/")) return;

    const anMusicPage = document.getElementById("anMusic-page");
    const anMusicPageMeting = document.getElementById("anMusic-page-meting");
    if (!anMusicPage || !anMusicPageMeting) return;

    anzhiyu.ensureMetingLifecycleGuard();

    const urlParams = new URLSearchParams(window.location.search);
    const defaultId = String(anMusicPage.dataset.musicId || "");
    const defaultServer = String(anMusicPage.dataset.musicServer || "netease").toLowerCase();
    const requestedId = urlParams.get("id");
    const requestedServer = (urlParams.get("server") || "").toLowerCase();
    const allowedServers = new Set(["netease", "tencent", "kugou", "xiami", "baidu"]);
    const validId = requestedId && /^[A-Za-z0-9_-]{1,128}$/.test(requestedId);
    const validServer = allowedServers.has(requestedServer);
    const playlistId = validId && validServer ? requestedId : defaultId;
    const playlistServer = validId && validServer ? requestedServer : defaultServer;

    const existingMeting = anMusicPageMeting.querySelector("meting-js");
    if (
      existingMeting &&
      existingMeting.getAttribute("id") === playlistId &&
      (existingMeting.getAttribute("server") || "netease").toLowerCase() === playlistServer
    ) {
      anzhiyu.changeMusicBg(false);
      return;
    }

    const meting = document.createElement("meting-js");
    meting.setAttribute("id", playlistId);
    meting.setAttribute("server", playlistServer);
    meting.setAttribute("type", "playlist");
    meting.setAttribute("mutex", "true");
    meting.setAttribute("preload", "auto");
    meting.setAttribute("theme", "var(--anzhiyu-main)");
    meting.setAttribute("order", "list");
    meting.setAttribute("list-max-height", "calc(100vh - 169px)!important");
    anMusicPageMeting.replaceChildren(meting);
    anzhiyu.changeMusicBg(false);
  },
  //隐藏今日推荐
  hideTodayCard: function () {
    if (document.getElementById("todayCard")) {
      document.getElementById("todayCard").classList.add("hide");
      const topGroup = document.querySelector(".topGroup");
      const recentPostItems = topGroup.querySelectorAll(".recent-post-item");
      recentPostItems.forEach(item => {
        item.style.display = "flex";
      });
    }
  },

  // 监听音乐背景改变
  addEventListenerMusic: function () {
    const anMusicPage = document.getElementById("anMusic-page");
    const aplayerIconMenu = anMusicPage.querySelector(".aplayer-info .aplayer-time .aplayer-icon-menu");
    const anMusicBtnGetSong = anMusicPage.querySelector("#anMusicBtnGetSong");
    const anMusicRefreshBtn = anMusicPage.querySelector("#anMusicRefreshBtn");
    const anMusicSwitchingBtn = anMusicPage.querySelector("#anMusicSwitching");
    const metingAplayer = anMusicPage.querySelector("meting-js").aplayer;
    // 初始化音量，保持与 nav_music.volume 配置一致
    const configuredVolume = Number(anMusicPage.dataset.musicVolume);
    if (Number.isFinite(configuredVolume)) musicVolume = configuredVolume;
    metingAplayer.volume(musicVolume, true);
    metingAplayer.on("loadeddata", function () {
      anzhiyu.changeMusicBg();
    });

    aplayerIconMenu.addEventListener("click", function () {
      document.getElementById("menu-mask").style.display = "block";
      document.getElementById("menu-mask").style.animation = "0.5s ease 0s 1 normal none running to_show";
      anMusicPage.querySelector(".aplayer.aplayer-withlist .aplayer-list").style.opacity = "1";
    });

    function anMusicPageMenuAask() {
      if (window.location.pathname != "/music/") {
        document.getElementById("menu-mask").removeEventListener("click", anMusicPageMenuAask);
        return;
      }

      anMusicPage.querySelector(".aplayer-list").classList.remove("aplayer-list-hide");
    }

    document.getElementById("menu-mask").addEventListener("click", anMusicPageMenuAask);

    // 监听增加单曲按钮
    anMusicBtnGetSong.addEventListener("click", () => {
      if (changeMusicListFlag) {
        const anMusicPage = document.getElementById("anMusic-page");
        const metingAplayer = anMusicPage.querySelector("meting-js").aplayer;
        const allAudios = metingAplayer.list.audios;
        const randomIndex = Math.floor(Math.random() * allAudios.length);
        // 随机播放一首
        metingAplayer.list.switch(randomIndex);
      } else {
        anzhiyu.cacheAndPlayMusic();
      }
    });
    anMusicRefreshBtn.addEventListener("click", () => {
      localStorage.removeItem("musicData");
      anzhiyu.snackbarShow("已移除相关缓存歌曲");
    });
    anMusicSwitchingBtn.addEventListener("click", () => {
      anzhiyu.changeMusicList();
    });

    // 默认加载的歌单
    if (GLOBAL_CONFIG.music_page_default === "custom") {
      anzhiyu.changeMusicList();
    }

    // 监听键盘事件。重新初始化前移除旧监听，避免 PJAX 多次进入后重复触发。
    if (anzhiyu.musicPageKeydownHandler) {
      document.removeEventListener("keydown", anzhiyu.musicPageKeydownHandler);
    }
    anzhiyu.musicPageKeydownHandler = function (event) {
      if (!window.location.pathname.startsWith("/music/")) return;

      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        metingAplayer.toggle();
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        metingAplayer.skipForward();
      } else if (event.code === "ArrowLeft") {
        event.preventDefault();
        metingAplayer.skipBack();
      } else if (event.code === "ArrowUp") {
        event.preventDefault();
        musicVolume = Math.min(1, Number((musicVolume + 0.1).toFixed(1)));
        metingAplayer.volume(musicVolume, true);
      } else if (event.code === "ArrowDown") {
        event.preventDefault();
        musicVolume = Math.max(0, Number((musicVolume - 0.1).toFixed(1)));
        metingAplayer.volume(musicVolume, true);
      }
    };
    document.addEventListener("keydown", anzhiyu.musicPageKeydownHandler);
  },
  // 切换歌单
  changeMusicList: async function () {
    const anMusicPage = document.getElementById("anMusic-page");
    const metingAplayer = anMusicPage?.querySelector("meting-js")?.aplayer;
    if (!metingAplayer?.list?.audios) {
      anzhiyu.snackbarShow("音乐播放器尚未准备完成，请稍后重试", false, 2500);
      return;
    }

    const currentTime = Date.now();
    let cacheData = { timestamp: 0, songs: [] };
    const rawCache = localStorage.getItem("musicData");
    if (rawCache) {
      try {
        const parsedCache = JSON.parse(rawCache);
        if (parsedCache && typeof parsedCache === "object") cacheData = parsedCache;
      } catch (error) {
        console.warn("音乐缓存已损坏，将重新加载", error);
        localStorage.removeItem("musicData");
      }
    }

    try {
      let songs = [];
      if (changeMusicListFlag) {
        songs = Array.isArray(defaultPlayMusicList) ? defaultPlayMusicList : [];
      } else {
        // 保存当前默认播放列表，以使下次可以切换回来
        defaultPlayMusicList = [...metingAplayer.list.audios];
        if (
          Number.isFinite(cacheData.timestamp) &&
          currentTime - cacheData.timestamp < 24 * 60 * 60 * 1000 &&
          Array.isArray(cacheData.songs) &&
          cacheData.songs.length > 0
        ) {
          songs = cacheData.songs;
        } else {
          const response = await fetch("/json/music.json");
          if (!response.ok) throw new Error(`音乐列表请求失败：${response.status}`);
          songs = await response.json();
          if (!Array.isArray(songs) || songs.length === 0) {
            throw new Error("音乐列表为空或格式无效");
          }
          cacheData = {
            timestamp: currentTime,
            songs,
          };
          localStorage.setItem("musicData", JSON.stringify(cacheData));
        }
      }

      if (!Array.isArray(songs) || songs.length === 0) {
        throw new Error("没有可切换的歌曲");
      }

      metingAplayer.list.clear();
      metingAplayer.list.add(songs);
      changeMusicListFlag = !changeMusicListFlag;
    } catch (error) {
      console.error("歌单切换失败:", error);
      anzhiyu.snackbarShow("歌单切换失败，已保留当前歌单", false, 3000);
    }
  },
  // 控制台音乐列表监听
  addEventListenerConsoleMusicList: function () {
    const navMusic = document.getElementById("nav-music");
    if (!navMusic) return;
    navMusic.addEventListener("click", e => {
      const aplayerList = navMusic.querySelector(".aplayer-list");
      const listBtn = navMusic.querySelector(
        "div.aplayer-info > div.aplayer-controller > div.aplayer-time.aplayer-time-narrow > button.aplayer-icon.aplayer-icon-menu svg"
      );
      if (!aplayerList) return;
      if (e.target != listBtn && aplayerList.classList.contains("aplayer-list-hide")) {
        aplayerList.classList.remove("aplayer-list-hide");
      }
    });
  },
  // 监听按键
  toPage: function () {
    var toPageText = document.getElementById("toPageText"),
      toPageButton = document.getElementById("toPageButton"),
      pageNumbers = document.querySelectorAll(".page-number"),
      lastPageNumber = Number(pageNumbers[pageNumbers.length - 1].innerHTML),
      pageNumber = Number(toPageText.value);

    if (!isNaN(pageNumber) && pageNumber >= 1 && Number.isInteger(pageNumber)) {
      var url = "/page/" + (pageNumber > lastPageNumber ? lastPageNumber : pageNumber) + "/";
      toPageButton.href = pageNumber === 1 ? "/" : url;
    } else {
      toPageButton.href = "javascript:void(0);";
    }
  },

  //删除多余的class
  removeBodyPaceClass: function () {
    document.body.className = "pace-done";
  },
  // 修改body的type类型以适配css
  setValueToBodyType: function () {
    const input = document.getElementById("page-type"); // 获取input元素
    const value = input.value; // 获取input的value值
    document.body.dataset.type = value; // 将value值赋值到body的type属性上
  },
  //匿名评论
  addRandomCommentInfo: function () {
    // 从形容词数组中随机取一个值
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];

    // 从蔬菜水果动物名字数组中随机取一个值
    const randomName = vegetablesAndFruits[Math.floor(Math.random() * vegetablesAndFruits.length)];

    // 将两个值组合成一个字符串
    const name = `${randomAdjective}${randomName}`;

    function dr_js_autofill_commentinfos() {
      var lauthor = [
          "#author",
          "input[name='comname']",
          "#inpName",
          "input[name='author']",
          "#ds-dialog-name",
          "#name",
          "input[name='nick']",
          "#comment_author",
        ],
        lmail = [
          "#mail",
          "#email",
          "input[name='commail']",
          "#inpEmail",
          "input[name='email']",
          "#ds-dialog-email",
          "input[name='mail']",
          "#comment_email",
        ],
        lurl = [
          "#url",
          "input[name='comurl']",
          "#inpHomePage",
          "#ds-dialog-url",
          "input[name='url']",
          "input[name='website']",
          "#website",
          "input[name='link']",
          "#comment_url",
        ];
      for (var i = 0; i < lauthor.length; i++) {
        var author = document.querySelector(lauthor[i]);
        if (author != null) {
          author.value = name;
          author.dispatchEvent(new Event("input"));
          author.dispatchEvent(new Event("change"));
          break;
        }
      }
      for (var j = 0; j < lmail.length; j++) {
        var mail = document.querySelector(lmail[j]);
        if (mail != null) {
          mail.value = visitorMail;
          mail.dispatchEvent(new Event("input"));
          mail.dispatchEvent(new Event("change"));
          break;
        }
      }
      return !1;
    }

    dr_js_autofill_commentinfos();
    var input = document.getElementsByClassName("el-textarea__inner")[0];
    input.focus();
    input.setSelectionRange(-1, -1);
  },

  // 跳转开往
  totraveling: function () {
    anzhiyu.snackbarShow(
      "即将跳转到「开往」项目的成员博客，不保证跳转网站的安全性和可用性",
      element => {
        element.style.opacity = 0;
        travellingsTimer && clearTimeout(travellingsTimer);
      },
      5000,
      "取消"
    );
    travellingsTimer = setTimeout(function () {
      window.open("https://www.travellings.cn/go.html", "_blank");
    }, "5000");
  },

  // 工具函数替换字符串
  replaceAll: function (e, n, t) {
    return e.split(n).join(t);
  },

  // 音乐绑定事件
  musicBindEvent: function () {
    const musicTitle = document.querySelector("#nav-music .aplayer-music");
    const musicButton = document.querySelector("#nav-music .aplayer-button");
    if (!musicTitle || !musicButton) return false;

    musicTitle.addEventListener("click", function () {
      anzhiyu.musicTelescopic();
    });
    musicButton.addEventListener("click", function () {
      anzhiyu.musicToggle(false);
    });
    return true;
  },

  // 判断是否是移动端
  hasMobile: function () {
    let isMobile = false;
    if (
      navigator.userAgent.match(
        /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      ) ||
      document.body.clientWidth < 800
    ) {
      // 移动端
      isMobile = true;
    }
    return isMobile;
  },

  // 创建二维码
  qrcodeCreate: async function () {
    let qrcodeEl = document.getElementById("qrcode");
    if (!qrcodeEl) return;

    if (typeof window.QRCode === "undefined") {
      if (!anzhiyu.qrcodeScriptPromise) {
        anzhiyu.qrcodeScriptPromise = window
          .getScript("https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js")
          .catch(error => {
            anzhiyu.qrcodeScriptPromise = null;
            throw error;
          });
      }
      try {
        await anzhiyu.qrcodeScriptPromise;
      } catch (error) {
        console.error("二维码脚本加载失败:", error);
        return;
      }
    }

    qrcodeEl = document.getElementById("qrcode");
    if (!qrcodeEl || typeof window.QRCode === "undefined") return;
    qrcodeEl.innerHTML = "";
    new window.QRCode(qrcodeEl, {
      text: window.location.href,
      width: 250,
      height: 250,
      colorDark: "#000",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.H,
    });
  },

  // 判断是否在el内
  isInViewPortOfOne: function (el) {
    if (!el) return;
    const viewPortHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    const offsetTop = el.offsetTop;
    const scrollTop = document.documentElement.scrollTop;
    const top = offsetTop - scrollTop;
    return top <= viewPortHeight;
  },
  //添加赞赏蒙版
  addRewardMask: function () {
    if (!document.querySelector(".reward-main")) return;
    document.querySelector(".reward-main").style.display = "flex";
    document.querySelector(".reward-main").style.zIndex = "102";
    document.getElementById("quit-box").style.display = "flex";
  },
  // 移除赞赏蒙版
  removeRewardMask: function () {
    if (!document.querySelector(".reward-main")) return;
    document.querySelector(".reward-main").style.display = "none";
    document.getElementById("quit-box").style.display = "none";
  },

  keyboardToggle: function () {
    const isKeyboardOn = anzhiyu_keyboard;

    if (isKeyboardOn) {
      const consoleKeyboard = document.querySelector("#consoleKeyboard");
      consoleKeyboard.classList.remove("on");
      anzhiyu_keyboard = false;
    } else {
      const consoleKeyboard = document.querySelector("#consoleKeyboard");
      consoleKeyboard.classList.add("on");
      anzhiyu_keyboard = true;
    }

    localStorage.setItem("keyboardToggle", isKeyboardOn ? "false" : "true");
  },
  rightMenuToggle: function () {
    if (window.oncontextmenu) {
      window.oncontextmenu = null;
    } else if (!window.oncontextmenu && oncontextmenuFunction) {
      window.oncontextmenu = oncontextmenuFunction;
    }
  },
  switchConsole: () => {
    // switch console
    const consoleEl = document.getElementById("console");
    //初始化隐藏边栏
    const $htmlDom = document.documentElement.classList;
    $htmlDom.contains("hide-aside")
      ? document.querySelector("#consoleHideAside").classList.add("on")
      : document.querySelector("#consoleHideAside").classList.remove("on");
    if (consoleEl.classList.contains("show")) {
      consoleEl.classList.remove("show");
    } else {
      consoleEl.classList.add("show");
    }
    const consoleKeyboard = document.querySelector("#consoleKeyboard");

    if (consoleKeyboard) {
      if (localStorage.getItem("keyboardToggle") === "true") {
        consoleKeyboard.classList.add("on");
        anzhiyu_keyboard = true;
      } else {
        consoleKeyboard.classList.remove("on");
        anzhiyu_keyboard = false;
      }
    }
  },
  // 定义 intersectionObserver 函数，并接收两个可选参数
  intersectionObserver: function (enterCallback, leaveCallback) {
    let observer;
    return () => {
      if (!observer) {
        observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.intersectionRatio > 0) {
              enterCallback?.();
            } else {
              leaveCallback?.();
            }
          });
        });
      } else {
        // 如果 observer 对象已经存在，则先取消对之前元素的观察
        observer.disconnect();
      }
      return observer;
    };
  },
  // CategoryBar滚动
  scrollCategoryBarToRight: function () {
    // 获取需要操作的元素
    const items = document.getElementById("catalog-list");
    const nextButton = document.getElementById("category-bar-next");

    // 检查元素是否存在
    if (items && nextButton) {
      const itemsWidth = items.clientWidth;

      // 判断是否已经滚动到最右侧
      if (items.scrollLeft + items.clientWidth + 1 >= items.scrollWidth) {
        // 滚动到初始位置并更新按钮内容
        items.scroll({
          left: 0,
          behavior: "smooth",
        });
        nextButton.innerHTML = '<i class="anzhiyufont anzhiyu-icon-angle-double-right"></i>';
      } else {
        // 滚动到下一个视图
        items.scrollBy({
          left: itemsWidth,
          behavior: "smooth",
        });
      }
    } else {
      console.error("Element(s) not found: 'catalog-list' and/or 'category-bar-next'.");
    }
  },
  // 分类条
  categoriesBarActive: function () {
    const urlinfo = decodeURIComponent(window.location.pathname);
    const $categoryBar = document.getElementById("category-bar");
    if (!$categoryBar) return;

    if (urlinfo === "/") {
      $categoryBar.querySelector("#首页").classList.add("select");
    } else {
      const pattern = /\/categories\/.*?\//;
      const patbool = pattern.test(urlinfo);
      if (!patbool) return;

      const nowCategorie = urlinfo.split("/")[2];
      $categoryBar.querySelector(`#${nowCategorie}`).classList.add("select");
    }
  },
  topCategoriesBarScroll: function () {
    const $categoryBarItems = document.getElementById("category-bar-items");
    if (!$categoryBarItems) return;

    $categoryBarItems.addEventListener("mousewheel", function (e) {
      const v = -e.wheelDelta / 2;
      this.scrollLeft += v;
      e.preventDefault();
    });
  },
  // 切换菜单显示热评
  switchRightClickMenuHotReview: function () {
    const postComment = document.getElementById("post-comment");
    const menuCommentBarrageDom = document.getElementById("menu-commentBarrage");
    if (!menuCommentBarrageDom) return;

    menuCommentBarrageDom.style.display = postComment ? "flex" : "none";
  },
  // 切换作者卡片状态文字
  changeSayHelloText: function () {
    const greetings = GLOBAL_CONFIG.authorStatus.skills;

    const authorInfoSayHiElement = document.getElementById("author-info__sayhi");

    // 如果只有一个问候语，设置为默认值
    if (greetings.length === 1) {
      authorInfoSayHiElement.textContent = greetings[0];
      return;
    }

    let lastSayHello = authorInfoSayHiElement.textContent;

    let randomGreeting = lastSayHello;
    while (randomGreeting === lastSayHello) {
      randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    }
    authorInfoSayHiElement.textContent = randomGreeting;
  },
};

const anzhiyuPopupManager = {
  queue: [],
  processing: false,
  Jump: false,

  enqueuePopup(title, tip, url, duration = 3000) {
    this.queue.push({ title, tip, url, duration });
    if (!this.processing) {
      this.processQueue();
    }
  },

  processQueue() {
    if (this.queue.length > 0 && !this.processing) {
      this.processing = true;
      const { title, tip, url, duration } = this.queue.shift();
      this.popupShow(title, tip, url, duration);
    }
  },

  popupShow(title, tip, url, duration) {
    const popupWindow = document.getElementById("popup-window");
    if (!popupWindow) return;
    const windowTitle = popupWindow.querySelector(".popup-window-title");
    const windowContent = popupWindow.querySelector(".popup-window-content");
    const cookiesTip = windowContent.querySelector(".popup-tip");
    if (popupWindow.classList.contains("show-popup-window")) {
      popupWindow.classList.add("popup-hide");
    }

    // 等待上一个弹窗完全消失
    setTimeout(() => {
      // 移除之前的点击事件处理程序
      popupWindow.removeEventListener("click", this.clickEventHandler);
      if (url) {
        if (window.pjax) {
          this.clickEventHandler = event => {
            event.preventDefault();
            pjax.loadUrl(url);
            popupWindow.classList.remove("show-popup-window");
            popupWindow.classList.remove("popup-hide");
            this.Jump = true;

            // 处理队列中的下一个弹出窗口
            this.processing = false;
            this.processQueue();
          };

          popupWindow.addEventListener("click", this.clickEventHandler);
        } else {
          this.clickEventHandler = () => {
            window.location.href = url;
          };
          popupWindow.addEventListener("click", this.clickEventHandler);
        }
        if (popupWindow.classList.contains("no-url")) {
          popupWindow.classList.remove("no-url");
        }
      } else {
        if (!popupWindow.classList.contains("no-url")) {
          popupWindow.classList.add("no-url");
        }

        this.clickEventHandler = () => {
          popupWindow.classList.add("popup-hide");
          setTimeout(() => {
            popupWindow.classList.remove("popup-hide");
            popupWindow.classList.remove("show-popup-window");
          }, 1000);
        };
        popupWindow.addEventListener("click", this.clickEventHandler);
      }

      if (popupWindow.classList.contains("popup-hide")) {
        popupWindow.classList.remove("popup-hide");
      }
      popupWindow.classList.add("show-popup-window");
      windowTitle.textContent = title;
      cookiesTip.textContent = tip;
    }, 800);

    setTimeout(() => {
      if (url && !this.Jump) {
        this.Jump = false;
      }
      if (!popupWindow.classList.contains("popup-hide") && popupWindow.className != "") {
        popupWindow.classList.add("popup-hide");
      }

      // 处理队列中的下一个弹出窗口
      this.processing = false;
      this.processQueue();
    }, duration);
  },
};
