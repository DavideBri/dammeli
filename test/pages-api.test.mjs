import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';

import { createMemoryStore } from '../src/server/store/memory-store.mjs';
import {
	createPage,
	getPage,
	updatePage,
	deletePage,
	ID_BYTES,
	NONCE_BYTES,
	CIPHERTEXT_BYTES,
	WRITE_TOKEN_BYTES,
} from '../src/server/pages-api.mjs';

function hex(bytes) {
	return Buffer.from(bytes).toString('hex');
}

function sha256Hex(bytes) {
	return createHash('sha256').update(Buffer.from(bytes)).digest('hex');
}

/** Genera un set di campi validi e coerenti tra loro per una pagina nuova. */
function freshPage() {
	const id = randomBytes(ID_BYTES);
	const nonce = randomBytes(NONCE_BYTES);
	const ct = randomBytes(CIPHERTEXT_BYTES);
	const wt = randomBytes(WRITE_TOKEN_BYTES);
	return {
		idHex: hex(id),
		nonceHex: hex(nonce),
		ctHex: hex(ct),
		wtHex: hex(wt),
		wthHex: sha256Hex(wt),
	};
}

// --- criterio di uscita 0.3: creo una pagina, la rileggo, la modifico, la
// cancello, tutto tramite la stessa logica che le Netlify Functions
// eseguono (l'equivalente di farlo da curl, senza dover far girare un
// server per il test).
test('criterio di uscita: crea, leggi, aggiorna, cancella', async () => {
	const store = createMemoryStore();
	const p = freshPage();

	const created = await createPage(store, {
		id: p.idHex,
		nonce: p.nonceHex,
		ct: p.ctHex,
		wth: p.wthHex,
	});
	assert.equal(created.status, 201);

	const read1 = await getPage(store, p.idHex);
	assert.equal(read1.status, 200);
	assert.equal(read1.body.nonce, p.nonceHex);
	assert.equal(read1.body.ct, p.ctHex);

	const newNonce = hex(randomBytes(NONCE_BYTES));
	const newCt = hex(randomBytes(CIPHERTEXT_BYTES));
	const updated = await updatePage(store, p.idHex, {
		nonce: newNonce,
		ct: newCt,
		wt: p.wtHex,
	});
	assert.equal(updated.status, 204);

	const read2 = await getPage(store, p.idHex);
	assert.equal(read2.body.nonce, newNonce);
	assert.equal(read2.body.ct, newCt);

	const deleted = await deletePage(store, p.idHex, { wt: p.wtHex });
	assert.equal(deleted.status, 204);

	const read3 = await getPage(store, p.idHex);
	assert.equal(read3.status, 404);
});

test('POST su id esistente: 409, mai sovrascrive', async () => {
	const store = createMemoryStore();
	const p = freshPage();
	const create = () =>
		createPage(store, { id: p.idHex, nonce: p.nonceHex, ct: p.ctHex, wth: p.wthHex });

	assert.equal((await create()).status, 201);
	assert.equal((await create()).status, 409);

	// il secondo POST non deve aver toccato nulla
	const read = await getPage(store, p.idHex);
	assert.equal(read.body.nonce, p.nonceHex);
});

test('GET su id inesistente: 404 uniforme', async () => {
	const store = createMemoryStore();
	const res = await getPage(store, hex(randomBytes(ID_BYTES)));
	assert.equal(res.status, 404);
	assert.deepEqual(res.body, { error: 'not_found' });
});

test('PUT/DELETE con write_token sbagliato: stesso 404 di id inesistente', async () => {
	const store = createMemoryStore();
	const p = freshPage();
	await createPage(store, { id: p.idHex, nonce: p.nonceHex, ct: p.ctHex, wth: p.wthHex });

	const wrongWt = hex(randomBytes(WRITE_TOKEN_BYTES));
	const badUpdate = await updatePage(store, p.idHex, {
		nonce: hex(randomBytes(NONCE_BYTES)),
		ct: hex(randomBytes(CIPHERTEXT_BYTES)),
		wt: wrongWt,
	});
	const missingId = await getPage(store, hex(randomBytes(ID_BYTES)));

	assert.equal(badUpdate.status, missingId.status);
	assert.deepEqual(badUpdate.body, missingId.body);

	const badDelete = await deletePage(store, p.idHex, { wt: wrongWt });
	assert.equal(badDelete.status, 404);
	assert.deepEqual(badDelete.body, { error: 'not_found' });

	// la pagina deve essere ancora li'
	assert.equal((await getPage(store, p.idHex)).status, 200);
});

test('PUT con nonce identico al precedente: rifiutato', async () => {
	const store = createMemoryStore();
	const p = freshPage();
	await createPage(store, { id: p.idHex, nonce: p.nonceHex, ct: p.ctHex, wth: p.wthHex });

	const res = await updatePage(store, p.idHex, {
		nonce: p.nonceHex, // stesso nonce della creazione
		ct: hex(randomBytes(CIPHERTEXT_BYTES)),
		wt: p.wtHex,
	});
	assert.equal(res.status, 400);
	assert.equal(res.body.error, 'nonce_reused');

	// la pagina non deve essere stata toccata
	const read = await getPage(store, p.idHex);
	assert.equal(read.body.nonce, p.nonceHex);
	assert.equal(read.body.ct, p.ctHex);
});

test('rifiuta ciphertext che non e\' esattamente 4096 byte', async () => {
	const store = createMemoryStore();
	const p = freshPage();

	const tooShort = await createPage(store, {
		id: p.idHex,
		nonce: p.nonceHex,
		ct: hex(randomBytes(CIPHERTEXT_BYTES - 1)),
		wth: p.wthHex,
	});
	assert.equal(tooShort.status, 400);

	const tooLong = await createPage(store, {
		id: p.idHex,
		nonce: p.nonceHex,
		ct: hex(randomBytes(CIPHERTEXT_BYTES + 1)),
		wth: p.wthHex,
	});
	assert.equal(tooLong.status, 400);

	assert.equal((await getPage(store, p.idHex)).status, 404);
});

test('rifiuta campi non esadecimali o mancanti', async () => {
	const store = createMemoryStore();
	const p = freshPage();

	const badHex = await createPage(store, {
		id: 'non-hex!!',
		nonce: p.nonceHex,
		ct: p.ctHex,
		wth: p.wthHex,
	});
	assert.equal(badHex.status, 400);

	const missing = await createPage(store, { nonce: p.nonceHex, ct: p.ctHex, wth: p.wthHex });
	assert.equal(missing.status, 400);
});

test('id malformato nel path: 400, non 404', async () => {
	const store = createMemoryStore();
	assert.equal((await getPage(store, 'zz')).status, 400);
	assert.equal((await getPage(store, 'aabb')).status, 400); // lunghezza sbagliata
});
