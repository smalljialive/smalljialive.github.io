---
abbrlink: ''
categories:
- - 代码细节
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/20.png
date: '2024-06-15T15:51:54+08:00'
id: 365
tags:
- Vps搭建
title: X-ui服务器面板搭建教程
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/20.png
updated: '2024-12-16T13:41:09.773+08:00'
---
# 科学上网：VPS 搭建 X-UI 面板

使用X-UI搭建代理服务，具有以下优点：

* 支持系统状态监控：如CPU、内存、硬盘等状态
* 支持多用户多协议，网页可视化操作
* 支持流量统计
* 支持自定义Xray配置模板
* 支持HTTPS访问面板
* 支持面板自定义端口，账号与密码
* 快速生成分享连接或二维码
* 支持CDN套用
* 支持Fallback分流设置

  ![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/20.png)

点此进入>>[搭建X-UI视频教程](https://youtu.be/n5koU-pj094)

本文转载至Github代码库：[https://github.com/97381736/dajian](https://github.com/97381736/dajian)

## 准备工作

* 1、已经解析的域名，Win+R输入CMD 回车：键入ping 空格输入你的域名，检查一下是否可以ping通
* 2、一台境外VPS主流系统，例如：Debian/Ubuntu/CentOS

[Vultr 购买地址，点此进入](https://www.vultr.com/?ref=8941832-8H)：按时计费，最低6$/月。

* 3、下载并安装FinalShell SSH工具

Windows版下载地址：[点此下载](http://www.hostbuf.com/downloads/finalshell_install.exe)

macOS版下载地址：[点此下载](http://www.hostbuf.com/downloads/finalshell_install.pkg)

## 安装更新运行环境

## 安装 X-ui 面板

### 申请 SSL 证书

下面环境的安装方式，大家根据自己的系统选择命令安装就好了。

### 1、Debian/Ubuntu系统执行以下命令：

```
apt update -y && apt install -y curl && apt install -y socat
```

### 2、CentOS系统执行以下命令：

```
yum update -y && yum update -y && yum install -y socat
```

### 运行Acme脚本

```
curl https://get.acme.sh  sh
```

### 申请证书及密钥

【将代码中注释的邮箱和域名，改为你自己的】

```
~/.acme.sh/acme.sh --register-account -m xxxx@gmail.com
```

---

```
~/.acme.sh/acme.sh  --issue -d 输入你的域名  --standalone
```

### 下载证书及密钥

```
~/.acme.sh/acme.sh --installcert -d 输入你的域名 --key-file /root/private.key --fullchain-file /root/cert.crt
```

### 安装&升级x-ui面板一键脚本

```
bash <(curl -Ls https://raw.githubusercontent.com/vaxilu/x-ui/master/install.sh)
```

### ##BBR2加速##

本脚本建议在Debian≥9或是CentOS≥8以上的系统中使用

```
      echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
      echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
      sysctl -p
      lsmod  grep bbr
```

## 注意事项

* 1、如何在申请证书及密钥这一步搭建失败，检查并放行端口，口令如下：

### 放行80端口

```
    iptables -I INPUT -p tcp --dport 80 -j ACCEPT
```

### 放行443端口，把80改成443

```
    iptables -I INPUT -p tcp --dport 443 -j ACCEPT
```

查看已开放的端口

```
    firewall-cmd --list-ports
```

开放端口（开放后需要要重启防火墙才生效）

```
firewall-cmd --zone=public --add-port=3338/tcp --permanent
```

重启防火墙

```
firewall-cmd --reload
```

停止防火墙

```
systemctl stop firewalld
```

* 2、如果是全新安装，默认网页端口为 54321，用户名和密码默认都是 admin ， 如何遇到打不开的情况，可能是端口没有放行，用【方法1】键入停止防火墙代码，或键入开放端口代码。
* 3、V2ray软件：设置——参数设置——V2rayN设置——Core类型改为Xray\_Core

## 更新证书

目前证书在 60 天以后会自动更新, 你无需任何操作. 今后有可能会缩短这个时间, 不过都是自动的, 你不用关心.

### 更新 Acme 脚本

升级 Acme.sh 到最新版本

```
      ~/.acme.sh/acme.sh --upgrade
```

如果你不想手动升级, 可以开启自动升级:

```
      ~/.acme.sh/acme.sh  --upgrade  --auto-upgrade
```

之后, acme.sh 就会自动保持更新了。
