---
abbrlink: ''
categories:
- - 代码细节
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/88.png
date: '2024-12-18T13:33:55.005278+08:00'
tags:
- 网站建设
- 个人博客
title: ' 使用Github制作个人图床'
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/88.png
updated: '2024-12-18T14:21:46.719+08:00'
---
图床的含义是图片存储仓库，市面上的图床有很多平台，可以选择付费平台以及免费平台。作为白嫖党，自然选择GitHub平台，不怕跑路还稳定。

Github作为程序员的宝库，不仅能用来制作我们的个人博客，也可以用于制作我们的个人图床，为我们的个人博客或者网站提供图片链接。

### 第一步：准备好Github账户，并新建一个仓库

1. 打开Github官网，登录我们的个人账号， 没有账号的话需要注册一个。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/68.png)
2. 点击右上角的+号，选择New repository，创建一个新的图片存储仓库。仓库名称与描述自己随意填写，选择仓库为Public公开，之后创建仓库。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/86.png)
3. 目前我们就已经创建好了自己的个人图库仓库，可以通过图片的地址直接访问到图片了。

---

### 第二步：接下来创建一个Token，并通过图片上传软件来连接我们的图床

1. 点击右上角的头像打开 **settings** ->最下面的 **Developer settings** -> **Personal access tokens**
2. 设置权限为 **repo** 和 **public repo**，有效时间可按照自己的需求设置
3. 创建一个文本，保存生成的 Token（丢失后无法恢复，只能重新生成）

   ![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/76.avif)

   #### 至此我们在Github上的操作已经完成了，接下来我们就需要下载Picgo软件来连接我们的图床

### 第三步：安装Picgo软件，配置连接Github图床仓库

1.下载PicGo

首先要说一下，PicGo是一款软件。我们就是用它来实现图片上传的。所以说，它是核心软件。

下载方法也比较简单。这里推荐山东大学的镜像网站（选择对应版本即可）：

[https://mirrors.sdu.edu.cn/github-release/Molunerfinn\_PicGo/v2.3.1/](https://mirrors.sdu.edu.cn/github-release/Molunerfinn_PicGo/v2.3.1/)

2.安装完毕后我们开始连接软件与仓库，打开软件的**图床设置**-**Github图床**进行配置

图床配置名：自己命名即可（例如我写的Blogimg）

仓库名：username/仓库名（创建的Github仓库名）

分支名：你的仓库分支名

Token：创建的Token秘钥

存储路径：仓库内的自定义文件夹（根目录的话就不写）

自定义域名：`https://cdn.jsdelivr.net/gh/ +你的账户名+你的仓库名@你的分支名`（注意最后是@分支名，例如：`https://cdn.jsdelivr.net/gh/jianxiangwudi/MyPic@img`）

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/87.1.png)

3.保存设置后，我们上传图片进行测试。（注意在上传时要选择对应的配置名）支持批量上传。上传成功后的图片就出现在相册中，我们可以直接复制Markdown链接引用，也可以直接复制链接打开了。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/88.png)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/89.png)
