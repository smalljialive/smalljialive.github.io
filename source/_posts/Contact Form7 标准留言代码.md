---
abbrlink: ''
categories:
- - wordPress
- - 代码细节
cover: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250409170944.png
date: '2025-04-09T17:17:51.935552+08:00'
tags:
- WordPress
- 网站建设
title: Contact Form7 标准留言代码
top_img: https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250409170944.png
updated: '2025-04-09T17:17:52.817+08:00'
---
主包在做网站的时候，对留言表单花费了N久的时间进行调整，最终成功将表单的基本功能与样式确定完毕。

![](https://cdn.jsdelivr.net/gh/smalljialive/Blogimg@main/img/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20250409170944.png)

1.首先是标准的写入代码

```
<div style="text-align:left;">
    <p class="allwidth">Name*:
        [text* your-name placeholder"Your Name:"]
    </p>
    <p class="allwidth">Phone/Whatsapp*:
        [tel* your-whatsapp placeholder"Phone/Whatsapp:"]
    </p>
    <p class="allwidth">Email*:
        [email* your-email placeholder"Your Email:"]
    </p>
    <p class="allwidth">Message*:
        [textarea* your-message x4 size:40 placeholder"Leave your requirements and we will provide you with a quote" ]
    </p>
    <p class="allsubmit" style="width:100%;">[submit "Send A Message"]
    </p>
</div>
<style>
   .allwidth{
      margin-bottom:0.75em;
   }
   .allsubmit{
      text-align:center;  
   }
   .allsubmit input{
      width:100%;
      font-size: 15px;
      font-weight: 500;  
   }
   input:focus::placeholder {
      visibility: hidden;
  }
<style>
<script>
   document.addEventListener('wpcf7mailsent',function(event){
         location='/thank-you/';
   }, false );
</script>
```

2.其次是发送邮件的相关代码

```
客户留言信息
时间：[_date] [_time]

客户名称：[your-name]

联系方式：[your-whatsapp]

邮箱地址：[your-email]

消息正文：[your-message]

客户地址：[_remote_ip]
Ip地址显示国家：[_remote_ip_area]
-- 
查看产品：[_url]
This is a notification that a contact form was submitted on your website
```

3.然后是需要写入主题函数文件内（function）的调用IP地址显示国家的代码

```
//自定义增加邮件标签 增加IP所在地 标签
function wpcf7_special_mail_tag_new_add_ip_to_address( $output, $name, $html, $mail_tag = null ) {
if ( ! $mail_tag instanceof WPCF7_MailTag ) {
wpcf7_doing_it_wrong(
sprintf( '%s()', __FUNCTION__ ),
__( 'The fourth parameter ($mail_tag) must be an instance of the WPCF7_MailTag class.', 'contact-form-7' ),
'5.2.2'
);
}
$name = preg_replace( '/^wpcf7\./', '_', $name ); // for back-compat
$submission = WPCF7_Submission::get_instance();
if ( ! $submission ) {
return $output;
} if ( '_remote_ip_area' == $name ) {
if ( $remote_ip = $submission->get_meta( 'remote_ip' ) ) {
return file_get_contents("http://ip.globalso.com/?ip=".$remote_ip);
} else {
return '未知';
}
}
return $output;
}
add_filter( 'wpcf7_special_mail_tags', 'wpcf7_special_mail_tag_new_add_ip_to_address', 11, 4 );
```
