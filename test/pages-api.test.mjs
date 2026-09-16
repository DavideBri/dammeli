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

/** Generates a set of valid, mutually consistent fields for a new page. */
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

// --- 0.3 exit criterion: create a page, read it back, update it, delete
// it, all through the same logic the Netlify Functions run (the
// equivalent of doing it via curl, without needing a live server for the
// test).
test('exit criterion: create, read, update, delete', async () => {
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

test('POST on an existing id: 409, never overwrites', async () => {
	const store = createMemoryStore();
	const p = freshPage();
	const create = () =>
		createPage(store, { id: p.idHex, nonce: p.nonceHex, ct: p.ctHex, wth: p.wthHex });

	assert.equal((await create()).status, 201);
	assert.equal((await create()).status, 409);

	// the second POST must not have touched anything
	const read = await getPage(store, p.idHex);
	assert.equal(read.body.nonce, p.nonceHex);
});

test('GET on a nonexistent id: uniform 404', async () => {
	const store = createMemoryStore();
	const res = await getPage(store, hex(randomBytes(ID_BYTES)));
	assert.equal(res.status, 404);
	assert.deepEqual(res.body, { error: 'not_found' });
});

test('PUT/DELETE with a wrong write_token: same 404 as a nonexistent id', async () => {
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

	// the page must still be there
	assert.equal((await getPage(store, p.idHex)).status, 200);
});

test('PUT with a nonce identical to the previous one: rejected', async () => {
	const store = createMemoryStore();
	const p = freshPage();
	await createPage(store, { id: p.idHex, nonce: p.nonceHex, ct: p.ctHex, wth: p.wthHex });

	const res = await updatePage(store, p.idHex, {
		nonce: p.nonceHex, // same nonce as creation
		ct: hex(randomBytes(CIPHERTEXT_BYTES)),
		wt: p.wtHex,
	});
	assert.equal(res.status, 400);
	assert.equal(res.body.error, 'nonce_reused');

	// the page must not have been touched
	const read = await getPage(store, p.idHex);
	assert.equal(read.body.nonce, p.nonceHex);
	assert.equal(read.body.ct, p.ctHex);
});

test('rejects a ciphertext that is not exactly 4096 bytes', async () => {
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

test('rejects non-hex or missing fields', async () => {
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

test('malformed id in the path: 400, not 404', async () => {
	const store = createMemoryStore();
	assert.equal((await getPage(store, 'zz')).status, 400);
	assert.equal((await getPage(store, 'aabb')).status, 400); // wrong length
});
