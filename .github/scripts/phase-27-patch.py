from pathlib import Path


def replace_once(path, old, new, label):
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly 1 match, got {count}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"patched: {label}")


replace_once(
    "themes/anzhiyu/layout/includes/layout.pug",
    "    !=partial('includes/third-party/search/index', {}, {cache: true})\n    !=partial('includes/anzhiyu/rightmenu', {}, {cache:true})\n    include ./additional-js.pug",
    "    !=partial('includes/third-party/search/index', {}, {cache: true})\n    if theme.rightClickMenu && theme.rightClickMenu.enable\n      !=partial('includes/anzhiyu/rightmenu', {}, {cache:true})\n    include ./additional-js.pug",
    "guard rightmenu DOM by config",
)

replace_once(
    "themes/anzhiyu/layout/includes/post/post-copyright.pug",
    "        span(onclick=`rm.copyPageUrl('${theme.post_copyright.decode ? decodeURI(url) : url}')`)=pageTitle",
    "        span(onclick=`anzhiyu.copyPageUrl('${theme.post_copyright.decode ? decodeURI(url) : url}')`)=pageTitle",
    "decouple copyright title copy from rm",
)

replace_once(
    "themes/anzhiyu/layout/includes/post/ptool.pug",
    "    div.rewardLeftButton\n      if theme.reward.enable && theme.reward.QR_code\n          !=partial('includes/post/reward', {}, {cache: true})\n      if theme.ptool.mode\n        .reward-link.mode\n          a.reward-link-button(href=url_for(theme.ptool.mode))\n            i.anzhiyufont.anzhiyu-icon-plant-fill\n            | 运营模式与责任",
    "    if (theme.reward.enable && theme.reward.QR_code) || theme.ptool.mode\n      div.rewardLeftButton\n        if theme.reward.enable && theme.reward.QR_code\n            !=partial('includes/post/reward', {}, {cache: true})\n        if theme.ptool.mode\n          .reward-link.mode\n            a.reward-link-button(href=url_for(theme.ptool.mode))\n              i.anzhiyufont.anzhiyu-icon-plant-fill\n              | 运营模式与责任",
    "avoid empty rewardLeftButton",
)

replace_once(
    "themes/anzhiyu/layout/includes/footer.pug",
    "        #footer-type-tips\n",
    "",
    "remove empty footer-type-tips",
)

copy_helper = '''  copyPageUrl: async function (url = window.location.href) {
    const text = url || window.location.href;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const input = document.createElement("input");
        input.value = text;
        document.body.appendChild(input);
        input.select();
        input.setSelectionRange(0, input.value.length);
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("document.execCommand copy failed");
      }
      anzhiyu.snackbarShow("复制链接地址成功", false, 2000);
      return true;
    } catch (error) {
      console.error("复制链接地址失败:", error);
      anzhiyu.snackbarShow("复制链接地址失败，请手动复制", false, 3000);
      return false;
    }
  },

'''
replace_once(
    "themes/anzhiyu/source/js/utils.js",
    "  snackbarShow: (text, showActionFunction = false, duration = 2000, actionText = false) => {",
    copy_helper + "  snackbarShow: (text, showActionFunction = false, duration = 2000, actionText = false) => {",
    "add shared copyPageUrl helper",
)

replace_once(
    "themes/anzhiyu/source/js/utils.js",
    '    console.info("已随机歌曲：", selectRandomSong, "本次随机歌曲：", randomSong.name);\n',
    "",
    "remove random-song debug log",
)

replace_once(
    "themes/anzhiyu/source/js/main.js",
    "          console.info(waterfallResult, document.documentElement.clientHeight);\n",
    "",
    "remove waterfall debug log",
)

replace_once(
    "themes/anzhiyu/source/js/anzhiyu/right_click_menu.js",
    '''rm.copyPageUrl = function (url) {
  if (!url) {
    url = window.location.href;
  }
  rm.copyUrl(url);
  anzhiyu.snackbarShow("复制链接地址成功", false, 2000);
  rm.hideRightMenu();
};''',
    '''rm.copyPageUrl = function (url) {
  anzhiyu.copyPageUrl(url);
  rm.hideRightMenu();
};''',
    "reuse shared copyPageUrl helper in right menu",
)
