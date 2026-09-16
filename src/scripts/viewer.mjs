// Renders a decrypted payload for the public read-only page. Pure
// DOM-building here, no fetch/decrypt: src/scripts/app.mjs does that and
// hands this file the already-decrypted methods array.

import { t } from '../lib/i18n.mjs';
import * as ui from './ui.mjs';

const KNOWN_TYPES = new Set(['satispay', 'revolut', 'paypal', 'iban']);

const METHOD_LABELS = {
	satispay: 'Satispay',
	revolut: 'Revolut',
	paypal: 'PayPal',
	iban: 'IBAN',
	bitcoin: 'Bitcoin',
};

export function methodLabel(type) {
	return METHOD_LABELS[type] ?? type;
}

/**
 * Only for methods whose link format is solid enough to trust blindly on
 * a payment page. Satispay/Revolut deep links are deliberately left out:
 * same honesty bar as the editor's instructions — no verified current URL
 * scheme for those two, and a wrong link here is worse than no link at all.
 */
export function buildDirectLink(method) {
	if (method.type === 'paypal') return `https://paypal.me/${encodeURIComponent(method.value)}`;
	if (method.type?.toLowerCase() === 'bitcoin') return `bitcoin:${method.value}`;
	return null;
}

function truncate(value, length) {
	return value.length <= length ? value : `${value.slice(0, length)}…`;
}

function renderMethodCard(method, lang) {
	const isKnown = KNOWN_TYPES.has(method.type);
	const tileType = isKnown ? method.type : 'crypto';
	const label = isKnown ? t(lang, `methods.${method.type}.label`) : t(lang, 'methods.crypto.label');
	const note = isKnown ? method.value : `${method.type} · ${truncate(method.value, 10)}`;
	const directLink = buildDirectLink(method);
	const action = directLink ? t(lang, 'common.open') : t(lang, 'common.copy');

	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'ds-pay-btn';
	btn.appendChild(ui.methodTile({ type: tileType, size: 48 }));

	const info = document.createElement('span');
	info.className = 'ds-pay-btn__info';
	const labelSpan = document.createElement('span');
	labelSpan.className = 'ds-pay-btn__label';
	labelSpan.textContent = label;
	const noteSpan = document.createElement('span');
	noteSpan.className = 'ds-pay-btn__note';
	noteSpan.textContent = note;
	info.append(labelSpan, noteSpan);
	btn.appendChild(info);

	const actionSpan = document.createElement('span');
	actionSpan.className = 'ds-pay-btn__action';
	const actionText = document.createElement('span');
	actionText.textContent = action;
	actionSpan.appendChild(actionText);
	actionSpan.appendChild(ui.icon('arrow-up-right', { size: 15, strokeWidth: 2.5 }));
	btn.appendChild(actionSpan);

	btn.addEventListener('click', async () => {
		if (directLink) {
			window.open(directLink, '_blank', 'noopener,noreferrer');
			return;
		}
		await navigator.clipboard.writeText(method.value);
		actionText.textContent = t(lang, 'common.copied');
		setTimeout(() => {
			actionText.textContent = action;
		}, 1500);
	});

	return btn;
}

export function renderMethods(container, methods, lang) {
	container.replaceChildren(...methods.map((method) => renderMethodCard(method, lang)));
}

/** Shows exactly one `[data-viewer-state="<state>"]` child, hides the rest. */
export function showViewerState(root, state) {
	for (const el of root.querySelectorAll('[data-viewer-state]')) {
		el.hidden = el.dataset.viewerState !== state;
	}
}
