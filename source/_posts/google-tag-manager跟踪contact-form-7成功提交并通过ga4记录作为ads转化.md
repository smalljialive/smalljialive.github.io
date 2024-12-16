---
abbrlink: ''
categories:
- - 运营知识
- - 谷歌运营
comments: false
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/40.png
date: '2024-07-29T16:01:55+08:00'
id: 373
tags:
- 谷歌Ads
- 谷歌运营
title: Google Tag Manager跟踪Contact Form 7成功提交并通过GA4记录作为Ads转化
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/40.png
updated: '2024-12-16T15:12:59.442+08:00'
---
本文将介绍如何使用GTM（Google Tag Manager）来跟踪WordPress联系表单插件Contact Form 7成功提交数据，并使用GA4（Google Analytics分析 4）记录作为Google Ads的转化指标。 因为官方宣布Universal Analytics将在23年7月1日后不再处理标准媒体资源中的新数据，请立即着手准备，设置并迁移到 Google Analytics（分析）4 媒体资源。 在教程中我们将通过自定义代码来获取数据层信息，然后调取变量通过GA4记录，将记录作为转化导入到Ads中作为转化指标来查看。 内容目录：

* Contact Form 7表单数据获取
* 变量和触发器设置
* GA4事件代码设置
* Google Ads转化导入

## 1、Contact Form 7表单数据获取

在WordPress网站提交C7表单成功后，不会有thank you页面反馈，会显示类似“Thank you for your message. It has been sent.（插件中可自定义）”表示信息发送成功； 插件官方也给了DOM事件的相关参数：

**Contact Form 7 自定义 DOM 事件**

* **`wpcf7invalid`**— 当 Ajax 表单提交成功完成，但由于存在无效输入的字段而未发送邮件时触发。
* **`wpcf7spam`**— 当 Ajax 表单提交成功完成，但由于检测到可能是垃圾邮件活动而未发送邮件时触发。
* **`wpcf7mailsent`**— 当 Ajax 表单提交成功完成并发送邮件时触发。
* **`wpcf7mailfailed`**— 当 Ajax 表单提交成功完成但发送邮件失败时触发。
* **`wpcf7submit`**— 当 Ajax 表单提交成功完成时触发，与其他事件无关。

我们只获取**wpcf7mailsent**发送成功的数据，通过自定义代码来跟踪监听； 在GTM中新建代码并设置在所有网页触发：

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/40.png)

```
<script>
document.addEventListener( 'wpcf7mailsent', function( event ) {
 window.dataLayer.push({
 "event" : "form submit success",
 "formId" : event.detail.contactFormId,
 "response" : event.detail.inputs
 })
}); 
</script>

<script>
document.addEventListener( 'wpcf7mailsent', function( event ) {
 window.dataLayer.push({
 "event" : "form submit success",
 "formId" : event.detail.contactFormId,
 "response" : event.detail.inputs
 })
}); 
</script>


```

## 2、变量和触发器设置

搭建1个触发器和2个变量 搭建一个名为“custom - form submit success”的触发器，事件名称设置为“form submit success”，因为我们在上一步获取C7数据的自定义代码里设置的名称为这个。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/41.png)

搭建2个名为 “div - formID” 和 “div - Form Subject” 的变量，数据层变量名设置为 “formId” 和 “response.3.value” ，目的是为了提取表单ID和表单第4行的内容。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/42.png)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/43.png)

## 3、GA4事件代码设置

在代码中搭建一个名为 “GA4 - CF7 Success” 的GA4事件； 如果没有[配置GA4代码](https://aikenote.com/kuajing/3891.html)，需要先配置，事件名称可以自定义自己喜欢的，我们这里命名为 “form submit success” ；

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/44.png)

新建2个名为 “form\_id” 和 “form\_subject” 的事件参数，值选择我们刚才建的两个变量；

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/45.png)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/46.png)

触发条件选择刚才创建的 “custom - form submit success” 触发器；

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/47.png)

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/48.png)

保存后在右上角预览（gtm\_debug）模式下提交一个表单看下设置是否生效； 生效左边会显示 “form submit success” 操作，变量也都会显示；

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/49.png)

可以在数据层看到事件各项参数，这边也可以理解为什么 “div - Form Subject” 变量的数据层名称设置为 “response.3.value” ，获取的是表单第4行的内容，或者使用[Datalayer Checker插件](https://aikenote.com/web/3992.html)查看更加直观；

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/50.png)


![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/51.png)

以上测试成功后，在右上角“提交-发布”，发布后再次回到GTM里点击“预览”； 并打开谷歌分析GA4，左边 “配置”，到 “DebugView” 里； 在预览模式下打开网站，提交一个表单，时间戳中会看到 “form submit success” 这个事件操作；

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/52.png)

这个时候需要等，预计24小时之内，GA4事件中会出现 “form submit success”，将其标记为“转化”；

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/53.png)

 

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/54.png)

或者，添加在“自定义定义”中创建“自定义维度”，然后在“转化”中“新建转化事件”（这个后面有时间会专门讲）。

## 4、Google Ads转化导入

进入Ads后台，在目标-转化次数-摘要中”中新建转化，选择”导入“，选择“GA4-网站”，勾选我们的转化事件导入并继续即可。 在这个操作之前要先将GA4和Ads关联；

最后，可以在广告系列中将该转化设置为目标或者在广告列中调出数据来看。
