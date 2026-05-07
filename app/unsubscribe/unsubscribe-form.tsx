"use client";

import { useActionState } from "react";
import {
  applyUnsubscribe,
  initialUnsubscribeState,
  type UnsubscribeState,
} from "./actions";

export function UnsubscribeForm({
  contactId,
  sig,
}: {
  contactId: string;
  sig: string;
}) {
  const [state, formAction, isPending] = useActionState<
    UnsubscribeState,
    FormData
  >(applyUnsubscribe, initialUnsubscribeState);

  if (state.ok) {
    return (
      <div className="bg-surface border border-border rounded-md p-8">
        <p className="text-eyebrow text-accent mb-3">Done</p>
        <h2 className="text-heading mb-3">You&rsquo;re unsubscribed.</h2>
        <p className="text-muted-foreground leading-relaxed">
          We&rsquo;ve removed you from our marketing emails. You won&rsquo;t
          receive further updates from this list. Transactional messages
          (e.g., direct replies to questions you sent us) may still come
          through.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={contactId} />
      <input type="hidden" name="sig" value={sig} />

      <p className="text-muted-foreground leading-relaxed">
        Click below to confirm. We&rsquo;ll stop sending marketing emails to
        this address.
      </p>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center px-6 py-3 bg-brand text-inverse rounded-sm font-medium hover:bg-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Unsubscribing…" : "Confirm unsubscribe"}
      </button>
    </form>
  );
}
