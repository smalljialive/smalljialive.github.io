from pathlib import Path

ROOT = Path('.')
local_search = ROOT / 'themes/anzhiyu/source/js/search/local-search.js'
pagination = ROOT / 'themes/anzhiyu/layout/includes/pagination.pug'
main_js = ROOT / 'themes/anzhiyu/source/js/main.js'

# 1) Local search: keep exactly one removable ESC handler.
text = local_search.read_text(encoding='utf-8')
old = '''  const openSearch = () => {\n    const bodyStyle = document.body.style;\n    bodyStyle.width = "100%";\n    bodyStyle.overflow = "hidden";\n    anzhiyu.animateIn($searchMask, "to_show 0.5s");\n    anzhiyu.animateIn(document.querySelector("#local-search .search-dialog"), "titleScale 0.5s");\n    setTimeout(() => {\n      document.querySelector("#local-search-input input").focus();\n    }, 100);\n    if (!loadFlag) {\n      search();\n      loadFlag = true;\n    }\n    // shortcut: ESC\n    document.addEventListener("keydown", function f(event) {\n      if (event.code === "Escape") {\n        closeSearch();\n        document.removeEventListener("keydown", f);\n      }\n    });\n  };\n\n  const closeSearch = () => {\n    const bodyStyle = document.body.style;\n    bodyStyle.width = "";\n    bodyStyle.overflow = "";\n    anzhiyu.animateOut(document.querySelector("#local-search .search-dialog"), "search_close .5s");\n    anzhiyu.animateOut($searchMask, "to_hide 0.5s");\n  };\n'''
new = '''  const handleSearchEscape = event => {\n    if (event.code === "Escape") closeSearch();\n  };\n\n  const openSearch = () => {\n    const bodyStyle = document.body.style;\n    bodyStyle.width = "100%";\n    bodyStyle.overflow = "hidden";\n    anzhiyu.animateIn($searchMask, "to_show 0.5s");\n    anzhiyu.animateIn(document.querySelector("#local-search .search-dialog"), "titleScale 0.5s");\n    setTimeout(() => {\n      document.querySelector("#local-search-input input").focus();\n    }, 100);\n    if (!loadFlag) {\n      search();\n      loadFlag = true;\n    }\n    document.removeEventListener("keydown", handleSearchEscape);\n    document.addEventListener("keydown", handleSearchEscape);\n  };\n\n  const closeSearch = () => {\n    document.removeEventListener("keydown", handleSearchEscape);\n    const bodyStyle = document.body.style;\n    bodyStyle.width = "";\n    bodyStyle.overflow = "";\n    anzhiyu.animateOut(document.querySelector("#local-search .search-dialog"), "search_close .5s");\n    anzhiyu.animateOut($searchMask, "to_hide 0.5s");\n  };\n'''
assert text.count(old) == 1, 'local-search target block count mismatch'
text = text.replace(old, new, 1)
local_search.write_text(text, encoding='utf-8')

# 2) Pagination: remove the malformed duplicate onkeyup filter.
text = pagination.read_text(encoding='utf-8')
old = '''          input(id="toPageText" oninput="value=value.replace(/[^0-9]/g,'')" maxlength="3" onkeyup="this.value=this.value.replace(/[^u4e00-u9fa5w]/g,'')" aria-label="toPage")'''
new = '''          input(id="toPageText" oninput="value=value.replace(/[^0-9]/g,'')" maxlength="3" aria-label="toPage")'''
assert text.count(old) == 1, 'pagination target count mismatch'
text = text.replace(old, new, 1)
pagination.write_text(text, encoding='utf-8')

# 3a) Code-copy feedback: inspect the real execCommand result and catch exceptions.
text = main_js.read_text(encoding='utf-8')
old = '''    const copy = ctx => {\n      if (document.queryCommandSupported && document.queryCommandSupported("copy")) {\n        document.execCommand("copy");\n        alertInfo(ctx, GLOBAL_CONFIG.copy.success);\n      } else {\n        alertInfo(ctx, GLOBAL_CONFIG.copy.noSupport);\n      }\n    };\n'''
new = '''    const copy = ctx => {\n      if (!(document.queryCommandSupported && document.queryCommandSupported("copy"))) {\n        alertInfo(ctx, GLOBAL_CONFIG.copy.noSupport);\n        return;\n      }\n\n      try {\n        const copied = document.execCommand("copy");\n        alertInfo(ctx, copied ? GLOBAL_CONFIG.copy.success : GLOBAL_CONFIG.copy.error);\n      } catch (error) {\n        console.error("复制代码失败:", error);\n        alertInfo(ctx, GLOBAL_CONFIG.copy.error);\n      }\n    };\n'''
assert text.count(old) == 1, 'main copy helper target count mismatch'
text = text.replace(old, new, 1)

# 3b) Page-jump Enter: only PJAX-load a real href produced by toPage().
old = '''      input.addEventListener("keydown", event => {\n        if (event.keyCode === 13) {\n          // 如果按下的是回车键，则执行特定的函数\n          anzhiyu.toPage();\n          var link = document.getElementById("toPageButton");\n          var href = link.href;\n          pjax.loadUrl(href);\n        }\n      });\n'''
new = '''      input.addEventListener("keydown", event => {\n        if (event.keyCode === 13) {\n          // 如果按下的是回车键，则执行特定的函数\n          anzhiyu.toPage();\n          const link = document.getElementById("toPageButton");\n          const href = link ? link.getAttribute("href") : "";\n          if (!href || href.startsWith("javascript:")) return;\n          pjax.loadUrl(href);\n        }\n      });\n'''
assert text.count(old) == 1, 'main page-jump target count mismatch'
text = text.replace(old, new, 1)
main_js.write_text(text, encoding='utf-8')

print('Phase 16 edits applied successfully')
