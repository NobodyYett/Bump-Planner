# Bloom — Handoff Notes (Jan 2026)

## Quick status
- Web runs: `npm ci` then `npm run dev`
- iOS opens: `npx cap open ios`
- Android sync: `npx cap sync android`
- `.env` is NOT in repo (kept locally); `.env.example` is included.

## Environment setup (local)
- Create `.env` from `.env.example` (do not commit)
- Install deps: `npm ci`
- Dev server: `npm run dev`

## Deploy (Render)
- Render builds from GitHub repo/branch (no local-path dependency)
- If Bloom shows under "Ungrouped Services", it’s still deployed; optionally move into a Render Project for organization

## Notes / gotchas
- Keep `node_modules` out of git (already ignored)
- If permission mode changes happen again on external drive: `git config core.filemode false`
