"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { track } from "@/lib/analytics";
import { submitLead } from "@/actions/submit-lead";
import { HomePlatformPixelFlag } from "@/components/home-platform-fields";
import { readChannel, readUtm } from "@/components/utm-tracker";
import { LEAD_FAILURE_MESSAGE, initialLeadState, type LeadFormState } from "@/lib/leads/constants";
import { validateLead } from "@/lib/leads/rules";
import { SIGNUP_COPY } from "@/lib/newsletter/copy";
import { cn } from "@/lib/utils";

/**
 * The email-only bar from the Tide band and the Encore subscribe row.
 * Subscribing is the request for email, so no consent box is shown; the lead
 * is tagged consent:email on its way to the CRM. The bar stays where it is on
 * success (`inline`, the default): the inline line shows and the Subscribe goal
 * fires here. `inline={false}` sends the visitor to /thanks/letter or
 * /thanks/calendar instead, which then fires the goal.
 *
 * Like the lead form, with JavaScript it checks the address before sending,
 * never empties the box on a failure, and shows the failure line instead of
 * the site's error page when the request doesn't come back.
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
  // The server action as the form's own action: it only runs when JavaScript isn't (yet) running.
  const [serverState, action] = useActionState<LeadFormState, FormData>(submitLead, initialLeadState);
  const [result, setResult] = useState<LeadFormState | null>(null);
  const state = result ?? serverState;
  const [pending, startSending] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
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

  // With subscriber email on, the server sent a confirmation: say so, since nothing comes until it's pressed.
  const successText = state.confirmEmail
    ? form === "letter"
      ? SIGNUP_COPY.inlineTide
      : SIGNUP_COPY.inlineEncore
    : form === "letter"
      ? "You’re on the list. The next report comes out at the start of the month."
      : "You’re on the list. Encore comes out every Monday.";

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);
    const found = validateLead(form, { email: String(fd.get("email") ?? "") });
    if (found.email) {
      setResult({ ok: false, errors: { email: found.email } });
      inputRef.current?.focus();
      return;
    }
    startSending(async () => {
      let res: LeadFormState;
      try {
        res = await submitLead(initialLeadState, fd);
      } catch {
        res = { ok: false, formError: LEAD_FAILURE_MESSAGE };
      }
      startSending(() => setResult(res));
      if (!res.ok) inputRef.current?.focus();
    });
  }

  const error = state.errors?.email ?? state.formError;

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
    <form action={action} onSubmit={onSubmit} noValidate aria-busy={pending || undefined} className={cn("flex w-full min-w-0 max-w-[520px] flex-col gap-2", className)}>
      <input type="hidden" name="form" value={form} />
      <HomePlatformPixelFlag />
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
      {/* On a photograph the row is a paper bar; on a light page it gets a white field with a hairline round it, so it reads as a box. */}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-0 sm:p-1.5 sm:pl-5",
          tone === "dark" ? "sm:bg-paper/95" : "sm:border sm:border-rule sm:bg-white sm:focus-within:border-navy",
        )}
      >
        <label htmlFor={`letter-email-${form}`} className="sr-only">
          Email address
        </label>
        <input
          ref={inputRef}
          id={`letter-email-${form}`}
          type="email"
          name="email"
          aria-required="true"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          defaultValue={state.values?.email}
          placeholder="you@example.com"
          className={cn(
            "w-full min-w-0 px-5 py-3 text-base text-ink md:text-[15px] placeholder:text-graphite-500 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-700 sm:w-0 sm:flex-1 sm:bg-transparent sm:px-0 sm:py-2 sm:focus-visible:outline-0",
            tone === "dark" ? "bg-paper/95" : "border border-rule bg-white sm:border-0",
          )}
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={error ? `letter-error-${form}` : undefined}
        />
        {/* The label stays put while sending, so the button never changes width. */}
        <button type="submit" aria-busy={pending || undefined} className="btn btn-navy w-full shrink-0 px-6 aria-busy:cursor-progress aria-busy:opacity-80 sm:h-[46px] sm:min-h-0 sm:w-auto">
          {label}
        </button>
      </div>
      {pending ? (
        <span role="status" className="sr-only">
          Sending
        </span>
      ) : null}
      {error ? (
        <p id={`letter-error-${form}`} className={cn("field-error t-small", tone === "dark" ? "text-white" : "text-danger")} role="status">
          {error}
        </p>
      ) : null}
    </form>
  );
}
