---
title: 各类Vps服务器搭建脚本-勇哥
tags: []
id: '362'
categories:
  - - 问题大全
comments: false
date: 2024-06-15 15:46:18
---

本文转载至Github代码库：[https://github.com/yonggekkk/x-ui-yg](https://github.com/yonggekkk/x-ui-yg)

## 服务器搭建脚本：

一键脚本： bash <(curl -Ls https://raw.githubusercontent.com/yonggekkk/x-ui-yg/main/install.sh) bash <(wget -qO- https://raw.githubusercontent.com/yonggekkk/x-ui-yg/main/install.sh) dns： vi /etc/resolv.conf VPS一键管理助手脚本： bash <(curl -Lso- https://raw.githubusercontent.com/yirenchengfeng1/linux/main/manage\_vps.sh) 开启BBR加速 wget -N --no-check-certificate "https://raw.githubusercontent.com/chiakge/Linux-NetSpeed/master/tcp.sh" && chmod +x tcp.sh && ./tcp.sh  

## 下版第四期更新教程将在2024.6下旬发布。。。

### x-ui精简修改版一键脚本，面板中的相关设置近可能与原作者[vaxilu](https://github.com/vaxilu/x-ui)保持一致

### 支持纯IPV4、纯IPV6、AMD64、ARM64的VPS直接安装，推荐使用最新的Ubuntu系统

### 相关说明及注意点请查看[博客说明](https://ygkkk.blogspot.com/2023/05/reality-xui-chatgpt.html)

### 视频教程：

[x-ui搭建xray协议脚本大更新（一）：reality协议三模式，数据重置、备份、恢复详细操作](https://youtu.be/xlvKnjQoF7c)

[x-ui搭建xray协议脚本大更新（二）：集成Argo固定隧道、临时隧道](https://youtu.be/NCPCHAi8pzs)

[x-ui搭建xray协议脚本大更新（三）：支持多协议聚合订阅，自动生成Clash-meta、Sing-box配置文件](https://youtu.be/UlQm6c0UQ4U)

### 一键脚本：

```
bash <(curl -Ls https://raw.githubusercontent.com/yonggekkk/x-ui-yg/main/install.sh)
```

或

```
bash <(wget -qO- https://raw.githubusercontent.com/yonggekkk/x-ui-yg/main/install.sh)
```

* * *

### x-ui-yg脚本界面预览图（注：相关参数随意填写，仅供围观）

[![179ce8b1d5f7b0327dbc8de45f9bdcc](https://private-user-images.githubusercontent.com/121604513/332624095-e28f0beb-efc3-41c1-895e-e39dc8863a37.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTg0Mzc2NzQsIm5iZiI6MTcxODQzNzM3NCwicGF0aCI6Ii8xMjE2MDQ1MTMvMzMyNjI0MDk1LWUyOGYwYmViLWVmYzMtNDFjMS04OTVlLWUzOWRjODg2M2EzNy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQwNjE1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MDYxNVQwNzQyNTRaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1hNzQ2OTY4ZTdlNjhkNWY4YmU4MjRhYmRjOTJiNWRkODEzMGQ0YWFjNDkyOTYxMjRhYjMwNzNiODE4OWRmZDY5JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZhY3Rvcl9pZD0wJmtleV9pZD0wJnJlcG9faWQ9MCJ9.hW_1k7-Ge83XQ3AEHq1OOnClL9f4yOJfUCuJeK3-jXQ)](https://private-user-images.githubusercontent.com/121604513/332624095-e28f0beb-efc3-41c1-895e-e39dc8863a37.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTg0Mzc2NzQsIm5iZiI6MTcxODQzNzM3NCwicGF0aCI6Ii8xMjE2MDQ1MTMvMzMyNjI0MDk1LWUyOGYwYmViLWVmYzMtNDFjMS04OTVlLWUzOWRjODg2M2EzNy5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjQwNjE1JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI0MDYxNVQwNzQyNTRaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1hNzQ2OTY4ZTdlNjhkNWY4YmU4MjRhYmRjOTJiNWRkODEzMGQ0YWFjNDkyOTYxMjRhYjMwNzNiODE4OWRmZDY5JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZhY3Rvcl9pZD0wJmtleV9pZD0wJnJlcG9faWQ9MCJ9.hW_1k7-Ge83XQ3AEHq1OOnClL9f4yOJfUCuJeK3-jXQ)

* * *

### 交流平台：[甬哥博客地址](https://ygkkk.blogspot.com)、[甬哥YouTube频道](https://www.youtube.com/@ygkkk)、[甬哥TG电报群组](https://t.me/+jZHc6-A-1QQ5ZGVl)、[甬哥TG电报频道](https://t.me/+DkC9ZZUgEFQzMTZl)

* * *

### 感谢你右上角的star🌟

 

[![Stargazers over time](https://camo.githubusercontent.com/d449d6deb5aaf52ba9c7fc1ae0999bbb1b5f58f60cb26538e903d040af6ff2e1/68747470733a2f2f7374617263686172742e63632f796f6e6767656b6b6b2f782d75692d79672e737667)](https://starchart.cc/yonggekkk/x-ui-yg)

### 参考项目[vaxilu](https://github.com/vaxilu/x-ui)，[MHSanaei](https://github.com/MHSanaei/3x-ui)，[qist](https://github.com/qist/xray-ui)