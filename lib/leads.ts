import { z } from "zod";
import type { FubEventType } from "@/lib/fub";

/**
 * Shared lead-form contract: the forms, their CRM event types, the schema
 * and the state shape. The server action in actions/submit-lead.ts imports
 * from here so it can export nothing but the action itself.
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
] as const;
export type LeadForm = (typeof LEAD_FORMS)[number];

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

/** Follow Up Boss event type per form, used only when CRM_PROVIDER=fub. */
export const FUB_TYPE: Record<LeadForm, FubEventType> = {
  contact: "General Inquiry",
  buy: "General Inquiry",
  sell: "Seller Inquiry",
  listing: "Property Inquiry",
  valuation: "Seller Inquiry",
  letter: "Registration",
  calendar: "Registration",
  referral: "General Inquiry",
  "review-permission": "General Inquiry",
};

/**
 * Forms that only ask for an email address. Subscribing to the report or the
 * calendar is itself the request for email, so these imply email consent.
 */
export const EMAIL_ONLY_FORMS: readonly LeadForm[] = ["letter", "calendar"];

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
 * permission on /reviews). Their leads never carry marketing consent, whatever
 * was posted, and record this version instead of the checkbox wording's.
 */
export const NO_MARKETING_CONSENT_FORMS: readonly LeadForm[] = ["review-permission"];
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

/** The "is there a house to sell first?" answers, asked on the buy form. */
export const SELL_FIRST_OPTIONS = ["Yes", "No", "Not sure yet"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

export const leadSchema = z
  .object({
    form: z.enum(LEAD_FORMS),
    firstName: z.string().trim().max(100).optional().default(""),
    lastName: z.string().trim().max(100).optional().default(""),
    email: z.string().trim().email("A working email address is required").max(320),
    phone: optionalText(40),
    message: optionalText(5000),
    timing: optionalText(200),
    sellFirst: optionalText(40),
    market: optionalText(40),
    address: optionalText(300),
    propertySlug: optionalText(200),
    propertyTitle: optionalText(200),
    propertyStreet: optionalText(200),
    propertyCity: optionalText(100),
    propertyState: optionalText(40),
    propertyZip: optionalText(10),
    propertyPrice: optionalText(20),
    propertyMls: optionalText(40),
    pageUrl: optionalText(2000),
    pageTitle: optionalText(300),
    /** The /from/<channel> the visitor came through; anything else is dropped, never an error. */
    source: z.enum(LEAD_CHANNELS).optional().catch(undefined),
    /** Referral form: the first name of the person moving. Nothing else about them is asked. */
    referredName: optionalText(100),
    /** Review-permission form: the box under the words. */
    reviewConsent: checkbox,
    /** Calls and texts. */
    consent: checkbox,
    /** Email. */
    consentEmail: checkbox,
    // Honeypot — hidden from people, filled by bots. Any value means a bot.
    website: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (!EMAIL_ONLY_FORMS.includes(d.form) && !d.firstName) {
      ctx.addIssue({ code: "custom", path: ["firstName"], message: "Your name, please" });
    }
    if (d.form === "valuation" && !d.address) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "The street address to value" });
    }
    if (d.form === "referral" && !d.referredName) {
      ctx.addIssue({ code: "custom", path: ["referredName"], message: "Their first name, please" });
    }
    if (d.form === "review-permission" && !d.message) {
      ctx.addIssue({ code: "custom", path: ["message"], message: "The words you’d like to share" });
    }
    if (d.form === "review-permission" && !d.reviewConsent) {
      ctx.addIssue({ code: "custom", path: ["reviewConsent"], message: "Tick the box so we can use your words" });
    }
  });

export type LeadInput = z.infer<typeof leadSchema>;

export type LeadFormState = {
  ok: boolean;
  errors?: Partial<Record<keyof LeadInput, string[]>>;
  formError?: string;
  /** Which form was submitted, echoed for the confirmation copy. */
  form?: LeadForm;
  /** The thank-you page to go to. With JavaScript off the inline state shows instead. */
  redirectTo?: string;
};

export const initialLeadState: LeadFormState = { ok: false };

/** The thank-you page for a form, with the market carried along for the analytics goal. */
export function thanksPath(form: LeadForm, market?: string): string {
  const qs = market ? `?market=${encodeURIComponent(market)}` : "";
  return `/thanks/${form}${qs}`;
}
