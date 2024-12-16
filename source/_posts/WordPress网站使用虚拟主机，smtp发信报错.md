---
abbrlink: ''
categories:
- - 代码细节
- - WordPress
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/28.png
date: '2024-09-06T17:55:12+08:00'
id: 404
tags:
- WordPress
- 网站建设
title: WordPress网站使用虚拟主机，smtp发信报错
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/28.png
updated: '2024-12-16T14:32:58.351+08:00'
---
WordPress网站本地测试smtp发信功能正常，上传至虚拟主机后，一直显示报错。

查看报错日志后发现是虚拟主机内的fsockopen（）函数没有启用，导致发信功能调用不到函数，

去主机后台启动函数即可

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/28.png)
