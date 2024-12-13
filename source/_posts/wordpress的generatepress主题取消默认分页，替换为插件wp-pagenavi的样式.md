---
title: Wordpress的Generatepress主题取消默认分页，替换为插件Wp_pagenavi的样式
tags: []
id: '432'
categories:
  - - 问题大全
comments: false
date: 2024-09-30 10:17:20
---

Wordpress的Generatepress主题取消默认分页，替换为插件Wp\_pagenavi的样式 wp默认的分页为：上一页，下一页的样式，中英文根据系统更改。 采用wp\_pagenavi插件则可以自由定制样式与内容 ![](http://www.smalljia.site/wp-content/uploads/2024/09/微信截图_20240930101134.jpg)/\*将此段代码添加到funtion函数文件中\*/ add\_action( 'generate\_paging\_navigation', function() { if ( function\_exists( 'wp\_pagenavi' ) ) { wp\_pagenavi(); } } ); /\*将此样式表添加到自定义css中\*/ .page-numbers { display: none; }