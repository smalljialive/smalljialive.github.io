/**
 * AnZhiYu
 * lazyload
 * replace src to data-lazy-src
 */

"use strict";

const urlFor = require("hexo-util").url_for.bind(hexo);

const lazyload = htmlContent => {
  const error_img = hexo.theme.config.error_img.post_page;
  const bg = hexo.theme.config.lazyload.placeholder
    ? urlFor(hexo.theme.config.lazyload.placeholder)
    : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  return htmlContent.replace(/<img\b[^>]*>/gi, imgTag => {
    if (/\bclass\s*=\s*["'][^"']*\bnolazyload\b[^"']*["']/i.test(imgTag)) {
      return imgTag;
    }

    const srcPattern = /\s+src=(["'])(.*?)\1/i;
    if (!srcPattern.test(imgTag)) return imgTag;

    const hasOnerror = /(?:^|\s)onerror\s*=/i.test(imgTag);
    const errorHandler = hasOnerror
      ? ""
      : ` onerror="this.onerror=null,this.src=&quot;${error_img}&quot;"`;

    return imgTag.replace(
      srcPattern,
      (_, quote, src) => ` src="${bg}"${errorHandler} data-lazy-src=${quote}${src}${quote}`
    );
  });
};

hexo.extend.filter.register("after_render:html", data => {
  const { enable, field } = hexo.theme.config.lazyload;
  if (!enable || field !== "site") return;
  return lazyload(data);
});

hexo.extend.filter.register("after_post_render", data => {
  const { enable, field } = hexo.theme.config.lazyload;
  if (!enable || field !== "post") return;
  data.content = lazyload(data.content);
  return data;
});
