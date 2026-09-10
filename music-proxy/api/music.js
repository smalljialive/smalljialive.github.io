import crypto from "node:crypto";

const LEGACY_UPSTREAM = "https://music-api.gdstudio.xyz/api.php";
const CURRENT_HOST = "music.gdstudio.xyz";
const CURRENT_BASE = `https://${CURRENT_HOST}/`;
const CURRENT_API = `${CURRENT_BASE}api.php`;
const CURRENT_TIME = `${CURRENT_BASE}time`;
const CURRENT_VERSION = "2026.08.01";
const ALLOWED_TYPES = new Set(["search", "url", "lyric", "pic", "playlist", "song", "album"]);
const ALLOWED_SOURCES = new Set(["netease", "kuwo", "tencent", "joox", "tidal", "qobuz", "apple", "bilibili", "ytmusic", "spotify"]);
const LEGACY_FALLBACK_SOURCES = new Set(["netease", "kuwo"]);
const ALLOWED_ORIGINS = new Set([
  "https://smalljialive.github.io",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
]);

function setCors(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeVersion(version) {
  return String(version).split(".").map(part => part.length === 1 ? `0${part}` : part).join("");
}

function strictEncode(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function makeSign(payload, serverTime) {
  const text = `${String(serverTime).slice(0, 9)}|${CURRENT_HOST}|${normalizeVersion(CURRENT_VERSION)}|${payload}`;
  return crypto.createHash("md5").update(text, "utf8").digest("hex").slice(-8).toUpperCase();
}

async function fetchWithTimeout(url, options = {}, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

async function getServerTime() {
  try {
    const response = await fetchWithTimeout(CURRENT_TIME, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    }, 5000);
    if (response.ok) {
      const text = (await response.text()).trim();
      if (text) return text;
    }
  } catch (_) {}
  return String(Math.floor(Date.now() / 1000));
}

function signPayloadFor(type, query) {
  if (type === "search") return strictEncode(query.name || "");
  return strictEncode(query.id || "");
}

async function callCurrent(query) {
  const type = query.types;
  const serverTime = await getServerTime();
  const form = new URLSearchParams();
  for (const key of ["types", "source", "name", "id", "count", "pages", "br", "size"]) {
    const value = query[key];
    if (value !== undefined && value !== null && value !== "") form.set(key, String(value));
  }
  form.set("s", makeSign(signPayloadFor(type, query), serverTime));

  return fetchWithTimeout(CURRENT_API, {
    method: "POST",
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Origin: CURRENT_BASE.slice(0, -1),
      Referer: CURRENT_BASE,
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    },
    body: form.toString(),
    cache: "no-store",
  }, 12000);
}

async function callLegacy(query) {
  const url = new URL(LEGACY_UPSTREAM);
  for (const key of ["types", "source", "name", "id", "count", "pages", "br", "size"]) {
    const value = query[key];
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return fetchWithTimeout(url.toString(), {
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "SmallJia-Music-Proxy/2.0",
    },
    cache: "no-store",
  }, 12000);
}

async function readResponse(response) {
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { response, text, json };
}

function usefulPayload(type, json, text) {
  if (!text) return false;
  if (type === "search") {
    if (Array.isArray(json)) return json.length > 0;
    if (Array.isArray(json?.data)) return json.data.length > 0;
    if (Array.isArray(json?.result)) return json.result.length > 0;
  }
  if (type === "url") return Boolean(json?.url || json?.data?.url || (typeof json?.data === "string" && /^https?:\/\//i.test(json.data)));
  return true;
}

function normalizeCurrentPayload(type, json) {
  if (!json || typeof json !== "object" || type !== "url") return json;
  const clone = Array.isArray(json) ? json : { ...json };
  if (!Array.isArray(clone) && typeof clone.url === "string" && clone.url && !/^https?:\/\//i.test(clone.url)) {
    clone.url = new URL(clone.url, CURRENT_BASE).toString();
  }
  if (!Array.isArray(clone) && typeof clone.url === "string" && /^https?:\/\//i.test(clone.url)) {
    clone.fallback_url = `https://music-proxy.gdstudio.org/${clone.url}`;
  }
  return clone;
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  const query = {
    types: String(first(req.query.types) || "").toLowerCase(),
    source: String(first(req.query.source) || "netease").toLowerCase(),
    name: first(req.query.name),
    id: first(req.query.id),
    count: first(req.query.count),
    pages: first(req.query.pages),
    br: first(req.query.br),
    size: first(req.query.size),
  };

  if (!ALLOWED_TYPES.has(query.types)) return res.status(400).json({ error: "INVALID_TYPE" });
  const sources = query.source.split(",").map(item => item.trim()).filter(Boolean);
  if (!sources.length || sources.some(item => !ALLOWED_SOURCES.has(item))) return res.status(400).json({ error: "INVALID_SOURCE" });

  try {
    let current = null;
    try {
      current = await readResponse(await callCurrent(query));
      if (current.response.ok && usefulPayload(query.types, current.json, current.text)) {
        const payload = normalizeCurrentPayload(query.types, current.json);
        res.setHeader("Cache-Control", query.types === "url" ? "no-store" : "public, max-age=20, s-maxage=60");
        res.setHeader("X-SmallJia-Music-Route", "gdstudio-signed");
        return res.status(current.response.status).json(payload ?? current.text);
      }
    } catch (_) {}

    if (sources.length === 1 && LEGACY_FALLBACK_SOURCES.has(query.source)) {
      const legacy = await readResponse(await callLegacy(query));
      res.setHeader("Cache-Control", query.types === "url" ? "no-store" : "public, max-age=20, s-maxage=60");
      res.setHeader("X-SmallJia-Music-Route", "gdstudio-legacy");
      res.status(legacy.response.status);
      res.setHeader("Content-Type", legacy.response.headers.get("content-type") || "application/json; charset=utf-8");
      return res.send(legacy.text);
    }

    const status = current?.response?.status || 502;
    return res.status(status).json({ error: "GDSTUDIO_SOURCE_UNAVAILABLE", source: query.source, type: query.types });
  } catch (error) {
    const timeout = error?.name === "AbortError";
    return res.status(timeout ? 504 : 502).json({ error: timeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE" });
  }
}
