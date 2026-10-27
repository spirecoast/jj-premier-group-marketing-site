"use client";

import { useState } from "react";

/** The caption to paste under a post, with a Copy button; the text stays selectable without it. */
export function CopyCaption({ id, text, label }: { id: string; text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea id={id} readOnly rows={4} value={text} className="field-input min-h-[7rem] resize-y text-[15px] leading-[1.5]" onFocus={(e) => e.currentTarget.select()} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn btn-outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              document.getElementById(id)?.focus();
            }
          }}
        >
          Copy the caption
        </button>
        <span role="status" aria-live="polite" className="t-small text-graphite-500">
          {copied ? "Copied." : ""}
        </span>
      </div>
    </div>
  );
}
