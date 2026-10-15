// The privacy page: which providers this runs on, what they can and can't
// see, and what stays only on the visitor's own device. Same static,
// bilingual pattern as how-it-works.mjs — no separate content pipeline for
// one more page.
//
// Two layers on purpose: a scannable "at a glance" strip for whoever just
// wants the headline facts, and the full, specific sections below for
// whoever wants to actually check them — a privacy page earns trust with
// precision, not with a punchy one-liner alone.

import { detectLang, t } from '../lib/i18n.mjs';
import { getSavedTheme, applyTheme } from '../lib/theme.mjs';
import * as ui from './ui.mjs';

const SECTION_ICONS = { see: 'eye-off', dont: 'x', providers: 'server', device: 'smartphone' };

function buildFact(text) {
	const item = document.createElement('div');
	item.className = 'privacy-fact';
	item.appendChild(ui.icon('check', { size: 16, strokeWidth: 2.5 }));
	const span = document.createElement('span');
	span.textContent = text;
	item.appendChild(span);
	return item;
}

function buildSection(key, lang) {
	const el = document.createElement('div');
	el.className = 'privacy-section';
	const head = document.createElement('div');
	head.className = 'privacy-section__head';
	const iconWrap = document.createElement('span');
	iconWrap.className = 'privacy-section__icon';
	iconWrap.appendChild(ui.icon(SECTION_ICONS[key], { size: 18, strokeWidth: 1.9 }));
	const h2 = document.createElement('h2');
	h2.textContent = t(lang, `privacy.${key}Title`);
	head.append(iconWrap, h2);
	const p = document.createElement('p');
	p.textContent = t(lang, `privacy.${key}Body`);
	el.append(head, p);
	return el;
}

export function initPrivacy() {
	applyTheme(getSavedTheme());
	const lang = detectLang();
	document.documentElement.lang = lang;
	document.title = `${t(lang, 'privacy.title')} — dammeli`;

	const { header } = ui.topBar({
		// No `title` here: the page's own <h1> below already says "Privacy" —
		// showing it twice (topbar + h1) was redundant, so the topbar falls
		// back to the wordmark instead.
		onBack: () => {
			location.href = '/';
		},
		backLabel: t(lang, 'nav.back'),
	});
	document.querySelector('[data-topbar]').replaceChildren(header);

	document.querySelector('[data-title]').textContent = t(lang, 'privacy.title');
	document.querySelector('[data-intro]').textContent = t(lang, 'privacy.intro');

	document.querySelector('[data-quickfacts]').replaceChildren(
		buildFact(t(lang, 'privacy.factNoAccount')),
		buildFact(t(lang, 'privacy.factNoEmail')),
		buildFact(t(lang, 'privacy.factEncrypted')),
		buildFact(t(lang, 'privacy.factNoTracking')),
	);

	document.querySelector('[data-sections]').replaceChildren(
		...['see', 'dont', 'providers', 'device'].map((key) => buildSection(key, lang)),
	);

	const sourceLink = document.createElement('a');
	sourceLink.href = 'https://github.com/DavideBri/dammeli';
	sourceLink.target = '_blank';
	sourceLink.rel = 'noopener noreferrer';
	sourceLink.className = 'ds-text-accent';
	sourceLink.textContent = t(lang, 'privacy.sourceLink');
	document.querySelector('[data-source-line]').replaceChildren(t(lang, 'privacy.sourceLine'), sourceLink);

	document.querySelector('[data-beta-notice]').replaceChildren(
		ui.notice({
			tone: 'keep',
			iconName: 'circle-alert',
			title: t(lang, 'privacy.betaTitle'),
			body: t(lang, 'privacy.betaBody'),
		}),
	);

	const backBtn = ui.button({
		variant: 'secondary',
		size: 'md',
		text: t(lang, 'privacy.back'),
		onClick: () => {
			location.href = '/';
		},
	});
	document.querySelector('[data-back]').replaceChildren(backBtn);
}
