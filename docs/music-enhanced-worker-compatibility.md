# Enhanced -> Cloudflare Workers compatibility assessment

Checked against NeteaseCloudMusicApiEnhanced/api-enhanced `main`, 2026-10-21.

The upstream application is **not a drop-in Cloudflare Worker**:

- `app.js` uses `fs`, `path`, `os.tmpdir()`, writes an anonymous token on boot, runs `generateConfig()`, then starts `server.serveNcmApi()`.
- `server.js` is an Express / Node HTTP server, uses `child_process.exec`, `express-fileupload`, filesystem routes and dynamic modules.
- `main.js` enumerates the filesystem with `fs.readdirSync` and dynamically requires dozens of modules.
- `generateConfig.js` writes token and public-key files and performs upstream registration and key lookups.
- `module/cloudsearch.js` and `module/song_url_v1.js` are wrappers for upstream APIs requiring the surrounding request/authentication machinery. The latter contains optional unblock logic which must **not** be enabled in this project.

Cloudflare's Node compatibility features are insufficient by themselves to guarantee these functions work. Loading the whole application also introduces bootstrap state / filesystem and maintenance burdens. Avoid asking the user to paste the entire Enhanced project into the Worker.

The repository now includes `workers/netease-test/src/index.js` as a standalone Worker-compatible *adapter*, with no dependency on the upstream Node application. It returns `PROVIDER_NOT_CONFIGURED` until a compatible, appropriately authorized backend is supplied.

Next engineering gate: identify a permitted public NetEase metadata and non-restricted media service that is demonstrably playable and has terms allowing this use. If no such service is available, it is more accurate to leave NetEase disabled than to suggest a false free hosting solution. Keep QQ production playback unchanged.
