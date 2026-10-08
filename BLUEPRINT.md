# Blueprint

Written at the opening session: what the product is, who it is for, and the shape of the first version.

## What it is

**Pixel Badge**, for the Quiet Test ($QTEST) project: a small web app for making a pixel-art badge for a coin or a community, right in the browser. You draw on a 32x32 grid, add a ticker in a pixel font, pick a frame, and download two crisp PNGs: a 512x512 avatar and a 1500x500 banner.

## Who it is for

People who launch or follow a coin and want a clean avatar or banner for X, Telegram or Discord, without design tools. Most of them are on a phone, so phone portrait is the main target. Desktop must also work.

## Principles

- **Static and private.** No accounts, no server, no tracking, no wallet, no network requests at runtime. Work is saved only in the browser (localStorage).
- **Fast.** On a phone, someone can open the page, draw or edit a template, type a ticker and download both PNGs in under a minute.
- **Crisp.** Exports are pixel-exact, with no smoothing and no blur.
- **Readable.** Dark background, high contrast, touch targets of at least 44x44 CSS px.

## Shape of the first version

One screen, from top to bottom (portrait):

1. **Badge preview / editor**: a square 32x32 grid that fits the screen width. Draw and erase with click, touch or drag. Inside the editor, a pointer drag paints and does not scroll the page.
2. **Toolbar**: Draw, Erase, Fill, Undo, Redo, Mirror (left to right).
3. **Palette**: 16 fixed colors in large swatches.
4. **Ticker and frame**: a text field (up to 10 characters, shown in a built-in pixel font under the badge) and a choice of three frame styles.
5. **Templates**: six starter badges (robot head, rocket, flame, star, coin, wrench) that load into the editor for editing.
6. **Export**: "Download badge (512x512)" and "Download banner (1500x500)". The banner has the badge on the left and the ticker on the right.
7. **About**: the project name, the launcher's short description, and a link to the plan.

### Data model

- `pixels`: 1024 cells (32x32), each a palette index 0 to 15 or `null` (empty).
- `ticker`: a string of up to 10 characters, limited to what the pixel font can draw.
- `frame`: one of three frame ids.
- History: a stack of snapshots for undo/redo.
- Persistence: the current `{pixels, ticker, frame}` saved to localStorage on change and restored on load.

### Out of scope

Payments, uploads to a server, backend share links, accounts, analytics, wallet connections, and any financial claims about the token.

## Current state

The opening session set up the stack and a project page that shows the name, this summary, and the plan read from PLAN.md. The editor starts in Milestone 1.
