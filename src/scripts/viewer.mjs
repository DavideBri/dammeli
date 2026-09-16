// Renders a decrypted payload for the public read-only page. Pure
// DOM-building here, no fetch/decrypt: src/scripts/app.mjs does that and
// hands this file the already-decrypted methods array.

import { LOGOS } from '../vendor/logos.mjs';

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
 * same honesty bar as the editor's instructions (see index.astro) — no
 * verified current URL scheme for those two, and a wrong link here is
 * worse than no link at all.
 */
export function buildDirectLink(method) {
	if (method.type === 'paypal') return `https://paypal.me/${encodeURIComponent(method.value)}`;
	if (method.type === 'bitcoin') return `bitcoin:${method.value}`;
	return null;
}

function valueRow(label, value) {
	const p = document.createElement('p');
	p.className = 'mt-1 text-sm text-neutral-600';
	const strong = document.createElement('span');
	strong.className = 'font-mono text-neutral-900 break-all';
	strong.textContent = value;
	p.append(`${label}: `, strong);
	return p;
}

function copyButton(value) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className =
		'rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100';
	button.textContent = 'Copy';
	button.addEventListener('click', async () => {
		await navigator.clipboard.writeText(value);
		const original = button.textContent;
		button.textContent = 'Copied!';
		setTimeout(() => {
			button.textContent = original;
		}, 1500);
	});
	return button;
}

function renderMethodCard(method) {
	const card = document.createElement('div');
	card.className = 'rounded-lg border border-neutral-200 bg-white p-4';

	const title = document.createElement('h3');
	title.className = 'flex items-center gap-2 font-medium';
	if (LOGOS[method.type]) {
		const icon = document.createElement('span');
		icon.className = 'h-4 w-4 [&>svg]:h-4 [&>svg]:w-4';
		icon.setAttribute('aria-hidden', 'true');
		icon.innerHTML = LOGOS[method.type];
		title.appendChild(icon);
	}
	title.append(methodLabel(method.type));
	card.appendChild(title);

	if (method.type === 'iban' && method.holder) {
		card.appendChild(valueRow('Account holder', method.holder));
	}
	card.appendChild(valueRow(method.type === 'iban' ? 'IBAN' : 'Handle', method.value));

	const actions = document.createElement('div');
	actions.className = 'mt-3 flex flex-wrap gap-2';
	actions.appendChild(copyButton(method.value));

	const directLink = buildDirectLink(method);
	if (directLink) {
		const a = document.createElement('a');
		a.href = directLink;
		a.target = '_blank';
		a.rel = 'noopener noreferrer';
		a.className =
			'rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700';
		a.textContent = `Open in ${methodLabel(method.type)}`;
		actions.appendChild(a);
	}

	card.appendChild(actions);
	return card;
}

export function renderMethods(container, methods) {
	container.replaceChildren(...methods.map(renderMethodCard));
}

/** Shows exactly one `[data-viewer-state="<state>"]` child, hides the rest. */
export function showViewerState(root, state) {
	for (const el of root.querySelectorAll('[data-viewer-state]')) {
		el.hidden = el.dataset.viewerState !== state;
	}
}
