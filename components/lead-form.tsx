"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { submitLead } from "@/actions/submit-lead";
import { readUtm } from "@/components/utm-tracker";
import { CONSENT_WORDING, initialLeadState, type LeadForm as LeadFormKind, type LeadFormState } from "@/lib/leads";
import { cn } from "@/lib/utils";

export type LeadField = "name" | "email" | "phone" | "timing" | "address" | "message";

const SUCCESS: Record<LeadFormKind, { title: string; body: string }> = {
  contact: { title: "Got it.", body: "One of us will call or write back today. Two questions first: when do you need to be in, and is there a house to sell?" },
  buy: { title: "Got it.", body: "We will be in touch today with the two questions that change everything else: your timing, and whether there is a house to sell first." },
  sell: { title: "Got it.", body: "We will come back with a plan and a number, and the reason for the number." },
  listing: { title: "Got it.", body: "We will confirm the showing today. Tell us if the timing changes." },
  valuation: { title: "Got it.", body: "A real comp-based answer from Joelyn or Jessica within a day. No algorithm guess." },
  letter: { title: "You are on the list.", body: "One page, once a quarter, no pitch. The next letter lands at the start of the quarter." },
  calendar: { title: "You are on the list.", body: "The full calendar, every Monday." },
};

const LABELS: Record<LeadField, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  timing: "When are you moving?",
  address: "Street address",
  message: "Message",
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
 * Every public form. Posts to actions/submit-lead.ts, which sends a Follow Up
 * Boss event. The consent box is unchecked by default, is never required, and
 * its wording is the compliance draft pending legal review.
 */
export function LeadForm({
  form,
  fields = ["name", "email", "phone", "message"],
  submitLabel = "Send",
  hidden = {},
  tone = "light",
  className,
  columns = true,
  placeholderMessage = "Tell us the timing, and what you are looking at.",
}: Props) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead, initialLeadState);
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [pageUrl, setPageUrl] = useState("");
  const uid = useId();

  const successRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    setUtm(readUtm());
    setPageUrl(window.location.href);
  }, []);
  useEffect(() => {
    if (state.ok) successRef.current?.focus();
  }, [state.ok]);

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
  const err = (k: string) => (state.errors as Record<string, string[] | undefined> | undefined)?.[k];

  return (
    <form action={action} noValidate className={cn("flex flex-col gap-7", className)}>
      <input type="hidden" name="form" value={form} />
      <input type="hidden" name="pageUrl" value={pageUrl} />
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
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
                First name
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
              {LABELS.email}
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
            <input id={`${uid}-address`} name="address" autoComplete="street-address" required={form === "valuation"} placeholder="18 Cliffside Terrace, Lakewood Ranch" className={cn("field-input", inputColor)} aria-invalid={Boolean(err("address"))} aria-describedby={err("address") ? `${uid}-address-err` : undefined} />
            <FieldError id={`${uid}-address-err`} messages={err("address")} />
          </div>
        ) : null}
        {has("timing") ? (
          <div className={cn("field", columns && "sm:col-span-2")}>
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
        {has("message") ? (
          <div className={cn("field", columns && "sm:col-span-2")}>
            <label htmlFor={`${uid}-message`} className={cn("field-label", labelColor)}>
              {LABELS.message} <span className="normal-case tracking-normal opacity-70">(optional)</span>
            </label>
            <textarea id={`${uid}-message`} name="message" rows={4} placeholder={placeholderMessage} className={cn("field-input resize-y", inputColor)} />
          </div>
        ) : null}
      </div>

      {has("phone") ? (
        <label className={cn("flex cursor-pointer items-start gap-3 t-small", textColor)}>
          <input type="checkbox" name="consent" value="on" className="mt-1 size-4 shrink-0 accent-sky-700" />
          <span>{CONSENT_WORDING}</span>
        </label>
      ) : null}

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
          Goes straight to Joelyn and Jessica. We do not share or sell your details. See the{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-navy">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
