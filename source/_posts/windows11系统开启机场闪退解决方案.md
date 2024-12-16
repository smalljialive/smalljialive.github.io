---
abbrlink: ''
categories:
- - 运营知识
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/66.jpg
date: '2024-06-15T10:12:59+08:00'
id: 305
tags:
- VPN软件
title: Windows11系统开启机场闪退解决方案
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/66.jpg
updated: '2024-12-16T15:46:34.280+08:00'
---
在使用翻墙节点时出现闪退的解决方案

购买过机场节点后，使用Clash连接或使用机场自带的客户端进行连接时，出现几分钟就闪退的情况，一般是因为软件冲突或网络设置冲突导致。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/65.jpg)

一般可采用以下办法进行解决：

1、重装软件，更新订阅

2、左下角win右键-终端管理员-输入

```
netsh winsock reset
```

（可能是用了虚拟机或WSL之类的软件导致网络出问题）

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/66.jpg)
