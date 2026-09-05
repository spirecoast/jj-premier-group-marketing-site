import { RuleLink } from "@/components/buttons";
import { ListingCard } from "@/components/listing-card";
import { SectionHeading } from "@/components/section-heading";
import type { Listing } from "@/lib/content/types";

/** 03 · On the market. One large frame, three small, and one number that matters. */
export function OnTheMarket({ listings, sold, count }: { listings: Listing[]; sold?: Listing; count: number }) {
  const [lead, ...rest] = listings;
  if (!lead) return null;
  return (
    <section className="container-site flex flex-col gap-10 pb-section">
      <SectionHeading
        number="03"
        eyebrow="On the market"
        title="Right now, on the coast."
        aside={<RuleLink href="/listings">All {count} listings</RuleLink>}
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:grid-rows-[300px_300px]">
        <ListingCard variant="overlay" size="large" listing={lead} className="min-h-[360px] md:col-span-2 lg:col-span-1 lg:row-span-2 lg:min-h-0" sizes="(min-width: 1024px) 40vw, 100vw" />
        {rest.slice(0, 3).map((l) => (
          <ListingCard key={l.slug} variant="overlay" size="small" listing={l} className="min-h-[240px] lg:min-h-0" sizes="(min-width: 1024px) 28vw, (min-width: 768px) 50vw, 100vw" />
        ))}
        {sold ? (
          <div className="flex min-h-[240px] flex-col justify-between bg-sky-700 p-[26px] text-white lg:min-h-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
              Sold · {sold.daysOnMarket ?? "—"} days
            </p>
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[48px] font-medium leading-none">{sold.percentOfList ?? 100}%</p>
              <p className="text-[14px] leading-[1.5] text-mist">
                of list, {sold.address.street.replace(/^\d+\s/, "")}. Priced right, this street clears asking.
              </p>
            </div>
            <span className="h-px w-full bg-mist" aria-hidden="true" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
