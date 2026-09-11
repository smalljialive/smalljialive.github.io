(function () {
  "use strict";

  if (!/^\/link\/?$/i.test(window.location.pathname || "")) return;
  if (window.__smallJiaLinkNavMusicLazy) return;
  window.__smallJiaLinkNavMusicLazy = true;

  const config = window.__smallJiaLinkMusicConfig || {};
  const nav = document.getElementById("nav-music");
  const host = nav?.querySelector("meting-js");
  if (!nav || !host) return;

  const TARGET_NAME = "日常";
  const PLAYLIST_KEY = "smalljia_music_custom_playlists_v1";
  const CACHE_KEY = "smalljia_nav_daily_resolved_v1";
  const CACHE_TTL = 6 * 60 * 60 * 1000;
  const SUPABASE_ROOT = "https://yluidpgnvfurcomnexjr.supabase.co";
  const SUPABASE_API = `${SUPABASE_ROOT}/functions/v1/music-proxy`;
  const SUPABASE_REST = `${SUPABASE_ROOT}/rest/v1`;
  const SUPABASE_KEY = "sb_publishable_ouIhEhTVrbsU98a0klTEdA_DEHjJvhT";
  const FALLBACK_COVER = "/img/music-placeholder.svg";
  const SOURCES = ["kuwo", "tencent", "netease"];
  const BITRATES = [999, 320, 128];

  const state = {
    phase: "idle",
    promise: null,
    player: null,
  };

  const setTip = text => {
    const tip = document.getElementById("nav-music-hoverTips");
    if (tip && !window.anzhiyu_musicPlaying) tip.textContent = text;
  };

  const normalize = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const artistText = value => {
    if (Array.isArray(value)) return value.map(item => typeof item === "string" ? item : item?.name || "").filter(Boolean).join(" / ");
    if (value && typeof value === "object") return value.name || value.artist || "";
    return String(value || "");
  };

  const loadCss = href => {
    if (!href || document.querySelector(`link[data-smalljia-link-music-css="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.smalljiaLinkMusicCss = href;
    document.head.appendChild(link);
  };

  const loadScript = src => {
    if (!src) return Promise.reject(new Error("missing script url"));
    const absolute = new URL(src, location.href).href;
    const existing = Array.from(document.scripts).find(item => item.src === absolute);
    if (existing) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.smalljiaLinkMusicLoader = "true";
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", () => reject(new Error(`failed to load ${src}`)), { once: true });
      document.body.appendChild(script);
    });
  };

  const readLocalDaily = () => {
    try {
      const list = JSON.parse(localStorage.getItem(PLAYLIST_KEY) || "[]");
      if (!Array.isArray(list)) return null;
      const playlist = list.find(item => normalize(item?.name) === normalize(TARGET_NAME));
      if (!playlist || !Array.isArray(playlist.tracks) || !playlist.tracks.length) return null;
      return playlist;
    } catch (_) {
      return null;
    }
  };

  const publicHeaders = () => ({
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
  });

  const fetchPublicDaily = async () => {
    const playlistUrl = `${SUPABASE_REST}/playlists?select=id,name&is_public=eq.true&name=eq.${encodeURIComponent(TARGET_NAME)}&limit=1`;
    const playlistResponse = await fetch(playlistUrl, { headers: publicHeaders(), cache: "no-store" });
    if (!playlistResponse.ok) throw new Error(`public playlist HTTP ${playlistResponse.status}`);
    const playlists = await playlistResponse.json();
    const playlist = Array.isArray(playlists) ? playlists[0] : null;
    if (!playlist?.id) throw new Error("public Daily playlist not found");

    const fields = "track_key,source,source_track_id,name,artist,album,cover,lyric_id,pic_id,url_id,sort_order";
    const trackUrl = `${SUPABASE_REST}/playlist_tracks?select=${fields}&playlist_id=eq.${encodeURIComponent(playlist.id)}&order=sort_order.asc`;
    const trackResponse = await fetch(trackUrl, { headers: publicHeaders(), cache: "no-store" });
    if (!trackResponse.ok) throw new Error(`public tracks HTTP ${trackResponse.status}`);
    const rows = await trackResponse.json();
    const tracks = (Array.isArray(rows) ? rows : []).map(row => ({
      id: row.source_track_id || "",
      server: row.source || "netease",
      source: row.source || "netease",
      name: row.name || "未知歌曲",
      artist: row.artist || "未知歌手",
      album: row.album || "",
      cover: row.cover || "",
      key: row.track_key || `${row.name || "未知歌曲"}::${row.artist || "未知歌手"}`.toLowerCase(),
      __gdStudio: {
        source: row.source || "netease",
        urlId: row.url_id || row.source_track_id || "",
        picId: row.pic_id || row.source_track_id || "",
      },
    }));
    if (!tracks.length) throw new Error("public Daily playlist is empty");
    return { id: playlist.id, name: TARGET_NAME, tracks };
  };

  const loadDaily = async () => readLocalDaily() || await fetchPublicDaily();

  const cacheKey = track => `${normalize(track?.name)}::${normalize(track?.artist)}`;

  const getCached = track => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      const hit = cache?.[cacheKey(track)];
      if (!hit?.url || !hit?.at || Date.now() - hit.at > CACHE_TTL) return null;
      return hit;
    } catch (_) {
      return null;
    }
  };

  const setCached = (track, resolved) => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      cache[cacheKey(track)] = { ...resolved, at: Date.now() };
      const entries = Object.entries(cache)
        .sort((a, b) => (b[1]?.at || 0) - (a[1]?.at || 0))
        .slice(0, 160);
      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch (_) {}
  };

  const buildProxyUrl = params => {
    const url = new URL(SUPABASE_API);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    return url.toString();
  };

  const request = async (params, timeout = 8000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(buildProxyUrl(params), {
        signal: controller.signal,
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json, text/plain, */*" },
      });
      if (!response.ok) throw new Error(`music proxy HTTP ${response.status}`);
      const raw = await response.text();
      try { return JSON.parse(raw); } catch (_) { return raw; }
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
        const value = extractUrl(item);
        if (value) return value;
      }
      return "";
    }
    if (typeof payload === "object") {
      for (const key of ["url", "play_url", "playUrl", "data"]) {
        const value = extractUrl(payload[key]);
        if (value) return value;
      }
    }
    return "";
  };

  const listFromPayload = payload => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload.result)) return payload.result;
    if (Array.isArray(payload?.result?.songs)) return payload.result.songs;
    if (Array.isArray(payload.songs)) return payload.songs;
    return [];
  };

  const normalizeCandidate = (raw, source) => ({
    id: String(raw?.id || raw?.url_id || raw?.urlId || raw?.songid || raw?.songId || ""),
    source,
    name: raw?.name || raw?.title || raw?.songName || "未知歌曲",
    artist: artistText(raw?.artist || raw?.artists || raw?.author || raw?.singer),
    album: typeof raw?.album === "string" ? raw.album : raw?.album?.name || raw?.albumName || "",
    cover: /^https?:\/\//i.test(String(raw?.pic || raw?.cover || raw?.picUrl || raw?.albumPic || ""))
      ? String(raw?.pic || raw?.cover || raw?.picUrl || raw?.albumPic).replace(/^http:\/\//i, "https://")
      : "",
  });

  const score = (candidate, target) => {
    const cn = normalize(candidate?.name);
    const tn = normalize(target?.name);
    const ca = normalize(candidate?.artist);
    const ta = normalize(target?.artist);
    let value = 0;
    if (cn && cn === tn) value += 100;
    else if (cn && tn && (cn.includes(tn) || tn.includes(cn))) value += 55;
    if (ca && ta && ca === ta) value += 55;
    else if (ca && ta && (ca.includes(ta) || ta.includes(ca))) value += 30;
    return value;
  };

  const resolveById = async track => {
    const source = String(track?.server || track?.source || track?.__gdStudio?.source || "netease").toLowerCase();
    const id = String(track?.__gdStudio?.urlId || track?.id || "");
    if (!id || !SOURCES.includes(source)) return null;

    for (const br of BITRATES) {
      try {
        const url = extractUrl(await request({ types: "url", source, id, br }));
        if (url) return { url, cover: track.cover || FALLBACK_COVER, source, id };
      } catch (_) {}
    }
    return null;
  };

  const resolveBySearch = async track => {
    const query = `${track?.name || ""} ${track?.artist || ""}`.trim();
    if (!query) return null;

    const preferred = String(track?.server || track?.source || "").toLowerCase();
    const sources = [preferred, ...SOURCES].filter((value, index, all) => SOURCES.includes(value) && all.indexOf(value) === index);

    for (const source of sources) {
      try {
        const payload = await request({ types: "search", source, name: query, count: 6, pages: 1 });
        const candidates = listFromPayload(payload)
          .map(raw => normalizeCandidate(raw, source))
          .filter(item => item.id)
          .sort((a, b) => score(b, track) - score(a, track));

        for (const candidate of candidates.slice(0, 2)) {
          if (score(candidate, track) < 70) continue;
          for (const br of BITRATES) {
            const url = extractUrl(await request({ types: "url", source, id: candidate.id, br }));
            if (url) {
              return {
                url,
                cover: candidate.cover || track.cover || FALLBACK_COVER,
                source,
                id: candidate.id,
              };
            }
          }
        }
      } catch (_) {}
    }
    return null;
  };

  const resolveTrack = async track => {
    const cached = getCached(track);
    if (cached) return cached;

    const byId = await resolveById(track);
    if (byId) {
      setCached(track, byId);
      return byId;
    }

    const bySearch = await resolveBySearch(track);
    if (bySearch) setCached(track, bySearch);
    return bySearch;
  };

  const choosePlayableTrack = async playlist => {
    const tracks = Array.isArray(playlist?.tracks) ? playlist.tracks : [];
    if (!tracks.length) throw new Error("Daily playlist is empty");

    const start = Math.floor(Math.random() * tracks.length);
    const candidates = [];
    for (let offset = 0; offset < Math.min(4, tracks.length); offset += 1) {
      candidates.push(tracks[(start + offset) % tracks.length]);
    }

    for (const track of candidates) {
      const resolved = await resolveTrack(track);
      if (resolved?.url) return { track, resolved };
    }
    throw new Error("no playable Daily track found");
  };

  const createPlayer = ({ track, resolved }) => {
    if (typeof APlayer !== "function") throw new Error("APlayer is not available");
    if (host.aplayer) return host.aplayer;

    const player = new APlayer({
      container: host,
      fixed: false,
      mini: false,
      autoplay: false,
      theme: "var(--anzhiyu-main)",
      loop: "one",
      order: "list",
      preload: "none",
      volume: Number(config.volume) || 0.5,
      mutex: true,
      lrcType: 0,
      audio: [{
        name: track.name || "未知歌曲",
        artist: track.artist || "未知歌手",
        url: resolved.url,
        cover: resolved.cover || track.cover || FALLBACK_COVER,
        lrc: "",
      }],
    });

    host.aplayer = player;
    window.aplayers = Array.isArray(window.aplayers) ? window.aplayers : [];
    if (!window.aplayers.includes(player)) window.aplayers.push(player);

    player.on?.("play", () => {
      nav.classList.add("playing");
      window.anzhiyu_musicPlaying = true;
    });
    player.on?.("pause", () => {
      nav.classList.remove("playing");
      window.anzhiyu_musicPlaying = false;
    });

    return player;
  };

  const prepare = () => {
    if (state.phase === "ready") return Promise.resolve(state.player);
    if (state.promise) return state.promise;

    state.phase = "loading";
    setTip("正在准备音乐…");

    state.promise = (async () => {
      // Link 页的音乐初始化严格按需执行：这里只做一次歌单读取和一首歌解析，
      // 不加载 MetingJS、daily-player、hover、persistence，也不创建任何后台轮询。
      const playlist = await loadDaily();
      const playable = await choosePlayableTrack(playlist);

      loadCss(config.aplayerCss);
      await loadScript(config.aplayerJs);

      state.player = createPlayer(playable);
      state.phase = "ready";
      setTip("音乐已就绪 · 点击播放");
      return state.player;
    })().catch(error => {
      state.phase = "error";
      state.promise = null;
      console.warn("SmallJia link nav music: isolated init failed", error);
      setTip("音乐加载失败 · 点击重试");
      throw error;
    });

    return state.promise;
  };

  // 第一次点击只准备一首真实音频；准备完成后不再执行任何初始化逻辑。
  // 第二次点击由主题原生 onclick -> anzhiyu.musicToggle() 同步播放真实 URL。
  nav.addEventListener("click", event => {
    if (state.phase === "ready") return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (state.phase === "loading") {
      setTip("正在准备音乐…");
      return;
    }

    prepare().catch(() => {});
  }, true);

  setTip("点击加载音乐");

  window.SmallJiaLinkNavMusic = {
    prepare,
    get phase() { return state.phase; },
    get player() { return state.player; },
  };
})();
