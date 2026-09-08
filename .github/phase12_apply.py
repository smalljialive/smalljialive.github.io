from pathlib import Path
import re
from urllib.parse import parse_qs, quote, urlparse

TITLE_REPLACEMENTS = {
    "source/_posts/wordpress创建子主题方法.md": (
        "title: Wordpress创建子主题方法",
        "title: WordPress创建子主题方法",
    ),
    "source/_posts/Wordpress网站好用的插件推荐.md": (
        "title: Wordpress网站好用的插件推荐",
        "title: WordPress网站好用的插件推荐",
    ),
    "source/_posts/wordpress网站使用Gmail邮箱配置SMTP邮件.md": (
        "title: wordpress网站使用Gmail邮箱配置SMTP留言邮件",
        "title: WordPress网站使用Gmail邮箱配置SMTP留言邮件",
    ),
    "source/_posts/wordpress个人博客类主题推荐.md": (
        "title: Wordpress个人博客类主题推荐",
        "title: WordPress个人博客类主题推荐",
    ),
    "source/_posts/wordpress文章内页显示同一分类的上下文章.md": (
        "title: wordpress文章内页显示同一分类的上下文章",
        "title: WordPress文章内页显示同一分类的上下文章",
    ),
    "source/_posts/Wordpress留言后跳转到感谢Thank You页面的方法.md": (
        "title: Wordpress留言后跳转到感谢Thank You页面的方法",
        "title: WordPress留言后跳转到感谢Thank You页面的方法",
    ),
    "source/_posts/wordpress的generatepress主题取消默认分页，替换为插件wp-pagenavi的样式.md": (
        "title: Wordpress的Generatepress主题取消默认分页，替换为插件Wp_pagenavi的样式",
        "title: WordPress的Generatepress主题取消默认分页，替换为插件Wp_pagenavi的样式",
    ),
    "source/_posts/禁用wordpress插件的更新-全部禁用和部分禁用.md": (
        "title: 禁用wordpress插件的更新-全部禁用和部分禁用",
        "title: 禁用WordPress插件的更新-全部禁用和部分禁用",
    ),
}

for filename, (old_title, new_title) in TITLE_REPLACEMENTS.items():
    path = Path(filename)
    text = path.read_text(encoding="utf-8")
    if text.count(old_title) != 1:
        raise RuntimeError(f"Expected exactly one old title in {filename}: {old_title!r}")
    text = text.replace(old_title, new_title, 1)
    path.write_text(text, encoding="utf-8")

article_path = Path("source/_posts/wordpress个人博客类主题推荐.md")
article = article_path.read_text(encoding="utf-8")
source_credit = "本文转载地址：https://cloud.tencent.com/developer/article/2008499"
if source_credit not in article:
    raise RuntimeError("Original Tencent Cloud source credit is missing")

# Normalize the WordPress brand spelling in this one article only.
article = article.replace("Wordpress", "WordPress")

wrapper_pattern = re.compile(
    r"https://cloud\.tencent\.com/developer/tools/blog-entry\?[^)\s]+"
)
wrappers = wrapper_pattern.findall(article)
if len(wrappers) < 10:
    raise RuntimeError(f"Expected many Tencent wrapper links, found only {len(wrappers)}")


def unwrap_tencent_link(match):
    wrapper = match.group(0)
    query = parse_qs(urlparse(wrapper).query)
    target = query.get("target", [None])[0]
    if not target or not target.startswith(("http://", "https://")):
        raise RuntimeError(f"Could not recover target URL from wrapper: {wrapper}")
    # Keep a Markdown-safe direct URL while preserving normal URL reserved characters.
    return quote(target, safe=":/?#[]@!$&'()*+,;=%")

article = wrapper_pattern.sub(unwrap_tencent_link, article)

if wrapper_pattern.search(article):
    raise RuntimeError("Tencent blog-entry wrapper remains after replacement")
if source_credit not in article:
    raise RuntimeError("Source credit was accidentally removed")

article_path.write_text(article, encoding="utf-8")

print(f"Updated {len(TITLE_REPLACEMENTS)} article titles")
print(f"Unwrapped {len(wrappers)} Tencent redirect links")
