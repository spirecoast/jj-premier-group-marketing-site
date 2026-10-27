"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** The share arrow for the quiet, glyph-only form. */
function ShareGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" aria-hidden="true">
      <path d="M12 3.5v12M7.5 8 12 3.5 16.5 8M5 13.5v6.5h14v-6.5" />
    </svg>
  );
}

/**
 * Share the current view. Phones get the system share sheet; everything else
 * gets the link on the clipboard and a two-second "Copied".
 */
export function ShareButton({
  title,
  url,
  label = "Share",
  className,
  what,
  variant = "rule",
}: {
  title: string;
  /** Absolute or path; defaults to the current location at click time. */
  url?: string;
  label?: string;
  className?: string;
  /** Analytics prop: what kind of thing was shared. */
  what: string;
  /** `quiet`: the 44px square with the arrow alone; the label is the tooltip and the accessible name. */
  variant?: "rule" | "quiet";
}) {
  const [state, setState] = useState<"idle" | "copied" | "shared">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2200);
    return () => clearTimeout(t);
  }, [state]);

  async function share() {
    const href = url ? new URL(url, window.location.href).toString() : window.location.href;
    track("Share", { what });
    if (typeof navigator.share === "function" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title, url: href });
        setState("shared");
        return;
      } catch {
        /* dismissed: fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(href);
      setState("copied");
    } catch {
      window.prompt("Copy this link", href);
    }
  }

  if (variant === "quiet") {
    const word = state === "copied" ? "Link copied" : state === "shared" ? "Shared" : label;
    return (
      <button type="button" onClick={share} className={cn("btn-quiet is-square", className)} aria-label={label} title={label}>
        <ShareGlyph />
        <span className="sr-only" aria-live="polite">
          {state === "idle" ? "" : word}
        </span>
      </button>
    );
  }
  return (
    <button type="button" onClick={share} className={cn("link-rule inline-flex items-center gap-2", className)} aria-live="polite">
      {state === "copied" ? "Link copied" : state === "shared" ? "Shared" : label}
      <span aria-hidden="true" className="font-mono text-[12px]">
        ↗
      </span>
    </button>
  );
}
