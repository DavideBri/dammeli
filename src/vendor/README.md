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
