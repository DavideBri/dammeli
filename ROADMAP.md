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
- [x] Supabase implementation — written and wired in, not yet tested
      against a real project (still missing a live connection with real
      credentials)
- [x] `POST`, `GET`, `PUT`, `DELETE /p`, `GET /healthz`
- [x] Server-side validation of the 4096-byte padding
- [x] Uniform 404, same body for every error
- [x] 409 on existing id, rejection on repeated nonce
- [ ] **RLS verified**: the table must not be bulk-readable from the client
      with the anon key — policy written in `sql/schema.sql`, live
      verification deferred until the Supabase project exists
- [x] Body size limit on the reverse proxy — Netlify doesn't expose a
      configurable limit at the proxy/edge level, applied instead inside
      the function itself (413 above 16 KB)

**Exit criterion**: create a page via curl, read it back, update it, delete
it. The database contains only noise.

---

## 0.4 Editor

- [ ] Cards for Satispay, Revolut, PayPal, IBAN
- [ ] Operational instructions for each method, with the real button names
- [ ] Normalization of messy pastes (full URLs, IBANs with spaces)
- [ ] "I don't have one" line with a link, at least for PayPal
- [ ] `holder` field on IBAN with the correct VoP label
- [ ] Visual confirmation for each entered method
- [ ] "Other methods" section with crypto
- [ ] Reordering methods (order is information)

---

## 0.5 Sharing and return visits

- [ ] Public read-only page
- [ ] QR generated locally, vendored library
- [ ] Copy link, send on WhatsApp
- [ ] Lost-link warning, sober and non-alarming
- [ ] `localStorage` with edit links
- [ ] "Your pages" screen when opening damme.li
- [ ] Page deletion

**Exit criterion**: create a page in under 20 seconds from a phone and a
friend can actually pay me.

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
