---
abbrlink: ''
categories:
- - 代码细节
date: '2024-12-17T17:17:06.203780+08:00'
tags:
- 网站建设
- 个人博客
title: 使用Github+Hexo+Anzhiyu快速搭建个人博客
updated: '2024-12-17T17:17:07.271+08:00'
---
#### 个人博客作为互联网冲浪选手的技能展示，是最直观的一种方式，常见的博客搭建方式是通过服务器安装网站程序，然后通过域名解析到的服务器的网站程序，从而达成访问。

#### 所以我们可以采用Github作为服务器，而域名则采用Github默认的仓库名，一样可以制作个人博客。

## 1. 前期准备工作

1. [Node](https://nodejs.org/en)（**必备**）
2. [Git](https://git-scm.com/downloads)（**必备**）
3. [Github](https://www.github.com)（**必备**）
4. [VSCode](https://code.visualstudio.com/)（**可选，代码编辑工具，提供终端连接服务**）
5. 域名，建议配置一个域名以避免被防火墙阻挡。（**若没有展示需求，可不用**）
6. 配置 Cloudflare，托管域名
7. 创建免费图床
8. 注册cloudflare怕被扣费，推荐用myfine有50张虚拟卡（需要护照）
9. [Hexo](https://hexo.io/themes/)官方主题展示

## 2.开始搭建

### 2.1. 安装 Node

1. 从 [Node 官网](https://nodejs.org/en) 下载适合自己系统的版本。
2. 完成安装，Windows电脑建议使用默认目录 `C:/Program Files/nodejs/`，（也可安装到其他盘内，对网站无影响）苹果电脑所有位置均可。
3. 安装成功后验证一下，按`win+R`调出命令提示符，输入`cmd`进入命令提示行。
4. 在命令行中输入 `node -v` 检查是否出现版本信息。
   ![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/65.png)
5. **苹果用户可通过右键文件夹，选择“服务”，新建终端窗口以便操作。**

### 2.2. 安装 Git

1. 从 [Git 官网](https://git-scm.com/downloads) 下载适配的 Git 版本。
2. Windows 用户可使用默认目录安装 Git，苹果用户则按提示在终端操作。
3. 验证安装完毕后，Windows 用户会在开始菜单中看到 `Git Bash` 等应用。

### 3. 配置 Git 密钥并连接至 Github

常用 Git 命令:

bash


| `1`<br/>`2`<br/>`3`<br/> | `git config -l`<br/>`git config --system --list`<br/>`git config --global --list`<br/> |
| ------------------------ | -------------------------------------------------------------------------------------- |

#### 3.1. 配置用户名和邮箱

bash


| `1`<br/>`2`<br/> | `git config --global user.name "你的用户名"`<br/>`git config --global user.email "你的邮箱"`<br/> |
| ---------------- | ------------------------------------------------------------------------------------------------- |

通过 `git config -l` 验证是否成功。
[![abd](https://13fe9ff.webp.li/2024/10/1d37926686d18e0ac468ce6d00c07a50.png)](https://13fe9ff.webp.li/2024/10/1d37926686d18e0ac468ce6d00c07a50.png)

#### 3.2. 配置公钥连接 Github

1. 生成 SSH 公钥：

bash


| `1`<br/> | `ssh-keygen -t rsa -C "你的邮箱"`<br/> |
| -------- | -------------------------------------- |

一路回车生成密钥，进入 `.ssh` 文件夹复制 `id_rsa.pub` 公钥内容，配置到 Github 的 SSH 设置中。
[![abm](https://13fe9ff.webp.li/2024/10/d2ec687d4c21887ffc96e96687630d7d.png)](https://13fe9ff.webp.li/2024/10/d2ec687d4c21887ffc96e96687630d7d.png)

### 在苹果电脑上，如果你知道文件的路径，可以通过以下几种方式快速找到文件：

打开Finder。
按下 Command + Shift + G，在弹出的对话框中输入文件路径，然后按 Enter。这样可以直接跳转到该路径下的文件。
[![abm](https://13fe9ff.webp.li/2024/10/1efba3fa54bedcba6059cc88a8daf717.png)](https://13fe9ff.webp.li/2024/10/1efba3fa54bedcba6059cc88a8daf717.png)

### 在windows电脑上：

打开C盘下用户文件夹下的.ssh的文件夹，会看到以下文件
id\_rsa 私钥
id\_rsa.pub 公钥

找到公钥匙，并复制，打开GitHub开始配置
[![abm](https://13fe9ff.webp.li/2024/10/0557c8ce136c6e43f4c1541d31beba62.png)](https://13fe9ff.webp.li/2024/10/0557c8ce136c6e43f4c1541d31beba62.png)

2. 将 SSH KEY 配置到 GitHub
   进入github，点击右上角头像 选择settings，进入设置页后选择 SSH and GPG keys，名字随便起，公钥填到Key那一栏。
   [![abm](https://13fe9ff.webp.li/2024/10/84b777a4f0b9a8a290e1472087ce30e2.png)](https://13fe9ff.webp.li/2024/10/84b777a4f0b9a8a290e1472087ce30e2.png)

[![abm](https://13fe9ff.webp.li/2024/10/ab0ad8dba8ff5ace69b12e9ffa5d8b9d.png)](https://13fe9ff.webp.li/2024/10/ab0ad8dba8ff5ace69b12e9ffa5d8b9d.png)

3. 测试连接：

bash


| `1`<br/> | `ssh -T git@github.com`<br/> |
| -------- | ---------------------------- |

第一次连接会提示Are you sure you want to continue connecting (yes/no/[fingerprint])?，输入yes即可
[![abm](https://13fe9ff.webp.li/2024/10/db87e8d1e4767b675c03a907c06ecdda.png)](https://13fe9ff.webp.li/2024/10/db87e8d1e4767b675c03a907c06ecdda.png)

#### 3.3. 创建 GitHub.io 仓库

1. 点击右上角的 `+` 按钮，选择新建仓库，命名格式为 `<用户名>.github.io`，(注意：前缀必须为用户名)选择公开 `Public`。
2. 点击 Creat repository 进行创建即可。
   [![abm](https://13fe9ff.webp.li/2024/10/aff632548c5c460783916a88a187e76a.png)](https://13fe9ff.webp.li/2024/10/aff632548c5c460783916a88a187e76a.png)

[![abm](https://13fe9ff.webp.li/2024/10/6a6a086ab644e9f9ac5820570686e62c.png)](https://13fe9ff.webp.li/2024/10/6a6a086ab644e9f9ac5820570686e62c.png)

## 4. 初始化 Hexo 博客

1. 创建文件夹保存博客源码：

### 苹果用户随意创建好文件夹后，在文件夹右击，选择“服务”选择“新建终端窗口以便操作”

### Windows用户可以（例如 `D:/Hexo-Blog`），在该文件夹内启动 Git Bash 或终端。

2. 安装 Hexo：

bash


| `1`<br/> | `npm install -g hexo-cli && hexo -v`<br/> |
| -------- | ----------------------------------------- |

出现此页面代表安装成功
[![abm](https://13fe9ff.webp.li/2024/10/09dfd08bc762f761b61b4666ac383b99.png)](https://13fe9ff.webp.li/2024/10/09dfd08bc762f761b61b4666ac383b99.png)

3. 初始化 Hexo 项目安装依赖：

bash


| `1`<br/>`2`<br/>`3`<br/> | `hexo init blog-demo`<br/>`cd blog-demo`<br/>`npm i`<br/> |
| ------------------------ | --------------------------------------------------------- |

[![abm](https://13fe9ff.webp.li/2024/10/d17588a07ad38a5285fc42d4c781f9cd.png)](https://13fe9ff.webp.li/2024/10/d17588a07ad38a5285fc42d4c781f9cd.png)

现在你的文件夹会有这些内容
[![abm](https://13fe9ff.webp.li/2024/10/94f0f93b98c067b27d235830032d56ae.png)](https://13fe9ff.webp.li/2024/10/94f0f93b98c067b27d235830032d56ae.png)

4. 启动项目并验证：

bash


| `1`<br/> | `hexo cl && hexo s`<br/> |
| -------- | ------------------------ |

在浏览器中访问 [http://localhost:4000/](http://localhost:4000/) 以查看效果。

[![abm](https://13fe9ff.webp.li/2024/10/5f1f08bb49c8f8d7f63c0bee92e3587b.png)](https://13fe9ff.webp.li/2024/10/5f1f08bb49c8f8d7f63c0bee92e3587b.png)

[![abm](https://13fe9ff.webp.li/2024/10/d05ef82a66a25f7eeb37c0d14abdd9f0.png)](https://13fe9ff.webp.li/2024/10/d05ef82a66a25f7eeb37c0d14abdd9f0.png)

## 5. 将静态博客挂载到 GitHub Pages

1. 修改 `_config.yml` 文件，配置 `repository` 为你的 GitHub 地址，分支改为 `main`：

yaml


| `1`<br/>`2`<br/>`3`<br/>`4`<br/> | `deploy:`<br/>`  type: git`<br/>`  repository: git@github.com:你的用户名/你的用户名.github.io.git`<br/>`  branch: main`<br/> |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |

[![abm](https://13fe9ff.webp.li/2024/10/712da669873ad288ded87d76aa202596.png)](https://13fe9ff.webp.li/2024/10/712da669873ad288ded87d76aa202596.png)

2. 安装 `hexo-deployer-git`：

bash


| `1`<br/> | `npm install hexo-deployer-git --save`<br/> |
| -------- | ------------------------------------------- |

3. 部署到 GitHub：

bash


| `1`<br/>`2`<br/>`3`<br/>`4`<br/>`5`<br/>`6`<br/>`7`<br/> | `// Git BASH终端`<br/>`hexo clean && hexo generate && hexo deploy  `<br/>`// 或者`<br/>`// VSCODE终端`<br/>`hexo cl; hexo g; hexo d`<br/> |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |

访问 `https://<用户名>.github.io/` 以查看博客。

[![abm](https://13fe9ff.webp.li/2024/10/cd3b9d1e923f62809bdf96cd336076a9.png)](https://13fe9ff.webp.li/2024/10/cd3b9d1e923f62809bdf96cd336076a9.png)

## 6. 将静态博客挂载到 Cloudflare Pages

1. 通过 Cloudflare Pages 连接 Git 仓库。
2. 登录 GitHub，点击保存并部署。
3. 部署成功后，访问 Cloudflare 提供的链接。

如有自定义域名，可以在 Cloudflare Pages 中绑定。没有建议去申请，这样博客就不被墙了。

[![abm](https://13fe9ff.webp.li/2024/10/ca110c9b2c7b14a5a0fd9093135c8c63.png)](https://13fe9ff.webp.li/2024/10/ca110c9b2c7b14a5a0fd9093135c8c63.png)

[![abm](https://13fe9ff.webp.li/2024/10/c0f9422b145506e4f632ac7b898e9a63.png)](https://13fe9ff.webp.li/2024/10/c0f9422b145506e4f632ac7b898e9a63.png)

[![abm](https://13fe9ff.webp.li/2024/10/c0b23c4d1f602e6682069169144e95c3.png)](https://13fe9ff.webp.li/2024/10/c0b23c4d1f602e6682069169144e95c3.png)

[![abm](https://13fe9ff.webp.li/2024/10/ce6befcb5c21f13a92d7d8644dcf7484.png)](https://13fe9ff.webp.li/2024/10/ce6befcb5c21f13a92d7d8644dcf7484.png)

[![abm](https://13fe9ff.webp.li/2024/10/cd797e905a9b8bde871dfb29bc6d055c.png)](https://13fe9ff.webp.li/2024/10/cd797e905a9b8bde871dfb29bc6d055c.png)

## 如何使用

### 新建一篇博文

bash


| `1`<br/> | `hexo new 这是一篇新的博文`<br/> |
| -------- | -------------------------------- |

编辑 `_posts` 文件夹中的新建文章，使用 Markdown 语法编写内容。

### 本地预览

bash


| `1`<br/> | `hexo cl && hexo s`<br/> |
| -------- | ------------------------ |

### 推送到 GitHub

bash


| `1`<br/> | `hexo cl && hexo g && hexo d`<br/> |
| -------- | ---------------------------------- |

## 进阶教程预告

接下来会介绍 Hexo 主题美化 文章写作 赶紧订阅我吧！

## 解决 VSCODE 报错

如果首次执行 VSCODE 终端出现报错，可以使用管理员身份打开 PowerShell，并执行以下命令：

bash


| `1`<br/> | `Set-ExecutionPolicy RemoteSigned`<br/> |
| -------- | --------------------------------------- |

[![头像](https://a0d7da0.webp.li/2024/10/channels4_profile.jpg "头像")![头像](https://a0d7da0.webp.li/2024/10/channels4_profile.jpg "头像")](https://www.limin.studio/ "头像")Limin
