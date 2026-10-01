"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { submitLead } from "@/actions/submit-lead";
import { readChannel, readUtm } from "@/components/utm-tracker";
import { initialLeadState, type LeadFormState } from "@/lib/leads";
import { cn } from "@/lib/utils";

/**
 * The email-only bar from the Tide band and the Encore subscribe row.
 * Subscribing is the request for email, so no consent box is shown; the lead
 * is tagged consent:email on its way to the CRM. The bar stays where it is on
 * success (`inline`, the default): the inline line shows and the Subscribe goal
 * fires here. `inline={false}` sends the visitor to /thanks/letter or
 * /thanks/calendar instead, which then fires the goal.
 */
export function LetterForm({
  form = "letter",
  label = "Send me the report",
  className,
  tone = "light",
  inline = true,
  source,
}: {
  form?: "letter" | "calendar";
  label?: string;
  className?: string;
  tone?: "light" | "dark";
  /** Stay on the page with the inline success line (default) instead of going to the thank-you page. */
  inline?: boolean;
  /** The /from/<channel> page this bar sits on; otherwise the visit's channel, if any, is sent. */
  source?: string;
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead, initialLeadState);
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [channel, setChannel] = useState<string | null>(source ?? null);
  const successRef = useRef<HTMLParagraphElement>(null);
  const router = useRouter();
  useEffect(() => {
    setUtm(readUtm());
    if (!source) setChannel(readChannel());
  }, [source]);
  useEffect(() => {
    if (!state.ok) return;
    successRef.current?.focus();
    if (inline || !state.redirectTo) {
      track("Subscribe", channel ? { form, source: channel } : { form });
      return;
    }
    router.push(state.redirectTo as Route);
  }, [state.ok, state.redirectTo, inline, form, channel, router]);

  const successText = form === "letter" ? "You are on the list. The next report lands at the start of the month." : "You are on the list. Encore lands every Monday.";

  if (state.ok) {
    return (
      <p ref={successRef} tabIndex={-1} className={cn("t-lead outline-none", tone === "dark" ? "text-white text-shadow-soft" : "text-navy", className)}>
        {successText}
        <span role="status" aria-live="polite" className="sr-only">
          {successText}
        </span>
      </p>
    );
  }

  return (
    <form action={action} noValidate className={cn("flex w-full min-w-0 max-w-[520px] flex-col gap-2", className)}>
      <input type="hidden" name="form" value={form} />
      {channel ? <input type="hidden" name="source" value={channel} /> : null}
      {Object.entries(utm).map(([k, v]) => (
        <input key={k} type="hidden" name={`utm__${k}`} value={v} />
      ))}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-0 sm:bg-paper/95 sm:p-1.5 sm:pl-5">
        <label htmlFor={`letter-email-${form}`} className="sr-only">
          Email address
        </label>
        <input
          id={`letter-email-${form}`}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full min-w-0 bg-paper/95 px-5 py-3 text-[15px] text-ink placeholder:text-graphite-500 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-700 sm:w-0 sm:flex-1 sm:bg-transparent sm:px-0 sm:py-2"
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email?.[0] || state.formError ? `letter-error-${form}` : undefined}
        />
        <button type="submit" disabled={pending} className="btn btn-navy w-full shrink-0 px-6 sm:h-[46px] sm:min-h-0 sm:w-auto">
          {pending ? "Sending…" : label}
        </button>
      </div>
      {state.errors?.email?.[0] || state.formError ? (
        <p id={`letter-error-${form}`} className={cn("t-small", tone === "dark" ? "text-white" : "text-danger")} role="alert">
          {state.errors?.email?.[0] ?? state.formError}
        </p>
      ) : null}
    </form>
  );
}
