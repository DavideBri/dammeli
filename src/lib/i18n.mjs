// Trilingual (IT/EN/ES) copy for the whole UI. A hand-written dictionary
// rather than a library: few languages, no plurals beyond simple counts,
// no runtime-loaded bundles — a library would add weight (PLAN.md
// constraint P1) for a problem this small.
//
// Detection only, no manual override: the browser's own language list
// decides, same as any other site. No account, so there'd be nowhere to
// sync a manual choice to anyway beyond this one device, and the
// device's own setting already does that job.

export const LANGS = ['it', 'en', 'es'];

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

		'editor.h1Prefix': 'I tuoi metodi di pagamento, sempre ',
		'editor.h1LinkWord': 'al sicuro',
		'editor.h1Suffix': '.',
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

		'contact.nameFieldLabel': 'Nome',
		'contact.nameFieldHint': "Il nome con cui ti troveranno in rubrica, per pagarti dall'app.",
		'contact.nameFieldPlaceholder': 'Mario Rossi',
		'contact.useSuggestion': 'Usa {{value}}',
		'contact.saveButton': 'Salva contatto',
		'contact.openAppLabel': 'Apri {{app}}',
		'contact.rowNote': 'Funziona tramite i contatti del telefono.',

		'created.badge': 'pronta',
		'created.fallbackTitle': 'La tua pagina',
		'created.copyLink': 'Copia link',
		'created.linkCopied': 'Link copiato',
		'created.whatsapp': 'Invia su WhatsApp',
		'created.whatsappText': 'Ecco la mia pagina dammeli per pagarmi: {{link}}',
		'created.qrHint': 'oppure fallo inquadrare',
		'created.viewPublic': 'Vedi la pagina pubblica',

		'myPages.title': 'Le tue pagine',
		'myPages.emptyText': 'Qui finiscono le pagine che crei da questo telefono.',
		'myPages.emptyCta': 'Fanne una',
		'myPages.untitledName': 'Pagina senza titolo',
		'myPages.notice':
			"L'elenco sta solo su questo telefono. Se cambi dispositivo o cancelli i dati del browser, restano solo i link che hai salvato.",

		'viewer.loading': 'Caricamento…',
		'viewer.error':
			"Questa pagina non esiste, o il link è incompleto. Se l'hai appena ricevuto, chiedi a chi te l'ha mandato di controllare di averlo copiato tutto.",
		'viewer.defaultTitle': 'Pagina di pagamento',
		'viewer.kicker': 'Scegli come pagare',
		'viewer.preferredBadge': 'Preferito',
		'viewer.footerPre': 'Pagina fatta con',
		'viewer.footerPost': '. Niente account, niente email.',
		'viewer.footerCta': 'Fanne una tua',
		'viewer.howItWorks': 'Come funziona',

		'howItWorks.title': 'Come funziona',
		'howItWorks.scene1Caption': 'Metti i metodi che usi già.',
		'howItWorks.scene2Caption': 'Li cifriamo sul tuo dispositivo prima di inviarli a noi — la chiave resta solo a te.',
		'howItWorks.scene3Caption': 'Condividi la chiave — il link — con chi vuoi farti pagare!',
		'howItWorks.scene3Tagline': 'No chiave, no party.',
		'howItWorks.privacyQuestion': 'Vuoi entrare più nel dettaglio?',
		'howItWorks.privacyLink': 'Leggi la nostra privacy',
		'howItWorks.cta': 'Crea la tua pagina',

		'privacy.title': 'Privacy',
		'privacy.intro':
			'In breve: non possiamo leggere le tue pagine, non ti chiediamo un account né un\'email, e non ti tracciamo. Qui sotto i dettagli, fornitore per fornitore.',
		'privacy.factNoAccount': 'Niente account',
		'privacy.factNoEmail': 'Niente email',
		'privacy.factEncrypted': 'Cifrato prima di partire',
		'privacy.factNoTracking': 'Niente tracciamento',
		'privacy.seeTitle': 'Cosa vediamo noi',
		'privacy.seeBody':
			'Niente di quello che scrivi. Cifriamo ogni pagina nel tuo browser prima ancora che parta (vedi "Come funziona"): quello che arriva ai nostri server è già un blocco illeggibile, e resta tale finché qualcuno non apre il link con la chiave giusta — chiave che non vediamo mai.',
		'privacy.dontTitle': 'Cosa non facciamo',
		'privacy.dontBody':
			'Nessun account, nessuna email richiesta, nessuno script di tracciamento o analytics, nessun cookie. Non sappiamo chi sei, e non proviamo a scoprirlo.',
		'privacy.providersTitle': 'Chi ospita il sito',
		'privacy.providersBody':
			'Il sito e le funzioni che lo fanno funzionare girano su Netlify, il database su Supabase — entrambi fornitori americani, scelti per velocità di sviluppo, non per principio. Come ogni servizio web ricevono le richieste che gli mandi, quindi cose come il tuo indirizzo IP e l\'orario — ma il contenuto delle tue pagine resta sempre un blocco cifrato, illeggibile anche per loro. L\'obiettivo è spostare tutto su un server europeo appena possibile.',
		'privacy.deviceTitle': 'Cosa resta sul tuo telefono',
		'privacy.deviceBody':
			'Il link per modificare una pagina viene salvato solo nel tuo browser, su questo dispositivo — non lo mandiamo da nessuna parte e non lo vediamo mai. Se cambi telefono o cancelli i dati del browser senza aver salvato il link altrove, quella pagina è persa per sempre: nessun recupero, è il prezzo di non avere un account.',
		'privacy.betaTitle': 'Una nota sulla beta privata',
		'privacy.betaBody':
			'Il progetto è giovane: facciamo backup del database ma non abbiamo ancora testato un ripristino completo. Trattala come una beta — non usarla per l\'unica copia di qualcosa che non puoi permetterti di perdere.',
		'privacy.sourceLine': 'Non devi crederci sulla parola: ',
		'privacy.sourceLink': 'il codice è pubblico su GitHub',
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

		'editor.h1Prefix': 'Share your payment methods, ',
		'editor.h1LinkWord': 'securely',
		'editor.h1Suffix': '.',
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

		'contact.nameFieldLabel': 'Name',
		'contact.nameFieldHint': "The name they'll find you under in their contacts, to pay you from the app.",
		'contact.nameFieldPlaceholder': 'Mario Rossi',
		'contact.useSuggestion': 'Use {{value}}',
		'contact.saveButton': 'Save contact',
		'contact.openAppLabel': 'Open {{app}}',
		'contact.rowNote': 'Works through your phone contacts.',

		'created.badge': 'ready',
		'created.fallbackTitle': 'Your page',
		'created.copyLink': 'Copy link',
		'created.linkCopied': 'Link copied',
		'created.whatsapp': 'Send on WhatsApp',
		'created.whatsappText': "Here's my dammeli page to pay me: {{link}}",
		'created.qrHint': 'or have them scan it',
		'created.viewPublic': 'View the public page',

		'myPages.title': 'Your pages',
		'myPages.emptyText': 'Pages you create from this phone end up here.',
		'myPages.emptyCta': 'Make one',
		'myPages.untitledName': 'Untitled page',
		'myPages.notice':
			'This list only lives on this phone. If you switch devices or clear browser data, only the links you saved elsewhere remain.',

		'viewer.loading': 'Loading…',
		'viewer.error':
			"This page doesn't exist, or the link is incomplete. If you just received it, ask whoever sent it to check they copied the whole thing.",
		'viewer.defaultTitle': 'Payment page',
		'viewer.kicker': 'Choose how to pay',
		'viewer.preferredBadge': 'Preferred',
		'viewer.footerPre': 'Page made with',
		'viewer.footerPost': '. No account, no email.',
		'viewer.footerCta': 'Make your own',
		'viewer.howItWorks': 'How it works',

		'howItWorks.title': 'How it works',
		'howItWorks.scene1Caption': 'Add the ones you already use.',
		'howItWorks.scene2Caption': 'We encrypt them on your device before they reach us — the key stays only with you.',
		'howItWorks.scene3Caption': 'Share the key — the link — with whoever you want to pay you!',
		'howItWorks.scene3Tagline': 'No key, no party.',
		'howItWorks.privacyQuestion': 'Want the details?',
		'howItWorks.privacyLink': 'Read our privacy page',
		'howItWorks.cta': 'Create your page',

		'privacy.title': 'Privacy',
		'privacy.intro':
			"In short: we can't read your pages, we never ask for an account or an email, and we don't track you. Here are the details, provider by provider.",
		'privacy.factNoAccount': 'No account',
		'privacy.factNoEmail': 'No email',
		'privacy.factEncrypted': 'Encrypted before it leaves',
		'privacy.factNoTracking': 'No tracking',
		'privacy.seeTitle': 'What we can see',
		'privacy.seeBody':
			'Nothing you write. We encrypt every page in your own browser before it even leaves it (see "How it works") — what reaches our servers is already an unreadable block, and stays that way until someone opens the link with the right key, a key we never see.',
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
		'privacy.sourceLine': "Don't take our word for it: ",
		'privacy.sourceLink': 'the code is public on GitHub',
		'privacy.back': 'Back to home',
	},
	es: {
		'common.copy': 'Copiar',
		'common.copied': '¡Copiado!',
		'common.open': 'Abrir',
		'common.delete': 'Eliminar',
		'common.deleting': 'Eliminando…',
		'common.deleteConfirm': '¿Eliminar esta página? No se puede deshacer.',
		'common.deleteError': 'No se pudo eliminar la página. Inténtalo de nuevo.',

		'nav.yourPages': 'Tus páginas',
		'nav.newPage': 'Nueva página',
		'nav.back': 'Atrás',
		'nav.themeLight': 'Tema claro',
		'nav.themeDark': 'Tema oscuro',
		'nav.edit': 'Editar',

		'editor.h1Prefix': 'Tus métodos de pago, siempre ',
		'editor.h1LinkWord': 'seguros',
		'editor.h1Suffix': '.',
		'editor.titleFieldLabel': 'Título de la página',
		'editor.titleFieldHint':
			'Útil para diferenciar tus páginas: personal, trabajo, un evento. También lo ve quien paga.',
		'editor.hintToggle': 'Mostrar la sugerencia',
		'editor.titleFieldPlaceholder': 'Paga a Bruno',
		'editor.methodsHeading': 'Cómo quieres que te paguen',
		'editor.createButton': 'Crear página',
		'editor.saveButton': 'Guardar cambios',
		'editor.creating': 'Creando…',
		'editor.saving': 'Guardando…',
		'editor.saved': '¡Guardado!',
		'editor.createError': 'Algo salió mal al crear la página. Inténtalo de nuevo.',
		'editor.saveError': 'Algo salió mal al guardar los cambios. Inténtalo de nuevo.',
		'editor.needOneMethod': 'Añade al menos un método de pago.',
		'editor.pasteConfirmPrefix': 'Termina en',
		'editor.addMethodLabel': 'Añadir',
		'editor.removeMethod': 'Quitar este método',
		'editor.preferredLabel': 'Método preferido',
		'editor.preferredHint': 'Método preferido — se mostrará primero a quien paga.',
		'editor.clearField': 'Vaciar el campo',

		'methods.satispay.label': 'Satispay',
		'methods.satispay.fieldLabel': 'Número de teléfono',
		'methods.satispay.placeholder': '+39 340 118 4417',
		'methods.satispay.hint':
			'En tu perfil, debajo de tu nombre: es el número de teléfono con el que te registraste.',

		'methods.revolut.label': 'Revolut',
		'methods.revolut.fieldLabel': 'Tu @tag',
		'methods.revolut.placeholder': '@mariorossi',
		'methods.revolut.hint': 'Abre Revolut → toca tu nombre arriba → tu @tag está debajo de tu foto.',

		'methods.paypal.label': 'PayPal',
		'methods.paypal.fieldLabel': 'Tu enlace de PayPal.Me',
		'methods.paypal.placeholder': 'paypal.me/mariorossi',
		'methods.paypal.hint':
			'PayPal.Me: en el menú, "Solicitar dinero" → tu enlace termina en /nombre.',

		'methods.iban.label': 'IBAN',
		'methods.iban.fieldLabel': 'IBAN',
		'methods.iban.placeholder': 'IT60 X054 2811 1010 0000 0123 456',
		'methods.iban.hint':
			'27 caracteres, empieza con IT. Lo encuentras en la app de tu banco, en datos de la cuenta.',
		'methods.iban.holderLabel': 'Titular de la cuenta, exactamente como figura en el banco',
		'methods.iban.holderHint': 'Los bancos europeos comprueban que el nombre coincida con el IBAN.',
		'methods.iban.holderPlaceholder': 'Mario Rossi',
		'methods.iban.holderTitle': 'Titular de la cuenta',

		'methods.crypto.label': 'Otros métodos',
		'methods.crypto.hint':
			'Genérico a propósito: cripto, otro servicio de pago, lo que sea. Añade una etiqueta y el valor — hasta 5.',
		'methods.crypto.labelFieldLabel': 'Etiqueta',
		'methods.crypto.labelFieldPlaceholder': 'Ej. Bitcoin, Wise, Klarna…',
		'methods.crypto.valueFieldLabel': 'Valor',
		'methods.crypto.valuePlaceholder': 'Dirección, enlace u otro',

		'contact.nameFieldLabel': 'Nombre',
		'contact.nameFieldHint': 'El nombre con el que te encontrarán en su agenda, para pagarte desde la app.',
		'contact.nameFieldPlaceholder': 'Mario Rossi',
		'contact.useSuggestion': 'Usar {{value}}',
		'contact.saveButton': 'Guardar contacto',
		'contact.openAppLabel': 'Abrir {{app}}',
		'contact.rowNote': 'Funciona a través de tus contactos.',

		'created.badge': 'lista',
		'created.fallbackTitle': 'Tu página',
		'created.copyLink': 'Copiar enlace',
		'created.linkCopied': 'Enlace copiado',
		'created.whatsapp': 'Enviar por WhatsApp',
		'created.whatsappText': 'Aquí tienes mi página de dammeli para pagarme: {{link}}',
		'created.qrHint': 'o haz que lo escaneen',
		'created.viewPublic': 'Ver la página pública',

		'myPages.title': 'Tus páginas',
		'myPages.emptyText': 'Aquí aparecen las páginas que crees desde este teléfono.',
		'myPages.emptyCta': 'Crea una',
		'myPages.untitledName': 'Página sin título',
		'myPages.notice':
			'Esta lista solo está en este teléfono. Si cambias de dispositivo o borras los datos del navegador, solo quedan los enlaces que hayas guardado.',

		'viewer.loading': 'Cargando…',
		'viewer.error':
			'Esta página no existe, o el enlace está incompleto. Si acabas de recibirlo, pídele a quien te lo envió que compruebe haberlo copiado entero.',
		'viewer.defaultTitle': 'Página de pago',
		'viewer.kicker': 'Elige cómo pagar',
		'viewer.preferredBadge': 'Preferido',
		'viewer.footerPre': 'Página hecha con',
		'viewer.footerPost': '. Sin cuenta, sin email.',
		'viewer.footerCta': 'Crea la tuya',
		'viewer.howItWorks': 'Cómo funciona',

		'howItWorks.title': 'Cómo funciona',
		'howItWorks.scene1Caption': 'Añade los métodos que ya usas.',
		'howItWorks.scene2Caption':
			'Los ciframos en tu dispositivo antes de enviárnoslos — la clave se queda solo contigo.',
		'howItWorks.scene3Caption': '¡Comparte la clave — el enlace — con quien quieras que te pague!',
		'howItWorks.scene3Tagline': 'Sin clave, no hay fiesta.',
		'howItWorks.privacyQuestion': '¿Quieres más detalles?',
		'howItWorks.privacyLink': 'Lee nuestra privacidad',
		'howItWorks.cta': 'Crea tu página',

		'privacy.title': 'Privacidad',
		'privacy.intro':
			'En resumen: no podemos leer tus páginas, no te pedimos cuenta ni email, y no te rastreamos. Aquí abajo los detalles, proveedor por proveedor.',
		'privacy.factNoAccount': 'Sin cuenta',
		'privacy.factNoEmail': 'Sin email',
		'privacy.factEncrypted': 'Cifrado antes de salir',
		'privacy.factNoTracking': 'Sin rastreo',
		'privacy.seeTitle': 'Qué vemos nosotros',
		'privacy.seeBody':
			'Nada de lo que escribes. Ciframos cada página en tu navegador antes de que salga de él (mira "Cómo funciona"): lo que llega a nuestros servidores ya es un bloque ilegible, y sigue así hasta que alguien abre el enlace con la clave correcta — una clave que nunca vemos.',
		'privacy.dontTitle': 'Qué no hacemos',
		'privacy.dontBody':
			'Ninguna cuenta, ningún email requerido, ningún script de rastreo o analítica, ninguna cookie. No sabemos quién eres, y no intentamos averiguarlo.',
		'privacy.providersTitle': 'Quién aloja el sitio',
		'privacy.providersBody':
			'El sitio y las funciones que lo hacen funcionar corren en Netlify, la base de datos en Supabase — ambos proveedores estadounidenses, elegidos por rapidez de desarrollo, no por principio. Como cualquier servicio web, reciben las solicitudes que les envías, así que cosas como tu dirección IP y la hora — pero el contenido de tus páginas siempre queda como un bloque cifrado, ilegible también para ellos. El objetivo es mover todo a un servidor europeo en cuanto sea posible.',
		'privacy.deviceTitle': 'Qué queda en tu teléfono',
		'privacy.deviceBody':
			'El enlace para editar una página se guarda solo en tu navegador, en este dispositivo — no lo enviamos a ningún sitio y nunca lo vemos. Si cambias de teléfono o borras los datos del navegador sin haber guardado el enlace en otro sitio, esa página se pierde para siempre: sin recuperación posible, es el precio de no tener cuenta.',
		'privacy.betaTitle': 'Una nota sobre la beta privada',
		'privacy.betaBody':
			'El proyecto es joven: hacemos copias de seguridad de la base de datos, pero todavía no hemos probado una restauración completa. Trátala como una beta — no la uses para la única copia de algo que no puedas permitirte perder.',
		'privacy.sourceLine': 'No tienes que creer en nuestra palabra: ',
		'privacy.sourceLink': 'el código es público en GitHub',
		'privacy.back': 'Volver al inicio',
	},
};

/** The browser's own language list decides; English if none of it matches. */
export function detectLang(nav = globalThis.navigator) {
	const candidates = nav?.languages?.length ? nav.languages : [nav?.language].filter(Boolean);
	for (const candidate of candidates) {
		if (typeof candidate !== 'string') continue;
		const lower = candidate.toLowerCase();
		if (lower.startsWith('it')) return 'it';
		if (lower.startsWith('en')) return 'en';
		if (lower.startsWith('es')) return 'es';
	}
	return 'en';
}

/** Looks up `key` for `lang`, substituting `{{name}}`-style placeholders. */
export function t(lang, key, vars) {
	const template = dict[lang]?.[key] ?? dict.it[key] ?? key;
	if (!vars) return template;
	return template.replace(/\{\{(\w+)\}\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}
