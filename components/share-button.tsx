"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

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
}: {
  title: string;
  /** Absolute or path; defaults to the current location at click time. */
  url?: string;
  label?: string;
  className?: string;
  /** Analytics prop: what kind of thing was shared. */
  what: string;
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

  return (
    <button type="button" onClick={share} className={cn("link-rule inline-flex items-center gap-2", className)} aria-live="polite">
      {state === "copied" ? "Link copied" : state === "shared" ? "Shared" : label}
      <span aria-hidden="true" className="font-mono text-[12px]">
        ↗
      </span>
    </button>
  );
}
