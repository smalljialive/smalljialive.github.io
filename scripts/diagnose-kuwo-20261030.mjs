// Diagnostic only: no audio is downloaded and no production endpoint is changed.
const keyword = "周杰伦";
const encoded = encodeURIComponent(keyword);
const endpoints = [
  ["kuwo-search-pc", `https://search.kuwo.cn/r.s?pn=0&rn=5&all=${encoded}&ft=music&rformat=json&encoding=utf8&pcjson=1`],
  ["kuwo-search-web", `https://www.kuwo.cn/api/www/search/searchMusicBykeyWord?key=${encoded}&pn=1&rn=5&httpsStatus=1`],
  ["kuwo-search-root", `https://kuwo.cn/api/www/search/searchMusicBykeyWord?key=${encoded}&pn=1&rn=5&httpsStatus=1`],
  ["kuwo-search-m", `https://m.kuwo.cn/newh5/singles/search?key=${encoded}&pn=1&rn=5`],
  ["kuwo-search-http", `http://search.kuwo.cn/r.s?pn=0&rn=5&all=${encoded}&ft=music&rformat=json&encoding=utf8&pcjson=1`],
  ["gd-legacy-kuwo", `https://music-api.gdstudio.xyz/api.php?types=search&source=kuwo&name=${encoded}&count=5&pages=1`],
  ["vercel-kuwo", `https://smalljia-music-proxy-small-jias-projects.vercel.app/api/music?types=search&source=kuwo&name=${encoded}&count=5&pages=1`],
  ["supabase-kuwo", `https://yluidpgnvfurcomnexjr.supabase.co/functions/v1/music-proxy?types=search&source=kuwo&name=${encoded}&count=5&pages=1`],
];
const getCount = (data, raw) => {
  const list = Array.isArray(data) ? data : data?.abslist || data?.data?.list || data?.data || data?.result || data?.songs;
  if (Array.isArray(list)) return list.length;
  const ids = raw.match(/MUSICRID|SONGNAME|\\\"rid\\\"|\\\"musicrid\\\"/gi);
  return ids?.length || 0;
};
async function probe([name,url]) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { Accept: "application/json, text/plain, */*", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36", Referer: "https://www.kuwo.cn/" },
    });
    const raw = (await response.text()).slice(0, 300000);
    let json;
    try { json = JSON.parse(raw); } catch {}
    const list = Array.isArray(json) ? json : json?.abslist || json?.data?.list || json?.data || json?.result || json?.songs;
    const first = Array.isArray(list) ? list[0] : null;
    const id = String(first?.MUSICRID || first?.rid || first?.id || "");
    return { name, status: response.status, count: getCount(json, raw), type: response.headers.get("content-type"), id, snippet: raw.replace(/\\s+/g," ").slice(0,160) };
  } catch (e) {
    return { name, status: "-", count: 0, error: e?.name + ": " + e?.message };
  } finally { clearTimeout(timer); }
}
const results = await Promise.all(endpoints.map(probe));
for (const r of results) console.log(JSON.stringify(r));
const lines = ["### Kuwo provider diagnostics", "| Provider | HTTP | Results | First ID |", "|---|---:|---:|---|"];
for(const r of results) lines.push(`| ${r.name} | ${r.status} | ${r.count} | ${r.id || "-"} |`);
if (process.env.GITHUB_STEP_SUMMARY) (await import("node:fs")).appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n")+"\n");
