from pathlib import Path

bridge = Path("themes/anzhiyu/source/js/smalljia-essay-qexo.js")
text = bridge.read_text(encoding="utf-8")
old_version = 'const VERSION = "20260911-1";'
old_api = 'const QEXO_API = "https://small-tan.vercel.app/pub/talks/";'
old_play = 'const playMusicCard = async card, music => {'
new_version = 'const VERSION = "20260911-2";'
new_api = 'const QEXO_API = "https://yluidpgnvfurcomnexjr.supabase.co/functions/v1/qexo-talks-proxy";'
new_play = 'const playMusicCard = async (card, music) => {'

for marker, label in [
    (old_version, "bridge version"),
    (old_api, "Qexo API"),
    (old_play, "playMusicCard syntax"),
]:
    if marker not in text:
        raise SystemExit(f"Expected {label} marker not found")

text = text.replace(old_version, new_version, 1)
text = text.replace(old_api, new_api, 1)
text = text.replace(old_play, new_play, 1)
bridge.write_text(text, encoding="utf-8")

page = Path("themes/anzhiyu/layout/page.pug")
page_text = page.read_text(encoding="utf-8")
old_block = """        script(src=url_for('/js/smalljia-essay-qexo-proxy.js') + '?v=20260911-1')
        script(src=url_for('/js/smalljia-essay-qexo.js') + '?v=20260911-1')"""
new_block = """        script(src=url_for('/js/smalljia-essay-qexo.js') + '?v=20260911-2')"""

if old_block not in page_text:
    raise SystemExit("Expected essay script block not found")

page.write_text(page_text.replace(old_block, new_block, 1), encoding="utf-8")
print("Qexo essay bridge patched")
