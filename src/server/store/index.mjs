import { createMemoryStore } from './memory-store.mjs';
import { createSupabaseStore } from './supabase-store.mjs';

/**
 * Picks the store implementation from environment variables. Without
 * Supabase credentials it falls back to the in-memory store: convenient
 * for local development, but data doesn't survive a function restart.
 */
export function createStoreFromEnv(env = process.env) {
	const url = env.SUPABASE_URL;
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (url && serviceRoleKey) {
		return createSupabaseStore({ url, serviceRoleKey });
	}
	return createMemoryStore();
}

export { createMemoryStore, createSupabaseStore };
