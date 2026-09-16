import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createLocalPagesStore } from '../src/lib/local-pages.mjs';

/** Minimal Storage-like fake, enough for localStorage.getItem/setItem. */
function fakeStorage() {
	const map = new Map();
	return {
		getItem: (key) => (map.has(key) ? map.get(key) : null),
		setItem: (key, value) => {
			map.set(key, value);
		},
	};
}

test('save then list: round trips', () => {
	const store = createLocalPagesStore(fakeStorage());
	store.save({ id: 'aa', editLink: 'https://damme.li/#1mAAAA' });
	store.save({ id: 'bb', editLink: 'https://damme.li/#1mBBBB' });

	assert.deepEqual(store.list(), [
		{ id: 'aa', editLink: 'https://damme.li/#1mAAAA' },
		{ id: 'bb', editLink: 'https://damme.li/#1mBBBB' },
	]);
});

test('save with an existing id replaces it instead of duplicating', () => {
	const store = createLocalPagesStore(fakeStorage());
	store.save({ id: 'aa', editLink: 'https://damme.li/#1mOLD' });
	store.save({ id: 'aa', editLink: 'https://damme.li/#1mNEW' });

	assert.deepEqual(store.list(), [{ id: 'aa', editLink: 'https://damme.li/#1mNEW' }]);
});

test('remove: drops just that id', () => {
	const store = createLocalPagesStore(fakeStorage());
	store.save({ id: 'aa', editLink: 'https://damme.li/#1mAAAA' });
	store.save({ id: 'bb', editLink: 'https://damme.li/#1mBBBB' });
	store.remove('aa');

	assert.deepEqual(store.list(), [{ id: 'bb', editLink: 'https://damme.li/#1mBBBB' }]);
});

test('list on an empty store returns an empty array', () => {
	const store = createLocalPagesStore(fakeStorage());
	assert.deepEqual(store.list(), []);
});

test('corrupt stored JSON is treated as empty rather than throwing', () => {
	const storage = fakeStorage();
	storage.setItem('dammeli:pages', 'not json');
	const store = createLocalPagesStore(storage);

	assert.deepEqual(store.list(), []);
});

test('a storage that throws on write does not break save()', () => {
	const storage = {
		getItem: () => null,
		setItem: () => {
			throw new Error('quota exceeded');
		},
	};
	const store = createLocalPagesStore(storage);
	assert.doesNotThrow(() => store.save({ id: 'aa', editLink: 'https://damme.li/#1mAAAA' }));
});
