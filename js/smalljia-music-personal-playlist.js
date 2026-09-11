(function () {
  "use strict";

  if (window.__smallJiaPersonalPlaylistLoaded) return;
  window.__smallJiaPersonalPlaylistLoaded = true;

  const DIRECT_API = "https://music-api.gdstudio.xyz/api.php";
  const PROXY_API = "https://smalljia-music-proxy-small-jias-projects.vercel.app/api/music";
  const SOURCES = ["netease", "kuwo"];
  const FALLBACK_COVER = "/img/music-placeholder.svg";
  const CACHE_KEY = "smalljia_music_personal_catalog_matches_v1";
  const CATALOG = [{"name":"盛夏的告别","artist":"袁娅维TIA RAY","album":"我的人间烟火 电视剧原声带"},{"name":"百年孤寂","artist":"王菲","album":"只爱陌生人"},{"name":"雨下一整晚","artist":"周杰伦","album":"跨时代"},{"name":"偷凉记（女声版）（翻自 折光组）","artist":"茉莉 & 柒墨 & 夏衍劫 & 冉茼","album":"偷凉记"},{"name":"有莲","artist":"黄诗扶 & 辰小弦 & Winky诗 & 司夏","album":"俱往矣"},{"name":"杨花落尽子规啼","artist":"祝青 & 黄诗扶 & 国风堂","album":"杨花落尽子规啼"},{"name":"玫瑰窃贼","artist":"柳爽","album":"Rose"},{"name":"没有理想的人不伤心","artist":"新裤子","album":"生命因你而火热"},{"name":"谁 (Live)","artist":"廖俊涛","album":"明日之子 第2期"},{"name":"被驯服的象","artist":"蔡健雅","album":"天使与魔鬼的对话"},{"name":"归期","artist":"钱润玉Runyu","album":"凡人修仙传 第二季 动画原声带"},{"name":"若 (Live)","artist":"钱润玉Runyu & 李昂星","album":"我的音乐你听吗 (第7期 Live)"},{"name":"爱的回归线","artist":"陈韵若 & 陈每文","album":"爱情公寓3 电视剧原声带"},{"name":"雨爱","artist":"杨丞琳","album":"雨爱"},{"name":"给我一个理由忘记","artist":"A-Lin","album":"寂寞不痛"},{"name":"失恋无罪","artist":"A-Lin","album":"失恋无罪"},{"name":"起风了 (旧版)","artist":"买辣椒也用券","album":"起风了 (旧版)"},{"name":"红色高跟鞋","artist":"蔡健雅","album":"若你碰到他"},{"name":"你就不要想起我","artist":"田馥甄","album":"渺小"},{"name":"游走","artist":"RAiNBOW计划 & 雷雨心","album":"橙"},{"name":"空房子","artist":"张郁梓","album":"空房子"},{"name":"寻你三千遍 (Demo)","artist":"唐菲","album":"寻你三千遍"},{"name":"达尔文","artist":"林俊杰","album":"JJ的咖啡调调, Vol. 2"},{"name":"有谱 (Live)","artist":"李昂星","album":"我的音乐你听吗 (第5期 Live)"},{"name":"Right Here Waiting","artist":"Richard Marx","album":"Billboard Top Hits 1989"},{"name":"想自由","artist":"林宥嘉","album":"美妙生活"},{"name":"After 17","artist":"陈绮贞","album":"After 17"},{"name":"苏公堤","artist":"杨一歌","album":"苏公堤"},{"name":"阳光下的星星","artist":"金海心","album":"金海心精选歌曲"},{"name":"九零后日记 (Live)","artist":"小海","album":"2021南方巡演现场"},{"name":"若梦","artist":"周深","album":"若梦"},{"name":"Fallin' Out","artist":"Keyshia Cole","album":"Just Like You (Explicit)"},{"name":"孤雏 (Live)","artist":"李佳薇","album":"声生不息·华流季 第7期"},{"name":"寂寞先生","artist":"曹格","album":"超级4th场"},{"name":"关于我在地铁上莫名其妙干了碗鸡汤这件事儿","artist":"孙天宇","album":"关于我在地铁上莫名其妙干了碗鸡汤这件事儿"},{"name":"平庸 (Live)","artist":"薛之谦","album":"音乐缘计划2 第3期"},{"name":"壁上观","artist":"一棵小葱 & 张曦匀","album":"壁上观"},{"name":"你在，不在","artist":"郭采洁","album":"爱异想"},{"name":"银河爱情故事","artist":"刘 洋","album":"银河爱情故事"},{"name":"种果无果","artist":"乌野学长","album":"种果无果"},{"name":"缸","artist":"草东没有派对","album":"瓦合"},{"name":"小棋童","artist":"双笙 (陈元汐)","album":"翻唱歌曲合集"},{"name":"小城夏天","artist":"LBI利比（时柏尘）","album":"小城夏天"},{"name":"多愁善感蒙太奇","artist":"灼海豚乐队","album":"多愁善感蒙太奇"},{"name":"非理想爱人","artist":"Pandora樂隊","album":"Ain't Stopping"},{"name":"迷雾阵地","artist":"耳朵便利店","album":"迷雾阵地"},{"name":"阿楚姑娘","artist":"袁娅维TIA RAY","album":"阿楚姑娘"},{"name":"埋藏了夏天","artist":"高旭","album":"埋藏了夏天"},{"name":"马文才","artist":"阿YueYue & 戾格 & 小田音乐社","album":"马文才"},{"name":"一个人跳舞 (Live|典藏)","artist":"单依纯","album":"歌手2025 第6期"},{"name":"由我","artist":"蔡依林","album":"Lucky Number"},{"name":"老戏台","artist":"予你诗话 & 醉雪","album":"老戏台"},{"name":"告一段落","artist":"白宇","album":"告一段落"},{"name":"世末歌者","artist":"封茗囧菌 & 双笙 (陈元汐)","album":"翻唱歌曲合集"},{"name":"天若有情","artist":"A-Lin","album":"天若有情"},{"name":"同手同脚","artist":"井胧 & 井迪儿","album":"同手同脚"},{"name":"连名带姓 (Live)","artist":"黄霄雲","album":"歌手·当打之年 第5期"},{"name":"黑夜问白天","artist":"林俊杰","album":"黑夜问白天"},{"name":"路过人间","artist":"郁可唯","album":"路过人间"},{"name":"同进退","artist":"倪浩毅","album":"同进退"},{"name":"我怀念的","artist":"孙燕姿","album":"逆光"},{"name":"千年","artist":"金志文 & 吉克隽逸","album":"天乩之白蛇传说 影视原声带"},{"name":"彩虹","artist":"周杰伦","album":"我很忙"},{"name":"若把你","artist":"Kirstyy瑾","album":"若把你"},{"name":"如果我们不曾相遇","artist":"五月天","album":"自传"},{"name":"倔强","artist":"五月天","album":"神的孩子都在跳舞"},{"name":"突然好想你","artist":"五月天","album":"后青春期的诗"},{"name":"玫瑰少年","artist":"五月天","album":"玫瑰少年"},{"name":"撒野","artist":"凯瑟喵","album":"撒野"},{"name":"眼泪成诗 (Live)","artist":"周深 & 陈卓璇","album":"青春环游记第二季 原声碟"},{"name":"一直很安静","artist":"阿桑","album":"寂寞在唱歌"},{"name":"阿拉斯加海湾","artist":"蓝心羽","album":"阿拉斯加海湾"},{"name":"反方向的钟","artist":"周杰伦","album":"Jay"},{"name":"如果我们不曾相遇","artist":"五月天","album":"自传"},{"name":"该死的温柔","artist":"马天宇","album":"自言自宇"},{"name":"晴天","artist":"周杰伦","album":"叶惠美"},{"name":"搁浅","artist":"周杰伦","album":"七里香"},{"name":"烟火里的尘埃","artist":"黄霄雲","album":"烟火里的尘埃 (原唱: 华晨宇)"},{"name":"你就不要想起我 (Live)","artist":"陈乐一 & 陆珂豪","album":"一起乐队吧 第9期"},{"name":"曾经我也想过一了百了 (Live)","artist":"陈乐一 & 陆珂豪 & 小伍 & 阿圣 & 马万万","album":"一起乐队吧 第9期"},{"name":"蜜蜂","artist":"王贰浪","album":"蜜蜂"},{"name":"夏夜晚风","artist":"伍佰 & China Blue","album":"爱情的尽头"},{"name":"空空（Live） (我是唱作人2第2期Live)","artist":"陈粒","album":"空空（Live） (我是唱作人2第2期Live)"},{"name":"兜圈","artist":"林宥嘉","album":"必娶女人 电视原声带"},{"name":"房间","artist":"刘瑞琦","album":"私房歌"},{"name":"心似烟火","artist":"陈壹千","album":"心似烟火"},{"name":"安和桥","artist":"宋冬野","album":"安和桥北"},{"name":"若把你","artist":"Kirsty刘瑾睿","album":"若把你"},{"name":"壁上观","artist":"鞠婧祎","album":"壁上观"},{"name":"早晚","artist":"艾怡良","album":"偏偏我却都记得"},{"name":"听说你 (Live)","artist":"杨宗纬 & 于文文","album":"天赐的声音第五季 第4期"},{"name":"占有 (Live)","artist":"周深 & 薛之谦","album":"音乐缘计划2 年度盛典"},{"name":"怜悯 (Live)","artist":"周深","album":"音乐缘计划2 第7期"},{"name":"租购 (Live)","artist":"薛之谦","album":"音乐缘计划 第4期"},{"name":"耿","artist":"汪苏泷","album":"耿"},{"name":"义妹","artist":"元老魔的世界","album":"爱上厉飞雨"},{"name":"情歌 (Live)","artist":"田馥甄","album":"Love! To Hebe 影音馆Live"}];

  const readCache = () => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch (_) { return {}; }
  };

  const writeCache = cache => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (_) {}
  };

  const normalize = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const baseTitle = value => normalize(String(value || "")
    .replace(/\((?:live|demo|旧版|remix|典藏)[^)]*\)/ig, "")
    .replace(/（(?:live|demo|旧版|remix|典藏)[^）]*）/ig, ""));

  const artistText = value => {
    if (Array.isArray(value)) return value.map(item => typeof item === "string" ? item : item?.name || "").filter(Boolean).join(" / ");
    if (value && typeof value === "object") return value.name || value.artist || "";
    return String(value || "");
  };

  const buildUrl = (base, params) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    return url.toString();
  };

  const request = async (base, params) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(buildUrl(base, params), {
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json, text/plain, */*" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      try { return JSON.parse(text); } catch (_) { return text; }
    } finally {
      clearTimeout(timer);
    }
  };

  const requestSearch = async (source, keyword) => {
    const params = { types: "search", source, name: keyword, count: 15, pages: 1 };
    try { return await request(DIRECT_API, params); }
    catch (_) { return await request(PROXY_API, params); }
  };

  const listFromPayload = payload => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
  };

  const candidateFromRaw = (raw, source, target) => {
    const id = String(raw.id || raw.url_id || raw.urlId || "");
    if (!id) return null;
    const artist = artistText(raw.artist || raw.artists || raw.author || raw.singer);
    const albumValue = raw.album;
    const album = typeof albumValue === "string" ? albumValue : albumValue?.name || raw.albumName || target.album || "";
    const pic = raw.pic || raw.cover || raw.picUrl || raw.albumPic || "";
    return {
      id,
      server: source,
      source,
      name: raw.name || raw.title || target.name,
      artist: artist || target.artist,
      album,
      cover: typeof pic === "string" && /^https?:\/\//i.test(pic) ? pic.replace(/^http:\/\//i, "https://") : "",
      url: "",
      lrc: "",
      key: target.key,
      __smallJiaCatalog: target.__smallJiaCatalog,
      __gdStudio: {
        source,
        urlId: String(raw.url_id || raw.urlId || id),
        lyricId: String(raw.lyric_id || raw.lyricId || id),
        picId: String(raw.pic_id || raw.picId || id),
      },
    };
  };

  const score = (raw, target) => {
    const wantedTitle = normalize(target.name);
    const gotTitle = normalize(raw.name || raw.title || "");
    const wantedBase = baseTitle(target.name);
    const gotBase = baseTitle(raw.name || raw.title || "");
    const wantedArtist = normalize(target.artist);
    const gotArtist = normalize(artistText(raw.artist || raw.artists || raw.author || raw.singer));
    const wantedAlbum = normalize(target.album);
    const gotAlbum = normalize(typeof raw.album === "string" ? raw.album : raw.album?.name || raw.albumName || "");

    let value = 0;
    if (gotTitle === wantedTitle) value += 120;
    else if (wantedTitle && (gotTitle.includes(wantedTitle) || wantedTitle.includes(gotTitle))) value += 72;
    if (gotBase && wantedBase && gotBase === wantedBase) value += 42;

    if (wantedArtist && gotArtist) {
      if (gotArtist === wantedArtist) value += 70;
      else {
        const artistParts = target.artist.split(/\s*(?:&|\/|、|,|，|和)\s*/).map(normalize).filter(Boolean);
        const hits = artistParts.filter(part => gotArtist.includes(part)).length;
        value += hits * 20;
        if (hits && hits === artistParts.length) value += 15;
      }
    }

    if (wantedAlbum && gotAlbum && (gotAlbum === wantedAlbum || gotAlbum.includes(wantedAlbum) || wantedAlbum.includes(gotAlbum))) value += 18;

    const targetVersion = /live|demo|旧版|女声版|典藏/i.test(target.name);
    const candidateVersion = /live|demo|旧版|女声版|remix|dj|伴奏/i.test(raw.name || raw.title || "");
    if (targetVersion && !candidateVersion) value -= 20;
    if (!targetVersion && candidateVersion) value -= 24;

    return value;
  };

  const resolveCatalogMatch = async track => {
    if (track.id) return track;

    const cache = readCache();
    const cached = cache[track.key];
    if (cached?.id && cached?.server) {
      return {
        ...track,
        ...cached,
        key: track.key,
        __smallJiaCatalog: track.__smallJiaCatalog,
        __gdStudio: cached.__gdStudio || {
          source: cached.server,
          urlId: cached.id,
          lyricId: cached.id,
          picId: cached.id,
        },
      };
    }

    const keyword = `${track.name} ${track.artist}`;
    const all = [];
    for (const source of SOURCES) {
      try {
        const payload = await requestSearch(source, keyword);
        listFromPayload(payload).forEach(raw => all.push({ raw, source, score: score(raw, track) }));
        if (all.some(item => item.source === source && item.score >= 150)) break;
      } catch (error) {
        console.warn(`SmallJia Music: catalog search failed for ${source}`, error);
      }
    }

    all.sort((a, b) => b.score - a.score);
    const best = all[0];
    if (!best || best.score < 55) return null;

    const matched = candidateFromRaw(best.raw, best.source, track);
    if (!matched) return null;

    cache[track.key] = {
      id: matched.id,
      server: matched.server,
      source: matched.source,
      name: matched.name,
      artist: matched.artist,
      album: matched.album,
      cover: matched.cover,
      __gdStudio: matched.__gdStudio,
    };
    writeCache(cache);
    return matched;
  };

  const makeCatalogTrack = (song, index) => {
    const key = `personal:${index + 1}:${normalize(song.name)}:${normalize(song.artist)}`;
    return {
      id: "",
      server: "netease",
      source: "personal",
      name: song.name,
      artist: song.artist,
      album: song.album,
      cover: FALLBACK_COVER,
      url: "",
      lrc: "",
      key,
      index,
      __smallJiaCatalog: { position: index + 1, name: song.name, artist: song.artist, album: song.album },
    };
  };

  const installCatalog = (app, originalSetSourceState) => {
    if (!app || app.destroyed) return;
    app.audio?.pause();
    if (app.audio) {
      app.audio.removeAttribute("src");
      try { app.audio.load(); } catch (_) {}
    }
    app.queue = CATALOG.map(makeCatalogTrack);
    app.currentIndex = -1;
    app.currentTrack = null;
    app.lyrics = [];
    app.currentLyricIndex = -1;
    app.audioCandidates = [];
    app.audioCandidateIndex = 0;
    app.__personalCatalogInstalled = true;
    app.root?.setAttribute("data-default-playlist", "personal-97");
    app.renderQueue?.();
    app.setNowPlaceholder?.("选择一首歌开始播放", "我的 97 首私人歌单");
    originalSetSourceState?.("ready", "私人歌单");
    const chip = app.dom?.sourceChip?.querySelector("span:last-child");
    if (chip) chip.textContent = "我的 97 首歌单 · GD-Studio 播放";
  };

  const hasCatalog = app => app?.queue?.length === CATALOG.length && app.queue.every(track => track?.__smallJiaCatalog);

  const patch = app => {
    if (!app || !app.__gdStudioPatched || app.__personalCatalogPatched) return false;
    app.__personalCatalogPatched = true;

    const providerPlayTrack = app.playTrack.bind(app);
    const providerSelectIndex = app.selectIndex.bind(app);
    const providerSetSourceState = app.setSourceState.bind(app);
    let installTimer = null;
    let resolvingIndex = -1;

    const scheduleInstall = () => {
      clearTimeout(installTimer);
      installTimer = setTimeout(() => {
        if (!app.queue?.length && !hasCatalog(app)) installCatalog(app, providerSetSourceState);
      }, 0);
    };

    app.setSourceState = function (state, routeLabel) {
      const result = providerSetSourceState(state, routeLabel);
      if ((state === "ready" || state === "error") && !this.queue?.length && !hasCatalog(this)) scheduleInstall();
      return result;
    };

    app.playTrack = async function (track) {
      if (track?.__smallJiaCatalog && !track.id) {
        this.showToast?.(`正在匹配：${track.name}`);
        const matched = await resolveCatalogMatch(track);
        if (!matched) {
          this.showToast?.(`没有找到可播放版本：${track.name}`);
          return;
        }
        Object.assign(track, matched, {
          key: track.key,
          __smallJiaCatalog: track.__smallJiaCatalog,
        });
        this.renderQueue?.();
      }
      return providerPlayTrack(track);
    };

    app.selectIndex = async function (index, autoplay = true, restorePosition = false) {
      if (!this.queue?.length) return;
      const normalizedIndex = ((index % this.queue.length) + this.queue.length) % this.queue.length;
      const track = this.queue[normalizedIndex];

      if (track?.__smallJiaCatalog && !track.id) {
        if (resolvingIndex === normalizedIndex) return;
        resolvingIndex = normalizedIndex;
        this.showToast?.(`正在匹配：${track.name}`);
        try {
          const matched = await resolveCatalogMatch(track);
          if (!matched) {
            this.showToast?.(`没有找到可播放版本：${track.name}`);
            return;
          }
          Object.assign(track, matched, {
            key: track.key,
            __smallJiaCatalog: track.__smallJiaCatalog,
          });
          this.renderQueue?.();
        } finally {
          resolvingIndex = -1;
        }
      }

      return providerSelectIndex(normalizedIndex, autoplay, restorePosition);
    };

    if (app.queue?.length || app.root?.classList.contains("sjm-engine-error")) scheduleInstall();
    else setTimeout(() => { if (!app.queue?.length && !hasCatalog(app)) installCatalog(app, providerSetSourceState); }, 12000);

    return true;
  };

  const tryPatch = () => patch(window.SmallJiaMusic);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(tryPatch, 0), { once: true });
  else setTimeout(tryPatch, 0);
  document.addEventListener("pjax:complete", () => setTimeout(tryPatch, 0));

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (tryPatch() || attempts > 160) clearInterval(timer);
  }, 100);
})();
