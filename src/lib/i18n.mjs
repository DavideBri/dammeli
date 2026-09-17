// Bilingual (IT/EN) copy for the whole UI. A hand-written dictionary
// rather than a library: two languages, no plurals beyond simple counts,
// no runtime-loaded bundles — a library would add weight (PLAN.md
// constraint P1) for a problem this small.
//
// Detection only, no manual override: the browser's own language list
// decides, same as any other site. No account, so there'd be nowhere to
// sync a manual choice to anyway beyond this one device, and the
// device's own setting already does that job.

export const LANGS = ['it', 'en'];

const dict = {
	it: {
		'common.copy': 'Copia',
		'common.copied': 'Copiato!',
		'common.open': 'Apri',
		'common.delete': 'Elimina',
		'common.deleting': 'Eliminazione…',
		'common.deleteConfirm': 'Eliminare questa pagina? Non si può annullare.',
		'common.deleteError': 'Non è stato possibile eliminare la pagina. Riprova.',

		'nav.yourPages': 'Le tue pagine',
		'nav.newPage': 'Nuova pagina',
		'nav.back': 'Indietro',
		'nav.themeLight': 'Tema chiaro',
		'nav.themeDark': 'Tema scuro',
		'nav.edit': 'Modifica',
		'nav.done': 'Fatto.',

		'editor.h1': 'I tuoi metodi di pagamento, mai in chiaro.',
		'editor.subtitle':
			'Finiscono in un link cifrato — nemmeno noi possiamo leggerlo, solo chi ce l\'ha.',
		'editor.titleFieldLabel': 'Titolo della pagina',
		'editor.titleFieldHint':
			'Utile per distinguere le tue pagine — personale, lavoro, un evento. Lo vede anche chi paga.',
		'editor.hintToggle': 'Mostra il suggerimento',
		'editor.titleFieldPlaceholder': 'Paga Bruno',
		'editor.methodsHeading': 'Come vuoi essere pagato',
		'editor.createButton': 'Crea la pagina',
		'editor.saveButton': 'Salva le modifiche',
		'editor.creating': 'Creazione…',
		'editor.saving': 'Salvataggio…',
		'editor.saved': 'Salvato!',
		'editor.createError': 'Qualcosa è andato storto creando la pagina. Riprova.',
		'editor.saveError': 'Qualcosa è andato storto salvando le modifiche. Riprova.',
		'editor.needOneMethod': 'Aggiungi almeno un metodo di pagamento.',
		'editor.filledBadge': 'inserito',
		'editor.pasteConfirmPrefix': 'Finisce con',
		'editor.addMethodLabel': 'Aggiungi',
		'editor.removeMethod': 'Rimuovi questo metodo',
		'editor.preferredLabel': 'Metodo preferito',
		'editor.preferredHint': 'Metodo preferito — verrà mostrato per primo a chi paga.',
		'editor.clearField': 'Svuota il campo',

		'methods.satispay.label': 'Satispay',
		'methods.satispay.fieldLabel': 'Numero di telefono',
		'methods.satispay.placeholder': '+39 340 118 4417',
		'methods.satispay.hint':
			'Nel profilo, sotto il tuo nome: è il numero di telefono con cui ti sei iscritto.',

		'methods.revolut.label': 'Revolut',
		'methods.revolut.fieldLabel': 'Il tuo @tag',
		'methods.revolut.placeholder': '@mariorossi',
		'methods.revolut.hint': 'Apri Revolut → tocca il tuo nome in alto → il tuo @tag è sotto la foto.',

		'methods.paypal.label': 'PayPal',
		'methods.paypal.fieldLabel': 'Il tuo link PayPal.Me',
		'methods.paypal.placeholder': 'paypal.me/mariorossi',
		'methods.paypal.hint':
			'PayPal.Me: dal menu, "Chiedi denaro" → il tuo link finisce con /nome.',

		'methods.iban.label': 'IBAN',
		'methods.iban.fieldLabel': 'IBAN',
		'methods.iban.placeholder': 'IT60 X054 2811 1010 0000 0123 456',
		'methods.iban.hint':
			"27 caratteri, comincia con IT. Lo trovi nell'app della banca alla voce coordinate.",
		'methods.iban.holderLabel': 'Intestatario del conto, esattamente come risulta in banca',
		'methods.iban.holderHint': 'Le banche europee controllano che nome e IBAN coincidano.',
		'methods.iban.holderPlaceholder': 'Mario Rossi',
		'methods.iban.holderTitle': 'Intestatario del conto',

		'methods.crypto.label': 'Altri metodi',
		'methods.crypto.hint':
			"Generico apposta: crypto, un altro servizio di pagamento, qualsiasi cosa. Metti un'etichetta e il valore — fino a 5.",
		'methods.crypto.labelFieldLabel': 'Etichetta',
		'methods.crypto.labelFieldPlaceholder': 'Es. Bitcoin, Wise, Klarna…',
		'methods.crypto.valueFieldLabel': 'Valore',
		'methods.crypto.valuePlaceholder': 'Indirizzo, link o altro',

		'created.badge': 'pronta',
		'created.fallbackTitle': 'La tua pagina è pronta',
		'created.copyLink': 'Copia link',
		'created.linkCopied': 'Link copiato',
		'created.whatsapp': 'Invia su WhatsApp',
		'created.whatsappText': 'Ecco la mia pagina dammeli per pagarmi: {{link}}',
		'created.qrHint': 'oppure fallo inquadrare',
		'created.noticeTitle': 'Tieni il link.',
		'created.noticeBody':
			"È l'unico modo per tornare su questa pagina e cambiarla. Non ce l'abbiamo: se lo perdi, ne fai un'altra.",
		'created.viewPublic': 'Come la vedono',
		'created.copyEditLink': 'Copia link di modifica',

		'myPages.title': 'Le tue pagine',
		'myPages.emptyText': 'Qui finiscono le pagine che crei da questo telefono.',
		'myPages.emptyCta': 'Fanne una',
		'myPages.rowFallbackName': 'Pagina …{{id}}',
		'myPages.notice':
			"L'elenco sta solo su questo telefono. Se cambi dispositivo o cancelli i dati del browser, restano solo i link che hai salvato.",

		'viewer.loading': 'Caricamento…',
		'viewer.error':
			"Questa pagina non esiste, o il link è incompleto. Se l'hai appena ricevuto, chiedi a chi te l'ha mandato di controllare di averlo copiato tutto.",
		'viewer.defaultTitle': 'Dammi i soldi',
		'viewer.kicker': 'Scegli come pagare',
		'viewer.preferredBadge': 'Preferito',
		'viewer.footerPre': 'Pagina fatta con',
		'viewer.footerPost': '. Niente account, niente email.',
		'viewer.footerCta': 'Fanne una tua',
		'viewer.howItWorks': 'Come funziona',

		'howItWorks.title': 'Come funziona',
		'howItWorks.intro':
			'In breve: crei una pagina con i tuoi metodi di pagamento, ottieni un link, lo condividi. Nessun account, nessuna email, e non possiamo leggere quello che ci scrivi — nemmeno se lo volessimo. Ecco come, senza tecnicismi.',
		'howItWorks.step1Title': 'Metti i tuoi metodi di pagamento',
		'howItWorks.step1Body':
			'Satispay, Revolut, PayPal, IBAN, o qualsiasi altra cosa — cripto, un altro servizio, quello che ti serve. Tutto resta sul tuo telefono finché non premi "Crea la pagina".',
		'howItWorks.step2Title': 'Tutto viene cifrato prima di partire',
		'howItWorks.step2Body':
			'Nel momento in cui crei la pagina, quello che hai scritto viene trasformato in un blocco illeggibile proprio dentro il tuo browser — prima ancora che qualsiasi dato lasci il tuo telefono. Quello che arriva ai nostri server è già incomprensibile.',
		'howItWorks.step3Title': 'La chiave vive solo nel link',
		'howItWorks.step3Body':
			"La parte del link dopo il cancelletto (#) è la chiave che serve per leggere la pagina — e quella parte non viene mai inviata da nessuna parte, resta solo nel browser di chi apre il link. Senza quel link, quello che abbiamo salvato è solo rumore, anche per noi.",
		'howItWorks.step4Title': 'Tieni il link, non lo teniamo noi',
		'howItWorks.step4Body':
			"È l'unico modo per tornare sulla tua pagina e modificarla — lo salviamo su questo dispositivo per comodità, ma se cambi telefono o cancelli i dati del browser e non hai il link da un'altra parte, quella pagina è persa per sempre. Nessun recupero: è il prezzo di non avere un account.",
		'howItWorks.hostingTitle': 'E chi ospita tutto questo?',
		'howItWorks.hostingBody':
			'Il sito e il database girano su fornitori esterni. Vedono solo blocchi cifrati illeggibili, mai i tuoi dati in chiaro — ma è giusto saperlo, quindi lo scriviamo qui invece che nascondertelo.',
		'howItWorks.privacyLink': 'Leggi la pagina privacy completa',
		'howItWorks.cta': 'Crea la tua pagina',

		'privacy.title': 'Privacy',
		'privacy.intro':
			'In breve: non possiamo leggere le tue pagine, non ti chiediamo un account né un\'email, e non ti tracciamo. Qui sotto i dettagli, fornitore per fornitore.',
		'privacy.seeTitle': 'Cosa vediamo noi',
		'privacy.seeBody':
			'Niente di quello che scrivi. Ogni pagina viene cifrata dentro il tuo browser prima ancora di partire (vedi "Come funziona"): quello che arriva ai nostri server è già un blocco illeggibile, e resta tale finché qualcuno non apre il link con la chiave giusta — chiave che i nostri sistemi non vedono mai.',
		'privacy.dontTitle': 'Cosa non facciamo',
		'privacy.dontBody':
			'Nessun account, nessuna email richiesta, nessuno script di tracciamento o analytics, nessun cookie. Non sappiamo chi sei e non proviamo a scoprirlo.',
		'privacy.providersTitle': 'Chi ospita il sito',
		'privacy.providersBody':
			'Il sito e le funzioni che lo fanno funzionare girano su Netlify, il database su Supabase — entrambi fornitori americani, scelti per velocità di sviluppo, non per principio. Come ogni servizio web ricevono le richieste che gli mandi, quindi cose come il tuo indirizzo IP e l\'orario — ma il contenuto delle tue pagine resta sempre un blocco cifrato, illeggibile anche per loro. L\'obiettivo è spostare tutto su un server europeo appena possibile.',
		'privacy.deviceTitle': 'Cosa resta sul tuo telefono',
		'privacy.deviceBody':
			'Il link per modificare una pagina viene salvato solo nel tuo browser, su questo dispositivo — non lo mandiamo da nessuna parte e non lo vediamo mai. Se cambi telefono o cancelli i dati del browser senza aver salvato il link altrove, quella pagina è persa per sempre: nessun recupero, è il prezzo di non avere un account.',
		'privacy.betaTitle': 'Una nota sulla beta privata',
		'privacy.betaBody':
			'Il progetto è giovane: facciamo backup del database ma non abbiamo ancora testato un ripristino completo. Trattala come una beta — non usarla per l\'unica copia di qualcosa che non puoi permetterti di perdere.',
		'privacy.back': 'Torna alla home',
	},
	en: {
		'common.copy': 'Copy',
		'common.copied': 'Copied!',
		'common.open': 'Open',
		'common.delete': 'Delete',
		'common.deleting': 'Deleting…',
		'common.deleteConfirm': 'Delete this page? This cannot be undone.',
		'common.deleteError': "Couldn't delete this page right now. Please try again.",

		'nav.yourPages': 'Your pages',
		'nav.newPage': 'New page',
		'nav.back': 'Back',
		'nav.themeLight': 'Light theme',
		'nav.themeDark': 'Dark theme',
		'nav.edit': 'Edit',
		'nav.done': 'Done.',

		'editor.h1': 'Your payment methods, never exposed.',
		'editor.subtitle':
			"They go into one encrypted link — not even we can read it, only whoever holds it can.",
		'editor.titleFieldLabel': 'Page title',
		'editor.titleFieldHint':
			'Useful to tell your pages apart — personal, work, an event. The payer sees it too.',
		'editor.hintToggle': 'Show the hint',
		'editor.titleFieldPlaceholder': 'Pay Bruno',
		'editor.methodsHeading': 'How you want to get paid',
		'editor.createButton': 'Create page',
		'editor.saveButton': 'Save changes',
		'editor.creating': 'Creating…',
		'editor.saving': 'Saving…',
		'editor.saved': 'Saved!',
		'editor.createError': 'Something went wrong creating the page. Please try again.',
		'editor.saveError': 'Something went wrong saving your changes. Please try again.',
		'editor.needOneMethod': 'Add at least one payment method first.',
		'editor.filledBadge': 'added',
		'editor.pasteConfirmPrefix': 'Ends with',
		'editor.addMethodLabel': 'Add',
		'editor.removeMethod': 'Remove this method',
		'editor.preferredLabel': 'Preferred method',
		'editor.preferredHint': 'Preferred method — shown first to whoever pays.',
		'editor.clearField': 'Clear field',

		'methods.satispay.label': 'Satispay',
		'methods.satispay.fieldLabel': 'Phone number',
		'methods.satispay.placeholder': '+39 340 118 4417',
		'methods.satispay.hint': "In your profile, under your name: it's the phone number you signed up with.",

		'methods.revolut.label': 'Revolut',
		'methods.revolut.fieldLabel': 'Your @tag',
		'methods.revolut.placeholder': '@mariorossi',
		'methods.revolut.hint': 'Open Revolut → tap your name at the top → your @tag is under your photo.',

		'methods.paypal.label': 'PayPal',
		'methods.paypal.fieldLabel': 'Your PayPal.Me link',
		'methods.paypal.placeholder': 'paypal.me/mariorossi',
		'methods.paypal.hint': 'PayPal.Me: from the menu, "Request money" → your link ends with /name.',

		'methods.iban.label': 'IBAN',
		'methods.iban.fieldLabel': 'IBAN',
		'methods.iban.placeholder': 'IT60 X054 2811 1010 0000 0123 456',
		'methods.iban.hint': '27 characters, starts with IT. Find it in your bank app under account details.',
		'methods.iban.holderLabel': 'Account holder, exactly as it appears at your bank',
		'methods.iban.holderHint': 'European banks check that the name matches the IBAN.',
		'methods.iban.holderPlaceholder': 'Mario Rossi',
		'methods.iban.holderTitle': 'Account holder',

		'methods.crypto.label': 'Other methods',
		'methods.crypto.hint':
			'Deliberately generic: crypto, another payment service, anything. Add a label and the value — up to 5.',
		'methods.crypto.labelFieldLabel': 'Label',
		'methods.crypto.labelFieldPlaceholder': 'E.g. Bitcoin, Wise, Klarna…',
		'methods.crypto.valueFieldLabel': 'Value',
		'methods.crypto.valuePlaceholder': 'Address, link, or anything else',

		'created.badge': 'ready',
		'created.fallbackTitle': 'Your page is ready',
		'created.copyLink': 'Copy link',
		'created.linkCopied': 'Link copied',
		'created.whatsapp': 'Send on WhatsApp',
		'created.whatsappText': "Here's my dammeli page to pay me: {{link}}",
		'created.qrHint': 'or have them scan it',
		'created.noticeTitle': 'Keep the link.',
		'created.noticeBody':
			"It's the only way back into this page to change it. We don't have it: if you lose it, you make another one.",
		'created.viewPublic': 'How they see it',
		'created.copyEditLink': 'Copy edit link',

		'myPages.title': 'Your pages',
		'myPages.emptyText': 'Pages you create from this phone end up here.',
		'myPages.emptyCta': 'Make one',
		'myPages.rowFallbackName': 'Page …{{id}}',
		'myPages.notice':
			'This list only lives on this phone. If you switch devices or clear browser data, only the links you saved elsewhere remain.',

		'viewer.loading': 'Loading…',
		'viewer.error':
			"This page doesn't exist, or the link is incomplete. If you just received it, ask whoever sent it to check they copied the whole thing.",
		'viewer.defaultTitle': 'Gimme the money',
		'viewer.kicker': 'Choose how to pay',
		'viewer.preferredBadge': 'Preferred',
		'viewer.footerPre': 'Page made with',
		'viewer.footerPost': '. No account, no email.',
		'viewer.footerCta': 'Make your own',
		'viewer.howItWorks': 'How it works',

		'howItWorks.title': 'How it works',
		'howItWorks.intro':
			"Short version: you create a page with your payment methods, get a link, share it. No account, no email, and we can't read what you write — not even if we wanted to. Here's how, without the jargon.",
		'howItWorks.step1Title': 'Add your payment methods',
		'howItWorks.step1Body':
			"Satispay, Revolut, PayPal, IBAN, or anything else — crypto, another service, whatever you need. It all stays on your phone until you press \"Create page\".",
		'howItWorks.step2Title': 'Everything is encrypted before it leaves',
		'howItWorks.step2Body':
			"The moment you create the page, what you wrote is turned into an unreadable block right inside your browser — before any of it leaves your phone. What reaches our servers is already meaningless.",
		'howItWorks.step3Title': 'The key lives only in the link',
		'howItWorks.step3Body':
			"The part of the link after the hash (#) is the key needed to read the page — and that part is never sent anywhere, it stays only in the browser of whoever opens the link. Without that link, what we've stored is just noise, even to us.",
		'howItWorks.step4Title': 'Keep the link — we don\'t',
		'howItWorks.step4Body':
			"It's the only way back to your page to edit it — we save it on this device for convenience, but if you switch phones or clear your browser data without a copy saved elsewhere, that page is gone for good. No recovery: that's the cost of not having an account.",
		'howItWorks.hostingTitle': 'Who hosts all this?',
		'howItWorks.hostingBody':
			'The site and database run on outside providers. They only ever see unreadable encrypted blocks, never your data in the clear — but it\'s worth knowing, so we say it here instead of hiding it.',
		'howItWorks.privacyLink': 'Read the full privacy page',
		'howItWorks.cta': 'Create your page',

		'privacy.title': 'Privacy',
		'privacy.intro':
			"In short: we can't read your pages, we never ask for an account or an email, and we don't track you. Here are the details, provider by provider.",
		'privacy.seeTitle': 'What we can see',
		'privacy.seeBody':
			'Nothing you write. Every page is encrypted inside your own browser before it even leaves it (see "How it works") — what reaches our servers is already an unreadable block, and stays that way until someone opens the link with the right key, a key our systems never see.',
		'privacy.dontTitle': "What we don't do",
		'privacy.dontBody':
			"No account, no email required, no tracking or analytics scripts, no cookies. We don't know who you are, and we don't try to find out.",
		'privacy.providersTitle': 'Who hosts the site',
		'privacy.providersBody':
			"The site and the functions that run it live on Netlify, the database on Supabase — both US providers, chosen for how fast they let us build, not out of principle. Like any web service they receive the requests you send them, so things like your IP address and the time — but the content of your pages always stays an encrypted block, unreadable to them too. The goal is to move everything to a European server as soon as it's practical.",
		'privacy.deviceTitle': 'What stays on your phone',
		'privacy.deviceBody':
			"The link to edit a page is saved only in your own browser, on this device — we never send it anywhere and never see it. If you switch phones or clear your browser data without saving that link elsewhere, that page is gone for good: no recovery, that's the cost of not having an account.",
		'privacy.betaTitle': 'A note on the private beta',
		'privacy.betaBody':
			"The project is young: we back up the database but haven't yet tested a full restore. Treat it as a beta — don't rely on it as the only copy of something you can't afford to lose.",
		'privacy.back': 'Back to home',
	},
};

/** The browser's own language list decides; English if none of it matches. */
export function detectLang(nav = globalThis.navigator) {
	const candidates = nav?.languages?.length ? nav.languages : [nav?.language].filter(Boolean);
	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.toLowerCase().startsWith('it')) return 'it';
		if (typeof candidate === 'string' && candidate.toLowerCase().startsWith('en')) return 'en';
	}
	return 'en';
}

/** Looks up `key` for `lang`, substituting `{{name}}`-style placeholders. */
export function t(lang, key, vars) {
	const template = dict[lang]?.[key] ?? dict.it[key] ?? key;
	if (!vars) return template;
	return template.replace(/\{\{(\w+)\}\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}
