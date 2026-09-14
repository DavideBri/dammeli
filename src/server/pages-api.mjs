import { createHash, timingSafeEqual } from 'node:crypto';
import { hexToBytes, bytesToHex } from './hex.mjs';

// Lunghezze fisse del protocollo (CLAUDE.md sezioni 3, 4, 6).
export const ID_BYTES = 8;
export const NONCE_BYTES = 12;
export const CIPHERTEXT_BYTES = 4096;
export const WRITE_TOKEN_BYTES = 16; // wt: write_token grezzo
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
		return { error: 'id non esadecimale' };
	}
	if (id.length !== ID_BYTES) return { error: 'lunghezza id non valida' };
	return { bytes: id };
}

function parseField(body, name, expectedBytes) {
	const value = body?.[name];
	if (typeof value !== 'string') return { error: `campo mancante: ${name}` };
	let bytes;
	try {
		bytes = hexToBytes(value);
	} catch {
		return { error: `campo non esadecimale: ${name}` };
	}
	if (bytes.length !== expectedBytes) {
		return { error: `lunghezza non valida per ${name}: attesi ${expectedBytes} byte` };
	}
	return { bytes };
}

/** Ritorna il primo errore tra vari `parseField`/`parseIdParam`, o null. */
function firstError(...parsed) {
	const failed = parsed.find((p) => p.error);
	return failed ? badRequest(failed.error) : null;
}

/** POST /p — crea una pagina. body: {id, nonce, ct, wth}, tutti hex. */
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

/** GET /p/:id — legge una pagina. Nessuna autenticazione: e' il link pubblico. */
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
 * Verifica `wt` contro la `writeTokenHash` salvata. Ritorna true/false;
 * l'assenza del record e il token sbagliato producono entrambi NOT_FOUND
 * dal chiamante, per restare indistinguibili (CLAUDE.md sezione 6).
 */
function verifyWriteToken(wtBytes, storedHash) {
	return bytesEqual(sha256(wtBytes), storedHash);
}

/** PUT /p/:id — aggiorna una pagina. body: {nonce, ct, wt}, tutti hex. */
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

	// Unico controllo che il server puo' fare per proteggere l'utente da un
	// bug del client (CLAUDE.md sezione 6): un nonce identico al precedente
	// romperebbe AES-GCM (vincolo C4).
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

/** DELETE /p/:id — cancella una pagina. body: {wt}, hex. */
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
