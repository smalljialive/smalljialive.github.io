from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, found {count}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


# 1) Harden nav music previous/next/name actions while APlayer is still loading.
utils_path = "themes/anzhiyu/source/js/utils.js"
old_music = '''  //音乐上一曲
  musicSkipBack: function () {
    navMusicEl.querySelector("meting-js").aplayer.skipBack();
    rm && rm.hideRightMenu();
  },

  //音乐下一曲
  musicSkipForward: function () {
    navMusicEl.querySelector("meting-js").aplayer.skipForward();
    rm && rm.hideRightMenu();
  },

  //获取音乐中的名称
  musicGetName: function () {
    var x = document.querySelectorAll(".aplayer-title");
    var arr = [];
    for (var i = x.length - 1; i >= 0; i--) {
      arr[i] = x[i].innerText;
    }
    return arr[0];
  },
'''
new_music = '''  //音乐上一曲
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
'''
replace_once(utils_path, old_music, new_music)

# 2) Remove the duplicate mobile-menu click binding from refreshFn.
main_path = "themes/anzhiyu/source/js/main.js"
old_mobile = '''    document.getElementById("toggle-menu").addEventListener("click", () => {
      sidebarFn.open();
    });
'''
replace_once(main_path, old_mobile, "")

# 3) Bind right-menu wheel-close listeners only once, and guard copy-music-name.
right_path = "themes/anzhiyu/source/js/anzhiyu/right_click_menu.js"
old_scroll = '''function stopMaskScroll() {
  if (document.getElementById("rightmenu-mask")) {
    let xscroll = document.getElementById("rightmenu-mask");
    xscroll.addEventListener(
      "mousewheel",
      function (e) {
        //阻止浏览器默认方法
        rm.hideRightMenu();
        // e.preventDefault();
      },
      { passive: true }
    );
  }
  if (document.getElementById("rightMenu")) {
    let xscroll = document.getElementById("rightMenu");
    xscroll.addEventListener(
      "mousewheel",
      function (e) {
        //阻止浏览器默认方法
        rm.hideRightMenu();
        // e.preventDefault();
      },
      { passive: true }
    );
  }
}
'''
new_scroll = '''let maskScrollListenersBound = false;
function stopMaskScroll() {
  if (maskScrollListenersBound) return;

  const closeOnMouseWheel = () => rm.hideRightMenu();
  const rightMenuMask = document.getElementById("rightmenu-mask");
  const rightMenu = document.getElementById("rightMenu");

  rightMenuMask?.addEventListener("mousewheel", closeOnMouseWheel, { passive: true });
  rightMenu?.addEventListener("mousewheel", closeOnMouseWheel, { passive: true });
  maskScrollListenersBound = true;
}
'''
replace_once(right_path, old_scroll, new_scroll)

old_copy_name = '''  document.getElementById("menu-music-copyMusicName").addEventListener("click", function () {
    rm.rightmenuCopyText(anzhiyu.musicGetName());
    anzhiyu.snackbarShow("复制歌曲名称成功", false, 3000);
  });
'''
new_copy_name = '''  document.getElementById("menu-music-copyMusicName").addEventListener("click", function () {
    const musicName = anzhiyu.musicGetName();
    if (!musicName) {
      anzhiyu.snackbarShow("音乐播放器加载中，请稍后重试", false, 2000);
      rm.hideRightMenu();
      return;
    }
    rm.rightmenuCopyText(musicName);
    anzhiyu.snackbarShow("复制歌曲名称成功", false, 3000);
  });
'''
replace_once(right_path, old_copy_name, new_copy_name)

# 4) Remove obsolete manually-created category pages. Real Hexo category archives remain generated.
for obsolete in [
    "source/categories/index-1/index-1.md",
    "source/categories/index-2/index-2.md",
    "source/categories/index-3/index-3.md",
]:
    path = Path(obsolete)
    if not path.is_file():
        raise SystemExit(f"missing expected obsolete category file: {obsolete}")
    path.unlink()
