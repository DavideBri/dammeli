// Wires the editor form's structural behavior: paste normalization,
// visual confirmation, and reordering. No styling here — that comes
// later. No network calls, no persistence: this file only prepares the
// method cards; assembling and submitting the payload is 0.5's job.

import { normalizeHandleFromUrl, normalizeIban, confirmationSuffix } from '../lib/normalize.mjs';

const HANDLE_DOMAINS = {
	satispay: ['satispay.com'],
	revolut: ['revolut.me'],
	paypal: ['paypal.me', 'paypal.com'],
};

function normalizeValue(method, rawValue) {
	if (method === 'iban') return normalizeIban(rawValue);
	const domains = HANDLE_DOMAINS[method];
	if (domains) return normalizeHandleFromUrl(rawValue, domains);
	return (rawValue ?? '').trim();
}

function updateConfirmation(card, method) {
	const valueInput = card.querySelector('[data-role="value"]');
	const confirmEl = card.querySelector('[data-confirm]');
	if (!valueInput || !confirmEl) return;

	const value = valueInput.value.trim();
	if (!value) {
		confirmEl.hidden = true;
		confirmEl.textContent = '';
		return;
	}

	const holderInput = card.querySelector('[data-role="holder"]');
	const holderSuffix = holderInput?.value.trim() ? ` — ${holderInput.value.trim()}` : '';
	confirmEl.hidden = false;
	confirmEl.textContent = `✓ saved — …${confirmationSuffix(value)}${holderSuffix}`;
}

function wireCard(card) {
	const method = card.dataset.method;
	const valueInput = card.querySelector('[data-role="value"]');
	if (!valueInput) return;

	valueInput.addEventListener('blur', () => {
		valueInput.value = normalizeValue(method, valueInput.value);
		updateConfirmation(card, method);
	});
	valueInput.addEventListener('input', () => updateConfirmation(card, method));

	const holderInput = card.querySelector('[data-role="holder"]');
	holderInput?.addEventListener('input', () => updateConfirmation(card, method));
}

function wireReordering(container) {
	container.addEventListener('click', (event) => {
		const button = event.target.closest('[data-move]');
		if (!button) return;
		const card = button.closest('.method-card');
		if (!card) return;

		if (button.dataset.move === 'up' && card.previousElementSibling) {
			card.parentElement.insertBefore(card, card.previousElementSibling);
		} else if (button.dataset.move === 'down' && card.nextElementSibling) {
			card.parentElement.insertBefore(card.nextElementSibling, card);
		}
	});
}

export function initEditor(form) {
	for (const card of form.querySelectorAll('.method-card')) {
		wireCard(card);
	}
	const reorderable = form.querySelector('#methods');
	if (reorderable) wireReordering(reorderable);
}
