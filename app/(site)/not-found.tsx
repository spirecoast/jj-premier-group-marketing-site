import type { Metadata } from "next";
import { ButtonLink } from "@/components/buttons";

export const metadata: Metadata = { title: "Nothing on that street", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <section className="container-site flex flex-col gap-8 py-section">
      <div className="flex max-w-[720px] flex-col gap-4">
        <p className="t-eyebrow text-amber">404</p>
        <h1 className="t-display text-navy">Nothing on that street.</h1>
        <p className="t-body max-w-measure text-body">
          The page you asked for is not here, which on this coast usually means it sold, moved, or never listed. Try one of these, or tell us what you were looking for.
        </p>
      </div>
      <div className="flex flex-wrap gap-3.5">
        <ButtonLink href="/listings" dash>
          Search homes
        </ButtonLink>
        <ButtonLink href="/calendar" variant="outline">
          The calendar
        </ButtonLink>
        <ButtonLink href="/contact" variant="outline">
          Tell us the timing
        </ButtonLink>
      </div>
    </section>
  );
}
