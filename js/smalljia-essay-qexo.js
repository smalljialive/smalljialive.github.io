(function () {
  "use strict";

  const VERSION = "20260911-1";
  if (window.__smallJiaEssayQexoVersion === VERSION) return;
  window.__smallJiaEssayQexoVersion = VERSION;

  const QEXO_API = "https://small-tan.vercel.app/pub/talks/";
  const PAGE_SIZE = 100;
  const MAX_PAGES = 10;
  const MUSIC_PROXY = "https://yluidpgnvfurcomnexjr.supabase.co/functions/v1/music-proxy";
  const MUSIC_SOURCES = ["kuwo", "tencent", "netease"];
  const MUSIC_BITRATES = [999, 740, 320, 320000, 192, 128];
  const FALLBACK_COVER = "/img/music-placeholder.svg";
  const musicStates = new WeakMap();

  const normalizeSource = value => {
    const source = String(value || "").trim().toLowerCase();
    if (["qq", "qqmusic", "tencent", "腾讯", "qq音乐"].includes(source)) return "tencent";
    if (["netease", "163", "网易", "网易云", "网易云音乐"].includes(source)) return "netease";
    if (["kuwo", "kw", "酷我", "酷我音乐"].includes(source)) return "kuwo";
    return MUSIC_SOURCES.includes(source) ? source : "";
  };

  const valueOf = (values, aliases, fallback = "") => {
    if (!values || typeof values !== "object") return fallback;
    for (const key of aliases) {
      if (values[key] !== undefined && values[key] !== null && String(values[key]).trim() !== "") return values[key];
    }
    return fallback;
  };

  const parseMaybeJson = value => {
    if (!value || typeof value !== "string") return value;
    const text = value.trim();
    if (!text || !["{", "["].includes(text[0])) return value;
    try { return JSON.parse(text); } catch (_) { return value; }
  };

  const parseList = value => {
    const parsed = parseMaybeJson(value);
    if (Array.isArray(parsed)) return parsed.map(String).map(item => item.trim()).filter(Boolean);
    if (parsed === undefined || parsed === null || parsed === "") return [];
    const text = String(parsed).trim();
    if (!text) return [];
    if (/\r?\n/.test(text)) return text.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    if ((text.match(/https?:\/\//g) || []).length > 1) return text.split(/\s*,\s*/).map(item => item.trim()).filter(Boolean);
    return [text];
  };

  const safeHttpUrl = value => {
    try {
      const url = new URL(String(value || ""), window.location.href);
      return /^https?:$/i.test(url.protocol) ? url.href : "";
    } catch (_) {
      return "";
    }
  };

  const sanitizeHtml = html => {
    const template = document.createElement("template");
    template.innerHTML = String(html || "");
    const allowedTags = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "S", "DEL", "BLOCKQUOTE", "UL", "OL", "LI", "A", "IMG", "VIDEO", "SOURCE", "SPAN", "H1", "H2", "H3", "H4", "CODE", "PRE", "IFRAME"]);
    const allowedAttrs = {
      A: new Set(["href", "title"]),
      IMG: new Set(["src", "alt", "title"]),
      VIDEO: new Set(["src", "poster", "controls", "preload"]),
      SOURCE: new Set(["src", "type"]),
      IFRAME: new Set(["src", "title", "allowfullscreen"]),
    };

    Array.from(template.content.querySelectorAll("*")).forEach(node => {
      if (!allowedTags.has(node.tagName)) {
        node.replaceWith(...Array.from(node.childNodes));
        return;
      }
      Array.from(node.attributes).forEach(attr => {
        const allowed = allowedAttrs[node.tagName];
        if (!allowed || !allowed.has(attr.name.toLowerCase())) node.removeAttribute(attr.name);
      });
      if (node.tagName === "A") {
        const href = safeHttpUrl(node.getAttribute("href"));
        if (href) {
          node.setAttribute("href", href);
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer nofollow");
        } else {
          node.removeAttribute("href");
        }
      }
      if (["IMG", "VIDEO", "SOURCE"].includes(node.tagName)) {
        const src = safeHttpUrl(node.getAttribute("src"));
        if (src) node.setAttribute("src", src);
        else node.removeAttribute("src");
        if (node.tagName === "IMG") {
          node.setAttribute("loading", "lazy");
          node.setAttribute("decoding", "async");
        }
        if (node.tagName === "VIDEO") {
          node.setAttribute("controls", "controls");
          node.setAttribute("preload", "none");
        }
      }
      if (node.tagName === "IFRAME") {
        const src = safeHttpUrl(node.getAttribute("src"));
        try {
          const host = src ? new URL(src).hostname : "";
          if (host !== "player.bilibili.com") {
            node.remove();
            return;
          }
          node.setAttribute("src", src);
          node.setAttribute("loading", "lazy");
          node.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
          node.setAttribute("allowfullscreen", "true");
        } catch (_) {
          node.remove();
        }
      }
    });
    return template.content;
  };

  const plainTextFromHtml = html => {
    const box = document.createElement("div");
    box.appendChild(sanitizeHtml(html).cloneNode(true));
    return (box.textContent || "").replace(/\s+/g, " ").trim();
  };

  const formatTalkDate = timestamp => {
    const numeric = Number(timestamp);
    const date = Number.isFinite(numeric) ? new Date(numeric * 1000) : new Date(timestamp);
    if (Number.isNaN(date.getTime())) return { date, attr: "", label: "" };
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return { date, attr: `${y}/${m}/${d}`, label: `${y}-${m}-${d}` };
  };

  const fetchJson = async url => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Qexo HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const loadTalks = async () => {
    const firstUrl = new URL(QEXO_API);
    firstUrl.searchParams.set("page", "1");
    firstUrl.searchParams.set("limit", String(PAGE_SIZE));
    const first = await fetchJson(firstUrl.toString());
    if (!first?.status || !Array.isArray(first.data)) throw new Error(first?.msg || "Qexo talks response invalid");

    const talks = [...first.data];
    const total = Number(first.count || talks.length);
    const pages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(total / PAGE_SIZE)));
    if (pages > 1) {
      const tasks = [];
      for (let page = 2; page <= pages; page += 1) {
        const url = new URL(QEXO_API);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(PAGE_SIZE));
        tasks.push(fetchJson(url.toString()).catch(error => ({ status: false, error })));
      }
      const results = await Promise.all(tasks);
      results.forEach(result => {
        if (result?.status && Array.isArray(result.data)) talks.push(...result.data);
      });
    }
    return talks.sort((a, b) => Number(b?.time || 0) - Number(a?.time || 0));
  };

  const makeImageBlock = urls => {
    const list = urls.map(safeHttpUrl).filter(Boolean);
    if (!list.length) return null;
    const wrap = document.createElement("div");
    wrap.className = "bber-container-img sj-qexo-images";
    list.forEach(url => {
      const anchor = document.createElement("a");
      anchor.className = "bber-content-img";
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.dataset.fancybox = "gallery";
      const img = document.createElement("img");
      img.src = url;
      img.loading = "lazy";
      img.decoding = "async";
      anchor.appendChild(img);
      wrap.appendChild(anchor);
    });
    return wrap;
  };

  const makeVideoBlock = urls => {
    const list = urls.map(safeHttpUrl).filter(Boolean);
    if (!list.length) return null;
    const wrap = document.createElement("div");
    wrap.className = "bber-container-img sj-qexo-videos";
    list.forEach(url => {
      let host = "";
      try { host = new URL(url).hostname; } catch (_) {}
      if (host === "player.bilibili.com") {
        const frameWrap = document.createElement("div");
        frameWrap.className = "sj-qexo-bilibili";
        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.loading = "lazy";
        iframe.scrolling = "no";
        iframe.frameBorder = "0";
        iframe.allowFullscreen = true;
        frameWrap.appendChild(iframe);
        wrap.appendChild(frameWrap);
      } else {
        const video = document.createElement("video");
        video.className = "sj-qexo-video";
        video.src = url;
        video.controls = true;
        video.preload = "none";
        wrap.appendChild(video);
      }
    });
    return wrap;
  };

  const parseAplayer = values => {
    const raw = parseMaybeJson(valueOf(values, ["aplayer", "音乐", "music"], null));
    const objectValue = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const server = normalizeSource(objectValue.server || valueOf(values, ["music_server", "music_source", "音乐平台", "音乐来源", "平台"], ""));
    const id = String(objectValue.id || valueOf(values, ["music_id", "song_id", "歌曲ID", "音乐ID", "歌曲id", "音乐id"], "")).trim();
    const directUrl = safeHttpUrl(objectValue.url || valueOf(values, ["music_url", "audio_url", "音频地址", "音乐地址"], ""));
    const title = String(objectValue.title || objectValue.name || valueOf(values, ["music_title", "song_title", "歌名", "歌曲名"], "分享的音乐")).trim();
    const artist = String(objectValue.artist || valueOf(values, ["music_artist", "song_artist", "歌手", "艺人"], "")).trim();
    const cover = safeHttpUrl(objectValue.cover || valueOf(values, ["music_cover", "cover", "音乐封面", "封面"], ""));
    const link = safeHttpUrl(objectValue.link || valueOf(values, ["music_link", "song_link", "音乐链接", "歌曲链接"], ""));
    if (!directUrl && (!server || !id)) return null;
    return { server, id, directUrl, title, artist, cover, link };
  };

  const proxyRequest = async params => {
    const url = new URL(MUSIC_PROXY);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json, text/plain, */*" },
      });
      if (!response.ok) throw new Error(`music proxy HTTP ${response.status}`);
      const text = await response.text();
      try { return JSON.parse(text); } catch (_) { return text; }
    } finally {
      clearTimeout(timer);
    }
  };

  const extractUrl = payload => {
    if (!payload) return "";
    if (typeof payload === "string") {
      const value = payload.trim().replace(/^"|"$/g, "");
      return /^https?:\/\//i.test(value) ? value.replace(/^http:\/\//i, "https://") : "";
    }
    if (Array.isArray(payload)) {
      for (const item of payload) {
        const hit = extractUrl(item);
        if (hit) return hit;
      }
      return "";
    }
    if (typeof payload === "object") {
      for (const key of ["url", "play_url", "playUrl", "pic", "cover", "data"]) {
        const hit = extractUrl(payload[key]);
        if (hit) return hit;
      }
    }
    return "";
  };

  const resolveMusicUrl = async music => {
    if (music.directUrl) return music.directUrl;
    for (const br of MUSIC_BITRATES) {
      try {
        const url = extractUrl(await proxyRequest({ types: "url", source: music.server, id: music.id, br }));
        if (url) return url;
      } catch (_) {}
    }
    return "";
  };

  const pauseOtherEssayMusic = current => {
    musicStates.forEach?.(() => {});
    document.querySelectorAll(".sj-essay-music audio").forEach(audio => {
      if (audio !== current && !audio.paused) audio.pause();
    });
    document.querySelectorAll("#bber .bber-music meting-js").forEach(node => {
      try { node.aplayer?.pause(); } catch (_) {}
    });
    try {
      const navMeting = document.querySelector("#nav-music meting-js");
      if (navMeting?.aplayer?.audio && !navMeting.aplayer.audio.paused) navMeting.aplayer.pause();
    } catch (_) {}
  };

  const updateMusicUi = (card, state, text) => {
    const button = card.querySelector(".sj-essay-music-play");
    const status = card.querySelector(".sj-essay-music-status");
    if (status && text) status.textContent = text;
    if (button) {
      button.classList.toggle("is-playing", Boolean(state.audio && !state.audio.paused));
      button.innerHTML = state.audio && !state.audio.paused ? "❚❚" : "▶";
      button.disabled = Boolean(state.loading);
    }
  };

  const playMusicCard = async card, music => {
    let state = musicStates.get(card);
    if (!state) {
      state = { audio: null, loading: false, resolvedUrl: "", preview: false };
      musicStates.set(card, state);
    }
    if (state.loading) return;
    if (state.audio) {
      if (state.audio.paused) {
        pauseOtherEssayMusic(state.audio);
        try { await state.audio.play(); } catch (_) { updateMusicUi(card, state, "已就绪 · 再点一次播放"); }
      } else {
        state.audio.pause();
      }
      updateMusicUi(card, state, state.audio.paused ? (state.preview ? "试听已暂停" : "已暂停") : (state.preview ? "试听中" : "播放中"));
      return;
    }

    state.loading = true;
    updateMusicUi(card, state, "正在准备音频…");
    try {
      const url = await resolveMusicUrl(music);
      if (!url) throw new Error("no playable url");
      state.resolvedUrl = url;
      const audio = document.createElement("audio");
      audio.className = "sj-essay-audio";
      audio.preload = "metadata";
      audio.src = url;
      state.audio = audio;
      card.appendChild(audio);

      audio.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0 && audio.duration < 100) {
          state.preview = true;
          card.classList.add("is-preview");
        }
        updateMusicUi(card, state, state.preview ? "试听音源" : "已就绪");
      }, { once: true });
      audio.addEventListener("play", () => updateMusicUi(card, state, state.preview ? "试听中" : "播放中"));
      audio.addEventListener("pause", () => {
        if (!audio.ended) updateMusicUi(card, state, state.preview ? "试听已暂停" : "已暂停");
      });
      audio.addEventListener("ended", () => updateMusicUi(card, state, state.preview ? "试听结束" : "播放结束"));
      audio.addEventListener("error", () => updateMusicUi(card, state, "当前音源不可播放"));

      pauseOtherEssayMusic(audio);
      try {
        await audio.play();
      } catch (_) {
        updateMusicUi(card, state, "已就绪 · 再点一次播放");
      }
    } catch (error) {
      console.warn("SmallJia essay music resolve failed", error);
      updateMusicUi(card, state, "暂不可播放，可前往平台收听");
    } finally {
      state.loading = false;
      updateMusicUi(card, state);
    }
  };

  const makeMusicCard = music => {
    if (!music) return null;
    const card = document.createElement("div");
    card.className = "bber-music sj-essay-music";

    const cover = document.createElement("div");
    cover.className = "sj-essay-music-cover";
    if (music.cover) {
      const img = document.createElement("img");
      img.src = music.cover;
      img.alt = music.title;
      img.loading = "lazy";
      img.decoding = "async";
      cover.appendChild(img);
    } else {
      const img = document.createElement("img");
      img.src = FALLBACK_COVER;
      img.alt = "music";
      img.loading = "lazy";
      cover.appendChild(img);
    }

    const meta = document.createElement("div");
    meta.className = "sj-essay-music-meta";
    const title = document.createElement("strong");
    title.textContent = music.title || "分享的音乐";
    const artist = document.createElement("span");
    artist.textContent = music.artist || ({ netease: "网易云音乐", tencent: "QQ音乐", kuwo: "酷我音乐" }[music.server] || "音乐分享");
    const status = document.createElement("small");
    status.className = "sj-essay-music-status";
    status.textContent = "点击播放";
    meta.append(title, artist, status);

    const play = document.createElement("button");
    play.type = "button";
    play.className = "sj-essay-music-play";
    play.title = "播放 / 暂停";
    play.textContent = "▶";
    play.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      playMusicCard(card, music);
    });

    card.append(cover, meta, play);
    if (music.link) {
      const link = document.createElement("a");
      link.className = "sj-essay-music-link";
      link.href = music.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer nofollow";
      link.title = "前往音乐平台";
      link.textContent = "↗";
      card.appendChild(link);
    }
    return card;
  };

  const buildTalkItem = talk => {
    const values = talk?.values && typeof talk.values === "object" ? talk.values : {};
    const from = String(valueOf(values, ["from", "source", "来源", "作者"], "SmallJia")).trim();
    const address = String(valueOf(values, ["address", "location", "地址", "地点"], "")).trim();
    const link = safeHttpUrl(valueOf(values, ["link", "url", "链接", "外链"], ""));
    const images = parseList(valueOf(values, ["image", "images", "图片", "图片链接"], []));
    const videos = parseList(valueOf(values, ["video", "videos", "视频", "视频链接"], []));
    const music = parseAplayer(values);
    const formatted = formatTalkDate(talk?.time);
    const plainContent = plainTextFromHtml(talk?.content || "");

    const item = document.createElement("li");
    item.className = "bber-item sj-qexo-item";
    item.dataset.qexoId = String(talk?.id || "");
    item.dataset.essayDate = formatted.attr;
    item.dataset.essayContent = plainContent;
    item.dataset.essayFrom = from;

    const content = document.createElement("div");
    content.className = "bber-content";
    const text = document.createElement("div");
    text.className = "datacont sj-qexo-content";
    text.appendChild(sanitizeHtml(talk?.content || ""));
    content.appendChild(text);

    const imageBlock = makeImageBlock(images);
    const videoBlock = makeVideoBlock(videos);
    const musicBlock = makeMusicCard(music);
    if (imageBlock) content.appendChild(imageBlock);
    if (videoBlock) content.appendChild(videoBlock);
    if (musicBlock) content.appendChild(musicBlock);

    const hr = document.createElement("hr");
    const bottom = document.createElement("div");
    bottom.className = "bber-bottom";
    const info = document.createElement("div");
    info.className = "bber-info";

    const time = document.createElement("div");
    time.className = "bber-info-time";
    time.innerHTML = '<i class="anzhiyufont anzhiyu-icon-clock"></i>';
    const timeText = document.createElement("time");
    timeText.className = "datatime";
    timeText.dateTime = formatted.attr;
    timeText.textContent = formatted.label;
    time.appendChild(timeText);
    info.appendChild(time);

    if (link) {
      const anchor = document.createElement("a");
      anchor.className = "bber-content-link";
      anchor.href = link;
      anchor.target = "_blank";
      anchor.rel = "external nofollow noopener noreferrer";
      anchor.innerHTML = '<i class="anzhiyufont anzhiyu-icon-link"></i>链接';
      info.appendChild(anchor);
    }
    if (from) {
      const source = document.createElement("div");
      source.className = "bber-info-from";
      source.innerHTML = '<i class="anzhiyufont anzhiyu-icon-fw-fire"></i>';
      const label = document.createElement("span");
      label.textContent = from;
      source.appendChild(label);
      info.appendChild(source);
    }
    if (address) {
      const location = document.createElement("div");
      location.className = "bber-info-from";
      location.innerHTML = '<i class="anzhiyufont anzhiyu-icon-location-dot"></i>';
      const label = document.createElement("span");
      label.textContent = address;
      location.appendChild(label);
      info.appendChild(location);
    }

    bottom.appendChild(info);
    item.append(content, hr, bottom);
    return item;
  };

  const refreshMemoryTools = root => {
    if (!root || typeof window.initEssayMemories !== "function") return;
    const filters = root.querySelector("#essay-year-filters");
    if (filters?.parentNode) {
      const cleanFilters = filters.cloneNode(false);
      filters.parentNode.replaceChild(cleanFilters, filters);
    }
    const today = root.querySelector("#essay-today-list");
    if (today) today.innerHTML = '<div class="essay-memory-empty">正在翻找往年的今天…</div>';
    const summary = root.querySelector("#essay-archive-summary");
    if (summary) summary.textContent = "";
    root.dataset.memoryReady = "0";
    window.initEssayMemories();
  };

  const relayout = root => {
    const waterfallEl = root?.querySelector("#waterfall");
    if (!waterfallEl) return;
    const run = () => {
      try {
        if (typeof waterfall === "function") {
          waterfall("#waterfall");
          waterfallEl.classList.add("show");
        } else if (typeof anzhiyu !== "undefined" && typeof anzhiyu.reflashEssayWaterFall === "function") {
          anzhiyu.reflashEssayWaterFall();
        } else {
          waterfallEl.classList.add("show");
        }
      } catch (_) {
        waterfallEl.classList.add("show");
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
    setTimeout(run, 180);
    setTimeout(run, 650);
  };

  const init = async () => {
    const root = document.getElementById("essay_page");
    const waterfallEl = root?.querySelector("#waterfall");
    if (!root || !waterfallEl || root.dataset.qexoLoading === "1" || root.dataset.qexoLoaded === "1") return;
    root.dataset.qexoLoading = "1";
    try {
      const talks = await loadTalks();
      const existingIds = new Set(Array.from(waterfallEl.querySelectorAll("[data-qexo-id]")).map(node => node.dataset.qexoId));
      const fragment = document.createDocumentFragment();
      talks.forEach(talk => {
        if (!talk?.id || existingIds.has(String(talk.id))) return;
        fragment.appendChild(buildTalkItem(talk));
      });
      if (fragment.childNodes.length) waterfallEl.prepend(fragment);
      root.dataset.qexoLoaded = "1";
      refreshMemoryTools(root);
      relayout(root);
    } catch (error) {
      console.warn("SmallJia essay: Qexo talks unavailable; keeping essay.yml fallback", error);
      root.dataset.qexoFailed = "1";
      relayout(root);
    } finally {
      root.dataset.qexoLoading = "0";
    }
  };

  const boot = () => {
    if (!document.getElementById("essay_page")) return;
    init();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
  document.addEventListener("pjax:complete", () => setTimeout(boot, 30));
})();
