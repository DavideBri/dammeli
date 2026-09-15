-- dammeli schema (PLAN.md section 4). Four columns, nothing else: no
-- created_at, expires_at, counters, or references to the user.
--
-- Run once in the Supabase project's SQL editor.

create table if not exists pages (
	id                bigint primary key,       -- 64 bit signed, derived from read_key
	nonce             bytea not null,
	ciphertext        bytea not null,            -- always exactly 4096 bytes, validated by the server
	write_token_hash  bytea not null
);

-- RLS enabled with no policy for anon/authenticated: the table must not be
-- bulk-readable from the client with the anon key (0.3 checklist). The
-- Netlify Functions in netlify/functions/ always use the service role key,
-- which bypasses RLS by design — it's the only legitimate way to access
-- the table.
alter table pages enable row level security;

-- No "create policy": deny-by-default for every role other than the
-- service role. Verify after deploying:
--
--   curl -s "$SUPABASE_URL/rest/v1/pages?select=id" \
--     -H "apikey: $SUPABASE_ANON_KEY" \
--     -H "authorization: Bearer $SUPABASE_ANON_KEY"
--
-- Must respond with an empty array `[]`, never with real rows.
