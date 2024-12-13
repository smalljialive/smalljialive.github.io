---
title: Clash软件Mac系统教程
tags: []
id: '311'
categories:
  - - 问题大全
comments: false
date: 2024-06-15 10:18:41
---

整体三个步骤：安装软件——导入订阅——打开clash主页的开关：系统代理和开机自启。看完整，一步一步操作！

## 应用简介

请务必确保关闭并后台退出了其他代理软件和360等安全软件，所有代理软件都是不能同时使用的且和众多安全软件冲突。退出向日葵等远程软件。

## 如果其它代理软件开启过系统代理，需要先关掉其它代理软件比如clashX的系统代理开关再关闭那个代理软件，只退出不行

 

## 应用下载,看哪个下载快，哪个能安装用哪个

[大陆网盘下载](https://tagcloud.lanzoui.com/iQGWT0c147af)（此网盘无需挂代理，大陆网络可以直接打开） [国外网盘下载：版本：0.20.28](https://www.mediafire.com/file/tgbghugk4v4zujr/Clash.for.Windows-0.20.28.dmg/file) （由于下载地址服务器位于国外，部分网络可能下载较慢，如有必要请连接代理下载）高版本测延迟可能会有超时问题 [境外网盘0.20.32版本](https://www.mediafire.com/file/mos8bh0fqc4vcqh/Clash.for.Windows-0.20.32.dmg/file) [境外网盘0.20.32 arm64版本,适合m1 m2 mac](https://www.mediafire.com/file/8po2tz6scnvuksq/Clash.for.Windows-0.20.32-arm64.dmg/file) [国外网盘下载：版本：0.20.3](https://note.boccc.co/download/New/CFW-0.20.3.dmg) （由于下载地址服务器位于欧洲，部分网络可能下载较慢，如有必要请连接代理下载） [Github反代下载](https://purehub.app/detail.php?id=2) 适合打不开 github 又想用最新版本的  

## 使用教程

 

### 第一步：安装软件：下载完毕后，我们按照下方图示操作完成安装

![Moa3X.webp](https://storage.crisp.chat/users/helpdesk/website/de54da2065412800/1_iyfkx4.png)

### 安装完成后，我们在应用程序里面找到CFW，然后打开它，如果系统提示不安全，无法打开，我们需要打开一个开启所有来源的开关，具体看教程? [开启所有来源教程](https://jingyan.baidu.com/article/0320e2c12083275a87507bab.html)

 

### 开启后打开程序就是这样的，如下图所示

![Moa3X.webp](https://storage.crisp.chat/users/helpdesk/website/de54da2065412800/2_ozq8wd.png) 如果显示已经损坏，终端运行： sudo xattr -r -d com.apple.quarantine /Applications/Clash\\ for\\ Windows.app

### 第二步：导入订阅，直接点击：

[一键导入 Clash](clash://install-config?url=https%3A%2F%2Fbbdingyue.top%2Fapi%2Fv1%2Fclient%2Fsubscribe%3Ftoken%3Dba7cc28f8cd01610cd6324ee9d5a1e3e&name=贝贝云) 浏览器弹窗提示点确认，则会自动导入到你 clash 客户端。一键导入成功后直接去看第三步

#### 手动复制导入教程和导入失败解决办法：

手动复制导入教程和导入失败解决办法，点击展开 直接复制您的订阅地址： https://bbdingyue.top/api/v1/client/subscribe?token=ba7cc28f8cd01610cd6324ee9d5a1e3e 然后打开 clash 页面粘贴订阅地址。 粘贴复制的订阅地址： ![Moa3X.webp](https://storage.crisp.chat/users/helpdesk/website/de54da2065412800/3_14i21js.png) 如果导入失败 确保先关闭了你clash的系统代理，避免你本不能使用代理又走代理下载导致失败。 尝试使用订阅本站转换：[https://sub.yoututz.top/](https://sub.yoututz.top/) 选择默认的【进阶模式】-- 粘贴订阅 -- 客户端选择clash--点击【生成订阅链接】--然后再重新导入 导入成功后点击选择刚刚下载的这个配置订阅  

### 第三步：然后在“Proxies”页面，选择Rule规则模式，然后选择节点:点击第一个“贝贝云” 。正常使用不要选【全局Global】模式。需要切换节点则在此切换。

![Snipaste_2023-12-14_00-13-52.png](https://img.imgdd.com/f210f3.c92f1d67-d7f6-4a6f-aeba-2d68bf9a87da.png) 上方的按钮是代理模式，其中Script不常用，其它介绍如下： **Global是全局代理，若选择此项，所有的网站经过代理访问。** **Rule是规则代理，若选择此项，只有国外的网站才会经过代理访问。** **Direct是全部直连，若选择此项，则所有网站都不经过代理。**

### 第四步：打开代理开关：打开clash首页的系统代理（System Proxy），打开开机自启(Start with Start with Windows)！这是开关 ，后续需要关闭就关这。

![](https://img.imgdd.com/f210f3.b582c662-b5e1-4de8-9ee7-a8d71b1117a0.webp)   ——————————————分割线———————————  

# 还不能用，一步步排查

### 0.参考

https://www.zhihu.com/question/426686387

### 1.请务必确保关闭并后台退出了其他代理软件比如clahsx、 v2rayu和360等安全软件，所有代理软件都是不能同时使用的且和众多安全软件冲突。

### 2.确保打开了系统代理。这是开关

### 3.确保关了其它代理开关（比如v2rayU）。如果其它代理软件(clashX)开启过系统代理，需要先关掉其它代理软件的系统代理开关，再关闭那个代理软件，只退出不行。千万别没关系统代理就卸载了原本开了系统代理的软件，新代理软件会无法成功开启系统代理。

### 4.检查浏览器代理选择，比如使用了switch omega记得选择系统代理。使用safari浏览器看代理需要选到【自动发现代理】

### 5.更换浏览器试试。

### 6.或者去浏览器设置页面“重置设置”

![IMG_2354.jpeg](https://img.imgdd.com/f210f3.fa334913-c09e-4dd0-ac59-9c831d215c61.jpeg) ![IMG_2354.jpeg](https://img.imgdd.com/f210f3.fa334913-c09e-4dd0-ac59-9c831d215c61.jpeg)

### 5.检查是否打开了向日葵等远程软件，退出关闭不必要的软件。还不行试试重启电脑

——————————————分割线——————————— 该客户端仅支持Mac os 10 以上系统，但是也可能有BUG，不一定兼容所有操作系统，如果此客户端您的系统无法使用（比如连上后翻墙翻不了），请更换其它Mac客户端 [clash官方教程](https://docs.cfw.lbyczf.com/contents/quickstart.html)