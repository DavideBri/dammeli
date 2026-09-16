import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getSavedTheme, setSavedTheme, applyTheme, effectiveTheme } from '../src/lib/theme.mjs';

/** Minimal Storage-like fake, enough for localStorage.getItem/setItem. */
function fakeStorage() {
	const map = new Map();
	return {
		getItem: (key) => (map.has(key) ? map.get(key) : null),
		setItem: (key, value) => {
			map.set(key, value);
		},
		removeItem: (key) => {
			map.delete(key);
		},
	};
}

/** Minimal Element-like fake, enough for getAttribute/setAttribute/removeAttribute. */
function fakeRoot() {
	const attrs = new Map();
	return {
		getAttribute: (name) => (attrs.has(name) ? attrs.get(name) : null),
		setAttribute: (name, value) => {
			attrs.set(name, value);
		},
		removeAttribute: (name) => {
			attrs.delete(name);
		},
	};
}

test('getSavedTheme: nothing stored -> null', () => {
	assert.equal(getSavedTheme(fakeStorage()), null);
});

test('setSavedTheme then getSavedTheme: round trips', () => {
	const storage = fakeStorage();
	setSavedTheme('dark', storage);
	assert.equal(getSavedTheme(storage), 'dark');
});

test('setSavedTheme(null): clears a previously saved override', () => {
	const storage = fakeStorage();
	setSavedTheme('dark', storage);
	setSavedTheme(null, storage);
	assert.equal(getSavedTheme(storage), null);
});

test('getSavedTheme: a garbage stored value is ignored, not returned', () => {
	const storage = fakeStorage();
	storage.setItem('dammeli:theme', 'purple');
	assert.equal(getSavedTheme(storage), null);
});

test('applyTheme: sets data-theme, or removes it when given null', () => {
	const root = fakeRoot();
	applyTheme('dark', root);
	assert.equal(root.getAttribute('data-theme'), 'dark');
	applyTheme(null, root);
	assert.equal(root.getAttribute('data-theme'), null);
});

test('effectiveTheme: an explicit data-theme wins over the system default', () => {
	const root = fakeRoot();
	root.setAttribute('data-theme', 'dark');
	assert.equal(effectiveTheme(root), 'dark');
});

test('effectiveTheme: no override -> falls back to prefers-color-scheme', () => {
	const root = fakeRoot();
	const originalMatchMedia = globalThis.matchMedia;
	globalThis.matchMedia = () => ({ matches: true });
	try {
		assert.equal(effectiveTheme(root), 'dark');
	} finally {
		globalThis.matchMedia = originalMatchMedia;
	}
});
