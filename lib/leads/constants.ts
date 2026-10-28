/**
 * The lead forms' shared contract, with no imports: the form kinds, the
 * channels, the choices the forms offer, the consent wording and the state
 * a form gets back. Client components (the forms, the UTM tracker) import
 * from here and from ./rules; only the server imports ./schema, which pulls
 * in zod. Keeping zod out of this file keeps it out of every page's bundle.
 */

export const LEAD_FORMS = [
  "contact",
  "buy",
  "sell",
  "listing",
  "valuation",
  "letter",
  "calendar",
  "referral",
  "review-permission",
  "watch",
] as const;
export type LeadForm = (typeof LEAD_FORMS)[number];

export function isLeadForm(value: unknown): value is LeadForm {
  return typeof value === "string" && (LEAD_FORMS as readonly string[]).includes(value);
}

/**
 * The social channels with a landing page at /from/<channel>. A lead that
 * came through one carries `source:<channel>` (hidden `source` field, or the
 * session's channel; components/utm-tracker.tsx).
 */
export const LEAD_CHANNELS = ["youtube", "instagram", "facebook", "nextdoor"] as const;
export type LeadChannel = (typeof LEAD_CHANNELS)[number];

export function isLeadChannel(value: unknown): value is LeadChannel {
  return typeof value === "string" && (LEAD_CHANNELS as readonly string[]).includes(value);
}

/**
 * Forms that only ask for an email address. Subscribing to the report or the
 * calendar, or asking to watch a street (Street Watch), is itself the request
 * for that email, so these imply consent to it.
 */
export const EMAIL_ONLY_FORMS: readonly LeadForm[] = ["letter", "calendar", "watch"];

/**
 * Forms where the visitor's email is required whatever else they give: the
 * two subscribe bars (the email is the subscription) and the review
 * permission (the words are matched to a person later). Everywhere else an
 * email or a phone number is enough (lib/leads/rules.ts).
 */
export const EMAIL_REQUIRED_FORMS: readonly LeadForm[] = ["letter", "calendar", "watch", "review-permission"];

/**
 * The Plausible goal each form counts toward. A referral is a lead (the
 * `form` prop tells it apart); a review permission is not, so it has its own.
 */
export const LEAD_GOAL: Record<LeadForm, "Lead" | "Subscribe" | "Review permission"> = {
  contact: "Lead",
  buy: "Lead",
  sell: "Lead",
  listing: "Lead",
  valuation: "Lead",
  letter: "Subscribe",
  calendar: "Subscribe",
  referral: "Lead",
  "review-permission": "Review permission",
  watch: "Subscribe",
};

/**
 * Consent wording, drafted for legal review (COMPLIANCE.md §2). Rendered next
 * to unchecked boxes; submission never depends on either.
 *
 * Bump CONSENT_WORDING_VERSION whenever either string changes: the version is
 * stored with every lead so a consent record can be matched to the words the
 * visitor actually saw.
 */
export const CONSENT_WORDING_VERSION = "2026-10-01.2";

/**
 * The Tide and Encore boxes have no checkbox: subscribing is the request for
 * email, so those leads carry this version instead of the checkbox wording's.
 */
export const IMPLIED_CONSENT_VERSION = "implied:subscribe";

/**
 * Forms that show neither the email nor the call/text box (the review
 * permission on /reviews, the referral on /refer, where the person filling
 * it in is doing the team a favour). Their leads never carry marketing
 * consent, whatever was posted, and record this version instead of the
 * checkbox wording's.
 */
export const NO_MARKETING_CONSENT_FORMS: readonly LeadForm[] = ["review-permission", "referral"];
export const NOT_SHOWN_CONSENT_VERSION = "none:not-shown";

/** Email: plain, two sentences, no marketing-speak. */
export const CONSENT_EMAIL_WORDING =
  "Yes, you can email me about the market and my search. I can stop any time by replying 'stop' to any email.";

/** Calls and texts (TCPA). */
export const CONSENT_WORDING =
  "I agree to receive calls and text messages from JJ Premier Group at the number provided, including messages sent by automated means. Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help.";

/**
 * The review-permission box (/reviews). Required on that form only: it is the
 * whole point of the form. Stored with its own version; nothing from the form
 * is shown on the site until a person enters the words in Sanity by hand.
 */
export const REVIEW_CONSENT_WORDING =
  "You can use these words on the site with my first name and the place we bought or sold.";
export const REVIEW_CONSENT_VERSION = "review:2026-10-01.1";

/**
 * The referral box (/refer). Required on that form: the referrer confirms the
 * person knows their details are being passed along and expects to hear from
 * the team. Stored with its own version on the lead's `referral` so the
 * words the referrer ticked can be matched later.
 */
export const REFERRAL_CONSENT_WORDING = "They know I’m passing their details along and expect to hear from Joelyn and Jessica.";
export const REFERRAL_CONSENT_VERSION = "referral:2026-10-01.1";

/** What the person being referred is planning: the options in the select on /refer, in this order. */
export const REFERRAL_PLANS = ["Buying", "Selling", "Moving here"] as const;
export type ReferralPlan = (typeof REFERRAL_PLANS)[number];

/**
 * "When are you moving?": the value stored and sent to the CRM, and the
 * shorter label on the chip (the question above it carries the rest).
 */
export const TIMING_OPTIONS = [
  { value: "Inside three months", chip: "Inside three months" },
  { value: "Three to six months", chip: "3 to 6", sr: "months" },
  { value: "Six to twelve months", chip: "6 to 12", sr: "months" },
  { value: "Just watching the market", chip: "Just watching" },
] as const;

/** The "is there a house to sell first?" answers. */
export const SELL_FIRST_OPTIONS = ["Yes", "No", "Not sure yet"] as const;
/** Their chip labels, in the same order. */
export const SELL_FIRST_CHIPS: Record<(typeof SELL_FIRST_OPTIONS)[number], string> = { Yes: "Yes", No: "No", "Not sure yet": "Not sure" };

/** Every field a form can show an error on, keyed by the posted name. */
export type LeadErrorField =
  | "firstName"
  | "email"
  | "phone"
  | "address"
  | "message"
  | "referredName"
  | "referredEmail"
  | "referredPhone"
  | "referralConsent"
  | "reviewConsent";

export type LeadFormState = {
  ok: boolean;
  /** One message per field, the first that applies. */
  errors?: Partial<Record<LeadErrorField, string>>;
  formError?: string;
  /**
   * What was posted, minus the honeypot and the hidden fields, so a form
   * rendered from this state (the no-JavaScript path) shows the visitor's
   * words again instead of empty boxes.
   */
  values?: Record<string, string>;
  /** Which form was submitted, echoed for the confirmation copy. */
  form?: LeadForm;
  /** The thank-you page to go to. With JavaScript off the inline state shows instead. */
  redirectTo?: string;
  /** True when a newsletter confirmation email went to the visitor (lib/newsletter): the success line says to check their inbox. */
  confirmEmail?: boolean;
};

export const initialLeadState: LeadFormState = { ok: false };

/** The words under the Send button when nothing kept the lead, or the request never came back. */
export const LEAD_FAILURE_MESSAGE = "We could not send that just now. Call or text us directly and we will pick it up from there.";

/** The thank-you page for a form, with the market carried along for the analytics goal. */
export function thanksPath(form: LeadForm, market?: string): string {
  const qs = market ? `?market=${encodeURIComponent(market)}` : "";
  return `/thanks/${form}${qs}`;
}
