// Switches between the app's four full-screen states (editor, created,
// your-pages, viewer). Plain visibility toggling on in-memory DOM, never
// a `location.hash` change — the fragment stays reserved for the read/
// write link the app was opened with (constraint C2, PLAN.md section 2).

export function showScreen(name) {
	for (const el of document.querySelectorAll('[data-screen]')) {
		el.hidden = el.dataset.screen !== name;
	}
}

/**
 * Follows a read/write/home link (an actual URL, not an in-app screen
 * switch) in a way that's guaranteed to re-run `boot()`. A plain
 * `<a href>`/`location.href =`/`window.open` to a URL that differs from
 * the current one only by its fragment never reloads the document —
 * that's standard browser behavior (the same "soft" navigation as
 * clicking a same-page `#section` anchor), not a bug specific to any one
 * browser — so `boot()` would never re-run and the app would keep
 * showing whatever it already rendered. Forces a real reload for that
 * case; anything that isn't same-page just navigates normally.
 */
export function navigateHard(url) {
	const target = new URL(url, location.href);
	const current = new URL(location.href);
	const samePage =
		target.origin === current.origin && target.pathname === current.pathname && target.search === current.search;
	if (samePage) {
		location.hash = target.hash;
		location.reload();
	} else {
		location.href = url;
	}
}
