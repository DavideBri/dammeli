// The editor screen: title field + the tile-grid method picker (tap a
// tile, a popover opens below with that method's field(s)). Owns all
// editor form state itself — src/scripts/create-flow.mjs just reads it
// back out via getTitle()/getCards() at submit time. No network calls,
// no persistence: this file only manages the form.

import { normalizeHandleFromUrl, normalizeIban, confirmationSuffix } from '../lib/normalize.mjs';
import { t } from '../lib/i18n.mjs';
import * as ui from './ui.mjs';

const ORDER = ['satispay', 'revolut', 'paypal', 'iban'];
const MAX_CUSTOM = 5;

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
 *   payload, for opening a write (edit) link on an existing page. Every
 *   non-main entry becomes its own custom slot (never truncated to
 *   MAX_CUSTOM here — editing must never drop existing data, even if it
 *   was written by a future version that allows more).
 */
export function initEditor(root, lang, { prefill = null } = {}) {
	const state = {
		title: prefill?.title ?? '',
		values: { satispay: '', revolut: '', paypal: '', iban: '' },
		holder: '',
		/** @type {Array<{label: string, value: string}>} */
		custom: [],
	};
	for (const entry of prefill?.methods ?? []) {
		if (ORDER.includes(entry.type)) {
			state.values[entry.type] = entry.value ?? '';
			if (entry.type === 'iban' && entry.holder) state.holder = entry.holder;
		} else {
			state.custom.push({ label: entry.type ?? '', value: entry.value ?? '' });
		}
	}

	/** Selection: null, a main method name, or `custom:<index>`. */
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

	function customIndex(id) {
		return id?.startsWith('custom:') ? Number(id.slice('custom:'.length)) : -1;
	}
	function isFilled(id) {
		if (ORDER.includes(id)) return !!state.values[id].trim();
		const i = customIndex(id);
		return i >= 0 ? !!state.custom[i]?.value.trim() : false;
	}
	function tileLabel(id) {
		if (ORDER.includes(id)) return t(lang, `methods.${id}.label`);
		const i = customIndex(id);
		if (i >= 0) return state.custom[i]?.label.trim() || t(lang, 'methods.crypto.label');
		return t(lang, 'editor.addMethodLabel');
	}
	/** The tiles currently on the grid, in display order — never includes the "add" affordance. */
	function tileIds() {
		return [...ORDER, ...state.custom.map((_, i) => `custom:${i}`)];
	}
	function filledCount() {
		return tileIds().filter(isFilled).length;
	}
	function updateCreateButton() {
		createBtn.disabled = disabled || filledCount() === 0;
	}
	function renderFilledCount() {
		filledCountEl.replaceChildren(
			ui.microLabel(t(lang, 'editor.filledCount', { count: filledCount(), total: tileIds().length })),
		);
		updateCreateButton();
	}

	function selectMethod(id) {
		if (id === '__add__') {
			if (state.custom.length >= MAX_CUSTOM) return;
			state.custom.push({ label: '', value: '' });
			selected = `custom:${state.custom.length - 1}`;
		} else {
			selected = selected === id ? null : id;
		}
		renderTiles();
		renderPopover();
		renderFilledCount();
		if (selected) {
			// The popover appears below the grid, often below the fold on a
			// phone — bring it into view instead of leaving the user to
			// scroll and find it themselves.
			popoverWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}

	function buildTile(id) {
		const isSelected = selected === id;
		const tileBtn = document.createElement('button');
		tileBtn.type = 'button';
		tileBtn.className = `ds-method-grid__btn${isSelected ? ' ds-method-grid__btn--selected' : ''}`;
		tileBtn.setAttribute('aria-pressed', String(isSelected));
		tileBtn.setAttribute('aria-label', tileLabel(id));
		tileBtn.disabled = disabled;
		tileBtn.appendChild(ui.methodTile({ type: id.startsWith('custom:') ? 'crypto' : id, size: 56, checked: isFilled(id), selected: isSelected }));
		const label = document.createElement('span');
		label.className = 'ds-method-grid__label';
		label.textContent = tileLabel(id);
		tileBtn.appendChild(label);
		tileBtn.addEventListener('click', () => selectMethod(id));
		return tileBtn;
	}

	function renderTiles() {
		tilesEl.replaceChildren();
		for (const id of tileIds()) tilesEl.appendChild(buildTile(id));
		if (state.custom.length < MAX_CUSTOM) {
			const addBtn = document.createElement('button');
			addBtn.type = 'button';
			addBtn.className = 'ds-method-grid__btn';
			addBtn.setAttribute('aria-label', t(lang, 'editor.addMethodLabel'));
			addBtn.disabled = disabled;
			addBtn.appendChild(ui.addTile(56));
			const label = document.createElement('span');
			label.className = 'ds-method-grid__label';
			label.textContent = t(lang, 'editor.addMethodLabel');
			addBtn.appendChild(label);
			addBtn.addEventListener('click', () => selectMethod('__add__'));
			tilesEl.appendChild(addBtn);
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

	function buildCustomFields(index) {
		const wrap = document.createDocumentFragment();
		const entry = state.custom[index];

		const labelField = ui.field({
			id: 'field-custom-label',
			label: t(lang, 'methods.crypto.labelFieldLabel'),
			placeholder: t(lang, 'methods.crypto.labelFieldPlaceholder'),
			value: entry.label,
		});
		labelField.input.disabled = disabled;
		labelField.input.addEventListener('input', () => {
			entry.label = labelField.input.value;
			renderTilesInPlace();
		});
		labelField.input.addEventListener('blur', () => {
			labelField.input.value = labelField.input.value.trim();
			entry.label = labelField.input.value;
			renderTilesInPlace();
		});
		wrap.appendChild(labelField.wrap);

		const valueField = ui.field({
			id: 'field-custom-value',
			label: t(lang, 'methods.crypto.valueFieldLabel'),
			placeholder: t(lang, 'methods.crypto.valuePlaceholder'),
			mono: true,
			value: entry.value,
		});
		valueField.input.disabled = disabled;
		const refreshConfirm = () => {
			const value = entry.value.trim();
			valueField.setConfirmNode(
				value ? ui.pasteConfirm(t(lang, 'editor.pasteConfirmPrefix'), confirmationSuffix(value, 6)) : null,
			);
		};
		valueField.input.addEventListener('input', () => {
			entry.value = valueField.input.value;
			refreshConfirm();
			renderFilledCount();
			renderTilesInPlace();
		});
		valueField.input.addEventListener('blur', () => {
			valueField.input.value = valueField.input.value.trim();
			entry.value = valueField.input.value;
			refreshConfirm();
		});
		refreshConfirm();
		wrap.appendChild(valueField.wrap);

		const removeBtn = ui.button({
			variant: 'ghost',
			size: 'sm',
			iconName: 'trash',
			text: t(lang, 'editor.removeMethod'),
			onClick: () => {
				state.custom.splice(index, 1);
				selected = null;
				renderTiles();
				renderPopover();
				renderFilledCount();
			},
		});
		removeBtn.disabled = disabled;
		wrap.appendChild(removeBtn);

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
		titleSpan.textContent = tileLabel(selected);
		head.appendChild(titleSpan);
		if (isFilled(selected)) head.appendChild(ui.microLabel(t(lang, 'editor.filledBadge'), { tone: 'accent' }));
		pop.appendChild(head);

		const customIdx = customIndex(selected);
		if (customIdx >= 0) {
			pop.appendChild(buildCustomFields(customIdx));
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

	/** Re-renders just the checkmarks/labels/selection styling, without losing focus mid-typing. */
	function renderTilesInPlace() {
		const ids = tileIds();
		for (const [i, id] of ids.entries()) {
			const tileBtn = tilesEl.children[i];
			if (!tileBtn) continue;
			const fresh = buildTile(id);
			tileBtn.replaceWith(fresh);
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
				...state.custom.map((entry) => ({ method: 'crypto', value: entry.value, cryptoType: entry.label })),
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
