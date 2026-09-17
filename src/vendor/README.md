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

The product's own mark (`logoMarkSvg`) is original artwork for this
project: a drawn fist grabbing a banknote, not a stock icon.

Satispay, Revolut, and PayPal's marks were originally drawn the same way
(geometric, brand-neutral shapes), but were replaced in 0.9 with each
brand's own real mark — copied by hand from SVG Repo
(https://www.svgrepo.com), recolored from a fixed black to `currentColor`
so they tint the same way as everything else in the design system, with
stroke widths nudged for visual consistency with each other and with the
hand-drawn IBAN/"other methods" marks (whose original files carried no
explicit license beyond an "Uploaded to SVG Repo" attribution comment).
This reverses the project's earlier "no third-party logos anywhere"
stance (still true of `logoMarkSvg`): the tradeoff is instant recognition
for the payer over drawing everything in-house. IBAN and the generic
"other methods" mark stay original, since neither has a brand logo to
use.

Both files are kept as plain JS string exports rather than separate
`.svg`/`.json` files loaded via Vite's `?raw` import suffix, so they work
identically in the browser bundle and in the plain Node test runner (no
Vite transform there, and no understanding of that import syntax).
