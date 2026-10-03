import type { Venue } from "@/lib/content/types";
import { marketName } from "@/lib/content/markets";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";
import { SharedFrame } from "./shared-frame";
import { SharedLink } from "./shared-link";

export function VenueCard({ venue, upcoming, className }: { venue: Venue; upcoming?: number; className?: string }) {
  return (
    <SharedLink
      href={`/venues/${venue.slug}`}
      shared={`venue-${venue.slug}`}
      className={cn(
        "card group flex flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor focus-visible:border-deep-harbor",
        className,
      )}
    >
      <SharedFrame name={`venue-${venue.slug}`} role="source" className="relative aspect-[3/2] overflow-hidden bg-linen-100">
        {venue.image ? <Photo image={venue.image} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="card-img" /> : null}
      </SharedFrame>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-700">{marketName(venue.market)}</p>
        <h3 className="t-h3 text-navy">{venue.name}</h3>
        <p className="t-small text-body-muted">
          {venue.address.street ? `${venue.address.street}, ` : ""}
          {venue.address.city}
          {upcoming !== undefined ? ` · ${upcoming} upcoming` : ""}
        </p>
        <span className="card-line mt-auto bg-sky-300" aria-hidden="true" />
      </div>
    </SharedLink>
  );
}
