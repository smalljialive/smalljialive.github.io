---
abbrlink: ''
categories:
- - 代码细节
- - WordPress
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/22.png
date: '2024-06-15T10:26:33+08:00'
id: 321
tags:
- WordPress
- 网站建设
title: Wordpress页面滚动时固定某一部件
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/22.png
updated: '2024-12-16T13:44:23.883+08:00'
---
博主在网站建设时需要一个固定某一模块，使其在滑动时固定在页面顶部展示。经过博主的各种编辑操作与测试，总结出两种方法。一种是使用H5+C3+JS的手写代码实现模块固定，另一种是使用WordPress的插件。

### 1.代码方式实现

要在WordPress中实现随滚动条固定滚动效果，你可以使用HTML、CSS和JavaScript来完成。以下是一般的步骤：

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/21.jpg)

编辑主题文件：首先，在WordPress中编辑你正在使用的主题的文件。

最常见的文件是header.php和footer.php，但也可以根据需要选择其他文件。

添加HTML结构：在你选择的主题文件中，找到你想要添加滚动效果的元素，通常是标题、导航栏或其他内容。在这个元素的开头和结尾之间添加必要的HTML结构，例如<div>元素，以便稍后应用CSS和JavaScript效果。

编写CSS：使用CSS来定义滚动效果。你需要为该元素创建两种样式，一种是默认样式，另一种是固定在滚动时的样式。例如：

```
.scrollfixed { position: fixed; top: 0; left: 0; backgroundcolor: #fff; / 背景颜色可以根据需要进行调整 / boxshadow: 0 2px 4px rgba(0, 0, 0, 0.1); / 可选的阴影效果 / }
```

编写JavaScript：使用JavaScript来添加滚动效果的交互。你需要检测页面滚动并根据滚动位置来切换元素的样式类。以下是一个简单的示例：

```
window.addEventListener('scroll', function() { var element = document.getElementById('yourelementid'); // 替换为你的元素ID var scrollPosition = window.scrollY; if (scrollPosition > 100) { // 根据需要的滚动位置来调整 element.classList.add('scrollfixed'); } else { element.classList.remove('scrollfixed'); } });
```


保存文件：保存你编辑的主题文件，并确保在WordPress后台启用你的主题。 测试和调整：在WordPress网站上滚动页面以测试效果，并根据需要调整CSS和JavaScript代码，以确保滚动效果符合你的预期。 请注意，以上示例是一个简单的实现方法。实际情况可能会更复杂，具体取决于你的网站结构和需求。如果你对HTML、CSS和JavaScript不太熟悉，最好寻求专业开发人员的帮助，以确保实现正确的效果。

若不想更改主题编辑文件（更新后容易丢失），可将上述代码添加至插件Code Snippets中。

### 2.采用插件：Fixed Widget and Sticky Elements for WordPress

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/22.png)
