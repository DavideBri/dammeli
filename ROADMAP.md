# Roadmap dammeli

Regola di versionamento: il MAJOR si alza solo quando un link vecchio smette di
funzionare. `0.x.y` fino al lancio pubblico.

---

## 0.1 Scheletro verificato

L'obiettivo non e' avere qualcosa che funziona, e' sapere se lo stack regge i
vincoli. Se la CSP non si chiude, meglio scoprirlo adesso.

- [x] Astro configurato: `output: 'static'`, `inlineStylesheets: 'never'`
- [x] CSP nativa attiva e **verificata su pagina vuota**, console pulita, nessun
      `unsafe-inline`
- [x] `public/crypto.js` vuoto ma importato come modulo ES, verificato
      byte-identico nel build output
- [x] Deploy su Netlify da GitHub (dammeli.netlify.app) — dominio damme.li
      ancora da collegare
- [ ] Repo pubblico, licenza, README minimo — licenza e README fatti, repo
      ancora privato

**Criterio di uscita**: pagina bianca online su damme.li con CSP stretta e
nessun errore in console.

---

## 0.2 Crittografia

Il pezzo che non si puo' sbagliare. Da fare prima di qualunque interfaccia.

- [x] Generazione master key con `crypto.getRandomValues`
- [x] Derivazione `read_key`, `write_token`, `id`
- [x] Cifratura e decifratura AES-GCM con nonce nuovo a ogni scrittura
- [x] Encoding e parsing del fragment `#<ver><tipo><chiave>`
- [x] Padding a 4096 byte e sua rimozione
- [x] **Test vector**: payload noto, chiave nota, ciphertext atteso. Serve a
      garantire per sempre il vincolo V1
- [x] Test: nonce mai ripetuto su scritture successive
- [ ] Audit manuale: `location.hash` letto in un solo punto, mai in fetch, log,
      title o redirect — non applicabile ancora: nessun punto dell'app legge
      `location.hash` finche' non esiste un editor (0.4/0.5). `crypto.js` non
      lo tocca per costruzione, verificato da un test automatico

**Criterio di uscita**: cifro un payload, ricarico la pagina, lo decifro dal
link. Tutto in locale, nessun server.

---

## 0.3 API e persistenza

- [ ] Interfaccia `store` con `Get` / `Put` / `Delete`
- [ ] Implementazione Supabase
- [ ] `POST`, `GET`, `PUT`, `DELETE /p`, `GET /healthz`
- [ ] Validazione server-side del padding a 4096 byte
- [ ] 404 uniforme, stesso corpo per tutti gli errori
- [ ] 409 su id esistente, rifiuto su nonce ripetuto
- [ ] **RLS verificata**: la tabella non deve essere leggibile in massa dal
      client con la anon key
- [ ] Body size limit sul reverse proxy

**Criterio di uscita**: creo una pagina da curl, la rileggo, la modifico, la
cancello. Il database contiene solo rumore.

---

## 0.4 Editor

- [ ] Card per Satispay, Revolut, PayPal, IBAN
- [ ] Istruzioni operative per ogni metodo, con i nomi veri dei bottoni
- [ ] Normalizzazione dell'incolla sporco (URL completi, IBAN con spazi)
- [ ] Riga "non ce l'ho" con link, almeno su PayPal
- [ ] Campo `holder` sull'IBAN con etichetta VoP corretta
- [ ] Conferma visiva per metodo inserito
- [ ] Sezione "altri metodi" con crypto
- [ ] Riordino dei metodi (l'ordine e' informazione)

---

## 0.5 Condivisione e ritorno

- [ ] Pagina pubblica di sola lettura
- [ ] QR generato in locale, libreria vendorizzata
- [ ] Copia link, invio su WhatsApp
- [ ] Avviso perdita link, sobrio e non allarmante
- [ ] `localStorage` con i link di modifica
- [ ] Schermata "le tue pagine" all'apertura di damme.li
- [ ] Cancellazione pagina

**Criterio di uscita**: creo una pagina in meno di 20 secondi da telefono e un
amico riesce a pagarmi.

---

## 0.9 Beta privata

- [ ] Pagina privacy con i fornitori dichiarati: chi sono, dove stanno, cosa
      vedono
- [ ] Hash SHA-256 di `crypto.js` pubblicato
- [ ] Backup cifrato del database, su provider diverso
- [ ] **Ripristino testato almeno una volta**
- [ ] Alert sullo spazio disco
- [ ] Dieci persone reali, meta' non tecniche
- [ ] Verificare l'unica metrica che conta: quanti completano la creazione e
      quanti ricevono davvero un pagamento

---

## 1.0 Lancio pubblico

Il PoW e' blocker. Senza, un database riempito di spazzatura non e' ripulibile
selettivamente, perche' non ci sono date e i blob sono illeggibili.

- [ ] ALTCHA self-hosted con Argon2, difficolta' adattiva da configurazione
- [ ] Interruttore globale: soglia di creazioni orarie che alza la difficolta'
- [ ] Procedura di gestione abusi e contatto per segnalazioni
- [ ] README completo con il modello di sicurezza spiegato
- [ ] Annuncio: GDG Pisa, blog, Hacker News

---

## 1.5 Documentazione e self-hosting

- [ ] Spiegazione del modello crittografico, con il ragionamento sul perche' 128
      bit e perche' niente link mnemonici
- [ ] Threat model esplicito: cosa protegge e cosa no
- [ ] Implementazione `store` per SQLite
- [ ] Immagine Docker e `docker compose` funzionante
- [ ] Guida al self-hosting, testata su UmbrelOS
- [ ] Documentazione del formato del link e del payload, versione per versione

---

## 2.0 Migrazione e handle pubblico

Due cose separate che capitano nello stesso periodo.

**Migrazione infrastruttura**

- [ ] VPS europeo, binario Go, SQLite
- [ ] Nuova implementazione dell'interfaccia `store`, non riscrittura
- [ ] Valutare build riproducibile e attestazione

**Handle pubblico** (prodotto separato, non ibridare con la modalita' cifrata)

- [ ] `damme.li/bruno`, contenuto deliberatamente non sensibile, mai IBAN
- [ ] Lightning Address su `/.well-known/lnurlp/`
- [ ] Record BIP-353 su `bruno.user._bitcoin-payment.damme.li`, DNSSEC attivo
- [ ] Strategia anti-impersonificazione **decisa prima di scrivere codice**:
      proof of control via DNS o GitHub, oppure firma DID / SD-JWT VC

---

## Rimandato senza data

- Scadenza con rinnovo alla lettura (richiede `expires_at` in chiaro)
- Titolo della pagina, etichetta per metodo
- Silent payments e derivazione xpub
- Politica di retention dei backup
