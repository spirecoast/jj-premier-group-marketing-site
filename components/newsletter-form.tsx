"use client";

import { useActionState, useEffect, useState } from "react";
import { readUtm } from "@/components/utm-tracker";
import {
  initialNewsletterState,
  subscribeToNewsletter,
  type NewsletterState,
} from "@/lib/actions/newsletter";

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState<
    NewsletterState,
    FormData
  >(subscribeToNewsletter, initialNewsletterState);
  const [utm, setUtm] = useState<Record<string, string>>({});
  useEffect(() => {
    setUtm(readUtm());
  }, []);

  if (state.ok) {
    return (
      <p className="text-sm text-muted-foreground">
        Thanks — you&rsquo;re on the list. Confirmation on its way.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-2" noValidate>
      {Object.entries(utm).map(([k, v]) => (
        <input key={k} type="hidden" name={`utm__${k}`} value={v} />
      ))}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="[email protected]"
          aria-label="Email address"
          className="flex-1 px-3 py-2 bg-surface border border-border rounded-sm text-sm focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-brand text-inverse text-sm rounded-sm hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "…" : "Subscribe"}
        </button>
      </div>
      {state.error ? (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Monthly market notes. Unsubscribe anytime.
        </p>
      )}
    </form>
  );
}
