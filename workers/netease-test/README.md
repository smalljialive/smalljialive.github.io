# Isolated NetEase Cloudflare Worker prototype

This Worker is **not deployed** and is not referenced by the published music site. It is a compatibility adapter, not an upstream music service. Cloudflare Workers does not automatically run the Node.js Express-based Enhanced project.

## Endpoints
- `GET /health`: deployment / provider-configuration readiness.
- `GET /search?q=<keyword>`: requests a configured backend's `/cloudsearch` route.
- `GET /url?id=<numeric-id>`: requests its `/song/url/v1` route at standard quality, rejecting restricted/empty URL responses.

The Worker never sends login cookies, does not unlock music or proxy arbitrary media URLs, and uses strict parameters, capped results, a timeout and fixed cross-origin access. It will return `PROVIDER_NOT_CONFIGURED` until a **permitted** backend is configured. Do not expose an arbitrary public proxy URL.

## Cloudflare dashboard deployment (after user approves)
1. Open **Workers & Pages** > **Create** > **Worker** in the Cloudflare dashboard; select Free plan and verify its current limits.
2. Upload or paste `src/index.js`, deploy as `smalljia-netease-test`.
3. Visit `https://<your-subdomain>.workers.dev/health`: `providerConfigured:false` is expected without a backend.
4. Configure variable `NETEASE_PROVIDER_URL` in Worker **Settings > Variables and Secrets** only after confirming an authorized provider service, then redeploy and test `/search` and `/url`. This value is not a Netease public site URL; it must point to a compatible API service.
5. Validate response shape, unrestricted audio URL, HTTP range/media MIME, latency and actual browser playback before connecting the site. Keep QQ route unchanged.

A free Cloudflare Worker is *not* itself a substitute for a running Enhanced Node backend. No usable authorized backend has yet been verified. Do not claim NetEase playback works on deployment of this Worker alone.
