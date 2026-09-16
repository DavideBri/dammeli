// Builds the plaintext payload (PLAN.md section 5) from the editor's
// filled-in cards. Pure and DOM-free: the caller extracts card values
// from the page, this just decides what belongs in the final array and
// in what shape.

/**
 * @param {Array<{method: string, value: string, holder?: string, cryptoType?: string}>} cards
 *   In the order they should appear in the payload (order is information).
 *   Empty values are dropped.
 * @param {{title?: string}} [options] `title` is optional and page-level
 *   (PLAN.md section 5) — added post-v1 without a version bump, so it's
 *   simply omitted from the payload when blank rather than shipped as an
 *   empty string.
 */
export function assemblePayload(cards, { title } = {}) {
	const methods = [];
	for (const card of cards) {
		const value = (card.value ?? '').trim();
		if (!value) continue;

		if (card.method === 'crypto') {
			const type = (card.cryptoType ?? '').trim();
			if (!type) continue;
			methods.push({ type, value });
		} else if (card.method === 'iban') {
			const holder = (card.holder ?? '').trim();
			methods.push(holder ? { type: 'iban', value, holder } : { type: 'iban', value });
		} else {
			methods.push({ type: card.method, value });
		}
	}
	const trimmedTitle = (title ?? '').trim();
	return trimmedTitle ? { v: 1, title: trimmedTitle, methods } : { v: 1, methods };
}
