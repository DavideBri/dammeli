// "Your pages": the list of pages this device has created (PLAN.md
// section 8), as a bottom sheet over whichever screen is already showing
// (editor or "created") rather than a screen of its own — reachable from
// the editor's topbar and from the "Created" screen's topbar, dismissed
// without losing whatever was underneath. Never the immediately usable
// default, which stays the editor ("the home page is already the editor").

import { createLocalPagesStore } from '../lib/local-pages.mjs';
import * as api from '../lib/api.mjs';
import { t } from '../lib/i18n.mjs';
import { navigateHard } from './screens.mjs';
import * as ui from './ui.mjs';

/**
 * Everything derivable from a saved edit link: write-auth (to delete)
 * and the read link (to share). A write fragment carries the master, so
 * this needs no network round trip — see PLAN.md section 3.
 */
async function loadEditLink(editLink) {
	// @vite-ignore: see src/scripts/create-flow.mjs for why.
	const dammeli = await import(/* @vite-ignore */ '/crypto.js');
	const loaded = await dammeli.loadFromFragment(new URL(editLink).hash);
	if (loaded.type !== 'm') {
		throw new Error('not an edit link');
	}
	return {
		idHex: dammeli.toHex(loaded.id),
		wtHex: dammeli.toHex(loaded.writeToken),
		readLink: `${location.origin}/#${dammeli.encodeFragment('r', loaded.readKey)}`,
	};
}

function renderRow(page, lang, fallbackName, onDeleted) {
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
	name.textContent = page.title || fallbackName;
	main.appendChild(name);
	row.appendChild(main);

	// The share (read) link, not the edit link this row navigates to on
	// click — that's the one the copy button hands out. Pages saved before
	// 0.7 didn't store it, so it's derived lazily for those. Nothing in the
	// row displays it anymore, only the copy button needs the resolved value.
	const readLinkPromise = page.readLink
		? Promise.resolve(page.readLink)
		: loadEditLink(page.editLink)
				.then(({ readLink }) => readLink)
				.catch(() => null);

	const actions = document.createElement('div');
	actions.className = 'ds-page-row__actions';

	const copyBtn = document.createElement('button');
	copyBtn.type = 'button';
	copyBtn.className = 'ds-page-row__action';
	copyBtn.setAttribute('aria-label', t(lang, 'created.copyLink'));
	copyBtn.title = t(lang, 'created.copyLink');
	copyBtn.appendChild(ui.icon('copy', { size: 18, strokeWidth: 2 }));
	copyBtn.addEventListener('click', async (event) => {
		event.preventDefault();
		const link = (await readLinkPromise) ?? page.editLink;
		await navigator.clipboard.writeText(link);
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
			const { idHex, wtHex } = await loadEditLink(page.editLink);
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

/**
 * @param {HTMLElement} sheet the `.ds-sheet` element itself
 * @param {HTMLElement} backdrop its `.ds-sheet-backdrop` sibling
 */
export function initYourPages(sheet, backdrop, lang, { store = createLocalPagesStore(), onNew } = {}) {
	const list = sheet.querySelector('[data-your-pages-list]');

	function close() {
		sheet.classList.remove('ds-sheet--open');
		backdrop.classList.remove('ds-sheet-backdrop--open');
		document.body.classList.remove('ds-body-locked');
		sheet.addEventListener(
			'transitionend',
			() => {
				sheet.hidden = true;
				backdrop.hidden = true;
			},
			{ once: true },
		);
	}

	function open() {
		sheet.hidden = false;
		backdrop.hidden = false;
		// Forces the browser to register the pre-transition (slid-down) state
		// before the next line flips the class, otherwise both changes land
		// in the same frame and the slide-up never plays.
		void sheet.offsetHeight;
		sheet.classList.add('ds-sheet--open');
		backdrop.classList.add('ds-sheet-backdrop--open');
		document.body.classList.add('ds-body-locked');
	}

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !sheet.hidden) close();
	});
	backdrop.addEventListener('click', close);

	const handleNew = () => {
		close();
		onNew();
	};

	const { header } = ui.topBar({
		title: t(lang, 'myPages.title'),
		onBack: close,
		backLabel: t(lang, 'nav.back'),
		right: [ui.iconButton({ iconName: 'plus', label: t(lang, 'nav.newPage'), onClick: handleNew })],
	});
	sheet.querySelector('[data-topbar-your-pages]').replaceChildren(header);
	sheet.querySelector('[data-your-pages-notice]').replaceChildren(
		ui.notice({ iconName: 'info', body: t(lang, 'myPages.notice') }),
	);

	function render() {
		const pages = store.list();
		if (pages.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'ds-page-row-empty';
			const iconWrap = document.createElement('span');
			iconWrap.className = 'ds-page-row-empty__icon';
			iconWrap.appendChild(ui.icon('layers', { size: 28 }));
			empty.appendChild(iconWrap);
			const text = document.createElement('p');
			text.className = 'ds-page-row-empty__text';
			text.textContent = t(lang, 'myPages.emptyText');
			empty.appendChild(text);
			empty.appendChild(ui.button({ variant: 'secondary', text: t(lang, 'myPages.emptyCta'), onClick: handleNew }));
			list.replaceChildren();
			list.appendChild(empty);
			return;
		}
		// Untitled pages share one generic name, numbered from the second one
		// on — the first stays plain, since "Untitled page 1" reads odd when
		// there's nothing yet to distinguish it from.
		let untitledCount = 0;
		list.replaceChildren(
			...pages.map((page) => {
				let fallbackName = null;
				if (!page.title) {
					untitledCount += 1;
					const base = t(lang, 'myPages.untitledName');
					fallbackName = untitledCount === 1 ? base : `${base} ${untitledCount}`;
				}
				return renderRow(page, lang, fallbackName, (id) => {
					store.remove(id);
					render();
				});
			}),
		);
	}

	render();
	return { showAndRefresh: () => { render(); open(); } };
}
