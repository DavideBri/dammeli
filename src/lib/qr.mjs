import { qrcode } from '../vendor/qrcode.mjs';

/**
 * Renders `text` as an inline SVG QR code. All the dark modules are
 * combined into a single <path> rather than one element per module —
 * plenty fast, and much less DOM for a code that can have 1000+ modules.
 */
export function renderQrCode(text, { cellSize = 4, margin = 4 } = {}) {
	const qr = qrcode(0, 'M'); // typeNumber 0 = auto-pick the smallest version that fits
	qr.addData(text);
	qr.make();

	const count = qr.getModuleCount();
	const size = count * cellSize + margin * 2;

	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
	svg.setAttribute('width', String(size));
	svg.setAttribute('height', String(size));
	svg.setAttribute('role', 'img');
	svg.setAttribute('aria-label', 'QR code for this link');

	const background = document.createElementNS(svg.namespaceURI, 'rect');
	background.setAttribute('width', String(size));
	background.setAttribute('height', String(size));
	background.setAttribute('fill', '#ffffff');
	svg.appendChild(background);

	const segments = [];
	for (let row = 0; row < count; row++) {
		for (let col = 0; col < count; col++) {
			if (qr.isDark(row, col)) {
				const x = margin + col * cellSize;
				const y = margin + row * cellSize;
				segments.push(`M${x} ${y}h${cellSize}v${cellSize}h${-cellSize}z`);
			}
		}
	}
	const path = document.createElementNS(svg.namespaceURI, 'path');
	path.setAttribute('d', segments.join(''));
	path.setAttribute('fill', '#000000');
	svg.appendChild(path);

	return svg;
}
