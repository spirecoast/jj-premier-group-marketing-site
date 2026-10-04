"use client";

import { useActionState } from "react";
import { fill } from "@/lib/issues/copy";
import { UNSUBSCRIBE_PAGE_COPY as COPY } from "@/lib/newsletter/copy";
import { LIST_NAME, type NewsletterList } from "@/lib/newsletter/lists";
import { applyUnsubscribe, type UnsubscribeState } from "./actions";

const initialUnsubscribeState: UnsubscribeState = { ok: false };

/**
 * The confirm step. With a list (`list=tide|encore`) the first button stops
 * that list and the second stops everything; otherwise there's one button,
 * for everything.
 */
export function UnsubscribeForm({ kind, id, sig, list }: { kind: "subscription" | "contact"; id: string; sig: string; list: NewsletterList | null }) {
  const [state, formAction, isPending] = useActionState<UnsubscribeState, FormData>(applyUnsubscribe, initialUnsubscribeState);

  if (state.ok) {
    const one = state.scope && state.scope !== "all" ? LIST_NAME[state.scope] : null;
    return (
      <div className="bg-surface border border-border rounded-md p-8">
        <h2 className="text-heading mb-3">{one ? fill(COPY.doneListTitle, { product: one }) : COPY.doneAllTitle}</h2>
        <p className="text-muted-foreground leading-relaxed">{one ? COPY.doneListBody : COPY.doneAllBody}</p>
      </div>
    );
  }

  const button = "inline-flex items-center px-6 py-3 rounded-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="sig" value={sig} />

      <p className="text-muted-foreground leading-relaxed">{list ? COPY.bodyList : COPY.bodyAll}</p>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {list ? (
          <button type="submit" name="scope" value={list} disabled={isPending} className={`${button} bg-brand text-inverse hover:bg-brand-hover`}>
            {isPending ? COPY.pending : fill(COPY.buttonList, { product: LIST_NAME[list] })}
          </button>
        ) : null}
        <button
          type="submit"
          name="scope"
          value="all"
          disabled={isPending}
          className={list ? `${button} border border-border text-foreground hover:bg-surface` : `${button} bg-brand text-inverse hover:bg-brand-hover`}
        >
          {isPending && !list ? COPY.pending : COPY.buttonAll}
        </button>
      </div>
    </form>
  );
}
