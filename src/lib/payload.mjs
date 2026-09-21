// Builds the plaintext payload (PLAN.md section 5) from the editor's
// filled-in cards. Pure and DOM-free: the caller extracts card values
// from the page, this just decides what belongs in the final array and
// in what shape.

import { isContactBased } from './contact-methods.mjs';

/**
 * @param {Array<{method: string, value: string, holder?: string, name?: string, cryptoType?: string, preferred?: boolean}>} cards
 *   In the order they should appear in the payload (order is information).
 *   Empty values are dropped. `name` is only ever kept for a
 *   contact-based method (src/lib/contact-methods.mjs) — same "must not
 *   end up in the blob of someone using only Satispay [and nothing else
 *   that needs it]" guarantee PLAN.md section 5 already makes for
 *   `holder`, checked here rather than trusted from the caller.
 * @param {{title?: string}} [options] `title` is optional and page-level
 *   (PLAN.md section 5) — added post-v1 without a version bump, so it's
 *   simply omitted from the payload when blank rather than shipped as an
 *   empty string.
 */
export function assemblePayload(cards, { title } = {}) {
	const methods = [];
	// At most one entry ever carries `preferred: true` — a second one
	// showing up (a caller bug, not something the editor's own single
	// `state.preferred` value could produce) would leave the viewer with
	// no well-defined "shown first" method, so only the first one counts.
	let preferredTaken = false;
	for (const card of cards) {
		const value = (card.value ?? '').trim();
		if (!value) continue;

		let entry;
		if (card.method === 'crypto') {
			const type = (card.cryptoType ?? '').trim();
			if (!type) continue;
			entry = { type, value };
		} else if (card.method === 'iban') {
			const holder = (card.holder ?? '').trim();
			entry = holder ? { type: 'iban', value, holder } : { type: 'iban', value };
		} else {
			entry = { type: card.method, value };
			if (isContactBased(card.method)) {
				const name = (card.name ?? '').trim();
				if (name) entry.name = name;
			}
		}
		if (card.preferred && !preferredTaken) {
			entry.preferred = true;
			preferredTaken = true;
		}
		methods.push(entry);
	}
	const trimmedTitle = (title ?? '').trim();
	return trimmedTitle ? { v: 1, title: trimmedTitle, methods } : { v: 1, methods };
}
