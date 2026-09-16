// "Your pages" persistence (PLAN.md section 8): the full edit link,
// fragment included, saved in localStorage. The fragment never went to
// the server, so saving it locally doesn't betray the model — it's the
// only way to return to a page without a login system.
//
// Storage is injected (defaults to the real localStorage) so this stays
// unit-testable without a browser.

const STORAGE_KEY = 'dammeli:pages';

function readAll(storage) {
	try {
		const raw = storage.getItem(STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		// Corrupt data or storage unavailable (private browsing, quota):
		// fail soft, treat it as empty rather than breaking the app.
		return [];
	}
}

function writeAll(storage, pages) {
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(pages));
	} catch {
		// Same as above: the create flow still works, the user just won't
		// see this page in "your pages" next time and needs the link they
		// were shown.
	}
}

export function createLocalPagesStore(storage = globalThis.localStorage) {
	return {
		/** @param {{id: string, editLink: string}} page */
		save(page) {
			const pages = readAll(storage).filter((p) => p.id !== page.id);
			pages.push(page);
			writeAll(storage, pages);
		},
		list() {
			return readAll(storage);
		},
		/** @param {string} id */
		remove(id) {
			writeAll(
				storage,
				readAll(storage).filter((p) => p.id !== id),
			);
		},
	};
}
