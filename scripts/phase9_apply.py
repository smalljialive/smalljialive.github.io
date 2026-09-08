from pathlib import Path
import re

UTILS = Path("themes/anzhiyu/source/js/utils.js")
RIGHT = Path("themes/anzhiyu/source/js/anzhiyu/right_click_menu.js")


def replace_once(text, pattern, replacement, label):
    matches = list(re.finditer(pattern, text, flags=re.S))
    if len(matches) != 1:
        raise RuntimeError(f"{label}: expected exactly 1 match, found {len(matches)}")
    return re.sub(pattern, lambda _: replacement, text, count=1, flags=re.S)


utils = UTILS.read_text(encoding="utf-8")
right = RIGHT.read_text(encoding="utf-8")

utils = replace_once(
    utils,
    r"  // 下载图片\n  downloadImage: function \(imgsrc, name\) \{.*?\n  \},\n  //禁止图片右键单击",
    '''  // 下载图片
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
  //禁止图片右键单击''',
    "downloadImage",
)

utils = replace_once(
    utils,
    r"  // 将音乐缓存播放\n  cacheAndPlayMusic\(\) \{.*?\n  \},\n  // 播放音乐",
    '''  // 将音乐缓存播放
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
  // 播放音乐''',
    "cacheAndPlayMusic",
)

# Add defensive guards to playMusic without changing the existing random-song behavior.
play_guard_pattern = (
    r"  // 播放音乐\n  playMusic\(songs\) \{\n"
    r"    const anMusicPage = document\.getElementById\(\"anMusic-page\"\);\n"
    r"    const metingAplayer = anMusicPage\.querySelector\(\"meting-js\"\)\.aplayer;"
)
play_guard_replacement = '''  // 播放音乐
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
    }'''
utils = replace_once(utils, play_guard_pattern, play_guard_replacement, "playMusic guard")

utils = replace_once(
    utils,
    r"  // 切换歌单\n  changeMusicList: async function \(\) \{.*?\n  \},\n  // 控制台音乐列表监听",
    '''  // 切换歌单
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
  // 控制台音乐列表监听''',
    "changeMusicList",
)

right = right.replace(
    '    anzhiyu.downloadImage(domImgSrc, "anzhiyu");',
    '    anzhiyu.downloadImage(domImgSrc);',
    1,
)
if 'anzhiyu.downloadImage(domImgSrc, "anzhiyu");' in right:
    raise RuntimeError("download handler replacement did not fully apply")

right = right.replace(
    '    window.open("https://www.baidu.com/s?wd=" + selectTextNow);',
    '    window.open("https://www.baidu.com/s?wd=" + encodeURIComponent(selectTextNow));',
    1,
)
if 'window.open("https://www.baidu.com/s?wd=" + selectTextNow);' in right:
    raise RuntimeError("Baidu search encoding replacement did not fully apply")

right = replace_once(
    right,
    r"//引用到评论\nrm\.rightMenuCommentText = function \(txt\) \{.*?\n\};\n\n//替换所有内容",
    '''//引用到评论
rm.rightMenuCommentText = function (txt) {
  rm.hideRightMenu();
  const postCommentDom = document.getElementById("post-comment");
  if (!postCommentDom) return;
  var domTop = postCommentDom.offsetTop;
  window.scrollTo(0, domTop - 80);
  if (txt === undefined || txt === null || txt === "undefined" || txt === "null") txt = "好棒！";

  function setText(attemptsLeft = 30) {
    setTimeout(() => {
      const input = document.getElementsByClassName("el-textarea__inner")[0];
      if (!input) {
        if (attemptsLeft > 1) setText(attemptsLeft - 1);
        else console.warn("评论输入框加载超时，已停止等待");
        return;
      }
      const evt = document.createEvent("HTMLEvents");
      evt.initEvent("input", true, true);
      const inputValue = replaceAll(txt, "\\n", "\\n> ");
      input.value = "> " + inputValue + "\\n\\n";
      input.dispatchEvent(evt);
      input.focus();
      input.setSelectionRange(-1, -1);
      const commentTips = document.getElementById("comment-tips");
      if (commentTips) commentTips.classList.add("show");
    }, 100);
  }
  setText();
};

//替换所有内容''',
    "rightMenuCommentText",
)

# Guard against accidental remnants from the bugs being fixed.
for forbidden in (
    'setTimeout(function () {\n        let image = new Image();',
    '图片已添加盲水印',
    'downloadImage(domImgSrc, "anzhiyu")',
    'JSON.parse(localStorage.getItem("musicData"))',
):
    if forbidden in utils or forbidden in right:
        raise RuntimeError(f"forbidden legacy pattern still present: {forbidden}")

UTILS.write_text(utils, encoding="utf-8")
RIGHT.write_text(right, encoding="utf-8")
print("Phase 9 source updates applied successfully")
