---
title: nginx虚拟主机伪静态配置
tags: []
id: '400'
categories:
  - - 问题大全
comments: false
date: 2024-07-30 15:31:35
---

本地apache做好网站上传至服务器或虚拟主机时。除了首页正常打开，其他页面404报错：生产环境的改变，导致伪静态没有配置好。可在更换的主机配置中更改伪静态配置、 在阿里云虚拟主机中设置WordPress的伪静态； 在 高级环境设置- NGINX设置

[![1624962897 image - 阿里云虚拟主机WordPress伪静态设置](https://aikenote.com/images/2021/06/1624962897-image.png "阿里云虚拟主机WordPress伪静态设置")](https://aikenote.com/images/2021/06/1624962897-image.png)

  location / { try\_files $uri $uri/ /index.php?$args; } 保存即可。