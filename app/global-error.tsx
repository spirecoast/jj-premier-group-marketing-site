"use client";

import { useEffect } from "react";
import "./globals.css";
import { Wordmark } from "@/components/wordmark";
import { TEAM } from "@/lib/content/seed/team";
import { site } from "@/lib/site";

/**
 * The last resort: shown when the root layout itself fails, so it supplies
 * its own <html> and <body>. Nothing here reads from Sanity or the database;
 * the phone numbers come from the seed so a dead data layer cannot take the
 * page down with it. The fonts load through the root layout, so this page
 * sets in the CSS fallback stacks.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[site] fatal render error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-linen-200 text-ink antialiased">
        <main id="main" className="container-site flex min-h-screen flex-col justify-between gap-16 py-10">
          <a href="/" aria-label={`${site.name} home`} className="self-start">
            <Wordmark tone="dark" ground="bg-linen-200" />
          </a>

          <section className="flex flex-col gap-8">
            <div className="flex max-w-[720px] flex-col gap-4">
              <p className="t-eyebrow text-amber">Something went wrong</p>
              <h1 className="t-display text-navy">The whole page gave out. That one is on us.</h1>
              <p className="t-body max-w-measure text-body">
                Try again in a moment, or call us; we’re usually in a house but we pick up.
              </p>
              {error.digest ? <p className="t-mono-sm text-graphite-500">Reference {error.digest}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3.5">
              <button type="button" onClick={reset} className="btn btn-navy">
                Try again
                <span className="btn-dash" aria-hidden="true" />
              </button>
              <a href="/" className="btn btn-outline">
                Back to the start
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-8 gap-y-2">
              {TEAM.map((m) => (
                <li key={m._id} className="t-record text-navy">
                  {m.name.split(" ")[0]}{" "}
                  <a href={`tel:${m.phoneE164}`} className="underline decoration-harbor-500 underline-offset-4">
                    {m.phone}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <p className="t-record text-graphite-500">
            {site.name} · {site.brokerage}
          </p>
        </main>
      </body>
    </html>
  );
}
