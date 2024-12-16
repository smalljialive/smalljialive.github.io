---
abbrlink: ''
categories:
- - 代码细节
- - WordPress
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/34.jpg
date: '2024-09-10T17:15:25+08:00'
id: 413
tags:
- WordPress
- 网站建设
title: GeneratePress主题删除评论框
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/34.jpg
updated: '2024-12-16T15:06:37.893+08:00'
---
# GeneratePress主题删除评论框

generatepress主题可通过在文章页面直接取消评论，若遇到取消评论后，前端页面还会显示评论模块，可通过代码方式禁用（不推荐）

文件代码在**inc-structure**下面的**conmments.php**中（conmments.php为显示评论代码）

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/34.jpg)

删除评论方法网上很多，这里记录下GeneratePress主题删除评论框的操作，只是删除底部评论框，不影响文章插入评论，方便了自定义文章模板，比如文章插入tab标签添加评论的方法，

如果要删除模板中的评论模块，

```
remove_action( 'generate_after_do_template_part', 'generate_do_comments_template', 15); 
```

但是，这只有在设置函数后才生效，所以将其挂钩到after\_setup\_theme，把下列代码丢到_function文件中_

```
add_action('after_setup_theme', function(){

    remove_action( 'generate_after_do_template_part', 'generate_do_comments_template', 15);

});
```

也可以使用**GP Premium**插件中的钩子，添加显示规则，在部分分类文章中生效。使用remove\_action函数

<?php `remove_action( 'generate_after_do_template_part', 'generate_do_comments_template', 15); ` ?>
