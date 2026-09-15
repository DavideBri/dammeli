import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as dammeli from '../public/crypto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CRYPTO_JS_PATH = join(__dirname, '..', 'public', 'crypto.js');

function hexToBytes(hex) {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function bytesToHex(bytes) {
	return Buffer.from(bytes).toString('hex');
}

/**
 * Strips // and /* *\/ comments from the source before searching for
 * forbidden tokens, so the tests don't trip on comments that *talk about*
 * the constraints (like this file itself) instead of on code that would
 * actually violate them.
 */
function stripComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

// --- constraint C2: location.hash must be read in exactly one place in
// the app, never here. This file must forever stay free of access to
// `location`, `document`, `fetch`, `console`, and XHR: if someone adds one
// of those by mistake, the constraint breaks silently without this test.
test('C2: crypto.js does not touch location, document, fetch, console, or XHR', () => {
	const source = stripComments(readFileSync(CRYPTO_JS_PATH, 'utf8'));
	const forbidden = ['location', 'document', 'fetch(', 'console.', 'XMLHttpRequest', 'WebSocket'];
	for (const token of forbidden) {
		assert.ok(!source.includes(token), `crypto.js must not contain "${token}"`);
	}
});

// --- Test vector: guarantees constraint V1 forever (PLAN.md section 3).
// If derivation or encryption ever change by mistake, this test fails: a
// link created with today's v1 scheme must keep producing exactly these
// bytes, forever.
test('v1 test vector: key derivation', async () => {
	const master = hexToBytes('000102030405060708090a0b0c0d0e0f');
	const { readKey, writeToken, id } = await dammeli.deriveAllFromMaster(master);

	assert.equal(bytesToHex(readKey), '44322378db8b4f11f0b1dbdcb2e27051');
	assert.equal(bytesToHex(writeToken), 'a02d5f09389fb3a97042d8ae97b6354a');
	assert.equal(bytesToHex(id), '6437beaf9b555b60');

	const writeTokenHash = await dammeli.deriveWriteTokenHash(writeToken);
	assert.equal(
		bytesToHex(writeTokenHash),
		'b79817548ed6f238d065cbb2c72a16fdb8f82c37ba9124b39ac2fd25280196ac',
	);
});

test('v1 test vector: AES-GCM encryption with a known nonce', async () => {
	const master = hexToBytes('000102030405060708090a0b0c0d0e0f');
	const { readKey } = await dammeli.deriveAllFromMaster(master);

	const plaintext = new TextEncoder().encode('dammeli test vector v1');
	const nonce = hexToBytes('aaaaaaaaaaaaaaaaaaaaaaaa');

	const ciphertext = await dammeli.encryptWithNonce(readKey, nonce, plaintext);
	assert.equal(
		bytesToHex(ciphertext),
		'525b6ab69ecca54b0a9f15abd16703c380289e7eff35ddc617dc25e9d53cf3e8c44b3647b9ad',
	);

	const decrypted = await dammeli.decrypt(readKey, nonce, ciphertext);
	assert.deepEqual(decrypted, plaintext);
});

test('v1 test vector: fragment', async () => {
	const master = hexToBytes('000102030405060708090a0b0c0d0e0f');
	const { readKey } = await dammeli.deriveAllFromMaster(master);

	assert.equal(dammeli.encodeFragment('m', master), '1mAAECAwQFBgcICQoLDA0ODw');
	assert.equal(dammeli.encodeFragment('r', readKey), '1rRDIjeNuLTxHwsdvcsuJwUQ');
});

// --- constraint C4: a fresh nonce on every write.
test('C4: encrypt() never repeats a nonce across successive writes', async () => {
	const master = dammeli.generateMaster();
	const { readKey } = await dammeli.deriveAllFromMaster(master);
	const plaintext = new TextEncoder().encode('same payload every time');

	const seen = new Set();
	const N = 500;
	for (let i = 0; i < N; i++) {
		const { nonce } = await dammeli.encrypt(readKey, plaintext);
		const hex = bytesToHex(nonce);
		assert.ok(!seen.has(hex), `nonce repeated after ${i} writes`);
		seen.add(hex);
	}
	assert.equal(seen.size, N);
});

// --- constraint C3: only crypto.getRandomValues, never Math.random.
test('C3: crypto.js does not use Math.random', () => {
	const source = stripComments(readFileSync(CRYPTO_JS_PATH, 'utf8'));
	assert.ok(!source.includes('Math.random'));
});

test('padding: round trip and fixed length', () => {
	for (const text of ['', 'a', 'x'.repeat(4092), 'hello dammeli']) {
		const data = new TextEncoder().encode(text);
		const padded = dammeli.pad(data);
		assert.equal(padded.length, dammeli.PAYLOAD_SIZE);
		const unpadded = dammeli.unpad(padded);
		assert.deepEqual(unpadded, data);
	}
});

test('padding: rejects payloads that are too large', () => {
	const tooBig = new Uint8Array(dammeli.PAYLOAD_SIZE);
	assert.throws(() => dammeli.pad(tooBig));
});

test('padding: rejects lengths other than PAYLOAD_SIZE in unpad', () => {
	assert.throws(() => dammeli.unpad(new Uint8Array(10)));
});

test('fragment: full round trip from a modify link', async () => {
	const page = await dammeli.createPage();
	const loaded = await dammeli.loadFromFragment(page.writeFragment);

	assert.equal(loaded.type, 'm');
	assert.deepEqual(loaded.master, page.master);
	assert.deepEqual(loaded.readKey, page.readKey);
	assert.deepEqual(loaded.writeToken, page.writeToken);
	assert.deepEqual(loaded.id, page.id);
});

test('fragment: a read link gives access to id and readKey but not master/writeToken', async () => {
	const page = await dammeli.createPage();
	const loaded = await dammeli.loadFromFragment(page.readFragment);

	assert.equal(loaded.type, 'r');
	assert.deepEqual(loaded.readKey, page.readKey);
	assert.deepEqual(loaded.id, page.id);
	assert.equal('master' in loaded, false);
	assert.equal('writeToken' in loaded, false);
});

test('fragment: rejects unsupported versions', () => {
	assert.throws(() => dammeli.parseFragment('#9rAAAAAAAAAAAAAAAAAAAAAA'));
});

test('fragment: rejects unknown types', () => {
	assert.throws(() => dammeli.parseFragment('#1xAAAAAAAAAAAAAAAAAAAAAA'));
});

test('fragment: rejects a key length that is wrong for the type', () => {
	// A 16-byte key with type 'r' is not the interesting case here — that's
	// exactly the expected 16-byte truncated length. Instead we check that a
	// key too short for 'm' (which wants the master's full 16 bytes) gets
	// rejected.
	const shortKey = dammeli.toBase64Url(new Uint8Array(8));
	assert.throws(() => dammeli.parseFragment(`#1m${shortKey}`));
});

// --- 0.2 exit criterion: encrypt a payload, "reload the page" (here
// simulated by rebuilding the state from the fragment alone, without
// reusing any in-memory variable from creation), decrypt it from the
// link. All local, no server.
test('exit criterion: create a page, reload it from the read link, decrypt', async () => {
	const page = await dammeli.createPage();
	const original = { v: 1, methods: [{ type: 'satispay', value: 'brunoxyz' }] };
	const plaintext = new TextEncoder().encode(JSON.stringify(original));
	const { nonce, ciphertext } = await dammeli.encrypt(page.readKey, dammeli.pad(plaintext));

	// "reload the page": all that survives is the fragment and the bytes
	// saved server-side (here simulated by nonce/ciphertext in local
	// variables, which is exactly what GET /p/:id would return).
	const reloaded = await dammeli.loadFromFragment(page.readFragment);
	const unpadded = dammeli.unpad(await dammeli.decrypt(reloaded.readKey, nonce, ciphertext));
	const roundTripped = JSON.parse(new TextDecoder().decode(unpadded));

	assert.deepEqual(roundTripped, original);
});
