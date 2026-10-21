import { createHash, timingSafeEqual } from 'node:crypto';
import { hexToBytes, bytesToHex } from './hex.mjs';

// Fixed protocol lengths (PLAN.md sections 3, 4, 6).
export const ID_BYTES = 8;
export const NONCE_BYTES = 12;
export const CIPHERTEXT_BYTES = 4096;
export const WRITE_TOKEN_BYTES = 16; // wt: the raw write_token
export const WRITE_TOKEN_HASH_BYTES = 32; // wth: SHA-256(write_token)

const NOT_FOUND = Object.freeze({ status: 404, body: { error: 'not_found' } });

function badRequest(error) {
	return { status: 400, body: { error } };
}

function sha256(bytes) {
	return new Uint8Array(createHash('sha256').update(bytes).digest());
}

function bytesEqual(a, b) {
	if (a.length !== b.length) return false;
	return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function parseIdParam(idHex) {
	let id;
	try {
		id = hexToBytes(idHex ?? '');
	} catch {
		return { error: 'id is not hex' };
	}
	if (id.length !== ID_BYTES) return { error: 'invalid id length' };
	return { bytes: id };
}

function parseField(body, name, expectedBytes) {
	const value = body?.[name];
	if (typeof value !== 'string') return { error: `missing field: ${name}` };
	let bytes;
	try {
		bytes = hexToBytes(value);
	} catch {
		return { error: `non-hex field: ${name}` };
	}
	if (bytes.length !== expectedBytes) {
		return { error: `invalid length for ${name}: expected ${expectedBytes} bytes` };
	}
	return { bytes };
}

/** Returns the first error among several `parseField`/`parseIdParam` results, or null. */
function firstError(...parsed) {
	const failed = parsed.find((p) => p.error);
	return failed ? badRequest(failed.error) : null;
}

/** POST /p — creates a page. body: {id, nonce, ct, wth}, all hex. */
export async function createPage(store, body) {
	const id = parseField(body, 'id', ID_BYTES);
	const nonce = parseField(body, 'nonce', NONCE_BYTES);
	const ct = parseField(body, 'ct', CIPHERTEXT_BYTES);
	const wth = parseField(body, 'wth', WRITE_TOKEN_HASH_BYTES);
	const err = firstError(id, nonce, ct, wth);
	if (err) return err;

	const existing = await store.get(id.bytes);
	if (existing) return { status: 409, body: { error: 'already_exists' } };

	await store.put(id.bytes, { nonce: nonce.bytes, ciphertext: ct.bytes, writeTokenHash: wth.bytes });
	return { status: 201, body: null };
}

/** GET /stats — how many pages exist. Just a count, never the rows
 * themselves: the methods, titles, and everything else inside stay
 * exactly as unreadable to this endpoint as to anyone else. */
export async function getStats(store) {
	const count = await store.count();
	return { status: 200, body: { count } };
}

/** GET /p/:id — reads a page. No authentication: it's the public link. */
export async function getPage(store, idHex) {
	const id = parseIdParam(idHex);
	if (id.error) return badRequest(id.error);

	const row = await store.get(id.bytes);
	if (!row) return NOT_FOUND;

	return {
		status: 200,
		body: { nonce: bytesToHex(row.nonce), ct: bytesToHex(row.ciphertext) },
	};
}

/**
 * Verifies `wt` against the stored `writeTokenHash`. Returns true/false;
 * a missing record and a wrong token both produce NOT_FOUND from the
 * caller, so they stay indistinguishable (PLAN.md section 6).
 */
function verifyWriteToken(wtBytes, storedHash) {
	return bytesEqual(sha256(wtBytes), storedHash);
}

/** PUT /p/:id — updates a page. body: {nonce, ct, wt}, all hex. */
export async function updatePage(store, idHex, body) {
	const id = parseIdParam(idHex);
	if (id.error) return badRequest(id.error);

	const nonce = parseField(body, 'nonce', NONCE_BYTES);
	const ct = parseField(body, 'ct', CIPHERTEXT_BYTES);
	const wt = parseField(body, 'wt', WRITE_TOKEN_BYTES);
	const err = firstError(nonce, ct, wt);
	if (err) return err;

	const existing = await store.get(id.bytes);
	if (!existing) return NOT_FOUND;
	if (!verifyWriteToken(wt.bytes, existing.writeTokenHash)) return NOT_FOUND;

	// The only check the server can make to protect the user from a client
	// bug (PLAN.md section 6): a nonce identical to the previous one would
	// break AES-GCM (constraint C4).
	if (bytesEqual(nonce.bytes, existing.nonce)) {
		return badRequest('nonce_reused');
	}

	await store.put(id.bytes, {
		nonce: nonce.bytes,
		ciphertext: ct.bytes,
		writeTokenHash: existing.writeTokenHash,
	});
	return { status: 204, body: null };
}

/** DELETE /p/:id — deletes a page. body: {wt}, hex. */
export async function deletePage(store, idHex, body) {
	const id = parseIdParam(idHex);
	if (id.error) return badRequest(id.error);

	const wt = parseField(body, 'wt', WRITE_TOKEN_BYTES);
	if (wt.error) return badRequest(wt.error);

	const existing = await store.get(id.bytes);
	if (!existing) return NOT_FOUND;
	if (!verifyWriteToken(wt.bytes, existing.writeTokenHash)) return NOT_FOUND;

	await store.delete(id.bytes);
	return { status: 204, body: null };
}
