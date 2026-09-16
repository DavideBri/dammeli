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

## `logos.mjs`

- Source: [Simple Icons](https://simpleicons.org), version 16.31.0
- License: CC0-1.0 (public domain, no attribution required) for the icon
  artwork; the brand names/marks themselves remain the trademarks of
  their respective owners — displaying them to indicate a supported
  payment method is the same kind of use as any "we accept X" badge, not
  an endorsement claim
- Vendored, unmodified: `paypal`, `revolut`, `bitcoin`

Kept as plain JS string exports rather than separate `.svg` files loaded
via Vite's `?raw` import suffix, so the module works identically in the
browser bundle and in the plain Node test runner (no Vite transform
there, and no understanding of that import syntax).

**Missing: Satispay.** Not in the Simple Icons set. Wikimedia Commons has
a `Logo di Satispay.svg` file and Satispay publishes brand guidelines at
`developers.satispay.com/reference/logo`, but both were unreachable from
this environment's network — someone with access needs to pull the
official asset from one of those and check its license/usage terms
before vendoring it the same way. Until then the Satispay card has no
icon, text label only.
