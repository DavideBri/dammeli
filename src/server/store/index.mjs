import { createMemoryStore } from './memory-store.mjs';
import { createSupabaseStore } from './supabase-store.mjs';

/**
 * Sceglie l'implementazione dello store dalle variabili d'ambiente. In
 * assenza di credenziali Supabase usa lo store in memoria: comodo in
 * sviluppo locale, ma i dati non sopravvivono al riavvio della function.
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
