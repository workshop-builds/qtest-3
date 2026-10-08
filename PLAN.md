# Plan

Milestones with verifiable acceptance criteria. Each milestone ships something that works.

Rules for every milestone: `npm ci && npm test && npm run build` passes; no runtime network requests (no analytics, CDNs or remote fonts); the page works at a 360x640 portrait viewport without horizontal scrolling.

## Milestone 1: Drawing grid and palette

The main screen becomes a working pixel editor. The project details move to an About section on the same page.

- A 32x32 grid renders as a square that fits a 360 px wide viewport without horizontal scrolling.
- A palette of exactly 16 colors is shown. Each swatch is at least 44x44 CSS px, and the selected one is clearly marked (and exposed as `aria-pressed` or equivalent).
- Draw mode: a click or tap on a cell sets it to the selected color. Dragging with mouse or touch paints every cell the pointer crosses. Painting in the grid does not scroll the page (`touch-action: none` on the grid).
- Erase mode: the same interactions clear cells to empty.
- Unit tests cover the pixel model (set and clear a cell, out-of-range coordinates ignored), plus a component test that a click on a cell changes its color.
- The About section still shows the project name, the short description, and the milestone list from PLAN.md.

## Milestone 2: Fill, undo, redo and mirror

- Fill (flood fill, 4-directional) replaces the clicked cell's contiguous region of the same color, empty included, with the selected color.
- Undo and redo buttons step through history. One drag stroke counts as one undo step. Redo clears after a new edit. The buttons are disabled when there is nothing to undo or redo.
- Mirror flips the whole drawing left to right in a single undoable step.
- Unit tests: fill on an empty grid, fill bounded by another color, fill on an already-matching color is a no-op; undo/redo sequences including a stroke; mirror applied twice gives back the original.

## Milestone 3: Ticker, pixel font and frames

- A ticker input accepts at most 10 characters (A to Z, 0 to 9, `$` and space; letters converted to uppercase). Other characters are rejected or dropped.
- The ticker renders under the badge in a pixel font bundled in the code (a glyph bitmap table, not a web font).
- Three frame styles can be picked (for example: none / square border / rounded pixel border). The picked frame shows on the preview.
- Unit tests: input sanitizing (length, allowed characters, uppercase); every allowed character has a glyph; each frame renders differently.

## Milestone 4: Crisp PNG export

- "Download badge" saves a PNG of exactly 512x512 px: the badge with its frame and the ticker under it.
- "Download banner" saves a PNG of exactly 1500x500 px, with the badge on the left and the ticker in the pixel font on the right.
- Exports draw pixels as whole-number rectangles with image smoothing off. In the badge export, each drawn cell is a solid block of one color with no blended edge pixels.
- Tests: export functions produce canvases of the exact sizes; a pixel-sampling test (using a mocked or node canvas) shows the colors inside one cell are uniform and match the palette color.
- Downloads use local blob/data URLs only, with no network.

## Milestone 5: Templates and saving in the browser

- Six templates are available: robot head, rocket, flame, star, coin, wrench. Picking one loads it into the editor as an undoable change, and it stays fully editable.
- The current pixels, ticker and frame save to localStorage on every change and come back after a reload.
- Corrupt or missing saved data falls back to an empty badge without crashing.
- Tests: each template is a valid 32x32 grid using only palette colors and is not empty; save/restore round-trip; a corrupt-storage fallback test.

## Milestone 6: Phone polish and the one-minute flow

- At a 360x640 portrait viewport, every control is reachable, there is no horizontal scroll, and all touch targets are at least 44x44 CSS px.
- Text and controls meet WCAG AA contrast on the dark background. Buttons have accessible names, and visible focus styles are present.
- A first-time user can go from page load to both downloads in under a minute: the template picker and export buttons are visible without hunting, and the flow is checked with a scripted end-to-end walkthrough (Testing Library) of template → edit → ticker → frame → both exports.
- A test or build check confirms the built `dist/` has no external URLs in script, link or img tags.
- README describes the app, how to run it, and its privacy promise (no accounts, no server, no tracking).
