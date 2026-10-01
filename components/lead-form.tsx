"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { submitLead } from "@/actions/submit-lead";
import { readChannel, readUtm } from "@/components/utm-tracker";
import {
  CONSENT_EMAIL_WORDING,
  CONSENT_WORDING,
  REVIEW_CONSENT_WORDING,
  SELL_FIRST_OPTIONS,
  initialLeadState,
  type LeadForm as LeadFormKind,
  type LeadFormState,
} from "@/lib/leads";
import { REFER } from "@/lib/refer/copy";
import { REVIEWS } from "@/lib/reviews/copy";
import { cn } from "@/lib/utils";

export type LeadField = "name" | "email" | "phone" | "timing" | "sellFirst" | "address" | "referredName" | "message" | "reviewConsent";

const SUCCESS: Record<LeadFormKind, { title: string; body: string }> = {
  contact: { title: "Got it.", body: "One of us will call or write back. Two questions first: when do you need to be in, and is there a house to sell?" },
  buy: { title: "Got it.", body: "We’ll be in touch with the two questions that change everything else: your timing, and whether there’s a house to sell first." },
  sell: { title: "Got it.", body: "We’ll come back with a plan and a number, and the reason for the number." },
  listing: { title: "Got it.", body: "We’ll confirm the showing with you. Tell us if the timing changes." },
  valuation: { title: "Got it.", body: "A real comp-based answer from Joelyn or Jessica within a day. No algorithm guess." },
  letter: { title: "You’re on the list.", body: "Tide goes out once a month. One page, written for you." },
  calendar: { title: "You’re on the list.", body: "The full calendar, every Monday." },
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
  referredName: "Their first name",
  message: "Message",
  reviewConsent: REVIEW_CONSENT_WORDING,
};

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
  /** Label overrides, e.g. "Your first name" on the referral form. `name` relabels the first-name box. */
  labels?: Partial<Record<LeadField, string>>;
  /** The message box is required (the review-permission form, where it holds the words). */
  messageRequired?: boolean;
  /** Show the email and call/text consent boxes (default). Off where they'd be out of place, e.g. a review permission. */
  marketingConsent?: boolean;
};

function FieldError({ messages, id }: { messages?: string[]; id: string }) {
  if (!messages?.length) return null;
  return (
    <p id={id} className="t-small text-danger" role="alert">
      {messages[0]}
    </p>
  );
}

/**
 * Every public form. Posts to actions/submit-lead.ts, which mirrors the lead
 * to Postgres, hands it to the CRM webhook and emails the team, then sends the
 * visitor to /thanks/[form]. Both consent boxes are unchecked by default and
 * never required; the call/text wording is the compliance draft pending legal
 * review. With JavaScript off the inline "Got it." state shows instead.
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
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead, initialLeadState);
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [channel, setChannel] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const uid = useId();
  const router = useRouter();

  const successRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setUtm(readUtm());
    setChannel(readChannel());
    setPageUrl(window.location.href);
  }, []);
  useEffect(() => {
    if (!state.ok) return;
    successRef.current?.focus();
    // The thank-you page fires the analytics goal. The inline state below is
    // the fallback for a submission without JavaScript.
    if (state.redirectTo) router.push(state.redirectTo as Route);
  }, [state.ok, state.redirectTo, router]);

  const labelColor = tone === "dark" ? "text-mist" : undefined;
  const inputColor = tone === "dark" ? "text-linen-200 border-linen-200/50 placeholder:text-linen-200/50" : undefined;
  const textColor = tone === "dark" ? "text-linen-200" : "text-body";

  if (state.ok) {
    const s = SUCCESS[state.form ?? form];
    return (
      <div className={cn("flex flex-col gap-3 border border-hairline bg-white p-8", tone === "dark" && "border-linen-200/30 bg-transparent", className)}>
        <p className="t-eyebrow text-amber">Received</p>
        <h3 ref={successRef} tabIndex={-1} className={cn("t-h2 outline-none", tone === "dark" ? "text-white" : "text-navy")}>
          {s.title}
        </h3>
        <p className={cn("t-body", textColor)}>{s.body}</p>
        <span role="status" aria-live="polite" className="sr-only">
          {s.title} {s.body}
        </span>
      </div>
    );
  }

  const has = (f: LeadField) => fields.includes(f);
  const label = (f: LeadField) => labels[f] ?? LABELS[f];
  const err = (k: string) => (state.errors as Record<string, string[] | undefined> | undefined)?.[k];

  return (
    <form action={action} noValidate className={cn("flex flex-col gap-7", className)}>
      <input type="hidden" name="form" value={form} />
      <input type="hidden" name="pageUrl" value={pageUrl} />
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

      <div className={cn("grid gap-6", columns && "sm:grid-cols-2")}>
        {has("name") ? (
          <>
            <div className="field">
              <label htmlFor={`${uid}-first`} className={cn("field-label", labelColor)}>
                {labels.name ?? "First name"}
              </label>
              <input id={`${uid}-first`} name="firstName" autoComplete="given-name" required className={cn("field-input", inputColor)} aria-invalid={Boolean(err("firstName"))} aria-describedby={err("firstName") ? `${uid}-first-err` : undefined} />
              <FieldError id={`${uid}-first-err`} messages={err("firstName")} />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-last`} className={cn("field-label", labelColor)}>
                Last name <span className="normal-case tracking-normal opacity-70">(optional)</span>
              </label>
              <input id={`${uid}-last`} name="lastName" autoComplete="family-name" className={cn("field-input", inputColor)} />
            </div>
          </>
        ) : null}
        {has("email") ? (
          <div className="field">
            <label htmlFor={`${uid}-email`} className={cn("field-label", labelColor)}>
              {label("email")}
            </label>
            <input id={`${uid}-email`} type="email" name="email" autoComplete="email" required placeholder="you@example.com" className={cn("field-input", inputColor)} aria-invalid={Boolean(err("email"))} aria-describedby={err("email") ? `${uid}-email-err` : undefined} />
            <FieldError id={`${uid}-email-err`} messages={err("email")} />
          </div>
        ) : null}
        {has("phone") ? (
          <div className="field">
            <label htmlFor={`${uid}-phone`} className={cn("field-label", labelColor)}>
              {LABELS.phone} <span className="normal-case tracking-normal opacity-70">(optional)</span>
            </label>
            <input id={`${uid}-phone`} type="tel" name="phone" autoComplete="tel" placeholder="(941) 555-0100" className={cn("field-input", inputColor)} aria-invalid={Boolean(err("phone"))} aria-describedby={err("phone") ? `${uid}-phone-err` : undefined} />
            <FieldError id={`${uid}-phone-err`} messages={err("phone")} />
          </div>
        ) : null}
        {has("address") ? (
          <div className={cn("field", columns && "sm:col-span-2")}>
            <label htmlFor={`${uid}-address`} className={cn("field-label", labelColor)}>
              {LABELS.address}
              {form !== "valuation" ? <span className="normal-case tracking-normal opacity-70"> (optional)</span> : null}
            </label>
            <input id={`${uid}-address`} name="address" autoComplete="street-address" required={form === "valuation"} placeholder="Street address, city" defaultValue={defaultAddress} className={cn("field-input", inputColor)} aria-invalid={Boolean(err("address"))} aria-describedby={err("address") ? `${uid}-address-err` : undefined} />
            <FieldError id={`${uid}-address-err`} messages={err("address")} />
          </div>
        ) : null}
        {has("timing") ? (
          <div className={cn("field", columns && !has("sellFirst") && "sm:col-span-2")}>
            <label htmlFor={`${uid}-timing`} className={cn("field-label", labelColor)}>
              {LABELS.timing} <span className="normal-case tracking-normal opacity-70">(optional)</span>
            </label>
            <select id={`${uid}-timing`} name="timing" defaultValue="" className={cn("field-input", inputColor)}>
              <option value="">Choose one</option>
              <option>Inside three months</option>
              <option>Three to six months</option>
              <option>Six to twelve months</option>
              <option>Just watching the market</option>
            </select>
          </div>
        ) : null}
        {has("sellFirst") ? (
          <div className={cn("field", columns && !has("timing") && "sm:col-span-2")}>
            <label htmlFor={`${uid}-sell-first`} className={cn("field-label", labelColor)}>
              {LABELS.sellFirst} <span className="normal-case tracking-normal opacity-70">(optional)</span>
            </label>
            <select id={`${uid}-sell-first`} name="sellFirst" defaultValue="" className={cn("field-input", inputColor)}>
              <option value="">Choose one</option>
              {SELL_FIRST_OPTIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        ) : null}
        {has("referredName") ? (
          <div className={cn("field", columns && "sm:col-span-2")}>
            <label htmlFor={`${uid}-referred`} className={cn("field-label", labelColor)}>
              {label("referredName")}
            </label>
            <input id={`${uid}-referred`} name="referredName" autoComplete="off" required className={cn("field-input", inputColor)} aria-invalid={Boolean(err("referredName"))} aria-describedby={err("referredName") ? `${uid}-referred-err` : undefined} />
            <FieldError id={`${uid}-referred-err`} messages={err("referredName")} />
          </div>
        ) : null}
        {has("message") ? (
          <div className={cn("field", columns && "sm:col-span-2")}>
            <label htmlFor={`${uid}-message`} className={cn("field-label", labelColor)}>
              {label("message")}
              {messageRequired ? null : <span className="normal-case tracking-normal opacity-70"> (optional)</span>}
            </label>
            <textarea id={`${uid}-message`} name="message" rows={messageRequired ? 6 : 4} required={messageRequired} placeholder={placeholderMessage} defaultValue={defaultMessage} className={cn("field-input resize-y", inputColor)} aria-invalid={Boolean(err("message"))} aria-describedby={err("message") ? `${uid}-message-err` : undefined} />
            <FieldError id={`${uid}-message-err`} messages={err("message")} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {has("reviewConsent") ? (
          <div className="flex flex-col gap-2">
            <label className={cn("flex cursor-pointer items-start gap-3 t-small", textColor)}>
              <input type="checkbox" name="reviewConsent" value="on" required className="mt-1 size-4 shrink-0 accent-sky-700" aria-invalid={Boolean(err("reviewConsent"))} aria-describedby={err("reviewConsent") ? `${uid}-review-err` : undefined} />
              <span>{label("reviewConsent")}</span>
            </label>
            <FieldError id={`${uid}-review-err`} messages={err("reviewConsent")} />
          </div>
        ) : null}
        {marketingConsent && has("email") ? (
          <label className={cn("flex cursor-pointer items-start gap-3 t-small", textColor)}>
            <input type="checkbox" name="consentEmail" value="on" className="mt-1 size-4 shrink-0 accent-sky-700" />
            <span>{CONSENT_EMAIL_WORDING}</span>
          </label>
        ) : null}
        {marketingConsent && has("phone") ? (
          <label className={cn("flex cursor-pointer items-start gap-3 t-small", textColor)}>
            <input type="checkbox" name="consent" value="on" className="mt-1 size-4 shrink-0 accent-sky-700" />
            <span>{CONSENT_WORDING}</span>
          </label>
        ) : null}
      </div>

      {state.formError ? (
        <p className="t-small text-danger" role="alert">
          {state.formError}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-6">
        <button type="submit" disabled={pending} className={cn("btn", tone === "dark" ? "btn-linen" : "btn-navy")}>
          {pending ? "Sending…" : submitLabel}
          <span className="btn-dash" aria-hidden="true" />
        </button>
        <p className={cn("t-small max-w-[420px]", tone === "dark" ? "text-linen-200/80" : "text-graphite-500")}>
          Goes straight to Joelyn and Jessica. We don’t share or sell your details. See the{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-navy">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
