// The editor screen: title field + the tile-grid method picker (tap a
// tile, a popover opens below with that method's field(s)). Owns all
// editor form state itself — src/scripts/create-flow.mjs just reads it
// back out via getTitle()/getCards() at submit time. No network calls,
// no persistence: this file only manages the form.

import { normalizeHandleFromUrl, normalizeIban, confirmationSuffix } from '../lib/normalize.mjs';
import { t } from '../lib/i18n.mjs';
import * as ui from './ui.mjs';

const ORDER = ['iban', 'paypal', 'revolut', 'satispay'];
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
	const createBtn = root.querySelector('[data-create]');

	root.querySelector('[data-editor-h1]').textContent = t(lang, 'editor.h1');
	const subtitleEl = root.querySelector('[data-editor-subtitle]');
	const introHowItWorksLink = document.createElement('a');
	introHowItWorksLink.href = '/how-it-works';
	introHowItWorksLink.className = 'ds-text-accent';
	introHowItWorksLink.textContent = t(lang, 'viewer.howItWorks');
	subtitleEl.replaceChildren(`${t(lang, 'editor.subtitle')} `, introHowItWorksLink);
	root.querySelector('[data-editor-methods-heading]').textContent = t(lang, 'editor.methodsHeading');
	const footnoteEl = root.querySelector('[data-editor-footnote]');
	const privacyLink = document.createElement('a');
	privacyLink.href = '/privacy';
	privacyLink.className = 'ds-text-accent';
	privacyLink.textContent = t(lang, 'privacy.title');
	footnoteEl.replaceChildren(privacyLink);

	const titleField = ui.field({
		id: 'page-title',
		label: t(lang, 'editor.titleFieldLabel'),
		hint: t(lang, 'editor.titleFieldHint'),
		hintToggleLabel: t(lang, 'editor.hintToggle'),
		placeholder: t(lang, 'editor.titleFieldPlaceholder'),
		value: state.title,
		clearLabel: t(lang, 'editor.clearField'),
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
	function updateCreateButton() {
		createBtn.disabled = disabled || filledCount() === 0;
	}

	/** Removes `id` from wherever it sits in `order` and reinserts it at
	 * `targetId`'s current index — a normal "drop it here" move, not a
	 * pairwise swap. */
	function moveIdTo(id, targetId) {
		if (id === targetId) return;
		const from = state.order.indexOf(id);
		if (from < 0) return;
		state.order.splice(from, 1);
		const to = state.order.indexOf(targetId);
		state.order.splice(to < 0 ? state.order.length : to, 0, id);
	}
	function moveIdToFront(id) {
		const from = state.order.indexOf(id);
		if (from <= 0) return;
		state.order.splice(from, 1);
		state.order.unshift(id);
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
		updateCreateButton();
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
		tileBtn.dataset.methodId = id;
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
			addBtn.dataset.addTile = '';
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
			clearLabel: t(lang, 'editor.clearField'),
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
			updateCreateButton();
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
			hintToggleLabel: t(lang, 'editor.hintToggle'),
			placeholder: t(lang, 'methods.iban.holderPlaceholder'),
			value: state.holder,
			clearLabel: t(lang, 'editor.clearField'),
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
			clearLabel: t(lang, 'editor.clearField'),
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
			clearLabel: t(lang, 'editor.clearField'),
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
			updateCreateButton();
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
				updateCreateButton();
			},
		});
		removeBtn.disabled = disabled;
		wrap.appendChild(removeBtn);

		return wrap;
	}

	/** The "preferred" star — top-right of the popover (positioned via CSS),
	 * shown once the method has a value. Turning it on moves the method to
	 * the front of the grid; turning it off just removes the star. */
	function buildPreferredStar(id) {
		return ui.starToggle({
			active: state.preferred === id,
			label: t(lang, 'editor.preferredLabel'),
			hint: t(lang, 'editor.preferredHint'),
			onClick: () => {
				if (state.preferred === id) {
					state.preferred = null;
				} else {
					state.preferred = id;
					moveIdToFront(id);
				}
				renderTiles();
				renderPopover();
			},
		});
	}

	/** Slot inside the currently-open popover that depends on "is this
	 * filled now", refreshed in place after a field blurs — never a full
	 * renderPopover(), which would also replace the field inputs
	 * themselves (see buildMainField's blur handler). */
	let preferredSlot = null;
	function refreshFilledDependents() {
		if (!selected) return;
		if (preferredSlot) {
			preferredSlot.replaceChildren();
			if (isFilled(selected)) preferredSlot.appendChild(buildPreferredStar(selected));
		}
	}

	function renderPopover() {
		popoverWrap.replaceChildren();
		preferredSlot = null;
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

		preferredSlot = document.createElement('div');
		pop.appendChild(preferredSlot);
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

	/** Moves the existing tile nodes to match `state.order` — never
	 * recreates them, so an in-progress drag's node identity (and pointer
	 * capture) survives every reorder step. */
	function reflowTileOrder() {
		const addBtn = tilesEl.querySelector('[data-add-tile]');
		for (const id of state.order) {
			const node = tilesEl.querySelector(`[data-method-id="${id}"]`);
			if (node) tilesEl.appendChild(node);
		}
		if (addBtn) tilesEl.appendChild(addBtn);
	}

	/**
	 * Press-and-hold (or drag past a small threshold) a tile to reorder it
	 * — a quick tap still opens its popover as usual. Pointer Events cover
	 * mouse and touch alike; the dragged tile itself never visually
	 * follows the pointer (that needs an inline transform, which CSP
	 * forbids — see PLAN.md's "no inline style=""" note). Instead, other
	 * tiles swap out from under it live as the pointer crosses them,
	 * exactly like a real card being pushed through a stack.
	 */
	function initDragReorder() {
		const LONG_PRESS_MS = 200;
		const MOVE_THRESHOLD_PX = 8;
		let drag = null;

		function activate(id) {
			if (!drag || drag.id !== id || drag.active) return;
			drag.active = true;
			clearTimeout(drag.timer);
			// Captured only once a drag is actually happening, not on every
			// pointerdown: capturing on the container confuses the browser's
			// own click synthesis for a plain, un-dragged tap.
			tilesEl.setPointerCapture(drag.pointerId);
			tilesEl.querySelector(`[data-method-id="${id}"]`)?.classList.add('ds-method-grid__btn--dragging');
		}

		function endDrag() {
			if (!drag) return;
			clearTimeout(drag.timer);
			// No explicit "was this a drag, suppress the click" bookkeeping
			// needed: browsers don't fire a click at all after the pointer
			// moved this much between down and up, on mouse or touch alike
			// — the popover only (re)opens for an actual tap.
			if (drag.active) {
				tilesEl.querySelector(`[data-method-id="${drag.id}"]`)?.classList.remove('ds-method-grid__btn--dragging');
			}
			drag = null;
		}

		tilesEl.addEventListener('pointerdown', (event) => {
			if (disabled || drag) return;
			const tileBtn = event.target.closest('.ds-method-grid__btn[data-method-id]');
			if (!tileBtn) return;
			const id = tileBtn.dataset.methodId;
			drag = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, active: false, timer: null };
			drag.timer = setTimeout(() => activate(id), LONG_PRESS_MS);
		});

		tilesEl.addEventListener('pointermove', (event) => {
			if (!drag || drag.pointerId !== event.pointerId) return;
			if (!drag.active) {
				const dx = event.clientX - drag.startX;
				const dy = event.clientY - drag.startY;
				if (Math.hypot(dx, dy) > MOVE_THRESHOLD_PX) activate(drag.id);
				if (!drag.active) return;
			}
			const overTile = document.elementFromPoint(event.clientX, event.clientY)?.closest('.ds-method-grid__btn[data-method-id]');
			if (overTile && overTile.dataset.methodId !== drag.id) {
				moveIdTo(drag.id, overTile.dataset.methodId);
				reflowTileOrder();
			}
		});

		const onPointerEnd = (event) => {
			if (!drag || drag.pointerId !== event.pointerId) return;
			endDrag();
		};
		tilesEl.addEventListener('pointerup', onPointerEnd);
		tilesEl.addEventListener('pointercancel', onPointerEnd);
	}
	initDragReorder();

	renderTiles();
	renderPopover();
	updateCreateButton();

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
