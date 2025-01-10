---
abbrlink: ''
categories:
- - 运营知识
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250110094215.png
date: '2025-01-10T09:30:21.698536+08:00'
tags:
- 新媒体运营
- WPS
title: WPS如何批量导出批注
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250110094215.png
updated: '2025-01-10T09:30:23.927+08:00'
---
### 如何将WPS表格内的批注批量保存

在数据统计过程中，我们会使用到批注功能，但是经过长时间的数据积累后，批注就跟着多起来，不方便我们快速检索或者分析数据。这个时候就需要将批注批量保存至另一行或列中。

**如下图所示，我们需要将批注导入到其他的行内**

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/0.jfif%40base%40tag%3DimgScale%26w%3D776)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/1.jfif%40base%40tag%3DimgScale%26w%3D776)

### 我们可以通过WPS的内置函数来实现该功能

**实际操作过程:**

首先需要将文件另存为可启用宏的工作表（不然后续无法启动宏编辑器）

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250110093941.png)

之后按ALT+F11打开WPS宏编辑器，复制下方代码粘贴到编辑器中（采用函数来实现调用批注）

```
function GetCmt(rg) //自定义函数，参数为单元格对象

{
   return rg.Comment.Text(); //将单元格批注返回给函数
}
```

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250110094215.png)

通过以上操作，我们已经成功启动调用批注的函数，接下来在需要导出批注的地方进行函数使用即可`=GetCmt()`

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/2.jfif%40base%40tag%3DimgScale%26w%3D776)
