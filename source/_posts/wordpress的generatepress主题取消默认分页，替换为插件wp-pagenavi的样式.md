---
abbrlink: ''
categories:
- - WordPress
- - 代码细节
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/23.jpg
date: '2024-09-30T10:17:20+08:00'
id: 432
tags:
- WordPress
- 网站建设
title: Wordpress的Generatepress主题取消默认分页，替换为插件Wp_pagenavi的样式
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/23.jpg
updated: '2024-12-16T13:59:43.483+08:00'
---
WordPress的GeneratePress主题自带的分类按钮中英文需要按照后台的语言设置同步，这就导致如果我们后台用的中文后台，但是做的外贸英文网站，在前端的分页显示的为中文的“上一页”和“下一页”，为了解决这个问题，我们一般会采用第三方插件解决。

### Wp_pagenavi插件

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/23.jpg)



将此段代码添加到funtion函数文件中

```
add_action( 'generate_paging_navigation', function() { if ( function_exists( 'wp_pagenavi' ) ) { wp_pagenavi(); } } );
```

将此样式表添加到自定义css中

```
.page-numbers { display: none; }

```
