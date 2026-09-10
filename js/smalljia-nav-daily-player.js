(function () {
  "use strict";

  const VERSION = "20260910-1";
  if (window.__smallJiaNavDailyPlayerVersion === VERSION) return;
  window.__smallJiaNavDailyPlayerVersion = VERSION;

  const PLAYLIST_KEY = "smalljia_music_custom_playlists_v1";
  const TARGET_NAME = "日常";
  const CACHE_KEY = "smalljia_nav_daily_resolved_v1";
  const CACHE_TTL = 6 * 60 * 60 * 1000;
  const SUPABASE_API = "https://yluidpgnvfurcomnexjr.supabase.co/functions/v1/music-proxy";
  const FALLBACK_COVER = "/img/music-placeholder.svg";
  const SOURCES = ["kuwo", "tencent", "netease"];
  const BITRATES = [999, 740, 320, 320000, 192, 128];
  const SILENT_URL = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

  const state = {
    aplayer: null,
    originalSwitch: null,
    tracks: [],
    signature: "",
    resolving: new Map(),
    installed: false,
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

  const readDaily = () => {
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

  const playlistSignature = playlist => JSON.stringify((playlist?.tracks || []).map(track => [
    track?.id || "",
    track?.server || track?.source || "",
    track?.name || "",
    track?.artist || "",
  ]));

  const readCache = () => {
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (_) {
      return {};
    }
  };

  const writeCache = cache => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (_) {}
  };

  const cacheKey = track => `${normalize(track?.name)}::${normalize(track?.artist)}`;

  const getCached = track => {
    const cache = readCache();
    const hit = cache[cacheKey(track)];
    if (!hit?.url || !hit?.at || Date.now() - hit.at > CACHE_TTL) return null;
    return hit;
  };

  const setCached = (track, resolved) => {
    const cache = readCache();
    cache[cacheKey(track)] = { ...resolved, at: Date.now() };
    const entries = Object.entries(cache).sort((a, b) => (b[1]?.at || 0) - (a[1]?.at || 0)).slice(0, 160);
    writeCache(Object.fromEntries(entries));
  };

  const buildUrl = params => {
    const url = new URL(SUPABASE_API);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    return url.toString();
  };

  const request = async (params, timeout = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(buildUrl(params), {
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
      for (const key of ["url", "play_url", "playUrl", "pic", "cover", "data"]) {
        const value = extractUrl(payload[key]);
        if (value) return value;
      }
    }
    return "";
  };

  const normalizeCandidate = (raw, source) => {
    const id = String(raw?.id || raw?.url_id || raw?.urlId || raw?.songid || raw?.songId || "");
    const artist = artistText(raw?.artist || raw?.artists || raw?.author || raw?.singer);
    const albumValue = raw?.album;
    const album = typeof albumValue === "string" ? albumValue : albumValue?.name || raw?.albumName || "";
    const coverRaw = raw?.pic || raw?.cover || raw?.picUrl || raw?.albumPic || "";
    return {
      id,
      source,
      name: raw?.name || raw?.title || raw?.songName || "未知歌曲",
      artist,
      album,
      cover: /^https?:\/\//i.test(String(coverRaw || "")) ? String(coverRaw).replace(/^http:\/\//i, "https://") : "",
      urlId: String(raw?.url_id || raw?.urlId || id),
      picId: String(raw?.pic_id || raw?.picId || id),
    };
  };

  const score = (candidate, target) => {
    const cn = normalize(candidate?.name);
    const tn = normalize(target?.name);
    const ca = normalize(candidate?.artist);
    const ta = normalize(target?.artist);
    const cal = normalize(candidate?.album);
    const tal = normalize(target?.album);
    let value = 0;
    if (cn && cn === tn) value += 100;
    else if (cn && tn && (cn.includes(tn) || tn.includes(cn))) value += 55;
    if (ca && ta && ca === ta) value += 55;
    else if (ca && ta && (ca.includes(ta) || ta.includes(ca))) value += 30;
    if (cal && tal && (cal === tal || cal.includes(tal) || tal.includes(cal))) value += 12;
    return value;
  };

  const resolveUrl = async candidate => {
    if (!candidate?.urlId) return "";
    for (const br of BITRATES) {
      try {
        const payload = await request({ types: "url", source: candidate.source, id: candidate.urlId, br });
        const url = extractUrl(payload);
        if (url) return url;
      } catch (_) {}
    }
    return "";
  };

  const hydrateCover = async candidate => {
    if (candidate.cover) return candidate.cover;
    if (!candidate.picId) return "";
    try {
      return extractUrl(await request({ types: "pic", source: candidate.source, id: candidate.picId, size: 300 }));
    } catch (_) {
      return "";
    }
  };

  const resolveStoredId = async track => {
    const source = String(track?.server || track?.source || "").toLowerCase();
    const id = String(track?.__gdStudio?.urlId || track?.id || "");
    if (!id || !SOURCES.includes(source)) return null;
    const candidate = {
      id,
      source,
      name: track.name || "未知歌曲",
      artist: track.artist || "未知歌手",
      album: track.album || "",
      cover: track.cover || "",
      urlId: id,
      picId: String(track?.__gdStudio?.picId || track?.id || ""),
    };
    const url = await resolveUrl(candidate);
    if (!url) return null;
    return {
      url,
      cover: candidate.cover || await hydrateCover(candidate) || FALLBACK_COVER,
      source,
      id,
    };
  };

  const resolveTrack = async track => {
    const cached = getCached(track);
    if (cached) return cached;

    const query = `${track?.name || ""} ${track?.artist || ""}`.trim();
    if (query) {
      for (const source of SOURCES) {
        try {
          const payload = await request({ types: "search", source, name: query, count: 10, pages: 1 });
          const candidates = listFromPayload(payload)
            .map(raw => normalizeCandidate(raw, source))
            .filter(item => item.id)
            .sort((a, b) => score(b, track) - score(a, track));
          for (const candidate of candidates.slice(0, 4)) {
            if (score(candidate, track) < 70) continue;
            const url = await resolveUrl(candidate);
            if (!url) continue;
            const resolved = {
              url,
              cover: candidate.cover || await hydrateCover(candidate) || track.cover || FALLBACK_COVER,
              source,
              id: candidate.id,
            };
            setCached(track, resolved);
            return resolved;
          }
        } catch (error) {
          console.warn(`SmallJia nav music: ${source} resolve failed`, error);
        }
      }
    }

    const stored = await resolveStoredId(track);
    if (stored) {
      setCached(track, stored);
      return stored;
    }
    return null;
  };

  const notify = message => {
    try {
      if (window.anzhiyu?.snackbarShow) window.anzhiyu.snackbarShow(message, false, 2500);
      else console.info(message);
    } catch (_) {}
  };

  const updateAudio = (index, resolved) => {
    const ap = state.aplayer;
    const audio = ap?.list?.audios?.[index];
    const track = state.tracks[index];
    if (!audio || !track || !resolved?.url) return false;
    audio.name = track.name || audio.name;
    audio.artist = track.artist || audio.artist;
    audio.url = resolved.url;
    audio.cover = resolved.cover || track.cover || audio.cover || FALLBACK_COVER;
    audio.__smallJiaResolved = true;
    audio.__smallJiaSource = resolved.source || "";
    return true;
  };

  const switchTo = async (index, shouldPlay) => {
    const ap = state.aplayer;
    if (!ap || !state.originalSwitch || !state.tracks.length) return;
    const normalizedIndex = ((Number(index) || 0) % state.tracks.length + state.tracks.length) % state.tracks.length;
    const audio = ap.list?.audios?.[normalizedIndex];
    if (audio?.__smallJiaResolved && audio.url && audio.url !== SILENT_URL) {
      state.originalSwitch(normalizedIndex);
      if (shouldPlay) setTimeout(() => ap.play?.(), 0);
      return;
    }

    if (state.resolving.has(normalizedIndex)) {
      if (shouldPlay) state.resolving.get(normalizedIndex).wantPlay = true;
      return;
    }

    const token = { wantPlay: !!shouldPlay };
    state.resolving.set(normalizedIndex, token);
    const track = state.tracks[normalizedIndex];
    try {
      const resolved = await resolveTrack(track);
      if (!resolved || !updateAudio(normalizedIndex, resolved)) {
        notify(`「${track?.name || "这首歌"}」暂时没有找到可播放版本`);
        return;
      }
      state.originalSwitch(normalizedIndex);
      if (token.wantPlay) setTimeout(() => ap.play?.(), 0);
    } catch (error) {
      console.warn("SmallJia nav music: resolve track failed", error);
      notify(`「${track?.name || "这首歌"}」解析失败，请稍后再试`);
    } finally {
      state.resolving.delete(normalizedIndex);
    }
  };

  const patchSwitch = ap => {
    if (!ap?.list || state.aplayer === ap && state.originalSwitch) return;
    state.aplayer = ap;
    state.originalSwitch = ap.list.switch.bind(ap.list);
    ap.list.switch = function (index) {
      const shouldPlay = !!(window.anzhiyu_musicPlaying || (ap.audio && !ap.audio.paused));
      switchTo(index, shouldPlay);
    };
  };

  const applyDaily = (ap, playlist) => {
    if (!ap?.list || !playlist?.tracks?.length) return false;
    const signature = playlistSignature(playlist);
    if (state.installed && state.aplayer === ap && state.signature === signature) return true;

    patchSwitch(ap);
    state.tracks = playlist.tracks.map(track => ({ ...track, __gdStudio: track?.__gdStudio ? { ...track.__gdStudio } : undefined }));
    state.signature = signature;
    state.resolving.clear();

    const wasPlaying = !!(window.anzhiyu_musicPlaying || (ap.audio && !ap.audio.paused));
    try { ap.pause?.(); } catch (_) {}
    try { ap.list.clear?.(); } catch (error) { console.warn("SmallJia nav music: clear list failed", error); }

    const audios = state.tracks.map(track => ({
      name: track.name || "未知歌曲",
      artist: track.artist || "未知歌手",
      url: SILENT_URL,
      cover: /^https?:\/\//i.test(String(track.cover || "")) ? track.cover : FALLBACK_COVER,
      lrc: "",
      __smallJiaDaily: true,
    }));

    try {
      ap.list.add(audios);
      state.installed = true;
      const startIndex = Math.floor(Math.random() * state.tracks.length);
      switchTo(startIndex, wasPlaying);
      const tips = document.getElementById("nav-music-hoverTips");
      if (tips && !window.anzhiyu_musicPlaying) tips.textContent = `日常 · ${state.tracks.length} 首`;
      console.info(`SmallJia nav music: 已接管为「日常」歌单，共 ${state.tracks.length} 首`);
      return true;
    } catch (error) {
      console.warn("SmallJia nav music: install daily list failed", error);
      return false;
    }
  };

  const findAPlayer = () => document.querySelector("#nav-music meting-js")?.aplayer || null;

  const sync = () => {
    const playlist = readDaily();
    if (!playlist) return false;
    const ap = findAPlayer();
    if (!ap?.list?.audios) return false;
    return applyDaily(ap, playlist);
  };

  const boot = () => {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (sync() || attempts > 200) clearInterval(timer);
    }, 100);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", () => setTimeout(sync, 50));
  window.addEventListener("storage", event => {
    if (event.key === PLAYLIST_KEY) setTimeout(sync, 0);
  });

  setInterval(() => {
    const playlist = readDaily();
    if (!playlist) return;
    if (playlistSignature(playlist) !== state.signature || findAPlayer() !== state.aplayer) sync();
  }, 3000);
})();
