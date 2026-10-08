# Decisions

One entry per decision: date, decision, why.

## 2026-10-08: The request fits the safety perimeter as written

Decision: build Pixel Badge as requested, with no alternative needed.

Why: PROJECT.md asks for a static, client-only drawing tool. Everything runs in the browser, and the only storage is the browser's own (localStorage). The request itself rules out payments, accounts, server uploads, backend share links, tracking and wallets. The app makes no price, return or investment claims about the token. It only draws a ticker the user types in. There is nothing to swap for a declared alternative. To stay inside the perimeter, later sessions must not add: network calls at runtime (no analytics, no remote fonts, no CDNs), wallet connections, or any wording that promotes the token financially. The project page repeats the launcher's own short description ("Test token. No roadmap, no promises") word for word and adds nothing to it.

## 2026-10-08: Stack and build contract

Decision: Vite + React + TypeScript + Tailwind CSS v4 (through `@tailwindcss/vite`), with Vitest + Testing Library on jsdom for tests. The static output goes to `dist/`, the default the platform collects. Vite uses `base: './'` so the build works from any sub-path.

Why: this is the required starter stack. The platform builds with `npm ci && npm run build`, so `package-lock.json` is committed, and `npm run build` type-checks (`tsc -b`) before bundling.

## 2026-10-08: The project page reads PLAN.md directly

Decision: the project page imports `PLAN.md` as raw text at build time and parses the `## Milestone N: <title>` headings, so the plan it shows always matches the file.

Why: one source of truth. A hand-copied list on the page would drift out of date as milestones change.

## 2026-10-08: Rendering approach for the editor (guidance for milestone 1 onward)

Decision: keep the drawing as a 32x32 array of palette indexes (or empty), and draw it to `<canvas>` with integer scale factors and `imageSmoothingEnabled = false`. Exports draw the pixels as filled rectangles at whole-number sizes (512 / 32 = 16 px per cell) instead of scaling a bitmap.

Why: the request demands crisp PNGs with no blur. Whole-number rectangle drawing gives sharp edges by construction. A plain data model also makes undo/redo, mirror, fill and persistence easy to test.
