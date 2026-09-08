from pathlib import Path
import html
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CONTACT = ROOT / "source/_posts/Contact Form7 标准留言代码.md"
MUSIC = ROOT / "source/_posts/如何在网站中引入一个音乐播放器.md"
ROBOTS = ROOT / "source/_posts/网站上传robot-txt文件.md"
CONFIG = ROOT / "_config.anzhiyu.yml"
TARGETS = {
    "source/_posts/Contact Form7 标准留言代码.md",
    "source/_posts/如何在网站中引入一个音乐播放器.md",
    "source/_posts/网站上传robot-txt文件.md",
    "_config.anzhiyu.yml",
}


def replace_exact(text, old, new, expected=1):
    count = text.count(old)
    if count != expected:
        raise AssertionError(f"Expected {expected} occurrences of {old!r}, found {count}")
    return text.replace(old, new)


def regex_replace(text, pattern, repl, expected):
    new_text, count = re.subn(pattern, repl, text, flags=re.MULTILINE)
    if count != expected:
        raise AssertionError(f"Expected {expected} matches for {pattern!r}, found {count}")
    return new_text


def apply_changes():
    contact = CONTACT.read_text(encoding="utf-8")
    replacements = [
        ('[text* your-name placeholder"Your Name:"]', '[text* your-name placeholder "Your Name:"]'),
        ('[tel* your-whatsapp placeholder"Phone/Whatsapp:"]', '[tel* your-whatsapp placeholder "Phone/Whatsapp:"]'),
        ('[email* your-email placeholder"Your Email:"]', '[email* your-email placeholder "Your Email:"]'),
        ('[textarea* your-message x4 size:40 placeholder"Leave your requirements and we will provide you with a quote" ]', '[textarea* your-message placeholder "Leave your requirements and we will provide you with a quote"]'),
    ]
    for old, new in replacements:
        contact = replace_exact(contact, old, new)
    CONTACT.write_text(contact, encoding="utf-8")

    robots = ROBOTS.read_text(encoding="utf-8")
    robots = replace_exact(robots, "title: 网站上传Robot.txt文件", "title: 网站上传robots.txt文件")
    robots = replace_exact(robots, "作为seo优化过程中必不可少的网站robot文件", "作为seo优化过程中必不可少的网站robots.txt文件")
    ROBOTS.write_text(robots, encoding="utf-8")

    config = CONFIG.read_text(encoding="utf-8")
    config = replace_exact(config, "   Github: https://github.com/smalljialive|| anzhiyu-icon-github", "   GitHub: https://github.com/smalljialive|| anzhiyu-icon-github")
    config = replace_exact(config, "        text: 本站采用Hero的安知鱼主题", "        text: 本站采用 AnZhiYu 主题")
    CONFIG.write_text(config, encoding="utf-8")

    music = MUSIC.read_text(encoding="utf-8")
    marker = "### 3.Meting三方音乐"
    if music.count(marker) != 1:
        raise AssertionError("Could not isolate the APlayer section")
    aplayer, meting = music.split(marker, 1)

    aplayer = replace_exact(aplayer, "Mini播放器效果：", "固定播放器效果：")
    aplayer = replace_exact(
        aplayer,
        "| showlrc       | true                               | 歌词是否显示                                                     |",
        "| lrcType       | 0                                  | 歌词类型，0 表示不加载歌词，3 表示从外部 LRC 文件加载            |",
    )
    aplayer = replace_exact(
        aplayer,
        "可以参考官方链接：https://aplayer.js.org/#/zh-Hans/?id=%E5%8F%82%E6%95%B0 #### 2.1Mini播放器",
        "可以参考官方链接：https://aplayer.js.org/#/zh-Hans/?id=%E5%8F%82%E6%95%B0\n\n#### 2.1 固定播放器（Fixed）",
    )
    aplayer = replace_exact(
        aplayer,
        "Mini播放器会默认收起音乐列表，固定在界面左下角。",
        "固定播放器使用吸底模式固定在页面底部，适合在浏览页面时持续显示播放控件。",
    )

    aplayer = regex_replace(
        aplayer,
        r"^(\s{8,})element: document\.getElementById",
        r"\1container: document.getElementById",
        5,
    )
    aplayer = regex_replace(aplayer, r"^(\s{8,})showlrc: false,", r"\1lrcType: 0,", 5)
    aplayer = regex_replace(aplayer, r"^(\s{8,})title:", r"\1name:", 7)
    aplayer = regex_replace(aplayer, r"^(\s{8,})author:", r"\1artist:", 7)
    aplayer = regex_replace(aplayer, r"^(\s{8,})pic:", r"\1cover:", 7)
    aplayer = regex_replace(aplayer, r"^\s{8}mini: true,\n", "", 2)
    aplayer = regex_replace(aplayer, r"^\s+(?:ap|demo|demo1|demo2)\.init\(\);\n", "", 5)

    aplayer = replace_exact(
        aplayer,
        "通常`fixed`和`mini`需同时置为`true`或`false`，否则会有显示异常的问题。",
        "APlayer 官方说明 `mini` 模式与 `fixed` 模式冲突，不应同时启用。需要吸底固定时使用 `fixed: true`；需要迷你模式时使用 `mini: true` 并保持 `fixed: false`。",
    )
    aplayer = replace_exact(
        aplayer,
        "单页面音乐相比Mini音乐播放器可以展示更多的音乐信息，更加正式，但同样存在弊端，当博客切换界面后，背景音乐仍在后台继续播放，只能回到音乐页面暂停，Mini音乐播放器就不会有这种问题，它始终固定在页面左下角，不会随着页面切换退出或重新加载。",
        "单页面音乐相比固定播放器可以展示更多的音乐信息，更加正式，但同样存在弊端，当博客切换界面后，背景音乐仍在后台继续播放，只能回到音乐页面暂停；固定播放器会保持在页面底部，便于随时控制播放。",
    )
    MUSIC.write_text(aplayer + marker + meting, encoding="utf-8")


def validate_source():
    contact = CONTACT.read_text(encoding="utf-8")
    for expected in [
        '[text* your-name placeholder "Your Name:"]',
        '[tel* your-whatsapp placeholder "Phone/Whatsapp:"]',
        '[email* your-email placeholder "Your Email:"]',
        '[textarea* your-message placeholder "Leave your requirements and we will provide you with a quote"]',
    ]:
        assert expected in contact, expected
    assert 'placeholder"' not in contact
    assert "x4 size:40" not in contact

    robots = ROBOTS.read_text(encoding="utf-8")
    assert "title: 网站上传robots.txt文件" in robots
    assert "网站robots.txt文件" in robots
    assert "Robot.txt" not in robots

    config = CONFIG.read_text(encoding="utf-8")
    assert "   GitHub: https://github.com/smalljialive|| anzhiyu-icon-github" in config
    assert "本站采用 AnZhiYu 主题" in config
    assert "本站采用Hero的安知鱼主题" not in config

    music = MUSIC.read_text(encoding="utf-8")
    aplayer, meting = music.split("### 3.Meting三方音乐", 1)
    assert "#### 2.1 固定播放器（Fixed）" in aplayer
    assert "| lrcType" in aplayer
    assert aplayer.count("container: document.getElementById") == 5
    assert aplayer.count("lrcType: 0,") == 5
    for old in [
        "element: document.getElementById",
        "showlrc: false",
        "        mini: true,",
        ".init();",
        "通常`fixed`和`mini`需同时置为`true`或`false`",
        "#### 2.1Mini播放器",
    ]:
        assert old not in aplayer, old
    assert not re.search(r"^\s{8,}(?:title|author|pic):", aplayer, flags=re.MULTILINE)
    original = subprocess.check_output(
        ["git", "show", "HEAD:source/_posts/如何在网站中引入一个音乐播放器.md"],
        cwd=ROOT,
        text=True,
    )
    original_meting = original.split("### 3.Meting三方音乐", 1)[1]
    assert meting == original_meting

    changed = subprocess.check_output(
        ["git", "-c", "core.quotePath=false", "diff", "--name-only"], cwd=ROOT, text=True
    ).splitlines()
    assert set(changed) == TARGETS, f"Unexpected changed files: {changed}"


def without_runtime_blocks(raw):
    raw = re.sub(r"<script\b[^>]*>.*?</script>", "", raw, flags=re.I | re.S)
    raw = re.sub(r"<style\b[^>]*>.*?</style>", "", raw, flags=re.I | re.S)
    return raw


def strip_html(raw):
    raw = without_runtime_blocks(raw)
    raw = re.sub(r"<[^>]+>", " ", raw)
    return re.sub(r"\s+", " ", html.unescape(raw)).strip()


def compact_code_text(raw):
    raw = without_runtime_blocks(raw)
    raw = re.sub(r"<[^>]+>", "", raw)
    return html.unescape(raw)


def validate_generated():
    public = ROOT / "public"
    expected_paths = [
        public / "2025/04/09/Contact Form7 标准留言代码/index.html",
        public / "2025/04/30/如何在网站中引入一个音乐播放器/index.html",
        public / "2024/09/19/网站上传robot-txt文件/index.html",
    ]
    for path in expected_paths:
        assert path.exists(), f"Historical article path missing: {path.relative_to(public)}"

    html_files = list(public.rglob("*.html"))
    total_files = [p for p in public.rglob("*") if p.is_file()]
    assert len(html_files) >= 130, len(html_files)
    assert len(total_files) >= 160, len(total_files)

    contact_html = expected_paths[0].read_text(encoding="utf-8")
    contact_code = compact_code_text(contact_html)
    assert 'placeholder "Your Name:"' in contact_code
    assert 'placeholder "Phone/Whatsapp:"' in contact_code
    assert 'placeholder "Your Email:"' in contact_code
    assert "x4 size:40" not in contact_code

    music_html = expected_paths[1].read_text(encoding="utf-8")
    music_text = strip_html(music_html)
    music_code = compact_code_text(music_html)
    assert "固定播放器（Fixed）" in music_text
    assert "APlayer 官方说明" in music_text
    assert "container: document.getElementById" in music_code
    assert "lrcType: 0" in music_code
    assert "element: document.getElementById" not in music_code
    assert "showlrc: false" not in music_code
    assert ".init();" not in music_code

    robots_html = expected_paths[2].read_text(encoding="utf-8")
    robots_text = strip_html(robots_html)
    assert "网站上传robots.txt文件" in robots_text
    assert "网站robots.txt文件" in robots_text

    home = (public / "index.html").read_text(encoding="utf-8")
    assert 'title="GitHub"' in home
    assert ">本站采用 AnZhiYu 主题<" in home
    assert "本站采用Hero的安知鱼主题" not in home

    print(f"HTML_FILES={len(html_files)} TOTAL_FILES={len(total_files)}")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "apply"
    if mode == "apply":
        apply_changes()
        validate_source()
    elif mode == "source":
        validate_source()
    elif mode == "generated":
        validate_generated()
    else:
        raise SystemExit(f"Unknown mode: {mode}")


if __name__ == "__main__":
    main()
