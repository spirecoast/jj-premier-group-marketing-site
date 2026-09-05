"use client";

import { useActionState, useEffect, useState } from "react";
import { submitLead } from "@/actions/submit-lead";
import { readUtm } from "@/components/utm-tracker";
import { initialLeadState, type LeadFormState } from "@/lib/leads";
import { cn } from "@/lib/utils";

/**
 * The email-only bar from the quarterly-letter band and the calendar
 * subscribe row. Sends a Registration event to Follow Up Boss.
 */
export function LetterForm({
  form = "letter",
  label = "Send me the letter",
  className,
  tone = "light",
}: {
  form?: "letter" | "calendar";
  label?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead, initialLeadState);
  const [utm, setUtm] = useState<Record<string, string>>({});
  useEffect(() => {
    setUtm(readUtm());
  }, []);

  if (state.ok) {
    return (
      <p role="status" className={cn("t-lead", tone === "dark" ? "text-white text-shadow-soft" : "text-navy", className)}>
        {form === "letter" ? "You are on the list. The next letter lands in October." : "You are on the list. The full calendar, every Monday."}
      </p>
    );
  }

  return (
    <form action={action} noValidate className={cn("flex w-full min-w-0 max-w-[520px] flex-col gap-2", className)}>
      <input type="hidden" name="form" value={form} />
      {Object.entries(utm).map(([k, v]) => (
        <input key={k} type="hidden" name={`utm__${k}`} value={v} />
      ))}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex min-w-0 items-center bg-paper/95 p-1.5 pl-5">
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
          className="w-0 min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-graphite-400"
          aria-invalid={Boolean(state.errors?.email)}
        />
        <button type="submit" disabled={pending} className="btn btn-navy h-[46px] min-h-0 shrink-0 px-6">
          {pending ? "Sending…" : label}
        </button>
      </div>
      {state.errors?.email?.[0] || state.formError ? (
        <p className={cn("t-small", tone === "dark" ? "text-white" : "text-danger")} role="alert">
          {state.errors?.email?.[0] ?? state.formError}
        </p>
      ) : null}
    </form>
  );
}
