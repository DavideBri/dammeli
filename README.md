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

Primissimo stadio (`0.1`, scheletro verificato). Non ancora funzionante, non
ancora usabile. Vedi [`ROADMAP.md`](./ROADMAP.md).

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
(da pubblicare alla prima release funzionante di crypto.js, vedi roadmap 0.2)
```

## Sviluppo locale

Richiede [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # output in dist/
pnpm preview   # serve dist/ in locale
```

## Fornitori terzi e privacy

Netlify e Supabase sono fornitori americani: ricevono richieste HTTP e
vedono solo blob cifrati illeggibili, mai chiavi ne' dati in chiaro. Una
pagina privacy dedicata, con l'elenco completo dei fornitori e cosa vedono
ciascuno, arriva con la beta privata (roadmap `0.9`).

## Licenza

[AGPL-3.0](./LICENSE). Chi fa girare una versione modificata di questo
codice come servizio di rete deve rendere disponibile il proprio codice
sorgente agli utenti di quel servizio.
