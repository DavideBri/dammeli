import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildVCard, vcardFilename } from '../src/lib/vcard.mjs';

test('buildVCard: produces a minimal, valid vCard 3.0', () => {
	const vcard = buildVCard({ name: 'Bruno Rossi', phone: '+39 340 118 4417' });
	assert.equal(
		vcard,
		'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Bruno Rossi\r\nTEL;TYPE=CELL:+39 340 118 4417\r\nEND:VCARD\r\n',
	);
});

test('buildVCard: escapes commas, semicolons, and backslashes in values', () => {
	const vcard = buildVCard({ name: 'Rossi; Bruno, il "Bru"', phone: '+39' });
	assert.match(vcard, /FN:Rossi\\; Bruno\\, il "Bru"/);
});

test('buildVCard: escapes newlines', () => {
	const vcard = buildVCard({ name: 'Bruno\nRossi', phone: '+39' });
	assert.match(vcard, /FN:Bruno\\nRossi/);
});

test('vcardFilename: sanitizes the name into a safe filename', () => {
	assert.equal(vcardFilename('Bruno Rossi'), 'Bruno-Rossi.vcf');
});

test('vcardFilename: collapses punctuation and trims leading/trailing dashes', () => {
	assert.equal(vcardFilename('  Bruno, Rossi!! '), 'Bruno-Rossi.vcf');
});

test('vcardFilename: an empty or punctuation-only name falls back to "contact"', () => {
	assert.equal(vcardFilename(''), 'contact.vcf');
	assert.equal(vcardFilename(undefined), 'contact.vcf');
	assert.equal(vcardFilename('!!!'), 'contact.vcf');
});

test('vcardFilename: non-Latin names are kept, not stripped', () => {
	assert.equal(vcardFilename('三郎'), '三郎.vcf');
});
