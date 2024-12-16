---
abbrlink: ''
categories:
- - 代码细节
- - WordPress
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/15.png
date: '2024-10-30T08:59:00+08:00'
id: 452
tags:
- WordPress
- 网站建设
title: 多种方式增加WordPress后台的产品功能
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/15.png
updated: '2024-12-16T11:29:23.720+08:00'
---
博主在使用WordPress建站时，遇到了需要单独增加一个分类的需求，查遍了互联网，发现大家使用最多的还是插件来解决，但有时候插件过多，会导致网站的加载速度变慢，所以博主整理了一下通过代码增加一个产品分类的办法。

## 方法一：使用代码

```php
add_action( 'init', 'create_product_post_types' );
function create_product_post_types() {
register_post_type( 'product', 
array(
'labels' => array(
'name' => __( '产品中心' ),
'singular_name' => __( '产品中心' ),
                             'add_new' => __( '添加' ),
                         'add_new_item' => __( '创建' ),
                         //'edit' => __( 'Edit' ),
                        // 'edit_item' => __( 'Edit Super Duper' ),
                         'new_item' => __( '所有产品' ),
                         //'view' => __( 'View Super Duper' ),
                         //'view_item' => __( 'View Super Duper' ),
                         'search_items' => __( '搜索' ),
                         'not_found' => __( '没有搜索到' ),
                         'not_found_in_trash' => __( '没有搜索到' ),
                         //'parent' => __( 'Parent Super Duper' ),
),
'public' => true,
            //'rewrite' => array('slug' => 'job'),
             //'menu_position' => 15,
            'supports' => array( 'title', 'editor','thumbnail','excerpt', 'author' ),
            //'taxonomies' => array( '' ),
            //'menu_icon' => plugins_url( 'images/image.png', __FILE__ ),
            'has_archive' => true,
)
);
}
//自定义文章的分类功能
add_action( 'init', 'create_product_taxonomies', 0 );
function create_product_taxonomies() {
    register_taxonomy(
        'product_genre',
        'product',
        array(
            'labels' => array(
                'name' => '产品分类',
                'add_new_item' => '添加分类',
                'new_item_name' => "新分类"
            ),
            'show_ui' => true,
            'show_tagcloud' => false,
            'hierarchical' => true
        )
    );
}
```php
add_action( 'init', 'create_product_post_types' );
function create_product_post_types() {
register_post_type( 'product', 
array(
'labels' => array(
'name' => __( '产品中心' ),
'singular_name' => __( '产品中心' ),
                             'add_new' => __( '添加' ),
                         'add_new_item' => __( '创建' ),
                         //'edit' => __( 'Edit' ),
                        // 'edit_item' => __( 'Edit Super Duper' ),
                         'new_item' => __( '所有产品' ),
                         //'view' => __( 'View Super Duper' ),
                         //'view_item' => __( 'View Super Duper' ),
                         'search_items' => __( '搜索' ),
                         'not_found' => __( '没有搜索到' ),
                         'not_found_in_trash' => __( '没有搜索到' ),
                         //'parent' => __( 'Parent Super Duper' ),
),
'public' => true,
            //'rewrite' => array('slug' => 'job'),
             //'menu_position' => 15,
            'supports' => array( 'title', 'editor','thumbnail','excerpt', 'author' ),
            //'taxonomies' => array( '' ),
            //'menu_icon' => plugins_url( 'images/image.png', __FILE__ ),
            'has_archive' => true,
)
);
}
//自定义文章的分类功能
add_action( 'init', 'create_product_taxonomies', 0 );
function create_product_taxonomies() {
    register_taxonomy(
        'product_genre',
        'product',
        array(
            'labels' => array(
                'name' => '产品分类',
                'add_new_item' => '添加分类',
                'new_item_name' => "新分类"
            ),
            'show_ui' => true,
            'show_tagcloud' => false,
            'hierarchical' => true
        )
    );
}

```

大家可以把上面的代码添加到当前wordpress建站主题的**functions.php**文件中，或者是添加到Code Snippets插件中，效果一样。

然后我们来看看效果，wordpress建站后台多出了一个产品中心，这里可以单独添加产品分类和产品，产品默认的是经典编辑器，和WooCommerce插件基本一样，不过可编辑的属性基本没有，使用方法和写文章差不多。这种方法比较适合对产品展示效果要求不高的用户，当然你也可以继续完善上面的代码，或者是使用CSS来美化，但这样就背离的简单方便的本意了，所以还是看下面吧。

## 方法二：使用插件

最简单的方法还是使用插件，目前此类插件有很多，但是它的展示风格可能与我们常规的产品展示不太一样，大家做wordpress外贸建站时，使用的国外wordpress主题很多都是Portfolio类型的插件，或者是主题直接集成了，翻译过来叫投资组合插件，可以展示服务、案例，其实也可以直接用来展示产品。下面推荐的wordpress插件为Portfolio by BestWebSoft。

### ACF-高级自定义文章类型与字段的插件

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/15.png)

### YITH WooCommerce Catalog Mode（需安装woocommerce）

YITH WooCommerce Catalog Mode是一款WordPress插件，主要作用就是为WooCommerce开启目录模式，隐藏添加到购物车和结账按钮。 使用方法很简单，下载插件并且安装，然后进入插件设置开启对应的选项即可。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/16.png)

### MMWD Remove Add To Cart for WooCommerce插件也可以（需安装woocommerce）

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/17.png)
