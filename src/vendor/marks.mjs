// Original marks for the dammeli design system — no third-party logos
// anywhere (see PLAN.md's brand notes and this repo's src/vendor/README.md):
// every payment method gets a small geometric mark drawn for this project
// instead of a real brand logo, and the product's own mark is a drawn
// fist-grabbing-a-banknote, not a stock icon. Same vendoring reasoning as
// icons.mjs: no network fetch, ever.

const METHOD_MARK_PATHS = {
	satispay: `<circle cx="12" cy="12" r="8.5"></circle><path d="M8 14.5c1.4 1.2 6.6 1.2 8-1.4-1.4-2.6-6.6-2.6-8-5.2 1.4-1.4 5-1.4 6.6 0"></path>`,
	revolut: `<path d="M7.5 20V4h5.2a4.4 4.4 0 0 1 0 8.8H9.4"></path><path d="M12.4 12.8 17 20"></path>`,
	paypal: `<path d="M6 19.5 8.6 4.5h5.1a3.9 3.9 0 0 1 0 7.8H9.7"></path><path d="M11.4 19.5 12.6 12"></path><path d="M14.4 8.3h2.3a3.6 3.6 0 0 1 0 7.2h-3.5"></path>`,
	iban: `<path d="M3.5 9.5 12 4.5l8.5 5"></path><path d="M5.5 9.5v8M10 9.5v8M14 9.5v8M18.5 9.5v8"></path><path d="M3 20.5h18"></path>`,
	crypto: `<path d="M12 5v14M5 12h14"></path>`,
};

/** Per-method tint (background) for the tile — from tokens/colors.css. */
export const METHOD_TINTS = {
	satispay: 'var(--rosso-400)',
	revolut: 'var(--paper-3)',
	paypal: 'var(--senape-100)',
	iban: 'var(--oliva-100)',
	crypto: 'var(--paper-2)',
};

export function methodMarkSvg(type, size = 24) {
	const d = METHOD_MARK_PATHS[type] ?? METHOD_MARK_PATHS.crypto;
	return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}

/** The product mark: a cartoon fist grabbing a banknote. Fixed colors — does
 * not inherit currentColor — so it reads the same on paper or on ink. */
export function logoMarkSvg(size = 32) {
	return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
<g stroke="#1A1714" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
<g transform="rotate(-15 32 26)">
<rect x="7" y="16" width="50" height="22" rx="3" fill="#D14A2B"></rect>
<rect x="11" y="9" width="43" height="24" rx="3" fill="#E2694B"></rect>
<circle cx="32" cy="17" r="3.8" fill="#FFFDF8"></circle>
</g>
<path d="M12 34a6 6 0 0 1 12 0 6 6 0 0 1 12 0 6 6 0 0 1 12 0v18a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V34Z" fill="#FFFDF8"></path>
<g stroke-width="2.4"><path d="M24 36.5v7M36 36.5v7"></path></g>
<path d="M16 40h18a6 6 0 0 1 0 12H16a6 6 0 0 1 0-12Z" fill="#FFFDF8" transform="rotate(-9 25 46)"></path>
</g>
</svg>`;
}
