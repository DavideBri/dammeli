// The "How it works" page: a short, non-technical explanation of the
// privacy model, linked from wherever the app invites someone to create
// their own page. Static content, but still bilingual through the same
// i18n system as the rest of the app — no separate content pipeline for
// one extra page.

import { detectLang, t } from '../lib/i18n.mjs';
import { getSavedTheme, applyTheme } from '../lib/theme.mjs';
import * as ui from './ui.mjs';

const STEP_ICONS = ['banknote', 'eye', 'bookmark', 'clipboard-check'];

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
	document.querySelector('[data-intro]').textContent = t(lang, 'howItWorks.intro');

	const steps = ['step1', 'step2', 'step3', 'step4'].map((key, i) => ({
		icon: STEP_ICONS[i],
		title: t(lang, `howItWorks.${key}Title`),
		body: t(lang, `howItWorks.${key}Body`),
	}));

	const stepsRoot = document.querySelector('[data-steps]');
	stepsRoot.replaceChildren(
		...steps.map((step) => {
			const row = document.createElement('div');
			row.className = 'how-step';

			const iconWrap = document.createElement('span');
			iconWrap.className = 'how-step__icon';
			iconWrap.appendChild(ui.icon(step.icon, { size: 20, strokeWidth: 1.75 }));
			row.appendChild(iconWrap);

			const body = document.createElement('div');
			body.className = 'how-step__body';
			const h3 = document.createElement('h3');
			h3.textContent = step.title;
			const p = document.createElement('p');
			p.textContent = step.body;
			body.append(h3, p);
			row.appendChild(body);

			return row;
		}),
	);

	const privacyLink = document.createElement('a');
	privacyLink.href = '/privacy';
	privacyLink.className = 'ds-text-accent how-privacy-link';
	privacyLink.textContent = t(lang, 'howItWorks.privacyLink');

	document.querySelector('[data-hosting-notice]').replaceChildren(
		ui.notice({
			iconName: 'info',
			title: t(lang, 'howItWorks.hostingTitle'),
			body: t(lang, 'howItWorks.hostingBody'),
		}),
		privacyLink,
	);

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
