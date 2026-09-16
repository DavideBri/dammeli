import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as dammeli from '../public/crypto.js';
import { CIPHERTEXT_BYTES } from '../src/server/pages-api.mjs';

// crypto.js and the API are deliberately separate, untrusting layers (see
// their own file headers), so nothing forces their size constants to
// agree — they found that out the hard way once already: PAYLOAD_SIZE
// didn't leave room for AES-GCM's 16-byte auth tag, so every real
// encrypt() output was 16 bytes larger than the server's fixed
// CIPHERTEXT_BYTES, and POST /p rejected every single page. This test is
// the permanent guard against that regressing silently.
test('crypto.js pad()+encrypt() output is exactly the server\'s CIPHERTEXT_BYTES', async () => {
	const master = dammeli.generateMaster();
	const { readKey } = await dammeli.deriveAllFromMaster(master);

	const maxPlaintext = new Uint8Array(dammeli.PAYLOAD_SIZE - 4); // 4 length-prefix bytes
	const { ciphertext } = await dammeli.encrypt(readKey, dammeli.pad(maxPlaintext));

	assert.equal(ciphertext.length, CIPHERTEXT_BYTES);
});
