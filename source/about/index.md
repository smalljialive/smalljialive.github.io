---
title: 关于本人
date: 2021-03-30 15:57:51
aside: false
top_img: false
background: "#f8f9fe"
comments: false
type: "about"
---

<div class="smalljia-about-extra">
  <div class="smalljia-extra-heading">
    <div class="smalljia-extra-kicker">关于 SmallJia 的另一面</div>
    <div class="smalljia-extra-title">一些不太像简历的自我介绍</div>
    <div class="smalljia-extra-desc">网站会更新，人也会。这里记录一些此刻的状态、偏好和相信的事情。</div>
  </div>

  <div class="smalljia-personality-grid">
    <section class="smalljia-personality-card version-card">
      <div class="smalljia-card-emoji">🧬</div>
      <div class="smalljia-card-tips">当前人生版本</div>
      <div class="smalljia-card-title">SmallJia · 2026</div>
      <div class="smalljia-card-text">持续更新中。没有正式版，也没有最终版本。</div>
      <div class="smalljia-version-bar"><span></span></div>
      <div class="smalljia-version-note">探索度：仍有很长的地图没有点亮</div>
    </section>

    <section class="smalljia-personality-card status-card">
      <div class="smalljia-card-emoji">📡</div>
      <div class="smalljia-card-tips">当前状态</div>
      <div class="smalljia-card-title">正在生活，也正在折腾</div>
      <div class="smalljia-status-list">
        <span><b>工作</b> Google 优化</span>
        <span><b>技能树</b> AI / Coding / 自动化</span>
        <span><b>充电方式</b> 音乐 / 3A / 出门走走</span>
      </div>
    </section>

    <section class="smalljia-personality-card belief-card">
      <div class="smalljia-card-emoji">🌱</div>
      <div class="smalljia-card-tips">我相信的事情</div>
      <div class="smalljia-card-quote">“安静向上，不争不抢。”</div>
      <div class="smalljia-card-text">允许自己慢一点，把复杂的事情一点点做简单，把想留下的东西认真记录下来。</div>
    </section>

    <section class="smalljia-personality-card likes-card">
      <div class="smalljia-card-emoji">❤️</div>
      <div class="smalljia-card-tips">我喜欢</div>
      <div class="smalljia-tag-cloud">
        <span>🐈 猫</span>
        <span>🧳 旅行</span>
        <span>🎮 3A 游戏</span>
        <span>💻 数码科技</span>
        <span>🎧 音乐</span>
        <span>🛠️ 折腾网站</span>
      </div>
    </section>

    <section class="smalljia-personality-card dislikes-card">
      <div class="smalljia-card-emoji">🫥</div>
      <div class="smalljia-card-tips">我不太喜欢</div>
      <div class="smalljia-tag-cloud muted">
        <span>无意义的内耗</span>
        <span>过度喧闹</span>
        <span>重复而没有变化</span>
        <span>为了比较而比较</span>
      </div>
    </section>

    <section class="smalljia-personality-card timeline-card">
      <div class="smalljia-card-emoji">🛤️</div>
      <div class="smalljia-card-tips">人生足迹</div>
      <div class="smalljia-life-timeline">
        <div><b>1997</b><span>故事开始</span></div>
        <div><b>现在</b><span>工作、生活、折腾、记录</span></div>
        <div><b>以后</b><span>继续去没去过的地方，做没做过的事</span></div>
      </div>
    </section>
  </div>
</div>

<style>
#about-page .create-site-post {
  padding: 1.25rem !important;
}
#about-page .smalljia-about-extra {
  width: 100%;
}
#about-page .smalljia-extra-heading {
  padding: .5rem .5rem 1.2rem;
}
#about-page .smalljia-extra-kicker,
#about-page .smalljia-card-tips {
  color: var(--anzhiyu-secondtext);
  font-size: 12px;
  line-height: 1.3;
}
#about-page .smalljia-extra-title {
  color: var(--anzhiyu-fontcolor);
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 800;
  line-height: 1.15;
  margin: .35rem 0 .55rem;
}
#about-page .smalljia-extra-desc {
  color: var(--anzhiyu-secondtext);
  font-size: 14px;
  line-height: 1.7;
}
#about-page .smalljia-personality-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
#about-page .smalljia-personality-card {
  position: relative;
  min-width: 0;
  min-height: 190px;
  padding: 1.25rem;
  border-radius: 20px;
  border: var(--style-border-always);
  background: var(--anzhiyu-secondbg);
  overflow: hidden;
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
}
#about-page .smalljia-personality-card:hover {
  transform: translateY(-3px);
  border-color: var(--anzhiyu-main);
  box-shadow: var(--anzhiyu-shadow-border);
}
#about-page .smalljia-card-emoji {
  position: absolute;
  right: 1rem;
  top: .85rem;
  font-size: 30px;
  opacity: .92;
  transform: rotate(4deg);
}
#about-page .smalljia-card-title,
#about-page .smalljia-card-quote {
  max-width: calc(100% - 42px);
  color: var(--anzhiyu-fontcolor);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.25;
  margin: .5rem 0 .75rem;
}
#about-page .smalljia-card-text,
#about-page .smalljia-version-note {
  color: var(--anzhiyu-secondtext);
  font-size: 13px;
  line-height: 1.7;
}
#about-page .smalljia-version-bar {
  height: 8px;
  margin: 1rem 0 .55rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--anzhiyu-card-bg);
}
#about-page .smalljia-version-bar span {
  display: block;
  width: 63%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--anzhiyu-main), #49b1f5);
}
#about-page .smalljia-status-list {
  display: flex;
  flex-direction: column;
  gap: .55rem;
}
#about-page .smalljia-status-list span {
  display: flex;
  gap: .55rem;
  align-items: center;
  padding: .55rem .65rem;
  border-radius: 12px;
  background: var(--anzhiyu-card-bg);
  color: var(--anzhiyu-fontcolor);
  font-size: 13px;
}
#about-page .smalljia-status-list b {
  min-width: 58px;
  color: var(--anzhiyu-main);
}
#about-page .smalljia-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: .55rem;
  margin-top: .9rem;
}
#about-page .smalljia-tag-cloud span {
  display: inline-flex;
  align-items: center;
  padding: .45rem .7rem;
  border-radius: 999px;
  background: var(--anzhiyu-card-bg);
  color: var(--anzhiyu-fontcolor);
  font-size: 13px;
  font-weight: 700;
}
#about-page .smalljia-tag-cloud.muted span {
  color: var(--anzhiyu-secondtext);
  font-weight: 600;
}
#about-page .smalljia-life-timeline {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  margin-top: .85rem;
}
#about-page .smalljia-life-timeline div {
  display: grid;
  grid-template-columns: 62px 1fr;
  gap: .7rem;
  align-items: center;
  position: relative;
}
#about-page .smalljia-life-timeline b {
  color: var(--anzhiyu-main);
  font-size: 14px;
}
#about-page .smalljia-life-timeline span {
  color: var(--anzhiyu-fontcolor);
  font-size: 13px;
}
@media screen and (max-width: 768px) {
  #about-page .create-site-post {
    padding: 1rem !important;
  }
  #about-page .smalljia-personality-grid {
    grid-template-columns: 1fr;
  }
  #about-page .smalljia-personality-card {
    min-height: auto;
  }
  #about-page .smalljia-card-title,
  #about-page .smalljia-card-quote {
    font-size: 21px;
  }
}
</style>
