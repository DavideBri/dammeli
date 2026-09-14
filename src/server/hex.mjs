// Encoding esadecimale usato sul filo dell'API (id, nonce, ciphertext,
// write_token/write_token_hash). Scelto invece di base64 perche' l'id
// compare nel path dell'URL (`GET /p/:id`): l'hex non ha caratteri che
// richiedano percent-encoding, il base64 standard si'.

export function hexToBytes(hex) {
	if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
		throw new Error('hex non valido');
	}
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

export function bytesToHex(bytes) {
	return Buffer.from(bytes).toString('hex');
}
