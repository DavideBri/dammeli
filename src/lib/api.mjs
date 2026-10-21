// Thin fetch wrapper for the /p API (PLAN.md section 6). All fields are
// hex strings, matching what the server expects — encoding happens in
// crypto.js (toHex/fromHex), never here.
//
// Deliberately not in public/crypto.js: that file's one job is
// cryptography with zero network access (constraint C2 forbids `fetch`
// there, enforced by an automated test). This file is the opposite: it
// only ever moves already-encrypted bytes over the wire.

async function request(method, path, body) {
	const response = await fetch(path, {
		method,
		headers: body ? { 'content-type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});

	let data = null;
	try {
		data = await response.json();
	} catch {
		// No body (e.g. 201/204) or not JSON — fine, data stays null.
	}

	if (!response.ok) {
		const error = new Error(data?.error ?? `request failed with status ${response.status}`);
		error.status = response.status;
		error.body = data;
		throw error;
	}
	return data;
}

/** @param {{id: string, nonce: string, ct: string, wth: string}} fields */
export function createPage(fields) {
	return request('POST', '/p', fields);
}

/** @param {string} id */
export function getPage(id) {
	return request('GET', `/p/${id}`);
}

/** @param {string} id @param {{nonce: string, ct: string, wt: string}} fields */
export function updatePage(id, fields) {
	return request('PUT', `/p/${id}`, fields);
}

/** @param {string} id @param {{wt: string}} fields */
export function deletePage(id, fields) {
	return request('DELETE', `/p/${id}`, fields);
}

/** @returns {Promise<{count: number}>} */
export function getStats() {
	return request('GET', '/stats');
}
