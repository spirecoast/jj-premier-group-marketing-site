/**
 * Which of a lead form's fields Home Platform's pixel may see (lib/home-platform.ts).
 *
 * The pixel reads every named field of a form as it's typed and sends it to
 * the CRM. It should only ever get what identifies the visitor: their own
 * name, email and phone, plus the two questions (no one's personal details).
 * Everything else, the message, the address and every field about a person
 * being referred, keeps its `name` only until the page is live; after that
 * the name moves to `data-private-name` and the form adds the value to the
 * request itself when it's sent (components/lead-form.tsx). Without
 * JavaScript there's no pixel, and every field posts as usual.
 */

export const PIXEL_VISIBLE_FIELDS = ["firstName", "lastName", "email", "phone", "timing", "sellFirst"] as const;

/** Every visible field name a LeadForm can render. */
export const LEAD_FORM_FIELD_NAMES = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "timing",
  "sellFirst",
  "address",
  "message",
  "referredName",
  "referredLastName",
  "referredEmail",
  "referredPhone",
  "referredPlan",
] as const;

const visible = new Set<string>(PIXEL_VISIBLE_FIELDS);

/** The attributes that carry a field's name: `name` while the page isn't live or the pixel may see it, `data-private-name` otherwise. */
export function fieldName(name: string, live: boolean): { name: string } | { "data-private-name": string } {
  return !live || visible.has(name) ? { name } : { "data-private-name": name };
}
