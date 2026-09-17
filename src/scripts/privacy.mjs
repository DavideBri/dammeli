// The privacy page: which providers this runs on, what they can and can't
// see, and what stays only on the visitor's own device. Same static,
// bilingual pattern as how-it-works.mjs — no separate content pipeline for
// one more page.

import { detectLang, t } from '../lib/i18n.mjs';
import { getSavedTheme, applyTheme } from '../lib/theme.mjs';
import * as ui from './ui.mjs';

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

	const sections = ['see', 'dont', 'providers', 'device'].map((key) => ({
		title: t(lang, `privacy.${key}Title`),
		body: t(lang, `privacy.${key}Body`),
	}));

	document.querySelector('[data-sections]').replaceChildren(
		...sections.map((section) => {
			const el = document.createElement('div');
			el.className = 'privacy-section';
			const h2 = document.createElement('h2');
			h2.textContent = section.title;
			const p = document.createElement('p');
			p.textContent = section.body;
			el.append(h2, p);
			return el;
		}),
	);

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
