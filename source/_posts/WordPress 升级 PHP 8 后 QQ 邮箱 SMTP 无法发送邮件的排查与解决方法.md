---
abbrlink: ''
categories:
- - WordPress
- - 代码细节
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/995c4297e0254378384c38f328a20fe5.png
date: '2026-09-30T11:01:30.983398+08:00'
tags:
- WordPress
- 网站建设
title: WordPress 升级 PHP 8 后 QQ 邮箱 SMTP 无法发送邮件的排查与解决方法
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/995c4297e0254378384c38f328a20fe5.png
updated: '2026-09-30T11:04:46.971+08:00'
---
# WordPress 升级 PHP 8 后 QQ 邮箱 SMTP 无法发送邮件的排查与解决方法

如果你的 WordPress 网站原本在 PHP 7.x 下可以正常使用 QQ 邮箱 SMTP 发信，但升级到 PHP 8.0、8.1、8.2、8.3 或 8.4 后突然无法发送邮件，并出现类似：

```text
SMTP Error: Could not connect to SMTP host
certificate verify failed
Failed to enable crypto
```

那么问题通常并不是 QQ 邮箱不支持 PHP 8，而是 **PHP 8 环境中的 SSL/TLS CA 证书配置异常**。

本文记录一次实际排查过程和最终解决方法，方便以后快速处理。

![105fc52f-42ad-4586-bc4d-1839fdfb3f1b](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/995c4297e0254378384c38f328a20fe5.png)

---

## 一、问题表现

WordPress 使用 WP Mail SMTP 配置 QQ 邮箱：

```text
SMTP Host: smtp.qq.com
Port: 465
Encryption: SSL
Authentication: 开启
```

QQ 邮箱授权码也填写正确。

但测试邮件发送失败。

错误日志类似：

```text
PHP: 8.4.2
WP Mail SMTP: 4.9.0

Host: smtp.qq.com
Port: 465
SMTPSecure: ssl
SMTPAuth: true

OpenSSL: OpenSSL 1.1.1w
```

关键错误：

```text
SMTP Error: Could not connect to SMTP host

stream_socket_client not available, falling back to fsockopen

SSL operation failed with code 1

tls_process_server_certificate:
certificate verify failed

fsockopen(): Failed to enable crypto
```

其中最关键的一句是：

```text
certificate verify failed
```

这说明 PHP 已经尝试连接 QQ SMTP 服务器，但是在 SSL/TLS 握手阶段无法验证服务器证书。

---

## 二、真正的问题原因

正常发送流程大致是：

```text
WordPress
↓
WP Mail SMTP
↓
PHPMailer
↓
连接 smtp.qq.com:465
↓
SSL/TLS 握手
↓
验证 QQ SMTP 服务器证书
↓
SMTP 登录认证
↓
发送邮件
```

本次故障发生在：

```text
验证 QQ SMTP 服务器证书
```

因此实际上还没有进入：

```text
QQ邮箱用户名
SMTP授权码
SMTP登录认证
```

这些步骤。

也就是说：

> 问题不是 QQ 邮箱密码、授权码或 SMTP 地址错误，而是 PHP/OpenSSL 无法找到正确的 CA 根证书来验证 `smtp.qq.com` 的证书。

---

## 三、为什么 PHP 7 可以，PHP 8 却不行

PHP 7 和 PHP 8 往往并不是共用同一套运行环境。

虚拟主机升级 PHP 后，可能同时变化：

```text
php.ini
OpenSSL
CA证书路径
系统证书包
disable_functions
PHP-FPM配置
```

因此经常会出现：

```text
PHP 7.4
SMTP正常

↓

升级 PHP 8.x

↓

certificate verify failed
```

这并不代表 QQ SMTP 不支持 PHP 8，而是 PHP 8 环境没有正确配置 CA 证书。

---

## 四、第一次尝试：在 PHPMailer 中指定 WordPress CA

WordPress 本身自带一个 CA 证书文件：

```text
/wp-includes/certificates/ca-bundle.crt
```

因此可以尝试在 `functions.php` 中指定 CA 文件。

例如：

```php
add_action( 'phpmailer_init', function ( $phpmailer ) {

    if (
        empty( $phpmailer->Host ) ||
        stripos( $phpmailer->Host, 'smtp.qq.com' ) === false
    ) {
        return;
    }

    $ca_file = ABSPATH . WPINC . '/certificates/ca-bundle.crt';

    if ( is_readable( $ca_file ) ) {
        $phpmailer->SMTPOptions = [
            'ssl' => [
                'verify_peer'       => true,
                'verify_peer_name'  => true,
                'allow_self_signed' => false,
                'cafile'            => $ca_file,
            ],
        ];
    }

}, 999 );
```

但是实际测试后仍然报错。

日志虽然显示：

```text
cafile => /data/user/htdocs/wp-includes/certificates/ca-bundle.crt
```

但仍然出现：

```text
stream_socket_client not available, falling back to fsockopen
```

这说明当前虚拟主机无法使用：

```text
stream_socket_client
```

PHPMailer 因此退回使用：

```text
fsockopen
```

这种情况下，仅通过 PHPMailer 的 `SMTPOptions` 指定 CA 文件并没有解决底层证书验证问题。

---

## 五、最终解决方法：使用 `.user.ini`

由于虚拟主机没有开放完整的 `php.ini` 设置权限，因此无法直接修改：

```text
openssl.cafile
openssl.capath
curl.cainfo
```

最终使用 `.user.ini` 成功解决。

### 第一步：进入 WordPress 网站根目录

例如：

```text
/data/user/htdocs/
```

这个目录通常可以看到：

```text
wp-admin
wp-content
wp-includes
wp-config.php
```

---

## 六、新建 `.user.ini`

在 WordPress 根目录新建文件：

```text
.user.ini
```

注意文件名前面有一个英文句点 `.`。

文件内容只需要写：

```ini
openssl.cafile="/data/user/htdocs/wp-includes/certificates/ca-bundle.crt"
```

保存即可。

如果原本已经存在 `.user.ini`，不要删除原有内容，只需要在最后增加：

```ini
openssl.cafile="/data/user/htdocs/wp-includes/certificates/ca-bundle.crt"
```

---

## 七、等待配置生效

很多虚拟主机使用 PHP-FPM。

`.user.ini` 修改后不一定立即生效。

建议等待：

```text
5～10分钟
```

然后重新进入：

```text
WordPress后台
→ WP Mail SMTP
→ Email Test
→ Send Email
```

再次发送测试邮件。

---

## 八、最终测试结果

增加：

```ini
openssl.cafile="/data/user/htdocs/wp-includes/certificates/ca-bundle.crt"
```

后，测试邮件成功发送。

WP Mail SMTP 显示：

```text
Test email sent successfully!
Check your inbox to confirm delivery.
```

说明问题已经定位并解决。

---

## 九、最终保留的配置

QQ 邮箱 SMTP 保持：

```text
SMTP Host: smtp.qq.com
Encryption: SSL
SMTP Port: 465
Authentication: 开启
```

SMTP 用户名：

```text
完整QQ邮箱地址
```

例如：

```text
123456@qq.com
```

SMTP 密码：

```text
QQ邮箱生成的SMTP授权码
```

不是 QQ 登录密码。

WordPress 根目录保留：

```text
.user.ini
```

内容：

```ini
openssl.cafile="/data/user/htdocs/wp-includes/certificates/ca-bundle.crt"
```

之前为了测试而加入子主题 `functions.php` 的 PHPMailer CA 代码可以删除，因为已经不再需要。

---

## 十、不要使用这种错误解决方法

网上有很多教程会建议关闭 SSL 证书验证：

```php
'verify_peer' => false,
'verify_peer_name' => false,
'allow_self_signed' => true,
```

虽然这样可能可以立即发送邮件，但并不推荐。

因为它本质上是：

```text
不再验证 SMTP 服务器证书
```

并没有真正解决 CA 证书问题。

正确做法应该是：

```text
verify_peer = true
verify_peer_name = true
allow_self_signed = false
```

并为 PHP 指定正确的 CA 根证书文件。

---

## 十一、完整故障链总结

整个问题可以简化为：

```text
PHP 7.x 下 SMTP 正常
↓
升级 PHP 8.x
↓
PHP 8 的 CA 证书配置异常
↓
连接 smtp.qq.com:465
↓
SSL/TLS 握手
↓
certificate verify failed
↓
WP Mail SMTP发送失败
↓
创建 .user.ini
↓
指定 WordPress 自带 ca-bundle.crt
↓
PHP/OpenSSL可以验证 QQ SMTP 证书
↓
测试邮件发送成功
```

---

## 十二、如果仍然无法发送，可以继续检查

如果添加 `.user.ini` 后仍然失败，可以检查：

```text
openssl.cafile
openssl.capath
stream_socket_client
disable_functions
服务器时间
PHP OpenSSL版本
```

如果日志仍然出现：

```text
stream_socket_client not available
```

说明虚拟主机可能禁用了这个函数。

如果仍然出现：

```text
certificate verify failed
```

说明 `.user.ini` 可能没有生效，或者 CA 文件路径填写错误。

---

## 最终结论

QQ 邮箱 SMTP 可以正常运行在 PHP 8.x 环境中。

如果升级 PHP 后出现：

```text
certificate verify failed
```

应优先检查 PHP/OpenSSL 的 CA 根证书配置，而不是反复修改：

```text
SMTP授权码
SMTP端口
QQ邮箱密码
WP Mail SMTP插件
```

对于无法直接修改 `php.ini` 的虚拟主机，一个非常实用的解决办法就是在 WordPress 根目录创建：

```text
.user.ini
```

并写入：

```ini
openssl.cafile="/data/user/htdocs/wp-includes/certificates/ca-bundle.crt"
```

本次实际测试中，该方法成功解决了 PHP 8.4 环境下 QQ 邮箱 SMTP 无法发送邮件的问题。
![105fc52f-42ad-4586-bc4d-1839fdfb3f1b](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/995c4297e0254378384c38f328a20fe5.png)
