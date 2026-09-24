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

/** Event type per form — only these types trigger action plans and automations. */
export const FUB_TYPE: Record<LeadForm, FubEventType> = {
  contact: "General Inquiry",
  buy: "General Inquiry",
  sell: "Seller Inquiry",
  listing: "Property Inquiry",
  valuation: "Seller Inquiry",
  letter: "Registration",
  calendar: "Registration",
};

/** Forms that only ask for an email address. */
export const EMAIL_ONLY_FORMS: readonly LeadForm[] = ["letter", "calendar"];

/**
 * Consent wording, drafted for legal review (COMPLIANCE.md §2). Rendered next
 * to an unchecked box; submission never depends on it.
 */
export const CONSENT_WORDING =
  "I agree to receive calls and text messages from JJ Premier Group at the number provided, including messages sent by automated means. Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. Reply STOP to opt out, HELP for help.";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const leadSchema = z
  .object({
    form: z.enum(LEAD_FORMS),
    firstName: z.string().trim().max(100).optional().default(""),
    lastName: z.string().trim().max(100).optional().default(""),
    email: z.string().trim().email("A working email address is required").max(320),
    phone: optionalText(40),
    message: optionalText(5000),
    timing: optionalText(200),
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
    consent: z
      .union([z.literal("on"), z.literal("true"), z.literal("")])
      .optional()
      .transform((v) => v === "on" || v === "true"),
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
};

export const initialLeadState: LeadFormState = { ok: false };
