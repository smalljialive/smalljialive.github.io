from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    data = file_path.read_bytes()
    old_bytes = old.encode("utf-8")
    count = data.count(old_bytes)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, found {count}")

    if "\n" in new:
        eol = b"\r\n" if b"\r\n" in data else b"\n"
        new_bytes = eol.join(part.encode("utf-8") for part in new.split("\n"))
    else:
        new_bytes = new.encode("utf-8")

    file_path.write_bytes(data.replace(old_bytes, new_bytes, 1))


# 1) Keep the home essay Swiper, but move its active hardcoded assets to jsDelivr.
config_path = "_config.anzhiyu.yml"
replace_once(
    config_path,
    "    swiper_css: https://npm.elemecdn.com/anzhiyu-theme-static@1.0.0/swiper/swiper.min.css #swiper css依赖",
    "    swiper_css: https://cdn.jsdelivr.net/npm/anzhiyu-theme-static@1.0.0/swiper/swiper.min.css #swiper css依赖",
)
replace_once(
    config_path,
    "    swiper_js: https://npm.elemecdn.com/anzhiyu-theme-static@1.0.0/swiper/swiper.min.js #swiper js依赖",
    "    swiper_js: https://cdn.jsdelivr.net/npm/anzhiyu-theme-static@1.0.0/swiper/swiper.min.js #swiper js依赖",
)

# 2) Move the enabled universe effect from ElemeCDN to jsDelivr.
additional_js = "themes/anzhiyu/layout/includes/additional-js.pug"
replace_once(
    additional_js,
    '    script(async src="https://npm.elemecdn.com/anzhiyu-theme-static@1.0.0/dark/dark.js")',
    '    script(async src="https://cdn.jsdelivr.net/npm/anzhiyu-theme-static@1.0.0/dark/dark.js")',
)

# 3) Load QRCode only on posts that actually render the mobile-share QR code, and use jsDelivr.
replace_once(
    additional_js,
    "  script(src='https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/qrcodejs/1.0.0/qrcode.min.js')",
    "  if is_post() && theme.ptool.enable && theme.ptool.share_mobile\n    script(src='https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js')",
)

# 4) Do not emit an empty stylesheet tag when no optional banner stylesheet is configured.
top_pug = "themes/anzhiyu/layout/includes/top/top.pug"
replace_once(
    top_pug,
    '        link(rel="stylesheet", href=theme.home_top.banner.top_group_banner_css)',
    '        if theme.home_top.banner.top_group_banner_css\n          link(rel="stylesheet", href=theme.home_top.banner.top_group_banner_css)',
)
