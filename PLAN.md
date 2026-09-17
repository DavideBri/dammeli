# dammeli (damme.li)

End-to-end encrypted payment page. The user collects their payment methods
on a page and shares its link. The server can never read anything: it only
ever receives encrypted blobs.

This file is the project context. It holds the decisions already made and
the non-negotiable constraints. Read it before proposing architecture
changes.

---

## 1. What it is and isn't

**Is**: a client-side-encrypted collector of payment identifiers, no
account, no recovery.

**Isn't**: a Linktree for payments. That product already exists (Linktree,
Beacons, PayRequest) and isn't defensible. The only thing that justifies
dammeli's existence is privacy.

**Will never be**: a payment processor. See constraint L1.

---

## 2. Non-negotiable constraints

These aren't up for discussion without an explicit decision from the
author.

| ID | Constraint | Why |
|----|------------|-----|
| L1 | The server never touches money. Only display and outbound links. | Touching funds triggers PSD2 and potentially MiCA/VASP. |
| C1 | The key never leaves the browser. It lives in the URL fragment. | It's the entire security model. |
| C2 | `location.hash` must never end up in a fetch, a log, `document.title`, or a redirect. | One forgotten `console.log` voids C1. |
| C3 | Never `Math.random()`. Only `crypto.getRandomValues`. | It's not a CSPRNG. |
| C4 | A fresh nonce on every write. | Reusing a nonce with the same key completely breaks AES-GCM. |
| V1 | A link created today must keep opening forever. Every format version stays supported for reading. | There's no data recovery. It's a contractual promise, not a best practice. |
| P1 | Zero external resources in the frontend. No CDN, no remote fonts, no third-party widgets. | Every third party is an IP that leaks and one less point in the argument. |

---

## 3. Cryptography

```
master            16 bytes from crypto.getRandomValues (128 bit)
                  lives only in the fragment

read_key      =   truncated to 16 bytes of H("read"  | master)
write_token   =   truncated to 16 bytes of H("write" | master)
id            =   truncated to 8 bytes (64 bit) of H("id" | read_key)
```

`H` is SHA-256. Truncating `read_key` and `write_token` to 16 bytes is
explicit and intentional: `master` has 128 bits of entropy, so no derived
value can hold more, even though SHA-256's raw output is longer. Keeping
them at 32 bytes in the code would give the illusion of a security margin
that doesn't exist.

Encryption: **AES-GCM**, key = **`read_key`** (never `master` directly).
A random nonce is generated on every write and stored in the clear next to
the ciphertext.

`read_key`, not `master`, is the only secret needed to read a page: both
`id` (to locate the record) and the encryption key (to decrypt it) are
derived from it. Whoever holds only the read link has only the `read_key`
in the fragment: they can decrypt the page, but can't recover `master` or
`write_token`. If the implementation used `master` as the AES key,
read-only links would stop working.

### Link format

```
damme.li/#1rN4pQv8Lx2Wm7Ka3Bc9Fd
          ││└──────────────────── key (22 base64url characters = 128 bit)
          │└───────────────────── type: r = read, m = modify
          └────────────────────── crypto format version
```

About 32 characters total. The id **does not appear in the URL**: the
browser recomputes it from the key.

The version lives in the fragment and not in the blob because the client
needs to know which scheme to use *before* it can compute the id and fetch
the blob.

### Why 128 bit and not less

Whoever gets the database can attack the blobs offline, with no rate
limiting. The secret must withstand offline brute force. For equal
security, mnemonic words are *longer* than random characters (4 words out
of 2048 = 44 bit in ~24 characters), so they're not an option. Discussion
closed.

---

## 4. Data model

```sql
CREATE TABLE pages (
  id               INTEGER PRIMARY KEY,  -- 64 bit, derived from read_key
  nonce            BLOB NOT NULL,
  ciphertext       BLOB NOT NULL,        -- always 4096 bytes
  write_token_hash BLOB NOT NULL
);
```

Four columns. **No date, no expiry, no counter, no reference to the
user.**

- `created_at` and `expires_at` were deliberately excluded: they would
  reveal when a page was created and used. Expiry-with-renewal-on-read is a
  future feature, not v1.
- The ciphertext is **padded to a fixed 4096 bytes**. Variable length would
  reveal how many methods each page contains. Padding is validated by the
  server, the client isn't trusted.
  - That 4096 is the size of what actually lands in this column — the
    *stored* ciphertext, AES-GCM's 16-byte auth tag included. The client
    pads the *plaintext* to 4080 bytes before encrypting, precisely so
    that 4080 + 16 = 4096. Get this wrong (pad to 4096 and then encrypt)
    and every real ciphertext comes out 16 bytes over, and the server
    rejects it — this happened once already, see the regression test in
    `test/integration.test.mjs`.
- Accepted consequence: if the database gets filled with junk, it can't be
  cleaned up selectively. Mitigation: PoW is a blocker for public launch.

---

## 5. Payload (inside the encrypted blob)

```json
{
  "v": 1,
  "title": "Bruno's payments",
  "methods": [
    { "type": "satispay", "value": "brunoxyz", "preferred": true },
    { "type": "revolut",  "value": "brunoxyz" },
    { "type": "paypal",   "value": "brunoxyz" },
    { "type": "iban",     "value": "IT60X0542811101000000123456",
                          "holder": "Bruno Rossi" },
    { "type": "bitcoin",  "value": "sp1qq..." }
  ]
}
```

- **Array, not object**: order is information — the viewer always renders
  methods in array order, so a saved page from before the 0.6 redesign
  still displays in whatever custom order its creator chose.
  - The 0.6 redesign's fixed tile-grid picker always emitted satispay,
    revolut, paypal, iban, then the free-form "other methods" entries in
    the order they were added, with no way to change that — 0.8 brought
    manual reordering back, this time as actual drag-and-drop on the tile
    grid itself: press-and-hold or move past a small threshold picks up a
    tile, crossing into another tile's slot swaps it there live
    (`moveIdTo()` + `reflowTileOrder()` in `editor.mjs`, relocating
    existing DOM nodes rather than recreating them so an in-progress drag
    isn't interrupted). CSP's `style-src` forbids the inline `transform`
    a floating drag-ghost would need, so there is no ghost — the grid
    itself reflows as the pointer crosses tiles. `state.order` (all tile
    ids, main and custom) is the source of truth `getCards()` reads back
    into payload order.
- **`preferred: true` on at most one entry** (0.8): the method the page's
  creator wants shown first, badged, on the read-only page — set from a
  plain star icon, top-right of that method's popover, no text (fills in
  on click). `assemblePayload()` keeps only the first `preferred: true`
  it sees among the cards it's given (defensive: the editor's own single
  `state.preferred` value can only ever produce one, but the function
  doesn't assume its caller is well-behaved). The viewer moves that entry
  to the front of the rendered list regardless of its position in the
  array; the editor mirrors this by moving the starred tile to the front
  of the grid too (`moveIdToFront()`), so "shown first" is never a
  separate drag the creator also has to do.
- The free-form "other methods" entries' `type` is now whatever label the
  user typed (e.g. `"Bitcoin"`, `"Monero"`, `"Wise"`), not a value from a
  fixed list, and there can be **up to 5 of them** (0.7) — each is its own
  array entry with `type` set to that entry's own label, not a shared
  `"crypto"` type. The viewer displays that `type` string directly as the
  entry's title (0.7 — previously a generic "Altri metodi"/"Other
  methods" label, with the real label buried in the note line), and its
  tile shows the label's first letter instead of a drawn mark.
  `buildDirectLink()` still special-cases `type` matching `"bitcoin"`
  case-insensitively for the BIP21 `bitcoin:` deep link.
- **`value` holds only the handle, never the full URL.** If Revolut
  changes its URL format, a handle only needs a deploy; a saved URL would
  leave thousands of broken, unreadable blobs.
- **`holder` only on `iban`**, never at the page level. It's the only real
  identifier in the payload and must not end up in the blob of someone
  using only Satispay.
- **`title` is optional and page-level**: shown as the heading on the
  read-only page and as the browser tab title. Added after v1 shipped
  without a version bump — exactly the case the next bullet describes.
- Long, readable keys: the 4 KB padding makes compactness pointless.

### Payload version

`v` lets the **new** client read **old** blobs. Old clients don't exist,
because the client is served fresh from the server on every visit. Read
logic must therefore support every past version, forever.

Adding an optional field is not a version bump. Bump only when the meaning
of something that already exists changes.

### Note on `holder` and VoP

Since October 9, 2025, Verification of Payee is mandatory on SEPA
transfers: the payer's bank compares the entered name against the IBAN
holder and returns Match / Close Match / No Match / VoP not possible.

UI consequence: the field label isn't "full name" but **"account holder,
exactly as it appears at your bank"**, with a help line. A Close Match on
a payment page destroys trust.

---

## 6. API

```
POST   /p        create      body {id, nonce, ct, wth}    -> 201
GET    /p/:id    read                                      -> 200 {nonce, ct}
PUT    /p/:id    update      body {nonce, ct, wt}          -> 204
DELETE /p/:id    delete      body {wt}                     -> 204
GET    /healthz                                            -> 200
```

`wth` and `wt` are not the same thing: `wth` (write_token**_hash**,
SHA-256 of `write_token`) is what the server knows and persists from
creation onward; `wt` (the real `write_token`) is only sent on
`PUT`/`DELETE` to authenticate the write, and the server accepts it only
if `SHA256(wt)` matches the stored `wth`. Until then the server has never
seen the real `write_token`, only its hash — exactly like a password.

Rules:

- `write_token` goes **in the body**, never in the `Authorization` header
  and never in a query string: headers and query strings end up in
  provider logs.
- **Uniform 404.** "Doesn't exist" and "won't tell you" must be
  indistinguishable, otherwise the endpoint becomes an oracle for probing
  which ids exist.
- **Same body for every error**: `{"error":"not_found"}`. No difference
  between a wrong token and a nonexistent record.
- **Reject any ciphertext that isn't exactly 4096 bytes.**
- `POST` on an existing id: **409**, never overwrite. This is the
  collision case.
- `PUT` with a nonce identical to the stored one: **reject**. The only
  check the server can make to protect the user from a client bug.

---

## 7. Payment methods (v1, Italy-first)

Four main cards: **Satispay, Revolut, PayPal, IBAN**.
Crypto under "other methods".

Excluded: Venmo, Cash App, Zelle. US-only and restricted for commercial
use in their terms.

Every card must have:

1. **Operational instructions**, not links to documentation. With the
   real button names: *"Open Revolut, tap your name in the top left, your
   @username is right below."*
2. **Tolerance for messy pastes.** `https://www.paypal.me/brunoxyz?locale=it`
   becomes `brunoxyz`. An IBAN with spaces gets normalized. Never say
   "invalid format" when it's clear what the user meant.
3. **Handling the "I don't have one" case.** The paypal.me link has to be
   created once and doesn't exist by default. Without this line, the
   PayPal card is a dead end for half the users.
4. **Visual confirmation** after entry: icon plus last few characters. A
   wrong IBAN is the worst possible failure.

---

## 8. Creation flow

Goal: under 20 seconds, from a phone.

1. **The home page is already the editor.** No landing page, no sign-up,
   no "get started". Every screen before the editor costs half the users.
2. Method cards, the user fills in the ones they need.
3. A "Create" button.
4. **Final screen**, in this order: big "Copy link" button, "Send on
   WhatsApp" button, QR code. Below, a calm, non-alarming line: this link
   is the only way back in, save it.

**Return visits**: the full edit link, fragment included, lives in
`localStorage`. The fragment never went to the server, so saving it
locally doesn't betray the model. The user reopens `damme.li` from the
same phone and finds their pages again without ever logging in. Device
change or data wipe: the saved edit link is required.

**Two distinct links**: one read-only to share, one to edit and keep.
With a single link, whoever receives it could change the IBAN.

Page title added post-v1 (see section 5) without a version bump, exactly
as anticipated here. Per-method label is still dropped, same reasoning.

---

## 9. Stack

| Piece | Choice | Notes |
|---|---|---|
| Frontend | Astro, `output: 'static'` | No SSR, the site is static |
| Crypto | `public/crypto.js`, not bundled | See below |
| Frontend hosting | Netlify, deploy from GitHub | |
| Database | Supabase | Temporary, see migration note |
| DB access | `store` interface with `Get` / `Put` / `Delete` | Never call the Supabase client scattered around the code |

### crypto.js outside the bundle

All the cryptography lives in a single file inside `public/`, which Astro
copies without processing it. The file served is byte-identical to the
one in the repo, so anyone can diff it against GitHub line by line.

The README must link that file and state its SHA-256 hash, updated with
every release.

### Mandatory Astro configuration

- `output: 'static'`
- `build.inlineStylesheets: 'never'` (the `auto` default inlines small CSS
  and forces `unsafe-inline`)
- **No islands, no `client:load`, no `ClientRouter`.** Islands inject
  inline style and script and make a strict CSP impossible. Astro's view
  transitions aren't supported by the CSP feature.
- Astro's native CSP, via the stable `security.csp` option (introduced in
  Astro 6.0, no longer experimental in the version used in this repo).
  Generates a `<meta http-equiv="content-security-policy">` with hashes
  for bundled scripts and styles: no adapter needed for static output.
  The header-via-adapter route remains a future option if additional
  defense in depth is ever needed.
- QR generated locally, vendored library in the repo, never from a CDN.
- **No inline `style=""` attributes, and no script-set `element.style.*`,
  anywhere.** CSP's `style-src` only gets hashes for real stylesheet
  content (Astro's own `<style>`/CSS handling); it has no equivalent for
  attribute-based styles, so any inline style is a silent console error
  and a broken layout in a strict-CSP browser. Every dynamic per-instance
  choice (a method's tint, a tile's size, a popover's arrow position) is a
  small, fixed set of CSS classes picked at runtime, never a computed
  style value — see `src/styles/ds/components.css`.

### Design system (0.6)

The visual language (warm-paper background, hard non-blurred shadows,
mono/uppercase "receipt" labels, a single red accent element per screen,
mandatory dark mode) comes from a Claude Design export, translated by
hand from React + inline styles into plain CSS classes (`:hover`/`:active`
instead of JS-tracked mouse state) plus vanilla-JS DOM builders
(`src/scripts/ui.mjs`). Design tokens are copied verbatim into
`src/styles/ds/*.css`.

**No third-party logos anywhere**, including Satispay's: every payment
method gets a small geometric mark drawn for this project instead of a
real brand logo (`src/vendor/marks.mjs`), and icons are a vendored subset
of Lucide (ISC license, `src/vendor/icons.mjs`). Satispay never gets a
real logo either way, so there's no missing-asset gap to track.

Theme: `prefers-color-scheme` picks the default; an explicit choice
(`src/lib/theme.mjs`) overrides it via `data-theme` on `<html>`, saved
per-device in `localStorage`. Same per-device pattern as "your pages" —
no account, so nothing to sync it to.

### Localization (0.6, revised 0.7)

The UI is bilingual, Italian and English (`src/lib/i18n.mjs`): a
hand-written `{it, en}` dictionary with `{{placeholder}}` substitution,
not a library — two languages and no plurals don't justify one. Detection
only, from the browser's own `navigator.languages`, defaulting to English
if neither matches — 0.6 shipped a manual top-bar toggle on top of this,
removed in 0.7: the device's own language setting already does that job,
and a second, redundant place to control it wasn't worth the UI weight.

### Migration note

Netlify and Supabase are a choice of speed, not principle. They're two US
providers that log every request. Acceptable because they only ever see
unreadable blobs, **but it must be stated in the README and the privacy
page**: which providers, where they're based, what they see.

v2 target: European VPS, Go binary, SQLite. The `store` interface exists
for exactly this: the migration must be a new implementation, not a
rewrite.

Firebase was evaluated and rejected: a document store where a
four-column table is what's needed, a costlier future migration, and
Google is the provider least compatible with this product's privacy page.

---

## 10. Abuse and rate limiting

**Not in v1**, but a **blocker for public launch**.

Proof of work is purely additive: it's a check before the insert, it
doesn't touch the schema, keys, or existing links. Deferring it costs no
migration.

Plan for when it happens:

- **ALTCHA** self-hosted with **Argon2 or scrypt**. Memory-bound, so
  resistant to GPUs and ASICs. A homegrown SHA-256 PoW loses to anyone
  with a graphics card. ALTCHA has a `/dist/external` build meant for
  strict CSPs.
- **Adaptive** difficulty from configuration, raisable without a deploy.
- Alternative evaluated: Cap (smaller, plan B). Rejected: mCaptcha
  (pre-1.0), Friendly Captcha (commercial).
- **No Cloudflare Turnstile**: it's a third-party script loaded on the
  very page where trust is being asked for. Contradicts P1.

In the meantime, configuration only: body size limit, connection rate
limit on the reverse proxy, disk space alert.

---

## 11. Versioning

**SemVer**, with a project-specific rule:

> MAJOR only bumps when an old link stops working.
> Not when the interface changes, not when the database changes.

`0.x.y` until public launch. The move to `1.0.0` coincides with PoW in
production.

Two distinct versioning schemes, not to be confused:

| | Where | What it versions | Cost of change |
|---|---|---|---|
| Link version | fragment, plaintext | crypto, derivation, id | very high, perpetual support |
| Payload version | inside the blob | field names, methods | close to zero |

---

## 12. Still-open questions

- Reproducible frontend build: deferred, not decided.
- Public handle `bruno@damme.li` as a Lightning Address and BIP-353:
  separate product, not to be hybridized with encrypted mode in v1.
- Anti-impersonation strategy for public-handle mode. Ideas not yet
  evaluated: proof of control via DNS TXT or GitHub account, page signing
  with DID / SD-JWT VC.
- Backup retention policy.
