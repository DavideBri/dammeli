import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CONTACT_BASED_METHODS, isContactBased, APP_SCHEMES } from '../src/lib/contact-methods.mjs';

test('isContactBased: true for every listed method', () => {
	for (const type of CONTACT_BASED_METHODS) {
		assert.equal(isContactBased(type), true);
	}
});

test('isContactBased: false for methods with a real handle/link', () => {
	assert.equal(isContactBased('paypal'), false);
	assert.equal(isContactBased('revolut'), false);
	assert.equal(isContactBased('iban'), false);
	assert.equal(isContactBased('bitcoin'), false);
});

test('APP_SCHEMES only has an entry for a method that is actually contact-based', () => {
	for (const type of Object.keys(APP_SCHEMES)) {
		assert.ok(CONTACT_BASED_METHODS.includes(type), `${type} has an app scheme but isn't in CONTACT_BASED_METHODS`);
	}
});

test('Satispay is contact-based with a known iOS scheme', () => {
	assert.equal(isContactBased('satispay'), true);
	assert.equal(APP_SCHEMES.satispay, 'satispay://');
});
