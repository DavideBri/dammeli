// Method marks for the dammeli design system. Satispay/Revolut/PayPal are
// each brand's own real mark (sourced from SVG Repo, recolored to
// currentColor so they tint like the rest of the design system — see
// src/vendor/README.md for provenance/licensing per file); IBAN and the
// generic "other methods" mark are drawn for this project, since neither
// has a brand logo to use. Same vendoring reasoning as icons.mjs: no
// network fetch, ever. Each entry keeps its own source viewBox rather than
// being renormalized to a shared one — SVG scales proportionally to
// whatever width/height it's given, so a different viewBox doesn't need
// different call-site math, only right sizing at render time.
const METHOD_MARKS = {
	satispay: {
		viewBox: '0 0 48 48',
		content: `<g fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="17 37.8 3.2 24 17.1 10.2"></polyline>
			<polygon points="31.3 24 11.8 4.5 25.3 4.5 44.8 24 25.3 43.5 11.8 43.5 31.3 24"></polygon>
			<polyline points="23.8 31.1 16.7 24 23.8 16.9"></polyline>
			<polyline points="25.3 4.5 37.6 4.5 31.6 10.5"></polyline>
			<polyline points="31.6 37.5 37.6 43.5 25.3 43.5"></polyline>
		</g>`,
	},
	revolut: {
		viewBox: '0 0 192 192',
		content: `<path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="13" d="M99 22c-13.415 0-29.564 1.953-38.077 3.13-3.521.486-6.226 3.294-6.667 6.82L39.138 152.897c-1.154 9.233 5.793 17.672 15.093 17.36 7.908-.265 14.743-1.197 20.936-3.119 5.049-1.567 8.26-6.27 8.974-11.508L89 120l14.191 39.42c2.285 6.348 8.318 10.693 15.053 10.29 10.248-.611 18.11-2.294 27.788-5.98 4.703-1.791 6.264-7.558 3.671-11.871C139.848 135.468 136.165 121.216 131 104c0 0 22-14 22-38 0-36-30-44-54-44Z"></path><path fill="currentColor" d="m85.929 87.19 4.363-32c.406-2.974 2.95-5.235 5.94-4.984C112.14 51.539 117.362 59.302 116 72c-1.142 10.655-7.352 19.734-24.13 21.635-3.613.409-6.433-2.843-5.941-6.446Z"></path>`,
	},
	paypal: {
		viewBox: '0 0 32 32',
		content: `<path fill="currentColor" d="M9.961 26.732h-6.739c-0.273 0-0.536-0.12-0.711-0.334s-0.246-0.487-0.197-0.76l4.321-23.505c0.257-1.285 1.313-2.139 2.637-2.139h10.371c4.168 0 6.974 2.664 6.974 6.63 0 3.999-2.757 11.465-9.392 11.465h-4.535l-1.827 7.926c-0.098 0.421-0.47 0.717-0.903 0.717zM4.332 24.889l4.896-0 1.822-7.926c0.098-0.421 0.47-0.717 0.903-0.717h5.273c5.268 0 7.543-6.367 7.543-9.616 0-2.948-1.964-4.781-5.125-4.781h-10.371c-0.257 0-0.711 0.082-0.82 0.64zM13.161 32.005l-6.739 0c-0.274 0-0.531-0.12-0.706-0.328s-0.252-0.487-0.202-0.755l0.864-4.923c0.088-0.503 0.563-0.837 1.067-0.749s0.837 0.569 0.749 1.067l-0.673 3.84h4.896l1.745-8.003c0.093-0.427 0.47-0.728 0.903-0.728h5.273c5.268 0 7.543-6.367 7.543-9.616 0-2.117-0.892-3.577-2.642-4.338-0.465-0.202-0.684-0.749-0.476-1.214 0.202-0.47 0.749-0.684 1.214-0.481 2.418 1.050 3.752 3.195 3.752 6.034 0 3.999-2.757 11.465-9.392 11.465h-4.529l-1.745 8.003c-0.093 0.427-0.47 0.728-0.903 0.728h0zM14.37 12.909h-1.816c-0.274 0-0.531-0.12-0.711-0.334-0.175-0.208-0.252-0.487-0.202-0.755l1.214-6.739c0.077-0.438 0.46-0.76 0.908-0.76h2.937c1.11 0 1.997 0.356 2.56 1.023 0.613 0.728 0.815 1.761 0.596 3.080-0.443 3.134-2.084 4.485-5.486 4.485zM13.659 11.060l0.711-0c2.746 0 3.391-0.985 3.665-2.921 0.088-0.542 0.126-1.236-0.18-1.603-0.257-0.306-0.771-0.366-1.154-0.366h-2.166l-0.875 4.89z"></path>`,
	},
	iban: {
		viewBox: '0 0 24 24',
		content: `<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
			<path d="M3.5 9.5 12 4.5l8.5 5"></path><path d="M5.5 9.5v8M10 9.5v8M14 9.5v8M18.5 9.5v8"></path><path d="M3 20.5h18"></path>
		</g>`,
	},
	crypto: {
		viewBox: '0 0 24 24',
		content: `<path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"></path>`,
	},
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
	const mark = METHOD_MARKS[type] ?? METHOD_MARKS.crypto;
	return `<svg width="${size}" height="${size}" viewBox="${mark.viewBox}" aria-hidden="true">${mark.content}</svg>`;
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
