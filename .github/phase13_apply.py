from pathlib import Path

files = {
    "redirect": Path("source/_posts/Wordpress留言后跳转到感谢Thank You页面的方法.md"),
    "contact": Path("source/_posts/Contact Form7 标准留言代码.md"),
    "sticky": Path("source/_posts/wordpress页面滚动时固定某一部件.md"),
}

# 1) Contact Form 7 redirect article: normalize WordPress casing,
#    restore Markdown emphasis, and remove the duplicate executable script.
path = files["redirect"]
text = path.read_text(encoding="utf-8")

old_heading = "### Wordpress留言表单Contact Form7插件"
new_heading = "### WordPress留言表单Contact Form7插件"
assert text.count(old_heading) == 1, "Expected exactly one old WordPress heading"
text = text.replace(old_heading, new_heading, 1)

escaped_emphasis_count = text.count(r"\*\*")
assert escaped_emphasis_count == 10, f"Expected 10 escaped emphasis markers, got {escaped_emphasis_count}"
text = text.replace(r"\*\*", "**")

duplicate_script = """\n```\n\n<script>\n   document.addEventListener('wpcf7mailsent',function(event){\n         location='/thank-you/';\n   }, false );\n</script>\n\n**以上两种方式均可实现提交表单后跳转感谢页面。具体的感谢页面需要自己制作。**\n"""
replacement = """\n```\n\n**以上两种方式均可实现提交表单后跳转感谢页面。具体的感谢页面需要自己制作。**\n"""
assert text.count(duplicate_script) == 1, "Expected exactly one duplicate executable script block"
text = text.replace(duplicate_script, replacement, 1)
path.write_text(text, encoding="utf-8")

# 2) Contact Form 7 standard-code article: close the style tag correctly.
path = files["contact"]
text = path.read_text(encoding="utf-8")
old_style = "\n<style>\n<script>\n"
new_style = "\n</style>\n<script>\n"
assert text.count(old_style) == 1, "Expected exactly one unclosed style tag before script"
text = text.replace(old_style, new_style, 1)
path.write_text(text, encoding="utf-8")

# 3) Sticky-module article: replace invalid CSS properties/comments with valid CSS.
path = files["sticky"]
text = path.read_text(encoding="utf-8")
old_css = ".scrollfixed { position: fixed; top: 0; left: 0; backgroundcolor: #fff; / 背景颜色可以根据需要进行调整 / boxshadow: 0 2px 4px rgba(0, 0, 0, 0.1); / 可选的阴影效果 / }"
new_css = """.scrollfixed {
  position: fixed;
  top: 0;
  left: 0;
  background-color: #fff; /* 背景颜色可以根据需要进行调整 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 可选的阴影效果 */
}"""
assert text.count(old_css) == 1, "Expected exactly one invalid sticky CSS sample"
text = text.replace(old_css, new_css, 1)
path.write_text(text, encoding="utf-8")

print("Phase 13 approved edits applied to exactly 3 article files.")
