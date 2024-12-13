var posts=["2024/12/11/hello-world/","2024/12/12/测试是否有新文章生成/测试是否有新文章生成/","2024/12/12/这是有关代码分类下的一篇文章/这是有关代码分类下的一篇文章/","2024/12/12/这是一篇关于生活日常分类下的文章/这是一篇关于生活日常分类下的文章/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };