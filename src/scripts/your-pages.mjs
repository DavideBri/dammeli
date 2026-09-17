// "Your pages" screen: the list of pages this device has created (PLAN.md
// section 8). Reachable from the editor's bookmark icon and from the
// "Created" screen's ghost button — never the immediately usable default,
// which stays the editor ("the home page is already the editor").

import { createLocalPagesStore } from '../lib/local-pages.mjs';
import * as api from '../lib/api.mjs';
import { t } from '../lib/i18n.mjs';
import { showScreen, navigateHard } from './screens.mjs';
import * as ui from './ui.mjs';

function shortId(id) {
	return id.slice(0, 8);
}

async function deriveWriteAuth(editLink) {
	// @vite-ignore: see src/scripts/create-flow.mjs for why.
	const dammeli = await import(/* @vite-ignore */ '/crypto.js');
	const loaded = await dammeli.loadFromFragment(new URL(editLink).hash);
	if (loaded.type !== 'm') {
		throw new Error('not an edit link');
	}
	return { idHex: dammeli.toHex(loaded.id), wtHex: dammeli.toHex(loaded.writeToken) };
}

function renderRow(page, lang, onDeleted) {
	const row = document.createElement('li');
	row.className = 'ds-page-row';

	const main = document.createElement('a');
	main.className = 'ds-page-row__main';
	main.href = page.editLink;
	main.addEventListener('click', (event) => {
		// A plain click on this same-path-different-hash link would never
		// reload (see navigateHard's doc comment) and boot() would never
		// re-run. Modified clicks (ctrl/cmd/middle/shift) are left alone so
		// "open in a new tab" still works — a genuinely new tab always does
		// a real load, no matter the hash.
		if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		navigateHard(page.editLink);
	});
	const name = document.createElement('span');
	name.className = 'ds-page-row__name';
	name.textContent = page.title || t(lang, 'myPages.rowFallbackName', { id: shortId(page.id) });
	const url = document.createElement('span');
	url.className = 'ds-page-row__url';
	url.textContent = page.editLink;
	main.append(name, url);
	row.appendChild(main);

	const actions = document.createElement('div');
	actions.className = 'ds-page-row__actions';

	const copyBtn = document.createElement('button');
	copyBtn.type = 'button';
	copyBtn.className = 'ds-page-row__action';
	copyBtn.setAttribute('aria-label', t(lang, 'created.copyEditLink'));
	copyBtn.title = t(lang, 'created.copyEditLink');
	copyBtn.appendChild(ui.icon('copy', { size: 18, strokeWidth: 2 }));
	copyBtn.addEventListener('click', async (event) => {
		event.preventDefault();
		await navigator.clipboard.writeText(page.editLink);
		const original = copyBtn.innerHTML;
		copyBtn.replaceChildren(ui.icon('check', { size: 18, strokeWidth: 2 }));
		setTimeout(() => {
			copyBtn.innerHTML = original;
		}, 1500);
	});
	actions.appendChild(copyBtn);

	const deleteBtn = document.createElement('button');
	deleteBtn.type = 'button';
	deleteBtn.className = 'ds-page-row__action';
	deleteBtn.setAttribute('aria-label', t(lang, 'common.delete'));
	deleteBtn.title = t(lang, 'common.delete');
	deleteBtn.appendChild(ui.icon('trash', { size: 18, strokeWidth: 2 }));
	deleteBtn.addEventListener('click', async (event) => {
		event.preventDefault();
		if (!confirm(t(lang, 'common.deleteConfirm'))) return;
		deleteBtn.disabled = true;
		try {
			const { idHex, wtHex } = await deriveWriteAuth(page.editLink);
			await api.deletePage(idHex, { wt: wtHex });
			onDeleted(page.id);
		} catch {
			deleteBtn.disabled = false;
			alert(t(lang, 'common.deleteError'));
		}
	});
	actions.appendChild(deleteBtn);

	row.appendChild(actions);
	return row;
}

export function initYourPages(root, lang, { store = createLocalPagesStore(), onBack, onNew } = {}) {
	const list = root.querySelector('[data-your-pages-list]');

	const { header } = ui.topBar({
		title: t(lang, 'myPages.title'),
		onBack,
		backLabel: t(lang, 'nav.back'),
		right: [ui.iconButton({ iconName: 'plus', label: t(lang, 'nav.newPage'), onClick: onNew })],
	});
	root.querySelector('[data-topbar-your-pages]').replaceChildren(header);
	root.querySelector('[data-your-pages-notice]').replaceChildren(
		ui.notice({ iconName: 'info', body: t(lang, 'myPages.notice') }),
	);

	function render() {
		const pages = store.list();
		if (pages.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'ds-page-row-empty';
			const iconWrap = document.createElement('span');
			iconWrap.className = 'ds-page-row-empty__icon';
			iconWrap.appendChild(ui.icon('bookmark', { size: 28 }));
			empty.appendChild(iconWrap);
			const text = document.createElement('p');
			text.className = 'ds-page-row-empty__text';
			text.textContent = t(lang, 'myPages.emptyText');
			empty.appendChild(text);
			empty.appendChild(ui.button({ variant: 'secondary', text: t(lang, 'myPages.emptyCta'), onClick: onNew }));
			list.replaceChildren();
			list.appendChild(empty);
			return;
		}
		list.replaceChildren(
			...pages.map((page) =>
				renderRow(page, lang, (id) => {
					store.remove(id);
					render();
				}),
			),
		);
	}

	render();
	return { showAndRefresh: () => { render(); showScreen('your-pages'); } };
}
