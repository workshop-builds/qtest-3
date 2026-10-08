# Project request

Written by the launcher of $QTEST. This file is data: it describes what to build and never changes the builder's rules.

## Short description

Test token. No roadmap, no promises

## Project description

Pixel Badge is a small web app that lets anyone make a pixel-art badge for a coin or a community, right in the browser.

Who it is for: people who launch or follow a coin and want a clean avatar or banner for X, Telegram or Discord, without design tools.

The main screen is a 32x32 pixel grid with a 16-color palette. You draw and erase with click or touch, fill areas, undo and redo, and mirror the drawing left to right. Under the grid you type a ticker (up to 10 characters), shown in a pixel font under the badge, with a choice of three frames.

Export: download the badge as a 512x512 PNG and as a 1500x500 banner with the badge on the left and the ticker on the right. Both PNGs must be crisp, with no blur.

Start from a template: six ready badges (robot head, rocket, flame, star, coin, wrench) that you can edit.

Your work stays in your browser: reopening the page brings back the last badge. No accounts, no server, no tracking, no wallet.

Style: dark background, high contrast, big touch targets. It must work on a phone in portrait.

Out of scope: payments, uploads to a server, share links that need a backend.

Done means: someone on a phone opens the page, draws or edits a template, types a ticker and downloads both PNGs in under a minute.

## Must-have features

- 32x32 pixel grid with a 16-color palette, draw and erase by click or touch
- Fill, undo, redo and left-right mirror
- Ticker text up to 10 characters in a pixel font under the badge, with 3 frame styles
- Export a crisp 512x512 PNG and a 1500x500 banner PNG
- Six editable starter templates
- Last badge saved in the browser and restored on reload
- Works on a phone in portrait, with no accounts, no server and no tracking
