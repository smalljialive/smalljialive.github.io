from pathlib import Path
from textwrap import dedent

utils_path = Path("themes/anzhiyu/source/js/utils.js")
right_path = Path("themes/anzhiyu/source/js/anzhiyu/right_click_menu.js")

utils = utils_path.read_text(encoding="utf-8")
right = right_path.read_text(encoding="utf-8")


def replace_between(text, start, end, replacement, label):
    i = text.find(start)
    if i == -1:
        raise SystemExit(f"missing start marker: {label}")
    j = text.find(end, i + len(start))
    if j == -1:
        raise SystemExit(f"missing end marker: {label}")
    return text[:i] + replacement + text[j:]


change_music_bg = dedent('''\
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
''')
utils = replace_between(
    utils,
    "  // 音乐节目切换背景\n  changeMusicBg: function",
    "  // 获取自定义播放列表",
    change_music_bg,
    "changeMusicBg",
)

custom_playlist = dedent('''\
  // 获取自定义播放列表
  getCustomPlayList: function () {
    if (!window.location.pathname.startsWith("/music/")) return;

    const anMusicPage = document.getElementById("anMusic-page");
    const anMusicPageMeting = document.getElementById("anMusic-page-meting");
    if (!anMusicPage || !anMusicPageMeting) return;

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
''')
utils = replace_between(
    utils,
    "  // 获取自定义播放列表\n  getCustomPlayList: function",
    "  //隐藏今日推荐",
    custom_playlist,
    "getCustomPlayList",
)

keyboard_handler = dedent('''\
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
''')
utils = replace_between(
    utils,
    "    // 监听键盘事件\n",
    "  },\n  // 切换歌单",
    keyboard_handler,
    "music keyboard handler",
)

old_target = "    let href = event.target.href;\n    let imgsrc = event.target.currentSrc;"
new_target = dedent('''\
    const linkTarget = event.target.closest?.("a[href]");
    const imageTarget = event.target.closest?.("img");
    let href = linkTarget ? linkTarget.href : "";
    let imgsrc = imageTarget ? imageTarget.currentSrc || imageTarget.src : "";
''').rstrip()
if old_target not in right:
    raise SystemExit("missing right-click target detection block")
right = right.replace(old_target, new_target, 1)

image_copy = dedent('''\
// 下载图片状态
rm.downloadimging = false;

// 复制图片到剪贴板
rm.writeClipImg = async function (imgsrc) {
  if (rm.downloadimging) return;

  rm.downloadimging = true;
  rm.hideRightMenu();
  anzhiyu.snackbarShow("正在复制图片，请稍后", false, 3000);
  try {
    await copyImage(imgsrc);
    anzhiyu.snackbarShow("复制成功！请遵守版权协议", false, 2000);
  } catch (error) {
    console.error("复制图片失败:", error);
    anzhiyu.snackbarShow("复制失败，请检查浏览器权限或图片跨域限制", false, 3000);
  } finally {
    rm.downloadimging = false;
  }
};

function imageToBlob(imageURL) {
  const img = new Image();
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  img.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    img.onload = function () {
      try {
        c.width = this.naturalWidth;
        c.height = this.naturalHeight;
        ctx.drawImage(this, 0, 0);
        c.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error("无法生成图片数据"));
        }, "image/png", 0.75);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error("图片加载失败或不允许跨域读取"));
    img.src = imageURL;
  });
}

async function copyImage(imageURL) {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("当前浏览器不支持图片剪贴板 API");
  }
  const blob = await imageToBlob(imageURL);
  const item = new ClipboardItem({ "image/png": blob });
  await navigator.clipboard.write([item]);
}

''')
right = replace_between(
    right,
    "// 下载图片状态\n",
    "rm.copyUrl = function",
    image_copy,
    "image copy helpers",
)

utils_path.write_text(utils, encoding="utf-8")
right_path.write_text(right, encoding="utf-8")
