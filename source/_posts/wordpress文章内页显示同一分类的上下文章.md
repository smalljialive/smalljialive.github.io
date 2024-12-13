---
title: wordpress文章内页显示同一分类的上下文章
tags: []
id: '435'
categories:
  - - 问题大全
comments: false
date: 2024-06-30 11:09:37
---

我们在用wordpress开发网站的时候会在文章页中引入上一篇下一篇，但是发现新闻页的上下文章有可能是产品分类的post，这个就不太合理，如何显示同一分类下的上一篇下一篇文章呢？ 我们通常是在文章页直接添加以下代码进行调用。 我们知道普通的调用上下篇文章的代码是

1

2

`<div` `class``=``"prev"``><?php previous_post_link(``'« %link'``) ?></div>`

`<div` `class``=``"next"``><?php next_post_link(``'%link »'``) ?></div>`

我们进行改造一下

1

2

`<div` `class``=``"prev"``><?php previous_post_link(``'« %link'` `,``' %title'` `, true) ?></div>`

`<div` `class``=``"next"``><?php next_post_link(``'%link »'``,``'%title'` `, true) ?></div>`