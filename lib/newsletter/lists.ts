import type { LeadForm } from "../leads";

/**
 * The two lists the site sends to. Tide is the monthly letter on home sales
 * (the `letter` form); Encore is the Monday arts email (the `calendar` form).
 * No imports beyond types, so the unit tests and scripts/check-copy.mjs can
 * load it under plain Node.
 */

export const NEWSLETTER_LISTS = ["tide", "encore"] as const;
export type NewsletterList = (typeof NEWSLETTER_LISTS)[number];

export const isNewsletterList = (v: unknown): v is NewsletterList => typeof v === "string" && (NEWSLETTER_LISTS as readonly string[]).includes(v);

/** The product's name as a reader knows it. */
export const LIST_NAME: Record<NewsletterList, string> = { tide: "Tide", encore: "Encore" };

/**
 * Which lists a form submission asks for. The Tide and Encore boxes are the
 * request itself. On every other form the email box ("Yes, you can email me
 * about the market and my search", CONSENT_EMAIL_WORDING) asks for email
 * about the market, which is Tide. Nothing is asked for without consent.
 */
export function listsForLead(form: LeadForm, consentEmail: boolean): NewsletterList[] {
  if (form === "letter") return ["tide"];
  if (form === "calendar") return ["encore"];
  return consentEmail ? ["tide"] : [];
}
