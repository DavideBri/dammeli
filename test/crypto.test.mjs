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
 * Rimuove commenti // e /* *\/ dal sorgente prima di cercare token vietati,
 * cosi' i test non scattano sui commenti che *parlano* dei vincoli (come
 * questo file stesso) invece che sul codice che li violerebbe davvero.
 */
function stripComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

// --- vincolo C2: location.hash va letto in un solo punto dell'app, mai qui.
// Questo file e' l'unico posto che deve restare per sempre privo di accesso
// a `location`, `document`, `fetch`, `console` e XHR: se qualcuno ce li
// aggiunge per errore, il vincolo e' rotto silenziosamente senza questo test.
test('C2: crypto.js non tocca location, document, fetch, console o XHR', () => {
	const source = stripComments(readFileSync(CRYPTO_JS_PATH, 'utf8'));
	const forbidden = ['location', 'document', 'fetch(', 'console.', 'XMLHttpRequest', 'WebSocket'];
	for (const token of forbidden) {
		assert.ok(!source.includes(token), `crypto.js non deve contenere "${token}"`);
	}
});

// --- Test vector: garantisce per sempre il vincolo V1 (CLAUDE.md sezione 3).
// Se un domani la derivazione o la cifratura cambiano per errore, questo
// test fallisce: un link creato con lo schema v1 di oggi deve continuare a
// produrre esattamente questi byte, per sempre.
test('test vector v1: derivazione chiavi', async () => {
	const master = hexToBytes('000102030405060708090a0b0c0d0e0f');
	const { readKey, writeToken, id } = await dammeli.deriveAllFromMaster(master);

	assert.equal(bytesToHex(readKey), '44322378db8b4f11f0b1dbdcb2e27051');
	assert.equal(bytesToHex(writeToken), 'a02d5f09389fb3a97042d8ae97b6354a');
	assert.equal(bytesToHex(id), '6437beaf9b555b60');
});

test('test vector v1: cifratura AES-GCM con nonce noto', async () => {
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

test('test vector v1: fragment', async () => {
	const master = hexToBytes('000102030405060708090a0b0c0d0e0f');
	const { readKey } = await dammeli.deriveAllFromMaster(master);

	assert.equal(dammeli.encodeFragment('m', master), '1mAAECAwQFBgcICQoLDA0ODw');
	assert.equal(dammeli.encodeFragment('r', readKey), '1rRDIjeNuLTxHwsdvcsuJwUQ');
});

// --- vincolo C4: nonce nuovo a ogni scrittura.
test('C4: encrypt() non ripete mai il nonce su scritture successive', async () => {
	const master = dammeli.generateMaster();
	const { readKey } = await dammeli.deriveAllFromMaster(master);
	const plaintext = new TextEncoder().encode('stesso payload ogni volta');

	const seen = new Set();
	const N = 500;
	for (let i = 0; i < N; i++) {
		const { nonce } = await dammeli.encrypt(readKey, plaintext);
		const hex = bytesToHex(nonce);
		assert.ok(!seen.has(hex), `nonce ripetuto dopo ${i} scritture`);
		seen.add(hex);
	}
	assert.equal(seen.size, N);
});

// --- vincolo C3: solo crypto.getRandomValues, mai Math.random.
test('C3: crypto.js non usa Math.random', () => {
	const source = stripComments(readFileSync(CRYPTO_JS_PATH, 'utf8'));
	assert.ok(!source.includes('Math.random'));
});

test('padding: round trip e lunghezza fissa', () => {
	for (const text of ['', 'a', 'x'.repeat(4092), 'ciao dammeli']) {
		const data = new TextEncoder().encode(text);
		const padded = dammeli.pad(data);
		assert.equal(padded.length, dammeli.PAYLOAD_SIZE);
		const unpadded = dammeli.unpad(padded);
		assert.deepEqual(unpadded, data);
	}
});

test('padding: rifiuta payload troppo grandi', () => {
	const tooBig = new Uint8Array(dammeli.PAYLOAD_SIZE);
	assert.throws(() => dammeli.pad(tooBig));
});

test('padding: rifiuta lunghezze diverse da PAYLOAD_SIZE in unpad', () => {
	assert.throws(() => dammeli.unpad(new Uint8Array(10)));
});

test('fragment: round trip completo da link di modifica', async () => {
	const page = await dammeli.createPage();
	const loaded = await dammeli.loadFromFragment(page.writeFragment);

	assert.equal(loaded.type, 'm');
	assert.deepEqual(loaded.master, page.master);
	assert.deepEqual(loaded.readKey, page.readKey);
	assert.deepEqual(loaded.writeToken, page.writeToken);
	assert.deepEqual(loaded.id, page.id);
});

test('fragment: link di lettura da accesso a id e readKey ma non a master/writeToken', async () => {
	const page = await dammeli.createPage();
	const loaded = await dammeli.loadFromFragment(page.readFragment);

	assert.equal(loaded.type, 'r');
	assert.deepEqual(loaded.readKey, page.readKey);
	assert.deepEqual(loaded.id, page.id);
	assert.equal('master' in loaded, false);
	assert.equal('writeToken' in loaded, false);
});

test('fragment: rifiuta versioni non supportate', () => {
	assert.throws(() => dammeli.parseFragment('#9rAAAAAAAAAAAAAAAAAAAAAA'));
});

test('fragment: rifiuta tipi sconosciuti', () => {
	assert.throws(() => dammeli.parseFragment('#1xAAAAAAAAAAAAAAAAAAAAAA'));
});

test('fragment: rifiuta lunghezza chiave sbagliata per il tipo', () => {
	// chiave da 16 byte con tipo 'r', che si aspetta 16 byte esatti troncati
	// diversamente non e' l'errore interessante qui: verifichiamo piuttosto
	// che una chiave troppo corta per 'm' (che vuole i 16 byte della master)
	// venga rifiutata.
	const shortKey = dammeli.toBase64Url(new Uint8Array(8));
	assert.throws(() => dammeli.parseFragment(`#1m${shortKey}`));
});

// --- criterio di uscita 0.2: cifro un payload, "ricarico la pagina" (qui
// simulato ricreando lo stato solo dal fragment, senza riusare alcuna
// variabile in memoria dalla creazione), lo decifro dal link. Tutto in
// locale, nessun server.
test('criterio di uscita: creo una pagina, la ricarico dal link di lettura, decifro', async () => {
	const page = await dammeli.createPage();
	const original = { v: 1, methods: [{ type: 'satispay', value: 'brunoxyz' }] };
	const plaintext = new TextEncoder().encode(JSON.stringify(original));
	const { nonce, ciphertext } = await dammeli.encrypt(page.readKey, dammeli.pad(plaintext));

	// "ricarica pagina": tutto quello che sopravvive e' il fragment e i byte
	// salvati lato server (qui simulati da nonce/ciphertext in variabili
	// locali, che e' esattamente cio' che tornerebbe da GET /p/:id).
	const reloaded = await dammeli.loadFromFragment(page.readFragment);
	const unpadded = dammeli.unpad(await dammeli.decrypt(reloaded.readKey, nonce, ciphertext));
	const roundTripped = JSON.parse(new TextDecoder().decode(unpadded));

	assert.deepEqual(roundTripped, original);
});
