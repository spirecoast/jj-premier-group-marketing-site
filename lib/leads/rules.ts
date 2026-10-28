import { parsePhone } from "../phone";
import { EMAIL_REQUIRED_FORMS, type LeadErrorField, type LeadForm } from "./constants";

/**
 * The lead forms' rules, in one place and with no zod, so the same function
 * checks a form in the browser before it's sent (components/lead-form.tsx)
 * and on the server when it arrives (the zod schema in ./schema.ts calls it).
 * The server is still the one that decides: the browser check only saves a
 * round trip and puts the message by the field at once.
 *
 * `values` is what the form posts, as strings. A key that's present means the
 * form shows that field, so "phone" in values is how the rules know the
 * visitor could have given a number instead of an email.
 */

export const LEAD_MESSAGES = {
  firstName: "Your name, please",
  emailRequired: "A working email address is required",
  emailOrBlank: "A working email address, or leave it blank and give your phone",
  reach: "Your email or your phone, so we can reach you",
  phone: "A full phone number with the area code, please",
  address: "The street address to value",
  referredName: "Their first name, please",
  referredReach: "Their email or their phone, so we can reach them",
  referredEmail: "A working email address, or leave it blank and give their phone",
  referredPhone: "Their full phone number with the area code, please",
  referralConsent: "Tick the box once they know you’re passing their details along",
  reviewWords: "The words you’d like to share",
  reviewConsent: "Tick the box so we can use your words",
} as const;

/** How the summary beside Send names each field: "Two things to fix above: name, email". */
export const FIELD_SHORT_NAMES: Record<LeadErrorField, string> = {
  firstName: "name",
  email: "email",
  phone: "phone",
  address: "address",
  message: "your words",
  referredName: "their name",
  referredEmail: "their email",
  referredPhone: "their phone",
  referralConsent: "the box",
  reviewConsent: "the box",
};

/** The order the fields appear in on every form, so the first error is the one nearest the top. */
export const FIELD_ORDER: readonly LeadErrorField[] = [
  "firstName",
  "email",
  "phone",
  "address",
  "referredName",
  "referredEmail",
  "referredPhone",
  "message",
  "referralConsent",
  "reviewConsent",
];

const EMAIL = /^[^\s@"<>(),;:\\[\]]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

/** A plausible email address: something@domain.tld, no spaces, 320 characters at most. */
export function isEmail(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  return v.length > 0 && v.length <= 320 && EMAIL.test(v);
}

const ticked = (v: string | undefined) => v === "on" || v === "true";
const text = (v: string | undefined) => (v ?? "").trim();

export type LeadValues = Record<string, string | undefined>;

/** Every problem with a form's values, one message per field. Empty when it can be sent. */
export function validateLead(form: LeadForm, values: LeadValues): Partial<Record<LeadErrorField, string>> {
  const errors: Partial<Record<LeadErrorField, string>> = {};
  const emailOnly = form === "letter" || form === "calendar" || form === "watch";
  const email = text(values.email);
  const phone = text(values.phone);
  const showsPhone = "phone" in values;
  const emailRequired = EMAIL_REQUIRED_FORMS.includes(form) || !showsPhone;

  if (!emailOnly && !text(values.firstName)) errors.firstName = LEAD_MESSAGES.firstName;

  if (email && !isEmail(email)) errors.email = emailRequired ? LEAD_MESSAGES.emailRequired : LEAD_MESSAGES.emailOrBlank;
  else if (!email && emailRequired) errors.email = LEAD_MESSAGES.emailRequired;
  else if (!email && !phone) errors.email = LEAD_MESSAGES.reach;

  if (phone && !parsePhone(phone)) errors.phone = LEAD_MESSAGES.phone;

  if (form === "valuation" && !text(values.address)) errors.address = LEAD_MESSAGES.address;

  if (form === "referral") {
    const theirEmail = text(values.referredEmail);
    const theirPhone = text(values.referredPhone);
    if (!text(values.referredName)) errors.referredName = LEAD_MESSAGES.referredName;
    if (theirEmail && !isEmail(theirEmail)) errors.referredEmail = LEAD_MESSAGES.referredEmail;
    else if (!theirEmail && !theirPhone) errors.referredEmail = LEAD_MESSAGES.referredReach;
    if (theirPhone && !parsePhone(theirPhone)) errors.referredPhone = LEAD_MESSAGES.referredPhone;
    if (!ticked(values.referralConsent)) errors.referralConsent = LEAD_MESSAGES.referralConsent;
  }

  if (form === "review-permission") {
    if (!text(values.message)) errors.message = LEAD_MESSAGES.reviewWords;
    if (!ticked(values.reviewConsent)) errors.reviewConsent = LEAD_MESSAGES.reviewConsent;
  }
  return errors;
}

const COUNT = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

/** "Two things to fix above: name, email" (the names only; the form makes each one a link). */
export function summaryLead(count: number): string {
  const n = COUNT[count] ?? String(count);
  return `${n} ${count === 1 ? "thing" : "things"} to fix above:`;
}

/** The fields with an error, top of the form first. */
export function orderedErrorFields(errors: Partial<Record<LeadErrorField, string>>): LeadErrorField[] {
  return FIELD_ORDER.filter((f) => errors[f]);
}
