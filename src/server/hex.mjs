// Hex encoding used on the API wire (id, nonce, ciphertext,
// write_token/write_token_hash). Chosen over base64 because the id
// appears in the URL path (`GET /p/:id`): hex has no characters that
// need percent-encoding, standard base64 does.

export function hexToBytes(hex) {
	if (typeof hex !== 'string' || hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
		throw new Error('invalid hex');
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
