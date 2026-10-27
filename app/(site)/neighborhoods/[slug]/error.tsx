"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ButtonLink, RuleLink } from "@/components/ui/button";
import { reportClientError } from "@/lib/sentry/client";

/**
 * A place whose page would not render: the name from the address, a way
 * back to Atlas and the way to reach us. Everything around it (the header,
 * the footer, the phone bar) stays.
 */
export default function PlaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ slug?: string }>();
  const name = params?.slug ? params.slug.replace(/-/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase()) : "This place";
  useEffect(() => {
    console.error("[site] place page render error", error);
    reportClientError(error);
  }, [error]);

  return (
    <section className="container-site flex flex-col gap-8 py-section" aria-labelledby="place-error-title">
      <div className="flex max-w-[720px] flex-col gap-4">
        <h1 id="place-error-title" className="t-display text-navy">
          {name} didn’t load.
        </h1>
        <p className="t-body max-w-measure text-body">The page for this place broke while it was drawing. That is on our side. Try it again, or go back to the map; every other place is still there.</p>
        {error.digest ? <p className="t-mono-sm text-graphite-500">Reference {error.digest}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <ButtonLink href="/neighborhoods" dash>
          Back to Atlas
        </ButtonLink>
        <button type="button" onClick={reset} className="btn btn-outline">
          Try again
        </button>
        <RuleLink href="/contact">Call or text us</RuleLink>
      </div>
    </section>
  );
}
