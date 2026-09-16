// Page bootstrap. This is the ONLY place in the whole app that reads
// `location.hash` (constraint C2, PLAN.md section 2): every other file
// that needs the fragment receives it as a plain argument from here.
//
// One static page serves three URL-driven states, chosen entirely
// client-side since the id never appears in the URL (PLAN.md section 3):
//   - no fragment            -> the editor, for creating a new page
//   - a read fragment (#1r…) -> the public read-only viewer
//   - a write fragment (#1m…) -> the editor, prefilled, for editing an
//                                 existing page
// "Created" and "Your pages" are reached from inside the app (buttons),
// never from the URL — src/scripts/screens.mjs just toggles visibility.
//
// The editor form is hidden by default in the markup and only shown by
// this file, so a read/write link never flashes the wrong content first.

import { initEditor } from './editor.mjs';
import { initCreateFlow } from './create-flow.mjs';
import { initYourPages } from './your-pages.mjs';
import { renderMethods, showViewerState } from './viewer.mjs';
import * as api from '../lib/api.mjs';
import { detectLang, setSavedLang, t } from '../lib/i18n.mjs';
import { getSavedTheme, setSavedTheme, applyTheme, effectiveTheme } from '../lib/theme.mjs';
import { showScreen } from './screens.mjs';
import * as ui from './ui.mjs';

/** Fetches and decrypts the page a `loadFromFragment` result points to. */
async function fetchPayload(dammeli, loaded) {
	const idHex = dammeli.toHex(loaded.id);
	const { nonce, ct } = await api.getPage(idHex);
	const plaintext = dammeli.unpad(
		await dammeli.decrypt(loaded.readKey, dammeli.fromHex(nonce), dammeli.fromHex(ct)),
	);
	return JSON.parse(new TextDecoder().decode(plaintext));
}

function otherLang(lang) {
	return lang === 'it' ? 'en' : 'it';
}

function switchLang(lang) {
	setSavedLang(otherLang(lang));
	location.reload();
}

function buildEditorTopBar(editorRoot, lang, { onPages }) {
	applyTheme(getSavedTheme());
	const themeIcon = () => (effectiveTheme() === 'dark' ? 'sun' : 'moon');
	const themeLabel = () => (effectiveTheme() === 'dark' ? t(lang, 'nav.themeLight') : t(lang, 'nav.themeDark'));

	function render() {
		const themeBtn = ui.iconButton({
			iconName: themeIcon(),
			label: themeLabel(),
			onClick: () => {
				setSavedTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
				applyTheme(getSavedTheme());
				render();
			},
		});
		const pagesBtn = ui.iconButton({ iconName: 'bookmark', label: t(lang, 'nav.yourPages'), onClick: onPages });
		const langBtn = ui.langButton(t(lang, 'nav.lang'), () => switchLang(lang));
		const { header } = ui.topBar({ right: [langBtn, pagesBtn, themeBtn] });
		editorRoot.querySelector('[data-topbar-editor]').replaceChildren(header);
	}
	render();
}

function buildViewerTopBar(viewerRoot, lang) {
	const langBtn = ui.langButton(t(lang, 'nav.lang'), () => switchLang(lang));
	const { header } = ui.topBar({ wordmarkFallback: false, right: [langBtn, ui.wordmark(17)] });
	viewerRoot.querySelector('[data-topbar-viewer]').replaceChildren(header);
}

export async function boot() {
	const lang = detectLang();
	document.documentElement.lang = lang;

	const editorRoot = document.querySelector('[data-screen="editor"]');
	const yourPagesRoot = document.querySelector('[data-screen="your-pages"]');
	const viewerRoot = document.querySelector('[data-screen="viewer"]');

	const yourPages = initYourPages(yourPagesRoot, lang, {
		onBack: () => showScreen('editor'),
		onNew: () => showScreen('editor'),
	});
	const goToYourPages = () => yourPages.showAndRefresh();

	const hash = location.hash;

	if (!hash) {
		editorRoot.hidden = false;
		buildEditorTopBar(editorRoot, lang, { onPages: goToYourPages });
		const editor = initEditor(editorRoot, lang);
		initCreateFlow(editorRoot, editor, lang, { onPages: goToYourPages });
		showScreen('editor');
		return;
	}

	const dammeli = await import(/* @vite-ignore */ '/crypto.js');
	let loaded;
	try {
		loaded = await dammeli.loadFromFragment(hash);
	} catch {
		buildViewerTopBar(viewerRoot, lang);
		showScreen('viewer');
		showViewerState(viewerRoot, 'error');
		viewerRoot.querySelector('[data-viewer-state="error"]').textContent = t(lang, 'viewer.error');
		return;
	}

	if (loaded.type !== 'r') {
		// A write fragment: load the existing page into the editor instead
		// of starting blank, since the whole point of an edit link is
		// changing something that already exists.
		editorRoot.hidden = false;
		buildEditorTopBar(editorRoot, lang, { onPages: goToYourPages });

		let payload;
		try {
			payload = await fetchPayload(dammeli, loaded);
		} catch {
			// Can't load what's supposed to be edited (deleted, tampered,
			// truncated) — showing the empty form as if editing were working
			// would risk looking like the page's data got lost, so this
			// fails the same way the read-only viewer does instead.
			buildViewerTopBar(viewerRoot, lang);
			showScreen('viewer');
			showViewerState(viewerRoot, 'error');
			viewerRoot.querySelector('[data-viewer-state="error"]').textContent = t(lang, 'viewer.error');
			return;
		}

		const editor = initEditor(editorRoot, lang, { prefill: payload });
		initCreateFlow(editorRoot, editor, lang, { existingPage: loaded, onPages: goToYourPages });
		showScreen('editor');
		return;
	}

	buildViewerTopBar(viewerRoot, lang);
	showScreen('viewer');
	showViewerState(viewerRoot, 'loading');
	viewerRoot.querySelector('[data-viewer-state="loading"]').textContent = t(lang, 'viewer.loading');
	try {
		const payload = await fetchPayload(dammeli, loaded);

		const holder = payload.methods.find((m) => m.type === 'iban' && m.holder)?.holder;
		const asksEl = viewerRoot.querySelector('[data-page-asks]');
		if (holder) {
			asksEl.hidden = false;
			asksEl.replaceChildren(ui.microLabel(t(lang, 'viewer.asks', { name: holder.split(' ')[0] }), { tone: 'strong' }));
		}

		const titleEl = viewerRoot.querySelector('[data-page-title]');
		titleEl.textContent = payload.title || t(lang, 'viewer.defaultTitle');
		document.title = `${payload.title || t(lang, 'viewer.defaultTitle')} — dammeli`;

		renderMethods(viewerRoot.querySelector('[data-methods]'), payload.methods, lang);

		const holderCard = viewerRoot.querySelector('[data-iban-holder-card]');
		if (holder) {
			holderCard.hidden = false;
			holderCard.className = 'ds-card ds-card--sunken ds-iban-holder-card';
			const label = document.createElement('span');
			label.appendChild(ui.microLabel(t(lang, 'methods.iban.holderTitle')));
			const name = document.createElement('span');
			name.className = 'ds-iban-holder-name';
			name.textContent = holder;
			holderCard.replaceChildren(label, name);
		}

		const footerEl = viewerRoot.querySelector('[data-viewer-footer]');
		footerEl.replaceChildren();
		const brand = document.createElement('b');
		brand.className = 'ds-text-muted';
		brand.textContent = 'dammeli';
		footerEl.append(`${t(lang, 'viewer.footerPre')} `, brand, t(lang, 'viewer.footerPost'), document.createElement('br'));
		const cta = document.createElement('a');
		cta.href = '/';
		cta.className = 'ds-text-accent';
		cta.textContent = t(lang, 'viewer.footerCta');
		footerEl.appendChild(cta);

		showViewerState(viewerRoot, 'loaded');
	} catch {
		// Covers a 404 from the API and a failed AES-GCM decrypt (tampered
		// or truncated data) alike — both show the same message, same spirit
		// as the server's own uniform 404 (PLAN.md section 6).
		showViewerState(viewerRoot, 'error');
		viewerRoot.querySelector('[data-viewer-state="error"]').textContent = t(lang, 'viewer.error');
	}
}
