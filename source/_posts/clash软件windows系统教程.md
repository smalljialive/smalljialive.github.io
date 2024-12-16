---
abbrlink: ''
categories:
- - 运营知识
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/30.png
date: '2024-06-15T10:17:22+08:00'
id: 309
tags:
- VPN软件
- Clash
title: Clash软件Windows系统教程
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/30.png
updated: '2024-12-16T15:01:01.010+08:00'
---
Windows-Clash for Windows使用教程

# 整体就三个步骤：安装软件——导入订阅——打开clash开关：首页系统代理（System proxy）和开机自启!

## 注意事项

请务必确保关闭并后台退出了其他代理软件和360等安全软件，所有代理软件都是不能同时使用的且和众多安全软件冲突。以及向日葵等远程软件。 **如果其它代理软件开启过系统代理，需要先关掉其它代理软件比如v2rayN的系统代理开关，只退出不行**

## 应用下载与安装

哪个地址先下载完安装哪个： [下载Clash for Windows中文版64位-0.20.39.exe这个，win11可用](https://sabrinathings.lanzouj.com/b01lkeikf) （此网盘无需挂代理，大陆网络可以直接打开） [大陆网盘windows绿色无需安装版本下载，win11不可用](https://tagcloud.lanzoue.com/icE800yez8ah) （此网盘无需挂代理，大陆网络可以直接打开） [国外网盘windows绿色无需安装版本下载，win11不可用](https://note.boccc.co/download/New/CFW-CN.rar) （由于下载地址服务器位于欧洲，部分网络可能下载较慢，如有必要请连接代理下载） win11下载下面的,哪个地址先下载完安装哪个： [境外网盘下载版本](https://www.mediafire.com/file/2gtgm8u71ku9dax/Clash.for.Windows.Setup.0.20.32.exe/file) [国外网盘原版下载](https://www.mediafire.com/file/jma91cqnur5tyzy/Clash.for.Windows-0.20.28-win.7z/file ) （此网盘无需挂代理，大陆网络可以直接打开） [最新版本下载](https://app.nloli.xyz/static/Clash.for.Windows.Setup.0.20.39.exe)

# 使用教程

## 第一步.右键以管理员身份打开软件，注意是要管理员。否则可能不能用！

##### 如果是exe安装包

没有有效的数字签名，因此 SmartScreen 会弹出提示，请点击「更多信息」，然后选择「仍要运行」。 ![](https://img.imgdd.com/f210f3.50250ec3-0ce6-40a5-9870-fee89c0c1461.png)

##### 如果是不需要安装的：下载完毕后，我们如果是压缩包：先解压，电脑没有安装解压软件的，自行去【百度】搜索下载一个【360压缩】，然后解压压缩包。如果不是压缩包是安装程序，就安装软件就好了。

![](https://storage.crisp.chat/users/helpdesk/website/de54da2065412800/1_3wwwtl.png)

##### 解压后，找到小猫咪图标，右键以管理员身份运行

![](https://storage.crisp.chat/users/helpdesk/website/de54da2065412800/2_qnnc17.png)

##### 第一次使用会提示Windows安全中心警报，我们按照下方图示勾选即可。

![](https://storage.crisp.chat/users/helpdesk/website/de54da2065412800/3_1d6lc88.png)

## 第二步：一键导入订阅：

##### 直接点击： [一键导入 Clash](clash://install-config?url=https%3A%2F%2Fbbdingyue.top%2Fapi%2Fv1%2Fclient%2Fsubscribe%3Ftoken%3Dba7cc28f8cd01610cd6324ee9d5a1e3e&name=贝贝云)

浏览器弹窗提示点确认，则会自动导入到你 clash 客户端 一键导入成功后直接去第三步。

### 如果导入失败，需要手动复制订阅导入

手动导入具体教程，点击展开复制您的订阅地址： https://bbdingyue.top/api/v1/client/subscribe?token=ba7cc28f8cd01610cd6324ee9d5a1e3e 打开 clash 页面粘贴订阅地址。 粘贴操作如下：打开【配置/Profiles】--粘贴订阅url到输入框--点击\[下载/download\] ![](https://storage.crisp.chat/users/helpdesk/website/de54da2065412800/4_11yfjrh.png)

### 还不行？排查和解决方法：

导入失败排查与方法。点击展开确保先关闭了你clash的系统代理，避免你本不能使用代理又走代理下载导致失败。 导入失败：尝试**使用订阅本站转换**：[https://sub.yoututz.top/](https://sub.yoututz.top/) 选择默认的【进阶模式】-- 粘贴您的订阅地址： https://bbdingyue.top/api/v1/client/subscribe?token=ba7cc28f8cd01610cd6324ee9d5a1e3e -- 客户端选择clash--点击【生成订阅链接】--然后再重新导入

### 导入成功后点击\[Profiels/配置\]选择刚刚下载的这个配置订阅文件

### 第三步：然后在【代理】【Proxys】页面，选择【规则/Rule】模式！正常使用不要选【全局Global】模式。需要切换节点则在此切换。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/30.png)

上方的按钮是代理模式，正常情况下,推荐默认Rule模式！！！！！！！其中Script不常用，其它介绍如下： **Global是全局代理，若选择此项，所有的网站经过代理访问。** **Rule是规则代理，若选择此项，只有国外的网站才会经过代理访问。** **Direct是全部直连，若选择此项，则所有网站都不经过代理。**

## 第四步：打开代理开关：到clash for windows 首页，打开【系统代理】/【System Proxy】，打开【开机自启】/【Start with Start with Windows】，即可使用。这是开关 ，后续需要关闭就关这。![](https://img.imgdd.com/f210f3.b582c662-b5e1-4de8-9ee7-a8d71b1117a0.webp)

# 看完整，一步一步操作！最后记得打开clash首页的系统代理（System proxy）！！！

———————————————————————分割线————-

## 还不能用？问题排查：

### 1.请务必确保关闭并后台退出了其他代理软件比如v2rayN和360等安全软件，所有代理软件都是不能同时使用的且和众多安全软件冲突。

### 2.确保打开了主页的系统代理System Proxy。这是开关

### 3.以管理员身份运行的 clash for windows。如果不是或者不确定。那重新退出软件，再右键-以管理员身份运行

### 4.更换浏览器试试。或者去浏览器设置页面“重置设置”

![IMG_2354.jpeg](https://img.imgdd.com/f210f3.fa334913-c09e-4dd0-ac59-9c831d215c61.jpeg)

### 5.如果其它代理软件（v2rayN、clash-verge）开启过系统代理，需要先关掉其它代理软件的系统代理开关，再关闭那个代理软件，只退出不行。千万别没关系统代理就卸载了原本开了系统代理的软件，新代理软件会无法成功开启系统代理。

### 6.检查是否开启系统代理，开启了的话检查是否开启成功。开启系统代理成功了是下面这样的，win10为例子：任务栏设置-网络和internet-代理-手动设置代理-使用代理服务器是打开的-地址是127.0.0.1，端口是7890

设置后重启电脑试试 [打开win10代理页面的图文教程参考地址，打开页面就行](https://www.bkqs.com.cn/content/xpwrdl83z.html)![](https://img.imgdd.com/f210f3.eb7e2747-9285-4bef-bf04-721e309a4f2f.png)

### 7.如果系统代理开启无效：重置系统代理

参考：https://www.volcengine.com/theme/1425847-W-7-1

先试试： 一、使用命令行进行重置操作

1.首先打开“命令提示符”，进入管理员模式。

2.在命令行中输入：netsh winhttp reset proxy

3.按下“Enter”键，等待命令完成。

重新打开clash系统代理试试

二、如果也不行：

键盘按 win+r 输入regedit 回车，

打开注册表： HKEY\_CURRENT\_USER/\\SOFTWARE/\\Microsoft/\\Windows/\\CurrentVersion/\\Internet Settings

将“ProxyEnable”和“ProxyServer”键的值均设置为“0”。

然后再使用管理员重新打开clash系统代理。

不行就重启后打开系统代理。或者重启电脑试试。

### 8.检查浏览器代理选择，如果你使用了switch omega记得选择系统代理。

### 9.检查是否打开了向日葵等远程软件，退出关闭不必要的软件。还不行试试重启电脑

该客户端仅支持Windows 10 以上系统，但是也可能有BUG，不一定兼容市面上所有操作系统，如果此客户端您的系统无法使用（比如连上后翻墙翻不了），请更换其它Window客户端。
