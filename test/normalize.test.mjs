import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeHandleFromUrl, normalizeIban, confirmationSuffix } from '../src/lib/normalize.mjs';

const PAYPAL_DOMAINS = ['paypal.me', 'paypal.com'];

test('normalizeHandleFromUrl: strips the PLAN.md worked example', () => {
	assert.equal(
		normalizeHandleFromUrl('https://www.paypal.me/brunoxyz?locale=it', PAYPAL_DOMAINS),
		'brunoxyz',
	);
});

test('normalizeHandleFromUrl: works without a protocol', () => {
	assert.equal(normalizeHandleFromUrl('paypal.me/brunoxyz', PAYPAL_DOMAINS), 'brunoxyz');
});

test('normalizeHandleFromUrl: works on paypal.com/paypalme/<handle> too', () => {
	assert.equal(
		normalizeHandleFromUrl('https://www.paypal.com/paypalme/brunoxyz', PAYPAL_DOMAINS),
		'brunoxyz',
	);
});

test('normalizeHandleFromUrl: a bare handle passes through unchanged', () => {
	assert.equal(normalizeHandleFromUrl('brunoxyz', PAYPAL_DOMAINS), 'brunoxyz');
	assert.equal(normalizeHandleFromUrl('  brunoxyz  ', PAYPAL_DOMAINS), 'brunoxyz');
});

test('normalizeHandleFromUrl: strips a leading @', () => {
	assert.equal(normalizeHandleFromUrl('@brunoxyz', PAYPAL_DOMAINS), 'brunoxyz');
});

test('normalizeHandleFromUrl: a URL for an unrelated domain is left untouched', () => {
	assert.equal(
		normalizeHandleFromUrl('https://instagram.com/brunoxyz', PAYPAL_DOMAINS),
		'https://instagram.com/brunoxyz',
	);
});

test('normalizeHandleFromUrl: empty input stays empty', () => {
	assert.equal(normalizeHandleFromUrl('', PAYPAL_DOMAINS), '');
	assert.equal(normalizeHandleFromUrl(undefined, PAYPAL_DOMAINS), '');
});

test('normalizeIban: strips spaces and uppercases', () => {
	assert.equal(
		normalizeIban('it60 x054 2811 1010 0000 0123 456'),
		'IT60X0542811101000000123456',
	);
});

test('normalizeIban: already-clean input is unchanged', () => {
	assert.equal(normalizeIban('IT60X0542811101000000123456'), 'IT60X0542811101000000123456');
});

test('confirmationSuffix: returns the last few characters', () => {
	assert.equal(confirmationSuffix('brunoxyz'), 'oxyz');
	assert.equal(confirmationSuffix('IT60X0542811101000000123456'), '3456');
});

test('confirmationSuffix: short values are returned whole, not padded', () => {
	assert.equal(confirmationSuffix('ab'), 'ab');
	assert.equal(confirmationSuffix(''), '');
});
