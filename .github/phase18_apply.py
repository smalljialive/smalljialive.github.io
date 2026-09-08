from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, found {count}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"Updated {label}")


# 1) Do not render an empty 40% console column when newest comments are disabled.
replace_once(
    "themes/anzhiyu/layout/includes/anzhiyu/console.pug",
    """  .console-card-group\n    .console-card-group-left\n      !=partial('includes/widget/card_newest_comment', {}, {cache: true})\n    .console-card-group-right\n""",
    """  .console-card-group\n    if theme.newest_comments.enable\n      .console-card-group-left\n        !=partial('includes/widget/card_newest_comment', {}, {cache: true})\n    .console-card-group-right\n""",
    "console newest-comments column",
)

# 2) Let the remaining console column occupy all available width when it is the only child.
replace_once(
    "themes/anzhiyu/source/css/_extra/console/console.css",
    """#console .console-card-group-right {\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  height: 100%;\n  width: 60%;\n  overflow: hidden;\n  min-width: 575px;\n}\n""",
    """#console .console-card-group-right {\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  height: 100%;\n  width: 60%;\n  overflow: hidden;\n  min-width: 575px;\n}\n\n#console .console-card-group-right:only-child {\n  width: 100%;\n}\n""",
    "console single-column width",
)

# 3) Music actions must not touch APlayer state until Meting/APlayer is actually ready.
replace_once(
    "themes/anzhiyu/source/js/utils.js",
    """  musicToggle: function (changePaly = true) {\n    if (!anzhiyu_musicFirst) {\n      anzhiyu.musicBindEvent();\n      anzhiyu_musicFirst = true;\n    }\n""",
    """  musicToggle: function (changePaly = true) {\n    const navMeting = document.querySelector(\"#nav-music meting-js\");\n    const navAplayer = navMeting?.aplayer;\n    if (!navAplayer) {\n      anzhiyu.snackbarShow(\"音乐播放器加载中，请稍后重试\", false, 2000);\n      rm && rm.hideRightMenu();\n      return;\n    }\n\n    if (!anzhiyu_musicFirst) {\n      anzhiyu_musicFirst = anzhiyu.musicBindEvent();\n      if (!anzhiyu_musicFirst) {\n        anzhiyu.snackbarShow(\"音乐播放器加载中，请稍后重试\", false, 2000);\n        rm && rm.hideRightMenu();\n        return;\n      }\n    }\n""",
    "musicToggle readiness guard",
)

replace_once(
    "themes/anzhiyu/source/js/utils.js",
    """    if (changePaly) document.querySelector(\"#nav-music meting-js\").aplayer.toggle();\n""",
    """    if (changePaly) navAplayer.toggle();\n""",
    "musicToggle safe player reference",
)

replace_once(
    "themes/anzhiyu/source/js/utils.js",
    """  // 音乐绑定事件\n  musicBindEvent: function () {\n    document.querySelector(\"#nav-music .aplayer-music\").addEventListener(\"click\", function () {\n      anzhiyu.musicTelescopic();\n    });\n    document.querySelector(\"#nav-music .aplayer-button\").addEventListener(\"click\", function () {\n      anzhiyu.musicToggle(false);\n    });\n  },\n""",
    """  // 音乐绑定事件\n  musicBindEvent: function () {\n    const musicTitle = document.querySelector(\"#nav-music .aplayer-music\");\n    const musicButton = document.querySelector(\"#nav-music .aplayer-button\");\n    if (!musicTitle || !musicButton) return false;\n\n    musicTitle.addEventListener(\"click\", function () {\n      anzhiyu.musicTelescopic();\n    });\n    musicButton.addEventListener(\"click\", function () {\n      anzhiyu.musicToggle(false);\n    });\n    return true;\n  },\n""",
    "musicBindEvent readiness guard",
)

replace_once(
    "themes/anzhiyu/source/js/utils.js",
    """      if (e.target != listBtn && aplayerList.classList.contains(\"aplayer-list-hide\")) {\n""",
    """      if (!aplayerList) return;\n      if (e.target != listBtn && aplayerList.classList.contains(\"aplayer-list-hide\")) {\n""",
    "console music-list null guard",
)

print("Phase 18 approved edits applied successfully")
