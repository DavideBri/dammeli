// The "How it works" page: three short, animated, literal scenes instead
// of a wall of text — explain-like-I'm-five, not a technical writeup.
// Still bilingual through the same i18n system as the rest of the app.

import { detectLang, t } from '../lib/i18n.mjs';
import { getSavedTheme, applyTheme } from '../lib/theme.mjs';
import * as ui from './ui.mjs';

const SCENE1_METHODS = ['satispay', 'paypal', 'revolut', 'iban'];

/** Scene 1: the real method tiles from the editor itself — nothing drawn
 * just for this page, so it's instantly recognizable, not an abstraction. */
function buildScene1() {
	const row = document.createElement('div');
	row.className = 'how-scene1-row';
	for (const type of SCENE1_METHODS) {
		row.appendChild(ui.methodTile({ type, size: 56 }));
	}
	return row;
}

/** Scene 2: a padlock snapping shut over a few "unreadable" dashes —
 * everything you entered, scrambled, right on your own phone. */
function buildScene2() {
	const wrap = document.createElement('div');
	wrap.innerHTML = `
		<svg class="how-scene2-art" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
			<g class="how-cipher">
				<rect x="52" y="96" width="26" height="8" rx="4"></rect>
				<rect x="86" y="96" width="14" height="8" rx="4"></rect>
				<rect x="108" y="96" width="34" height="8" rx="4"></rect>
				<rect x="64" y="110" width="18" height="8" rx="4"></rect>
				<rect x="90" y="110" width="30" height="8" rx="4"></rect>
				<rect x="128" y="110" width="14" height="8" rx="4"></rect>
			</g>
			<g class="how-lock-shackle">
				<path d="M78 62V46a22 22 0 0 1 44 0v16" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"></path>
			</g>
			<rect class="how-lock-body" x="62" y="62" width="76" height="56" rx="12" stroke="currentColor" stroke-width="5"></rect>
			<circle cx="100" cy="84" r="6" fill="currentColor"></circle>
			<line x1="100" y1="90" x2="100" y2="100" stroke="currentColor" stroke-width="6" stroke-linecap="round"></line>
		</svg>`;
	return wrap.firstElementChild;
}

/** Scene 3: a link travelling from one phone to another — sharing, not
 * uploading anywhere in between. */
function buildScene3() {
	const wrap = document.createElement('div');
	wrap.innerHTML = `
		<svg class="how-scene3-art" viewBox="0 0 280 140" aria-hidden="true" focusable="false">
			<rect class="how-phone" x="18" y="26" width="52" height="90" rx="11" stroke="currentColor" stroke-width="5"></rect>
			<line x1="34" y1="102" x2="54" y2="102" stroke="currentColor" stroke-width="5" stroke-linecap="round"></line>
			<rect class="how-phone" x="210" y="26" width="52" height="90" rx="11" stroke="currentColor" stroke-width="5"></rect>
			<line x1="226" y1="102" x2="246" y2="102" stroke="currentColor" stroke-width="5" stroke-linecap="round"></line>
			<line class="how-dash-path" x1="74" y1="62" x2="206" y2="62" stroke-width="3" stroke-dasharray="7 9"></line>
			<g class="how-link-travel">
				<circle r="13" stroke="currentColor" stroke-width="4"></circle>
				<path d="M-5 0h10M0 -5v10" stroke-width="2.6" stroke-linecap="round"></path>
			</g>
		</svg>`;
	return wrap.firstElementChild;
}

function buildScene(art, caption, tagline) {
	const card = document.createElement('div');
	card.className = 'ds-card ds-card--sunken how-scene';
	card.appendChild(art);
	const p = document.createElement('p');
	p.className = 'how-scene__caption';
	p.textContent = caption;
	card.appendChild(p);
	if (tagline) {
		const small = document.createElement('p');
		small.className = 'how-scene__tagline';
		small.textContent = tagline;
		card.appendChild(small);
	}
	return card;
}

export function initHowItWorks() {
	applyTheme(getSavedTheme());
	const lang = detectLang();
	document.documentElement.lang = lang;
	document.title = `${t(lang, 'howItWorks.title')} — dammeli`;

	const { header } = ui.topBar({
		// No `title` here: the page's own <h1> below already says
		// "Come funziona"/"How it works" — showing it twice (topbar + h1)
		// was redundant, so the topbar falls back to the wordmark instead.
		onBack: () => {
			location.href = '/';
		},
		backLabel: t(lang, 'nav.back'),
	});
	document.querySelector('[data-topbar]').replaceChildren(header);

	document.querySelector('[data-title]').textContent = t(lang, 'howItWorks.title');

	document.querySelector('[data-scenes]').replaceChildren(
		buildScene(buildScene1(), t(lang, 'howItWorks.scene1Caption')),
		buildScene(buildScene2(), t(lang, 'howItWorks.scene2Caption')),
		buildScene(buildScene3(), t(lang, 'howItWorks.scene3Caption'), t(lang, 'howItWorks.scene3Tagline')),
	);

	const privacyLink = document.createElement('a');
	privacyLink.href = '/privacy';
	privacyLink.className = 'ds-text-accent';
	privacyLink.textContent = t(lang, 'howItWorks.privacyLink');
	document.querySelector('[data-privacy-line]').replaceChildren(`${t(lang, 'howItWorks.privacyQuestion')} `, privacyLink);

	const ctaBtn = ui.button({
		variant: 'primary',
		size: 'lg',
		full: true,
		text: t(lang, 'howItWorks.cta'),
		onClick: () => {
			location.href = '/';
		},
	});
	document.querySelector('[data-cta]').replaceChildren(ctaBtn);
}
