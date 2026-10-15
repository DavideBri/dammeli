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
      Satispay/Revolut at first (no verified URL scheme, same honesty
      bar as the editor's placeholder instructions) — copy-to-clipboard
      works for every method regardless. Revolut's own `revolut.me/<tag>`
      profile-link format added in 0.7; Satispay's still needs a verified
      scheme
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
- [x] Page-title field ("Titolo della pagina" / "Page title" — renamed
      from the original "Per cosa?"/"What for?" in 0.7, framed as the
      page's own title rather than a payment-request line, e.g. to tell
      a personal page apart from a work one)
- [x] "Created" screen (badge, QR framed with a hard shadow, keep-the-link
      notice, ghost actions), separated from the always-visible editor
- [x] Custom-drawn marks per payment method, no third-party logos
      anywhere including Satispay (`src/vendor/marks.mjs`); vendored
      Lucide icon subset (`src/vendor/icons.mjs`)
- [x] Dark mode: `prefers-color-scheme` default, explicit per-device
      override via a top-bar toggle (`src/lib/theme.mjs`)
- [x] Bilingual UI, Italian and English: browser-language detection
      (`src/lib/i18n.mjs`) — shipped with a manual top-bar toggle on top
      of detection, removed again in 0.7 (redundant with the device's
      own language setting)
- [x] Every inline `style=""`/`element.style.*` removed from the app in
      the process — CSP's `style-src` has no hash mechanism for those,
      unlike `<style>` blocks and stylesheets

---

## 0.7 Editor and sharing fixes

- [x] Method-tile grid actually lays out horizontally, wrapping to more
      rows as needed — 0.6 shipped it without `grid-template-columns`,
      so it silently collapsed to a single vertical column
- [x] Same-page, fragment-only navigations (a "your pages" row's edit
      link, "come la vedono", the public page's "make your own" footer
      link) now force a real reload (`navigateHard()` in
      `src/scripts/screens.mjs`) — browsers never reload for those on
      their own, so `boot()` never re-ran and the app stayed stuck on
      whatever was already on screen
- [x] Selecting a method scrolls its popover into view, instead of
      leaving it below the fold for the user to find
- [x] "Your pages" shows and copies the **read** (share) link, not the
      edit link — derived from the stored write link when not saved
      directly (pages saved before 0.7)
- [x] Saving changes to an existing page shows the "Created"/share
      screen again (read link, QR, copy) instead of just a toast on the
      button — the only place the read link is easy to re-share from
- [x] "Other methods" now allows up to 5 custom entries instead of one
      fixed generic slot, each getting its own tile — deliberately
      generic (any label, any value), not crypto-specific despite the
      internal `type: "crypto"` card shape (PLAN.md section 5)
- [x] Revolut direct link via `revolut.me/<tag>`, Revolut's own public
      profile-payment format — Satispay still has no verified deep-link
      scheme, so it stays copy-to-clipboard only
- [x] Manual language toggle removed — detection-only, defaulting to
      English (PLAN.md "Localization (0.6, revised 0.7)")
- [x] "How it works" page (`/how-it-works`): short, non-technical
      explanation of the privacy model — no account, encryption happens
      in the browser before anything is sent, the key lives only in the
      link, who hosts the (unreadable) data. Linked from the editor
      footnote and the public page's footer
- [x] Custom "other methods" entries get their own icon: their label's
      initial, in both the editor's tile grid and the public page —
      falls back to the generic drawn mark only while the label is
      still empty
- [x] Public page shows the custom label itself as the title (e.g.
      "Wise"), not the generic "Altri metodi"/"Other methods"
- [x] IBAN gets its own bigger card on the public page instead of a
      plain pay-button row — the number and the account holder as two
      separately-labeled, separately-copyable fields in one card
- [x] Public page no longer greets the payer with a name derived from
      the IBAN holder ("Mario chiede") — confusing when the payer has no
      idea who that name is. Replaced with a plain, always-shown
      "Scegli come pagare"/"Choose how to pay" kicker
- [x] The editor's method-tile popover no longer opens on Satispay by
      default when creating a new page — closed until a tile is tapped,
      same as it already was when editing an existing one

---

## 0.8 Preferred method and manual reordering

- [x] "Preferred method" flag: a plain star icon, top-right of a filled
      method's popover, no text label — fills in on click
      (`preferred: true` on its payload entry, PLAN.md section 5) —
      shown first on the public page regardless of array order, with an
      accent-bordered tile and a "Preferito"/"Preferred" badge so the
      payer can tell it's the creator's pick. Setting it also moves that
      method's tile to the front of the grid
- [x] Manual reordering by dragging tiles directly in the grid — no
      chevrons/arrows, no position indicator. Press-and-hold (200ms) or
      move past an 8px threshold starts a drag; crossing into another
      tile swaps it live via `moveIdTo()`/`reflowTileOrder()` (existing
      DOM nodes are relocated, never recreated, so an active drag survives
      it). A plain tap still opens the tile's popover as before — CSP's
      `style-src` has no `unsafe-inline`/`unsafe-hashes`, so the dragged
      tile can't visually follow the pointer via an inline transform;
      other tiles are pushed aside instead, and the browser's own
      click-suppression after a real pointer move keeps a completed drag
      from also reopening a popover
- [x] IBAN participates in both: preferred moves its card above the
      pay-button list instead of leaving it pinned after; dragging
      changes its position relative to the other methods the same way
- [x] Default tile order for a brand-new page changed to IBAN, PayPal,
      Revolut, Satispay, Aggiungi (`ORDER` in `src/scripts/editor.mjs`) —
      an editing an existing page still restores that page's own saved
      order regardless of this default
- [x] Popover arrow regression fixed: making the popover `position:
      relative` (to anchor the star) turned it into a positioned
      descendant sharing a stacking order with the arrow, so the
      popover's own top border started painting over the arrow tip
      instead of blending with it — fixed with an explicit z-index on
      the arrow
- [x] A small "x" at the end of every text input (title, each method
      field, IBAN holder, custom label/value) clears it in one tap —
      hidden while the field is empty, shown once it has content

---

## 0.9 Private beta

- [x] Privacy page (`/privacy`) with declared providers: Netlify (site
      and functions) and Supabase (database), both US-based, what they
      see (ordinary request metadata like IP and timing, never plaintext
      — everything is encrypted client-side before it's sent) and what
      they never see (the encryption key, which never leaves the
      browser). Also states plainly what the app never collects (no
      account, no email, no analytics, no cookies) and what only ever
      lives on the visitor's own device (the edit link, in
      `localStorage`). Linked from "How it works", the editor footnote,
      and the public page's footer. Includes an honest private-beta note
      (backups exist, restore not yet tested) rather than waiting for
      that to actually be true first
- [x] Editor copy pass for beta clarity: the old wordmark + kicker + tagline
      + subtitle stack said little in a lot of space — replaced with one
      short headline plus a one-sentence trust pitch ending in an inline
      "How it works" link, which also makes the footer's old repeat of the
      same link redundant (now just the Privacy link). The title field's
      hint moved from always-visible text to a "?" toggle beside the label
      (click or hover), same for the IBAN holder field. The "3 of 4"
      filled-methods counter is gone — it never told the payer or the
      creator anything actionable. The read-only page's loading state is a
      spinner (`ui.spinner()`), not the word "Caricamento…"
- [x] Satispay/Revolut/PayPal marks replaced with each brand's own real
      logo (recolored to `currentColor`, see `src/vendor/README.md`),
      reversing the project's earlier "no third-party logos" stance for
      instant recognition — IBAN and "other methods" stay hand-drawn.
      Wherever the wordmark appears with no page title of its own (the
      editor, the public viewer, "How it works", Privacy), it's now a
      link back home. "How it works" and Privacy no longer show their own
      title twice (topbar *and* `<h1>`) — dropped from the topbar, kept in
      the visible heading
- [x] Open Graph / Twitter card tags (`src/components/SocialMeta.astro`)
      on all three pages, with one static share image
      (`public/og-image.png`, source mockup in `tools/og-image.html`) —
      a per-page dynamic image isn't possible without breaking the
      privacy model, since a shared page's title lives only in the URL
      fragment, which never reaches the server (PLAN.md section 3).
      Pared back to just the logo mark and wordmark on the paper
      background after the first version (tagline + method-icon row)
      read as too busy for a share preview
- [x] Real favicon (`public/favicon.svg`, PNG fallback, and an
      apple-touch-icon for iOS home-screen bookmarks) — the product's own
      logo mark, replacing the empty `data:,` placeholder
- [x] Dark mode lightened: the original surfaces (`#141210`/`#1D1A17`/
      `#100E0C`) read as near-black rather than a warm charcoal —
      brightened to `#2E2924`/`#3B342C`/`#221E18` (`src/styles/ds/colors.css`,
      both the `data-theme="dark"` override and the
      `prefers-color-scheme` default)
- [x] Editor intro simplified further: one headline, no separate
      subtitle sentence — the headline's own key word ("securely"/
      "al sicuro") is now the link to "How it works", so there's nothing
      left to explain in a second line
- [x] "Your pages" rows show only the title, never the raw link — a saved
      page with no title gets a shared default name ("Pagina senza
      titolo"/"Untitled page"), numbered from the second one on so
      several untitled pages stay distinguishable (the first stays
      unnumbered)
- [x] "Created" screen simplified: no "keep the link" warning notice, no
      visible read/edit link text (both still readable by scripts/tests,
      just not shown — see `src/pages/index.astro`). A third ghost
      button, "Modifica", sits below the QR next to "Come la vedono"/
      "Le tue pagine", going straight back into the (still-filled) editor
- [x] Public viewer topbar redesigned: the wordmark (home link) moves to
      its usual left slot, and the "Fanne una tua"/"Make your own" CTA
      that used to sit at the bottom of the page moves up into the
      topbar's right slot, visible without scrolling
- [x] Softer fallback title on the public page when the creator didn't
      set one — "Dammi i soldi"/"Gimme the money" read as demanding;
      replaced with the plain "Pagina di pagamento"/"Payment page"
- [x] "How it works" rewritten as three short, literal, animated scenes
      instead of a wall of text — explain-like-I'm-five, not a technical
      writeup. Scene 1 reuses the real method tiles from the editor
      itself (not an abstraction); scene 2 is a padlock snapping shut
      over a few "unreadable" dashes; scene 3 is a link travelling
      between two phones, looping. All hand-drawn SVG in the same
      stroke-based style as the rest of the design system, animated
      with plain CSS `@keyframes` (no JS, no inline styles — CSP-safe),
      with a `prefers-reduced-motion` fallback to a static end-state.
      The old 4-step text list and the hosting-providers notice box are
      gone; what's left of that (the providers) is one link to the full
      privacy page, plus a one-line reminder to save the link
- [x] Opening an edit link no longer shows a blank editor screen while
      the existing page is fetched/decrypted — a spinner (the same
      `ui.spinner()` as the read-only viewer's own loading state) fills
      that gap, since `initEditor()`'s DOM doesn't exist yet at that
      point. Needed `[data-editor-form]` (wrapping `.ds-body` +
      `.ds-sticky`) to pick up `.ds-page`'s flex layout itself, otherwise
      `.ds-body`'s `flex: 1` — which pins the sticky create/save button
      to the bottom on short pages — had no flex container to apply to
- [x] "How it works" copy pass: dropped the "In tre passaggi"/"Three
      steps." lead-in and the "save the link to edit later" reminder —
      both redundant once the three scenes speak for themselves. Scene
      2's caption now names who's on each side of the encryption
      ("Li cifriamo... la chiave resta solo a te"/"We encrypt them...
      the key stays only with you"), scene 3's is a direct call to
      action ("Condividi la chiave — il link —
      con chi vuoi farti pagare!"/"Share the key — the link — with
      whoever you want to pay you!") with a small punchline underneath
      ("No chiave, no party."/"No key, no party."). The privacy link at
      the bottom is now a question + link ("Vuoi entrare più nel
      dettaglio? Leggi la nostra privacy"/"Want the details? Read our
      privacy page") instead of a bare link
- [x] Privacy page redesign: a scannable "at a glance" strip (4 short
      facts — no account, no email, encrypted before it leaves the
      device, no tracking) sits above the existing detailed sections, for
      whoever just wants the headline; each detailed section (what we
      see, what we don't do, who hosts the site, what stays on your
      phone) now carries its own small icon for quicker scanning. Body
      copy for "what we see" and "what we don't do" tightened to active
      voice to match the how-it-works rewrite. Section order, the beta
      notice, and the back button are unchanged — the redesign is
      additive, not a restructure
- [x] Open Graph title/description reworded to match the redesigned
      home's tone ("dammeli — pagamenti sempre al sicuro") and, since
      this is the card whoever receives a payment link actually sees,
      written from the recipient's side rather than the creator's — "un
      link cifrato per pagare", not "your payment methods". The OG image
      itself (logo + wordmark) was already fine and untouched
- [x] Spanish added as a third UI language (`src/lib/i18n.mjs`'s `{it, en,
      es}` dictionary, hand-translated and checked key-for-key against
      `it`/`en` — a new test enforces that all three dictionaries stay in
      sync). `detectLang()` now also recognizes `es*` browser locales,
      still falling back to English for anything else. Covers the whole
      UI: editor, Your pages, Created screen, public viewer, How it works
      (including its three animated scenes), and the privacy page
- [x] SHA-256 hash of `crypto.js` published in `README.md`, kept in sync
      by hand with every change to the file
- [x] Satispay (and any future method like it) reworked into a
      **contact-based method** (`src/lib/contact-methods.mjs`): these
      apps have no direct pay-link at all, only "send to someone already
      in your contacts" — so instead of a bare phone field, the editor
      now asks for name + phone (mirroring IBAN's holder field). Unlike
      IBAN, the read-only page never shows either back as text — nothing
      there is worth reading or copying by hand. It also doesn't get
      IBAN's bigger dedicated card: with no single click action to fill
      the row every other method has, it looked out of place next to
      them at first — now it's the same row height and chrome as
      PayPal/Revolut (`.ds-pay-btn--static`), with a short note under the
      label ("Works through your phone contacts") explaining the row,
      and two real actions instead of the usual single "open"/"copy"
      indicator: a labeled "Salva contatto"/"Save contact" button with a
      phone-handset icon (plain icon-only buttons didn't read as
      "save a contact" at all) — a vCard, `src/lib/vcard.mjs`, downloaded
      client-side via a `Blob`, no server round trip — so the creator
      lands in the payer's contacts, name and number both right, before
      the payer even opens the app; and "Apri"/"Open" on iOS via
      `satispay://`, styled exactly like every other row's action
      indicator for consistency (no documented Android link, so the
      button is iOS-only rather than a silent no-op there). If a page
      has more than one contact-based
      method, opening a second one's empty popover offers a "Usa
      +39…417" chip (`ui.suggestionChip()`) that fills both fields from
      whichever sibling method already has both set — one tap instead of
      typing the same contact twice, live rather than just-on-blur so it
      disappears the moment the user starts typing their own value.
      Reverses PLAN.md section 5's original "holder only on iban" line:
      `name` is now allowed on any contact-based method, checked by type
      in `assemblePayload()` itself rather than trusted from the caller
- [x] Both loading states (opening a read link, opening an edit link)
      replaced the plain spinning ring with `ui.loader()`: a padlock
      breathing open and shut on a loop, a "secured" ring pulsing out
      each time it closes, and a few ciphertext-looking dashes
      flickering underneath — same hand-drawn stroke language and
      `currentColor`/CSS-class-driven palette as how-it-works' own
      encryption scene, since a fetch/decrypt moment is quite literally
      that scene. Bigger and now actually centered on the remaining
      screen space below the topbar (`flex: 1` on `.editor-loading`/
      `.viewer-loading`, not just horizontally as before), with a
      `prefers-reduced-motion` fallback to a static closed-lock state.
      Found and fixed a real bug along the way: `applyTheme()` was only
      ever called from `buildEditorTopBar()`, so a saved dark-mode
      override was silently ignored on the read-only viewer — moved to
      run once at the top of `boot()` instead, before any screen branch
- [x] "Created" screen decluttered again: the topbar's own "Fatto."/
      "Done." text is gone (just the wordmark now, like every screen
      with nothing of its own to say there) and no longer duplicated by
      a second "Edit" button below — one pencil icon in the topbar does
      it, now next to a bookmark icon for "Your pages" (both were
      separate ghost-row buttons before). The fallback title no longer
      repeats "pronta"/"ready" right under the badge that already says
      it ("La tua pagina è pronta" → "La tua pagina"/"Your page is
      ready" → "Your page"). The "copy edit link" button is gone
      entirely — PLAN.md section 8 revised to match: losing it now
      just means making a new page, an accepted cost for a calmer final
      screen, not something demanding a dedicated safety-net action
      right when the creator's about to go share the read link with
      someone else. In its place, centered on its own: an eye-icon
      "Vedi la pagina pubblica"/"View the public page" button
- [x] Open Graph copy reworked again: "dammeli — pagamenti sempre al
      sicuro" still read as a brand slogan, not as "here's what you're
      about to open" — the one thing that actually matters on a share
      preview. Replaced with "Ecco come pagarmi" / "Scegli il metodo che
      preferisci, tra quelli che uso :)", written as the creator
      talking directly to whoever they sent the link to, workshopped
      together over several rounds (clinical → punchy/Gen-Z → warm).
      The ":)" is the one deliberate exception to the rest of the app's
      otherwise emoji/emoticon-free copy — earned here because this is
      the one spot a person is speaking, not the product. `og:image:alt`
      updated to just "dammeli" (describes the actual image — logo +
      wordmark, no tagline drawn into it) now that it no longer doubles
      as a copy of the old title
- [x] README rewritten for a now-public repo: used to open straight into
      architecture (CSP, Astro config, stack bullets), which assumed a
      reader already sold on the project. Now leads with what the
      product actually does and why, in plain language, before any of
      that — the technical sections (stack, `crypto.js` hash, local dev,
      API, privacy, the AI-assisted development note, license) are all
      still there, just below the fold instead of first. Added
      `public/wordmark.png` (source: `tools/wordmark.html`, same
      screenshot-a-mockup method as `og-image.png`) — the wordmark on
      its own, for the README header, since the full logo+wordmark
      lockup read as too much there
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
- Per-method label — shipped for the free-form "other methods" slots in
  0.7; the four main methods (Satispay/Revolut/PayPal/IBAN) still don't
  have one. Page title itself shipped in 0.5/0.6, no longer deferred
- Silent payments and xpub derivation
- Backup retention policy
