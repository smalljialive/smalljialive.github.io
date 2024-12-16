---
abbrlink: ''
categories:
- - 代码细节
- - WordPress
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/25.png
date: '2024-11-28T09:47:53+08:00'
id: 460
tags:
- WordPress
- 网站建设
title: Wordpress创建子主题方法
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/25.png
updated: '2024-12-16T16:00:17.664+08:00'
---
使用WordPress建站时，常被建议使用**子主题**进行自定义，子主题是继承父主题功能、特性和代码的WordPress主题，无需直接修改父主题，以保留样式不被更新覆盖。

本文介绍Child Themes Configurator插件，提供一键创建子主题的便捷功能。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/24.png)

Child Themes Configurator插件能够快速、安全地生成子主题，且不影响网站速度或数据库。

要使用此插件，首先在WordPress仪表盘中安装并激活Child Themes Configurator。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/25.png)

然后，插件将分析您的父主题是否存在任何依赖关系。 完成此操作后，您将看到一些其他选项来配置如何创建子主题。如果不确定特定设置的含义，可以将其保留为默认设置：

![](https://www.wpdaxue.com/img/2020/10/create-wordpress-child-theme-2-configure-child-theme.jpg)

完成选择之后，请点击底部的按钮以**创建****新的子主题****。** 就是这样！然后，该插件将为您创建子主题。但是，它_不会_激活子主题。 要激活它：

* 转到**外观→主题。**
* 预览带有子主题的网站的外观（以确保其正常工作-如果您的网站看起来很奇怪，则可能是因为CSS问题）。
* 像激活其他任何WordPress主题一样激活您的子主题。但是，请确保保留您的父主题。

![](https://www.wpdaxue.com/img/2020/10/create-wordpress-child-theme-3-activate-child-theme.jpg)

激活了子主题之后，“子主题配置器”插件还将包括一些其他有用的工具来帮助您管理子主题。例如，如果转到插件设置的“**文件”**选项卡，则可以查看父主题和子主题中的所有关联文件。 然后，您可以将文件从父主题复制到子主题。 例如，如果要对**single.php**进行一些编辑，则可以将该文件复制到子主题中，以便可以安全地对其进行编辑：

![](https://www.wpdaxue.com/img/2020/10/create-wordpress-child-theme-4-other-tools.jpg)

您还将找到许多其他工具来帮助您使用CSS。
