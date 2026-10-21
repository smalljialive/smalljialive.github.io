# No-Render hosting decision for PR #46

## Production constraints
- Keep QQ playback untouched. The currently functioning GitHub Pages + Supabase production music-proxy must not be replaced.
- Render Free service creation failed with HTTP 402 requiring payment information; do not retry or upgrade automatically.
- NetEaseCloudMusicApi-enhanced is a Node.js API service and cannot be assumed compatible with Cloudflare Workers or Supabase Edge Functions unchanged.
- Experimental NetEase adapter in this PR remains disabled; currently tested NetEase songs have not established reliable unrestricted playback.
- The tested public GD-Studio / Meting providers did not return a proven usable, permitted audio endpoint. Kuwo remains unverified.

## Preferred free-first approach
1. Prototype a **minimal Cloudflare Worker** (not the whole Enhanced server) behind an isolated test URL. Confirm the user has a Cloudflare account before attempting deployment.
2. Only integrate a permitted provider/API where authorized use, stable response behavior, and rights are documented. Do not embed account cookies in frontend code, impersonate users, bypass subscriptions or unlock restricted tracks.
3. Keep a fixed list of permitted provider hosts; validate request parameters; set timeout and rate-limit protections; never expose a generic arbitrary-URL proxy.
4. Validate search, track metadata, standard audio URL, HTTP Range/media MIME, actual browser playback, and no-audio responses for multiple songs.
5. If a lightweight Worker adapter is not possible, consider Deno Deploy free tier subject to account-verification restrictions, or use existing Supabase Edge Functions for fetch-based adapters. Deno Deploy's Node compatibility is not proof that Enhanced will run.
6. Only enable a test-specific UI route when backend verification succeeds, and ask for explicit deployment confirmation before merging. A normal successful build is not evidence of playable music.

## Decision gates
- No verified permitted upstream audio provider = no production enablement.
- No Cloudflare account/permissions = produce isolated Worker code and tests only, no deployment.
- No paid service, billing configuration, persistent resource creation or production function changes without authorization.
