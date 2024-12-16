---
abbrlink: ''
categories:
- - WordPress
- - 代码细节
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/23.png
date: '2024-06-30T11:09:37+08:00'
id: 435
tags:
- WordPress
- 网站建设
title: wordpress文章内页显示同一分类的上下文章
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/23.png
updated: '2024-12-16T14:07:20.565+08:00'
---
我们在用wordpress开发网站的时候会在文章页中引入上一篇下一篇，但是发现新闻页的上下文章有可能是产品分类的post，这个就不太合理，如何显示同一分类下的上一篇下一篇文章呢？ 我们通常是在文章页直接添加以下代码进行调用。

我们知道普通的调用上下篇文章的代码是

```
<div class="prev"><?php previous_post_link('« %link') ?></div>
<div class="next"><?php next_post_link('%link »') ?></div>
```

我们进行改造一下

```
<div class="prev"><?php previous_post_link('« %link',' %title', true) ?></div>
<div class="next"><?php next_post_link('%link »','%title', true) ?></div>
```

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/23.png)
