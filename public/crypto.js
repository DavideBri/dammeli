// dammeli cryptography. See PLAN.md section 3 for the full scheme.
//
// Non-negotiable constraints enforced here (PLAN.md section 2):
// C1 - master lives only in the fragment: this file never persists it elsewhere.
// C2 - no access to `location`, `document`, `fetch`, or `console` in this
//      file. Enforced by an automated test that scans the source.
// C3 - only crypto.getRandomValues, never Math.random.
// C4 - every write generates a fresh nonce: the public encrypt() function
//      generates it internally and doesn't accept a nonce from outside.

const VERSION = '1';
const TYPE_READ = 'r';
const TYPE_WRITE = 'm';

const MASTER_BYTES = 16; // 128 bit
const DERIVED_KEY_BYTES = 16; // read_key and write_token: truncated to 128 bit
const ID_BYTES = 8; // 64 bit
const GCM_NONCE_BYTES = 12; // 96 bit, the recommended size for AES-GCM
const GCM_TAG_BYTES = 16; // Web Crypto's AES-GCM appends a 128-bit auth tag

// The server stores and validates a ciphertext of exactly 4096 bytes
// (PLAN.md section 4) — that number already includes the GCM tag, since
// it's what actually ends up in the database. So the *plaintext* we pad
// to before encrypting has to leave room for it: pad(), not encrypt(),
// is where PAYLOAD_SIZE is spent.
const STORED_CIPHERTEXT_SIZE = 4096;
export const PAYLOAD_SIZE = STORED_CIPHERTEXT_SIZE - GCM_TAG_BYTES;
const LENGTH_PREFIX_BYTES = 4;

// --- generic utilities ---

function utf8(str) {
	return new TextEncoder().encode(str);
}

function concatBytes(...parts) {
	const total = parts.reduce((n, p) => n + p.length, 0);
	const out = new Uint8Array(total);
	let offset = 0;
	for (const p of parts) {
		out.set(p, offset);
		offset += p.length;
	}
	return out;
}

async function sha256(bytes) {
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return new Uint8Array(digest);
}

const BASE64URL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function toBase64Url(bytes) {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(str) {
	if (!/^[A-Za-z0-9_-]*$/.test(str)) {
		throw new Error('invalid base64url');
	}
	const padded = str.replace(/-/g, '+').replace(/_/g, '/');
	const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
	const binary = atob(padded + padding);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

// Hex, used on the /p API wire (see PLAN.md section 6) rather than
// base64url, which is reserved for the link fragment.
export function toHex(bytes) {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export function fromHex(hex) {
	if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
		throw new Error('invalid hex');
	}
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

// --- key generation and derivation ---

export function generateMaster() {
	return crypto.getRandomValues(new Uint8Array(MASTER_BYTES));
}

export async function deriveReadKey(master) {
	const h = await sha256(concatBytes(utf8('read'), master));
	return h.slice(0, DERIVED_KEY_BYTES);
}

export async function deriveWriteToken(master) {
	const h = await sha256(concatBytes(utf8('write'), master));
	return h.slice(0, DERIVED_KEY_BYTES);
}

export async function deriveId(readKey) {
	const h = await sha256(concatBytes(utf8('id'), readKey));
	return h.slice(0, ID_BYTES);
}

/**
 * Hash of the write_token to send to the server (the `wth` field of
 * POST /p, see PLAN.md section 6). The server never sees the real
 * write_token until it needs to authenticate a write (the `wt` field of
 * PUT/DELETE): until then it only knows this hash, exactly like a
 * password. It's therefore not truncated: this isn't deriving crypto
 * material with an entropy budget to respect, it's just a server-side
 * verifier.
 */
export async function deriveWriteTokenHash(writeToken) {
	return sha256(writeToken);
}

/** Derives {readKey, writeToken, id} from master. */
export async function deriveAllFromMaster(master) {
	const readKey = await deriveReadKey(master);
	const writeToken = await deriveWriteToken(master);
	const id = await deriveId(readKey);
	return { readKey, writeToken, id };
}

// --- AES-GCM encryption (key = read_key, never master) ---

async function importAesKey(readKey) {
	return crypto.subtle.importKey('raw', readKey, { name: 'AES-GCM' }, false, [
		'encrypt',
		'decrypt',
	]);
}

/**
 * Encrypts `plaintext` with a fresh nonce generated in here (constraint
 * C4: the caller can neither supply nor reuse a nonce through this
 * function).
 */
export async function encrypt(readKey, plaintext) {
	const nonce = crypto.getRandomValues(new Uint8Array(GCM_NONCE_BYTES));
	const ciphertext = await encryptWithNonce(readKey, nonce, plaintext);
	return { nonce, ciphertext };
}

/**
 * Low-level variant with an explicit nonce. Exists only to build
 * reproducible test vectors (see test/crypto.test.mjs): must not be used
 * for real writes, which must always go through encrypt().
 */
export async function encryptWithNonce(readKey, nonce, plaintext) {
	const key = await importAesKey(readKey);
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, plaintext);
	return new Uint8Array(ciphertext);
}

export async function decrypt(readKey, nonce, ciphertext) {
	const key = await importAesKey(readKey);
	const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, ciphertext);
	return new Uint8Array(plaintext);
}

// --- fixed-length padding (PLAN.md section 4) ---

/**
 * Pads `data` to a fixed PAYLOAD_SIZE bytes: 4 length bytes (big-endian) +
 * data + zero filler. The original payload's variable length would reveal
 * how many methods a page contains, so it must be hidden.
 */
export function pad(data) {
	const maxLen = PAYLOAD_SIZE - LENGTH_PREFIX_BYTES;
	if (data.length > maxLen) {
		throw new Error(`payload too large: ${data.length} bytes, max ${maxLen}`);
	}
	const out = new Uint8Array(PAYLOAD_SIZE);
	new DataView(out.buffer).setUint32(0, data.length, false);
	out.set(data, LENGTH_PREFIX_BYTES);
	return out;
}

export function unpad(padded) {
	if (padded.length !== PAYLOAD_SIZE) {
		throw new Error(`invalid padded length: ${padded.length}, expected ${PAYLOAD_SIZE}`);
	}
	const length = new DataView(padded.buffer, padded.byteOffset, padded.byteLength).getUint32(
		0,
		false,
	);
	if (length > PAYLOAD_SIZE - LENGTH_PREFIX_BYTES) {
		throw new Error('invalid length declared in padding');
	}
	return padded.slice(LENGTH_PREFIX_BYTES, LENGTH_PREFIX_BYTES + length);
}

// --- fragment: #<version><type><base64url key> ---

export function encodeFragment(type, keyBytes) {
	if (type !== TYPE_READ && type !== TYPE_WRITE) {
		throw new Error(`unknown fragment type: ${type}`);
	}
	return `${VERSION}${type}${toBase64Url(keyBytes)}`;
}

/**
 * Does not read `location.hash`: receives the string already extracted by
 * the caller. This is the only place in the project that needs to know
 * how a fragment is shaped (constraint C2: location.hash must be read in
 * exactly one place elsewhere in the app, never in here).
 */
export function parseFragment(fragment) {
	const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment;
	if (raw.length < 3) {
		throw new Error('fragment too short');
	}
	const version = raw[0];
	const type = raw[1];
	if (version !== VERSION) {
		throw new Error(`unsupported fragment version: ${version}`);
	}
	if (type !== TYPE_READ && type !== TYPE_WRITE) {
		throw new Error(`unknown fragment type: ${type}`);
	}
	const keyBytes = fromBase64Url(raw.slice(2));
	const expectedBytes = type === TYPE_WRITE ? MASTER_BYTES : DERIVED_KEY_BYTES;
	if (keyBytes.length !== expectedBytes) {
		throw new Error('invalid key length in fragment');
	}
	return { version, type, keyBytes };
}

/** Creates a new page: a fresh master and all its derived values. */
export async function createPage() {
	const master = generateMaster();
	const { readKey, writeToken, id } = await deriveAllFromMaster(master);
	return {
		master,
		readKey,
		writeToken,
		id,
		writeFragment: `#${encodeFragment(TYPE_WRITE, master)}`,
		readFragment: `#${encodeFragment(TYPE_READ, readKey)}`,
	};
}

/**
 * Reconstructs the available state from an already-extracted fragment. A
 * modify link yields everything; a read link yields only readKey and id
 * (never writeToken: that's the entire point of the design, see PLAN.md
 * section 3).
 */
export async function loadFromFragment(fragment) {
	const { type, keyBytes } = parseFragment(fragment);
	if (type === TYPE_WRITE) {
		const master = keyBytes;
		const { readKey, writeToken, id } = await deriveAllFromMaster(master);
		return { type, master, readKey, writeToken, id };
	}
	const readKey = keyBytes;
	const id = await deriveId(readKey);
	return { type, readKey, id };
}
