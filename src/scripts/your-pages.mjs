// "Your pages" section shown on the home screen when returning visits
// have something saved (PLAN.md section 8). Not a screen that blocks the
// editor — it's hidden entirely when there's nothing to show, and the
// editor stays the immediately usable default either way ("the home page
// is already the editor").

import { createLocalPagesStore } from '../lib/local-pages.mjs';
import * as api from '../lib/api.mjs';

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

function wireCopy(button, text) {
	button.addEventListener('click', async () => {
		await navigator.clipboard.writeText(text);
		const original = button.textContent;
		button.textContent = 'Copied!';
		setTimeout(() => {
			button.textContent = original;
		}, 1500);
	});
}

function renderRow(page, onDeleted) {
	const row = document.createElement('li');
	row.className =
		'flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white p-3';

	const link = document.createElement('a');
	link.href = page.editLink;
	link.className = 'truncate font-mono text-sm text-neutral-900 underline underline-offset-2';
	link.textContent = `Page …${shortId(page.id)}`;
	row.appendChild(link);

	const actions = document.createElement('div');
	actions.className = 'flex shrink-0 gap-2';

	const copyButton = document.createElement('button');
	copyButton.type = 'button';
	copyButton.className = 'rounded-md border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100';
	copyButton.textContent = 'Copy link';
	wireCopy(copyButton, page.editLink);
	actions.appendChild(copyButton);

	const deleteButton = document.createElement('button');
	deleteButton.type = 'button';
	deleteButton.className =
		'rounded-md border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50';
	deleteButton.textContent = 'Delete';
	deleteButton.addEventListener('click', async () => {
		if (!confirm('Delete this page? This cannot be undone.')) return;
		deleteButton.disabled = true;
		deleteButton.textContent = 'Deleting…';
		try {
			const { idHex, wtHex } = await deriveWriteAuth(page.editLink);
			await api.deletePage(idHex, { wt: wtHex });
			onDeleted(page.id);
		} catch {
			deleteButton.disabled = false;
			deleteButton.textContent = 'Delete';
			alert("Couldn't delete this page right now. Please try again.");
		}
	});
	actions.appendChild(deleteButton);

	row.appendChild(actions);
	return row;
}

export function initYourPages(root, { store = createLocalPagesStore() } = {}) {
	const list = root.querySelector('[data-your-pages-list]');

	function render() {
		const pages = store.list();
		if (pages.length === 0) {
			root.hidden = true;
			return;
		}
		root.hidden = false;
		list.replaceChildren(
			...pages.map((page) =>
				renderRow(page, (id) => {
					store.remove(id);
					render();
				}),
			),
		);
	}

	render();
}
