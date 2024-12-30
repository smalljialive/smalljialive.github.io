---
abbrlink: ''
categories:
- - WordPress
- - 代码细节
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20241230140952.png
date: '2024-12-30T13:55:51.904032+08:00'
tags:
- WordPress
- 网站建设
title: title
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20241230140952.png
updated: '2024-12-30T13:56:01.284+08:00'
---
### Wordpress留言表单Contact Form7插件

使用WordPress的留言表单时，为了方便追踪有效询盘转化，我们需要统计有多少客户在我们的网站上达成了转化，通常是采用两种方式。

1.通过WordPress自带的Dom事件函数

* \*\*`wpcf7invalid`\*\*— 当 Ajax 表单提交成功完成，但由于存在无效输入的字段而未发送邮件时触发。
* \*\*`wpcf7spam`\*\*— 当 Ajax 表单提交成功完成，但由于检测到可能是垃圾邮件活动而未发送邮件时触发。
* \*\*`wpcf7mailsent`\*\*— 当 Ajax 表单提交成功完成并发送邮件时触发。
* \*\*`wpcf7mailfailed`\*\*— 当 Ajax 表单提交成功完成但发送邮件失败时触发。
* \*\*`wpcf7submit`\*\*— 当 Ajax 表单提交成功完成时触发，与其他事件无关。

我们可以通过上述函数追踪到表单提交成功后的时间。想要了解具体如何追踪，可查看另一篇文章：

[《Google Tag Manager 追踪Contact form7》](https://smalljialive.github.io/2024/07/29/google-tag-manager%E8%B7%9F%E8%B8%AAcontact-form-7%E6%88%90%E5%8A%9F%E6%8F%90%E4%BA%A4%E5%B9%B6%E9%80%9A%E8%BF%87ga4%E8%AE%B0%E5%BD%95%E4%BD%9C%E4%B8%BAads%E8%BD%AC%E5%8C%96/)

2.通过自定义一个感谢页面（Thank you.html）

可以通过创建一个感谢页面在用户提交表单后跳转至这个页面，然后统计这个页面出现的次数，便可以统计到有多少用户发送了询盘表单。

### 表单提交后跳转至感谢页面-插件方式

在使用WordPress的contact form7表单时，我们可以通过插件的方式，实现表单提交成功后跳转至特定页面。

首先，确保您的网站后台安装了Contact Form 7插件。随后，安装并启用“Redirection for Contact Form 7”插件。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20241230140756.png)

打开后台联系表单，点击编辑，找到名为“Actions”的选项框，添加“重定向（redirect）”操作。配置重定向设置并保存。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20241230140952.png)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20241230141008.png)

### 表单提交后跳转至感谢页面-代码方式

我们也可以使用简单的代码来实现跳转的功能。

在我们的表单代码中添加以下代码即可（location表示我们想要跳转的页面地址）：

```
<script>
   document.addEventListener('wpcf7mailsent',function(event){
         location='/thank-you/';
   }, false );
</script>
```


<script>
   document.addEventListener('wpcf7mailsent',function(event){
         location='/thank-you/';
   }, false );
</script>

**以上两种方式均可实现提交表单后跳转感谢页面。具体的感谢页面需要自己制作。**
