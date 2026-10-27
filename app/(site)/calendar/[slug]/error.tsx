"use client";

import { useEffect } from "react";
import { ButtonLink, RuleLink } from "@/components/ui/button";
import { reportClientError } from "@/lib/sentry/client";

/**
 * An event whose page would not render: a way back to the calendar and the
 * way to reach us. The header, the footer and the phone bar stay.
 */
export default function EventError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[site] event page render error", error);
    reportClientError(error);
  }, [error]);

  return (
    <section className="container-site flex flex-col gap-8 py-section" aria-labelledby="event-error-title">
      <div className="flex max-w-[720px] flex-col gap-4">
        <h1 id="event-error-title" className="t-display text-navy">
          This event’s page didn’t load.
        </h1>
        <p className="t-body max-w-measure text-body">It broke while it was drawing, and that is on our side. Try it again, or go back to the calendar; everything else on Encore is still there.</p>
        {error.digest ? <p className="t-mono-sm text-graphite-500">Reference {error.digest}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <ButtonLink href="/calendar" dash>
          Back to Encore
        </ButtonLink>
        <button type="button" onClick={reset} className="btn btn-outline">
          Try again
        </button>
        <RuleLink href="/contact">Call or text us</RuleLink>
      </div>
    </section>
  );
}
