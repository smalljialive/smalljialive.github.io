---
abbrlink: ''
categories:
- - 代码细节
- - WordPress
comments: false
cover: https://aikenote.com/images/2022/08/1660366793-image.png
date: '2024-07-29T16:04:56+08:00'
id: 376
tags:
- WordPress
- 网站建设
title: WordPress的SSL证书插件
top_img: https://aikenote.com/images/2022/08/1660366793-image.png
updated: '2024-12-16T13:56:02.897+08:00'
---
WordPress网站免费安装Let's Encrypt SSL证书教程。 网站ssl（https）证书的重要性不言而喻，尤其对含有交易功能的网站来说。 我们为WordPress搭建的网站安装Let's Encrypt证书需要启用下面插件。 [Really Simple SSL](https://cn.wordpress.org/plugins/really-simple-ssl/) 该插件不仅可以免费安装ssl证书，还可以把所有http链接重定向到https包含图片链接等，安装步骤：

* 安装证书
* 更新证书

网站启用插件后会在设置中看到一个SSL图标。

[![1660366631 image - 为WordPress网站安装免费的SSL证书（Let's Encrypt）教程](https://aikenote.com/images/2022/08/1660366631-image.png "为WordPress网站安装免费的SSL证书（Let's Encrypt）教程")](https://aikenote.com/images/2022/08/1660366631-image.png)

## 安装证书

点击SSL打开，如果证书没有安装，会有下面提示：

[![1660366793 image - 为WordPress网站安装免费的SSL证书（Let's Encrypt）教程](https://aikenote.com/images/2022/08/1660366793-image.png "为WordPress网站安装免费的SSL证书（Let's Encrypt）教程")](https://aikenote.com/images/2022/08/1660366793-image.png)

  No SSL detected. Use the retry button to check again.（未检测到SSL，使用重试按钮检查。） 点击“Install SSL certificate”进行安装。 安装完成后会自动帮你配置到服务器或虚拟主机上，并且在网站根目录生成SSL文件，里面包含证书和私钥（基于cPanel面板）；

[![1660367525 image - 为WordPress网站安装免费的SSL证书（Let's Encrypt）教程](https://aikenote.com/images/2022/08/1660367525-image.png "为WordPress网站安装免费的SSL证书（Let's Encrypt）教程")](https://aikenote.com/images/2022/08/1660367525-image.png)

  如果没有自动安装，查看这篇文章在cPanel面板进行手动安装。

## 更新证书

Let's Encrypt的SSL证书有效期为90天，快到期插件会提示你更新证书； 更新时可能遇到的情况：

[![1660368189 image - 为WordPress网站安装免费的SSL证书（Let's Encrypt）教程](https://aikenote.com/images/2022/08/1660368189-image.png "为WordPress网站安装免费的SSL证书（Let's Encrypt）教程")](https://aikenote.com/images/2022/08/1660368189-image.png)

以上提示意思是，SSL证书已经更新，但是无法自动安装，点击“installation”进行安装或在安装过程中下载证书手动部署到主机上。

[![1660368547 image - 为WordPress网站安装免费的SSL证书（Let's Encrypt）教程](https://aikenote.com/images/2022/08/1660368547-image.png "为WordPress网站安装免费的SSL证书（Let's Encrypt）教程")](https://aikenote.com/images/2022/08/1660368547-image.png)

上面提示意思是插件无法自动更新证书，点击“renewed”来更新证书和指导。

[![1660368690 image - 为WordPress网站安装免费的SSL证书（Let's Encrypt）教程](https://aikenote.com/images/2022/08/1660368690-image.png "为WordPress网站安装免费的SSL证书（Let's Encrypt）教程")](https://aikenote.com/images/2022/08/1660368690-image.png)

上面提示：证书自动安装失败，点击“installation”来重新安装和指导。

[![1660368772 image - 为WordPress网站安装免费的SSL证书（Let's Encrypt）教程](https://aikenote.com/images/2022/08/1660368772-image.png "为WordPress网站安装免费的SSL证书（Let's Encrypt）教程")](https://aikenote.com/images/2022/08/1660368772-image.png)

上面提示：证书自动更新和安装成功。 SSL证书安装成功后就会看到浏览器上锁的标志。
