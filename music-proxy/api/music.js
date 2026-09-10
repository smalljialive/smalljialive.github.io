const UPSTREAM = "https://music-api.gdstudio.xyz/api.php";
const ALLOWED_TYPES = new Set(["search", "url", "lyric", "pic", "playlist", "song", "album"]);
const ALLOWED_SOURCES = new Set(["netease", "kuwo", "tencent", "kugou", "migu", "joox", "tidal", "qobuz", "ytmusic", "deezer", "spotify"]);
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

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  const type = String(first(req.query.types) || "").toLowerCase();
  const source = String(first(req.query.source) || "netease").toLowerCase();

  if (!ALLOWED_TYPES.has(type)) return res.status(400).json({ error: "INVALID_TYPE" });

  const sources = source.split(",").map(item => item.trim()).filter(Boolean);
  if (!sources.length || sources.some(item => !ALLOWED_SOURCES.has(item))) {
    return res.status(400).json({ error: "INVALID_SOURCE" });
  }

  const upstream = new URL(UPSTREAM);
  const allowedParams = ["types", "source", "name", "id", "count", "pages", "br", "size"];
  for (const key of allowedParams) {
    const value = first(req.query[key]);
    if (value !== undefined && value !== null && value !== "") upstream.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(upstream.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "SmallJia-Music-Proxy/1.0",
      },
      redirect: "follow",
    });

    const body = await response.text();
    res.status(response.status);
    res.setHeader("Cache-Control", type === "url" ? "no-store" : "public, max-age=30, s-maxage=120");
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json; charset=utf-8");
    return res.send(body);
  } catch (error) {
    const timeout = error?.name === "AbortError";
    return res.status(timeout ? 504 : 502).json({
      error: timeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
    });
  } finally {
    clearTimeout(timer);
  }
}
