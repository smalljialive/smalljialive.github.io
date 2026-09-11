from pathlib import Path

bridge = Path("themes/anzhiyu/source/js/smalljia-essay-qexo.js")
text = bridge.read_text(encoding="utf-8")

old_version = 'const VERSION = "20260911-3";'
new_version = 'const VERSION = "20260911-4";'
old_safe_url = '''  const safeHttpUrl = value => {\n    try {\n      const url = new URL(String(value || ""), window.location.href);\n      return /^https?:$/i.test(url.protocol) ? url.href : "";\n    } catch (_) {\n      return "";\n    }\n  };'''
new_safe_url = '''  const safeHttpUrl = value => {\n    const raw = String(value ?? "").trim();\n    if (!raw) return "";\n    try {\n      const url = new URL(raw, window.location.href);\n      return /^https?:$/i.test(url.protocol) ? url.href : "";\n    } catch (_) {\n      return "";\n    }\n  };'''

for old, new, label in [
    (old_version, new_version, "bridge version"),
    (old_safe_url, new_safe_url, "safeHttpUrl blank guard"),
]:
    if old not in text:
        raise SystemExit(f"Expected {label} marker not found")
    text = text.replace(old, new, 1)

bridge.write_text(text, encoding="utf-8")

page = Path("themes/anzhiyu/layout/page.pug")
page_text = page.read_text(encoding="utf-8")
old_page = "script(src=url_for('/js/smalljia-essay-qexo.js') + '?v=20260911-3')"
new_page = "script(src=url_for('/js/smalljia-essay-qexo.js') + '?v=20260911-4')"
if old_page not in page_text:
    raise SystemExit("Expected essay script version marker not found")
page.write_text(page_text.replace(old_page, new_page, 1), encoding="utf-8")

print("Qexo essay blank optional URLs patched")
