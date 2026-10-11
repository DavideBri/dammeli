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
import { detectLang, t } from '../lib/i18n.mjs';
import { getSavedTheme, setSavedTheme, applyTheme, effectiveTheme } from '../lib/theme.mjs';
import { showScreen, navigateHard } from './screens.mjs';
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

function buildEditorTopBar(editorRoot, lang, { onPages }) {
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
		const { header } = ui.topBar({ right: [pagesBtn, themeBtn] });
		editorRoot.querySelector('[data-topbar-editor]').replaceChildren(header);
	}
	render();
}

function buildViewerTopBar(viewerRoot, lang) {
	// The wordmark sits in its usual title slot (left) and doubles as a home
	// link, same as everywhere else it appears with no page title of its
	// own — see ui.mjs's topBar(). The "make your own" CTA moves here from
	// the footer, on the right, where it's seen without scrolling.
	const createCta = ui.button({
		variant: 'primary',
		size: 'sm',
		text: t(lang, 'viewer.footerCta'),
		onClick: () => navigateHard('/'),
	});
	const { header, titleWrap } = ui.topBar({ right: [createCta] });
	titleWrap.querySelector('.ds-wordmark-link')?.addEventListener('click', (event) => {
		// Same reasoning as the "how it works"/"privacy" footer links: this
		// page and "/" share a path, only the fragment differs, so a plain
		// click would never reload and boot() would never switch back to
		// the editor.
		if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		navigateHard('/');
	});
	viewerRoot.querySelector('[data-topbar-viewer]').replaceChildren(header);
}

export async function boot() {
	const lang = detectLang();
	document.documentElement.lang = lang;
	// Once, here, regardless of which screen boot() ends up showing — not
	// just inside buildEditorTopBar(), which left the read-only viewer
	// never applying a saved dark-mode override and silently falling back
	// to the OS preference instead.
	applyTheme(getSavedTheme());

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

		// The form itself (initEditor()'s DOM) doesn't exist yet — only the
		// fetch/decrypt below builds it — so a loader stands in instead of
		// a blank screen for that moment, same as the read-only viewer's own
		// loading state.
		const formEl = editorRoot.querySelector('[data-editor-form]');
		const loadingEl = editorRoot.querySelector('[data-editor-loading]');
		formEl.hidden = true;
		loadingEl.hidden = false;
		loadingEl.replaceChildren(ui.loader(t(lang, 'viewer.loading')));

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

		loadingEl.hidden = true;
		formEl.hidden = false;
		const editor = initEditor(editorRoot, lang, { prefill: payload });
		initCreateFlow(editorRoot, editor, lang, { existingPage: loaded, onPages: goToYourPages });
		showScreen('editor');
		return;
	}

	buildViewerTopBar(viewerRoot, lang);
	showScreen('viewer');
	showViewerState(viewerRoot, 'loading');
	viewerRoot.querySelector('[data-viewer-state="loading"]').replaceChildren(ui.loader(t(lang, 'viewer.loading')));
	try {
		const payload = await fetchPayload(dammeli, loaded);

		viewerRoot.querySelector('[data-page-kicker]').replaceChildren(ui.microLabel(t(lang, 'viewer.kicker'), { tone: 'strong' }));

		const titleEl = viewerRoot.querySelector('[data-page-title]');
		titleEl.textContent = payload.title || t(lang, 'viewer.defaultTitle');
		document.title = `${payload.title || t(lang, 'viewer.defaultTitle')} — dammeli`;

		renderMethods(viewerRoot.querySelector('[data-methods]'), payload.methods, lang);

		const footerEl = viewerRoot.querySelector('[data-viewer-footer]');
		footerEl.replaceChildren();
		const brand = document.createElement('b');
		brand.className = 'ds-text-muted';
		brand.textContent = 'dammeli';
		footerEl.append(`${t(lang, 'viewer.footerPre')} `, brand, t(lang, 'viewer.footerPost'), document.createElement('br'));
		// The "make your own" CTA lives in the topbar now (buildViewerTopBar),
		// not here — seen without scrolling, instead of buried at the bottom.
		const howItWorksLink = document.createElement('a');
		howItWorksLink.href = '/how-it-works';
		howItWorksLink.className = 'ds-text-accent';
		howItWorksLink.textContent = t(lang, 'viewer.howItWorks');
		footerEl.appendChild(howItWorksLink);
		footerEl.append(' · ');
		const privacyLink = document.createElement('a');
		privacyLink.href = '/privacy';
		privacyLink.className = 'ds-text-accent';
		privacyLink.textContent = t(lang, 'privacy.title');
		footerEl.appendChild(privacyLink);

		showViewerState(viewerRoot, 'loaded');
	} catch {
		// Covers a 404 from the API and a failed AES-GCM decrypt (tampered
		// or truncated data) alike — both show the same message, same spirit
		// as the server's own uniform 404 (PLAN.md section 6).
		showViewerState(viewerRoot, 'error');
		viewerRoot.querySelector('[data-viewer-state="error"]').textContent = t(lang, 'viewer.error');
	}
}
