import { createClient } from '@supabase/supabase-js';

/**
 * Supabase implementation of the `store` interface (PLAN.md section 9).
 * Always uses the service role key: the table has RLS enabled with no
 * policy for `anon`/`authenticated` (see sql/schema.sql), so only this
 * key can read or write it. The anon key must never reach this file.
 *
 * `id` is a Uint8Array(8) interpreted as a signed 64-bit two's-complement
 * integer (the same convention as an `INTEGER PRIMARY KEY`/Postgres
 * bigint): it's not a conversion, it's simply how those 8 bytes are read
 * to use them in a `bigint` column.
 *
 * nonce/ciphertext/write_token_hash are `bytea` columns: PostgREST
 * exchanges them in JSON as `\x<hex>` strings.
 */
export function createSupabaseStore({ url, serviceRoleKey, table = 'pages' }) {
	if (!url || !serviceRoleKey) {
		throw new Error('createSupabaseStore requires url and serviceRoleKey');
	}
	const client = createClient(url, serviceRoleKey, {
		auth: { persistSession: false },
	});

	return {
		async get(id) {
			const { data, error } = await client
				.from(table)
				.select('nonce, ciphertext, write_token_hash')
				.eq('id', idToPgBigint(id))
				.maybeSingle();
			if (error) throw error;
			if (!data) return null;
			return {
				nonce: byteaToBytes(data.nonce),
				ciphertext: byteaToBytes(data.ciphertext),
				writeTokenHash: byteaToBytes(data.write_token_hash),
			};
		},

		async put(id, row) {
			// Upsert: the 409-on-duplicate rule for POST /p lives in the API
			// layer (src/server/pages-api.mjs, get-then-put), not here. The
			// residual race window is accepted: two concurrent writes to the
			// same id would require the same master key, so they aren't
			// "different attackers" — they're the same client duplicating
			// itself.
			const { error } = await client.from(table).upsert({
				id: idToPgBigint(id),
				nonce: bytesToBytea(row.nonce),
				ciphertext: bytesToBytea(row.ciphertext),
				write_token_hash: bytesToBytea(row.writeTokenHash),
			});
			if (error) throw error;
		},

		async delete(id) {
			const { error } = await client.from(table).delete().eq('id', idToPgBigint(id));
			if (error) throw error;
		},

		// `head: true` returns only the count, not the matching rows — a
		// real `COUNT(*)`, not a `select *` that would also pull every
		// row's ciphertext over the wire just to throw it away.
		async count() {
			const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
			if (error) throw error;
			return count;
		},
	};
}

function idToPgBigint(idBytes) {
	const view = new DataView(idBytes.buffer, idBytes.byteOffset, idBytes.byteLength);
	return view.getBigInt64(0, false).toString();
}

function bytesToBytea(bytes) {
	return '\\x' + Buffer.from(bytes).toString('hex');
}

function byteaToBytes(pgBytea) {
	if (typeof pgBytea !== 'string' || !pgBytea.startsWith('\\x')) {
		throw new Error(`unexpected bytea format from Supabase: ${pgBytea}`);
	}
	return new Uint8Array(Buffer.from(pgBytea.slice(2), 'hex'));
}
