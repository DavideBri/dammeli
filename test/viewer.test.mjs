import { test } from 'node:test';
import assert from 'node:assert/strict';

import { methodLabel, buildDirectLink } from '../src/scripts/viewer.mjs';

test('methodLabel: known types get a proper display name', () => {
	assert.equal(methodLabel('satispay'), 'Satispay');
	assert.equal(methodLabel('revolut'), 'Revolut');
	assert.equal(methodLabel('paypal'), 'PayPal');
	assert.equal(methodLabel('iban'), 'IBAN');
	assert.equal(methodLabel('bitcoin'), 'Bitcoin');
});

test('methodLabel: an unknown type falls back to itself rather than crashing', () => {
	assert.equal(methodLabel('lightning'), 'lightning');
});

test('buildDirectLink: paypal.me, well-established format', () => {
	assert.equal(buildDirectLink({ type: 'paypal', value: 'brunoxyz' }), 'https://paypal.me/brunoxyz');
});

test('buildDirectLink: bitcoin URI (BIP21)', () => {
	assert.equal(buildDirectLink({ type: 'bitcoin', value: 'bc1qxyz' }), 'bitcoin:bc1qxyz');
});

test('buildDirectLink: revolut.me, Revolut\'s own public profile-link format', () => {
	assert.equal(buildDirectLink({ type: 'revolut', value: 'brunoxyz' }), 'https://revolut.me/brunoxyz');
});

test('buildDirectLink: a leading @ on a revolut tag is stripped, same as paypal expects a bare handle', () => {
	assert.equal(buildDirectLink({ type: 'revolut', value: '@brunoxyz' }), 'https://revolut.me/brunoxyz');
});

test('buildDirectLink: no confident link format for satispay/iban', () => {
	assert.equal(buildDirectLink({ type: 'satispay', value: 'brunoxyz' }), null);
	assert.equal(buildDirectLink({ type: 'iban', value: 'IT60X0542811101000000123456' }), null);
});
