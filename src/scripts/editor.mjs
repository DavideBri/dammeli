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
 *   was written by a future version that allows more). The incoming
 *   array's order becomes the starting point for `state.order`, and
 *   whichever entry (if any) has `preferred: true` seeds `state.preferred`.
 */
export function initEditor(root, lang, { prefill = null } = {}) {
	const state = {
		title: prefill?.title ?? '',
		values: { satispay: '', revolut: '', paypal: '', iban: '' },
		holder: '',
		/** @type {Array<{id: string, label: string, value: string}>} */
		custom: [],
		/** Every id (main + custom), in payload/display order. */
		order: [],
		/** The one id shown first on the public page, or null. */
		preferred: null,
	};
	let nextCustomId = 1;
	const seenMain = new Set();
	for (const entry of prefill?.methods ?? []) {
		if (ORDER.includes(entry.type)) {
			state.values[entry.type] = entry.value ?? '';
			if (entry.type === 'iban' && entry.holder) state.holder = entry.holder;
			state.order.push(entry.type);
			seenMain.add(entry.type);
			if (entry.preferred) state.preferred = entry.type;
		} else {
			const id = `c${nextCustomId++}`;
			state.custom.push({ id, label: entry.type ?? '', value: entry.value ?? '' });
			state.order.push(id);
			if (entry.preferred) state.preferred = id;
		}
	}
	for (const method of ORDER) {
		if (!seenMain.has(method)) state.order.push(method);
	}

	/** Selection: null, a main method name, or a custom entry's id. Closed
	 * by default — nothing is pre-selected, whether creating a new page or
	 * editing an existing one. */
	let selected = null;
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
	const footnoteEl = root.querySelector('[data-editor-footnote]');
	const howItWorksLink = document.createElement('a');
	howItWorksLink.href = '/how-it-works';
	howItWorksLink.className = 'ds-text-accent';
	howItWorksLink.textContent = t(lang, 'editor.howItWorks');
	footnoteEl.replaceChildren(`${t(lang, 'editor.footnote')} `, howItWorksLink);

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

	function findCustom(id) {
		return state.custom.find((entry) => entry.id === id);
	}
	function isCustomId(id) {
		return !ORDER.includes(id);
	}
	function isFilled(id) {
		return ORDER.includes(id) ? !!state.values[id].trim() : !!findCustom(id)?.value.trim();
	}
	function tileLabel(id) {
		if (ORDER.includes(id)) return t(lang, `methods.${id}.label`);
		return findCustom(id)?.label.trim() || t(lang, 'methods.crypto.label');
	}
	/** A custom entry's tile shows its own label's initial once it has one. */
	function tileLetter(id) {
		return isCustomId(id) ? findCustom(id)?.label.trim() || null : null;
	}
	/** The tiles currently on the grid — never includes the "add" affordance. */
	function tileIds() {
		return state.order;
	}
	function filledCount() {
		return tileIds().filter(isFilled).length;
	}
	/** Filled ids only, in their current payload order — what the reorder controls move within. */
	function filledIds() {
		return state.order.filter(isFilled);
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

	/** Swaps `id` with its neighbor among filled entries — unfilled ids in
	 * `order` keep their raw position, since they're invisible in the
	 * payload anyway (assemblePayload drops empty values). */
	function moveFilled(id, direction) {
		const filled = filledIds();
		const pos = filled.indexOf(id);
		const swapPos = pos + direction;
		if (pos < 0 || swapPos < 0 || swapPos >= filled.length) return;
		const otherId = filled[swapPos];
		const a = state.order.indexOf(id);
		const b = state.order.indexOf(otherId);
		[state.order[a], state.order[b]] = [state.order[b], state.order[a]];
	}

	function selectMethod(id) {
		if (id === '__add__') {
			if (state.custom.length >= MAX_CUSTOM) return;
			const newId = `c${nextCustomId++}`;
			state.custom.push({ id: newId, label: '', value: '' });
			state.order.push(newId);
			selected = newId;
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
		tileBtn.appendChild(
			ui.methodTile({
				type: isCustomId(id) ? 'crypto' : id,
				size: 56,
				checked: isFilled(id),
				selected: isSelected,
				letter: tileLetter(id),
				preferred: state.preferred === id,
			}),
		);
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
			// Not renderPopover(): this can fire mid-fill, as focus moves to a
			// sibling field the caller is about to fill in too (Playwright's
			// fill() does this; so does a user tabbing between fields) —
			// rebuilding the whole popover here would replace that sibling
			// field out from under whoever's about to type into it. Only the
			// bits that depend on "is this filled now" get touched instead.
			refreshFilledDependents();
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

	function buildCustomFields(id) {
		const wrap = document.createDocumentFragment();
		const entry = findCustom(id);

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
			// See buildMainField's blur handler for why this isn't renderPopover().
			refreshFilledDependents();
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
			// See buildMainField's blur handler for why this isn't renderPopover().
			refreshFilledDependents();
		});
		refreshConfirm();
		wrap.appendChild(valueField.wrap);

		const removeBtn = ui.button({
			variant: 'ghost',
			size: 'sm',
			iconName: 'trash',
			text: t(lang, 'editor.removeMethod'),
			onClick: () => {
				state.custom = state.custom.filter((e) => e.id !== id);
				state.order = state.order.filter((orderId) => orderId !== id);
				if (state.preferred === id) state.preferred = null;
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

	/** The "preferred" toggle + (when there's something to reorder against) the
	 * move-earlier/move-later controls, shown for any filled method. */
	function buildOrderingControls(id) {
		const wrap = document.createDocumentFragment();

		const filled = filledIds();
		if (filled.length > 1) {
			const pos = filled.indexOf(id);
			const row = document.createElement('div');
			row.className = 'ds-popover-order-row';
			const earlierBtn = ui.iconButton({
				iconName: 'chevron-left',
				label: t(lang, 'editor.moveEarlier'),
				outline: true,
				onClick: () => {
					moveFilled(id, -1);
					renderPopover();
				},
			});
			earlierBtn.disabled = disabled || pos <= 0;
			const posLabel = ui.microLabel(t(lang, 'editor.position', { pos: pos + 1, total: filled.length }));
			const laterBtn = ui.iconButton({
				iconName: 'chevron-right',
				label: t(lang, 'editor.moveLater'),
				outline: true,
				onClick: () => {
					moveFilled(id, 1);
					renderPopover();
				},
			});
			laterBtn.disabled = disabled || pos >= filled.length - 1;
			row.append(earlierBtn, posLabel, laterBtn);
			wrap.appendChild(row);
		}

		const preferredToggle = ui.toggleRow({
			active: state.preferred === id,
			label: t(lang, 'editor.preferredLabel'),
			onClick: () => {
				state.preferred = state.preferred === id ? null : id;
				renderTiles();
				renderPopover();
			},
		});
		wrap.appendChild(preferredToggle);

		return wrap;
	}

	/** Slots inside the currently-open popover that depend on "is this
	 * filled now", refreshed in place after a field blurs — never a full
	 * renderPopover(), which would also replace the field inputs
	 * themselves (see buildMainField's blur handler). */
	let headBadgeSlot = null;
	let orderingSlot = null;
	function refreshFilledDependents() {
		if (!selected) return;
		const filled = isFilled(selected);
		if (headBadgeSlot) {
			headBadgeSlot.replaceChildren();
			if (filled) headBadgeSlot.appendChild(ui.microLabel(t(lang, 'editor.filledBadge'), { tone: 'accent' }));
		}
		if (orderingSlot) {
			orderingSlot.replaceChildren();
			if (filled) orderingSlot.appendChild(buildOrderingControls(selected));
		}
	}

	function renderPopover() {
		popoverWrap.replaceChildren();
		headBadgeSlot = null;
		orderingSlot = null;
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
		headBadgeSlot = document.createElement('span');
		head.appendChild(headBadgeSlot);
		pop.appendChild(head);

		if (isCustomId(selected)) {
			pop.appendChild(buildCustomFields(selected));
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

		orderingSlot = document.createElement('div');
		pop.appendChild(orderingSlot);
		refreshFilledDependents();

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
			return state.order.map((id) => {
				const preferred = state.preferred === id || undefined;
				if (ORDER.includes(id)) {
					return {
						method: id,
						value: state.values[id],
						holder: id === 'iban' ? state.holder : undefined,
						preferred,
					};
				}
				const entry = findCustom(id);
				return { method: 'crypto', value: entry?.value ?? '', cryptoType: entry?.label ?? '', preferred };
			});
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
