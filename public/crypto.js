// Crittografia di dammeli. Vedi CLAUDE.md sezione 3 per lo schema completo.
//
// Vincoli non negoziabili applicati qui (CLAUDE.md sezione 2):
// C1 - la master vive solo nel fragment: questo file non la persiste altrove.
// C2 - nessun accesso a `location`, `document`, `fetch` o `console` in questo
//      file. E' verificato da un test automatico che ne scansiona il sorgente.
// C3 - solo crypto.getRandomValues, mai Math.random.
// C4 - ogni scrittura genera un nonce nuovo: la funzione pubblica encrypt()
//      lo genera internamente e non accetta un nonce dall'esterno.

const VERSION = '1';
const TYPE_READ = 'r';
const TYPE_WRITE = 'm';

const MASTER_BYTES = 16; // 128 bit
const DERIVED_KEY_BYTES = 16; // read_key e write_token: troncati a 128 bit
const ID_BYTES = 8; // 64 bit
const GCM_NONCE_BYTES = 12; // 96 bit, dimensione raccomandata per AES-GCM

export const PAYLOAD_SIZE = 4096;
const LENGTH_PREFIX_BYTES = 4;

// --- util generiche ---

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
		throw new Error('base64url non valido');
	}
	const padded = str.replace(/-/g, '+').replace(/_/g, '/');
	const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
	const binary = atob(padded + padding);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

// --- generazione e derivazione chiavi ---

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

/** Deriva {readKey, writeToken, id} dalla master. */
export async function deriveAllFromMaster(master) {
	const readKey = await deriveReadKey(master);
	const writeToken = await deriveWriteToken(master);
	const id = await deriveId(readKey);
	return { readKey, writeToken, id };
}

// --- cifratura AES-GCM (chiave = read_key, mai la master) ---

async function importAesKey(readKey) {
	return crypto.subtle.importKey('raw', readKey, { name: 'AES-GCM' }, false, [
		'encrypt',
		'decrypt',
	]);
}

/**
 * Cifra `plaintext` con un nonce nuovo generato qui dentro (vincolo C4: il
 * chiamante non puo' fornire ne' riusare un nonce tramite questa funzione).
 */
export async function encrypt(readKey, plaintext) {
	const nonce = crypto.getRandomValues(new Uint8Array(GCM_NONCE_BYTES));
	const ciphertext = await encryptWithNonce(readKey, nonce, plaintext);
	return { nonce, ciphertext };
}

/**
 * Variante a basso livello con nonce esplicito. Esiste solo per costruire
 * test vector riproducibili (vedi test/crypto.test.mjs): non va usata per
 * scritture reali, che devono sempre passare da encrypt().
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

// --- padding a lunghezza fissa (CLAUDE.md sezione 4) ---

/**
 * Padda `data` a PAYLOAD_SIZE byte fissi: 4 byte di lunghezza (big-endian) +
 * dati + zeri di riempimento. La lunghezza variabile del payload originale
 * rivelerebbe quanti metodi contiene una pagina, quindi va nascosta.
 */
export function pad(data) {
	const maxLen = PAYLOAD_SIZE - LENGTH_PREFIX_BYTES;
	if (data.length > maxLen) {
		throw new Error(`payload troppo grande: ${data.length} byte, massimo ${maxLen}`);
	}
	const out = new Uint8Array(PAYLOAD_SIZE);
	new DataView(out.buffer).setUint32(0, data.length, false);
	out.set(data, LENGTH_PREFIX_BYTES);
	return out;
}

export function unpad(padded) {
	if (padded.length !== PAYLOAD_SIZE) {
		throw new Error(`lunghezza padded non valida: ${padded.length}, attesi ${PAYLOAD_SIZE}`);
	}
	const length = new DataView(padded.buffer, padded.byteOffset, padded.byteLength).getUint32(
		0,
		false,
	);
	if (length > PAYLOAD_SIZE - LENGTH_PREFIX_BYTES) {
		throw new Error('lunghezza dichiarata nel padding non valida');
	}
	return padded.slice(LENGTH_PREFIX_BYTES, LENGTH_PREFIX_BYTES + length);
}

// --- fragment: #<versione><tipo><chiave base64url> ---

export function encodeFragment(type, keyBytes) {
	if (type !== TYPE_READ && type !== TYPE_WRITE) {
		throw new Error(`tipo fragment sconosciuto: ${type}`);
	}
	return `${VERSION}${type}${toBase64Url(keyBytes)}`;
}

/**
 * Non legge `location.hash`: riceve la stringa gia' estratta dal chiamante.
 * Questo e' l'unico punto del progetto che deve sapere come e' fatto un
 * fragment (vincolo C2: location.hash va letto in un solo punto altrove
 * nell'app, mai qui dentro).
 */
export function parseFragment(fragment) {
	const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment;
	if (raw.length < 3) {
		throw new Error('fragment troppo corto');
	}
	const version = raw[0];
	const type = raw[1];
	if (version !== VERSION) {
		throw new Error(`versione fragment non supportata: ${version}`);
	}
	if (type !== TYPE_READ && type !== TYPE_WRITE) {
		throw new Error(`tipo fragment sconosciuto: ${type}`);
	}
	const keyBytes = fromBase64Url(raw.slice(2));
	const expectedBytes = type === TYPE_WRITE ? MASTER_BYTES : DERIVED_KEY_BYTES;
	if (keyBytes.length !== expectedBytes) {
		throw new Error('lunghezza chiave nel fragment non valida');
	}
	return { version, type, keyBytes };
}

/** Crea una pagina nuova: master fresca e tutti i suoi derivati. */
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
 * Ricostruisce lo stato disponibile a partire da un fragment gia' estratto.
 * Da un link di modifica si ottiene tutto; da un link di lettura solo
 * readKey e id (mai writeToken: e' l'intero punto del design, vedi
 * CLAUDE.md sezione 3).
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
