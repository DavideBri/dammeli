import { createStoreFromEnv } from '../../src/server/store/index.mjs';
import { createPage, getPage, updatePage, deletePage } from '../../src/server/pages-api.mjs';

// A single store per cold start: if it's Supabase, the internal client
// already handles HTTP connection pooling.
const store = createStoreFromEnv();

// Netlify doesn't expose a body size limit configurable at the reverse
// proxy/edge level (unlike nginx): we apply it here, before reading the
// body. The largest legitimate payload (POST, with a 4096-byte ciphertext
// in hex = 8192 characters) comfortably sits under 16 KB; beyond that it's
// just wasted bandwidth or abuse, not real traffic.
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
