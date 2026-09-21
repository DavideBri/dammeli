// Pure, DOM-free normalization for the editor's payment method inputs
// (PLAN.md section 7, point 2: "tolerance for messy pastes"). No
// side effects, easy to unit test independently of any UI.

/**
 * Extracts a bare handle from a messy paste. If the input parses as a URL
 * whose host matches one of `domains`, returns the last path segment
 * (e.g. `https://www.paypal.me/brunoxyz?locale=it` -> `brunoxyz`).
 * Otherwise returns the trimmed input unchanged — safer than guessing
 * wrong on something we don't recognize.
 */
export function normalizeHandleFromUrl(input, domains) {
	const trimmed = (input ?? '').trim();
	if (!trimmed) return '';

	let candidate = trimmed;
	const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	try {
		const url = new URL(withProtocol);
		const host = url.hostname.replace(/^www\./i, '').toLowerCase();
		if (domains.some((d) => host === d || host.endsWith(`.${d}`))) {
			const segments = url.pathname.split('/').filter(Boolean);
			if (segments.length > 0) {
				candidate = segments[segments.length - 1];
			}
		}
	} catch {
		// Not a parseable URL at all: keep the trimmed input as-is.
	}

	return candidate.replace(/^@/, '').trim();
}

/** Strips whitespace and uppercases an IBAN pasted with spaces. */
export function normalizeIban(input) {
	return (input ?? '').replace(/\s+/g, '').toUpperCase();
}

/**
 * Last `length` characters of a value, for the visual confirmation
 * required by PLAN.md section 7 point 4 ("icon plus last few
 * characters"). Never the whole value: confirmation is not a review
 * screen.
 */
export function confirmationSuffix(value, length = 4) {
	const v = value ?? '';
	return v.length <= length ? v : v.slice(-length);
}

/**
 * First `head` characters, an ellipsis, last `tail` — e.g. "+39…417" for
 * a phone number. Same spirit as confirmationSuffix: recognizable without
 * repeating the whole value, for the editor's "reuse this contact"
 * suggestion chip (a full phone number there would be redundant with the
 * field the user is about to fill from it).
 */
export function maskMiddle(value, { head = 3, tail = 3 } = {}) {
	const v = (value ?? '').trim();
	if (v.length <= head + tail) return v;
	return `${v.slice(0, head)}…${v.slice(-tail)}`;
}
