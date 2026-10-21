import { createStoreFromEnv } from '../../src/server/store/index.mjs';
import { getStats } from '../../src/server/pages-api.mjs';

const store = createStoreFromEnv();

export default async () => {
	const { status, body } = await getStats(store);
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
};

export const config = {
	path: '/stats',
};
