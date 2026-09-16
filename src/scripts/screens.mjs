// Switches between the app's four full-screen states (editor, created,
// your-pages, viewer). Plain visibility toggling on in-memory DOM, never
// a `location.hash` change — the fragment stays reserved for the read/
// write link the app was opened with (constraint C2, PLAN.md section 2).

export function showScreen(name) {
	for (const el of document.querySelectorAll('[data-screen]')) {
		el.hidden = el.dataset.screen !== name;
	}
}
