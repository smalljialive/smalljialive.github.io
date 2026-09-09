(function () {
  "use strict";

  const STORAGE = {
    favorites: "smalljia_music_favorites_v1",
    recent: "smalljia_music_recent_v1",
    state: "smalljia_music_player_state_v1",
  };
  const RECENT_LIMIT = 50;
  const SEARCH_LIMIT = 20;
  const FALLBACK_COVER = "/img/favicon.ico";

  let searchTimer = null;
  let searchSequence = 0;

  const readStorage = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn("SmallJia Music: failed to read storage", error);
      return fallback;
    }
  };

  const writeStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("SmallJia Music: failed to write storage", error);
    }
  };

  const artistText = value => {
    if (Array.isArray(value)) return value.filter(Boolean).join(" / ");
    if (value && typeof value === "object") {
      if (Array.isArray(value.artist)) return value.artist.filter(Boolean).join(" / ");
      return value.name || value.artist || "未知歌手";
    }
    return value || "未知歌手";
  };

  const normalizeApiList = payload => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload.result)) return payload.result;
    if (payload.result && Array.isArray(payload.result.songs)) return payload.result.songs;
    return [];
  };

  const normalizeTrack = (raw = {}, fallbackIndex = -1) => {
    const id = String(raw.smalljiaId || raw.id || raw.songid || raw.songId || raw.url_id || "");
    const server = String(raw.smalljiaServer || raw.server || raw.source || "netease");
    const name = raw.name || raw.title || raw.songName || "未知歌曲";
    const artist = artistText(raw.artist || raw.author || raw.artists || raw.singer);
    const albumValue = raw.album;
    const album = typeof albumValue === "string" ? albumValue : albumValue?.name || raw.albumName || "";
    const cover = raw.cover || raw.pic || raw.picUrl || raw.albumPic || raw.img || "";
    const url = raw.url || raw.src || "";
    const lrc = raw.lrc || raw.lyric || raw.lyrics || "";
    const picId = String(raw.pic_id || raw.picId || "");
    const lyricId = String(raw.lyric_id || raw.lyricId || "");
    const key = id ? `${server}:${id}` : `${name}::${artist}`.toLowerCase();

    return {
      id,
      server,
      name,
      artist,
      album,
      cover,
      url,
      lrc,
      picId,
      lyricId,
      key,
      index: fallbackIndex,
    };
  };

  const serializeTrack = track => ({
    id: track.id || "",
    server: track.server || "netease",
    name: track.name || "未知歌曲",
    artist: track.artist || "未知歌手",
    album: track.album || "",
    cover: track.cover || "",
    url: track.url || "",
    lrc: track.lrc || "",
    picId: track.picId || "",
    lyricId: track.lyricId || "",
    key: track.key || `${track.name}::${track.artist}`.toLowerCase(),
  });

  const formatTime = seconds => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const parseLrc = text => {
    if (!text || typeof text !== "string") return [];
    const lines = [];
    const timeReg = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g;
    text.split(/\r?\n/).forEach(line => {
      const content = line.replace(timeReg, "").trim();
      let match;
      timeReg.lastIndex = 0;
      while ((match = timeReg.exec(line)) !== null) {
        const time = Number(match[1]) * 60 + Number(match[2]);
        if (Number.isFinite(time) && content) lines.push({ time, text: content });
      }
    });
    return lines.sort((a, b) => a.time - b.time);
  };

  const metingUrl = (server, type, id, extra = {}) => {
    const template = window.meting_api || "https://meting-api-omega.vercel.app/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
    const nonce = Math.random().toString(36).slice(2);
    const resolved = template
      .replace(":server", encodeURIComponent(server || "netease"))
      .replace(":type", encodeURIComponent(type))
      .replace(":id", encodeURIComponent(id))
      .replace(":auth", "")
      .replace(":r", nonce);
    const url = new URL(resolved, window.location.href);
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    return url.toString();
  };

  const fetchJson = async url => {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  };

  const extractString = payload => {
    if (!payload) return "";
    if (typeof payload === "string") return payload;
    if (Array.isArray(payload)) return extractString(payload[0]);
    if (typeof payload === "object") {
      for (const key of ["url", "pic", "lrc", "lyric"]) {
        if (typeof payload[key] === "string" && payload[key]) return payload[key];
      }
      if (payload.data !== undefined) return extractString(payload.data);
      return "";
    }
    return "";
  };

  const fetchTextValue = async url => {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    try {
      return extractString(JSON.parse(text)) || text;
    } catch (_) {
      return text;
    }
  };

  const resolveMediaUrl = async url => {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("audio") || contentType.includes("video") || contentType.includes("octet-stream")) {
      return response.url || url;
    }
    const text = await response.text();
    try {
      const extracted = extractString(JSON.parse(text));
      if (extracted) return extracted;
    } catch (_) {}
    const trimmed = text.trim().replace(/^"|"$/g, "");
    if (/^https?:/i.test(trimmed)) return trimmed;
    return response.url !== url ? response.url : "";
  };

  const resolveSearchTrack = async track => {
    if (track.url && /^https?:/i.test(track.url)) return track;

    try {
      const detailPayload = await fetchJson(metingUrl(track.server, "song", track.id));
      const detail = normalizeApiList(detailPayload)[0];
      if (detail) {
        const normalized = normalizeTrack({
          ...detail,
          id: track.id || detail.id,
          server: track.server,
          smalljiaId: track.id,
          smalljiaServer: track.server,
        });
        if (normalized.url) return { ...track, ...normalized, key: track.key || normalized.key };
      }
    } catch (error) {
      console.warn("SmallJia Music: song detail lookup failed", error);
    }

    const urlEndpoint = metingUrl(track.server, "url", track.id);
    let resolvedUrl = track.url;
    try {
      resolvedUrl = resolvedUrl || await resolveMediaUrl(urlEndpoint);
    } catch (error) {
      console.warn("SmallJia Music: media URL lookup failed", error);
    }
    return {
      ...track,
      url: resolvedUrl |