import { ButtonLink } from "@/components/buttons";

/** The branded 404 body, shared by the site route group and the root. */
export function NotFoundContent() {
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
          Find your home
        </ButtonLink>
        <ButtonLink href="/calendar" variant="outline">
          Encore Arts Calendar
        </ButtonLink>
        <ButtonLink href="/contact" variant="outline">
          Tell us the timing
        </ButtonLink>
      </div>
    </section>
  );
}
