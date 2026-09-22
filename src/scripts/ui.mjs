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

/** A spinning ring, for a loading state that isn't just sad static text.
 * `label` is exposed to assistive tech (role="status") — nothing is drawn
 * on screen for it, the animation speaks for itself visually. */
export function spinner(label) {
	const wrap = document.createElement('div');
	wrap.className = 'ds-spinner-wrap';
	wrap.setAttribute('role', 'status');
	wrap.setAttribute('aria-label', label ?? '');
	const ring = document.createElement('span');
	ring.className = 'ds-spinner';
	ring.setAttribute('aria-hidden', 'true');
	wrap.appendChild(ring);
	return wrap;
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

/** Field: label (with an optional "?" that reveals a hint on click or
 * hover, kept out of the way otherwise) + input (with an optional
 * clear-to-empty "x", once it has content) + confirm/error slot below it. */
export function field({
	id,
	label,
	hint,
	hintToggleLabel,
	value = '',
	placeholder,
	mono = false,
	inputMode,
	type = 'text',
	clearLabel,
} = {}) {
	const wrap = document.createElement('div');
	wrap.className = 'ds-field';

	let labelRow = null;
	if (label) {
		labelRow = document.createElement('div');
		labelRow.className = 'ds-field__label-row';
		const labelEl = document.createElement('label');
		labelEl.className = 'ds-field__label';
		labelEl.htmlFor = id;
		labelEl.textContent = label;
		labelRow.appendChild(labelEl);
		wrap.appendChild(labelRow);
	}
	if (hint) {
		const hintEl = document.createElement('span');
		hintEl.className = 'ds-field__hint';
		hintEl.textContent = hint;
		if (labelRow) {
			// Hidden (via the CSS class, not the `hidden` attribute — Tailwind's
			// preflight sets `[hidden] { display: none !important }`, which no
			// plain override can beat) until the "?" is clicked or hovered.
			// Kept in the same flex row as the label so :hover/:focus-visible on
			// the toggle can reveal it purely in CSS, while it still wraps onto
			// its own line (ds-field__hint has flex-basis: 100%).
			const hintToggle = document.createElement('button');
			hintToggle.type = 'button';
			hintToggle.className = 'ds-field__hint-toggle';
			hintToggle.setAttribute('aria-label', hintToggleLabel || hint);
			hintToggle.setAttribute('aria-expanded', 'false');
			hintToggle.innerHTML = iconSvg('circle-help', { size: 15, strokeWidth: 1.75 });
			hintToggle.addEventListener('click', () => {
				const open = hintEl.classList.toggle('ds-field__hint--open');
				hintToggle.setAttribute('aria-expanded', String(open));
			});
			labelRow.appendChild(hintToggle);
			labelRow.appendChild(hintEl);
		} else {
			wrap.appendChild(hintEl);
		}
	}

	const row = document.createElement('div');
	row.className = 'ds-field__row';

	const input = document.createElement('input');
	input.id = id;
	input.type = type;
	input.autocomplete = 'off';
	input.className = `ds-field__input${mono ? ' ds-field__input--mono' : ''}${clearLabel ? ' ds-field__input--clearable' : ''}`;
	input.placeholder = placeholder ?? '';
	input.value = value;
	if (inputMode) input.inputMode = inputMode;
	row.appendChild(input);

	let clearBtn = null;
	function updateClear() {
		if (clearBtn) clearBtn.hidden = !input.value;
	}
	if (clearLabel) {
		clearBtn = document.createElement('button');
		clearBtn.type = 'button';
		clearBtn.className = 'ds-field__clear';
		clearBtn.setAttribute('aria-label', clearLabel);
		clearBtn.innerHTML = iconSvg('x', { size: 14, strokeWidth: 2.5 });
		clearBtn.addEventListener('click', () => {
			input.value = '';
			input.dispatchEvent(new Event('input', { bubbles: true }));
			// Also runs whatever the caller normally does on blur (trimming,
			// refreshing confirm/preferred slots) — a click on this button is
			// a single decisive action, not a mid-typing state, so it should
			// settle immediately rather than wait for the input to actually
			// lose focus.
			input.dispatchEvent(new Event('blur'));
			updateClear();
			input.focus();
		});
		input.addEventListener('input', updateClear);
		updateClear();
		row.appendChild(clearBtn);
	}
	wrap.appendChild(row);

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

/** A small clickable pill suggesting a value already typed elsewhere —
 * click to accept it instead of retyping (e.g. the editor's "reuse this
 * contact" chip, filling a sibling contact-based method's phone number
 * and name from one already entered). */
export function suggestionChip(text, onClick) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'ds-suggestion-chip';
	btn.textContent = text;
	btn.addEventListener('click', onClick);
	return btn;
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
 * CSP forbids setting width/height as an inline style. `letter` (used for
 * custom "other methods" entries once they have a label) replaces the
 * drawn mark with that letter, uppercased — a custom entry doesn't get
 * its own drawn mark, so its own label's initial is the closest thing to
 * a recognizable icon.
 */
export function methodTile({ type, size = 56, checked = false, selected = false, letter = null, preferred = false }) {
	const wrap = document.createElement('span');
	wrap.className = 'ds-method-tile';
	wrap.setAttribute('aria-hidden', 'true');

	const tintType = type in METHOD_TINTS ? type : 'crypto';
	const mark = document.createElement('span');
	mark.className = `ds-method-tile__mark ds-method-tile__mark--${size} ds-method-tile__mark--${tintType}${selected ? ' ds-method-tile--selected' : ''}${preferred ? ' ds-method-tile__mark--preferred' : ''}`;
	if (letter) {
		const letterSpan = document.createElement('span');
		letterSpan.className = 'ds-method-tile__letter';
		letterSpan.textContent = letter.trim().slice(0, 1).toUpperCase();
		mark.appendChild(letterSpan);
	} else {
		mark.innerHTML = methodMarkSvg(type, Math.round(size * 0.52));
	}
	wrap.appendChild(mark);

	if (checked) {
		const check = document.createElement('span');
		check.className = `ds-method-tile__check${selected ? ' ds-method-tile--selected' : ''}`;
		check.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6.5"></path></svg>`;
		wrap.appendChild(check);
	}
	return wrap;
}

/** The dashed, muted "add another" tile for the custom-methods grid. */
export function addTile(size = 56) {
	const wrap = document.createElement('span');
	wrap.className = 'ds-method-tile';
	wrap.setAttribute('aria-hidden', 'true');
	const mark = document.createElement('span');
	mark.className = `ds-method-tile__mark ds-method-tile__mark--${size} ds-method-tile__mark--add`;
	mark.appendChild(icon('plus', { size: Math.round(size * 0.45), strokeWidth: 2.2 }));
	wrap.appendChild(mark);
	return wrap;
}

/** A labeled checkbox-like toggle, styled as a small bordered box + text. */
/** A plain star toggle — no text, the fill alone says whether it's on. */
export function starToggle({ active, label, hint, onClick }) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = `ds-star-toggle${active ? ' ds-star-toggle--active' : ''}`;
	button.setAttribute('aria-pressed', String(active));
	button.setAttribute('aria-label', label);
	if (hint) button.title = hint;
	button.innerHTML = iconSvg('star', { size: 22, strokeWidth: 1.75, filled: active });
	button.addEventListener('click', onClick);
	return button;
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
		titleWrap.appendChild(wordmarkLink(20));
	}
	header.appendChild(titleWrap);

	const rightWrap = document.createElement('div');
	rightWrap.className = 'ds-top-bar__right';
	for (const el of right) rightWrap.appendChild(el);
	header.appendChild(rightWrap);

	return { header, titleWrap };
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

/** The wordmark, wrapped as a plain link home. A different pathname (every
 * page but the editor's own "/") navigates natively; a caller whose own URL
 * can share "/" with a different hash (the public viewer, at "/#1r…") still
 * needs to wire up its own hard-navigate click handler on top of this, the
 * same way its other same-path links already do — this link only sets
 * `href`, it doesn't know about that reload requirement itself. */
export function wordmarkLink(size = 20) {
	const link = document.createElement('a');
	link.href = '/';
	link.className = 'ds-wordmark-link';
	link.appendChild(wordmark(size));
	return link;
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
