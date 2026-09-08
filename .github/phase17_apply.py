from pathlib import Path

path = Path("themes/anzhiyu/source/js/main.js")
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    text = text.replace(old, new, 1)


old_title = '''  function changeDocumentTitle() {
    let leaveTitle = GLOBAL_CONFIG.diytitle.leaveTitle;
    let backTitle = GLOBAL_CONFIG.diytitle.backTitle;
    let OriginTitile = document.title;
    let titleTime;

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        //离开当前页面时标签显示内容
        document.title = leaveTitle;
        clearTimeout(titleTime);
      } else {
        //返回当前页面时标签显示内容
        document.title = backTitle + OriginTitile;
        //两秒后变回正常标题
        titleTime = setTimeout(function () {
          document.title = OriginTitile;
        }, 2000);
      }
    });
  }
'''

new_title = '''  function changeDocumentTitle() {
    let hiddenPageTitle = "";
    let titleTime;

    document.addEventListener("visibilitychange", function () {
      const leaveTitle = GLOBAL_CONFIG.diytitle.leaveTitle;
      const backTitle = GLOBAL_CONFIG.diytitle.backTitle;

      if (document.hidden) {
        // 离开当前页面时记录真实标题，再显示离开提示。
        hiddenPageTitle = document.title;
        document.title = leaveTitle;
        clearTimeout(titleTime);
        return;
      }

      // 返回时以本次离开前的页面标题为准，避免 PJAX 后恢复旧标题。
      const restoreTitle = hiddenPageTitle || document.title;
      const temporaryTitle = backTitle + restoreTitle;
      document.title = temporaryTitle;
      clearTimeout(titleTime);
      titleTime = setTimeout(function () {
        // 如果这两秒内 PJAX 已更新标题，不再用旧页面标题覆盖它。
        if (document.title === temporaryTitle) document.title = restoreTitle;
      }, 2000);
    });
  }
'''
replace_once(old_title, new_title, "document title handler")

old_music_wait = '''  // 监听nav是否被其他音频暂停⏸️
  const listenNavMusicPause = function () {
    const timer = setInterval(() => {
      if (navMusicEl && navMusicEl.querySelector("#nav-music meting-js").aplayer) {
        clearInterval(timer);
        let msgPlay = '<i class="anzhiyufont anzhiyu-icon-play"></i><span>播放音乐</span>';
        let msgPause = '<i class="anzhiyufont anzhiyu-icon-pause"></i><span>暂停音乐</span>';
        navMusicEl.querySelector("#nav-music meting-js").aplayer.on("pause", function () {
          navMusicEl.classList.remove("playing");
          document.getElementById("menu-music-toggle").innerHTML = msgPlay;
          document.getElementById("nav-music-hoverTips").innerHTML = "音乐已暂停";
          document.querySelector("#consoleMusic").classList.remove("on");
          anzhiyu_musicPlaying = false;
          navMusicEl.classList.remove("stretch");
        });
        navMusicEl.querySelector("#nav-music meting-js").aplayer.on("play", function () {
          navMusicEl.classList.add("playing");
          document.getElementById("menu-music-toggle").innerHTML = msgPause;
          document.querySelector("#consoleMusic").classList.add("on");
          anzhiyu_musicPlaying = true;
          // navMusicEl.classList.add("stretch");
        });
      }
    }, 16);
  };
'''

new_music_wait = '''  // 监听nav是否被其他音频暂停⏸️
  const listenNavMusicPause = function () {
    let attempts = 0;
    const maxAttempts = 100;
    const timer = setInterval(() => {
      const navMeting = navMusicEl?.querySelector("meting-js");
      const navAplayer = navMeting?.aplayer;

      if (navAplayer) {
        clearInterval(timer);
        let msgPlay = '<i class="anzhiyufont anzhiyu-icon-play"></i><span>播放音乐</span>';
        let msgPause = '<i class="anzhiyufont anzhiyu-icon-pause"></i><span>暂停音乐</span>';
        navAplayer.on("pause", function () {
          navMusicEl.classList.remove("playing");
          document.getElementById("menu-music-toggle").innerHTML = msgPlay;
          document.getElementById("nav-music-hoverTips").innerHTML = "音乐已暂停";
          document.querySelector("#consoleMusic").classList.remove("on");
          anzhiyu_musicPlaying = false;
          navMusicEl.classList.remove("stretch");
        });
        navAplayer.on("play", function () {
          navMusicEl.classList.add("playing");
          document.getElementById("menu-music-toggle").innerHTML = msgPause;
          document.querySelector("#consoleMusic").classList.add("on");
          anzhiyu_musicPlaying = true;
          // navMusicEl.classList.add("stretch");
        });
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        clearInterval(timer);
        console.warn("导航音乐播放器加载超时，已停止等待");
      }
    }, 100);
  };
'''
replace_once(old_music_wait, new_music_wait, "nav music initialization wait")

old_unrefresh = '''    GLOBAL_CONFIG.copyright !== undefined && addCopyright();
    GLOBAL_CONFIG.navMusic && listenNavMusicPause();
    if (GLOBAL_CONFIG.shortcutKey && document.getElementById("consoleKeyboard")) {
'''
new_unrefresh = '''    GLOBAL_CONFIG.copyright !== undefined && addCopyright();
    if (GLOBAL_CONFIG.navMusic) {
      listenNavMusicPause();
      anzhiyu.addEventListenerConsoleMusicList();
    }
    GLOBAL_CONFIG.diytitle && changeDocumentTitle();
    if (GLOBAL_CONFIG.shortcutKey && document.getElementById("consoleKeyboard")) {
'''
replace_once(old_unrefresh, new_unrefresh, "one-time persistent handlers")

replace_once('''    GLOBAL_CONFIG.diytitle && changeDocumentTitle();
    scrollFnToDo();
''', '''    scrollFnToDo();
''', "remove repeated diy title init")

replace_once('''    anzhiyu.getCustomPlayList();
    anzhiyu.addEventListenerConsoleMusicList(false);
    anzhiyu.initPaginationObserver();
''', '''    anzhiyu.getCustomPlayList();
    anzhiyu.initPaginationObserver();
''', "remove repeated nav music click binding")

path.write_text(text, encoding="utf-8")
print("Phase 17 approved edits applied to main.js")
