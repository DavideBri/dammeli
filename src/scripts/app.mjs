// Page bootstrap. This is the ONLY place in the whole app that reads
// `location.hash` (constraint C2, PLAN.md section 2): every other file
// that needs the fragment receives it as a plain argument from here.
//
// One static page serves three states, chosen entirely client-side since
// the id never appears in the URL (PLAN.md section 3):
//   - no fragment            -> the editor, for creating a new page
//   - a read fragment (#1r…) -> the public read-only viewer
//   - a write fragment (#1m…) -> the editor, prefilled, for editing an
//                                 existing page
//
// The editor form is hidden by default in the markup and only shown by
// this file, so a read/write link never flashes the wrong content first.

import { initEditor } from './editor.mjs';
import { initCreateFlow } from './create-flow.mjs';
import { initYourPages } from './your-pages.mjs';
import { prefillFromPayload } from './prefill.mjs';
import { renderMethods, showViewerState } from './viewer.mjs';
import * as api from '../lib/api.mjs';

/** Fetches and decrypts the page a `loadFromFragment` result points to. */
async function fetchPayload(dammeli, loaded) {
	const idHex = dammeli.toHex(loaded.id);
	const { nonce, ct } = await api.getPage(idHex);
	const plaintext = dammeli.unpad(
		await dammeli.decrypt(loaded.readKey, dammeli.fromHex(nonce), dammeli.fromHex(ct)),
	);
	return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function boot() {
	const editorForm = document.getElementById('editor');
	const viewerRoot = document.querySelector('[data-viewer]');

	const hash = location.hash;

	if (!hash) {
		editorForm.hidden = false;
		initEditor(editorForm);
		initCreateFlow(editorForm);
		const yourPagesRoot = document.querySelector('[data-your-pages]');
		if (yourPagesRoot) initYourPages(yourPagesRoot);
		return;
	}

	const dammeli = await import(/* @vite-ignore */ '/crypto.js');
	let loaded;
	try {
		loaded = await dammeli.loadFromFragment(hash);
	} catch {
		viewerRoot.hidden = false;
		showViewerState(viewerRoot, 'error');
		return;
	}

	if (loaded.type !== 'r') {
		// A write fragment: load the existing page into the editor instead
		// of starting blank, since the whole point of an edit link is
		// changing something that already exists.
		editorForm.hidden = false;
		initEditor(editorForm);
		for (const el of editorForm.querySelectorAll('input, select, button[data-create]')) {
			el.disabled = true;
		}

		try {
			const payload = await fetchPayload(dammeli, loaded);
			prefillFromPayload(editorForm, payload);
		} catch {
			// Can't load what's supposed to be edited (deleted, tampered,
			// truncated) — showing the empty form as if editing were working
			// would risk looking like the page's data got lost, so this
			// fails the same way the read-only viewer does instead.
			editorForm.hidden = true;
			viewerRoot.hidden = false;
			showViewerState(viewerRoot, 'error');
			return;
		}

		for (const el of editorForm.querySelectorAll('input, select, button[data-create]')) {
			el.disabled = false;
		}
		initCreateFlow(editorForm, { existingPage: loaded });
		return;
	}

	viewerRoot.hidden = false;
	showViewerState(viewerRoot, 'loading');
	try {
		const payload = await fetchPayload(dammeli, loaded);
		renderMethods(viewerRoot.querySelector('[data-methods]'), payload.methods);
		if (payload.title) {
			const titleEl = viewerRoot.querySelector('[data-page-title]');
			if (titleEl) titleEl.textContent = payload.title;
			document.title = `${payload.title} — dammeli`;
		}
		showViewerState(viewerRoot, 'loaded');
	} catch {
		// Covers a 404 from the API and a failed AES-GCM decrypt (tampered
		// or truncated data) alike — both show the same message, same spirit
		// as the server's own uniform 404 (PLAN.md section 6).
		showViewerState(viewerRoot, 'error');
	}
}
