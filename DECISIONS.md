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

## 2026-10-09: Grid is DOM cells, painting uses line interpolation

Decision: milestone 1 renders the 32x32 grid as 1024 CSS-grid `div`s (memoized), not a canvas. Pointer position maps to a cell from the grid's bounding box (falling back to the event target where there is no layout, as in jsdom). Each pointer move paints the line from the previous cell to the new one.

Why: DOM cells are easy to test with Testing Library and need no canvas mock. The canvas is still the approach for exports (milestone 4), as decided earlier. Line interpolation means a fast drag leaves no gaps.

## 2026-10-09: Synthetic clicks paint, real clicks do not paint twice

Decision: a pointer-down paints at once. A `click` event only paints when `detail === 0` (keyboard or assistive-tech activation, or a synthetic click).

Why: a real click is already covered by its pointer-down, and painting is idempotent either way, so this only avoids redundant work while keeping non-pointer activation working.
