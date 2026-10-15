# Contributing to dammeli

Ideas, bug reports, and pull requests are welcome. This is a small,
still-evolving project (private beta — see [`ROADMAP.md`](./ROADMAP.md)),
so there's genuinely a lot still open, not just typo fixes.

## Before you start

- Read [`PLAN.md`](./PLAN.md) first, especially if you're thinking about
  an architecture change. It documents this project's actual
  non-negotiable constraints — the CSP, the encryption model, the
  payload format, what the server is and isn't allowed to see — not
  just a design doc. A PR that conflicts with something written there
  needs a discussion first, in an issue, before the code.
- Check [`ROADMAP.md`](./ROADMAP.md) for what's already planned or in
  progress, so effort doesn't overlap.
- For anything nontrivial, open an issue before a PR. Saves everyone a
  rewrite if the approach needs to change.

## Local setup

See the README's [Local development](./README.md#local-development)
section — `pnpm install`, `pnpm dev`, `pnpm test`.

## Before opening a PR

- `pnpm test` and `pnpm build` both need to pass. There's no CI yet, so
  this is the only check there is — run them yourself.
- Touching `public/crypto.js`? Say so explicitly in the PR description.
  It's the one file whose published SHA-256 hash (see the README) has
  to change whenever it does, it's deliberately never bundled or
  processed, and it's the one place a mistake is worst — it deserves
  extra scrutiny, not less.
- Keep the CSP intact: no inline `style=""`, no `element.style.*`
  mutation, nothing loaded from a CDN. `PLAN.md` section 9 explains why.
- Touching user-facing copy? All three languages in `src/lib/i18n.mjs`
  (`it`, `en`, `es`) need to stay in sync — a test enforces this, so
  it'll fail loudly if one's missed.

## What's especially welcome

- Bugs — obviously.
- Real usability feedback. This has been tested by the people building
  it, not yet by real users (see `ROADMAP.md`'s `0.9` milestone).
- Payment-method deep-link research — e.g. Satispay still has no
  confirmed Android equivalent to its iOS `satispay://` scheme, see
  `src/lib/contact-methods.mjs`.

## License

By contributing, you agree your changes are licensed under the
project's [AGPL-3.0](./LICENSE), same as the rest of the code.
