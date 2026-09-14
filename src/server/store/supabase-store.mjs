import { createClient } from '@supabase/supabase-js';

/**
 * Implementazione Supabase dell'interfaccia `store` (CLAUDE.md sezione 9).
 * Usa sempre la service role key: la tabella ha RLS attiva senza policy per
 * `anon`/`authenticated` (vedi sql/schema.sql), quindi solo questa chiave
 * puo' leggerla o scriverla. La anon key non deve mai arrivare qui.
 *
 * `id` e' un Uint8Array(8) interpretato come intero a 64 bit con segno in
 * complemento a due (stessa convenzione di un `INTEGER PRIMARY KEY`
 * SQLite/Postgres bigint): non e' una conversione, e' semplicemente come
 * vengono letti quegli 8 byte per usarli in una colonna `bigint`.
 *
 * nonce/ciphertext/write_token_hash sono colonne `bytea`: PostgREST le
 * scambia in JSON come stringhe `\x<hex>`.
 */
export function createSupabaseStore({ url, serviceRoleKey, table = 'pages' }) {
	if (!url || !serviceRoleKey) {
		throw new Error('createSupabaseStore richiede url e serviceRoleKey');
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
			// Upsert: la regola dei 409-su-duplicato per POST /p vive nell'API
			// layer (src/server/pages-api.mjs, get-then-put), non qui. La
			// finestra di race residua e' accettata: due scritture concorrenti
			// sullo stesso id richiederebbero la stessa master key, quindi non
			// sono "aggressori diversi" ma lo stesso client che si duplica.
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
		throw new Error(`formato bytea inatteso da Supabase: ${pgBytea}`);
	}
	return new Uint8Array(Buffer.from(pgBytea.slice(2), 'hex'));
}
