from pathlib import Path


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)

# 1. Traditional/Simplified Chinese: right menu is optional.
path = "themes/anzhiyu/source/js/tw_cn.js"
text = read(path)
text = replace_once(
    text,
    "    translateRightMenuButtonObject = document.getElementById('menu-translate').querySelector('span');",
    "    translateRightMenuButtonObject = document.getElementById('menu-translate')?.querySelector('span') || null;",
    "tw_cn optional right menu",
)
write(path, text)

# 2. Local search: both header and right-menu triggers are optional.
path = "themes/anzhiyu/source/js/search/local-search.js"
text = read(path)
old = '''  const searchClickFn = () => {\n    document.querySelector("#search-button > .search").addEventListener("click", openSearch);\n    document.querySelector("#menu-search").addEventListener("click", openSearch);\n  };'''
new = '''  const searchClickFn = () => {\n    const headerSearch = document.querySelector("#search-button > .search");\n    const menuSearch = document.querySelector("#menu-search");\n    if (headerSearch) headerSearch.addEventListener("click", openSearch);\n    if (menuSearch) menuSearch.addEventListener("click", openSearch);\n  };'''
text = replace_once(text, old, new, "local search optional triggers")
write(path, text)

# 3. Main theme switch and nav-music state must not depend on disabled right-menu/console DOM.
path = "themes/anzhiyu/source/js/main.js"
text = read(path)
old = '''    const menuDarkmodeText = $rightMenu.querySelector(".menu-darkmode-text");\n    if (mode === "light") {\n      menuDarkmodeText.textContent = "深色模式";\n    } else {\n      menuDarkmodeText.textContent = "浅色模式";\n    }'''
new = '''    const menuDarkmodeText = $rightMenu?.querySelector(".menu-darkmode-text") || null;\n    if (menuDarkmodeText) {\n      if (mode === "light") {\n        menuDarkmodeText.textContent = "深色模式";\n      } else {\n        menuDarkmodeText.textContent = "浅色模式";\n      }\n    }'''
text = replace_once(text, old, new, "main optional right menu dark text")

for old_line, new_line, expected, label in [
    ('document.getElementById("menu-music-toggle").innerHTML = msgPlay;', 'const menuMusicToggle = document.getElementById("menu-music-toggle");\n          if (menuMusicToggle) menuMusicToggle.innerHTML = msgPlay;', 1, "main music play menu"),
    ('document.getElementById("menu-music-toggle").innerHTML = msgPause;', 'const menuMusicToggle = document.getElementById("menu-music-toggle");\n          if (menuMusicToggle) menuMusicToggle.innerHTML = msgPause;', 1, "main music pause menu"),
    ('document.querySelector("#consoleMusic").classList.remove("on");', 'document.querySelector("#consoleMusic")?.classList.remove("on");', 1, "main console music remove"),
    ('document.querySelector("#consoleMusic").classList.add("on");', 'document.querySelector("#consoleMusic")?.classList.add("on");', 1, "main console music add"),
]:
    count = text.count(old_line)
    if count != expected:
        raise SystemExit(f"{label}: expected {expected} match, found {count}")
    text = text.replace(old_line, new_line, expected)
write(path, text)

# 4. Utils: robust copy fallback, optional music UI, dynamic QRCode and music-page cleanup.
path = "themes/anzhiyu/source/js/utils.js"
text = read(path)
old = '''  copyPageUrl: async function (url = window.location.href) {\n    const text = url || window.location.href;\n    try {\n      if (navigator.clipboard && window.isSecureContext) {\n        await navigator.clipboard.writeText(text);\n      } else {\n        const input = document.createElement("input");\n        input.value = text;\n        document.body.appendChild(input);\n        input.select();\n        input.setSelectionRange(0, input.value.length);\n        const copied = document.execCommand("copy");\n        input.remove();\n        if (!copied) throw new Error("document.execCommand copy failed");\n      }\n      anzhiyu.snackbarShow("复制链接地址成功", false, 2000);\n      return true;\n    } catch (error) {\n      console.error("复制链接地址失败:", error);\n      anzhiyu.snackbarShow("复制链接地址失败，请手动复制", false, 3000);\n      return false;\n    }\n  },'''
new = '''  copyPageUrl: async function (url = window.location.href) {\n    const text = url || window.location.href;\n    let clipboardError = null;\n\n    if (navigator.clipboard && window.isSecureContext) {\n      try {\n        await navigator.clipboard.writeText(text);\n        anzhiyu.snackbarShow("复制链接地址成功", false, 2000);\n        return true;\n      } catch (error) {\n        clipboardError = error;\n      }\n    }\n\n    const input = document.createElement("input");\n    input.value = text;\n    document.body.appendChild(input);\n    input.select();\n    input.setSelectionRange(0, input.value.length);\n    let copied = false;\n    try {\n      copied = document.execCommand("copy");\n    } catch (error) {\n      clipboardError = clipboardError || error;\n    } finally {\n      input.remove();\n    }\n\n    if (copied) {\n      anzhiyu.snackbarShow("复制链接地址成功", false, 2000);\n      return true;\n    }\n\n    console.error("复制链接地址失败:", clipboardError || new Error("document.execCommand copy failed"));\n    anzhiyu.snackbarShow("复制链接地址失败，请手动复制", false, 3000);\n    return false;\n  },'''
text = replace_once(text, old, new, "copy fallback")

for old_line, new_line, expected, label in [
    ('document.getElementById("menu-music-toggle").innerHTML = msgPlay;', 'const menuMusicToggle = document.getElementById("menu-music-toggle");\n      if (menuMusicToggle) menuMusicToggle.innerHTML = msgPlay;', 1, "utils music play menu"),
    ('document.getElementById("menu-music-toggle").innerHTML = msgPause;', 'const menuMusicToggle = document.getElementById("menu-music-toggle");\n      if (menuMusicToggle) menuMusicToggle.innerHTML = msgPause;', 1, "utils music pause menu"),
    ('document.querySelector("#consoleMusic").classList.remove("on");', 'document.querySelector("#consoleMusic")?.classList.remove("on");', 1, "utils console music remove"),
    ('document.querySelector("#consoleMusic").classList.add("on");', 'document.querySelector("#consoleMusic")?.classList.add("on");', 1, "utils console music add"),
]:
    count = text.count(old_line)
    if count != expected:
        raise SystemExit(f"{label}: expected {expected} match, found {count}")
    text = text.replace(old_line, new_line, expected)

old = '''  // 创建二维码\n  qrcodeCreate: function () {\n    if (document.getElementById("qrcode")) {\n      document.getElementById("qrcode").innerHTML = "";\n      var qrcode = new QRCode(document.getElementById("qrcode"), {\n        text: window.location.href,\n        width: 250,\n        height: 250,\n        colorDark: "#000",\n        colorLight: "#ffffff",\n        correctLevel: QRCode.CorrectLevel.H,\n      });\n    }\n  },'''
new = '''  // 创建二维码\n  qrcodeCreate: async function () {\n    let qrcodeEl = document.getElementById("qrcode");\n    if (!qrcodeEl) return;\n\n    if (typeof window.QRCode === "undefined") {\n      if (!anzhiyu.qrcodeScriptPromise) {\n        anzhiyu.qrcodeScriptPromise = window\n          .getScript("https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js")\n          .catch(error => {\n            anzhiyu.qrcodeScriptPromise = null;\n            throw error;\n          });\n      }\n      try {\n        await anzhiyu.qrcodeScriptPromise;\n      } catch (error) {\n        console.error("二维码脚本加载失败:", error);\n        return;\n      }\n    }\n\n    qrcodeEl = document.getElementById("qrcode");\n    if (!qrcodeEl || typeof window.QRCode === "undefined") return;\n    qrcodeEl.innerHTML = "";\n    new window.QRCode(qrcodeEl, {\n      text: window.location.href,\n      width: 250,\n      height: 250,\n      colorDark: "#000",\n      colorLight: "#ffffff",\n      correctLevel: window.QRCode.CorrectLevel.H,\n    });\n  },'''
text = replace_once(text, old, new, "dynamic QRCode")

marker = '''  // 获取自定义播放列表\n  getCustomPlayList: function () {'''
cleanup = '''  destroyMusicPagePlayer: function () {\n    const musicPageMeting = document.querySelector("#anMusic-page-meting meting-js");\n    const musicPageAplayer = musicPageMeting?.aplayer;\n    if (musicPageAplayer && typeof musicPageAplayer.destroy === "function") {\n      try {\n        musicPageAplayer.destroy();\n      } catch (error) {\n        console.warn("音乐页面播放器销毁失败，将继续页面切换", error);\n      }\n    }\n    if (anzhiyu.musicPageKeydownHandler) {\n      document.removeEventListener("keydown", anzhiyu.musicPageKeydownHandler);\n      anzhiyu.musicPageKeydownHandler = null;\n    }\n  },\n\n  // 获取自定义播放列表\n  getCustomPlayList: function () {'''
text = replace_once(text, marker, cleanup, "music cleanup helper")

old = '''    const anMusicPage = document.getElementById("anMusic-page");\n    const anMusicPageMeting = document.getElementById("anMusic-page-meting");\n    if (!anMusicPage || !anMusicPageMeting) return;\n\n    const urlParams = new URLSearchParams(window.location.search);'''
new = '''    const anMusicPage = document.getElementById("anMusic-page");\n    const anMusicPageMeting = document.getElementById("anMusic-page-meting");\n    if (!anMusicPage || !anMusicPageMeting) return;\n\n    anzhiyu.destroyMusicPagePlayer();\n    if (!anzhiyu.musicPageCleanupBound) {\n      document.addEventListener("pjax:send", anzhiyu.destroyMusicPagePlayer);\n      anzhiyu.musicPageCleanupBound = true;\n    }\n\n    const urlParams = new URLSearchParams(window.location.search);'''
text = replace_once(text, old, new, "music cleanup before init")
write(path, text)

print("Phase 28 patch applied")
