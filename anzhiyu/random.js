var posts=["2024/06/14/2024年五分钟注册美区appleid，手把手教，稳定且耐用！/","2024/12/26/2024总结随笔/","2025/01/10/WPS如何批量导出批注/","2024/09/06/WordPress网站使用虚拟主机，smtp发信报错/","2024/12/30/Wordpress留言后跳转到感谢Thank You页面的方法/","2025/01/10/Wordpress网站好用的插件推荐/","2024/06/15/adobe-photoshop-2023-滤镜插件合集百度云免vip高速下载/","2024/06/15/clash软件mac系统教程/","2024/06/15/clash软件windows系统教程/","2024/06/15/clash软件安卓手机使用教程/","2024/11/12/contact-form-7增加用户ip获取地址/","2024/09/10/generatepress主题删除评论框/","2024/09/12/generatepress主题动态调用数据时，无法显示自定义的字段/","2024/07/29/google-tag-manager跟踪contact-form-7成功提交并通过ga4记录作为ads转化/","2024/07/30/nginx虚拟主机伪静态配置/","2024/10/09/phpstudy-pro小皮面板本地环境配置伪静态/","2024/06/15/shadowrocket小火箭ios手机教程/","2024/06/15/v2ray搭建详细教程/","2024/06/15/windows11系统开启机场闪退解决方案/","2024/08/30/wordpress个人博客类主题推荐/","2024/06/30/wordpress文章内页显示同一分类的上下文章/","2024/11/28/wordpress创建子主题方法/","2024/09/30/wordpress的generatepress主题取消默认分页，替换为插件wp-pagenavi的样式/","2024/07/29/wordpress网站安装ssl证书/","2024/06/15/wordpress页面滚动时固定某一部件/","2024/06/15/x-ui服务器面板搭建教程/","2024/06/15/一键搭建tiktok节点/","2024/12/18/不同电脑管理个人博客与使用Vercel管理个人博客/","2024/12/17/使用Github+Hexo+Anzhiyu快速搭建个人博客/","2024/12/18/使用Github制作个人图床/","2024/06/14/全国古玩市场大全/","2024/06/15/各累vps服务器搭建脚本-勇哥/","2024/10/30/多种方式增加wordpress后台的产品功能/","2024/06/14/有哪些免费的ae模板网站？/","2024/06/14/有哪些比较适合做宣传片背景音乐？/","2024/09/19/网站上传robot-txt文件/","2024/06/17/西藏旅游小知识/","2024/09/09/谷歌外链平台大区/","2024/06/14/谷歌趋势关键词热度查询/","2024/06/14/阿里国际站运营课程/","2024/06/14/阿里巴巴国际站直播教程/","2024/06/14/阿里邮件无法发信，验证配置记录/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };