"use client";

import { useEffect, useState } from "react";
import { TEAM_COPY as T } from "@/lib/room/copy";

/** A room's link, shown once, with a copy button. */
export function LinkBox({ link, note }: { link: string; note: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      window.prompt("Copy this link", link);
    }
  }
  return (
    <div className="flex flex-col gap-3 border-l-2 border-sky-700 bg-sky-50 px-4 py-4">
      <p className="t-small text-ink">{note}</p>
      <div className="flex flex-wrap items-center gap-3">
        <code className="min-w-0 flex-1 break-all border border-hairline bg-white px-3 py-2 font-mono text-[13px] text-navy">{link}</code>
        <button type="button" onClick={copy} className="btn btn-navy !min-h-11 !px-5 !text-[12px]">
          <span aria-live="polite">{copied ? T.copied : T.copy}</span>
        </button>
      </div>
    </div>
  );
}
