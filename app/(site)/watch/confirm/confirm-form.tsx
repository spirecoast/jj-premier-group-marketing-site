"use client";

import { useActionState, useEffect, useRef } from "react";
import { fill } from "@/lib/issues/copy";
import { WATCH_CONFIRM_PAGE_COPY as COPY } from "@/lib/watch/copy";
import { confirmWatchAction, type WatchConfirmState } from "./actions";

const initial: WatchConfirmState = { ok: false };

/** The one button. What it says afterwards comes from the server's answer; focus moves to it. */
export function WatchConfirmForm({ token, label, path }: { token: string; label: string; path: string }) {
  const [state, action, pending] = useActionState<WatchConfirmState, FormData>(confirmWatchAction, initial);
  const doneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.ok) doneRef.current?.focus();
  }, [state.ok]);

  if (state.ok) {
    const name = state.label ?? label;
    const title = state.state === "confirmed" ? COPY.doneTitle : state.state === "already" ? COPY.alreadyTitle : COPY.unsubscribedTitle;
    const body = state.state === "confirmed" ? COPY.doneBody : state.state === "already" ? COPY.alreadyBody : COPY.unsubscribedBody;
    return (
      <div ref={doneRef} tabIndex={-1} className="flex flex-col gap-4 outline-none" role="status">
        <h2 className="t-h2 text-navy">{fill(title, { label: name })}</h2>
        <p className="t-body max-w-[520px] text-body">{body}</p>
        {state.state !== "unsubscribed" ? (
          <a href={state.path ?? path} className="link-rule self-start">
            {COPY.doneLink}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="t" value={token} />
      <p className="t-lead max-w-[560px] text-body">{fill(COPY.body, { label })}</p>
      {!state.ok && state.state ? (
        <p className="t-small text-danger" role="alert">
          {state.state === "invalid" ? COPY.invalidBody : COPY.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} aria-busy={pending || undefined} className="btn btn-navy self-start px-6 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? COPY.pending : fill(COPY.button, { label })}
      </button>
    </form>
  );
}
