import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectLang, t } from '../src/lib/i18n.mjs';

test('t: looks up a known key for each language', () => {
	assert.equal(t('it', 'editor.h1Prefix'), 'I tuoi metodi di pagamento, sempre ');
	assert.equal(t('en', 'editor.h1Prefix'), 'Share your payment methods, ');
});

test('t: substitutes {{placeholder}} vars', () => {
	assert.equal(t('it', 'myPages.rowFallbackName', { id: 'ab12' }), 'Pagina …ab12');
	assert.equal(t('en', 'myPages.rowFallbackName', { id: 'ab12' }), 'Page …ab12');
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
