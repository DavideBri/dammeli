// The editor screen: title field + the tile-grid method picker (tap a
// tile, a popover opens below with that method's field(s)). Owns all
// editor form state itself — src/scripts/create-flow.mjs just reads it
// back out via getTitle()/getCards() at submit time. No network calls,
// no persistence: this file only manages the form.

import { normalizeHandleFromUrl, normalizeIban, confirmationSuffix } from '../lib/normalize.mjs';
import { t } from '../lib/i18n.mjs';
import * as ui from './ui.mjs';

const ORDER = ['satispay', 'revolut', 'paypal', 'iban'];
const ALL = [...ORDER, 'crypto'];

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

/**
 * @param {Element} root the `[data-screen="editor"]` section
 * @param {string} lang
 * @param {{title?: string, methods?: Array}} [prefill] an already-decrypted
 *   payload, for opening a write (edit) link on an existing page. The one
 *   non-main entry (if any) fills the single "other methods" slot — same
 *   simplification the pre-redesign editor made.
 */
export function initEditor(root, lang, { prefill = null } = {}) {
	const state = {
		title: prefill?.title ?? '',
		values: { satispay: '', revolut: '', paypal: '', iban: '' },
		holder: '',
		cryptoLabel: '',
		cryptoValue: '',
	};
	for (const entry of prefill?.methods ?? []) {
		if (ORDER.includes(entry.type)) {
			state.values[entry.type] = entry.value ?? '';
			if (entry.type === 'iban' && entry.holder) state.holder = entry.holder;
		} else {
			state.cryptoLabel = entry.type ?? '';
			state.cryptoValue = entry.value ?? '';
		}
	}

	let selected = prefill ? null : 'satispay';
	let disabled = false;

	const titleFieldSlot = root.querySelector('[data-title-field]');
	const tilesEl = root.querySelector('[data-method-tiles]');
	const popoverWrap = root.querySelector('[data-method-popover-wrap]');
	const filledCountEl = root.querySelector('[data-filled-count]');
	const createBtn = root.querySelector('[data-create]');

	root.querySelector('[data-editor-kicker]').replaceChildren(ui.microLabel(t(lang, 'editor.kicker'), { tone: 'accent' }));
	root.querySelector('[data-editor-h1]').textContent = t(lang, 'editor.h1');
	root.querySelector('[data-editor-subtitle]').textContent = t(lang, 'editor.subtitle');
	root.querySelector('[data-editor-methods-heading]').textContent = t(lang, 'editor.methodsHeading');
	root.querySelector('[data-editor-footnote]').textContent = t(lang, 'editor.footnote');

	const titleField = ui.field({
		id: 'page-title',
		label: t(lang, 'editor.titleFieldLabel'),
		hint: t(lang, 'editor.titleFieldHint'),
		placeholder: t(lang, 'editor.titleFieldPlaceholder'),
		value: state.title,
	});
	titleField.input.addEventListener('input', () => {
		state.title = titleField.input.value;
	});
	titleFieldSlot.replaceChildren(titleField.wrap);

	function isFilled(method) {
		return method === 'crypto' ? !!state.cryptoValue.trim() : !!state.values[method].trim();
	}
	function filledCount() {
		return ALL.filter(isFilled).length;
	}
	function updateCreateButton() {
		createBtn.disabled = disabled || filledCount() === 0;
	}
	function renderFilledCount() {
		filledCountEl.replaceChildren(ui.microLabel(t(lang, 'editor.filledCount', { count: filledCount(), total: ALL.length })));
		updateCreateButton();
	}

	function selectMethod(method) {
		selected = selected === method ? null : method;
		renderTiles();
		renderPopover();
	}

	function renderTiles() {
		tilesEl.replaceChildren();
		for (const method of ALL) {
			const isSelected = selected === method;
			const tileBtn = document.createElement('button');
			tileBtn.type = 'button';
			tileBtn.className = `ds-method-grid__btn${isSelected ? ' ds-method-grid__btn--selected' : ''}`;
			tileBtn.setAttribute('aria-pressed', String(isSelected));
			tileBtn.setAttribute('aria-label', t(lang, `methods.${method}.label`));
			tileBtn.disabled = disabled;
			tileBtn.appendChild(ui.methodTile({ type: method, size: 56, checked: isFilled(method), selected: isSelected }));
			const label = document.createElement('span');
			label.className = 'ds-method-grid__label';
			label.textContent = t(lang, `methods.${method}.label`);
			tileBtn.appendChild(label);
			tileBtn.addEventListener('click', () => selectMethod(method));
			tilesEl.appendChild(tileBtn);
		}
	}

	function mainFieldConfig(method) {
		return {
			id: `field-${method}`,
			label: t(lang, `methods.${method}.fieldLabel`),
			placeholder: t(lang, `methods.${method}.placeholder`),
			mono: method === 'iban',
			inputMode: method === 'satispay' ? 'tel' : undefined,
		};
	}

	function buildMainField(method) {
		const f = ui.field({ ...mainFieldConfig(method), value: state.values[method] });
		f.input.disabled = disabled;
		const refreshConfirm = () => {
			const value = state.values[method].trim();
			f.setConfirmNode(value ? ui.pasteConfirm(t(lang, 'editor.pasteConfirmPrefix'), confirmationSuffix(value)) : null);
		};
		f.input.addEventListener('input', () => {
			state.values[method] = f.input.value;
			refreshConfirm();
			renderFilledCount();
			renderTilesInPlace();
		});
		f.input.addEventListener('blur', () => {
			f.input.value = normalizeValue(method, f.input.value);
			state.values[method] = f.input.value;
			refreshConfirm();
		});
		refreshConfirm();
		return f.wrap;
	}

	function buildHolderField() {
		const f = ui.field({
			id: 'field-iban-holder',
			label: t(lang, 'methods.iban.holderLabel'),
			hint: t(lang, 'methods.iban.holderHint'),
			placeholder: t(lang, 'methods.iban.holderPlaceholder'),
			value: state.holder,
		});
		f.input.disabled = disabled;
		f.input.addEventListener('input', () => {
			state.holder = f.input.value;
		});
		f.input.addEventListener('blur', () => {
			f.input.value = f.input.value.trim();
			state.holder = f.input.value;
		});
		return f.wrap;
	}

	function buildCryptoFields() {
		const wrap = document.createDocumentFragment();

		const labelField = ui.field({
			id: 'field-crypto-label',
			label: t(lang, 'methods.crypto.labelFieldLabel'),
			placeholder: t(lang, 'methods.crypto.labelFieldPlaceholder'),
			value: state.cryptoLabel,
		});
		labelField.input.disabled = disabled;
		labelField.input.addEventListener('input', () => {
			state.cryptoLabel = labelField.input.value;
		});
		labelField.input.addEventListener('blur', () => {
			labelField.input.value = labelField.input.value.trim();
			state.cryptoLabel = labelField.input.value;
		});
		wrap.appendChild(labelField.wrap);

		const valueField = ui.field({
			id: 'field-crypto-value',
			label: t(lang, 'methods.crypto.valueFieldLabel'),
			placeholder: t(lang, 'methods.crypto.valuePlaceholder'),
			mono: true,
			value: state.cryptoValue,
		});
		valueField.input.disabled = disabled;
		const refreshConfirm = () => {
			const value = state.cryptoValue.trim();
			valueField.setConfirmNode(
				value ? ui.pasteConfirm(t(lang, 'editor.pasteConfirmPrefix'), confirmationSuffix(value, 6)) : null,
			);
		};
		valueField.input.addEventListener('input', () => {
			state.cryptoValue = valueField.input.value;
			refreshConfirm();
			renderFilledCount();
			renderTilesInPlace();
		});
		valueField.input.addEventListener('blur', () => {
			valueField.input.value = valueField.input.value.trim();
			state.cryptoValue = valueField.input.value;
			refreshConfirm();
		});
		refreshConfirm();
		wrap.appendChild(valueField.wrap);

		return wrap;
	}

	function renderPopover() {
		popoverWrap.replaceChildren();
		if (!selected) return;

		const arrow = document.createElement('span');
		// Centered rather than pointing at the selected tile: with the grid
		// now wrapping to multiple rows (more methods can be added later),
		// there's no single well-defined column position to point at, and
		// CSP forbids computing one as an inline style anyway.
		arrow.className = 'ds-method-grid__arrow';
		arrow.setAttribute('aria-hidden', 'true');

		const pop = document.createElement('div');
		pop.className = 'ds-method-grid__popover';

		const head = document.createElement('div');
		head.className = 'ds-method-grid__popover-head';
		const titleSpan = document.createElement('span');
		titleSpan.className = 'ds-method-grid__popover-title';
		titleSpan.textContent = t(lang, `methods.${selected}.label`);
		head.appendChild(titleSpan);
		if (isFilled(selected)) head.appendChild(ui.microLabel(t(lang, 'editor.filledBadge'), { tone: 'accent' }));
		pop.appendChild(head);

		if (selected === 'crypto') {
			pop.appendChild(buildCryptoFields());
			const hint = document.createElement('p');
			hint.className = 'ds-method-grid__popover-hint';
			hint.textContent = t(lang, 'methods.crypto.hint');
			pop.appendChild(hint);
		} else {
			pop.appendChild(buildMainField(selected));
			if (selected === 'iban') pop.appendChild(buildHolderField());
			const hint = document.createElement('p');
			hint.className = 'ds-method-grid__popover-hint';
			hint.textContent = t(lang, `methods.${selected}.hint`);
			pop.appendChild(hint);
		}

		const outer = document.createElement('div');
		outer.className = 'ds-method-grid__popover-wrap';
		outer.append(arrow, pop);
		popoverWrap.appendChild(outer);
	}

	/** Re-renders just the checkmarks/selection styling, without losing focus mid-typing. */
	function renderTilesInPlace() {
		for (const [i, method] of ALL.entries()) {
			const tileBtn = tilesEl.children[i];
			if (!tileBtn) continue;
			tileBtn.replaceChildren();
			const isSelected = selected === method;
			tileBtn.appendChild(ui.methodTile({ type: method, size: 56, checked: isFilled(method), selected: isSelected }));
			const label = document.createElement('span');
			label.className = 'ds-method-grid__label';
			label.textContent = t(lang, `methods.${method}.label`);
			tileBtn.appendChild(label);
		}
	}

	renderTiles();
	renderPopover();
	renderFilledCount();

	return {
		getTitle: () => state.title.trim(),
		getCards() {
			return [
				...ORDER.map((method) => ({
					method,
					value: state.values[method],
					holder: method === 'iban' ? state.holder : undefined,
				})),
				{ method: 'crypto', value: state.cryptoValue, cryptoType: state.cryptoLabel },
			];
		},
		setDisabled(value) {
			disabled = value;
			titleField.input.disabled = value;
			renderTiles();
			renderPopover();
			updateCreateButton();
		},
	};
}
