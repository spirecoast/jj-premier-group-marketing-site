"use client";

import { useActionState } from "react";
import { fill } from "@/lib/issues/copy";
import { CONFIRM_PAGE_COPY as COPY } from "@/lib/newsletter/copy";
import { LIST_NAME, type NewsletterList } from "@/lib/newsletter/lists";
import { confirmAction, type ConfirmState } from "./actions";

const initial: ConfirmState = { ok: false };

/** The one button. What it says afterwards comes from the server's answer. */
export function ConfirmForm({ token, list, nextHref, nextLabel }: { token: string; list: NewsletterList; nextHref: string; nextLabel: string }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(confirmAction, initial);
  const product = LIST_NAME[list];

  if (state.ok && (state.state === "confirmed" || state.state === "already")) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <h2 className="t-h2 text-navy">{state.state === "confirmed" ? COPY.doneTitle : COPY.alreadyTitle}</h2>
        <p className="t-body max-w-[520px] text-body">
          {state.state === "confirmed" ? (list === "tide" ? COPY.doneTide : COPY.doneEncore) : fill(COPY.alreadyBody, { product })}
        </p>
        <a href={nextHref} className="link-rule self-start">
          {nextLabel}
        </a>
      </div>
    );
  }
  if (state.ok && state.state === "unsubscribed") {
    return (
      <div className="flex flex-col gap-4" role="status">
        <h2 className="t-h2 text-navy">{COPY.unsubscribedTitle}</h2>
        <p className="t-body max-w-[520px] text-body">{fill(COPY.unsubscribedBody, { product })}</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="t" value={token} />
      <p className="t-lead max-w-[560px] text-body">{fill(COPY.body, { product })}</p>
      {!state.ok && state.state ? (
        <p className="t-small text-danger" role="alert">
          {state.state === "invalid" ? COPY.invalidBody : COPY.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-navy self-start px-6">
        {pending ? COPY.pending : fill(COPY.button, { product })}
      </button>
    </form>
  );
}
