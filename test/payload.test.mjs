import { test } from 'node:test';
import assert from 'node:assert/strict';

import { assemblePayload } from '../src/lib/payload.mjs';

test('assemblePayload: matches the PLAN.md section 5 example shape', () => {
	const result = assemblePayload([
		{ method: 'satispay', value: 'brunoxyz' },
		{ method: 'iban', value: 'IT60X0542811101000000123456', holder: 'Bruno Rossi' },
	]);
	assert.deepEqual(result, {
		v: 1,
		methods: [
			{ type: 'satispay', value: 'brunoxyz' },
			{ type: 'iban', value: 'IT60X0542811101000000123456', holder: 'Bruno Rossi' },
		],
	});
});

test('assemblePayload: order is preserved (order is information)', () => {
	const result = assemblePayload([
		{ method: 'iban', value: 'IT60...' },
		{ method: 'satispay', value: 'brunoxyz' },
	]);
	assert.deepEqual(
		result.methods.map((m) => m.type),
		['iban', 'satispay'],
	);
});

test('assemblePayload: drops cards with an empty or whitespace-only value', () => {
	const result = assemblePayload([
		{ method: 'satispay', value: '' },
		{ method: 'revolut', value: '   ' },
		{ method: 'paypal', value: 'brunoxyz' },
	]);
	assert.deepEqual(result.methods, [{ type: 'paypal', value: 'brunoxyz' }]);
});

test('assemblePayload: no methods filled -> empty array, not an error', () => {
	assert.deepEqual(assemblePayload([]), { v: 1, methods: [] });
	assert.deepEqual(assemblePayload([{ method: 'satispay', value: '' }]), { v: 1, methods: [] });
});

test('assemblePayload: iban without a holder omits the field entirely', () => {
	const result = assemblePayload([{ method: 'iban', value: 'IT60X0542811101000000123456' }]);
	assert.deepEqual(result.methods, [{ type: 'iban', value: 'IT60X0542811101000000123456' }]);
	assert.ok(!('holder' in result.methods[0]));
});

test('assemblePayload: crypto card uses the selected type, not the literal "crypto"', () => {
	const result = assemblePayload([
		{ method: 'crypto', value: 'bc1qxyz', cryptoType: 'bitcoin' },
	]);
	assert.deepEqual(result.methods, [{ type: 'bitcoin', value: 'bc1qxyz' }]);
});

test('assemblePayload: a crypto card without a type is dropped rather than shipping an invalid type', () => {
	const result = assemblePayload([{ method: 'crypto', value: 'bc1qxyz', cryptoType: '' }]);
	assert.deepEqual(result.methods, []);
});
