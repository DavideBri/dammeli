import { bytesToHex } from '../hex.mjs';

/**
 * In-memory implementation of the `store` interface (PLAN.md section 9):
 * `get(id)` / `put(id, row)` / `delete(id)`, where `id` is a Uint8Array(8)
 * and `row` is `{ nonce, ciphertext, writeTokenHash }` (all Uint8Array).
 *
 * Used only by the tests: no network, no external service needed to
 * verify the logic in src/server/pages-api.mjs.
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
		async count() {
			return rows.size;
		},
	};
}
