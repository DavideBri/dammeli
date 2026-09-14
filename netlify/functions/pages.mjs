import { createStoreFromEnv } from '../../src/server/store/index.mjs';
import { createPage, getPage, updatePage, deletePage } from '../../src/server/pages-api.mjs';

// Un solo store per invocazione fredda: se e' Supabase, il client interno
// gestisce gia' il pooling delle connessioni HTTP.
const store = createStoreFromEnv();

// Netlify non espone un limite di dimensione del body configurabile a
// livello di reverse proxy/edge (a differenza di nginx): lo applichiamo qui,
// prima di leggere il body. Il payload piu' grande legittimo (POST, con
// ciphertext a 4096 byte in hex = 8192 caratteri) sta comodamente sotto 16
// KB; oltre e' solo spreco di banda o abuso, non traffico reale.
const MAX_BODY_BYTES = 16 * 1024;

function bodyTooLarge(req) {
	const length = Number(req.headers.get('content-length'));
	return Number.isFinite(length) && length > MAX_BODY_BYTES;
}

async function readJsonBody(req) {
	try {
		return await req.json();
	} catch {
		return {};
	}
}

function toResponse({ status, body }) {
	if (body === null || body === undefined) {
		return new Response(null, { status });
	}
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

export default async (req, context) => {
	if (bodyTooLarge(req)) {
		return new Response(null, { status: 413 });
	}

	const id = context.params.id;

	if (req.method === 'POST' && !id) {
		return toResponse(await createPage(store, await readJsonBody(req)));
	}
	if (req.method === 'GET' && id) {
		return toResponse(await getPage(store, id));
	}
	if (req.method === 'PUT' && id) {
		return toResponse(await updatePage(store, id, await readJsonBody(req)));
	}
	if (req.method === 'DELETE' && id) {
		return toResponse(await deletePage(store, id, await readJsonBody(req)));
	}
	return new Response(null, { status: 405 });
};

export const config = {
	path: ['/p', '/p/:id'],
};
