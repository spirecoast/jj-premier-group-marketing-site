import Link from "next/link";
import { MARKETS } from "@/lib/content/markets";
import { PRICE_OPTIONS } from "@/lib/content/filters";
import type { ImageRef, Listing } from "@/lib/content/types";
import { ListingCard } from "@/components/listing-card";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";

/**
 * Find your home: a place and a price, into /listings. The button says what
 * happens there: the team's own listings when there are any (and three of
 * them show here, under the form), otherwise the search goes to Joelyn and
 * Jessica as a note. The sentence over the form is true either way.
 */
export function FindHome({ image, featured = [] }: { image: ImageRef; featured?: Listing[] }) {
  const hasListings = featured.length > 0;
  return (
    <section className="bg-parchment" aria-labelledby="find-title">
      <div className="container-site flex flex-col gap-10 py-section lg:gap-12">
        <SectionHeading
          size="display"
          className="sr"
          title={<span id="find-title">Find your home</span>}
        />
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-20">
          <div className="sr flex flex-col gap-7">
            <p className="t-lead max-w-[480px] text-body">
              Pick a place and a price. We&rsquo;ll find the homes for sale that fit, and we&rsquo;ll tell you which
              ones are worth a visit.
            </p>
            <form action="/listings" method="get" className="grid gap-5 border border-hairline bg-white p-6 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:items-end">
              <div className="field min-w-0">
                <label htmlFor="home-search-market" className="field-label">
                  Where
                </label>
                <select id="home-search-market" name="market" defaultValue="lakewood-ranch" className="field-input">
                  {MARKETS.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}, FL
                    </option>
                  ))}
                  <option value="">Anywhere on the coast</option>
                </select>
              </div>
              <div className="field min-w-0">
                <label htmlFor="home-search-max" className="field-label">
                  Up to
                </label>
                <select id="home-search-max" name="max" defaultValue="1500000" className="field-input">
                  {PRICE_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                  <option value="">No limit</option>
                </select>
              </div>
              <button type="submit" className="btn btn-navy justify-self-start sm:col-span-2">
                {hasListings ? "See the homes" : "Send my search"}
                <span className="btn-dash" aria-hidden="true" />
              </button>
            </form>
          </div>

          <div className="sr-img relative aspect-[4/3] overflow-hidden bg-linen-100 lg:aspect-auto lg:h-[440px]">
            <Photo image={image} sizes="(min-width: 1024px) 600px, 100vw" />
          </div>
        </div>

        {hasListings ? (
          <div className="sr flex flex-col gap-6">
            <ul className="grid gap-5 md:grid-cols-3">
              {featured.map((l) => (
                <li key={l.slug} className="flex">
                  <ListingCard listing={l} className="w-full" sizes="(min-width: 768px) 33vw, 100vw" />
                </li>
              ))}
            </ul>
            <Link href="/listings" className="link-rule self-start">
              All our listings
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
