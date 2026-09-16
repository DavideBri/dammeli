# Vendored dependencies

Third-party code copied into this repo instead of installed from a
registry or loaded from a CDN (PLAN.md constraint P1: zero external
resources in the frontend).

## `qrcode.mjs`

- Source: [`qrcode-generator`](https://github.com/kazuhikoarase/qrcode-generator) by Kazuhiko Arase
- Version: 2.0.4 (`dist/qrcode.mjs`, unmodified)
- License: MIT (header preserved in the file)

Only the base (Latin-1/byte-mode) build is vendored, not the SJIS/UTF-8
variants — every value dammeli ever encodes into a QR code is a
`damme.li/#...` URL, which is plain ASCII.

## `icons.mjs`

- Source: [Lucide](https://lucide.dev)
- License: ISC (header credited in the file)
- A subset of Lucide's path data, copied by hand from the dammeli design
  system's own `Icon` component (which vendors the same icons the same
  way, for the same reason)

## `marks.mjs`

Original artwork for this project, not from any third party: every
payment method gets a small geometric mark drawn for dammeli instead of
a real brand logo, and the product's own mark (`logoMarkSvg`) is a drawn
fist grabbing a banknote rather than a stock icon. The design system's
own brand notes are explicit about this — no third-party logos anywhere,
including Satispay's, so there's no "missing icon" problem to track: a
brand's real logo was never going to be vendored here in the first
place.

Both files are kept as plain JS string exports rather than separate
`.svg`/`.json` files loaded via Vite's `?raw` import suffix, so they work
identically in the browser bundle and in the plain Node test runner (no
Vite transform there, and no understanding of that import syntax).
