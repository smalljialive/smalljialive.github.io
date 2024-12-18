---
abbrlink: ''
categories: []
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/74.avif
date: '2024-12-18T10:43:42.311704+08:00'
tags: []
title: title
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/74.avif
updated: '2024-12-18T10:43:43.753+08:00'
---
我们在更换电脑以后想要更新自己的个人博客，或者是在公司和家里都想要能管理个人博客时，就需要将本地的个人博客的程序上传至Github中，在不同电脑上获取更改后的配置内容，实现不同设备均可实时更新博客！

### 第一部分：GitHub 操作步骤

在此步骤，请务必检查 `_posts` 文件夹中的所有 `.md` 文件，确保每篇文章的 `date` 字段都是具体的日期（例如：2024-01-01）。如果 `date` 字段未指定具体日期，每次在新电脑上部署时，系统会自动将文章日期更新为部署当天的日期，这将导致所有文章的发布日期被重置！这一点非常重要，请特别留意！如果不是确切日期，请先修改成确切日期，推送后，再执行以下操作！

1. **打开你的Github个人博客仓库，创建一个 新的分支：Hexo（或者你想要起的名称）**

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/73.avif)

2. **将 hexo 分支设置为默认分支**

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/74.avif)

---

### 第二部分：旧电脑上的操作步骤

**步骤一：准备要上传到 GitHub 的文件**

1. 克隆仓库：下载仓库的 hexo 默认分支文件，记得将 `username` 替换为你自己的 GitHub 用户名（这个下载的文件需要重新保存到一个地方，不要与原来的文件混合）：

   ```
   git clone git@github.com:username/username.github.io.git
   ```

   2. 打包文件：进入克隆的文件夹，保留 `.git` 文件夹，（若没有这个文件夹，需要打开隐藏的文件夹：查看-隐藏的项目）删除其他文件。![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/75.png)
   3. 整理文件：打开之前的 个人博客文件夹，将其中 除`.deploy_git` 文件夹外的所有内容复制到克隆的文件夹中。
   4. **设置 .gitignore 文件**：确认克隆文件夹内有 `.gitignore` 文件，它用于忽略一些不需要的文件类型（若没有，需手动创建）。内容如下：

      ```
      .DS_Store
      Thumbs.db
      db.json
      *.log
      node_modules/
      public/
      .deploy*/
      ```
   5. 检查主题文件夹：在克隆的主题文件夹内，删除 `.git` 文件，因为 Git 不能嵌套版本控制。确保显示隐藏文件，避免上传出错，影响配置同步。

**步骤二：将修改后的文件推送到远程仓库**

```
git add .
git commit -m "add_branch"
git push
```

此时，您已将完整的站点推送到远程仓库的 hexo 默认分支。

---

### 第三部分：新电脑上的操作步骤

1. **配置 SSH 密钥**：在新电脑上生成并添加 SSH 密钥到 GitHub 账户上。（还是原来的方式生成密钥添加）
2. **克隆仓库**：创建一个保存博客的文件夹，在文件夹内打开Git bash终端，并执行以下命令（替换 `username` 为你的 GitHub 用户名）：

   ```
   git clone git@github.com:username/username.github.io.git --depth=1
   ```
3. **安装 Hexo 环境**：进入 `username.github.io` 文件夹并运行以下命令：

   ```
   npm install hexo
   npm install
   npm install hexo-deployer-git
   ```

至此，您可以在新电脑上开始编辑和发布文章了。

---

### 第四部分：注意事项

当您在旧电脑和新电脑上交替使用时，注意保持同步：

* 旧电脑：在旧电脑上完成文章更新后，记得运行：

  ```
  git add .
  git commit -m "add_branch"
  git push
  ```

  这样 GitHub 上将拥有最新版本的文件。
* **新电脑**：在新电脑上继续编辑时，先执行以下命令以同步最新文件：

  ```
  git pull
  ```

  检查文件和预览是否是最新版本，确认无误后继续撰写。
* **如果有问题，按照“第二部分”的操作重新进行同步。**

> **注意**：如果一台电脑长时间未使用，可能会导致同步失效，建议按照“第二部分”的步骤重新操作。

---

### 第五部分：常用指令列表

以下指令在操作过程中会频繁使用

```
hexo cl; hexo s

hexo cl; hexo g; hexo d

git clone git@github.com:username/username.github.io.git

git add .
git commit -m "add_branch"
git push

git clone git@github.com:username/username.github.io.git --depth=1

npm install hexo
npm install
npm install hexo-deployer-git
```

## 谨记：无论在哪台设备更新文章后，都要记得推送到Github上，然后在下一次更新前，先从Github仓库拉取最新的文章！
