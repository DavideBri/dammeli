# dammeli (damme.li)

Pagina di pagamento cifrata end-to-end. Raccogli i tuoi metodi di pagamento in
una pagina e condividi il link. Il server non puo' leggere nulla: riceve solo
blob cifrati.

La chiave di cifratura vive esclusivamente nel fragment dell'URL (`#...`) e
non lascia mai il browser: non viene mai inviata al server, non e' mai
loggata. Il modello di sicurezza completo, con la crittografia usata e i suoi
limiti, e' descritto in `CLAUDE.md` (verra' spostato in una pagina di
documentazione pubblica prima del lancio, vedi roadmap 1.5).

## Stato del progetto

In sviluppo (`0.3`, API e persistenza). Non ancora usabile: manca l'editor.
Vedi [`ROADMAP.md`](./ROADMAP.md).

`0.x.y` fino al lancio pubblico. Il MAJOR si alza solo quando un link creato
con una versione precedente smetterebbe di funzionare, mai per altri motivi
(vedi `CLAUDE.md`, sezione 11).

## Stack

- [Astro](https://astro.build) in `output: 'static'`: nessun server-side
  rendering, il sito compila in HTML statico.
- Nessun framework JS lato client, nessun bundler per la crittografia.
- Hosting: [Netlify](https://netlify.com), deploy automatico da questo repo.
- Database (temporaneo, vedi nota migrazione in `CLAUDE.md`):
  [Supabase](https://supabase.com).

## `public/crypto.js`

Tutta la crittografia vive in un unico file dentro `public/`, che Astro copia
nell'output di build **senza processarlo**: il file servito in produzione e'
byte-identico a quello nel repo. Chiunque puo' confrontarlo riga per riga con
questo repository, senza fidarsi di una build.

Hash SHA-256 del file, aggiornato a ogni release:

```
e0874b944bc0a1d839d5988125a571c2815af26af7a03ac34a9b15e889721d31
```

## Sviluppo locale

Richiede [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # output in dist/
pnpm preview   # serve dist/ in locale
pnpm test      # test vector e vincoli crittografici (crypto.js)
```

## API (`/p`)

Implementata come [Netlify Functions](https://docs.netlify.com/functions/overview/)
indipendenti (`netlify/functions/`), non come rotte Astro: il frontend resta
`output: 'static'` per la CSP (vedi `CLAUDE.md` sezione 9), l'API e' un
concetto separato per design — l'interfaccia `store` (`src/server/store/`)
esiste apposta per essere sostituita in v2 senza toccare il resto.

Per collegare Supabase in locale:

```sh
cp .env.example .env   # poi compila SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
```

Le stesse variabili vanno impostate anche nelle Environment variables del
sito su Netlify. Lo schema e la policy RLS sono in `sql/schema.sql`, da
eseguire una volta nel SQL editor del progetto Supabase. Senza credenziali,
`pnpm test` gira comunque: usa uno store in memoria al posto di Supabase.

## Fornitori terzi e privacy

Netlify e Supabase sono fornitori americani: ricevono richieste HTTP e
vedono solo blob cifrati illeggibili, mai chiavi ne' dati in chiaro. Una
pagina privacy dedicata, con l'elenco completo dei fornitori e cosa vedono
ciascuno, arriva con la beta privata (roadmap `0.9`).

## Licenza

[AGPL-3.0](./LICENSE). Chi fa girare una versione modificata di questo
codice come servizio di rete deve rendere disponibile il proprio codice
sorgente agli utenti di quel servizio.
