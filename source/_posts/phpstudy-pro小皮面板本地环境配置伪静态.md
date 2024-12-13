---
title: Phpstudy pro小皮面板本地环境配置伪静态
tags: []
id: '443'
categories:
  - - 问题大全
comments: false
date: 2024-10-09 09:21:54
---

# 说一下phpStudy本地环境搭建WordPress后的Nginx伪静态设置，解决本地伪静态失败导致的除了主页以外其他页面全部404问题。

![](https://z3.ax1x.com/2021/07/17/W1sjxJ.png)

解决办法如下：

一、打开phpStudy小皮系统
二、找到设置页面
三、加入伪静态代码
四、重启服务器

## 一、打开phpStudy小皮系统

打开后，发现启用了Nginx和MySQL。

![](https://z3.ax1x.com/2021/07/17/W1ySq1.png)

## 二、找到设置页面

找到设置选项-配置文件-vhosts.conf，点击下面的配置文件0localhost\_80

![](https://z3.ax1x.com/2021/07/17/W1sxM9.png)

## 三、加入伪静态代码

打开后，在最后的 } 前面加入如下代码

if (\-f $request\_filename/index.html){
rewrite (.\*) $1/index.html break;
}
if (-f $request\_filename/index.php){
rewrite (.\*) $1/index.php;
}
if (!-f $request\_filename){
rewrite (.\*) /index.php;
}

如下：

![](https://z3.ax1x.com/2021/07/17/W1y9Vx.png)

## 四、重启服务器

然后重启Nginx或者重启小皮即可，这个时候会发现Wordpress的本地环境伪静态一切正常，可以正常测试了。

最后：
还是有一些不稳定，本来是想解决前台404的问题、前台没问题了突然后台404了
可以注意一下代码有没有放错位置或者括号有没有多少
或者重新设置一遍
​