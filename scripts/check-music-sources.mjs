const API = 'https://music-api.gdstudio.xyz/api.php';
const QUERY = '周杰伦 雨下一整晚';
const SOURCES = ['netease', 'kuwo', 'tencent', 'kugou'];
const QUALITIES = [999, 740, 320, 192, 128];

const normalize = value => String(value || '')
  .normalize('NFKC')
  .toLowerCase()
  .replace(/[\s·•・'’"“”‘’《》〈〉【】\[\]()（）{}<>:：,，.。!！?？/\\|_-]+/g, '');

const artistText = value => {
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : item?.name || '').filter(Boolean).join(' / ');
  if (value && typeof value === 'object') return value.name || value.artist || '';
  return String(value || '');
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
  if (!payload) return '';
  if (typeof payload === 'string') {
    const value = payload.trim().replace(/^"|"$/g, '');
    return /^https?:\/\//i.test(value) ? value : '';
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const url = extractUrl(item);
      if (url) return url;
    }
    return '';
  }
  if (typeof payload === 'object') {
    for (const key of ['url', 'play_url', 'playUrl', 'data']) {
      const url = extractUrl(payload[key]);
      if (url) return url;
    }
  }
  return '';
};

async function getJson(url, timeout = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'SmallJia-Music-Diagnostics/1.0',
      },
    });
    const text = await response.text();
    let data = text;
    try { data = JSON.parse(text); } catch (_) {}
    return { status: response.status, ok: response.ok, data, text };
  } finally {
    clearTimeout(timer);
  }
}

async function probeMedia(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Range: 'bytes=0-1023',
        'User-Agent': 'Mozilla/5.0',
      },
    });
    return {
      status: response.status,
      ok: response.ok || response.status === 206,
      finalUrl: response.url,
      contentType: response.headers.get('content-type') || '',
      contentLength: response.headers.get('content-length') || '',
      acceptRanges: response.headers.get('accept-ranges') || '',
    };
  } catch (error) {
    return { status: 0, ok: false, error: `${error.name}: ${error.message}` };
  } finally {
    clearTimeout(timer);
  }
}

for (const source of SOURCES) {
  console.log(`\n=== ${source} ===`);
  try {
    const searchUrl = new URL(API);
    searchUrl.searchParams.set('types', 'search');
    searchUrl.searchParams.set('source', source);
    searchUrl.searchParams.set('name', QUERY);
    searchUrl.searchParams.set('count', '10');
    searchUrl.searchParams.set('pages', '1');
    const search = await getJson(searchUrl);
    const list = listFromPayload(search.data);
    console.log(`search HTTP=${search.status} results=${list.length}`);
    if (!list.length) {
      console.log(`search body=${String(search.text).slice(0, 240).replace(/\s+/g, ' ')}`);
      continue;
    }

    const scored = list.map(raw => {
      const name = raw?.name || raw?.title || raw?.songName || '';
      const artist = artistText(raw?.artist || raw?.artists || raw?.author || raw?.singer);
      let score = 0;
      if (normalize(name) === normalize('雨下一整晚')) score += 100;
      if (normalize(artist).includes(normalize('周杰伦'))) score += 60;
      return { raw, name, artist, score };
    }).sort((a, b) => b.score - a.score);
    const best = scored[0];
    const raw = best.raw;
    const id = String(raw?.url_id || raw?.urlId || raw?.id || raw?.songid || raw?.songId || '');
    console.log(`best score=${best.score} name=${best.name} artist=${best.artist} id=${id}`);
    if (!id) continue;

    let playable = false;
    for (const br of QUALITIES) {
      const urlReq = new URL(API);
      urlReq.searchParams.set('types', 'url');
      urlReq.searchParams.set('source', source);
      urlReq.searchParams.set('id', id);
      urlReq.searchParams.set('br', String(br));
      const resolved = await getJson(urlReq);
      const mediaUrl = extractUrl(resolved.data);
      console.log(`url br=${br} HTTP=${resolved.status} hasUrl=${Boolean(mediaUrl)}`);
      if (!mediaUrl) continue;
      const parsed = new URL(mediaUrl);
      console.log(`media protocol=${parsed.protocol} host=${parsed.host}`);
      const probe = await probeMedia(mediaUrl);
      console.log(`media probe status=${probe.status} ok=${probe.ok} type=${probe.contentType || '-'} length=${probe.contentLength || '-'} ranges=${probe.acceptRanges || '-'}${probe.error ? ` error=${probe.error}` : ''}`);
      if (probe.ok) {
        playable = true;
        break;
      }
    }
    console.log(`playable=${playable}`);
  } catch (error) {
    console.log(`fatal ${error.name}: ${error.message}`);
  }
}
