# Quiet Test ($QTEST)

Test token. No roadmap, no promises

Pixel Badge: make a pixel-art badge and banner in your browser. No accounts, no server, no tracking.

## What it is

A small static web app for drawing a 32x32 pixel-art badge for a coin or a community, and saving it as a PNG for an avatar or a banner (X, Telegram, Discord). It works on a phone as well as on a desktop.

- 32x32 grid with a fixed 16-color palette: draw, erase and flood fill by mouse, touch or keyboard (arrow keys to move, Space or Enter to apply the tool).
- Undo, redo and left-right mirror.
- Six editable starter templates: robot head, rocket, flame, star, coin, wrench.
- A ticker of up to 10 characters (A-Z, 0-9, `$`) in a bundled pixel font, and three frames: none, square, rounded.
- Download a crisp 512x512 badge PNG or a 1500x500 banner PNG. Both are drawn as whole-number rectangles with smoothing off, so every pixel stays sharp.
- Your last badge (pixels, ticker, frame) is saved in your browser and comes back after a reload.

## Privacy

- No accounts, no server, no tracking, no analytics, no wallet.
- Nothing is uploaded. The page makes no network requests while you use it: no CDNs, no remote fonts.
- The only storage is your own browser's `localStorage` (key `pixel-badge:v1`), holding the current badge. Clear your site data to remove it.
- PNG files are made in the browser and saved through local `blob:` URLs.
- `npm run build` ends with a check (`scripts/check-dist.mjs`) that fails if the built page has an external URL in a script, link, img or similar tag, or in CSS.

## Run it

```sh
npm ci
npm run dev    # local dev server
npm test       # unit and component tests
npm run build  # type-check, static build in dist/, then the external-URL check
npm run preview  # serve dist/ locally
```

The build in `dist/` is plain static files and works from any path (relative base).

## Project files

- Blueprint: [BLUEPRINT.md](BLUEPRINT.md) · Plan: [PLAN.md](PLAN.md) · Progress: [PROGRESS.md](PROGRESS.md) · Decisions: [DECISIONS.md](DECISIONS.md)
