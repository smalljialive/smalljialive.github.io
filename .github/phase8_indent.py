from pathlib import Path

utils_path = Path("themes/anzhiyu/source/js/utils.js")
right_path = Path("themes/anzhiyu/source/js/anzhiyu/right_click_menu.js")

utils = utils_path.read_text(encoding="utf-8")
right = right_path.read_text(encoding="utf-8")


def indent_between(text, start, end, prefix, label):
    i = text.find(start)
    if i == -1:
        raise SystemExit(f"missing start marker: {label}")
    j = text.find(end, i)
    if j == -1:
        raise SystemExit(f"missing end marker: {label}")
    block = text[i:j]
    indented = "\n".join(prefix + line if line else line for line in block.split("\n"))
    return text[:i] + indented + text[j:]


utils = indent_between(
    utils,
    "// 音乐节目切换背景\nchangeMusicBg: function",
    "// 获取自定义播放列表",
    "  ",
    "changeMusicBg indentation",
)
utils = indent_between(
    utils,
    "// 获取自定义播放列表\ngetCustomPlayList: function",
    "  //隐藏今日推荐",
    "  ",
    "getCustomPlayList indentation",
)
utils = indent_between(
    utils,
    "// 监听键盘事件。重新初始化前移除旧监听，避免 PJAX 多次进入后重复触发。",
    "  },\n  // 切换歌单",
    "    ",
    "music keyboard indentation",
)

right = indent_between(
    right,
    'const linkTarget = event.target.closest?.("a[href]");',
    "\n\n    // 判断模式 扩展模式为有事件",
    "    ",
    "right click target indentation",
)

utils_path.write_text(utils, encoding="utf-8")
right_path.write_text(right, encoding="utf-8")
