---
abbrlink: ''
categories:
- - 代码细节
- - Wordpress
date: '2025-04-03T15:56:32.513551+08:00'
tags:
- Wordpress
title: 禁用wordpress插件的更新-全部禁用和部分禁用
updated: '2025-04-03T15:56:33.450+08:00'
---
**"主包"**在工作建站的时候，有时候会用一些大佬破解的wordpress插件，这就导致有时候一部分插件会一直显示需要更新到最新版本。

然而**"主包"**也是稍微有点强迫症，遇到更新必须要点，所以费尽一番功夫后，从代码层面屏蔽掉了插件的更新提醒。

代码如下:

```
//禁用某个插件更新
function filter_plugin_updates( $value ) {
    unset( $value->response['watermark-reloaded/watermark-loader.php'] );
    return $value;
}
add_filter( 'site_transient_update_plugins', 'filter_plugin_updates' );
```

```
//禁用全部插件更新
add_filter( 'pre_site_transient_update_plugins', create_function( '$a', "return;" ) );

//第二种禁用全部插件更新，与上面二选一即可
remove_action( 'load-update-core.php', 'wp_update_plugins' ); 
add_filter( 'pre_site_transient_update_plugins', create_function( '$b', "return null;" ) );
```
