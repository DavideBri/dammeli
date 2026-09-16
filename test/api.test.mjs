import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as api from '../src/lib/api.mjs';

/** Temporarily replaces global fetch, restoring it after the callback runs. */
async function withFetch(handler, callback) {
	const original = globalThis.fetch;
	globalThis.fetch = handler;
	try {
		return await callback();
	} finally {
		globalThis.fetch = original;
	}
}

test('createPage: POSTs to /p with the given fields, returns null on 201 (no body)', async () => {
	let seen;
	await withFetch(
		async (url, init) => {
			seen = { url, init };
			return new Response(null, { status: 201 });
		},
		async () => {
			const result = await api.createPage({ id: 'aa', nonce: 'bb', ct: 'cc', wth: 'dd' });
			assert.equal(result, null);
		},
	);
	assert.equal(seen.url, '/p');
	assert.equal(seen.init.method, 'POST');
	assert.deepEqual(JSON.parse(seen.init.body), { id: 'aa', nonce: 'bb', ct: 'cc', wth: 'dd' });
	assert.equal(seen.init.headers['content-type'], 'application/json');
});

test('createPage: a 409 throws with the error body attached', async () => {
	await withFetch(
		async () =>
			new Response(JSON.stringify({ error: 'already_exists' }), {
				status: 409,
				headers: { 'content-type': 'application/json' },
			}),
		async () => {
			await assert.rejects(
				() => api.createPage({ id: 'aa', nonce: 'bb', ct: 'cc', wth: 'dd' }),
				(err) => {
					assert.equal(err.status, 409);
					assert.deepEqual(err.body, { error: 'already_exists' });
					return true;
				},
			);
		},
	);
});

test('getPage: GETs /p/:id with no body, returns the parsed JSON', async () => {
	let seen;
	await withFetch(
		async (url, init) => {
			seen = { url, init };
			return new Response(JSON.stringify({ nonce: 'aa', ct: 'bb' }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			});
		},
		async () => {
			const result = await api.getPage('deadbeef');
			assert.deepEqual(result, { nonce: 'aa', ct: 'bb' });
		},
	);
	assert.equal(seen.url, '/p/deadbeef');
	assert.equal(seen.init.method, 'GET');
	assert.equal(seen.init.headers, undefined);
	assert.equal(seen.init.body, undefined);
});

test('getPage: a uniform 404 throws with error "not_found"', async () => {
	await withFetch(
		async () =>
			new Response(JSON.stringify({ error: 'not_found' }), {
				status: 404,
				headers: { 'content-type': 'application/json' },
			}),
		async () => {
			await assert.rejects(() => api.getPage('deadbeef'), (err) => {
				assert.equal(err.status, 404);
				assert.equal(err.message, 'not_found');
				return true;
			});
		},
	);
});

test('updatePage: PUTs /p/:id with nonce/ct/wt', async () => {
	let seen;
	await withFetch(
		async (url, init) => {
			seen = { url, init };
			return new Response(null, { status: 204 });
		},
		async () => {
			await api.updatePage('deadbeef', { nonce: 'aa', ct: 'bb', wt: 'cc' });
		},
	);
	assert.equal(seen.url, '/p/deadbeef');
	assert.equal(seen.init.method, 'PUT');
	assert.deepEqual(JSON.parse(seen.init.body), { nonce: 'aa', ct: 'bb', wt: 'cc' });
});

test('deletePage: DELETEs /p/:id with wt', async () => {
	let seen;
	await withFetch(
		async (url, init) => {
			seen = { url, init };
			return new Response(null, { status: 204 });
		},
		async () => {
			await api.deletePage('deadbeef', { wt: 'cc' });
		},
	);
	assert.equal(seen.url, '/p/deadbeef');
	assert.equal(seen.init.method, 'DELETE');
	assert.deepEqual(JSON.parse(seen.init.body), { wt: 'cc' });
});
