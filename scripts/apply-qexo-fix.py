from pathlib import Path

bridge = Path("themes/anzhiyu/source/js/smalljia-essay-qexo.js")
text = bridge.read_text(encoding="utf-8")

replacements = [
    (
        'const VERSION = "20260911-2";',
        'const VERSION = "20260911-3";',
        "bridge version",
    ),
    (
        'return talks.sort((a, b) => Number(b?.time || 0) - Number(a?.time || 0));',
        'return talks.sort((a, b) => Number(a?.time || 0) - Number(b?.time || 0));',
        "talk ordering",
    ),
    (
        'const from = String(valueOf(values, ["from", "source", "来源", "作者"], "SmallJia")).trim();',
        'const from = String(valueOf(values, ["from", "source", "来源", "作者"], "")).trim();',
        "source fallback",
    ),
    (
        'const link = safeHttpUrl(valueOf(values, ["link", "url", "链接", "外链"], ""));',
        'const link = safeHttpUrl(valueOf(values, ["link", "链接"], ""));',
        "explicit link field",
    ),
    (
        'if (fragment.childNodes.length) waterfallEl.prepend(fragment);',
        'if (fragment.childNodes.length) waterfallEl.append(fragment);',
        "append ordering",
    ),
]

for old, new, label in replacements:
    if old not in text:
        raise SystemExit(f"Expected {label} marker not found")
    text = text.replace(old, new, 1)

old_parse = '''  const parseAplayer = values => {\n    const raw = parseMaybeJson(valueOf(values, ["aplayer", "音乐", "music"], null));'''
new_parse = '''  const parseAplayer = values => {\n    const hasMusicValue = [\n      valueOf(values, ["aplayer", "音乐", "music"], ""),\n      valueOf(values, ["music_server", "music_source", "音乐平台", "音乐来源"], ""),\n      valueOf(values, ["music_id", "song_id", "歌曲ID", "音乐ID", "歌曲id", "音乐id"], ""),\n      valueOf(values, ["music_url", "audio_url", "音频地址", "音乐地址"], ""),\n    ].some(value => {\n      if (value && typeof value === "object") {\n        return Object.values(value).some(item => String(item ?? "").trim() !== "");\n      }\n      return String(value ?? "").trim() !== "";\n    });\n    if (!hasMusicValue) return null;\n\n    const raw = parseMaybeJson(valueOf(values, ["aplayer", "音乐", "music"], null));'''

if old_parse not in text:
    raise SystemExit("Expected parseAplayer marker not found")
text = text.replace(old_parse, new_parse, 1)
text = text.replace(
    '["music_server", "music_source", "音乐平台", "音乐来源", "平台"]',
    '["music_server", "music_source", "音乐平台", "音乐来源"]',
    1,
)

bridge.write_text(text, encoding="utf-8")

page = Path("themes/anzhiyu/layout/page.pug")
page_text = page.read_text(encoding="utf-8")
old_page = "script(src=url_for('/js/smalljia-essay-qexo.js') + '?v=20260911-2')"
new_page = "script(src=url_for('/js/smalljia-essay-qexo.js') + '?v=20260911-3')"
if old_page not in page_text:
    raise SystemExit("Expected essay script version marker not found")
page.write_text(page_text.replace(old_page, new_page, 1), encoding="utf-8")

print("Qexo essay ordering and optional-field behavior patched")
