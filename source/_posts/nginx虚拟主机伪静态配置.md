---
abbrlink: ''
categories:
- - 代码细节
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/55.png
date: '2024-07-30T15:31:35+08:00'
id: 400
tags:
- 网站建设
- 虚拟主机
title: nginx虚拟主机伪静态配置
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/55.png
updated: '2024-12-16T15:26:31.616+08:00'
---
本地apache做好网站上传至服务器或虚拟主机时。

除了首页正常打开，其他页面404报错，经过各方面检查后发现是生产环境的改变，导致伪静态没有配置好。

可在更换的主机配置中更改伪静态配置、 在阿里云虚拟主机中设置WordPress的伪静态；

在 高级环境设置- NGINX设置

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/55.png)

```
location / { try\_files $uri $uri/ /index.php?$args;}
```

保存即可。
