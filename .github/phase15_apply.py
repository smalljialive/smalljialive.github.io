from pathlib import Path
import re
import sys

BLOG = Path('.')
P1 = BLOG / 'source/_posts/使用Github+Hexo+Anzhiyu快速搭建个人博客.md'
P2 = BLOG / 'source/_posts/使用Github制作个人图床.md'
P3 = BLOG / 'source/_posts/如何在网站中引入一个音乐播放器.md'
TARGETS = [P1, P2, P3]


def replace_exact(text, old, new, label, expected=None):
    count = text.count(old)
    if expected is not None and count != expected:
        raise AssertionError(f'{label}: expected {expected}, found {count}')
    if count == 0:
        raise AssertionError(f'{label}: old text not found')
    return text.replace(old, new)


def apply():
    text = P1.read_text(encoding='utf-8')
    old_block = '''deploy:\ntype: git\nrepository: git@github.com:你的用户名/你的用户名.github.io.git\nbranch: main'''
    new_block = '''deploy:\n  type: git\n  repository: git@github.com:你的用户名/你的用户名.github.io.git\n  branch: main'''
    text = replace_exact(text, old_block, new_block, 'deploy yaml', 1)
    if 'Github' not in text or 'Anzhiyu' not in text:
        raise AssertionError('P1 expected legacy GitHub/AnZhiYu spellings not found')
    text = text.replace('Github', 'GitHub').replace('Anzhiyu', 'AnZhiYu')
    P1.write_text(text, encoding='utf-8')

    text = P2.read_text(encoding='utf-8')
    text = replace_exact(text, "title: ' 使用Github制作个人图床'", 'title: 使用GitHub制作个人图床', 'P2 title', 1)
    if 'Github' not in text or 'Picgo' not in text:
        raise AssertionError('P2 expected legacy GitHub/PicGo spellings not found')
    text = text.replace('Github', 'GitHub').replace('Picgo', 'PicGo')
    text = replace_exact(
        text,
        'https://cdn.jsdelivr.net/gh/ +你的账户名+你的仓库名@你的分支名',
        'https://cdn.jsdelivr.net/gh/你的账户名/你的仓库名@你的分支名',
        'jsDelivr formula',
        1,
    )
    P2.write_text(text, encoding='utf-8')

    text = P3.read_text(encoding='utf-8')
    text = replace_exact(text, '<div id="apalyer"></div>', '<div id="aplayer"></div>', 'aplayer id typo', 1)
    redirect_pairs = [
        ('[https://v.iarc.top/](https://www.iarc.top/go/aHR0cHM6Ly92LmlhcmMudG9wLw)', '[https://v.iarc.top/](https://v.iarc.top/)'),
        ('[https://api.mizore.cn/meting/api.php](https://www.iarc.top/go/aHR0cHM6Ly9hcGkubWl6b3JlLmNuL21ldGluZy9hcGkucGhw)', '[https://api.mizore.cn/meting/api.php](https://api.mizore.cn/meting/api.php)'),
        ('[https://api.mizore.cn/meting/api.php?server=netease&type=playlist&id=7783760543&r=:r](https://www.iarc.top/go/aHR0cHM6Ly9hcGkubWl6b3JlLmNuL21ldGluZy9hcGkucGhwP3NlcnZlcj1uZXRlYXNlJnR5cGU9cGxheWxpc3QmaWQ9Nzc4Mzc2MDU0MyZyPTpy)', '[https://api.mizore.cn/meting/api.php?server=netease&type=playlist&id=7783760543&r=:r](https://api.mizore.cn/meting/api.php?server=netease&type=playlist&id=7783760543&r=:r)'),
    ]
    for idx, (old, new) in enumerate(redirect_pairs, 1):
        text = replace_exact(text, old, new, f'meting redirect {idx}', 1)
    old_flags = '\tfixed="true" \n\tmini="true"'
    new_flags = '\tmini="true"'
    text = replace_exact(text, old_flags, new_flags, 'Meting fixed+mini flags', 1)
    old_desc = '除了之前设置的`server、type、id`参数外，还设置Mini播放器的必要参数`fixed="true", mini="true"`，随机播放`order="random"`。'
    new_desc = '除了之前设置的`server、type、id`参数外，Mini 模式使用`mini="true"`，不要同时开启`fixed`；随机播放使用`order="random"`。'
    text = replace_exact(text, old_desc, new_desc, 'Meting mini description', 1)
    P3.write_text(text, encoding='utf-8')


def source_checks():
    t1 = P1.read_text(encoding='utf-8')
    assert 'title: 使用GitHub+Hexo+AnZhiYu快速搭建个人博客' in t1
    assert 'Github' not in t1
    assert 'Anzhiyu' not in t1
    assert 'deploy:\n  type: git\n  repository: git@github.com:你的用户名/你的用户名.github.io.git\n  branch: main' in t1

    t2 = P2.read_text(encoding='utf-8')
    assert 'title: 使用GitHub制作个人图床' in t2
    assert "title: ' " not in t2
    assert 'Github' not in t2
    assert 'Picgo' not in t2
    assert 'https://cdn.jsdelivr.net/gh/你的账户名/你的仓库名@你的分支名' in t2
    assert 'https://cdn.jsdelivr.net/gh/ +你的账户名+你的仓库名@你的分支名' not in t2

    t3 = P3.read_text(encoding='utf-8')
    assert 'apalyer' not in t3
    assert 'https://www.iarc.top/go/' not in t3
    assert '\tfixed="true" \n\tmini="true"' not in t3
    assert 'Mini 模式使用`mini="true"`，不要同时开启`fixed`' in t3
    assert '[https://v.iarc.top/](https://v.iarc.top/)' in t3
    assert '[https://api.mizore.cn/meting/api.php](https://api.mizore.cn/meting/api.php)' in t3


def strip_tags(s):
    return re.sub(r'<[^>]+>', '', s)


def generated_checks():
    paths = [
        BLOG / 'public/2024/12/17/使用Github+Hexo+Anzhiyu快速搭建个人博客/index.html',
        BLOG / 'public/2024/12/18/使用Github制作个人图床/index.html',
        BLOG / 'public/2025/04/30/如何在网站中引入一个音乐播放器/index.html',
    ]
    for p in paths:
        if not p.exists():
            raise AssertionError(f'historical path missing: {p}')

    html_files = list((BLOG / 'public').rglob('*.html'))
    total_files = [p for p in (BLOG / 'public').rglob('*') if p.is_file()]
    print(f'HTML_FILES={len(html_files)} TOTAL_FILES={len(total_files)}')
    assert len(html_files) >= 130
    assert len(total_files) >= 160

    h1 = paths[0].read_text(encoding='utf-8')
    assert '<title>使用GitHub+Hexo+AnZhiYu快速搭建个人博客 | SmallJia Blog</title>' in h1
    plain1 = strip_tags(h1)
    assert 'deploy:' in plain1 and 'repository: git@github.com:你的用户名/你的用户名.github.io.git' in plain1

    h2 = paths[1].read_text(encoding='utf-8')
    assert '<title>使用GitHub制作个人图床 | SmallJia Blog</title>' in h2
    assert '<title> 使用' not in h2
    plain2 = strip_tags(h2)
    assert 'https://cdn.jsdelivr.net/gh/你的账户名/你的仓库名@你的分支名' in plain2

    h3 = paths[2].read_text(encoding='utf-8')
    plain3 = strip_tags(h3)
    assert 'apalyer' not in plain3
    assert 'www.iarc.top/go/' not in h3
    assert 'Mini 模式使用mini="true"，不要同时开启fixed' in plain3.replace('`', '') or 'Mini 模式使用' in plain3


if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'apply':
        apply()
    elif mode == 'source':
        source_checks()
    elif mode == 'generated':
        generated_checks()
    else:
        raise SystemExit(f'unknown mode: {mode}')
