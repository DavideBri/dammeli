// A minimal vCard 3.0 builder for the read-only page's "save contact"
// button on contact-based payment methods (src/lib/contact-methods.mjs):
// a name and a phone number, nothing else. No library — the format is a
// handful of lines, and this is the only place that needs it.

function escapeVCardValue(value) {
	return (value ?? '').replace(/([\\,;])/g, '\\$1').replace(/\r?\n/g, '\\n');
}

/** @param {{name: string, phone: string}} contact */
export function buildVCard({ name, phone }) {
	const lines = [
		'BEGIN:VCARD',
		'VERSION:3.0',
		`FN:${escapeVCardValue(name)}`,
		`TEL;TYPE=CELL:${escapeVCardValue(phone)}`,
		'END:VCARD',
	];
	return lines.join('\r\n') + '\r\n';
}

/** A filesystem-safe filename for the download — falls back to a plain
 * "contact.vcf" when the name is empty or has nothing letter/number-like
 * in it (e.g. was left blank, or typed as just punctuation). */
export function vcardFilename(name) {
	const safe = (name ?? '')
		.trim()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '');
	return `${safe || 'contact'}.vcf`;
}
