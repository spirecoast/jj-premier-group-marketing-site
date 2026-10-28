import { z } from "zod";
import type { FubEventType } from "@/lib/fub";
import { parsePhone } from "@/lib/phone";
import { LEAD_CHANNELS, LEAD_FORMS, REFERRAL_PLANS, type LeadErrorField, type LeadForm } from "./constants";
import { validateLead } from "./rules";
import { placeTarget, streetTarget, type WatchTarget } from "../watch/target";

/** The street or place a Watch form asks for, or null. */
export function watchTargetFrom(d: { watchStreet?: string; watchZip?: string; watchPlace?: string; watchName?: string }): WatchTarget | null {
  if (d.watchPlace) return placeTarget(d.watchPlace, d.watchName ?? "");
  if (d.watchStreet) return streetTarget(d.watchStreet, d.watchZip ?? "");
  return null;
}

/**
 * The server's view of a lead form: zod, which never reaches the browser.
 * Only the server action, the JSON route and the pipeline import this file;
 * the forms import ./constants and ./rules. The checks that decide whether a
 * form can be sent live in ./rules (validateLead), which this schema calls,
 * so the browser and the server can't disagree about them.
 */

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
  watch: "Registration",
};

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

const fields = z.object({
  form: z.enum(LEAD_FORMS),
  firstName: z.string().trim().max(100).optional().default(""),
  lastName: z.string().trim().max(100).optional().default(""),
  /** Required on the subscribe bars and the review permission; elsewhere an email or a phone is enough (./rules). */
  email: z.string().trim().max(320).optional().default(""),
  /** Left as posted (undefined when the form has no phone box, "" when it was left empty): the rules need the difference. */
  phone: z.string().trim().max(40).optional(),
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
  /** Referral form: the person moving. Their first name, an email or a phone, and what they're planning. */
  referredName: optionalText(100),
  referredLastName: optionalText(100),
  referredEmail: optionalText(320),
  referredPhone: optionalText(40),
  /** One of REFERRAL_PLANS; anything else is dropped, never an error. */
  referredPlan: z.enum(REFERRAL_PLANS).optional().catch(undefined),
  /** Referral form: the box saying they know their details are being passed along. */
  referralConsent: checkbox,
  /** Review-permission form: the box under the words. */
  reviewConsent: checkbox,
  /** Street Watch (the Watch buttons): a street as the county spells it with its ZIP, or an Atlas place's slug and name. */
  watchStreet: optionalText(80),
  watchZip: optionalText(10),
  watchPlace: optionalText(80),
  watchName: optionalText(120),
  /** Calls and texts. */
  consent: checkbox,
  /** Email. */
  consentEmail: checkbox,
  /** "true" when Home Platform's pixel will have sent this form to the CRM itself (components/home-platform-fields.tsx). */
  homePlatformPixel: checkbox,
  /** A random id the form makes for each attempt it sends, so a resend of the same submission is recognised (lib/lead-guard.ts). */
  submissionId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v.toLowerCase() : undefined)),
  // Honeypot — hidden from people, filled by bots. Any value means a bot.
  website: z.string().optional(),
});

export const leadSchema = fields
  .superRefine((d, ctx) => {
    // The same rules the browser ran (./rules).
    const errors = validateLead(d.form, {
      firstName: d.firstName,
      email: d.email,
      ...(d.phone === undefined ? {} : { phone: d.phone }),
      address: d.address,
      message: d.message,
      referredName: d.referredName,
      referredEmail: d.referredEmail,
      referredPhone: d.referredPhone,
      referralConsent: d.referralConsent ? "on" : "",
      reviewConsent: d.reviewConsent ? "on" : "",
    });
    for (const [path, message] of Object.entries(errors)) ctx.addIssue({ code: "custom", path: [path], message });
    // A watch needs something to watch; the buttons always send it, so a miss is a tampered form.
    if (d.form === "watch" && !watchTargetFrom(d)) ctx.addIssue({ code: "custom", path: ["watchStreet"], message: "Nothing to watch" });
  })
  .transform((d) => {
    // Phones leave here tidy: "(941) 555-0100" for a US number, with the E.164 form beside it.
    const phone = parsePhone(d.phone);
    const referredPhone = parsePhone(d.referredPhone);
    return {
      ...d,
      email: d.email.toLowerCase(),
      phone: phone?.display,
      phoneE164: phone?.e164,
      referredEmail: d.referredEmail?.toLowerCase(),
      referredPhone: referredPhone?.display,
      referredPhoneE164: referredPhone?.e164,
    };
  });

export type LeadInput = z.output<typeof leadSchema>;

const RENDERED = new Set<string>(["firstName", "email", "phone", "address", "message", "referredName", "referredEmail", "referredPhone", "referralConsent", "reviewConsent"]);

export type LeadParse =
  | { ok: true; data: LeadInput }
  | { ok: false; errors: Partial<Record<LeadErrorField, string>>; hidden: string[] };

/**
 * Parse posted strings into a lead, or the first message for each field that
 * has one. `hidden` lists anything wrong with a field the visitor can't see
 * (a hidden input, a tampered value), which the form can only report as a
 * general failure.
 */
export function parseLead(raw: Record<string, unknown>): LeadParse {
  const parsed = leadSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: Partial<Record<LeadErrorField, string>> = {};
  const hidden: string[] = [];
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (RENDERED.has(key)) errors[key as LeadErrorField] ??= issue.message;
    else hidden.push(key || "(form)");
  }
  return { ok: false, errors, hidden };
}
