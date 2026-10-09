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
