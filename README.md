# dammeli (damme.li)

End-to-end encrypted payment page. Collect your payment methods on a page
and share its link. The server can't read anything: it only ever receives
encrypted blobs.

The encryption key lives exclusively in the URL fragment (`#...`) and never
leaves the browser: it's never sent to the server, never logged. The full
security model, including the cryptography used and its limits, is
described in [`PLAN.md`](./PLAN.md) (will move to a public docs page before
launch, see roadmap 1.5).

## Project status

In development (`0.3`, API and persistence). Not usable yet: the editor is
still missing. See [`ROADMAP.md`](./ROADMAP.md).

`0.x.y` until public launch. MAJOR only bumps when a link created with a
previous version would stop working, never for any other reason (see
[`PLAN.md`](./PLAN.md), section 11).

## Stack

- [Astro](https://astro.build) with `output: 'static'`: no server-side
  rendering, the site compiles to static HTML.
- [Tailwind](https://tailwindcss.com) v4, compiled at build time via its
  Vite plugin — never the CDN script (`cdn.tailwindcss.com`), which
  generates styles at runtime and would need `unsafe-inline` on the CSP.
- No client-side JS framework, no bundler for the cryptography.
- Hosting: [Netlify](https://netlify.com), automatic deploy from this repo.
- Database (temporary, see migration note in `PLAN.md`):
  [Supabase](https://supabase.com).

## `public/crypto.js`

All the cryptography lives in a single file inside `public/`, which Astro
copies into the build output **without processing it**: the file served in
production is byte-identical to the one in this repo. Anyone can diff it
line by line against this repository, no need to trust a build.

SHA-256 hash of the file, updated with every release:

```
e8384541d98971e9acb0aa36add17a2f3e530eca354485a9289d58227aafc431
```

## Local development

Requires [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # output in dist/
pnpm preview   # serve dist/ locally
pnpm test      # crypto test vector and constraints (crypto.js)
```

## API (`/p`)

Implemented as independent [Netlify Functions](https://docs.netlify.com/functions/overview/)
(`netlify/functions/`), not as Astro routes: the frontend stays
`output: 'static'` for the CSP (see `PLAN.md` section 9), the API is a
separate concern by design — the `store` interface (`src/server/store/`)
exists precisely to be swapped out in v2 without touching anything else.

To connect Supabase locally:

```sh
cp .env.example .env   # then fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

The same variables also need to be set in the site's Environment variables
on Netlify. The schema and RLS policy are in `sql/schema.sql`, to be run
once in the Supabase project's SQL editor. Without credentials, `pnpm test`
still runs fine: it uses an in-memory store instead of Supabase.

## Third-party providers and privacy

Netlify and Supabase are US providers: they receive HTTP requests and see
only unreadable encrypted blobs, never keys or plaintext data. A dedicated
privacy page, with the full list of providers and what each one sees,
arrives with the private beta (roadmap `0.9`).

## License

[AGPL-3.0](./LICENSE). Anyone running a modified version of this code as a
network service must make their source code available to that service's
users.
