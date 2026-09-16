// Bilingual (IT/EN) copy for the whole UI. A hand-written dictionary
// rather than a library: two languages, no plurals beyond simple counts,
// no runtime-loaded bundles — a library would add weight (PLAN.md
// constraint P1) for a problem this small.
//
// Detection: an explicit choice saved in localStorage wins; otherwise the
// browser's own language list decides. No account, so the choice is
// per-device, same as "your pages".

export const LANGS = ['it', 'en'];
const STORAGE_KEY = 'dammeli:lang';

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
		'nav.lang': 'English',

		'editor.kicker': 'senza account · senza email',
		'editor.h1': 'Dammi i soldi.',
		'editor.subtitle':
			"Metti i tuoi metodi di pagamento, ottieni un link. Chi te lo deve dare paga con l'app che ha già.",
		'editor.titleFieldLabel': 'Per cosa?',
		'editor.titleFieldHint': 'Lo vede chi paga. Facoltativo.',
		'editor.titleFieldPlaceholder': 'Cena da Nino',
		'editor.methodsHeading': 'Come vuoi essere pagato',
		'editor.filledCount': '{{count}} su {{total}}',
		'editor.footnote': 'Nessun account, nessuna email. Quello che scrivi resta nel link.',
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
		'methods.crypto.hint': "Indirizzi crypto o qualsiasi altra cosa: metti un'etichetta e il valore.",
		'methods.crypto.labelFieldLabel': 'Etichetta',
		'methods.crypto.labelFieldPlaceholder': 'Bitcoin',
		'methods.crypto.valueFieldLabel': 'Indirizzo',
		'methods.crypto.valuePlaceholder': 'bc1q…',

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
		'viewer.asks': '{{name}} chiede',
		'viewer.footerPre': 'Pagina fatta con',
		'viewer.footerPost': '. Niente account, niente email.',
		'viewer.footerCta': 'Fanne una tua',
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
		'nav.lang': 'Italiano',

		'editor.kicker': 'no account · no email',
		'editor.h1': 'Gimme the money.',
		'editor.subtitle':
			'Add your payment methods, get one link. Whoever owes you pays with the app they already have.',
		'editor.titleFieldLabel': 'What for?',
		'editor.titleFieldHint': 'The payer sees this. Optional.',
		'editor.titleFieldPlaceholder': "Dinner at Nino's",
		'editor.methodsHeading': 'How you want to get paid',
		'editor.filledCount': '{{count}} of {{total}}',
		'editor.footnote': 'No account, no email. What you write stays in the link.',
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
		'methods.crypto.hint': 'Crypto addresses or anything else: add a label and the value.',
		'methods.crypto.labelFieldLabel': 'Label',
		'methods.crypto.labelFieldPlaceholder': 'Bitcoin',
		'methods.crypto.valueFieldLabel': 'Address',
		'methods.crypto.valuePlaceholder': 'bc1q…',

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
		'viewer.asks': '{{name}} asks',
		'viewer.footerPre': 'Page made with',
		'viewer.footerPost': '. No account, no email.',
		'viewer.footerCta': 'Make your own',
	},
};

/** Reads the saved language override, if any. Never throws. */
export function getSavedLang(storage = globalThis.localStorage) {
	try {
		const value = storage.getItem(STORAGE_KEY);
		return LANGS.includes(value) ? value : null;
	} catch {
		return null;
	}
}

/** Persists an explicit language choice. Never throws. */
export function setSavedLang(lang, storage = globalThis.localStorage) {
	try {
		storage.setItem(STORAGE_KEY, lang);
	} catch {
		// Private browsing / quota: the toggle just won't stick, no crash.
	}
}

/** Saved override, else the browser's own language list, else Italian. */
export function detectLang(storage = globalThis.localStorage, nav = globalThis.navigator) {
	const saved = getSavedLang(storage);
	if (saved) return saved;
	const candidates = nav?.languages?.length ? nav.languages : [nav?.language].filter(Boolean);
	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.toLowerCase().startsWith('en')) return 'en';
		if (typeof candidate === 'string' && candidate.toLowerCase().startsWith('it')) return 'it';
	}
	return 'it';
}

/** Looks up `key` for `lang`, substituting `{{name}}`-style placeholders. */
export function t(lang, key, vars) {
	const template = dict[lang]?.[key] ?? dict.it[key] ?? key;
	if (!vars) return template;
	return template.replace(/\{\{(\w+)\}\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}
