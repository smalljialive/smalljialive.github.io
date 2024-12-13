---
title: GeneratePress主题删除评论框
tags: []
id: '413'
categories:
  - - 问题大全
comments: false
date: 2024-09-10 17:15:25
---

# GeneratePress主题删除评论框

文件代码在inc-structure下面的conmments.php中（conmments.php为显示评论代码） ![](http://www.smalljia.site/wp-content/uploads/2024/09/微信截图_20240910171500.jpg)

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