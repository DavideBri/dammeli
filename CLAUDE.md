# dammeli (damme.li)

Pagina di pagamento cifrata end-to-end. L'utente raccoglie i suoi metodi di
pagamento in una pagina e ne condivide il link. Il server non puo' leggere
nulla: riceve solo blob cifrati.

Questo file e' il contesto di progetto. Contiene le decisioni gia' prese e i
vincoli non negoziabili. Leggilo prima di proporre modifiche all'architettura.

---

## 1. Cosa e' e cosa non e'

**E'**: un raccoglitore di identificatori di pagamento, cifrato lato client,
senza account, senza recupero.

**Non e'**: un Linktree per pagamenti. Quel prodotto esiste gia' (Linktree,
Beacons, PayRequest) e non e' difendibile. L'unica cosa che giustifica
l'esistenza di dammeli e' la privacy.

**Non sara' mai**: un processore di pagamenti. Vedi vincolo L1.

---

## 2. Vincoli non negoziabili

Questi non si discutono senza una decisione esplicita dell'autore.

| ID | Vincolo | Perche' |
|----|---------|---------|
| L1 | Il server non tocca mai denaro. Solo visualizzazione e link in uscita. | Toccare i fondi fa scattare PSD2 e potenzialmente MiCA/VASP. |
| C1 | La chiave non lascia mai il browser. Sta nel fragment dell'URL. | E' l'intero modello di sicurezza. |
| C2 | `location.hash` non deve mai finire in un fetch, un log, `document.title` o un redirect. | Un `console.log` dimenticato annulla C1. |
| C3 | Mai `Math.random()`. Solo `crypto.getRandomValues`. | Non e' un CSPRNG. |
| C4 | Nonce nuovo a ogni scrittura. | Riusare un nonce con la stessa chiave rompe AES-GCM completamente. |
| V1 | Un link creato oggi deve aprirsi per sempre. Ogni versione del formato resta supportata in lettura. | Non esiste recupero dati. E' una promessa contrattuale, non una best practice. |
| P1 | Zero risorse esterne nel frontend. Nessun CDN, nessun font remoto, nessun widget di terzi. | Ogni terzo e' un IP che trapela e un punto in meno nell'argomentazione. |

---

## 3. Crittografia

```
master            16 byte da crypto.getRandomValues (128 bit)
                  vive solo nel fragment

read_key      =   troncamento a 16 byte di H("read"  | master)
write_token   =   troncamento a 16 byte di H("write" | master)
id            =   troncamento a 8 byte (64 bit) di H("id" | read_key)
```

`H` e' SHA-256. Il troncamento a 16 byte su `read_key` e `write_token` e'
esplicito e voluto: la `master` ha 128 bit di entropia, quindi nessun
derivato puo' contenerne di piu', anche se l'output grezzo di SHA-256 e' piu'
lungo. Tenerli a 32 byte nel codice darebbe l'illusione di un margine di
sicurezza che non esiste.

Cifratura: **AES-GCM**, chiave = **`read_key`** (mai la `master` direttamente).
Nonce casuale generato a ogni scrittura, salvato in chiaro accanto al
ciphertext.

La `read_key`, non la `master`, e' l'unico segreto necessario per leggere una
pagina: da essa si derivano sia `id` (per localizzare il record) sia la chiave
di cifratura (per decifrarlo). Chi ha solo il link di lettura ha solo la
`read_key` nel fragment: puo' decifrare la pagina, ma non puo' risalire alla
`master` ne' al `write_token`. Se l'implementazione usasse la `master` come
chiave AES, i link di sola lettura smetterebbero di funzionare.

### Formato del link

```
damme.li/#1rN4pQv8Lx2Wm7Ka3Bc9Fd
          ││└──────────────────── chiave (22 caratteri base64url = 128 bit)
          │└───────────────────── tipo: r = lettura, m = modifica
          └────────────────────── versione del formato crittografico
```

Circa 32 caratteri totali. L'id **non compare nell'URL**: lo ricalcola il
browser dalla chiave.

La versione sta nel fragment e non nel blob perche' il client deve sapere quale
schema usare *prima* di poter calcolare l'id e scaricare il blob.

### Perche' 128 bit e non meno

Chi ottiene il database puo' attaccare i blob offline, senza rate limiting.
Il segreto deve resistere a forza bruta offline. A parita' di sicurezza le
parole mnemoniche sono *piu' lunghe* dei caratteri casuali (4 parole da 2048 =
44 bit in ~24 caratteri), quindi non sono un'opzione. Discussione chiusa.

---

## 4. Data model

```sql
CREATE TABLE pages (
  id               INTEGER PRIMARY KEY,  -- 64 bit, derivato da read_key
  nonce            BLOB NOT NULL,
  ciphertext       BLOB NOT NULL,        -- sempre 4096 byte
  write_token_hash BLOB NOT NULL
);
```

Quattro colonne. **Nessuna data, nessuna scadenza, nessun contatore, nessun
riferimento all'utente.**

- `created_at` e `expires_at` sono stati esclusi deliberatamente: rivelerebbero
  quando una pagina e' stata creata e usata. La scadenza con rinnovo alla
  lettura e' una feature futura, non v1.
- Il ciphertext e' **padded a 4096 byte fissi**. La lunghezza variabile
  rivelerebbe quanti metodi contiene ogni pagina. Il padding e' validato dal
  server, non ci si fida del client.
- Conseguenza accettata: se il database viene riempito di spazzatura, non e'
  ripulibile selettivamente. Mitigazione: il PoW e' blocker per il lancio
  pubblico.

---

## 5. Payload (dentro il blob cifrato)

```json
{
  "v": 1,
  "methods": [
    { "type": "satispay", "value": "brunoxyz" },
    { "type": "revolut",  "value": "brunoxyz" },
    { "type": "paypal",   "value": "brunoxyz" },
    { "type": "iban",     "value": "IT60X0542811101000000123456",
                          "holder": "Bruno Rossi" },
    { "type": "bitcoin",  "value": "sp1qq..." }
  ]
}
```

- **Array, non oggetto**: l'ordine e' informazione, l'utente mette per primo il
  metodo che preferisce.
- **`value` contiene solo l'handle, mai l'URL completo.** Se Revolut cambia
  formato URL, con l'handle basta un deploy; con l'URL salvato avresti migliaia
  di blob rotti e illeggibili.
- **`holder` solo su `iban`**, mai a livello di pagina. E' l'unico
  identificatore reale nel payload e non deve finire nel blob di chi usa solo
  Satispay.
- Chiavi lunghe e leggibili: il padding a 4 KB rende la compattezza inutile.

### Versione del payload

Il `v` serve al client **nuovo** per leggere blob **vecchi**. I client vecchi
non esistono, perche' il client arriva dal server a ogni visita. La logica di
lettura deve quindi reggere tutte le versioni passate, per sempre.

Aggiungere un campo opzionale non e' un bump di versione. Si bumpa solo quando
cambia il significato di qualcosa che esiste gia'.

### Nota su `holder` e VoP

Dal 9 ottobre 2025 la Verification of Payee e' obbligatoria sui bonifici SEPA:
la banca del pagatore confronta il nome inserito con l'intestatario dell'IBAN e
restituisce Match / Close Match / No Match / VoP not possible.

Conseguenza UI: l'etichetta del campo non e' "nome e cognome" ma
**"intestatario del conto, esattamente come risulta in banca"**, con una riga di
aiuto. Un Close Match su una pagina di pagamento distrugge la fiducia.

---

## 6. API

```
POST   /p        crea       body {id, nonce, ct, wth}    -> 201
GET    /p/:id    leggi                                    -> 200 {nonce, ct}
PUT    /p/:id    aggiorna   body {nonce, ct, wt}          -> 204
DELETE /p/:id    cancella   body {wt}                     -> 204
GET    /healthz                                           -> 200
```

`wth` e `wt` non sono la stessa cosa: `wth` (write_token**_hash**, SHA-256 di
`write_token`) e' cio' che il server conosce e persiste fin dalla creazione;
`wt` (`write_token` vero) arriva solo su `PUT`/`DELETE` per autenticare la
scrittura, e il server lo accetta solo se `SHA256(wt)` combacia con la `wth`
salvata. Fino a quel momento il server non ha mai visto il `write_token`
vero, solo il suo hash — esattamente come una password.

Regole:

- Il `write_token` va **nel body**, mai in header `Authorization` e mai in query
  string: header e query finiscono nei log dei fornitori.
- **404 uniforme.** "Non esiste" e "non te lo dico" devono essere
  indistinguibili, altrimenti l'endpoint diventa un oracolo per verificare quali
  id esistono.
- **Stesso corpo per tutti gli errori**: `{"error":"not_found"}`. Nessuna
  differenza tra token sbagliato e record inesistente.
- **Rifiuta qualunque ciphertext che non sia esattamente 4096 byte.**
- `POST` su un id esistente: **409**, mai sovrascrivere. E' il caso collisione.
- `PUT` con nonce identico a quello salvato: **rifiuta**. Unico controllo che il
  server puo' fare per proteggere l'utente da un bug del client.

---

## 7. Metodi di pagamento (v1, Italia-first)

Quattro card principali: **Satispay, Revolut, PayPal, IBAN**.
Crypto sotto "altri metodi".

Esclusi: Venmo, Cash App, Zelle. Solo USA e con restrizioni sull'uso
commerciale nei loro termini.

Ogni card deve avere:

1. **Istruzioni operative**, non link alla documentazione. Con i nomi veri dei
   bottoni: *"Apri Revolut, tocca il tuo nome in alto a sinistra, sotto trovi il
   tuo @username"*.
2. **Tolleranza all'incolla sporco.** `https://www.paypal.me/brunoxyz?locale=it`
   diventa `brunoxyz`. L'IBAN con gli spazi si normalizza. Mai dire "formato non
   valido" quando si capisce cosa intendeva l'utente.
3. **Gestione del caso "non ce l'ho".** Il link paypal.me va creato una volta e
   non esiste di default. Senza questa riga, la card PayPal e' un vicolo cieco
   per meta' degli utenti.
4. **Conferma visiva** dopo l'inserimento: icona piu' ultimi caratteri. Un IBAN
   sbagliato e' il fallimento peggiore possibile.

---

## 8. Flusso di creazione

Obiettivo: sotto i 20 secondi, da telefono.

1. **La home e' gia' l'editor.** Niente landing, niente registrazione, niente
   "inizia ora". Ogni schermata prima dell'editor costa meta' degli utenti.
2. Card dei metodi, l'utente compila quelle che gli servono.
3. Un bottone "Crea".
4. **Schermata finale**, in quest'ordine: bottone grande "Copia link", bottone
   "Invia su WhatsApp", QR code. Sotto, una riga sobria e non allarmante: questo
   link e' l'unico modo per rientrare, salvalo.

**Ritorno**: il link di modifica completo, fragment incluso, sta in
`localStorage`. Il fragment non e' mai andato al server, quindi salvarlo in
locale non tradisce il modello. L'utente riapre `damme.li` dallo stesso telefono
e ritrova le sue pagine senza aver mai fatto login. Cambio dispositivo o pulizia
dati: serve il link di modifica salvato a mano.

**Due link distinti**: uno di sola lettura da condividere, uno di modifica da
tenere. Con un link solo, chiunque lo riceva puo' cambiare l'IBAN.

Scartato per la v1: titolo della pagina, etichetta per metodo. Entrambi campi
opzionali, aggiungibili dopo senza bump di versione.

---

## 9. Stack

| Pezzo | Scelta | Note |
|---|---|---|
| Frontend | Astro, `output: 'static'` | Nessun SSR, il sito e' statico |
| Crypto | `public/crypto.js`, non bundlato | Vedi sotto |
| Hosting frontend | Netlify, deploy da GitHub | |
| Database | Supabase | Temporaneo, vedi nota migrazione |
| Accesso DB | interfaccia `store` con `Get` / `Put` / `Delete` | Mai chiamare il client Supabase sparso nel codice |

### crypto.js fuori dal bundle

Tutta la crittografia sta in un file dentro `public/`, che Astro copia senza
processarlo. Il file servito e' byte-identico a quello nel repo, quindi
chiunque puo' confrontarlo con GitHub riga per riga.

Il README deve linkare quel file e dichiararne l'hash SHA-256, aggiornato a
ogni release.

### Configurazione Astro obbligatoria

- `output: 'static'`
- `build.inlineStylesheets: 'never'` (il default `auto` inlinea i CSS piccoli e
  costringe a `unsafe-inline`)
- **Niente islands, niente `client:load`, niente `ClientRouter`.** Gli islands
  inseriscono style e script inline e rendono impossibile una CSP stretta. Le
  view transitions di Astro non sono supportate dalla feature CSP.
- CSP nativa di Astro, tramite l'opzione stabile `security.csp` (introdotta in
  Astro 6.0, non piu' sperimentale nella versione in uso in questo repo).
  Genera un `<meta http-equiv="content-security-policy">` con hash per script e
  stili bundlati: nessun adapter necessario per l'output statico. L'header via
  adapter resta un'opzione futura se servisse difesa in profondita' aggiuntiva.
- QR generato in locale, libreria vendorizzata nel repo, mai da CDN.

### Nota migrazione

Netlify e Supabase sono una scelta di velocita', non di principio. Sono due
fornitori americani che loggano ogni richiesta. Accettabile perche' vedono solo
blob illeggibili, **ma va dichiarato nel README e nella pagina privacy**: quali
fornitori, dove stanno, cosa vedono.

Target v2: VPS europeo, binario Go, SQLite. L'interfaccia `store` esiste
apposta: la migrazione deve essere una nuova implementazione, non una riscrittura.

Firebase e' stato valutato e scartato: document store dove serve una tabella a
quattro colonne, migrazione futura piu' costosa, e Google e' il fornitore meno
compatibile con la pagina privacy di questo prodotto.

---

## 10. Abuso e rate limiting

**Non in v1**, ma **blocker per il lancio pubblico**.

Il proof of work e' puramente additivo: e' un controllo prima dell'insert, non
tocca schema, chiavi o link esistenti. Rimandarlo non costa nessuna migrazione.

Piano quando si fa:

- **ALTCHA** self-hosted con **Argon2 o scrypt**. Memory-bound, quindi
  resistente a GPU e ASIC. Un PoW fatto in casa con SHA-256 lo batte chiunque
  abbia una scheda video. ALTCHA ha una build in `/dist/external` pensata per
  CSP strette.
- Difficolta' **adattiva** da configurazione, alzabile senza deploy.
- Alternativa valutata: Cap (piu' piccolo, piano B). Scartati: mCaptcha
  (pre-1.0), Friendly Captcha (commerciale).
- **Niente Cloudflare Turnstile**: e' uno script di terzi caricato proprio nella
  pagina dove si chiede fiducia. Contraddice P1.

Nel frattempo, solo configurazione: limite di dimensione del body, rate limit di
connessione sul reverse proxy, alert sullo spazio disco.

---

## 11. Versionamento

**SemVer**, con una regola specifica di progetto:

> Il MAJOR si alza solo quando un link vecchio smette di funzionare.
> Non quando cambia l'interfaccia, non quando cambia il database.

`0.x.y` fino al lancio pubblico. Il passaggio a `1.0.0` coincide con il PoW in
produzione.

Due versionamenti distinti, da non confondere:

| | Dove | Cosa versiona | Costo del cambio |
|---|---|---|---|
| Versione del link | fragment, in chiaro | crittografia, derivazione, id | altissimo, supporto perpetuo |
| Versione del payload | dentro il blob | nomi dei campi, metodi | quasi zero |

---

## 12. Domande ancora aperte

- Build riproducibile del frontend: rimandata, non decisa.
- Handle pubblico `bruno@damme.li` come Lightning Address e BIP-353: prodotto
  separato, non ibridare con la modalita' cifrata nella v1.
- Strategia anti-impersonificazione per la modalita' handle pubblico. Idee non
  ancora valutate: proof of control via DNS TXT o account GitHub, firma della
  pagina con DID / SD-JWT VC.
- Politica di retention dei backup.
