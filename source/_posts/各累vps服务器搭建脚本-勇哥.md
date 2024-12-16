---
abbrlink: ''
categories:
- - 代码细节
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/18.png
date: '2024-06-15T15:46:18+08:00'
id: 362
tags:
- Vps搭建
title: Vps服务器搭建脚本
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/18.png
updated: '2024-12-16T11:40:58.969+08:00'
---
VPS作为外贸常会用到的工具，有时候需要个人按照公司实际情况进行搭建。

本文整理了一些关于搭建VPS使用x-ui脚本过程中会遇到的问题与解决方法。

本文部分内容转载至Github代码库：[https://github.com/yonggekkk/x-ui-yg](https://github.com/yonggekkk/x-ui-yg)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/18.png)

## 服务器搭建脚本：

一键脚本

```
bash <(curl -Ls https://raw.githubusercontent.com/yonggekkk/x-ui-yg/main/install.sh)
```

或

```
bash <(wget -qO- https://raw.githubusercontent.com/yonggekkk/x-ui-yg/main/install.sh)
```

### 视频教程：

[x-ui搭建xray协议脚本大更新（一）：reality协议三模式，数据重置、备份、恢复详细操作](https://youtu.be/xlvKnjQoF7c)

[x-ui搭建xray协议脚本大更新（二）：集成Argo固定隧道、临时隧道](https://youtu.be/NCPCHAi8pzs)

[x-ui搭建xray协议脚本大更新（三）：支持多协议聚合订阅，自动生成Clash-meta、Sing-box配置文件](https://youtu.be/UlQm6c0UQ4U)
