// Payment methods with no direct pay-link: the app only lets you send
// money to someone already in your phone's contacts, found by name. For
// these, the creation flow asks for a name alongside the usual handle
// (PLAN.md section 7), so the read-only page can offer a one-tap "save
// contact" (a vCard) that gets the creator into the payer's contacts
// before they even open the app.
//
// A single source of truth for editor.mjs and viewer.mjs, so the two
// never drift on which methods this applies to — adding a future method
// here is the only change needed to give it the name field, the vCard
// download, and the cross-method "reuse this contact" suggestion.

export const CONTACT_BASED_METHODS = ['satispay'];

export function isContactBased(type) {
	return CONTACT_BASED_METHODS.includes(type);
}

/**
 * Custom URL schemes that open the method's own app, for whoever already
 * has it installed and just needs the contact (saved via the vCard above)
 * to actually send the money — there's no way to encode a recipient or
 * amount into these, only "open the app".
 *
 * Confirmed on iOS Safari only. No documented Android intent-link exists
 * for Satispay, so the button this powers is iOS-only rather than a
 * silent no-op on Android (same honesty bar as viewer.mjs's
 * buildDirectLink: don't claim confidence we don't have).
 */
export const APP_SCHEMES = {
	satispay: 'satispay://',
};
