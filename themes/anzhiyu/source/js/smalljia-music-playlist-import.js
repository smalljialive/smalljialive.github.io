(function () {
  "use strict";

  const LOADED_KEY = "__smallJiaPlaylistImportLoaded";
  const DIRECT_API = "https://music-api.gdstudio.xyz/api.php";
  const PROXY_API = "https://smalljia-music-proxy-small-jias-projects.vercel.app/api/music";
  const IMPORT_LIMIT = 1000;
  const MATCH_SOURCES = ["netease", "tencent", "kuwo"];

  if (window[LOADED_KEY]) return;
  window[LOADED_KEY] = true;

  const esc = value => String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));

  const normalizeText = value => String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, "");

  const artistText = value => {
    if (Array.isArray(value)) return value.map(item => typeof item === "string" ? item : item?.name || "").filter(Boolean).join(" / ") || "未知歌手";
    if (value && typeof value === "object") return value.name || value.artist || value.singername || "未知歌手";
    return String(value || "未知歌手");
  };

  const listFromPayload = payload => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    for (const value of [payload.data, payload.result, payload.songs, payload.tracks, payload?.data?.data, payload?.data?.songs, payload?.data?.tracks, payload?.result?.songs, payload?.result?.tracks, payload?.playlist?.tracks, payload?.playlist?.songs]) {
      if (Array.isArray(value)) return value;
    }
    return [];
  };

  const normalizeTrack = (raw = {}, sourceFallback = "netease") => {
    const source = String(raw.source || raw.server || sourceFallback || "netease").toLowerCase();
    const id = String(raw.id || raw.url_id || raw.urlId || raw.songid || raw.songId || raw.mid || raw.songmid || raw.audio_id || "");
    const urlId = String(raw.url_id || raw.urlId || raw.mid || raw.songmid || id);
    const lyricId = String(raw.lyric_id || raw.lyricId || id);
    const picId = String(raw.pic_id || raw.picId || raw.album?.mid || raw.albummid || id);
    const name = raw.name || raw.title || raw.songName || raw.songname || raw.filename || "未知歌曲";
    const artist = artistText(raw.artist || raw.artists || raw.author || raw.singer || raw.singername);
    const albumValue = raw.album;
    const album = typeof albumValue === "string" ? albumValue : albumValue?.name || raw.albumName || raw.albumname || "";
    const coverRaw = raw.cover || raw.pic || raw.picUrl || raw.albumPic || raw.imgurl || "";
    const cover = /^https?:\/\//i.test(coverRaw) ? String(coverRaw).replace(/^http:\/\//i, "https://") : "";
    const key = id ? `${source}:${id}` : `${name}::${artist}`.toLowerCase();
    return { id, server: source, source, name, artist, album, cover, url: /^https?:\/\//i.test(raw.url || "") ? raw.url : "", lrc: raw.lrc || raw.lyric || "", key, __gdStudio: { source, urlId, lyricId, picId } };
  };

  const sameTrack = (a, b) => {
    if (!a || !b) return false;
    if (a.id && b.id && String(a.id) === String(b.id) && String(a.source || a.server) === String(b.source || b.server)) return true;
    return normalizeText(a.name) === normalizeText(b.name) && normalizeText(a.artist) === normalizeText(b.artist);
  };

  const dedupe = tracks => {
    const result = [];
    for (const track of tracks) if (!result.some(item => sameTrack(item, track))) result.push(track);
    return result;
  };

  const buildUrl = (base, params) => {
    const url = new URL(base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });
    return url.toString();
  };

  const requestAt = async (base, params, timeout = 12000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(buildUrl(base, params), { signal: controller.signal, credentials: "omit", cache: "no-store", headers: { Accept: "application/json, text/plain, */*" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      try { return JSON.parse(text); } catch (_) { return text; }
    } finally { clearTimeout(timer); }
  };

  const requestMusic = async params => {
    try { return await requestAt(DIRECT_API, params); }
    catch (_) { return requestAt(PROXY_API, params); }
  };

  const extractUrl = text => {
    const match = String(text || "").match(/https?:\/\/[^\s<>'"，。；;]+/i);
    return match ? match[0].replace(/[)）\]】]+$/, "") : "";
  };

  const getQueryId = (url, keys) => {
    for (const key of keys) {
      const value = url.searchParams.get(key);
      if (value && /^[A-Za-z0-9_-]{2,128}$/.test(value)) return value;
    }
    return "";
  };

  const detectPlaylist = input => {
    const raw = String(input || "").trim();
    const urlText = extractUrl(raw) || (/^https?:\/\//i.test(raw) ? raw : "");
    if (!urlText) return { platform: "", label: "", id: "", url: "", error: "请粘贴歌单分享链接或完整分享文本。" };
    let url;
    try { url = new URL(urlText); } catch (_) { return { platform: "", label: "", id: "", url: urlText, error: "没有识别到有效的歌单链接。" }; }
    const host = url.hostname.toLowerCase();
    const path = decodeURIComponent(url.pathname || "");
    const hash = decodeURIComponent(url.hash || "");

    if (host.includes("music.163.com") || host.includes("163cn.tv")) {
      const combined = `${url.search} ${hash} ${path}`;
      const id = getQueryId(url, ["id", "playlistId"]) || combined.match(/(?:playlist(?:\/|\?id=)|id=)(\d{3,})/i)?.[1] || "";
      return { platform: "netease", label: "网易云音乐", id, url: urlText, error: id ? "" : "没有从网易云链接中识别到歌单 ID；若是 163cn.tv 短链接，请先在浏览器打开后复制最终地址。" };
    }

    if (host.includes("qq.com") && (host.includes("y.qq.com") || host.includes("i.y.qq.com") || host.includes("c.y.qq.com"))) {
      const combined = `${url.search} ${hash} ${path}`;
      const id = getQueryId(url, ["id", "dissid", "dissId", "playlistid", "playlistId", "songlistid", "songlistId"]) || combined.match(/(?:playlist\/|dissid=|playlistid=|songlistid=)(\d{3,})/i)?.[1] || "";
      return { platform: "tencent", label: "QQ音乐", id, url: urlText, error: id ? "" : "没有从 QQ 音乐链接中识别到歌单 ID。" };
    }

    if (host.includes("kugou.com") || host.includes("kugoo.com")) {
      const combined = `${url.search} ${hash} ${path}`;
      const id = getQueryId(url, ["specialid", "specialId", "id"]) || combined.match(/(?:special\/single\/|plist\/list\/|specialid=)(\d{2,})/i)?.[1] || "";
      const gcid = combined.match(/(gcid_[A-Za-z0-9_-]+)/i)?.[1] || "";
      return { platform: "kugou", label: "酷狗音乐", id, gcid, url: urlText, error: id || gcid ? "" : "没有从酷狗链接中识别到歌单信息。" };
    }
    return { platform: "", label: "", id: "", url: urlText, error: "目前支持网易云音乐、QQ音乐和酷狗音乐歌单。" };
  };

  const playlistNameFromPayload = (payload, fallback) => {
    const values = [payload?.name, payload?.title, payload?.playlist?.name, payload?.playlist?.title, payload?.data?.name, payload?.data?.title, payload?.result?.name, payload?.result?.title, payload?.dissname, payload?.data?.dissname];
    return String(values.find(value => typeof value === "string" && value.trim()) || fallback).trim().slice(0, 60);
  };

  const loadStandardPlaylist = async parsed => {
    const payload = await requestMusic({ types: "playlist", source: parsed.platform, id: parsed.id });
    const rows = listFromPayload(payload);
    const tracks = rows.map(row => normalizeTrack({ ...row, source: row.source || parsed.platform }, parsed.platform)).filter(track => track.id && track.name);
    if (!tracks.length) throw new Error("接口返回的歌单中没有可导入歌曲。请确认这是公开或可通过分享链接访问的歌单。");
    return { name: playlistNameFromPayload(payload, `${parsed.label}导入歌单`), tracks: dedupe(tracks).slice(0, IMPORT_LIMIT), platform: parsed.platform, label: parsed.label, sourceUrl: parsed.url };
  };

  const cleanKugouName = value => {
    const text = String(value || "").trim();
    const parts = text.split(/\s+-\s+/);
    if (parts.length >= 2) return { artist: parts.shift().trim(), name: parts.join(" - ").trim() };
    return { artist: "", name: text };
  };

  const collectKugouRows = payload => {
    const arrays = [];
    const walk = (value, depth = 0) => {
      if (!value || depth > 5) return;
      if (Array.isArray(value)) {
        if (value.some(item => item && typeof item === "object" && (item.filename || item.songname || item.songName || item.hash || item.audio_id))) arrays.push(value);
        else value.forEach(item => walk(item, depth + 1));
        return;
      }
      if (typeof value === "object") Object.values(value).forEach(item => walk(item, depth + 1));
    };
    walk(payload);
    return arrays.sort((a, b) => b.length - a.length)[0] || [];
  };

  const fetchText = async (url, timeout = 12000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: "omit", cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    } finally { clearTimeout(timer); }
  };

  const resolveKugouSpecialId = async parsed => {
    if (parsed.id) return parsed.id;
    if (!parsed.gcid) return "";
    const html = await fetchText(parsed.url);
    return html.match(/(?:"specialid"\s*:\s*|specialid[=:"'\s]+)(\d{2,})/i)?.[1] || "";
  };

  const loadKugouRawPlaylist = async parsed => {
    const specialId = await resolveKugouSpecialId(parsed);
    if (!specialId) throw new Error("这个酷狗新式歌单链接没有直接暴露可读取的歌单 ID，可以在下方使用“批量粘贴歌曲列表”一次导入。");
    const text = await fetchText(`https://m.kugou.com/plist/list/${encodeURIComponent(specialId)}?json=true`);
    let payload;
    try { payload = JSON.parse(text); } catch (_) { throw new Error("浏览器没有成功读取酷狗歌单，可以改用下方的批量歌曲列表导入。"); }
    const rows = collectKugouRows(payload);
    const tracks = rows.map(row => {
      const split = cleanKugouName(row.filename || row.songname || row.songName || row.name || "");
      return { name: row.songname || row.songName || split.name, artist: row.singername || row.singerName || split.artist || "未知歌手", album: row.album_name || row.albumName || "" };
    }).filter(track => track.name);
    if (!tracks.length) throw new Error("没有从酷狗歌单中读取到歌曲，可以改用下方的批量歌曲列表导入。");
    const name = String(payload?.list?.info?.specialname || payload?.list?.specialname || "酷狗导入歌单").slice(0, 60);
    return { name, tracks: dedupe(tracks).slice(0, IMPORT_LIMIT), platform: "kugou", label: "酷狗音乐", sourceUrl: parsed.url, requiresMatch: true };
  };

  const scoreMatch = (candidate, target) => {
    const name = normalizeText(candidate.name);
    const wantedName = normalizeText(target.name);
    const artist = normalizeText(candidate.artist);
    const wantedArtist = normalizeText(target.artist);
    let score = 0;
    if (name === wantedName) score += 70;
    else if (name.includes(wantedName) || wantedName.includes(name)) score += 42;
    if (wantedArtist && artist === wantedArtist) score += 35;
    else if (wantedArtist && (artist.includes(wantedArtist) || wantedArtist.includes(artist))) score += 20;
    return score;
  };

  const matchOneTrack = async target => {
    const query = `${target.name || ""} ${target.artist || ""}`.trim();
    if (!query) return null;
    let best = null;
    let bestScore = 0;
    for (const source of MATCH_SOURCES) {
      try {
        const payload = await requestMusic({ types: "search", source, name: query, count: 12, pages: 1 });
        for (const row of listFromPayload(payload)) {
          const candidate = normalizeTrack({ ...row, source: row.source || source }, source);
          const score = scoreMatch(candidate, target);
          if (score > bestScore) { best = candidate; bestScore = score; }
        }
      } catch (_) {}
      if (bestScore >= 90) break;
    }
    return bestScore >= 55 ? best : null;
  };

  const mapLimit = async (items, limit, mapper) => {
    const results = new Array(items.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await mapper(items[index], index);
      }
    });
    await Promise.all(workers);
    return results;
  };

  const parseBulkText = value => {
    const lines = String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const tracks = [];
    for (const original of lines) {
      const line = original.replace(/^\s*\d+[.、)）\s]+/, "").trim();
      if (!line) continue;
      let name = line;
      let artist = "";
      let parts = line.split(/\s+-\s+|\s+—\s+|\s+–\s+/);
      if (parts.length >= 2) {
        const left = parts.shift().trim();
        const right = parts.join(" - ").trim();
        if (left && right) { name = left; artist = right; }
      } else {
        parts = line.split(/\t+/);
        if (parts.length >= 2) { name = parts[0].trim(); artist = parts.slice(1).join(" ").trim(); }
      }
      tracks.push({ name, artist: artist || "未知歌手", album: "" });
    }
    return dedupe(tracks).slice(0, IMPORT_LIMIT);
  };

  const renderPreviewRows = tracks => tracks.slice(0, 8).map((track, index) => `<div class="sjm-import-preview-row"><span>${String(index + 1).padStart(2, "0")}</span><strong>${esc(track.name)}</strong><em>${esc(track.artist || "未知歌手")}</em></div>`).join("");

  const install = lib => {
    if (!lib?.root || lib.__playlistImportInstalled) return false;
    lib.__playlistImportInstalled = true;
    const root = lib.root;
    const header = lib.dom?.playlistsView?.querySelector(".sjm-page-head") || root.querySelector('[data-sjm-view="playlists"] .sjm-page-head');
    const newButton = root.querySelector("#sjm-new-playlist");
    if (!header || !newButton) return false;

    let actionWrap = newButton.parentElement?.classList.contains("sjm-playlist-head-actions") ? newButton.parentElement : null;
    if (!actionWrap) {
      actionWrap = document.createElement("div");
      actionWrap.className = "sjm-playlist-head-actions";
      newButton.parentNode.insertBefore(actionWrap, newButton);
      actionWrap.appendChild(newButton);
    }

    const importButton = document.createElement("button");
    importButton.id = "sjm-import-playlist";
    importButton.className = "sjm-soft-button sjm-import-playlist-button";
    importButton.type = "button";
    importButton.textContent = "↓ 导入歌单";
    actionWrap.insertBefore(importButton, newButton);

    const modal = document.createElement("div");
    modal.id = "sjm-playlist-import-modal";
    modal.className = "sjm-playlist-import-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <button class="sjm-playlist-import-backdrop" type="button" data-sjm-import-close aria-label="关闭"></button>
      <section class="sjm-playlist-import-panel" role="dialog" aria-modal="true" aria-labelledby="sjm-playlist-import-title">
        <div class="sjm-playlist-import-head"><div><span class="sjm-eyebrow">IMPORT PLAYLIST</span><h3 id="sjm-playlist-import-title">导入外部歌单</h3><p>粘贴网易云、QQ音乐或酷狗的公开分享链接，不需要一首首添加。</p></div><button type="button" class="sjm-playlist-import-close" data-sjm-import-close aria-label="关闭">×</button></div>
        <div class="sjm-playlist-import-body">
          <label class="sjm-import-field"><span>歌单分享链接 / 完整分享文本</span><textarea id="sjm-import-share" rows="3" placeholder="例如：https://music.163.com/playlist?id=...&#10;也可以直接粘贴微信里复制出的整段分享文字"></textarea></label>
          <div class="sjm-import-provider-row"><span>自动识别：</span><b id="sjm-import-provider">等待输入</b><small>网易云 · QQ音乐 · 酷狗</small></div>
          <div class="sjm-import-actions"><button id="sjm-import-parse" class="sjm-discover-primary" type="button">解析歌单</button><span id="sjm-import-status">先粘贴歌单链接</span></div>
          <div id="sjm-import-preview" class="sjm-import-preview" hidden></div>
          <details class="sjm-import-bulk"><summary>酷狗链接无法读取？批量粘贴歌曲列表</summary><p>支持一次粘贴多行“歌曲名 - 歌手”，系统会自动在网易云 / QQ音乐 / 酷我中匹配，不需要逐首添加。</p><textarea id="sjm-import-bulk-text" rows="6" placeholder="晴天 - 周杰伦&#10;富士山下 - 陈奕迅&#10;遇见 - 孙燕姿"></textarea><button id="sjm-import-bulk-parse" class="sjm-soft-button" type="button">解析并匹配列表</button></details>
        </div>
        <div class="sjm-playlist-import-footer"><button type="button" class="sjm-soft-button" data-sjm-import-close>取消</button><button id="sjm-import-confirm" class="sjm-discover-primary" type="button" disabled>确认导入</button></div>
      </section>`;
    root.appendChild(modal);

    const share = modal.querySelector("#sjm-import-share");
    const provider = modal.querySelector("#sjm-import-provider");
    const parseButton = modal.querySelector("#sjm-import-parse");
    const status = modal.querySelector("#sjm-import-status");
    const preview = modal.querySelector("#sjm-import-preview");
    const confirm = modal.querySelector("#sjm-import-confirm");
    const bulkText = modal.querySelector("#sjm-import-bulk-text");
    const bulkParse = modal.querySelector("#sjm-import-bulk-parse");
    let pending = null;

    const setBusy = (busy, message) => {
      parseButton.disabled = busy;
      bulkParse.disabled = busy;
      confirm.disabled = busy || !pending?.tracks?.length;
      if (message) status.textContent = message;
    };

    const showPreview = data => {
      pending = data;
      preview.hidden = false;
      preview.innerHTML = `<div class="sjm-import-preview-head"><div><strong>${esc(data.name)}</strong><span>${esc(data.label || "外部歌单")} · ${data.tracks.length} 首可导入</span></div><em>${data.requiresMatch ? "已重新匹配" : "已解析"}</em></div>${renderPreviewRows(data.tracks)}${data.tracks.length > 8 ? `<p>还有 ${data.tracks.length - 8} 首歌曲将在导入时一起加入。</p>` : ""}`;
      confirm.disabled = !data.tracks.length;
      status.textContent = `解析完成：${data.tracks.length} 首歌曲`;
    };

    const matchTracks = async (rawTracks, name, label, sourceUrl) => {
      const total = rawTracks.length;
      let done = 0;
      let matched = 0;
      const results = await mapLimit(rawTracks, 4, async track => {
        const result = await matchOneTrack(track);
        done += 1;
        if (result) matched += 1;
        status.textContent = `正在跨音源匹配 ${done}/${total} · 已匹配 ${matched} 首`;
        return result;
      });
      const tracks = dedupe(results.filter(Boolean));
      if (!tracks.length) throw new Error("没有匹配到可播放歌曲，请检查歌曲名和歌手格式。");
      return { name, tracks, label, sourceUrl, requiresMatch: true, unmatched: total - tracks.length };
    };

    const parseShare = async () => {
      pending = null;
      preview.hidden = true;
      confirm.disabled = true;
      const parsed = detectPlaylist(share.value);
      provider.textContent = parsed.label || "未识别";
      if (parsed.error) { status.textContent = parsed.error; return; }
      setBusy(true, `正在读取${parsed.label}歌单…`);
      try {
        let data;
        if (parsed.platform === "kugou") {
          const raw = await loadKugouRawPlaylist(parsed);
          data = await matchTracks(raw.tracks, raw.name, raw.label, raw.sourceUrl);
        } else data = await loadStandardPlaylist(parsed);
        showPreview(data);
      } catch (error) {
        console.warn("SmallJia playlist import failed", error);
        status.textContent = error?.message || "歌单解析失败，请稍后再试。";
        lib.app?.showToast?.("歌单解析失败");
      } finally { setBusy(false); }
    };

    const parseBulk = async () => {
      pending = null;
      preview.hidden = true;
      confirm.disabled = true;
      const rawTracks = parseBulkText(bulkText.value);
      if (!rawTracks.length) { status.textContent = "请先粘贴歌曲列表，每行一首。"; return; }
      setBusy(true, `正在匹配 ${rawTracks.length} 首歌曲…`);
      try {
        const data = await matchTracks(rawTracks, "批量导入歌单", "跨音源批量匹配", "");
        showPreview(data);
        if (data.unmatched) status.textContent = `匹配完成：成功 ${data.tracks.length} 首，未匹配 ${data.unmatched} 首`;
      } catch (error) { status.textContent = error?.message || "批量匹配失败。"; }
      finally { setBusy(false); }
    };

    const close = () => {
      modal.classList.remove("active");
      setTimeout(() => { modal.hidden = true; }, 180);
    };

    const open = () => {
      pending = null;
      share.value = "";
      bulkText.value = "";
      provider.textContent = "等待输入";
      status.textContent = "先粘贴歌单链接";
      preview.hidden = true;
      confirm.disabled = true;
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add("active"));
      setTimeout(() => share.focus(), 120);
    };

    share.addEventListener("input", () => {
      const parsed = detectPlaylist(share.value);
      provider.textContent = parsed.label || (share.value.trim() ? "未识别" : "等待输入");
    });
    share.addEventListener("keydown", event => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") parseShare(); });
    importButton.addEventListener("click", open);
    modal.querySelectorAll("[data-sjm-import-close]").forEach(node => node.addEventListener("click", close));
    parseButton.addEventListener("click", parseShare);
    bulkParse.addEventListener("click", parseBulk);
    confirm.addEventListener("click", () => {
      if (!pending?.tracks?.length) return;
      const playlist = { id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: String(pending.name || "导入歌单").slice(0, 30), createdAt: Date.now(), importedAt: Date.now(), importSource: pending.label || "外部歌单", importUrl: pending.sourceUrl || "", tracks: pending.tracks.slice(0, IMPORT_LIMIT) };
      lib.playlists.unshift(playlist);
      lib.selectedPlaylistId = playlist.id;
      lib.savePlaylists?.();
      lib.renderPlaylists?.();
      close();
      lib.app?.showToast?.(`已导入「${playlist.name}」· ${playlist.tracks.length} 首`);
    });
    return true;
  };

  const boot = () => {
    if (!window.location.pathname.startsWith("/music/")) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const lib = window.SmallJiaMusicLibrary;
      if (lib?.app && lib?.dom?.playlistsView) { clearInterval(timer); install(lib); }
      if (attempts > 120) clearInterval(timer);
    }, 100);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else setTimeout(boot, 0);
  document.addEventListener("pjax:complete", boot);
})();
