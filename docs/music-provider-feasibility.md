# NetEase / Kuwo provider feasibility (PR #46)

## Verified findings
- Existing GD Studio hosts returned HTTP 403 from GitHub Actions for both `netease` and `kuwo`; host substitution alone does not restore playback.
- `TianhaoC/NeteaseCloudMusicApi-enhanced` is a fork of `NeteaseCloudMusicApiEnhanced/api-enhanced`. The former README describes a self-hosted Node.js server; the maintained upstream likewise describes running `node app.js` / Docker.
- Neither GitHub Pages nor Supabase Edge Functions provides an unchanged Node.js Express server environment. A separate compatible runtime would be required to run the project as-is.
- `gequbao.com` currently exposes user-facing music search pages, but no documented public integration API or permission to use it as a backend has been verified.

## Decision
1. Preserve existing working Tencent / QQ production routes.
2. Do not scrape gequbao or rely on its undocumented internal endpoints.
3. Test the maintained Enhanced project in an isolated Node runtime before implementing a NetEase provider adapter. Verify search, song metadata, lyric, accessible playable URL, HTTP audio range response, and restrictions. Do not enable song-unlocking or bypass subscription / rights checks.
4. Restrict any runtime-proxy integration by origin, supported operations, timeout, concurrency and rate limit. Never expose login cookies to the browser.
5. Kuwo requires a separately verified, permitted source; NetEase Enhanced is not a Kuwo API.
6. Do not merge until browser playback and fallback tests pass, plus explicit deploy authorization.

## Deployment prerequisites
- A maintained permitted NetEase provider endpoint with stable hosting (independent Node runtime if using Enhanced unchanged).
- Confirmation of acceptable operational costs and access permissions before provisioning.
- Tests in isolated environments; no changes to the production `music-proxy` function during exploratory work.

## Existing test evidence
GitHub Actions run 39563373705: all three tested GD Studio hostnames returned HTTP 403 for NetEase and Kuwo search requests.
