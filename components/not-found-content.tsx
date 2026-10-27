import { ButtonLink } from "@/components/buttons";
import { NotFoundSearch } from "@/components/not-found-search";

/**
 * The branded 404 body, shared by the site route group and the root. The
 * search comes first, opened on the words the address named (most 404s are a
 * mistyped or expired address for a place, an event or a guide); the three
 * doors are the second row.
 */
export function NotFoundContent() {
  return (
    <section className="container-site flex flex-col gap-10 py-section">
      <div className="flex max-w-[720px] flex-col gap-4">
        <h1 className="t-display text-navy">Nothing on that street.</h1>
        <p className="t-body max-w-measure text-body">
          The page you asked for is not here, which on this coast usually means it sold, moved, or never listed. Search for it, try one of these, or tell us what you were looking for.
        </p>
      </div>
      <NotFoundSearch />
      <div className="flex flex-wrap gap-3.5">
        <ButtonLink href="/listings" variant="outline">
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
