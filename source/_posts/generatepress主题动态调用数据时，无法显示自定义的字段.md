---
title: Generatepress主题动态调用数据时，无法显示自定义的字段
tags: []
id: '417'
categories:
  - - 问题大全
comments: false
date: 2024-09-12 16:00:44
---

在使用 GeneratePress 主题时，如果你在动态数据中看到自定义字段没有显示，而在选择“post meta”时只显示 `footnotes`，这可能与自定义字段的注册、Gutenberg 编辑器的配置以及主题的兼容性有关。以下是一些可能的解决方案和步骤，以确保自定义字段能够正常显示。

### 1\. 文章内生成自定义字段

![](http://www.smalljia.site/wp-content/uploads/2024/09/微信截图_20240912155453.jpg) 如果文章最底部不显示自定义字段，则在设置里打开![](http://www.smalljia.site/wp-content/uploads/2024/09/微信截图_20240912155519.jpg) ![](http://www.smalljia.site/wp-content/uploads/2024/09/微信截图_20240912155528.jpg)

### 2\. 确保自定义字段已正确注册

首先，确保你已经使用 `register_meta()` 注册了自定义字段，并且设置 `show_in_rest` 为 true，以便在 REST API 和 Gutenberg 编辑器中使用。以下是一个示例：(目前**register\_meta函数在4.9版本后不推荐使用，可以使用register\_post\_meta函数**)

```php
function my_register_custom_meta() {
    register_meta('post', 'my_custom_field', array(
        'type' => 'string',
        'description' => 'A custom field for my posts',
        'single' => true,
        'show_in_rest' => true,  // 让该字段可用于 REST API
    ));
}
add_action('init', 'my_register_custom_meta');
```

若有多个自定义字段需要调用则可以多次调用register\_meta（）

```php
function my_register_custom_meta() {
    register_meta('post', 'my_custom_field', array(
        'type' => 'string',
        'description' => 'A custom field for my posts',
        'single' => true,
        'show_in_rest' => true,  // 让该字段可用于 REST API
    ));

    register_meta('post', 'my_custom_field2', array(
        'type' => 'string',
        'description' => 'A custom field for my posts',
        'single' => true,
        'show_in_rest' => true,  // 让该字段可用于 REST API
    ));
}
add_action('init', 'my_register_custom_meta');
```

在functions函数文件里添加，将字段名称更换为自定义字段的名称![](http://www.smalljia.site/wp-content/uploads/2024/09/微信截图_20240912155732.jpg)

### 3\. 在网站前端编辑时调用post meta

在前端需要动态展示自定义字段内容处调用post meta，并选择自定义字段的名称即可 ![](http://www.smalljia.site/wp-content/uploads/2024/09/微信截图_20240912155948.jpg)