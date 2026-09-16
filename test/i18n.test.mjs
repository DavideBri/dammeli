import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectLang, getSavedLang, setSavedLang, t } from '../src/lib/i18n.mjs';

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

test('t: looks up a known key for each language', () => {
	assert.equal(t('it', 'editor.h1'), 'Dammi i soldi.');
	assert.equal(t('en', 'editor.h1'), 'Gimme the money.');
});

test('t: substitutes {{placeholder}} vars', () => {
	assert.equal(t('it', 'editor.filledCount', { count: 2, total: 5 }), '2 su 5');
	assert.equal(t('en', 'editor.filledCount', { count: 2, total: 5 }), '2 of 5');
});

test('t: an unknown key falls back to the key itself rather than crashing', () => {
	assert.equal(t('it', 'nonexistent.key'), 'nonexistent.key');
});

test('getSavedLang: no override stored -> null', () => {
	assert.equal(getSavedLang(fakeStorage()), null);
});

test('setSavedLang then getSavedLang: round trips', () => {
	const storage = fakeStorage();
	setSavedLang('en', storage);
	assert.equal(getSavedLang(storage), 'en');
});

test('getSavedLang: garbage stored value is ignored, not returned', () => {
	const storage = fakeStorage();
	storage.setItem('dammeli:lang', 'fr');
	assert.equal(getSavedLang(storage), null);
});

test('detectLang: an explicit saved override always wins over the browser language', () => {
	const storage = fakeStorage();
	setSavedLang('en', storage);
	assert.equal(detectLang(storage, { languages: ['it-IT', 'it'] }), 'en');
});

test('detectLang: no override -> reads the browser language list', () => {
	assert.equal(detectLang(fakeStorage(), { languages: ['en-US', 'en'] }), 'en');
	assert.equal(detectLang(fakeStorage(), { languages: ['it-IT', 'it'] }), 'it');
});

test('detectLang: an unrecognized browser language falls back to Italian', () => {
	assert.equal(detectLang(fakeStorage(), { languages: ['fr-FR', 'de-DE'] }), 'it');
});

test('detectLang: no navigator.languages at all -> falls back to navigator.language, then Italian', () => {
	assert.equal(detectLang(fakeStorage(), { language: 'en-GB' }), 'en');
	assert.equal(detectLang(fakeStorage(), {}), 'it');
});
