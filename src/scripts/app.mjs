// Page bootstrap. This is the ONLY place in the whole app that reads
// `location.hash` (constraint C2, PLAN.md section 2): every other file
// that needs the fragment receives it as a plain argument from here.
//
// One static page serves three states, chosen entirely client-side since
// the id never appears in the URL (PLAN.md section 3):
//   - no fragment            -> the editor (default)
//   - a read fragment (#1r…) -> the public read-only viewer
//   - a write fragment (#1m…) -> not handled yet, see below
//
// The editor form is hidden by default in the markup and only shown by
// this file, so a read/write link never flashes the editor first.

import { initEditor } from './editor.mjs';
import { initCreateFlow } from './create-flow.mjs';
import { renderMethods, showViewerState } from './viewer.mjs';
import * as api from '../lib/api.mjs';

export async function boot() {
	const editorForm = document.getElementById('editor');
	const viewerRoot = document.querySelector('[data-viewer]');

	const hash = location.hash;

	if (!hash) {
		editorForm.hidden = false;
		initEditor(editorForm);
		initCreateFlow(editorForm);
		return;
	}

	viewerRoot.hidden = false;

	const dammeli = await import(/* @vite-ignore */ '/crypto.js');
	let loaded;
	try {
		loaded = await dammeli.loadFromFragment(hash);
	} catch {
		showViewerState(viewerRoot, 'error');
		return;
	}

	if (loaded.type !== 'r') {
		// Opening your own edit link lands here. Editing an existing page
		// isn't built yet (separate work from the read-only viewer) — showing
		// a blank editor instead would look like the page's data got lost,
		// so this says plainly that it isn't supported rather than lying by
		// omission.
		showViewerState(viewerRoot, 'edit-unsupported');
		return;
	}

	showViewerState(viewerRoot, 'loading');
	try {
		const idHex = dammeli.toHex(loaded.id);
		const { nonce, ct } = await api.getPage(idHex);
		const plaintext = dammeli.unpad(
			await dammeli.decrypt(loaded.readKey, dammeli.fromHex(nonce), dammeli.fromHex(ct)),
		);
		const payload = JSON.parse(new TextDecoder().decode(plaintext));
		renderMethods(viewerRoot.querySelector('[data-methods]'), payload.methods);
		showViewerState(viewerRoot, 'loaded');
	} catch {
		// Covers a 404 from the API and a failed AES-GCM decrypt (tampered
		// or truncated data) alike — both show the same message, same spirit
		// as the server's own uniform 404 (PLAN.md section 6).
		showViewerState(viewerRoot, 'error');
	}
}
