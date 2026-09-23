"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[site] render error", error);
  }, [error]);

  return (
    <section className="container-site flex flex-col gap-8 py-section">
      <div className="flex max-w-[720px] flex-col gap-4">
        <p className="t-eyebrow text-amber">Something went wrong</p>
        <h1 className="t-display text-navy">We’d wait, and try that again.</h1>
        <p className="t-body max-w-measure text-body">
          The page did not load the way it should. It is on our side, not yours. Try again, or call us; we’re usually in a house but we pick up.
        </p>
        {error.digest ? <p className="t-mono-sm text-graphite-500">Reference {error.digest}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3.5">
        <button type="button" onClick={reset} className="btn btn-navy">
          Try again
          <span className="btn-dash" aria-hidden="true" />
        </button>
        <Link href="/" className="btn btn-outline">
          Back to the start
        </Link>
      </div>
    </section>
  );
}
