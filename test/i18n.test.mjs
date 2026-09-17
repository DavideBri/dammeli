import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectLang, t } from '../src/lib/i18n.mjs';

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

test('detectLang: reads the browser language list', () => {
	assert.equal(detectLang({ languages: ['en-US', 'en'] }), 'en');
	assert.equal(detectLang({ languages: ['it-IT', 'it'] }), 'it');
});

test('detectLang: an unrecognized browser language falls back to English', () => {
	assert.equal(detectLang({ languages: ['fr-FR', 'de-DE'] }), 'en');
});

test('detectLang: no navigator.languages at all -> falls back to navigator.language, then English', () => {
	assert.equal(detectLang({ language: 'it-CH' }), 'it');
	assert.equal(detectLang({}), 'en');
});

test('detectLang: with both it and en in the list, the browser\'s own preference order wins', () => {
	assert.equal(detectLang({ languages: ['it-IT', 'en-US'] }), 'it');
	assert.equal(detectLang({ languages: ['en-US', 'it-IT'] }), 'en');
});
