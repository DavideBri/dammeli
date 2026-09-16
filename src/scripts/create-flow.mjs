// Wires the "Create"/"Save changes" button: builds the payload from the
// current form state, encrypts it, posts or updates it, and shows the
// result. Network and DOM live here on purpose — crypto.js stays a pure
// library (constraint C2 forbids fetch/location there), and the actual
// encrypt/derive calls stay isolated behind a dynamic import so this
// file never needs its own copy of the crypto logic.

import { assemblePayload } from '../lib/payload.mjs';
import * as api from '../lib/api.mjs';
import { createLocalPagesStore } from '../lib/local-pages.mjs';
import { renderQrCode } from '../lib/qr.mjs';

function extractCards(form) {
	const cards = [];
	for (const el of form.querySelectorAll('#methods .method-card, #other-methods .method-card')) {
		cards.push({
			method: el.dataset.method,
			value: el.querySelector('[data-role="value"]')?.value ?? '',
			holder: el.querySelector('[data-role="holder"]')?.value,
			cryptoType: el.querySelector('[data-role="type"]')?.value,
		});
	}
	return cards;
}

function buildWhatsAppUrl(link) {
	const text = `Here's my dammeli payment page: ${link}`;
	return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function wireCopyButton(button, text) {
	if (!button) return;
	button.addEventListener('click', async () => {
		await navigator.clipboard.writeText(text);
		const original = button.textContent;
		button.textContent = 'Copied!';
		setTimeout(() => {
			button.textContent = original;
		}, 1500);
	});
}

function showError(form, message) {
	const el = form.querySelector('[data-create-error]');
	if (!el) return;
	el.textContent = message;
	el.hidden = false;
}

function showSuccess(form, { readUrl, editUrl }) {
	form.hidden = true;
	const success = document.querySelector('[data-success]');
	if (!success) return;
	success.hidden = false;
	success.querySelector('[data-read-link]').textContent = readUrl;
	success.querySelector('[data-edit-link]').textContent = editUrl;
	success.querySelector('[data-whatsapp-link]').href = buildWhatsAppUrl(readUrl);
	wireCopyButton(success.querySelector('[data-copy-link]'), readUrl);
	wireCopyButton(success.querySelector('[data-copy-edit-link]'), editUrl);

	const qrContainer = success.querySelector('[data-qr]');
	if (qrContainer) {
		qrContainer.replaceChildren(renderQrCode(readUrl));
	}
}

/**
 * `existingPage` (from `dammeli.loadFromFragment` on a write fragment —
 * `{ master, readKey, writeToken, id }`, all raw bytes) switches this
 * into edit mode: PUT instead of POST, no link generation (they're
 * unchanged), no share screen (the user already has the link they used
 * to get here) — just a brief "Saved!" on the button, same pattern as
 * the copy buttons.
 */
export function initCreateFlow(form, { localPages = createLocalPagesStore(), existingPage = null } = {}) {
	const button = form.querySelector('[data-create]');
	if (!button) return;
	const idleLabel = existingPage ? 'Save changes' : 'Create';
	button.textContent = idleLabel;

	button.addEventListener('click', async () => {
		const errorEl = form.querySelector('[data-create-error]');
		if (errorEl) errorEl.hidden = true;

		const payload = assemblePayload(extractCards(form));
		if (payload.methods.length === 0) {
			showError(form, 'Add at least one payment method first.');
			return;
		}

		button.disabled = true;
		button.textContent = existingPage ? 'Saving…' : 'Creating…';

		try {
			// @vite-ignore: /crypto.js is a runtime URL to the unbundled file in
			// public/ (PLAN.md section 9), not a module Vite should resolve or
			// bundle at build time.
			const dammeli = await import(/* @vite-ignore */ '/crypto.js');
			const plaintext = new TextEncoder().encode(JSON.stringify(payload));

			if (existingPage) {
				const { nonce, ciphertext } = await dammeli.encrypt(
					existingPage.readKey,
					dammeli.pad(plaintext),
				);
				await api.updatePage(dammeli.toHex(existingPage.id), {
					nonce: dammeli.toHex(nonce),
					ct: dammeli.toHex(ciphertext),
					wt: dammeli.toHex(existingPage.writeToken),
				});
				// Re-save in case this device's localStorage lost track of it
				// (e.g. the edit link was opened from a bookmark saved
				// elsewhere): idempotent either way.
				localPages.save({ id: dammeli.toHex(existingPage.id), editLink: location.href });

				button.disabled = false;
				button.textContent = 'Saved!';
				setTimeout(() => {
					button.textContent = idleLabel;
				}, 1500);
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

			localPages.save({ id: dammeli.toHex(page.id), editLink: editUrl });

			showSuccess(form, { readUrl, editUrl });
		} catch {
			showError(
				form,
				existingPage
					? 'Something went wrong saving your changes. Please try again.'
					: 'Something went wrong creating the page. Please try again.',
			);
			button.disabled = false;
			button.textContent = idleLabel;
		}
	});
}
