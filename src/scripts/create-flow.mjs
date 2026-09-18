// Wires the "Create"/"Save changes" button: builds the payload from the
// editor's current state, encrypts it, posts or updates it, and (for a
// new page) shows the "Created" screen. Network and DOM live here on
// purpose — crypto.js stays a pure library (constraint C2 forbids fetch/
// location there), and the actual encrypt/derive calls stay isolated
// behind a dynamic import so this file never needs its own copy of the
// crypto logic.

import { assemblePayload } from '../lib/payload.mjs';
import * as api from '../lib/api.mjs';
import { createLocalPagesStore } from '../lib/local-pages.mjs';
import { renderQrCode } from '../lib/qr.mjs';
import { t } from '../lib/i18n.mjs';
import { showScreen, navigateHard } from './screens.mjs';
import * as ui from './ui.mjs';

function buildWhatsAppUrl(lang, link) {
	const text = t(lang, 'created.whatsappText', { link });
	return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function showError(root, lang, message) {
	const el = root.querySelector('[data-create-error]');
	if (!el) return;
	el.textContent = message;
	el.hidden = false;
	void lang;
}

/**
 * @param {{title: string, readUrl: string, editUrl: string}} page
 */
function renderCreatedScreen(createdRoot, lang, { title, readUrl, editUrl }, { onPages }) {
	const { header } = ui.topBar({
		title: t(lang, 'nav.done'),
		right: [ui.iconButton({ iconName: 'pencil', label: t(lang, 'nav.edit'), onClick: () => showScreen('editor') })],
	});
	createdRoot.querySelector('[data-topbar-created]').replaceChildren(header);

	createdRoot.querySelector('[data-created-badge]').replaceChildren(ui.badge(t(lang, 'created.badge'), { tone: 'accent', tilt: true }));
	createdRoot.querySelector('[data-created-title]').textContent = title || t(lang, 'created.fallbackTitle');
	// Stays hidden (see index.astro) — not shown to the visitor, just
	// readable by scripts/tests that need the actual URL.
	createdRoot.querySelector('[data-read-link]').textContent = readUrl;

	const copyLinkBtn = ui.copyFeedbackButton({
		variant: 'primary',
		size: 'lg',
		full: true,
		iconName: 'copy',
		text: t(lang, 'created.copyLink'),
		copiedText: t(lang, 'created.linkCopied'),
		getValue: () => readUrl,
	});
	createdRoot.querySelector('[data-copy-link-btn]').replaceChildren(copyLinkBtn);

	const whatsappBtn = ui.button({
		variant: 'secondary',
		size: 'lg',
		full: true,
		iconName: 'message-circle',
		text: t(lang, 'created.whatsapp'),
		onClick: () => window.open(buildWhatsAppUrl(lang, readUrl), '_blank', 'noopener,noreferrer'),
	});
	createdRoot.querySelector('[data-whatsapp-btn]').replaceChildren(whatsappBtn);

	createdRoot.querySelector('[data-qr]').replaceChildren(renderQrCode(readUrl));
	createdRoot.querySelector('[data-qr-hint]').replaceChildren(ui.microLabel(t(lang, 'created.qrHint')));

	const editPageBtn = ui.button({
		variant: 'ghost',
		size: 'sm',
		iconName: 'pencil',
		text: t(lang, 'nav.edit'),
		onClick: () => showScreen('editor'),
	});
	createdRoot.querySelector('[data-edit-page-btn]').replaceChildren(editPageBtn);

	const viewPublicBtn = ui.button({
		variant: 'ghost',
		size: 'sm',
		iconName: 'eye',
		text: t(lang, 'created.viewPublic'),
		// Not window.open(): same-path-different-hash new-tab opens are
		// unreliable on WebViews that silently fall back to navigating the
		// current tab, which — same as an in-tab link — wouldn't reload and
		// would leave the "Created" screen on top of a stale viewer. This
		// always works, at the cost of leaving the "Created" screen (the
		// browser's back button returns to it).
		onClick: () => navigateHard(readUrl),
	});
	createdRoot.querySelector('[data-view-public-btn]').replaceChildren(viewPublicBtn);

	const yourPagesBtn = ui.button({
		variant: 'ghost',
		size: 'sm',
		iconName: 'bookmark',
		text: t(lang, 'nav.yourPages'),
		onClick: onPages,
	});
	createdRoot.querySelector('[data-created-your-pages-btn]').replaceChildren(yourPagesBtn);

	// Same as data-read-link above: stays hidden, just readable by scripts/tests.
	createdRoot.querySelector('[data-edit-link]').textContent = editUrl;

	const copyEditBtn = ui.copyFeedbackButton({
		variant: 'ghost',
		size: 'sm',
		iconName: 'copy',
		text: t(lang, 'created.copyEditLink'),
		copiedText: t(lang, 'common.copied'),
		getValue: () => editUrl,
	});
	createdRoot.querySelector('[data-copy-edit-link-btn]').replaceChildren(copyEditBtn);
}

/**
 * `existingPage` (from `dammeli.loadFromFragment` on a write fragment —
 * `{ master, readKey, writeToken, id }`, all raw bytes) switches this
 * into edit mode: PUT instead of POST, no new links generated (they're
 * unchanged) — but the "Created" screen (here doubling as a "Saved"
 * screen) is shown again regardless, since that's the only place the
 * read link is easy to re-share from.
 */
export function initCreateFlow(
	editorRoot,
	editor,
	lang,
	{ localPages = createLocalPagesStore(), existingPage = null, onPages } = {},
) {
	const button = editorRoot.querySelector('[data-create]');
	if (!button) return;
	const idleLabel = existingPage ? t(lang, 'editor.saveButton') : t(lang, 'editor.createButton');
	button.textContent = idleLabel;

	button.addEventListener('click', async () => {
		const errorEl = editorRoot.querySelector('[data-create-error]');
		if (errorEl) errorEl.hidden = true;

		const payload = assemblePayload(editor.getCards(), { title: editor.getTitle() });
		if (payload.methods.length === 0) {
			showError(editorRoot, lang, t(lang, 'editor.needOneMethod'));
			return;
		}

		button.disabled = true;
		editor.setDisabled(true);
		button.textContent = existingPage ? t(lang, 'editor.saving') : t(lang, 'editor.creating');

		try {
			// @vite-ignore: /crypto.js is a runtime URL to the unbundled file in
			// public/ (PLAN.md section 9), not a module Vite should resolve or
			// bundle at build time.
			const dammeli = await import(/* @vite-ignore */ '/crypto.js');
			const plaintext = new TextEncoder().encode(JSON.stringify(payload));

			if (existingPage) {
				const { nonce, ciphertext } = await dammeli.encrypt(existingPage.readKey, dammeli.pad(plaintext));
				await api.updatePage(dammeli.toHex(existingPage.id), {
					nonce: dammeli.toHex(nonce),
					ct: dammeli.toHex(ciphertext),
					wt: dammeli.toHex(existingPage.writeToken),
				});

				const editUrl = location.href;
				const readUrl = `${location.origin}/#${dammeli.encodeFragment('r', existingPage.readKey)}`;
				// Re-save in case this device's localStorage lost track of it
				// (e.g. the edit link was opened from a bookmark saved
				// elsewhere): idempotent either way.
				localPages.save({
					id: dammeli.toHex(existingPage.id),
					editLink: editUrl,
					readLink: readUrl,
					title: payload.title ?? '',
				});

				const createdRoot = document.querySelector('[data-screen="created"]');
				renderCreatedScreen(createdRoot, lang, { title: payload.title ?? '', readUrl, editUrl }, { onPages });
				showScreen('created');
				button.disabled = false;
				editor.setDisabled(false);
				button.textContent = idleLabel;
				return;
			}

			const page = await dammeli.createPage();
			const { nonce, ciphertext } = await dammeli.encrypt(page.readKey, dammeli.pad(plaintext));
			const wth = await dammeli.deriveWriteTokenHash(page.writeToken);

			await api.createPage({
				id: dammeli.toHex(page.id),
				nonce: dammeli.toHex(nonce),
				ct: dammeli.toHex(ciphertext),
				wth: dammeli.toHex(wth),
			});

			const readUrl = `${location.origin}/${page.readFragment}`;
			const editUrl = `${location.origin}/${page.writeFragment}`;

			localPages.save({ id: dammeli.toHex(page.id), editLink: editUrl, readLink: readUrl, title: payload.title ?? '' });

			const createdRoot = document.querySelector('[data-screen="created"]');
			renderCreatedScreen(createdRoot, lang, { title: payload.title ?? '', readUrl, editUrl }, { onPages });
			showScreen('created');
			button.disabled = false;
			editor.setDisabled(false);
			button.textContent = idleLabel;
		} catch {
			showError(
				editorRoot,
				lang,
				existingPage ? t(lang, 'editor.saveError') : t(lang, 'editor.createError'),
			);
			button.disabled = false;
			editor.setDisabled(false);
			button.textContent = idleLabel;
		}
	});
}
