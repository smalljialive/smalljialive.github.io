# Meting Cloudflare Worker isolated experiment

This project uses `@meting/core@1.6.2` for experimental NetEase/Kuwo metadata and URL retrieval. It is **not connected to the public music player** and is not proof of rights or playable audio.

## Build and run locally

```sh
cd workers/meting-experiment
npm install
npx wrangler dev --local --port 8787
```

Health check: `http://127.0.0.1:8787/health`.

Test search after deploying to a separate Worker:
- `/search?source=netease&q=%E8%BD%BB%E9%9F%B3%E4%B9%90`
- `/search?source=kuwo&q=%E8%BD%BB%E9%9F%B3%E4%B9%90`

The search endpoint returns `url_id`; use it (not the display song ID) for `/url?source=netease&id=<url_id>`. Only test freely available tracks. URL presence alone is not proof of playback rights or byte-range support.

## Cloudflare deployment

Requires access to the user's Cloudflare account. **No Cloudflare connector or scoped deployment credentials are currently connected to this conversation.** Do not copy a bundled Node.js package into the Dashboard's single-file editor; it will not include `@meting/core`.

Option A, from a local terminal with Wrangler credentials:
```sh
cd workers/meting-experiment
npm install
npx wrangler login
npx wrangler deploy
```

Option B, GitHub Actions/manual deployment is possible after the account ID and a least-privilege Cloudflare API token are configured as GitHub Actions **secrets**. Never put tokens, cookies, or account identifiers into code or chat messages.

Keep the original `smalljia-netease-test` Worker and existing Supabase music proxy unchanged. Run `/health`, search and sample URL probes on the isolated test domain before changing any website code.
