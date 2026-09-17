// Light/dark theme override, on top of the design system's own
// `prefers-color-scheme` default (src/styles/ds/colors.css). Per-device,
// same reasoning as the language override: no account to sync it to.

const STORAGE_KEY = 'dammeli:theme';

/** The saved override ('light'|'dark'), or null to follow system. */
export function getSavedTheme(storage = globalThis.localStorage) {
	try {
		const value = storage.getItem(STORAGE_KEY);
		return value === 'light' || value === 'dark' ? value : null;
	} catch {
		return null;
	}
}

/** @param {'light'|'dark'|null} theme null clears the override. */
export function setSavedTheme(theme, storage = globalThis.localStorage) {
	try {
		if (theme) storage.setItem(STORAGE_KEY, theme);
		else storage.removeItem(STORAGE_KEY);
	} catch {
		// Private browsing / quota: the toggle just won't stick, no crash.
	}
}

export function applyTheme(theme, root = globalThis.document?.documentElement) {
	if (!root) return;
	if (theme) root.setAttribute('data-theme', theme);
	else root.removeAttribute('data-theme');
}

/** What's actually showing right now: the override, or the system default. */
export function effectiveTheme(root = globalThis.document?.documentElement) {
	const explicit = root?.getAttribute('data-theme');
	if (explicit === 'light' || explicit === 'dark') return explicit;
	return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
