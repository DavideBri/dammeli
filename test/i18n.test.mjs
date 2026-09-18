import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { detectLang, LANGS, t } from '../src/lib/i18n.mjs';

test('t: looks up a known key for each language', () => {
	assert.equal(t('it', 'editor.h1Prefix'), 'I tuoi metodi di pagamento, sempre ');
	assert.equal(t('en', 'editor.h1Prefix'), 'Share your payment methods, ');
	assert.equal(t('es', 'editor.h1Prefix'), 'Tus métodos de pago, siempre ');
});

test('t: substitutes {{placeholder}} vars', () => {
	assert.equal(t('it', 'created.whatsappText', { link: 'https://damme.li/#1rabc' }), 'Ecco la mia pagina dammeli per pagarmi: https://damme.li/#1rabc');
	assert.equal(t('en', 'created.whatsappText', { link: 'https://damme.li/#1rabc' }), "Here's my dammeli page to pay me: https://damme.li/#1rabc");
	assert.equal(t('es', 'created.whatsappText', { link: 'https://damme.li/#1rabc' }), 'Aquí tienes mi página de dammeli para pagarme: https://damme.li/#1rabc');
});

test('every dictionary has exactly the same set of keys — no missing/stray translations', () => {
	const src = readFileSync(fileURLToPath(new URL('../src/lib/i18n.mjs', import.meta.url)), 'utf8');
	const langStarts = [...src.matchAll(/^\t(it|en|es): \{/gm)];
	const keySetFor = (lang) => {
		const start = langStarts.find((m) => m[1] === lang).index;
		const idx = langStarts.findIndex((m) => m[1] === lang);
		const end = idx + 1 < langStarts.length ? langStarts[idx + 1].index : src.indexOf('\n};', start);
		return new Set([...src.slice(start, end).matchAll(/^\t\t'([\w.]+)':/gm)].map((m) => m[1]));
	};
	const [first, ...rest] = LANGS.map(keySetFor);
	for (const [i, keys] of rest.entries()) {
		const lang = LANGS[i + 1];
		assert.deepEqual([...keys].sort(), [...first].sort(), `${lang}'s keys must match ${LANGS[0]}'s`);
	}
});

test('t: an unknown key falls back to the key itself rather than crashing', () => {
	assert.equal(t('it', 'nonexistent.key'), 'nonexistent.key');
});

test('detectLang: reads the browser language list', () => {
	assert.equal(detectLang({ languages: ['en-US', 'en'] }), 'en');
	assert.equal(detectLang({ languages: ['it-IT', 'it'] }), 'it');
	assert.equal(detectLang({ languages: ['es-ES', 'es'] }), 'es');
});

test('detectLang: an unrecognized browser language falls back to English', () => {
	assert.equal(detectLang({ languages: ['fr-FR', 'de-DE'] }), 'en');
});

test('detectLang: no navigator.languages at all -> falls back to navigator.language, then English', () => {
	assert.equal(detectLang({ language: 'it-CH' }), 'it');
	assert.equal(detectLang({}), 'en');
});

test('detectLang: with several recognized languages in the list, the browser\'s own preference order wins', () => {
	assert.equal(detectLang({ languages: ['it-IT', 'en-US'] }), 'it');
	assert.equal(detectLang({ languages: ['en-US', 'it-IT'] }), 'en');
	assert.equal(detectLang({ languages: ['es-MX', 'en-US', 'it-IT'] }), 'es');
});
