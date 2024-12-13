---
title: Wordpress创建子主题方法
tags: []
id: '460'
categories:
  - - 问题大全
comments: false
date: 2024-11-28 09:47:53
---

使用WordPress建站时，常被建议使用子主题进行自定义，子主题是继承父主题功能、特性和代码的WordPress主题，无需直接修改父主题，以保留样式不被更新覆盖。本文介绍Child Themes Generator插件，提供一键创建子主题的便捷功能。 Child Themes Generator插件能够快速、安全地生成子主题，且不影响网站速度或数据库。 要使用此插件，首先在WordPress仪表盘中安装并激活Child Themes Generator。之后，进入插件设置，通过下拉菜单选择父主题，输入自定义信息（非必填）后，点击创建新子主题。 插件生成的子主题包含function.php、style.css和screenshot文件，点击可查看详细信息。若需删除子主题，选择要删除的主题，点击Remove，确认后即可完成操作。 Child Themes Generator插件简化了子主题创建流程，适用于任何WordPress用户，有助于减少插件使用数量，避免对网站速度产生负面影响。 一旦准备好备份，就可以从WordPress.org安装并激活免费的Child Theme Configurator插件开始。然后，转到**工具→****子主题**以创建您的子主题。 在“**选择****父主题”**下拉列表中，选择要为其创建子主题的主题。然后，单击**分析**：

![](https://www.wpdaxue.com/img/2020/10/create-wordpress-child-theme-1-plugin-method.jpg)

然后，插件将分析您的父主题是否存在任何依赖关系。 完成此操作后，您将看到一些其他选项来配置如何创建子主题。如果不确定特定设置的含义，可以将其保留为默认设置：

![](https://www.wpdaxue.com/img/2020/10/create-wordpress-child-theme-2-configure-child-theme.jpg)

完成选择之后，请点击底部的按钮以**创建****新的子主题****。** 就是这样！然后，该插件将为您创建子主题。但是，它_不会_激活子主题。 要激活它：

*   转到**外观→主题。**
*   预览带有子主题的网站的外观（以确保其正常工作-如果您的网站看起来很奇怪，则可能是因为CSS问题）。
*   像激活其他任何WordPress主题一样激活您的子主题。但是，请确保保留您的父主题。

![](https://www.wpdaxue.com/img/2020/10/create-wordpress-child-theme-3-activate-child-theme.jpg)

激活了子主题之后，“子主题配置器”插件还将包括一些其他有用的工具来帮助您管理子主题。例如，如果转到插件设置的“**文件”**选项卡，则可以查看父主题和子主题中的所有关联文件。 然后，您可以将文件从父主题复制到子主题。 例如，如果要对**single.php**进行一些编辑，则可以将该文件复制到子主题中，以便可以安全地对其进行编辑：

![](https://www.wpdaxue.com/img/2020/10/create-wordpress-child-theme-4-other-tools.jpg)

您还将找到许多其他工具来帮助您使用CSS。