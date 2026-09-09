from pathlib import Path

path = Path("themes/anzhiyu/source/js/utils.js")
text = path.read_text(encoding="utf-8")

old_helper = '''  destroyMusicPagePlayer: function () {\n    const musicPageMeting = document.querySelector("#anMusic-page-meting meting-js");\n    const musicPageAplayer = musicPageMeting?.aplayer;\n    if (musicPageAplayer && typeof musicPageAplayer.destroy === "function") {\n      try {\n        musicPageAplayer.destroy();\n      } catch (error) {\n        console.warn("音乐页面播放器销毁失败，将继续页面切换", error);\n      }\n    }\n    if (anzhiyu.musicPageKeydownHandler) {\n      document.removeEventListener("keydown", anzhiyu.musicPageKeydownHandler);\n      anzhiyu.musicPageKeydownHandler = null;\n    }\n  },'''

new_helper = '''  ensureMetingLifecycleGuard: function () {\n    const MetingElement = window.customElements?.get("meting-js");\n    const prototype = MetingElement?.prototype;\n    if (!prototype || prototype.__anzhiyuLifecycleGuarded) return;\n\n    prototype.__anzhiyuLifecycleGuarded = true;\n    const originalDisconnectedCallback = prototype.disconnectedCallback;\n    const originalLoadPlayer = prototype._loadPlayer;\n\n    prototype.disconnectedCallback = function () {\n      const aplayer = this.aplayer;\n      if (this.lock || !aplayer || aplayer.__anzhiyuDestroyed) return;\n      aplayer.__anzhiyuDestroyed = true;\n      try {\n        if (typeof originalDisconnectedCallback === "function") {\n          originalDisconnectedCallback.call(this);\n        } else if (typeof aplayer.destroy === "function") {\n          aplayer.destroy();\n        }\n      } catch (error) {\n        console.warn("Meting 播放器销毁异常已拦截", error);\n      }\n    };\n\n    if (typeof originalLoadPlayer === "function") {\n      prototype._loadPlayer = function (data) {\n        if (!this.isConnected) return;\n        return originalLoadPlayer.call(this, data);\n      };\n    }\n\n    if (!anzhiyu.musicPageKeyCleanupBound) {\n      document.addEventListener("pjax:send", () => {\n        if (anzhiyu.musicPageKeydownHandler) {\n          document.removeEventListener("keydown", anzhiyu.musicPageKeydownHandler);\n          anzhiyu.musicPageKeydownHandler = null;\n        }\n      });\n      anzhiyu.musicPageKeyCleanupBound = true;\n    }\n  },'''

if text.count(old_helper) != 1:
    raise SystemExit(f"expected one original music cleanup helper, found {text.count(old_helper)}")
text = text.replace(old_helper, new_helper, 1)

old_manual = '''    anzhiyu.destroyMusicPagePlayer();\n    if (!anzhiyu.musicPageCleanupBound) {\n      document.addEventListener("pjax:send", anzhiyu.destroyMusicPagePlayer);\n      anzhiyu.musicPageCleanupBound = true;\n    }\n\n'''
if text.count(old_manual) != 1:
    raise SystemExit(f"expected one manual music cleanup binding, found {text.count(old_manual)}")
text = text.replace(old_manual, '''    anzhiyu.ensureMetingLifecycleGuard();\n\n''', 1)

old_playlist = '''    const playlistId = validId && validServer ? requestedId : defaultId;\n    const playlistServer = validId && validServer ? requestedServer : defaultServer;\n\n    const meting = document.createElement("meting-js");'''
new_playlist = '''    const playlistId = validId && validServer ? requestedId : defaultId;\n    const playlistServer = validId && validServer ? requestedServer : defaultServer;\n\n    const existingMeting = anMusicPageMeting.querySelector("meting-js");\n    if (\n      existingMeting &&\n      existingMeting.getAttribute("id") === playlistId &&\n      (existingMeting.getAttribute("server") || "netease").toLowerCase() === playlistServer\n    ) {\n      anzhiyu.changeMusicBg(false);\n      return;\n    }\n\n    const meting = document.createElement("meting-js");'''
if text.count(old_playlist) != 1:
    raise SystemExit(f"expected one playlist creation block, found {text.count(old_playlist)}")
text = text.replace(old_playlist, new_playlist, 1)

path.write_text(text, encoding="utf-8")
print("Meting lifecycle compatibility guard applied")
