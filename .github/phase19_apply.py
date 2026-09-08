from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

replacements = {
    "source/_posts/一键转换】将机场节点转换为socks节点，实现一个节点一个端口.md": [
        (
            "经过网络搜索各种教程后，最后在**[不良林](https://www.youtube.com/watch?v=01F8xUxqmkY)**大佬的视频里找到了解决办法。",
            "经过网络搜索各种教程后，最后在 **[不良林](https://www.youtube.com/watch?v=01F8xUxqmkY)** 大佬的视频里找到了解决办法。",
        ),
    ],
    "source/_posts/禁用wordpress插件的更新-全部禁用和部分禁用.md": [
        (
            '**"主包"**在工作建站的时候',
            '**"主包"** 在工作建站的时候',
        ),
        (
            '然而**"主包"**也是稍微有点强迫症',
            '然而 **"主包"** 也是稍微有点强迫症',
        ),
    ],
    "source/_posts/wordpress创建子主题方法.md": [
        (
            "完成选择之后，请点击底部的按钮以**创建****新的子主题****。** 就是这样！",
            "完成选择之后，请点击底部的按钮以**创建新的子主题**。就是这样！",
        ),
        (
            "“**文件”**选项卡",
            "“**文件**”选项卡",
        ),
    ],
    "source/_posts/v2ray搭建详细教程.md": [
        (
            "**每月仅需 $2.88 起！**再也不用自己折腾搭建了",
            "**每月仅需 $2.88 起！** 再也不用自己折腾搭建了",
        ),
        (
            "```bash\nbash <(wget -qO- -o- https://git.io/v2ray.sh)\n```bash\nbash <(wget -qO- -o- https://git.io/v2ray.sh)\n\n```",
            "```bash\nbash <(wget -qO- -o- https://git.io/v2ray.sh)\n```",
        ),
    ],
    "source/_posts/全国古玩市场大全.md": [
        (
            "**1、**海口乐普生八楼古玩城：在市商业中心地段位于海秀大道上",
            "1、海口乐普生八楼古玩城：在市商业中心地段位于海秀大道上",
        ),
    ],
}

for relative_path, file_replacements in replacements.items():
    path = ROOT / relative_path
    text = path.read_text(encoding="utf-8")
    for old, new in file_replacements:
        count = text.count(old)
        if count != 1:
            raise SystemExit(f"Expected exactly one match in {relative_path}, found {count}: {old[:80]!r}")
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")

# Source-level invariants after the edits.
checks = {
    "source/_posts/一键转换】将机场节点转换为socks节点，实现一个节点一个端口.md": [
        "最后在 **[不良林](https://www.youtube.com/watch?v=01F8xUxqmkY)** 大佬的视频里",
    ],
    "source/_posts/禁用wordpress插件的更新-全部禁用和部分禁用.md": [
        '**"主包"** 在工作建站的时候',
        '然而 **"主包"** 也是稍微有点强迫症',
    ],
    "source/_posts/wordpress创建子主题方法.md": [
        "**创建新的子主题**。就是这样！",
        "“**文件**”选项卡",
    ],
    "source/_posts/v2ray搭建详细教程.md": [
        "**每月仅需 $2.88 起！** 再也不用自己折腾搭建了",
        "```bash\nbash <(wget -qO- -o- https://git.io/v2ray.sh)\n```",
    ],
    "source/_posts/全国古玩市场大全.md": [
        "\n1、海口乐普生八楼古玩城：在市商业中心地段位于海秀大道上",
    ],
}

for relative_path, required in checks.items():
    text = (ROOT / relative_path).read_text(encoding="utf-8")
    for needle in required:
        if needle not in text:
            raise SystemExit(f"Missing expected text in {relative_path}: {needle!r}")

v2ray = (ROOT / "source/_posts/v2ray搭建详细教程.md").read_text(encoding="utf-8")
if v2ray.count("bash <(wget -qO- -o- https://git.io/v2ray.sh)") != 1:
    raise SystemExit("V2Ray install command must appear exactly once after repair")
if "```bash\nbash <(wget -qO- -o- https://git.io/v2ray.sh)\n```bash" in v2ray:
    raise SystemExit("Malformed nested V2Ray fence still present")

print("Phase 19 source edits applied and source assertions passed.")
