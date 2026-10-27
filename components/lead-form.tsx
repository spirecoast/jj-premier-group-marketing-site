"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { submitLead } from "@/actions/submit-lead";
import { ConsentBox, HomePlatformPixelFlag } from "@/components/home-platform-fields";
import { useSitePhone } from "@/components/site-contact";
import { readChannel, readUtm } from "@/components/utm-tracker";
import { linkIn, writeLastLead } from "@/lib/last-lead";
import {
  CONSENT_EMAIL_WORDING,
  CONSENT_WORDING,
  EMAIL_REQUIRED_FORMS,
  LEAD_FAILURE_MESSAGE,
  REFERRAL_CONSENT_WORDING,
  REFERRAL_PLANS,
  REVIEW_CONSENT_WORDING,
  SELL_FIRST_CHIPS,
  SELL_FIRST_OPTIONS,
  TIMING_OPTIONS,
  initialLeadState,
  type LeadErrorField,
  type LeadForm as LeadFormKind,
  type LeadFormState,
} from "@/lib/leads/constants";
import { fieldName } from "@/lib/leads/pixel";
import { FIELD_SHORT_NAMES, orderedErrorFields, summaryLead, validateLead } from "@/lib/leads/rules";
import { parsePhone } from "@/lib/phone";
import { REFER } from "@/lib/refer/copy";
import { REVIEWS } from "@/lib/reviews/copy";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

export type LeadField =
  | "name"
  | "email"
  | "phone"
  | "timing"
  | "sellFirst"
  | "address"
  | "referredName"
  | "referredLastName"
  | "referredEmail"
  | "referredPhone"
  | "referredPlan"
  | "referralConsent"
  | "message"
  | "reviewConsent";

/** The fields that describe the person being referred; any of them puts the form into its two groups. */
const REFERRED_FIELDS: readonly LeadField[] = ["referredName", "referredLastName", "referredEmail", "referredPhone", "referredPlan", "referralConsent"];

const SUCCESS: Record<LeadFormKind, { title: string; body: string }> = {
  contact: { title: "Got it.", body: "One of us will call or write back. Two questions first: when do you need to be in, and is there a house to sell?" },
  buy: { title: "Got it.", body: "We’ll be in touch with the two questions that change everything else: your timing, and whether there’s a house to sell first." },
  sell: { title: "Got it.", body: "We’ll come back with a plan and a number, and the reason for the number." },
  listing: { title: "Got it.", body: "We’ll confirm the showing with you. Tell us if the timing changes." },
  valuation: { title: "Got it.", body: "A real comp-based answer from Joelyn or Jessica within a day. No algorithm guess." },
  letter: { title: "You’re on the list.", body: "Tide goes out once a month. It’s one page, written for you." },
  calendar: { title: "You’re on the list.", body: "The full calendar comes every Monday." },
  referral: REFER.success,
  "review-permission": REVIEWS.success,
};

const LABELS: Record<LeadField, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  timing: "When are you moving?",
  sellFirst: "Is there a house to sell first?",
  address: "Street address",
  referredName: REFER.form.referredName,
  referredLastName: REFER.form.referredLastName,
  referredEmail: REFER.form.referredEmail,
  referredPhone: REFER.form.referredPhone,
  referredPlan: REFER.form.referredPlan,
  referralConsent: REFERRAL_CONSENT_WORDING,
  message: "Message",
  reviewConsent: REVIEW_CONSENT_WORDING,
};

/** Under the email and phone pair, where either one will do. */
const REACH_HINT = "Your email or your phone is enough.";

/** Legends for the two groups on the referral form. */
const GROUPS = { you: REFER.form.aboutYou, them: REFER.form.aboutThem } as const;

type Props = {
  form: LeadFormKind;
  fields?: LeadField[];
  submitLabel?: string;
  /** Hidden values forwarded to the action (property details, etc.). */
  hidden?: Record<string, string | undefined>;
  tone?: "light" | "dark";
  className?: string;
  /** Renders name/email/phone in a two-column grid on wide screens. */
  columns?: boolean;
  placeholderMessage?: string;
  /** Pre-filled message, e.g. the place and budget carried over from the home page. */
  defaultMessage?: string;
  /** Pre-filled street address, e.g. the street carried over from the sold search. */
  defaultAddress?: string;
  /** Label overrides, e.g. "Your first name" on the referral form. `name` relabels the first-name box, `lastName` the last-name box. */
  labels?: Partial<Record<LeadField | "lastName", string>>;
  /** The message box is required (the review-permission form, where it holds the words). */
  messageRequired?: boolean;
  /** Show the email and call/text consent boxes (default). Off where they'd be out of place: a review permission, a referral. */
  marketingConsent?: boolean;
};

/**
 * A labelled group of fields: a fieldset with its legend (the referral form's
 * "About you" and "About them"). With no legend the children render as they are.
 */
function Group({ legend, tone, className, children }: { legend?: string; tone: "light" | "dark"; className?: string; children: ReactNode }) {
  if (!legend) return <>{children}</>;
  return (
    <fieldset className={cn("m-0 min-w-0 border-0 p-0", className)}>
      <legend className={cn("t-h4 mb-6 p-0", tone === "dark" ? "text-white" : "text-navy")}>{legend}</legend>
      {children}
    </fieldset>
  );
}

/** The message under a field: plain text, tied to the field by aria-describedby. The summary by Send is what's announced. */
function FieldError({ message, id, tone }: { message?: string; id: string; tone: "light" | "dark" }) {
  if (!message) return null;
  return (
    <p id={id} className={cn("field-error t-small", tone === "dark" ? "text-white" : "text-danger")}>
      {message}
    </p>
  );
}

/** A random id for this attempt; crypto.randomUUID where the page is secure, a v4 from getRandomValues otherwise. */
function newSubmissionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function valuesOf(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

/** Everything the form would send, the fields kept from the pixel included. */
function collect(el: HTMLFormElement): FormData {
  const fd = new FormData(el);
  el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[data-private-name]").forEach((input) => {
    fd.set(input.dataset.privateName!, input.value);
  });
  return fd;
}

/** Brings a field (and its label) into view under the sticky header, and focuses it. */
function focusField(el: HTMLElement | null, reduced: boolean) {
  if (!el) return;
  el.focus({ preventScroll: true });
  (el.closest(".field, .consent-line") ?? el).scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
}

/**
 * Every public form. Posts to actions/submit-lead.ts, which saves the lead
 * and sends the visitor to /thanks/[form]; the CRM and the team email follow
 * after the response. Both consent boxes are unchecked by default and never
 * required; the call/text wording is the compliance draft pending legal
 * review.
 *
 * With JavaScript the form never resets: it checks itself with the server's
 * own rules (lib/leads/rules.ts) before sending, keeps every word on any
 * failure, moves focus to the first field that needs fixing and lists them
 * beside Send. A failed or dropped request shows the call-or-text line
 * instead of the site's error page; the lead may already be saved, and the
 * random submission id means a second press doesn't send it twice.
 *
 * Without JavaScript the browser posts the form as it is and the page comes
 * back with the server's state: the values and errors, or the inline
 * "Got it." card.
 *
 * Home Platform's pixel sends a form's named fields to the CRM as they're
 * typed (lib/home-platform.ts). Once the page is live, every field but the
 * visitor's own name, email and phone and the two questions loses its name
 * (and is added to the request by hand on send), so the friend on a referral,
 * the message and the address never reach it.
 */
export function LeadForm({
  form,
  fields = ["name", "email", "phone", "message"],
  submitLabel = "Send",
  hidden = {},
  tone = "light",
  className,
  columns = true,
  placeholderMessage = "Tell us the timing, and what you’re looking at.",
  defaultMessage,
  defaultAddress,
  labels = {},
  messageRequired = false,
  marketingConsent = true,
}: Props) {
  // The server action as the form's own action: it only runs when JavaScript isn't (yet) running.
  const [serverState, formAction] = useActionState<LeadFormState, FormData>(submitLead, initialLeadState);
  const [result, setResult] = useState<LeadFormState | null>(null);
  const state = result ?? serverState;
  const [sending, startSending] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<LeadErrorField, string>>>(serverState.errors ?? {});
  const [attempted, setAttempted] = useState(Boolean(serverState.errors));
  const [focusTick, setFocusTick] = useState(0);
  const [live, setLive] = useState(false);
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [channel, setChannel] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const [successHeight, setSuccessHeight] = useState<number | null>(null);
  const uid = useId();
  const router = useRouter();
  const phone = useSitePhone();
  const reduced = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const submissionId = useRef<string | null>(null);

  useEffect(() => {
    setLive(true);
    setUtm(readUtm());
    setChannel(readChannel());
    setPageUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!state.ok) return;
    successRef.current?.focus();
    // The thank-you page fires the analytics goal. The inline card is what a
    // visitor without JavaScript sees.
    if (state.redirectTo) router.push(state.redirectTo as Route);
  }, [state.ok, state.redirectTo, router]);

  // After a failed attempt, the first field that needs fixing gets focus, with its label in view under the header.
  useEffect(() => {
    if (focusTick) focusField(formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? null, reduced);
  }, [focusTick, reduced]);

  const values = state.values ?? {};
  const has = (f: LeadField) => fields.includes(f);
  const label = (f: LeadField) => labels[f] ?? LABELS[f];
  const dark = tone === "dark";
  const textColor = dark ? "text-linen-200" : "text-body";
  /* "(optional)" in Graphite 500 on the light form (5.4:1), Mist on the dark one; never faded with opacity. */
  const optionalClass = cn("normal-case tracking-normal", dark ? "text-mist" : "text-graphite-500");
  const optional = <span className={optionalClass}> (optional)</span>;
  /* The referral form: "About you" and "About them", each a fieldset with its legend, the note in the second. */
  const them = fields.some((f) => REFERRED_FIELDS.includes(f));
  const showsConsent = marketingConsent && !them;
  const eitherReach = has("email") && has("phone") && !EMAIL_REQUIRED_FORMS.includes(form);
  /** The visitor's own fields keep their name for the pixel; everything else carries it only until the page is live (lib/leads/pixel.ts). */
  const named = (name: string) => fieldName(name, live);
  const err = (f: LeadErrorField) => errors[f];
  const describedBy = (f: LeadErrorField, extra?: string) => [errors[f] ? `${uid}-${f}-err` : "", extra ?? ""].filter(Boolean).join(" ") || undefined;
  /** The last single-line box before Send gets the keyboard's "send" key; the rest get "next". */
  const lastLine: LeadField | null = has("message") ? null : has("address") ? "address" : has("phone") ? "phone" : has("email") ? "email" : null;
  const enterKey = (f: LeadField): "next" | "send" => (lastLine === f ? "send" : "next");
  const idFor: Record<LeadErrorField, string> = {
    firstName: `${uid}-firstName`,
    email: `${uid}-email`,
    phone: `${uid}-phone`,
    address: `${uid}-address`,
    message: `${uid}-message`,
    referredName: `${uid}-referredName`,
    referredEmail: `${uid}-referredEmail`,
    referredPhone: `${uid}-referredPhone`,
    referralConsent: `${uid}-referralConsent`,
    reviewConsent: `${uid}-reviewConsent`,
  };

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const el = e.currentTarget;
    const fd = collect(el);
    const found = validateLead(form, valuesOf(fd));
    setAttempted(true);
    setResult(null);
    if (Object.keys(found).length) {
      setErrors(found);
      setFocusTick((t) => t + 1);
      return;
    }
    setErrors({});
    submissionId.current ??= newSubmissionId();
    fd.set("submissionId", submissionId.current);
    const height = el.getBoundingClientRect().height;
    startSending(async () => {
      let res: LeadFormState;
      try {
        res = await submitLead(initialLeadState, fd);
      } catch {
        // A dropped connection or a timeout. The lead may well be saved; the submission id stops a second press sending it twice.
        res = { ok: false, formError: LEAD_FAILURE_MESSAGE };
      }
      if (res.ok) {
        const v = valuesOf(fd);
        writeLastLead({
          form,
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          address: v.address,
          timing: v.timing,
          sellFirst: v.sellFirst,
          link: linkIn(v.message, window.location.origin),
          referred: v.referredName,
        });
      }
      startSending(() => {
        if (res.ok) setSuccessHeight(height);
        setResult(res);
        if (res.errors && Object.keys(res.errors).length) {
          setErrors(res.errors);
          setFocusTick((t) => t + 1);
        }
      });
    });
  }

  /** After the first attempt, the form is checked again as the visitor leaves a field; an error clears as soon as it's fixed. */
  function recheck(mode: "blur" | "change") {
    if (!attempted || !formRef.current) return;
    const found = validateLead(form, valuesOf(collect(formRef.current)));
    if (mode === "blur") {
      setErrors(found);
      return;
    }
    setErrors((prev) => {
      const next: typeof prev = {};
      for (const k of Object.keys(prev) as LeadErrorField[]) if (found[k]) next[k] = found[k];
      return next;
    });
  }

  /** A phone number is tidied to "(941) 555-0100" when the visitor leaves the box. */
  function tidyPhone(input: HTMLInputElement) {
    const p = parsePhone(input.value);
    if (p && p.display !== input.value) input.value = p.display;
  }

  if (state.ok) {
    const s = SUCCESS[state.form ?? form];
    return (
      <div
        className={cn("lead-success flex flex-col justify-center gap-3 border border-hairline bg-white p-8", dark && "border-linen-200/30 bg-transparent", className)}
        style={successHeight ? { minHeight: successHeight } : undefined}
      >
        <h3 ref={successRef} tabIndex={-1} className={cn("t-h2 outline-none", dark ? "text-white" : "text-navy")}>
          {s.title}
        </h3>
        <p className={cn("t-body", textColor)}>{s.body}</p>
        <span role="status" aria-live="polite" className="sr-only">
          {s.title} {s.body}
        </span>
      </div>
    );
  }

  const fieldsToFix = orderedErrorFields(errors);

  const choiceRow = (name: "timing" | "sellFirst", legend: string, options: readonly { value: string; chip: string; sr?: string }[]) => (
    <fieldset className={cn("field m-0 min-w-0 border-0 p-0", columns && "sm:col-span-2")}>
      <legend className="field-label choice-legend">{legend}</legend>
      <div className="choice-row">
        {options.map((o) => (
          <label key={o.value} className="choice-chip">
            <input type="radio" {...named(name)} value={o.value} defaultChecked={values[name] === o.value} className="sr-only" />
            {o.chip}
            {o.sr ? <span className="sr-only"> {o.sr}</span> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );

  const message = has("message") ? (
    <div className={cn("field", columns && "sm:col-span-2")}>
      <label htmlFor={idFor.message} className="field-label">
        {label("message")}
        {messageRequired ? null : optional}
      </label>
      <textarea
        id={idFor.message}
        {...named("message")}
        rows={messageRequired ? 6 : 4}
        aria-required={messageRequired || undefined}
        placeholder={placeholderMessage}
        defaultValue={values.message ?? defaultMessage}
        enterKeyHint="enter"
        className="field-input resize-y"
        aria-invalid={Boolean(err("message"))}
        aria-describedby={describedBy("message")}
      />
      <FieldError id={`${uid}-message-err`} message={err("message")} tone={tone} />
    </div>
  ) : null;

  const requiredBox = (name: "referralConsent" | "reviewConsent", text: string) => (
    <div className="consent-line flex flex-col gap-2">
      <label className={cn("flex cursor-pointer items-start gap-3 t-small", textColor)}>
        <ConsentBox
          id={idFor[name]}
          name={name}
          defaultChecked={values[name] === "on"}
          aria-required="true"
          className="mt-1 size-4 shrink-0 accent-sky-700"
          aria-invalid={Boolean(err(name))}
          aria-describedby={describedBy(name)}
        />
        <span>
          {text} <span className={optionalClass}>(required)</span>
        </span>
      </label>
      <FieldError id={`${uid}-${name}-err`} message={err(name)} tone={tone} />
    </div>
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      onBlur={() => recheck("blur")}
      onChange={() => recheck("change")}
      noValidate
      aria-busy={sending || undefined}
      className={cn("lead-form flex flex-col gap-7", dark && "lead-form-dark", className)}
    >
      <input type="hidden" name="form" value={form} />
      <input type="hidden" name="pageUrl" value={pageUrl} />
      <HomePlatformPixelFlag />
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      {channel && !hidden.source ? <input type="hidden" name="source" value={channel} /> : null}
      {Object.entries(utm).map(([k, v]) => (
        <input key={k} type="hidden" name={`utm__${k}`} value={v} />
      ))}
      {/* Honeypot: off-screen for people, present for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Group legend={them ? GROUPS.you : undefined} tone={tone}>
        <div className={cn("grid gap-6", columns && "sm:grid-cols-2")}>
          {has("timing") ? choiceRow("timing", LABELS.timing, TIMING_OPTIONS) : null}
          {has("sellFirst") ? choiceRow("sellFirst", LABELS.sellFirst, SELL_FIRST_OPTIONS.map((o) => ({ value: o, chip: SELL_FIRST_CHIPS[o] }))) : null}
          {has("name") ? (
            <>
              <div className="field">
                <label htmlFor={idFor.firstName} className="field-label">
                  {labels.name ?? "First name"}
                </label>
                <input
                  id={idFor.firstName}
                  {...named("firstName")}
                  autoComplete="given-name"
                  autoCapitalize="words"
                  enterKeyHint="next"
                  aria-required="true"
                  defaultValue={values.firstName}
                  className="field-input"
                  aria-invalid={Boolean(err("firstName"))}
                  aria-describedby={describedBy("firstName")}
                />
                <FieldError id={`${uid}-firstName-err`} message={err("firstName")} tone={tone} />
              </div>
              <div className="field">
                <label htmlFor={`${uid}-last`} className="field-label">
                  {labels.lastName ?? "Last name"}
                  {optional}
                </label>
                <input id={`${uid}-last`} {...named("lastName")} autoComplete="family-name" autoCapitalize="words" enterKeyHint="next" defaultValue={values.lastName} className="field-input" />
              </div>
            </>
          ) : null}
          {has("email") ? (
            <div className="field">
              <label htmlFor={idFor.email} className="field-label">
                {label("email")}
              </label>
              <input
                id={idFor.email}
                type="email"
                {...named("email")}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint={enterKey("email")}
                aria-required={eitherReach ? undefined : "true"}
                placeholder="you@example.com"
                defaultValue={values.email}
                className="field-input"
                aria-invalid={Boolean(err("email"))}
                aria-describedby={describedBy("email", eitherReach ? `${uid}-reach` : undefined)}
              />
              <FieldError id={`${uid}-email-err`} message={err("email")} tone={tone} />
            </div>
          ) : null}
          {has("phone") ? (
            <div className="field">
              <label htmlFor={idFor.phone} className="field-label">
                {label("phone")}
                {eitherReach ? null : optional}
              </label>
              <input
                id={idFor.phone}
                type="tel"
                {...named("phone")}
                autoComplete="tel"
                inputMode="tel"
                enterKeyHint={enterKey("phone")}
                placeholder="(941) 555-0100"
                defaultValue={values.phone}
                onBlur={(e) => tidyPhone(e.currentTarget)}
                className="field-input"
                aria-invalid={Boolean(err("phone"))}
                aria-describedby={describedBy("phone", eitherReach ? `${uid}-reach` : undefined)}
              />
              <FieldError id={`${uid}-phone-err`} message={err("phone")} tone={tone} />
            </div>
          ) : null}
          {eitherReach ? (
            <p id={`${uid}-reach`} className={cn("t-small -mt-3", dark ? "text-mist" : "text-graphite-500", columns && "sm:col-span-2")}>
              {REACH_HINT}
            </p>
          ) : null}
          {has("address") ? (
            <div className={cn("field", columns && "sm:col-span-2")}>
              <label htmlFor={idFor.address} className="field-label">
                {LABELS.address}
                {form !== "valuation" ? optional : null}
              </label>
              <input
                id={idFor.address}
                {...named("address")}
                autoComplete="street-address"
                autoCapitalize="words"
                enterKeyHint={enterKey("address")}
                aria-required={form === "valuation" || undefined}
                placeholder="Street address, city"
                defaultValue={values.address ?? defaultAddress}
                className="field-input"
                aria-invalid={Boolean(err("address"))}
                aria-describedby={describedBy("address")}
              />
              <FieldError id={`${uid}-address-err`} message={err("address")} tone={tone} />
            </div>
          ) : null}
          {them ? null : message}
        </div>
      </Group>

      {them ? (
        // The rule sits on a wrapper: on the fieldset itself the legend would cut through it.
        <div className={cn("border-t pt-7", dark ? "border-linen-200/30" : "border-hairline")}>
          <Group legend={GROUPS.them} tone={tone}>
            <div className={cn("grid gap-6", columns && "sm:grid-cols-2")}>
              {has("referredName") ? (
                <div className="field">
                  <label htmlFor={idFor.referredName} className="field-label">
                    {label("referredName")}
                  </label>
                  <input
                    id={idFor.referredName}
                    {...named("referredName")}
                    autoComplete="off"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    aria-required="true"
                    defaultValue={values.referredName}
                    className="field-input"
                    aria-invalid={Boolean(err("referredName"))}
                    aria-describedby={describedBy("referredName")}
                  />
                  <FieldError id={`${uid}-referredName-err`} message={err("referredName")} tone={tone} />
                </div>
              ) : null}
              {has("referredLastName") ? (
                <div className="field">
                  <label htmlFor={`${uid}-referred-last`} className="field-label">
                    {label("referredLastName")}
                    {optional}
                  </label>
                  <input
                    id={`${uid}-referred-last`}
                    {...named("referredLastName")}
                    autoComplete="off"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    defaultValue={values.referredLastName}
                    className="field-input"
                  />
                </div>
              ) : null}
              {has("referredEmail") ? (
                <div className="field">
                  <label htmlFor={idFor.referredEmail} className="field-label">
                    {label("referredEmail")}
                  </label>
                  <input
                    id={idFor.referredEmail}
                    type="email"
                    {...named("referredEmail")}
                    autoComplete="off"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    placeholder="them@example.com"
                    defaultValue={values.referredEmail}
                    className="field-input"
                    aria-invalid={Boolean(err("referredEmail"))}
                    aria-describedby={describedBy("referredEmail", `${uid}-their-reach`)}
                  />
                  <FieldError id={`${uid}-referredEmail-err`} message={err("referredEmail")} tone={tone} />
                </div>
              ) : null}
              {has("referredPhone") ? (
                <div className="field">
                  <label htmlFor={idFor.referredPhone} className="field-label">
                    {label("referredPhone")}
                  </label>
                  <input
                    id={idFor.referredPhone}
                    type="tel"
                    {...named("referredPhone")}
                    autoComplete="off"
                    inputMode="tel"
                    enterKeyHint="next"
                    placeholder="(941) 555-0100"
                    defaultValue={values.referredPhone}
                    onBlur={(e) => tidyPhone(e.currentTarget)}
                    className="field-input"
                    aria-invalid={Boolean(err("referredPhone"))}
                    aria-describedby={describedBy("referredPhone", `${uid}-their-reach`)}
                  />
                  <FieldError id={`${uid}-referredPhone-err`} message={err("referredPhone")} tone={tone} />
                </div>
              ) : null}
              {has("referredEmail") || has("referredPhone") ? (
                <p id={`${uid}-their-reach`} className={cn("t-small -mt-3", dark ? "text-mist" : "text-graphite-500", columns && "sm:col-span-2")}>
                  {REFER.form.reach}
                </p>
              ) : null}
              {has("referredPlan") ? (
                <div className={cn("field", columns && "sm:col-span-2")}>
                  <label htmlFor={`${uid}-referred-plan`} className="field-label">
                    {label("referredPlan")}
                    {optional}
                  </label>
                  <select id={`${uid}-referred-plan`} {...named("referredPlan")} defaultValue={values.referredPlan ?? ""} className="field-input">
                    <option value="">{REFER.form.planPrompt}</option>
                    {REFERRAL_PLANS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              {message}
              {/* The required box closes the group it's about. */}
              {has("referralConsent") ? <div className={cn(columns && "sm:col-span-2")}>{requiredBox("referralConsent", label("referralConsent"))}</div> : null}
            </div>
          </Group>
        </div>
      ) : null}

      {has("reviewConsent") || (showsConsent && (has("email") || has("phone"))) ? (
        <div className="flex flex-col gap-4">
          {has("reviewConsent") ? requiredBox("reviewConsent", label("reviewConsent")) : null}
          {showsConsent && has("email") ? (
            <label className={cn("consent-line flex cursor-pointer items-start gap-3 t-small", textColor)}>
              <ConsentBox name="consentEmail" defaultChecked={values.consentEmail === "on"} className="mt-1 size-4 shrink-0 accent-sky-700" />
              <span>{CONSENT_EMAIL_WORDING}</span>
            </label>
          ) : null}
          {showsConsent && has("phone") ? (
            <label className={cn("consent-line flex cursor-pointer items-start gap-3 t-small", textColor)}>
              <ConsentBox name="consent" defaultChecked={values.consent === "on"} className="mt-1 size-4 shrink-0 accent-sky-700" />
              <span>{CONSENT_WORDING}</span>
            </label>
          ) : null}
        </div>
      ) : null}

      {fieldsToFix.length ? (
        <p role="status" className={cn("field-error t-small", dark ? "text-white" : "text-danger")}>
          {summaryLead(fieldsToFix.length)}{" "}
          {fieldsToFix.map((f, i) => (
            <span key={f}>
              <a
                href={`#${idFor[f]}`}
                onClick={(e) => {
                  e.preventDefault();
                  focusField(document.getElementById(idFor[f]), reduced);
                }}
                className="underline underline-offset-4"
              >
                {FIELD_SHORT_NAMES[f]}
              </a>
              {i < fieldsToFix.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      ) : null}

      {/* Phone: the privacy line, then Send at full width under the thumb. From 40rem: the line, then Send beside it. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <p className={cn("t-small max-w-[420px] sm:flex-1", dark ? "text-linen-200/80" : "text-graphite-500")}>
          Goes straight to Joelyn and Jessica. We don’t share or sell your details. See the{" "}
          <Link href="/privacy" className={cn("underline underline-offset-4", dark ? "hover:text-white" : "hover:text-navy")}>
            privacy policy
          </Link>
          .
        </p>
        <button type="submit" aria-busy={sending || undefined} className={cn("btn btn-send", dark ? "btn-linen" : "btn-navy")}>
          {submitLabel}
          <span className="btn-dash" aria-hidden="true" />
        </button>
      </div>
      {sending ? (
        <span role="status" className="sr-only">
          Sending
        </span>
      ) : null}
      {state.formError ? (
        <p role="status" className={cn("field-error t-small", dark ? "text-white" : "text-danger")}>
          {state.formError === LEAD_FAILURE_MESSAGE && phone ? (
            <>
              We could not send that just now.{" "}
              <a href={`tel:${phone}`} className="underline underline-offset-4">
                Call
              </a>{" "}
              or{" "}
              <a href={`sms:${phone}`} className="underline underline-offset-4">
                text
              </a>{" "}
              us directly and we will pick it up from there.
            </>
          ) : (
            state.formError
          )}
        </p>
      ) : null}
    </form>
  );
}
