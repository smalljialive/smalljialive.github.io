from pathlib import Path

path = Path("themes/anzhiyu/source/js/utils.js")
text = path.read_text(encoding="utf-8")
old = '''  destroyMusicPagePlayer: function () {\n    const musicPageMeting = document.querySelector("#anMusic-page-meting meting-js");\n    const musicPageAplayer = musicPageMeting?.aplayer;\n    if (musicPageAplayer && typeof musicPageAplayer.destroy === "function") {\n      try {\n        musicPageAplayer.destroy();\n      } catch (error) {\n        console.warn("音乐页面播放器销毁失败，将继续页面切换", error);\n      }\n    }\n    if (anzhiyu.musicPageKeydownHandler) {\n      document.removeEventListener("keydown", anzhiyu.musicPageKeydownHandler);\n      anzhiyu.musicPageKeydownHandler = null;\n    }\n  },'''
new = '''  destroyMusicPagePlayer: function () {\n    const musicPageMeting = document.querySelector("#anMusic-page-meting meting-js");\n    const musicPageAplayer = musicPageMeting?.aplayer;\n    if (\n      musicPageAplayer &&\n      !musicPageAplayer.__anzhiyuDestroyed &&\n      typeof musicPageAplayer.destroy === "function"\n    ) {\n      musicPageAplayer.__anzhiyuDestroyed = true;\n      try {\n        musicPageAplayer.destroy();\n      } catch (error) {\n        console.warn("音乐页面播放器销毁失败，将继续页面切换", error);\n      } finally {\n        try {\n          musicPageMeting.aplayer = null;\n        } catch (error) {\n          console.warn("音乐页面播放器引用清理失败", error);\n        }\n      }\n    }\n    if (anzhiyu.musicPageKeydownHandler) {\n      document.removeEventListener("keydown", anzhiyu.musicPageKeydownHandler);\n      anzhiyu.musicPageKeydownHandler = null;\n    }\n  },'''
count = text.count(old)
if count != 1:
    raise SystemExit(f"expected one music cleanup helper, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("APlayer cleanup guard applied")
