"use client";

import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { submitLead } from "@/actions/submit-lead";
import { HomePlatformPixelFlag } from "@/components/home-platform-fields";
import { readChannel, readUtm } from "@/components/utm-tracker";
import { track } from "@/lib/analytics";
import { LEAD_FAILURE_MESSAGE, initialLeadState, type LeadFormState } from "@/lib/leads/constants";
import { validateLead } from "@/lib/leads/rules";
import { cn } from "@/lib/utils";
import { WATCH_BUTTON_COPY as C } from "@/lib/watch/copy";
import "./watch.css";

/**
 * Street Watch's button (Figma 05 Tide, "Watch"): "Watch this street" under
 * a Tide Street or Home Value result, "Watch this place" on an Atlas page.
 * The button opens a small box in place (aria-expanded, focus to the email);
 * the box posts the `watch` lead form with the street and ZIP, or the place,
 * as hidden fields. The server records the lead (the team's email carries
 * it as a warm signal) and, with subscriber email on, the watch itself and
 * its confirmation email (lib/watch). On success the box gives way to one
 * line, which takes focus. Nothing typed here goes in the address bar.
 */

export type WatchFor = { kind: "street"; street: string; zip: string; label: string } | { kind: "place"; slug: string; name: string };

type Props = { target: WatchFor; className?: string; source?: "tide-street" | "home-value" | "atlas" };

/** A new street or place starts the button over. */
export function WatchButton(props: Props) {
  const t = props.target;
  return <WatchBox key={t.kind === "street" ? `${t.street}|${t.zip}` : t.slug} {...props} />;
}

function WatchBox({ target, className, source }: Props) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const [state, setState] = useState<LeadFormState>(initialLeadState);
  const [pending, startSending] = useTransition();
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [channel, setChannel] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const label = target.kind === "street" ? C.street : C.place;
  const shown = target.kind === "street" ? target.label : target.name;

  useEffect(() => {
    setUtm(readUtm());
    setChannel(readChannel());
  }, []);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!state.ok) return;
    doneRef.current?.focus();
    track("Subscribe", { form: "watch", ...(source ? { source } : {}) });
  }, [state.ok, source]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);
    const found = validateLead("watch", { email: String(fd.get("email") ?? "") });
    if (found.email) {
      setState({ ok: false, errors: { email: found.email } });
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
      startSending(() => setState(res));
      if (!res.ok) inputRef.current?.focus();
    });
  }

  if (state.ok) {
    return (
      <div ref={doneRef} tabIndex={-1} className={cn("watch flex max-w-[520px] flex-col gap-2 outline-none", className)} data-watch="done">
        <p className="t-lead text-navy">{state.confirmEmail ? C.done : C.doneManual}</p>
        {state.confirmEmail ? <p className="t-small text-body">{C.doneConfirm}</p> : null}
        <p className="t-record text-graphite-600">{shown}</p>
        <span role="status" aria-live="polite" className="sr-only">
          {state.confirmEmail ? `${C.done} ${C.doneConfirm}` : C.doneManual}
        </span>
      </div>
    );
  }

  const error = state.errors?.email ?? state.formError;
  const boxId = `${uid}-box`;

  if (!open) {
    return (
      <div className={cn("watch flex flex-col items-stretch gap-4 sm:items-start", className)} data-watch="idle">
        <button
          type="button"
          className="btn btn-navy w-full sm:w-auto"
          aria-expanded={false}
          aria-controls={boxId}
          onClick={() => {
            setEntering(true);
            setOpen(true);
          }}
        >
          {label}
          <span className="btn-dash" aria-hidden="true" />
        </button>
        <p className="t-note">{C.note}</p>
      </div>
    );
  }

  return (
    <form
      id={boxId}
      onSubmit={onSubmit}
      noValidate
      aria-busy={pending || undefined}
      aria-label={label}
      className={cn("watch watch-box", className)}
      data-watch="open"
      data-entering={entering || undefined}
      onAnimationEnd={() => setEntering(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !pending) setOpen(false);
      }}
    >
      <p className="t-h3 text-navy" aria-hidden="true">
        {label}
      </p>
      <input type="hidden" name="form" value="watch" />
      <HomePlatformPixelFlag />
      {target.kind === "street" ? (
        <>
          <input type="hidden" name="watchStreet" value={target.street} />
          <input type="hidden" name="watchZip" value={target.zip} />
        </>
      ) : (
        <>
          <input type="hidden" name="watchPlace" value={target.slug} />
          <input type="hidden" name="watchName" value={target.name} />
        </>
      )}
      <input type="hidden" name="pageTitle" value={`Street Watch · ${shown}`} />
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
      <div className="field">
        <label htmlFor={`${uid}-email`} className="field-label">
          {C.emailLabel}
        </label>
        <input
          ref={inputRef}
          id={`${uid}-email`}
          type="email"
          name="email"
          aria-required="true"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder={C.emailPlaceholder}
          className="field-input watch-input"
          aria-invalid={Boolean(state.errors?.email) || undefined}
          aria-describedby={error ? `${uid}-error` : `${uid}-note`}
        />
        {error ? (
          <p id={`${uid}-error`} className={cn("field-error", state.errors?.email ? "t-small" : "t-body", "text-danger")} role="status">
            {error}
          </p>
        ) : null}
      </div>
      <button type="submit" aria-busy={pending || undefined} aria-disabled={pending || undefined} className="btn btn-navy watch-btn w-full">
        {pending ? C.pending : label}
        <span className="btn-dash" aria-hidden="true" />
      </button>
      <p id={`${uid}-note`} className="t-note">
        {C.note}
      </p>
    </form>
  );
}
