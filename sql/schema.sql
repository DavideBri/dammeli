-- Schema dammeli (CLAUDE.md sezione 4). Quattro colonne, niente altro: niente
-- created_at, expires_at, contatori o riferimenti all'utente.
--
-- Da eseguire una volta nel SQL editor del progetto Supabase.

create table if not exists pages (
	id                bigint primary key,       -- 64 bit con segno, derivato da read_key
	nonce             bytea not null,
	ciphertext        bytea not null,            -- sempre esattamente 4096 byte, validato dal server
	write_token_hash  bytea not null
);

-- RLS attiva e senza policy per anon/authenticated: la tabella non deve
-- essere leggibile in massa dal client con la anon key (checklist 0.3). Le
-- Netlify Functions in netlify/functions/ usano sempre la service role key,
-- che bypassa RLS by design — e' l'unico modo legittimo di accedere alla
-- tabella.
alter table pages enable row level security;

-- Nessuna "create policy": deny-by-default per ogni ruolo che non sia il
-- service role. Verifica dopo il deploy:
--
--   curl -s "$SUPABASE_URL/rest/v1/pages?select=id" \
--     -H "apikey: $SUPABASE_ANON_KEY" \
--     -H "authorization: Bearer $SUPABASE_ANON_KEY"
--
-- Deve rispondere con un array vuoto `[]`, mai con righe vere.
