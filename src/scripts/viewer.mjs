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
 * a payment page — same honesty bar as the editor's instructions: a wrong
 * link here is worse than no link at all.
 *
 * Satispay is deliberately still left out: unlike revolut.me (Revolut's
 * own public profile-link feature) or paypal.me, there's no verified,
 * documented consumer-to-consumer deep link that opens the app straight
 * to paying a given phone number. Needs the real scheme confirmed against
 * the live app before it can be added here.
 */
export function buildDirectLink(method) {
	if (method.type === 'paypal') return `https://paypal.me/${encodeURIComponent(method.value)}`;
	if (method.type === 'revolut') return `https://revolut.me/${encodeURIComponent(method.value.replace(/^@/, ''))}`;
	if (method.type?.toLowerCase() === 'bitcoin') return `bitcoin:${method.value}`;
	return null;
}

function renderMethodCard(method, lang) {
	const isKnown = KNOWN_TYPES.has(method.type);
	// A custom "other methods" entry has no fixed label of its own — the
	// label the creator typed for it (method.type, see PLAN.md section 5)
	// *is* its title here, same as its tile shows that label's initial
	// instead of a drawn mark.
	const label = isKnown ? t(lang, `methods.${method.type}.label`) : method.type;
	const note = method.value;
	const directLink = buildDirectLink(method);
	const action = directLink ? t(lang, 'common.open') : t(lang, 'common.copy');

	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'ds-pay-btn';
	btn.appendChild(ui.methodTile({ type: isKnown ? method.type : 'crypto', size: 48, letter: isKnown ? null : method.type }));

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

/** Every method except IBAN, which gets its own bigger card (renderIbanCard). */
export function renderMethods(container, methods, lang) {
	container.replaceChildren(
		...methods.filter((method) => method.type !== 'iban').map((method) => renderMethodCard(method, lang)),
	);
}

function copyIconButton(value, label) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'ds-icon-btn ds-icon-btn--outline';
	btn.setAttribute('aria-label', label);
	btn.title = label;
	btn.appendChild(ui.icon('copy', { size: 18, strokeWidth: 2 }));
	btn.addEventListener('click', async () => {
		await navigator.clipboard.writeText(value);
		btn.replaceChildren(ui.icon('check', { size: 18, strokeWidth: 2 }));
		setTimeout(() => {
			btn.replaceChildren(ui.icon('copy', { size: 18, strokeWidth: 2 }));
		}, 1500);
	});
	return btn;
}

function ibanFieldRow(label, value, { mono = false, copyLabel }) {
	const row = document.createElement('div');
	row.className = 'iban-card__row';

	const field = document.createElement('div');
	field.className = 'iban-card__field';
	if (label) field.appendChild(ui.microLabel(label));
	const valueSpan = document.createElement('span');
	valueSpan.className = mono ? 'iban-card__value iban-card__value--mono' : 'iban-card__value';
	valueSpan.textContent = value;
	field.appendChild(valueSpan);
	row.appendChild(field);

	row.appendChild(copyIconButton(value, copyLabel));
	return row;
}

/**
 * IBAN gets a bigger, dedicated card instead of a plain pay-button row:
 * the number and the account holder are "two different blocks" (in the
 * literal sense — separately copyable), not one handle like every other
 * method.
 */
export function renderIbanCard(container, method, lang) {
	if (!method) {
		container.hidden = true;
		container.replaceChildren();
		return;
	}
	container.hidden = false;
	container.className = 'ds-card ds-card--default ds-card--lifted iban-card';

	const header = document.createElement('div');
	header.className = 'iban-card__header';
	header.appendChild(ui.methodTile({ type: 'iban', size: 48 }));
	const title = document.createElement('span');
	title.className = 'ds-pay-btn__label';
	title.textContent = t(lang, 'methods.iban.label');
	header.appendChild(title);

	const rows = [
		// No micro-label on this row — the header above it already says "IBAN".
		ibanFieldRow(null, method.value, {
			mono: true,
			copyLabel: `${t(lang, 'common.copy')} IBAN`,
		}),
	];
	if (method.holder) {
		const divider = document.createElement('div');
		divider.className = 'iban-card__divider';
		rows.push(
			divider,
			ibanFieldRow(t(lang, 'methods.iban.holderTitle'), method.holder, {
				copyLabel: `${t(lang, 'common.copy')} ${t(lang, 'methods.iban.holderTitle')}`,
			}),
		);
	}

	container.replaceChildren(header, ...rows);
}

/** Shows exactly one `[data-viewer-state="<state>"]` child, hides the rest. */
export function showViewerState(root, state) {
	for (const el of root.querySelectorAll('[data-viewer-state]')) {
		el.hidden = el.dataset.viewerState !== state;
	}
}
