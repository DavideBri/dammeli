import { bytesToHex } from '../hex.mjs';

/**
 * Implementazione in-memoria dell'interfaccia `store` (CLAUDE.md sezione 9):
 * `get(id)` / `put(id, row)` / `delete(id)`, dove `id` e' un Uint8Array(8) e
 * `row` e' `{ nonce, ciphertext, writeTokenHash }` (tutti Uint8Array).
 *
 * Usata solo dai test: nessuna rete, nessun servizio esterno necessario per
 * verificare la logica in src/server/pages-api.mjs.
 */
export function createMemoryStore() {
	const rows = new Map();

	return {
		async get(id) {
			const row = rows.get(bytesToHex(id));
			return row ? { ...row } : null;
		},
		async put(id, row) {
			rows.set(bytesToHex(id), {
				nonce: row.nonce,
				ciphertext: row.ciphertext,
				writeTokenHash: row.writeTokenHash,
			});
		},
		async delete(id) {
			rows.delete(bytesToHex(id));
		},
	};
}
