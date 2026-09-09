from pathlib import Path

home = Path("public/index.html").read_text(encoding="utf-8")
assert 'id="rightMenu"' not in home, "rightMenu DOM still generated on home"
assert 'id="rightmenu-mask"' not in home, "rightmenu mask still generated on home"
assert "right_click_menu.js" not in home, "right-click JS unexpectedly loaded on home"
assert 'id="footer-type-tips"' not in home, "empty footer-type-tips still generated"
assert 'id="footer-wrap"' in home, "footer-wrap must remain for layout spacing"

posts = []
for path in Path("public").rglob("index.html"):
    if path == Path("public/index.html"):
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    if 'class="post-copyright"' in text and 'id="post-tools"' in text:
        posts.append((path, text))

assert posts, "no generated post page found for validation"
post_path, post = posts[0]
print("validated post:", post_path)
assert 'onclick="anzhiyu.copyPageUrl(' in post, "copyright title does not use shared copy helper"
assert 'onclick="rm.copyPageUrl(' not in post, "copyright title still depends on rm"
assert '<div class="rewardLeftButton"></div>' not in post, "empty rewardLeftButton still generated"
assert 'class="rewardLeftButton"' not in post, "rewardLeftButton should not exist with current disabled config"
assert 'class="share-link mobile"' in post, "mobile QR share button unexpectedly missing"
assert "qrcodejs@1.0.0/qrcode.min.js" in post, "QRCode script unexpectedly missing on post"
assert 'id="rightMenu"' not in post, "rightMenu DOM still generated on post"
assert 'id="footer-type-tips"' not in post, "footer-type-tips still generated on post"

utils = Path("themes/anzhiyu/source/js/utils.js").read_text(encoding="utf-8")
main = Path("themes/anzhiyu/source/js/main.js").read_text(encoding="utf-8")
right = Path("themes/anzhiyu/source/js/anzhiyu/right_click_menu.js").read_text(encoding="utf-8")
assert "copyPageUrl: async function" in utils
assert "已随机歌曲：" not in utils
assert "console.info(waterfallResult, document.documentElement.clientHeight);" not in main
assert "anzhiyu.copyPageUrl(url);" in right
print("Phase 27 generated-output assertions passed")
