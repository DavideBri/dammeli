// Renders a decrypted payload for the public read-only page. Pure
// DOM-building here, no fetch/decrypt: src/scripts/app.mjs does that and
// hands this file the already-decrypted methods array.

import { t } from '../lib/i18n.mjs';
import { isContactBased, APP_SCHEMES } from '../lib/contact-methods.mjs';
import { buildVCard, vcardFilename } from '../lib/vcard.mjs';
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
 * to paying a given phone number — it (and any future method like it)
 * gets its own dedicated card instead, see buildContactCard() below.
 */
export function buildDirectLink(method) {
	if (method.type === 'paypal') return `https://paypal.me/${encodeURIComponent(method.value)}`;
	if (method.type === 'revolut') return `https://revolut.me/${encodeURIComponent(method.value.replace(/^@/, ''))}`;
	if (method.type?.toLowerCase() === 'bitcoin') return `bitcoin:${method.value}`;
	return null;
}

/**
 * Moves the `preferred` entry (if any) to the front, keeping everyone
 * else in their saved order — the "shown first" promise the editor's
 * preferred toggle makes only means something if the viewer honors it
 * regardless of where the entry actually sits in the payload array.
 */
function orderWithPreferredFirst(methods) {
	const index = methods.findIndex((m) => m.preferred);
	if (index <= 0) return methods;
	const copy = methods.slice();
	const [preferred] = copy.splice(index, 1);
	copy.unshift(preferred);
	return copy;
}

function preferredBadge(lang) {
	return ui.badge(t(lang, 'viewer.preferredBadge'), { tone: 'accent' });
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
	btn.appendChild(
		ui.methodTile({
			type: isKnown ? method.type : 'crypto',
			size: 48,
			letter: isKnown ? null : method.type,
			preferred: !!method.preferred,
		}),
	);

	const info = document.createElement('span');
	info.className = 'ds-pay-btn__info';
	const labelRow = document.createElement('span');
	labelRow.className = 'ds-pay-btn__label-row';
	const labelSpan = document.createElement('span');
	labelSpan.className = 'ds-pay-btn__label';
	labelSpan.textContent = label;
	labelRow.appendChild(labelSpan);
	if (method.preferred) labelRow.appendChild(preferredBadge(lang));
	const noteSpan = document.createElement('span');
	noteSpan.className = 'ds-pay-btn__note';
	noteSpan.textContent = note;
	info.append(labelRow, noteSpan);
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

function detailFieldRow(label, value, { mono = false, copyLabel }) {
	const row = document.createElement('div');
	row.className = 'ds-detail-card__row';

	const field = document.createElement('div');
	field.className = 'ds-detail-card__field';
	if (label) field.appendChild(ui.microLabel(label));
	const valueSpan = document.createElement('span');
	valueSpan.className = mono ? 'ds-detail-card__value ds-detail-card__value--mono' : 'ds-detail-card__value';
	valueSpan.textContent = value;
	field.appendChild(valueSpan);
	row.appendChild(field);

	row.appendChild(copyIconButton(value, copyLabel));
	return row;
}

function detailCardHeader(type, label, preferred, lang) {
	const header = document.createElement('div');
	header.className = 'ds-detail-card__header';
	header.appendChild(ui.methodTile({ type, size: 48, preferred: !!preferred }));
	const title = document.createElement('span');
	title.className = 'ds-pay-btn__label';
	title.textContent = label;
	header.appendChild(title);
	if (preferred) header.appendChild(preferredBadge(lang));
	return header;
}

/**
 * IBAN gets a bigger, dedicated card instead of a plain pay-button row:
 * the number and the account holder are "two different blocks" (in the
 * literal sense — separately copyable), not one handle like every other
 * method.
 */
function buildIbanCard(method, lang) {
	const card = document.createElement('div');
	card.className = 'ds-card ds-card--default ds-card--lifted ds-detail-card';
	card.appendChild(detailCardHeader('iban', t(lang, 'methods.iban.label'), method.preferred, lang));

	// No micro-label on this row — the header above it already says "IBAN".
	card.appendChild(detailFieldRow(null, method.value, { mono: true, copyLabel: `${t(lang, 'common.copy')} IBAN` }));

	if (method.holder) {
		const divider = document.createElement('div');
		divider.className = 'ds-detail-card__divider';
		card.appendChild(divider);
		card.appendChild(
			detailFieldRow(t(lang, 'methods.iban.holderTitle'), method.holder, {
				copyLabel: `${t(lang, 'common.copy')} ${t(lang, 'methods.iban.holderTitle')}`,
			}),
		);
	}

	return card;
}

/**
 * A contact-based method (src/lib/contact-methods.mjs — Satispay today):
 * no direct pay-link exists, the app only sends to someone already in the
 * payer's contacts. So instead of one "open"/"copy" button, this card
 * offers a vCard download (gets the creator into the payer's contacts in
 * one tap, name and number both right) plus, where a scheme is known, a
 * button that opens the app itself for whoever already has the contact.
 */
function buildContactCard(method, lang) {
	const card = document.createElement('div');
	card.className = 'ds-card ds-card--default ds-card--lifted ds-detail-card';
	const label = t(lang, `methods.${method.type}.label`);
	card.appendChild(detailCardHeader(method.type, label, method.preferred, lang));

	if (method.name) {
		card.appendChild(
			detailFieldRow(t(lang, 'contact.nameFieldLabel'), method.name, {
				copyLabel: `${t(lang, 'common.copy')} ${t(lang, 'contact.nameFieldLabel')}`,
			}),
		);
		const divider = document.createElement('div');
		divider.className = 'ds-detail-card__divider';
		card.appendChild(divider);
	}
	card.appendChild(
		detailFieldRow(null, method.value, { copyLabel: `${t(lang, 'common.copy')} ${label}` }),
	);

	const actions = document.createElement('div');
	actions.className = 'ds-detail-card__actions';
	actions.appendChild(
		ui.button({
			variant: 'secondary',
			size: 'sm',
			iconName: 'download',
			text: t(lang, 'contact.saveButton'),
			onClick: () => downloadVCard(method),
		}),
	);
	const scheme = APP_SCHEMES[method.type];
	if (scheme) {
		actions.appendChild(
			ui.button({
				variant: 'ghost',
				size: 'sm',
				iconName: 'arrow-up-right',
				text: t(lang, 'contact.openAppLabel', { app: label }),
				onClick: () => {
					window.location.href = scheme;
				},
			}),
		);
	}
	card.appendChild(actions);

	return card;
}

function downloadVCard(method) {
	const name = method.name || methodLabel(method.type);
	const blob = new Blob([buildVCard({ name, phone: method.value })], { type: 'text/vcard' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = vcardFilename(method.name);
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Renders every method into one ordered list — IBAN and contact-based
 * methods (src/lib/contact-methods.mjs) as their own bigger cards,
 * everything else as a pay-button — with the preferred one (if any)
 * moved to the front, badged, and tile-bordered in accent.
 */
export function renderMethods(container, methods, lang) {
	const ordered = orderWithPreferredFirst(methods);
	container.replaceChildren(
		...ordered.map((method) => {
			if (method.type === 'iban') return buildIbanCard(method, lang);
			if (isContactBased(method.type)) return buildContactCard(method, lang);
			return renderMethodCard(method, lang);
		}),
	);
}

/** Shows exactly one `[data-viewer-state="<state>"]` child, hides the rest. */
export function showViewerState(root, state) {
	for (const el of root.querySelectorAll('[data-viewer-state]')) {
		el.hidden = el.dataset.viewerState !== state;
	}
}
