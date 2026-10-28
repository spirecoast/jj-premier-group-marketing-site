"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSitePhone } from "@/components/site-contact";
import { track } from "@/lib/analytics";
import type { KeepToolId } from "@/lib/keep/tools";
import { cn } from "@/lib/utils";

/*
 * Keep what you built (F91): "Print or save as PDF" opens the browser's
 * print dialog on the result alone (components/keep/keep-sheet.tsx), and
 * "Email me this" sends the link to the result to the visitor through the
 * site's email path, only where that path is on (/api/keep/status).
 */

let status: Promise<boolean> | null = null;
function emailOn(): Promise<boolean> {
  status ??= fetch("/api/keep/status")
    .then((r) => (r.ok ? r.json() : { email: false }))
    .then((j: { email?: unknown }) => j.email === true)
    .catch(() => false);
  return status;
}

export function keepPrint(tool: KeepToolId) {
  track("Download", { what: "print", tool });
  window.print();
}

/** The print button, in a tool's own button style. */
export function KeepPrintButton({ tool, className, label = "Print or save as PDF", variant = "button" }: { tool: KeepToolId; className?: string; label?: string; variant?: "button" | "rule" }) {
  return (
    <button type="button" className={cn(variant === "rule" ? "link-rule" : "btn btn-outline", className)} onClick={() => keepPrint(tool)}>
      {label}
    </button>
  );
}

type Sent = "idle" | "sending" | "sent" | "invalid" | "busy" | "failed";

/**
 * "Email me this": a quiet button that opens one field under the row. The
 * form takes the full width of a flex or grid row, so it can sit inside a
 * tool's existing group of buttons.
 */
export function KeepEmail({ tool, url, buttonClassName }: { tool: KeepToolId; url?: string; buttonClassName?: string }) {
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Sent>("idle");
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const phone = useSitePhone();

  useEffect(() => {
    let live = true;
    emailOn().then((v) => live && setOn(v));
    return () => {
      live = false;
    };
  }, []);

  if (!on) return null;

  const close = () => {
    setOpen(false);
    setState("idle");
    requestAnimationFrame(() => button.current?.focus());
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const website = (form.elements.namedItem("website") as HTMLInputElement).value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("invalid");
      input.current?.focus();
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/keep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, url: new URL(url ?? window.location.href, window.location.href).toString(), email, website }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
        setState("sent");
        track("Share", { what: "email", tool });
      } else setState(body.error === "busy" ? "busy" : body.error === "invalid" ? "invalid" : "failed");
    } catch {
      setState("failed");
    }
  };

  const note: Record<Sent, string> = {
    idle: "One email with the link. We don’t add you to anything.",
    sending: "Sending…",
    sent: "Sent. Look for an email from JJ Premier Group.",
    invalid: "That email doesn’t look right. Check it and try again.",
    busy: "We’ve sent a few of these already. Try again later today.",
    failed: "That didn’t send. Try again in a minute",
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className={cn("link-rule self-center whitespace-nowrap", buttonClassName)}
        aria-expanded={open}
        aria-controls={`${id}-form`}
        onClick={() => {
          if (open) return close();
          setOpen(true);
          requestAnimationFrame(() => input.current?.focus());
        }}
      >
        Email me this
      </button>
      {open ? (
        <div className="col-span-full basis-full print:hidden">
        <form
          id={`${id}-form`}
          noValidate
          onSubmit={submit}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
          }}
          className="keep-email flex w-full max-w-[520px] flex-col gap-3 border border-hairline bg-white p-5"
          aria-label="Email me this"
        >
          {state === "sent" ? null : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="field min-w-0 flex-1">
                <label htmlFor={`${id}-email`} className="field-label">
                  Your email
                </label>
                <input
                  ref={input}
                  id={`${id}-email`}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  className="field-input"
                  aria-invalid={state === "invalid" ? true : undefined}
                  aria-describedby={`${id}-note`}
                  onChange={() => state === "invalid" && setState("idle")}
                />
              </div>
              <button type="submit" className="btn btn-navy shrink-0" disabled={state === "sending"}>
                {state === "sending" ? "Sending" : "Send"}
              </button>
            </div>
          )}
          {/* The honeypot: people never see or fill it. */}
          <input name="website" type="text" tabIndex={-1} autoComplete="off" className="keep-trap" aria-hidden="true" defaultValue="" />
          <p id={`${id}-note`} className={cn("t-small", state === "invalid" || state === "failed" || state === "busy" ? "text-danger" : state === "sent" ? "text-navy" : "text-graphite-500")} role="status">
            {note[state]}
            {state === "failed" ? (
              phone ? (
                <>
                  , or{" "}
                  <a href={`tel:${phone}`} className="underline underline-offset-4">
                    call us
                  </a>
                  .
                </>
              ) : (
                "."
              )
            ) : null}
          </p>
          {state === "sent" ? (
            <button type="button" className="btn-quiet self-start" onClick={close}>
              Done
            </button>
          ) : null}
        </form>
        </div>
      ) : null}
    </>
  );
}

/** Both, as one row: for a tool that has no buttons of its own at the end of its result. */
export function KeepRow({ tool, url, className }: { tool: KeepToolId; url?: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3 print:hidden", className)} role="group" aria-label="Keep this">
      <KeepPrintButton tool={tool} />
      <KeepEmail tool={tool} url={url} />
    </div>
  );
}
