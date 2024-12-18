---
abbrlink: ''
categories:
- - 代码细节
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/72.png
date: '2024-12-17T17:17:06.203780+08:00'
tags:
- 网站建设
- 个人博客
title: 使用Github+Hexo+Anzhiyu快速搭建个人博客
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/72.png
updated: '2024-12-18T10:18:53.899+08:00'
---
#### 个人博客作为互联网冲浪选手的技能展示，是最直观的一种方式，常见的博客搭建方式是通过服务器安装网站程序，然后通过域名解析到的服务器的网站程序，从而达成访问。

#### 所以我们可以采用Github作为服务器，而域名则采用Github默认的仓库名，一样可以制作个人博客。

## 1. 前期准备工作

1. [Node](https://nodejs.org/en)（**必备**）
2. [Git](https://git-scm.com/downloads)（**必备**）
3. [Github](https://www.github.com)（**必备**）
4. [VSCode](https://code.visualstudio.com/)（**可选，代码编辑工具，提供终端连接服务**）
5. 域名，建议配置一个域名以避免被防火墙阻挡。（**若没有展示需求，可不用**）
6. 创建免费图床
7. [Hexo](https://hexo.io/themes/)官方主题展示

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

### 2.3 申请注册Github账号

1.从Github官网注册账号

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/68.png)

## 3. 配置 Git 密钥并连接至 Github

**Git 常见的命令（不是必须输入）:**

```
git config -l
git config --system --list
git config --global --list
```

### 3.1. 配置用户名和邮箱 并验证是否成功（Github的用户名和邮箱）

从电脑的开始菜单打开**Git bash**，然后输入Git命令

```
git config --global user.name 你的用户名
git config --global user.email 你的邮箱
```

然后输入`git config -l`验证是否成功配置了用户名和邮箱

### 3.2. 生成 SSH 公钥，并配置秘钥连接 Github

```
ssh-keygen -t rsa -C 你的邮箱名
```

一直回车生成密钥，然后进入电脑的 **.ssh**文件夹复制 **id_rsa.pub**公钥内容，配置到 Github 的 SSH 设置中。（直接使用记事本打开文件复制内容即可）
![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/69.png)

### 3.3将SSH秘钥配置连接至Github

打开Github网站，点击右上角头像 选择**settings**

进入设置页后选择 **SSH and GPG keys**，填写名称，后期自己能分清楚即可

将复制的秘钥填到Key那一栏。
![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/70.png)

### 3.4测试是否成功连接电脑和Github

```
ssh -T git@github.com
```

第一次连接会提示Are you sure you want to continue connecting (yes/no/[fingerprint])?，输入yes即可

反馈出现**You've successfully authenticated**即表示成功连接

## 4. 创建 GitHub.io 仓库

1. 点击右上角的 `+` 按钮，选择新建仓库，命名格式为 `你的用户名.github.io`，(注意：前缀必须为用户名)选择公开 `Public`。
2. 点击 Creat repository 进行创建即可。

   ![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/71.png)

#### 至此，我们已经通过Github与本地网络连接实现了输入`你的用户名+github.io`访问你的博客地址的操作

## 5. 初始化 Hexo 博客

1. 创建文件夹保存博客源码：在你的电脑的任意盘内创建一个文件夹用于保存源码（C/D/E....盘均可）
2. 打开Git终端，在创建好的空白文件夹内右键打开 **Open git bash here**
3. 开始安装Hexo，在打开的git终端内输入以下代码进行安装

```
npm install -g hexo-cli && hexo -v
```

安装完毕Hexo框架后，需要**初始化 Hexo 项目安装依赖**，继续在终端内输入以下代码

```
hexo init 
npm i
```

经过以上的安装后，我们的本地文件夹内应该已经有了Hexo博客的初始代码，我们可以启动项目并验证：继续在终端内输入一下代码启动项目并在本地打开

```
hexo cl; hexo s
```

在浏览器中访问 [http://localhost:4000/](http://localhost:4000/) 以查看效果。此时会显示一个简易的博客内容（只有本地显示）

## 6. 将静态博客挂载到 GitHub

1. 打开你的本地文件夹，修改 `_config.yml` 文件，配置 `repository` 为你的 GitHub 地址，分支改为 `main`

```
deploy:
type: git
repository: git@github.com:你的用户名/你的用户名.github.io.git
branch: main
```

2. 安装 `hexo-deployer-git`：（为了将本地文件推送至Github）

```
npm install hexo-deployer-git --save
```

3. 部署到 GitHub（以下代码意思为启动本地服务，生成页面，上传至仓库，可按照实际情况输入）

   ```
   // Git BASH终端
   hexo clean && hexo generate && hexo deploy  

   // VSCODE终端
   hexo cl; hexo g; hexo d
   ```

#### 上传完毕后，通过访问 `https://<用户名>.github.io/` 以查看博客。

## 如何使用

### 新建一篇博文

```
hexo new 这是一篇新的博文
```

编辑 `_posts` 文件夹中的新建文章，使用 Markdown 语法编写内容。

### 本地预览

```
hexo cl && hexo s
```

### 推送到 GitHub

```
hexo cl && hexo g && hexo d
```

## 解决 VSCODE 报错

如果首次执行 VSCODE 终端出现报错，可以使用管理员身份打开 PowerShell，并执行以下命令：

```
Set-ExecutionPolicy RemoteSigned
```

## 经过上述步骤，我们已经成功通过Github自带的github.io方式部署了我们的博客，但是还需要进一步的美化

### 个人图床的搭建

个人图床就是你的个人博客网站上图片的存储地址，因为我们是采用Github作为服务器，所以我们需要创建个人图床用来存储我们的图片，目前网络上的图床有很多，选择合适稳定的图床即可。

或者可以查看我的其他文章，使用Github创建个人图床。

### 安装Hexo的“安知鱼”的主题

HEXO的官方主题有很多种可以选择[点击跳转](https://hexo.io/themes/)，我们这次使用Anzhiyu的主题 [安装方法](https://github.com/anzhiyu-c/hexo-theme-anzhiyu?tab=readme-ov-file)

### 1. Git 安装

在博客根目录里打开Git bash终端，安装最新版：

```
git clone -b main https://github.com/anzhiyu-c/hexo-theme-anzhiyu.git themes/anzhiyu
```

### 2.安装 Pug 和 Stylus 渲染插件

运行以下命令：

```
npm install hexo-renderer-pug hexo-renderer-stylus --save
```

### 3. 使用主题

修改 Hexo 配置文件 `_config.yml`，将主题改为 `anzhiyu`。

```
theme: anzhiyu
```

### 4. 覆盖配置

覆盖配置可以使`主题配置`放置在 anzhiyu 目录之外，避免在更新主题时丢失自定义的配置。

通过 Npm 安装主题的用户可忽略，其他用户建议学习使用。

* macos/linux 在博客根目录运行

```shell
cp -rf ./themes/anzhiyu/_config.yml ./_config.anzhiyu.yml
```

* windows 复制`/themes/anzhiyu/_config.yml`此文件到 hexo 根目录，并重命名为`_config.anzhiyu.yml`

以后如果修改任何主题配置，都只需修改 \_config.anzhiyu.yml 的配置即可。

注意：

* 只要存在于 `_config.anzhiyu.yml` 的配置都是高优先级，修改原 `_config.yml` 是无效的。
* 每次更新主题可能存在配置变更，请注意更新说明，可能需要手动对 `_config.anzhiyu.yml` 同步修改。
* 想查看覆盖配置有没有生效，可以通过 `hexo g --debug` 查看命令行输出。
* 如果想将某些配置覆盖为空，注意不要把主键删掉，不然是无法覆盖的

### 5. 主题部署完成，推送上线

```
hexo cl; hexo g; hexo d
```

## 更多功能特性看访问安知鱼的[开发手册](https://docs.anheyu.com/initall.html)

### 例如生成标签页和分类页

#### 生成标签页：

1. 前往你的 Hexo 博客的根目录
2. 在 Hexo 博客根目录下打开终端，输入
   **bash**

   ```
   hexo new page tags
   ```
3. 你会找到 `source/tags/index.md` 这个文件
4. 修改这个文件： 记得添加 `type: "tags"`
   **markdown**

   ```
   ---
   title: 标签
   date: 2021-04-06 12:01:51
   type: "tags"
   comments: false
   top_img: false
   ---
   ```

   | 参数     | 解释                                                             |
   | -------- | ---------------------------------------------------------------- |
   | type     | 【必须】页面类型，必须为 tags                                    |
   | comments | 【可选】是否显示评论                                             |
   | top\_img | 【可选】是否显示顶部图                                           |
   | orderby  | 【可选】排序方式 ：random/name/length                            |
   | order    | 【可选】排序次序： 1, asc for ascending; -1, desc for descending |
   |          |                                                                  |

   #### 生成分类页：


   1. 前往你的 Hexo 博客的根目录
   2. 在 Hexo 博客根目录 `[blog]`下打开终端，输入
      **bash**
      ```
      hexo new page categories
      ```
   3. 你会找到 `source/categories/index.md` 这个文件
   4. 修改这个文件： 记得添加 `type: "categories"`

   **markdown**

   ```
   ---
   title: 分类
   date: 2022-02-23 17:56:00
   aside: false
   top_img: false
   type: "categories"
   ---
   ```
   ### 至此我们就通过Github+Hexo+Anzhiyu搭建好了自己的个人博客！

   ![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/72.png)
