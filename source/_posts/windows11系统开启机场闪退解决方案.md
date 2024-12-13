---
title: Windows11系统开启机场闪退解决方案
tags: []
id: '305'
categories:
  - - 问题大全
comments: false
date: 2024-06-15 10:12:59
---

购买过机场节点后，使用Clash连接或使用机场自带的客户端进行连接时，出现几分钟就闪退的情况，一般是因为软件冲突或网络设置冲突导致。 ![](http://www.smalljia.site/wp-content/uploads/2024/06/微信截图_20240615100741.jpg)![](http://www.smalljia.site/wp-content/uploads/2024/06/微信截图_20240615100940.jpg) 一般可采用以下办法进行解决： 1、重装软件，更新订阅 2、左下角win右键-终端管理员-输入netsh winsock reset（可能是用了虚拟机或WSL之类的软件导致网络出问题）