# dammeli roadmap

Versioning rule: MAJOR only bumps when an old link stops working.
`0.x.y` until public launch.

---

## 0.1 Verified skeleton

The goal isn't to have something that works, it's to know whether the
stack holds up under the constraints. If the CSP doesn't close cleanly,
better to find out now.

- [x] Astro configured: `output: 'static'`, `inlineStylesheets: 'never'`
- [x] Native CSP active and **verified on an empty page**, clean console,
      no `unsafe-inline`
- [x] `public/crypto.js` empty but imported as an ES module, verified
      byte-identical in the build output
- [x] Deployed on Netlify from GitHub (dammeli.netlify.app) — the damme.li
      domain still needs to be connected
- [ ] Public repo, license, minimal README — license and README done, repo
      still private

**Exit criterion**: a blank page online at damme.li with a strict CSP and
no console errors.

---

## 0.2 Cryptography

The piece that can't be gotten wrong. To be done before any interface.

- [x] Master key generation with `crypto.getRandomValues`
- [x] Derivation of `read_key`, `write_token`, `id`
- [x] AES-GCM encryption and decryption with a fresh nonce on every write
- [x] Encoding and parsing of the `#<ver><type><key>` fragment
- [x] Padding to 4096 bytes and its removal
- [x] **Test vector**: known payload, known key, expected ciphertext. Needed
      to guarantee constraint V1 forever
- [x] Test: nonce never repeats across successive writes
- [ ] Manual audit: `location.hash` read in exactly one place, never in a
      fetch, log, title, or redirect — not applicable yet: no part of the
      app reads `location.hash` until an editor exists (0.4/0.5).
      `crypto.js` never touches it by construction, enforced by an
      automated test

**Exit criterion**: encrypt a payload, reload the page, decrypt it from the
link. All local, no server.

---

## 0.3 API and persistence

- [x] `store` interface with `Get` / `Put` / `Delete`
- [x] Supabase implementation — connected to the real project, live on
      Netlify
- [x] `POST`, `GET`, `PUT`, `DELETE /p`, `GET /healthz`
- [x] Server-side validation of the 4096-byte padding
- [x] Uniform 404, same body for every error
- [x] 409 on existing id, rejection on repeated nonce
- [x] **RLS verified**: confirmed live against the real Supabase project —
      `GET /rest/v1/pages?select=id` with the anon key returns `[]`
- [x] Body size limit on the reverse proxy — Netlify doesn't expose a
      configurable limit at the proxy/edge level, applied instead inside
      the function itself (413 above 16 KB)

**Exit criterion**: create a page via curl, read it back, update it, delete
it. The database contains only noise.

---

## 0.4 Editor

- [x] Cards for Satispay, Revolut, PayPal, IBAN — structure only, unstyled
      (styling deferred to Tailwind, see stack notes)
- [x] Operational instructions for each method, with the real button names —
      Satispay and Revolut's placeholder text replaced in 0.6 by the
      design system's own copy (`src/lib/i18n.mjs`, `methods.*.hint`),
      still worth a pass against the live apps before public launch
- [x] Normalization of messy pastes (full URLs, IBANs with spaces) — unit
      tested in `test/normalize.test.mjs`
- [x] "I don't have one" line with a link, at least for PayPal
- [x] `holder` field on IBAN with the correct VoP label
- [x] Visual confirmation for each entered method
- [x] "Other methods" section with crypto
- [x] Reordering methods (order is information) — among the four main
      cards; the crypto entry isn't reorderable relative to them yet
      (superseded in 0.6: the design system's tile-grid picker has no
      manual reordering, see PLAN.md section 5)

---

## 0.5 Sharing and return visits

- [x] Public read-only page — fetches, decrypts, and renders the methods
      for a recipient opening a read link; unstyled-but-real, same
      minimal Tailwind pass as the editor. No deep link for
      Satispay/Revolut (no verified URL scheme, same honesty bar as the
      editor's placeholder instructions) — copy-to-clipboard works for
      every method regardless
- [x] QR generated locally, vendored library — `qrcode-generator` by
      Kazuhiko Arase (MIT), vendored in `src/vendor/`, rendered as inline
      SVG, no CDN
- [x] Copy link, send on WhatsApp
- [x] Lost-link warning, sober and non-alarming
- [x] `localStorage` with edit links
- [x] "Your pages" screen when opening damme.li — shown above the editor
      when there's something to show, hidden entirely otherwise; the
      editor stays immediately usable either way
- [x] Page deletion — from the "Your pages" list, derives the write_token
      back from the saved edit link to authenticate `DELETE /p/:id`

**Exit criterion**: create a page in under 20 seconds from a phone and a
friend can actually pay me. Met for the core loop — create, share, a
recipient can see and copy every method — modulo the still-private repo /
undocked domain (0.1).

---

## 0.6 Design system and localization

- [x] Claude Design export adopted: tokens, component classes, hard
      shadows, warm-paper palette, single-red-accent rule (PLAN.md
      "Design system (0.6)")
- [x] Editor rebuilt around the design system's tile-grid method picker
      (tap a tile, a popover opens below it) — replaces the always-open
      cards and their manual up/down reordering (see PLAN.md section 5
      for the "order is information" tradeoff this made)
- [x] Page-title field ("Per cosa?" / "What for?")
- [x] "Created" screen (badge, QR framed with a hard shadow, keep-the-link
      notice, ghost actions), separated from the always-visible editor
- [x] Custom-drawn marks per payment method, no third-party logos
      anywhere including Satispay (`src/vendor/marks.mjs`); vendored
      Lucide icon subset (`src/vendor/icons.mjs`)
- [x] Dark mode: `prefers-color-scheme` default, explicit per-device
      override via a top-bar toggle (`src/lib/theme.mjs`)
- [x] Bilingual UI, Italian and English: browser-language detection,
      explicit per-device override via a top-bar toggle
      (`src/lib/i18n.mjs`)
- [x] Every inline `style=""`/`element.style.*` removed from the app in
      the process — CSP's `style-src` has no hash mechanism for those,
      unlike `<style>` blocks and stylesheets

---

## 0.9 Private beta

- [ ] Privacy page with declared providers: who they are, where they're
      based, what they see
- [ ] SHA-256 hash of `crypto.js` published
- [ ] Encrypted database backup, on a different provider
- [ ] **Restore tested at least once**
- [ ] Disk space alert
- [ ] Ten real people, half non-technical
- [ ] Verify the only metric that matters: how many complete page creation
      and how many actually receive a payment

---

## 1.0 Public launch

PoW is a blocker. Without it, a database filled with junk can't be cleaned
up selectively, because there are no dates and the blobs are unreadable.

- [ ] Self-hosted ALTCHA with Argon2, adaptive difficulty from
      configuration
- [ ] Global switch: hourly-creation threshold that raises difficulty
- [ ] Abuse-handling procedure and contact for reports
- [ ] Complete README with the security model explained
- [ ] Announcement: GDG Pisa, blog, Hacker News

---

## 1.5 Documentation and self-hosting

- [ ] Explanation of the crypto model, with the reasoning behind 128 bit
      and why no mnemonic links
- [ ] Explicit threat model: what it protects and what it doesn't
- [ ] `store` implementation for SQLite
- [ ] Working Docker image and `docker compose`
- [ ] Self-hosting guide, tested on UmbrelOS
- [ ] Documentation of the link and payload format, version by version

---

## 2.0 Migration and public handle

Two separate things that happen to land in the same period.

**Infrastructure migration**

- [ ] European VPS, Go binary, SQLite
- [ ] New implementation of the `store` interface, not a rewrite
- [ ] Evaluate reproducible builds and attestation

**Public handle** (separate product, not to be hybridized with encrypted
mode)

- [ ] `damme.li/bruno`, deliberately non-sensitive content, never an IBAN
- [ ] Lightning Address at `/.well-known/lnurlp/`
- [ ] BIP-353 record at `bruno.user._bitcoin-payment.damme.li`, DNSSEC
      enabled
- [ ] Anti-impersonation strategy **decided before writing code**: proof
      of control via DNS or GitHub, or DID / SD-JWT VC signing

---

## Deferred, no date

- Expiry with renewal on read (requires `expires_at` in the clear)
- Page title, per-method label
- Silent payments and xpub derivation
- Backup retention policy
