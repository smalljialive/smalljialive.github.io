---
abbrlink: ''
categories:
- - 运营知识
- - wordpress
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/wpmail%E9%85%8D%E7%BD%AE.png
date: '2026-04-15T10:58:29.272278+08:00'
tags:
- 网站建设
- WordPress
title: wordpress网站使用Gmail邮箱配置SMTP留言邮件
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/wpmail%E9%85%8D%E7%BD%AE.png
updated: '2026-04-15T11:18:24.007+08:00'
---
## WordPress 完美实现 Gmail SMTP 发信指南（含 PHP 8.0 报错解决）

在 WordPress 运营中，邮件发送失败（询盘收不到）是 B2B 外贸网站最头疼的问题。由于传统的 PHP `mail()` 函数极易被拦截，且国内运营商普遍封锁了 465/587 等 SMTP 端口，使用 **Gmail API** 代替传统 SMTP 是目前最稳定、安全的解决方案。

本教程将带你彻底搞定 Gmail 配置，并解决 PHP 8.0 环境下的常见报错。

---

## 一、 为什么选择 Gmail API 而不是传统 SMTP？

1. **避开端口封锁**：传统 SMTP 使用 465/587 端口，常被运营商拦截。Gmail API 走 443 端口（HTTPS），稳定性极高。
2. **安全性高**：无需在网站存储邮箱密码，通过 OAuth 2.0 授权。
3. **更佳的发信声誉**：大幅降低询盘邮件被客户邮箱判为垃圾邮件的概率。

---

## 二、 核心配置步骤

### 1. 安装插件

在后台搜索并安装 **WP Mail SMTP** 插件。这是目前兼容性最好的工具。在“邮件程序”中选择 **Google / Gmail**。

### 2. 获取 Gmail API 凭据

你需要前往 [Google Cloud Console](https://console.cloud.google.com/) 进行以下操作：

1. **创建项目**：新建一个名为 "WP Mail" 的项目。（可见图片里的位置）
2. **启用 API**：在“库”中搜索并启用 **Gmail API（直接在搜索框内搜索Gmail API）**。
3. **配置 OAuth 同意屏幕**（新版为OAuth权限请求页面）：
   * 概览位置可以直接开始配置Google Auth Platform。
   * 在“目标对象（Audience）”中选 **外部**。
   * **重要**：将状态从“测试（Testing）”推送到 **“生产环境（Production）”**，否则授权 7 天后会失效。
   * 在“测试用户”中添加你自己的 Gmail 地址。
4. **创建凭据**：选择“OAuth 客户端 ID” -> “Web 应用程序”。
   * **已授权的重定向 URI**：填写 WP Mail SMTP 插件设置页面提供的那串 URL。
5. **保存 ID 和 Secret**：获取 `Client ID` 和 `Client Secret` 并填回 WordPress 插件。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%88%9B%E5%BB%BA%E9%A1%B9%E7%9B%AE.png)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E9%85%8D%E7%BD%AEAuth.png)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/API%E5%92%8C%E6%9C%8D%E5%8A%A1.png)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/wpmail%E9%85%8D%E7%BD%AE.png)

### 3. 完成授权

点击插件页面的“允许插件使用 Google 账号发送邮件”，在弹出的窗口中确认授权即可。

---

## 三、 解决 PHP 8.0 常见的本地调试报错

如果你在本地（如 PhpStudy）调试时遇到报错，请对照以下方案修复：

### 1. cURL error 28 / 10060 (超时)

* **原因**：本地网络无法直连 Google API 服务器。
* **对策**：开启代理软件的 **TUN 模式（虚拟网卡）**。这能让 PHP 环境强制走代理链路。记得同时打开局域网连接（不然还有可能报错）

### 2. cURL error 60 / 77 (证书验证失败)

* **原因**：PHP 找不到根证书文件。
* **修复方法**：
  1. 下载 [cacert.pem](https://www.google.com/search?q=https://curl.se/ca/cacert.pem)。
  2. 修改 `php.ini`，确保路径正确（注意斜杠方向）：
     **Ini, TOML**

     ```
     curl.cainfo = "C:\your_path\cacert.pem"
     openssl.cafile = "C:\your_path\cacert.pem"
     ```
  3. 上传证书到PHP的文件位置C:\phpstudy_pro\Extensions\php\php8.0.2nts\extras\ssl
  4. **重启** PHP 服务。

---

## 四、 总结与注意事项

1. **配额**：免费 Gmail 账号每天发信上限为 **500 封**，这对于 B2B 网站完全足够。
2. **上线环境**：本地调试遇到的网络问题，在搬迁到 **海外服务器（如香港、美国等）** 后会由于网络直连而全部自动消失。
3. **SPF 记录**：为了进一步提高到达率，建议在域名的 DNS 设置中添加 SPF 记录：`v=spf1 include:_spf.google.com ~all`。
