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

## 2026-10-09: Undo is whole-grid snapshots, strokes are grouped by the grid's press and release

Decision: history keeps immutable 32x32 snapshots (max 200 steps) instead of diffs. `PixelGrid` signals stroke start and end, and edits made between them join one undo step. Fill only acts on the press (not while dragging).

Why: grids are already immutable arrays, so snapshots are trivial, correct and easy to test, and the memory cost is small (1024 cells per step). Grouping on press and release gives "one drag, one step" without timers. Re-filling on every cell crossed during a drag would be surprising and expensive.

## 2026-10-09: Frame is a ring outside the drawing; one shared layout for preview and exports

Decision: frames are a 2-cell ring around the 32x32 drawing (36x36 framed badge), in Yellow, and the ticker is white 5x7 text centered 3 rows below it. `layoutBadge` computes all colored cells on one integer grid; the preview renders it as SVG rects, and milestone 4's exports should draw the same cells as whole-number rectangles. Ticker and frame are plain editor state, not undo history.

Why: a ring outside the drawing means switching frames never covers or moves the artwork. One layout function keeps the preview and the PNGs identical and makes the frame/font output testable without a canvas. Undo is specified for pixel edits only.

## 2026-10-09: Export draws the shared layout with integer rectangles on a solid background

Decision: the badge PNG draws `layoutBadge` at the largest whole-number cell size that fits 512x512 (8 to 14 px depending on ticker width and height), centered, so the 512 size is exact but the margin is not a multiple of the cell size. The banner draws the framed badge at 12 px per cell and the ticker at a whole-number scale on the right. Both PNGs have a solid #111111 background (not transparent), because the ticker is white and Black cells would vanish on a transparent one. Canvas creation is injectable, and tests use a fake canvas that records `fillRect` into a pixel buffer.

Why: 512 is not a multiple of 36, so an exact whole-number fit is impossible. Integer scale with centering keeps every cell a hard-edged solid block, which is the requirement. A fake canvas lets the sampling tests run without a native canvas dependency, and the downloads use only `blob:` URLs.

## 2026-10-09: Templates are generated in code; saving is validated, versioned JSON

Decision: templates are built by small drawing helpers (rectangles, discs, symmetric rows, a star polygon, an auto outline) into frozen 32x32 palette-index grids, not stored as 1024-number literals. The saved badge is `{v:1, pixels, ticker, frame}` as JSON under `pixel-badge:v1`, written on every change and validated strictly on load; any failure gives an empty badge. Undo history is not saved.

Why: code is easier to review and tweak than raw arrays, and palette colors are looked up by name so they cannot drift. Strict validation means a damaged or hand-edited entry can never crash the editor. Skipping history keeps the stored data small and the format simple, since the requirement is to get the badge back.
