// Fills the editor form from an already-decrypted payload (PLAN.md
// section 5), for opening an edit link on an existing page. Pure DOM
// writes, no fetch/decrypt here — src/scripts/app.mjs does that and
// hands this the parsed payload.

const MAIN_TYPES = new Set(['satispay', 'revolut', 'paypal', 'iban']);

export function prefillFromPayload(form, payload) {
	const titleInput = form.querySelector('[data-role="title"]');
	if (titleInput && payload.title) titleInput.value = payload.title;

	const methodsContainer = form.querySelector('#methods');
	const orderedMainCards = [];

	for (const entry of payload.methods) {
		if (MAIN_TYPES.has(entry.type)) {
			const card = methodsContainer.querySelector(`[data-method="${entry.type}"]`);
			if (!card) continue;
			const valueInput = card.querySelector('[data-role="value"]');
			if (valueInput) valueInput.value = entry.value;
			if (entry.type === 'iban' && entry.holder) {
				const holderInput = card.querySelector('[data-role="holder"]');
				if (holderInput) holderInput.value = entry.holder;
			}
			orderedMainCards.push(card);
		} else {
			// Everything else (bitcoin, and whatever future crypto types)
			// goes in the single "other methods" crypto card.
			const cryptoCard = form.querySelector('[data-method="crypto"]');
			if (!cryptoCard) continue;
			const valueInput = cryptoCard.querySelector('[data-role="value"]');
			if (valueInput) valueInput.value = entry.value;
			const typeSelect = cryptoCard.querySelector('[data-role="type"]');
			if (typeSelect) typeSelect.value = entry.type;
			const details = form.querySelector('#other-methods');
			if (details) details.open = true;
		}
	}

	// Move the filled cards to the front, in payload order — "order is
	// information" applies just as much on the way in as on the way out.
	// Cards with nothing to prefill keep their default position, after
	// the ones that got moved.
	for (const card of orderedMainCards) {
		methodsContainer.appendChild(card);
	}

	// Prefilled values don't go through the normal blur handler, so the
	// visual confirmation (PLAN.md section 7 point 4) wouldn't show up on
	// its own — ask every filled field to re-check itself.
	for (const input of form.querySelectorAll('[data-role="value"], [data-role="holder"]')) {
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}
}
