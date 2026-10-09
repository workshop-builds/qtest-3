# Progress

One entry per work session: date, model, what changed, what is next.

## 2026-10-08: Opening session (claude-opus-5-5)

What changed:
- Read PROJECT.md (Pixel Badge, a static in-browser pixel-art badge maker) and found that it fits the safety perimeter as written. No alternative was needed; see DECISIONS.md for the guardrails later sessions must keep (no runtime network calls, no wallet, no financial claims).
- Wrote BLUEPRINT.md (product, audience, principles, shape of v1, data model) and PLAN.md (6 milestones with verifiable acceptance criteria).
- Set up the stack: Vite 8, React 19, TypeScript, Tailwind CSS 4 (`@tailwindcss/vite`), Vitest 5 + Testing Library (jsdom). `package-lock.json` is committed for the platform's `npm ci && npm run build`. Output goes to `dist/`.
- First page: the project page (`src/App.tsx`), with the name, what the product will be, and the plan read at build time from PLAN.md (`src/plan.ts`).
- Tests: `src/App.test.tsx` (plan parser, PLAN.md milestones numbered from 1, page shows name, description and every milestone). `npm test` passes 3/3, and `npm run build` passes after a clean `npm ci`.

Not started: Milestone 1.

Next: Milestone 1, the drawing grid and palette.

## 2026-10-09: Milestone 1, drawing grid and palette (claude-sonnet-5-5)

What changed:
- Palette (`src/palette.ts`): 16 fixed colors. Pixel model (`src/pixels.ts`): immutable 32x32 array of palette index or `null`, with `setCell`, `clearCell`, `getCell`, `lineCells` (Bresenham) and `paintLine`. Out-of-range coordinates and invalid palette indexes return the same grid unchanged.
- Grid (`src/PixelGrid.tsx`): a square CSS grid (`aspect-ratio: 1/1`, full width, so it fits 360 px) with `touch-action: none`. Pointer events handle press and drag with pointer capture. A fast drag paints the line between two pointer samples, so no cells are skipped.
- Editor (`src/Editor.tsx`): Draw and Erase buttons (`aria-pressed`), and 16 swatches of at least 44x44 px with `aria-pressed`, a ring and a check mark on the selected one. Picking a color switches back to Draw.
- The project details moved to an About section below the editor in `src/App.tsx`: name, short description, features and the milestone list from PLAN.md.
- Tests: `pixels.test.ts` (model, palette, lines), `Editor.test.tsx` (click, drag, erase, swatches), `App.test.tsx` (About section, plan parser). `npm test` passes 24/24 and `npm run build` passes.

Not checked: layout in a real browser at 360x640 (jsdom has no layout). Sizes follow from the CSS (grid width 100% of a padded container, swatches `min-h-11 min-w-11`).

Next: Milestone 2, fill, undo, redo and mirror. Stroke-level undo needs the drag to be one history step: `PixelGrid` already reports press and moves separately, so the editor should snapshot on press and commit on release.

## Review of milestone 1

Approved.

Checked on 2026-10-09 (claude-opus-5-5), against the PLAN.md criteria, by reading the code and running it:
- `npm ci && npm test && npm run build`: passes; 24/24 tests.
- 32x32 grid: 1024 cells in a CSS grid, `aspect-ratio: 1/1`, `width: 100%` inside a `px-4` container (about 328 px at a 360 px viewport, border-box), so it does not scroll sideways. `touch-action: none` is set on the grid.
- Palette: exactly 16 colors (tested). Swatches are `h-11 min-h-11 min-w-11` (44 px) in an `auto-fill minmax(44px, 1fr)` grid (6 columns at 328 px). The selected swatch has a ring and a check mark, plus `aria-pressed`.
- Draw/erase: pointer down paints, and pointer move paints a Bresenham line from the last cell, so no cells are skipped. Pointer capture plus mapping from the bounding box keeps touch drags working. Erase uses the same path with `null`. Tests cover click, drag (including a skipped cell) and erase.
- Unit tests cover set, clear, out-of-range (negative, ≥32, fractional, NaN) and an invalid color. A component test checks that a click changes a cell's color.
- About section: name "Quiet Test ($QTEST)", short description quoted as written in PROJECT.md, and the milestone list parsed from PLAN.md (tested).
- No runtime network: the only URLs in `dist/` are XML namespace strings, a React error-docs string and the Tailwind licence comment. Nothing is fetched.

Not verified: rendering in a real browser at 360x640. The fit follows from the CSS described above.

Non-blocking notes for later milestones: grid cells have no accessible name or keyboard access (milestone 6 accessibility). Stroke grouping for undo is still to do (milestone 2).

## 2026-10-09: Milestone 2, fill, undo, redo and mirror (claude-sonnet-5-5)

What changed:
- Pixel model (`src/pixels.ts`): `floodFill` (4-directional, replaces the clicked region of the same color, empty included; same grid returned when the color already matches, the start is out of range or the color is invalid) and `mirrorPixels` (left-right flip of the whole grid).
- History (`src/history.ts`): snapshot history with `past`, `present` and `future` (capped at 200 steps). `commit` makes one step and clears redo. `beginStroke`, `edit` and `endStroke` group everything between a press and a release into one step, and a stroke that changes nothing adds no step. `undo` and `redo` are pure functions.
- `PixelGrid` reports `onStrokeStart` and `onStrokeEnd` (pointer down and up or cancel, and synthetic clicks), and `Editor` keeps its grid in the history.
- `Editor`: Undo, Redo and Mirror buttons (Undo and Redo are `disabled` when there is nothing to step through), plus a Fill tool next to Draw and Erase (`aria-pressed`). Fill acts on the press only, so dragging in fill mode does nothing. Mirror is one undoable step. All buttons are at least 44 px tall.
- Tests: `history.test.ts` (fill on an empty grid, fill bounded by another color, no diagonal leak, no-op on a matching color, mirror twice is the original, undo/redo sequences, a stroke as one step, redo cleared by a new edit) and new `Editor.test.tsx` cases (disabled buttons, a drag as one undo step, fill, mirror). `npm ci && npm test && npm run build` passes, 46/46 tests.

Not checked: layout in a real browser at 360x640. The three-column button rows follow from the CSS.

Next: Milestone 3, ticker, pixel font and frames. Palette and history do not store a ticker or frame yet, so milestone 5's saving must cover them too.

## Review of milestone 2

Approved.

Checked on 2026-10-09 (claude-opus-5-5), against the PLAN.md criteria, by reading the code and running it:
- `npm ci && npm test && npm run build`: passes; 46/46 tests.
- Fill: `floodFill` uses a stack. It moves in 4 directions with row-edge checks (no wrap-around between rows), replaces only cells equal to the start cell's value (`null` included) and returns the same grid when the color already matches. In the editor, fill acts only on the press (`from === to`), so a drag does not refill.
- Undo/redo: snapshot history. `beginStroke` runs on pointer-down, the first change in a stroke makes the step, later moves join it, and `endStroke` runs on pointer up or cancel. A synthetic click is wrapped as its own stroke. `commit` clears `future`. Undo and Redo get `disabled` from `canUndo` and `canRedo`.
- Mirror: `mirrorPixels` flips each row, and the editor applies it through `commit`, so it is one undo step. A symmetric drawing is a no-op and adds no step.
- Required unit tests are present: fill on an empty grid, fill bounded by a wall, fill on a matching color returns the same grid, undo/redo sequences, a stroke as one step, redo cleared after a new edit, mirror twice equals the original. Component tests cover the disabled states, a drag undone in one step, fill and mirror.
- No runtime network: `dist/` still contains only namespace, React error-doc and licence URL strings.

Not verified: real-browser behaviour at 360x640 (jsdom has no layout). The new button rows are 3 columns with `min-h-11`, which should fit about 328 px.

Non-blocking notes: a second pointer press during a stroke ends the first stroke and starts a new step. That is acceptable. History caps at 200 steps.

## 2026-10-09: Milestone 3, ticker, pixel font and frames (claude-sonnet-5-5)

What changed:
- Ticker rules (`src/ticker.ts`): `sanitizeTicker` uppercases, drops everything outside A-Z, 0-9, `$` and space, and keeps the first 10 characters. The input in the editor runs every change through it (and has `maxLength` 10).
- Pixel font (`src/font.ts`): a bundled 5x7 glyph bitmap table for all 38 allowed characters, with `textWidth` and `textPixels` helpers. No web font.
- Frames (`src/frames.ts`): None, Square and Rounded. The frame is a 2-cell ring drawn outside the 32x32 drawing (36x36 framed badge), so the drawing never moves when the frame changes. Rounded cuts the four corner cells.
- Layout (`src/badge.ts`): `layoutBadge` puts the frame, the drawing and the centered ticker (3 empty rows below the badge) on one integer cell grid. Milestone 4's exports can reuse it and draw whole-number rectangles.
- Preview (`src/BadgePreview.tsx`): an SVG of that layout (`crispEdges`), shown under the editor with a ticker input and three frame buttons (`aria-pressed`, 44 px tall).
- Tests (`src/ticker.test.ts`, new cases in `Editor.test.tsx`): sanitizing (length, characters, uppercase), a glyph for every allowed character (well-formed and distinct), the three frames render differently, layout bounds, and the editor input and frame buttons update the preview. `npm ci && npm test && npm run build` passes, 67/67 tests.

Not checked: layout in a real browser at 360x640.

Next: Milestone 4, crisp PNG export, reusing `layoutBadge`. Ticker and frame live in `Editor` state and are not in undo history; milestone 5's saving must cover pixels, ticker and frame.

## Review of milestone 3

Approved.

Checked on 2026-10-09 (claude-opus-5-5), against the PLAN.md criteria, by reading the code and running it:
- `npm ci`, `npm test` and `npm run build`: all pass; 67/67 tests in 5 files.
- Ticker input: every change goes through `sanitizeTicker`, which uppercases, drops anything outside A-Z, 0-9, `$` and space, and keeps the first 10 characters. The input also has `maxLength` 10.
- Pixel font: `src/font.ts` is a bundled 5x7 `#`/`.` bitmap table with an entry for each of the 38 allowed characters. No `@font-face` and no font files. The ticker is drawn as SVG rects 3 rows below the 36x36 framed badge, centered.
- Frames: None, Square and Rounded (Rounded is the ring with the corner cells cut off), picked with `aria-pressed` buttons. The preview SVG redraws from `layoutBadge(pixels, ticker, frame)`, so the picked frame shows.
- Required tests are present: sanitizing (length, characters including non-ASCII and emoji, uppercase); a well-formed, non-empty, distinct glyph for every allowed character; the three frames give distinct cell sets and distinct layouts. Component tests cover input filtering, the ticker appearing on the preview, and frame selection.
- No runtime network: the only URLs in `dist/` are still namespace strings, the React error-docs string and the Tailwind licence comment.

Not verified: rendering in a real browser at 360x640. The preview is `w-full max-w-xs` (320 px) and the frame buttons are in 3 columns, which should fit.

Non-blocking notes: because of `maxLength`, the browser cuts pasted text to 10 characters before sanitizing, so pasting "a-b-c-d-e-f-g" gives "ABCDE" rather than "ABCDEFG". That is still within the criterion (other characters are dropped). Ticker and frame are not in undo history or storage yet; milestone 5 must save them.

## 2026-10-09: Milestone 4, crisp PNG export (claude-sonnet-5-5)

What changed:
- Export (`src/export.ts`): `renderBadgeCanvas` makes a 512x512 canvas with the framed badge and the ticker under it, drawn from `layoutBadge` at the largest whole-number cell size that fits (for example 11 px for a short ticker, 14 px with no ticker, 8 px for a 10-character ticker that is wider than the badge; the layout is centered). `renderBannerCanvas` makes a 1500x500 canvas with the framed badge on the left (12 px cells) and the ticker in the pixel font on the right (whole-number scale, up to 20, fitted to the free width). Both set `imageSmoothingEnabled = false`, fill a solid #111111 background and draw only `fillRect` with integer coordinates and sizes. A canvas factory parameter lets tests pass a fake canvas.
- `downloadCanvas` encodes with `toBlob`, uses `URL.createObjectURL` (a `blob:` URL) on a temporary link with `download`, then revokes it. No network. File names come from the ticker (`pixel-badge-QTEST.png`, `pixel-banner.png` when empty).
- Editor: "Download badge" and "Download banner" buttons (44 px tall) under the preview, a note that files are made in the browser, and an error message if PNG encoding fails.
- Tests (`src/export.test.ts`, one case in `Editor.test.tsx`): a software fake canvas that rasterizes `fillRect` into an RGBA buffer. It checks exact sizes (also for empty and longest tickers), smoothing off, integer rectangles only, every pixel in a drawn cell equal to its palette color, no blended pixels anywhere (every pixel is the background or a palette color), frame color and rounded corners, ticker presence, banner layout, file names, blob-URL download and encoding failure. `npm ci && npm test && npm run build` passes, 81/81 tests.

Not checked: a real browser download and a real PNG decode (jsdom has no canvas). The fake canvas covers the drawing logic only.

Next: Milestone 5, templates and saving. The export takes `pixels`, `ticker` and `frame`, so saving must cover those three.

## Review of milestone 4

Approved.

Checked on 2026-10-09 (claude-opus-5-5), against the PLAN.md criteria, by reading the code and running it:
- `npm ci`, `npm test` and `npm run build`: all pass; 81/81 tests in 6 files.
- Badge PNG: `renderBadgeCanvas` creates a 512x512 canvas and draws `layoutBadge(pixels, ticker, frame)`, which includes the frame ring, the drawing and the ticker 3 rows under the badge. The cell size is `floor(512 / max(layout width, height))`, so it is 14 px with no ticker, 11 px with a short ticker and 8 px for a 59-cell-wide 10-character ticker. Offsets are floored. Everything fits and every value is an integer.
- Banner PNG: 1500x500. The framed badge is on the left at 12 px per cell (432 px, x=32, y=34). The ticker is drawn from the same 5x7 glyph table, starting at x=496, at a whole-number scale of up to 20 that fits the free 972 px. For "WWWWWWWWWW" that is 16, so it fits.
- Crispness: `imageSmoothingEnabled = false` is set on both contexts. The only drawing calls are `fillRect` with integer positions and sizes, filled with palette hex colors on a solid #111111 background. So every cell is one solid block with no blended edges.
- Required tests are present. Exact sizes are checked for normal, empty and longest tickers. A fake canvas rasterizes `fillRect` into an RGBA buffer (the plan allows a mocked canvas). Its sampling test checks that every pixel in two adjacent cells matches its palette color, and a full scan finds no pixels outside the background and palette colors in either export. Further tests cover smoothing off, integer rectangles, frame and rounded corners, the ticker being present and the banner layout.
- Downloads: `toBlob` → `URL.createObjectURL` (a `blob:` URL) → a temporary `<a download>` click → revoke. Tests check that the href is `blob:`. No network: `dist/` still holds only namespace, React error-doc and licence URL strings.

Not verified: a real browser download and a real PNG decode (jsdom has no canvas), or layout at 360x640. The two export buttons sit in a 2-column grid with `min-h-11`, which should fit.

Non-blocking notes: the badge export's cell size varies with the ticker width (8 to 14 px), so a long ticker shrinks the badge. That is within the criteria. With an empty ticker, the banner shows only the badge.

## 2026-10-09: Milestone 5, templates and saving in the browser (claude-sonnet-5-5)

What changed:
- Templates (`src/templates.ts`): six 32x32 grids built in code from palette indexes (robot head, rocket, flame, star, coin, wrench), each drawn with a black outline. They are frozen data; picking one is `commit(history, template.pixels)`, so it is one undo step and the drawing stays fully editable (edits copy the grid).
- Saving (`src/storage.ts`): pixels, ticker and frame are saved as versioned JSON (`pixel-badge:v1`) in localStorage from an effect that runs on every change, and read once when the editor starts. `parseSaved` validates everything (version, 1024 cells, each cell null or a palette index, frame id, ticker string, which is re-sanitized). Missing, corrupt, blocked or full storage gives an empty badge or a false return, and never throws.
- Editor: a "Start from a template" row of six 44 px buttons above the history buttons. The editor starts from the saved badge. Undo history is not saved, so after a reload the restored badge is the starting point.
- Tests: `storage.test.ts` (six templates, each valid 32x32 with only palette colors and not empty, templates differ and are not mutated by edits; round-trip with a fake store and real localStorage; eleven corrupt inputs; throwing storage) and new `Editor.test.tsx` cases (six buttons, template as one undoable step and editable, save and restore across unmount, corrupt storage gives an empty badge). `test-setup.ts` clears localStorage before each test. `npm ci && npm test && npm run build` passes, 100/100 tests.
- I checked the template art as ASCII dumps, but not in a real browser.

Not checked: layout in a real browser at 360x640. The template row is 3 columns with `min-h-11`, which should fit 328 px, though "Robot head" is the longest label.

Next: Milestone 6, phone polish and the one-minute flow. Grid cells still have no accessible names or keyboard access.
