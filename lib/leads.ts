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
] as const;
export type LeadForm = (typeof LEAD_FORMS)[number];

/** Follow Up Boss event type per form, used only when CRM_PROVIDER=fub. */
export const FUB_TYPE: Record<LeadForm, FubEventType> = {
  contact: "General Inquiry",
  buy: "General Inquiry",
  sell: "Seller Inquiry",
  listing: "Property Inquiry",
  valuation: "Seller Inquiry",
  letter: "Registration",
  calendar: "Registration",
};

/**
 * Forms that only ask for an email address. Subscribing to the report or the
 * calendar is itself the request for email, so these imply email consent.
 */
export const EMAIL_ONLY_FORMS: readonly LeadForm[] = ["letter", "calendar"];

/** The Plausible goal each form counts toward. */
export const LEAD_GOAL: Record<LeadForm, "Lead" | "Subscribe"> = {
  contact: "Lead",
  buy: "Lead",
  sell: "Lead",
  listing: "Lead",
  valuation: "Lead",
  letter: "Subscribe",
  calendar: "Subscribe",
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

/** Email: plain, two sentences, no marketing-speak. */
export const CONSENT_EMAIL_WORDING =
  "Yes, you can email me about the market and my search. I can stop any time by replying 'stop' to any email.";

/** Calls and texts (TCPA). */
export const CONSENT_WORDING =
  "I agree to receive calls and text messages from JJ Premier Group at the number provided, including messages sent by automated means. Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help.";

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
