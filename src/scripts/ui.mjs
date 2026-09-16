// Small DOM builders for the dammeli design system's components
// (src/styles/ds/components.css) — the vanilla-JS equivalent of the
// uploaded design system's React components. Pure DOM construction, no
// state: callers own state and re-render by replacing children.

import { iconSvg } from '../vendor/icons.mjs';
import { methodMarkSvg, METHOD_TINTS } from '../vendor/marks.mjs';

export function icon(name, opts) {
	const span = document.createElement('span');
	span.className = 'ds-icon--inline';
	span.innerHTML = iconSvg(name, opts);
	return span;
}

export function iconButton({ iconName, label, onClick, outline = false }) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = outline ? 'ds-icon-btn ds-icon-btn--outline' : 'ds-icon-btn';
	button.setAttribute('aria-label', label);
	button.title = label;
	button.innerHTML = iconSvg(iconName, { size: 20 });
	if (onClick) button.addEventListener('click', onClick);
	return button;
}

export function microLabel(text, { tone } = {}) {
	const span = document.createElement('span');
	span.className = tone ? `ds-micro-label ds-micro-label--${tone}` : 'ds-micro-label';
	span.textContent = text;
	return span;
}

export function badge(text, { tone = 'neutral', tilt = false } = {}) {
	const span = document.createElement('span');
	span.className = `ds-badge ds-badge--${tone}${tilt ? ' ds-badge--tilt' : ''}`;
	span.textContent = text;
	return span;
}

export function button({
	variant = 'primary',
	size = 'md',
	full = false,
	text,
	iconName,
	onClick,
	type = 'button',
} = {}) {
	const el = document.createElement('button');
	el.type = type;
	el.className = `ds-btn ds-btn--${variant} ds-btn--${size}${full ? ' ds-btn--full' : ''}`;
	if (iconName) el.appendChild(icon(iconName, { size: size === 'sm' ? 16 : 20 }));
	el.append(document.createTextNode(text));
	if (onClick) el.addEventListener('click', onClick);
	return el;
}

/** Field: label + optional hint + input + confirm/error slot below it. */
export function field({
	id,
	label,
	hint,
	value = '',
	placeholder,
	mono = false,
	inputMode,
	type = 'text',
} = {}) {
	const wrap = document.createElement('div');
	wrap.className = 'ds-field';

	if (label) {
		const labelEl = document.createElement('label');
		labelEl.className = 'ds-field__label';
		labelEl.htmlFor = id;
		labelEl.textContent = label;
		wrap.appendChild(labelEl);
	}
	if (hint) {
		const hintEl = document.createElement('span');
		hintEl.className = 'ds-field__hint';
		hintEl.textContent = hint;
		wrap.appendChild(hintEl);
	}

	const input = document.createElement('input');
	input.id = id;
	input.type = type;
	input.autocomplete = 'off';
	input.className = `ds-field__input${mono ? ' ds-field__input--mono' : ''}`;
	input.placeholder = placeholder ?? '';
	input.value = value;
	if (inputMode) input.inputMode = inputMode;
	wrap.appendChild(input);

	const slot = document.createElement('div');
	wrap.appendChild(slot);

	return {
		wrap,
		input,
		slot,
		/** Replaces the confirm/error slot with an arbitrary element (e.g. pasteConfirm()). */
		setConfirmNode(node) {
			input.classList.remove('ds-field__input--error');
			slot.replaceChildren(...(node ? [node] : []));
		},
		/** Shows a green paste-confirmation, or clears it when `text` is falsy. */
		setConfirm(text) {
			slot.replaceChildren();
			input.classList.remove('ds-field__input--error');
			if (!text) return;
			const span = document.createElement('span');
			span.className = 'ds-field__confirm';
			span.appendChild(icon('check', { size: 14, strokeWidth: 2.5 }));
			span.append(document.createTextNode(text));
			slot.appendChild(span);
		},
		setError(text) {
			slot.replaceChildren();
			input.classList.toggle('ds-field__input--error', !!text);
			if (!text) return;
			const span = document.createElement('span');
			span.className = 'ds-field__error';
			span.appendChild(icon('circle-alert', { size: 14, strokeWidth: 2.5 }));
			span.append(document.createTextNode(text));
			slot.appendChild(span);
		},
	};
}

/** The green "ends with …1234" chip shown under a filled-in field. */
export function pasteConfirm(prefix, tail) {
	const span = document.createElement('span');
	span.className = 'ds-paste-confirm';
	span.appendChild(icon('check', { size: 14, strokeWidth: 2.5 }));
	const text = document.createElement('span');
	const b = document.createElement('b');
	b.textContent = tail;
	text.append(`${prefix} `, b);
	span.appendChild(text);
	return span;
}

export function notice({ tone = 'neutral', iconName = 'info', title, body }) {
	const div = document.createElement('div');
	div.className = `ds-notice ds-notice--${tone}`;
	const iconWrap = document.createElement('span');
	iconWrap.className = 'ds-notice__icon';
	iconWrap.appendChild(icon(iconName, { size: 16, strokeWidth: 2 }));
	div.appendChild(iconWrap);
	const text = document.createElement('span');
	text.className = 'ds-notice__text';
	if (title) {
		const strong = document.createElement('span');
		strong.className = 'ds-notice__title';
		strong.textContent = `${title} `;
		text.appendChild(strong);
	}
	text.append(document.createTextNode(body));
	div.appendChild(text);
	return div;
}

/**
 * The tinted, bordered, hard-shadowed method mark (no third-party logos).
 * `size` must be one of the sizes with a matching CSS modifier (48, 56) —
 * CSP forbids setting width/height as an inline style.
 */
export function methodTile({ type, size = 56, checked = false, selected = false }) {
	const wrap = document.createElement('span');
	wrap.className = 'ds-method-tile';
	wrap.setAttribute('aria-hidden', 'true');

	const tintType = type in METHOD_TINTS ? type : 'crypto';
	const mark = document.createElement('span');
	mark.className = `ds-method-tile__mark ds-method-tile__mark--${size} ds-method-tile__mark--${tintType}${selected ? ' ds-method-tile--selected' : ''}`;
	mark.innerHTML = methodMarkSvg(type, Math.round(size * 0.52));
	wrap.appendChild(mark);

	if (checked) {
		const check = document.createElement('span');
		check.className = `ds-method-tile__check${selected ? ' ds-method-tile--selected' : ''}`;
		check.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5"></path></svg>`;
		wrap.appendChild(check);
	}
	return wrap;
}

export function topBar({ title, onBack, backLabel, right = [], wordmarkFallback = true } = {}) {
	const header = document.createElement('header');
	header.className = 'ds-top-bar';

	if (onBack) {
		const back = iconButton({ iconName: 'arrow-left', label: backLabel ?? 'Back', onClick: onBack });
		back.classList.add('ds-icon-btn--back');
		header.appendChild(back);
	}

	const titleWrap = document.createElement('div');
	titleWrap.className = 'ds-top-bar__title';
	if (title) {
		const span = document.createElement('span');
		span.className = 'ds-top-bar__title-text';
		span.textContent = title;
		titleWrap.appendChild(span);
	} else if (wordmarkFallback) {
		titleWrap.appendChild(wordmark(20));
	}
	header.appendChild(titleWrap);

	const rightWrap = document.createElement('div');
	rightWrap.className = 'ds-top-bar__right';
	for (const el of right) rightWrap.appendChild(el);
	header.appendChild(rightWrap);

	return { header, titleWrap };
}

/** Compact language switcher: shows the language you'd switch TO. */
export function langButton(targetLangLabel, onClick) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'ds-icon-btn ds-lang-btn';
	button.textContent = targetLangLabel;
	button.setAttribute('aria-label', targetLangLabel);
	button.addEventListener('click', onClick);
	return button;
}

export function wordmark(size = 20) {
	const span = document.createElement('span');
	span.className = 'ds-wordmark';
	const text = document.createElement('span');
	text.className = size <= 17 ? 'ds-wordmark__text ds-wordmark__text--sm' : 'ds-wordmark__text';
	const dot = document.createElement('span');
	dot.className = 'ds-wordmark__dot';
	dot.textContent = '.';
	text.append('dammeli', dot);
	span.appendChild(text);
	return span;
}

export function copyFeedbackButton({ variant, size, full, iconName, text, copiedText, getValue, onClick }) {
	const el = button({ variant, size, full, iconName, text });
	el.addEventListener('click', async () => {
		const value = getValue();
		await navigator.clipboard.writeText(value);
		onClick?.();
		const original = el.textContent;
		const originalIcon = iconName;
		el.textContent = '';
		if (originalIcon) el.appendChild(icon('check', { size: size === 'sm' ? 16 : 20 }));
		el.append(document.createTextNode(copiedText));
		setTimeout(() => {
			el.textContent = '';
			if (originalIcon) el.appendChild(icon(originalIcon, { size: size === 'sm' ? 16 : 20 }));
			el.append(document.createTextNode(text));
		}, 1500);
		void original;
	});
	return el;
}
