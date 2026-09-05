import Link from "next/link";
import type { Listing } from "@/lib/content/types";
import { factsLine, formatPrice, formatPriceShort, LISTING_TAG_LABEL } from "@/lib/content/format";
import { marketName } from "@/lib/content/markets";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";

const TAG_CLASS: Record<string, string> = {
  "coming-soon": "bg-linen-200 text-deep-harbor",
  new: "bg-mist text-deep-harbor",
  "just-reduced": "bg-sand text-sand-ink",
  "under-contract": "bg-deep-harbor text-sky-300",
  sold: "border border-linen-400 text-linen-700 bg-transparent",
  "off-market": "border border-harbor-200 text-harbor-700 bg-transparent",
  "open-house": "bg-sky-100 text-sky-800",
};

/** Exactly one tag per listing. */
export function ListingTag({ listing, className }: { listing: Listing; className?: string }) {
  const tag = listing.tag ?? (listing.status === "sold" ? "sold" : listing.status === "pending" ? "under-contract" : undefined);
  if (!tag) return null;
  const label = tag === "open-house" && listing.openHouse ? listing.openHouse : LISTING_TAG_LABEL[tag];
  return (
    <span className={cn("inline-flex h-7 items-center px-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.12em]", TAG_CLASS[tag], className)}>
      {label}
    </span>
  );
}

function eyebrowFor(listing: Listing): string {
  const parts: string[] = [];
  if (listing.tag === "new") parts.push("New");
  else if (listing.tag === "just-reduced") parts.push("Price improved");
  else if (listing.tag === "coming-soon") parts.push("Coming soon");
  else if (listing.status === "sold") parts.push("Sold");
  else if (listing.status === "pending") parts.push("Under contract");
  parts.push(listing.neighborhood?.name ?? marketName(listing.market));
  return parts.join(" · ");
}

type OverlayProps = {
  variant: "overlay";
  listing: Listing;
  size?: "large" | "small";
  className?: string;
  sizes?: string;
  priority?: boolean;
};

type StandardProps = {
  variant?: "standard";
  listing: Listing;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Listing card. `overlay` is the home-page mosaic (type over the photograph);
 * `standard` is the results grid (photograph above a white card, 1px Harbor
 * hairline that darkens on hover). Both draw a Sky rule on hover.
 */
export function ListingCard(props: OverlayProps | StandardProps) {
  const { listing, className, sizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw", priority } = props;
  const href = `/listings/${listing.slug}` as const;

  if (props.variant === "overlay") {
    const large = props.size === "large";
    return (
      <Link
        href={href}
        className={cn("card group relative block overflow-hidden bg-navy", className)}
        aria-label={`${listing.title}, ${formatPrice(listing.price)}`}
      >
        <Photo image={listing.hero} sizes={sizes} priority={priority} className="card-img" />
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-harbor-950/90 via-harbor-950/55 via-38% to-transparent to-62%"
          aria-hidden="true"
        />
        <div className={cn("absolute flex flex-col", large ? "inset-x-7 bottom-6 gap-2.5" : "inset-x-5 bottom-5 gap-1.5")}>
          {large ? <p className="t-mono-sm text-sky-300">{eyebrowFor(listing)}</p> : null}
          <div className="flex items-baseline justify-between gap-4">
            <h3
              className={cn(
                "font-display text-white",
                large ? "text-[clamp(1.5rem,2.4vw,2.125rem)] font-light leading-none" : "text-[21px] font-normal leading-tight text-shadow-soft",
              )}
            >
              {listing.title}
            </h3>
            {large ? (
              <span className="shrink-0 font-mono text-base font-medium text-white">{formatPrice(listing.price)}</span>
            ) : null}
          </div>
          <div className="flex items-baseline justify-between gap-3 font-mono text-[10px] font-medium tracking-[0.06em] text-sky-100">
            <span className="uppercase">{large ? `${factsLine(listing)}${listing.cardNote ? ` · ${listing.cardNote}` : ""}` : listing.cardNote ?? factsLine(listing)}</span>
            {!large ? <span className="text-white">{formatPriceShort(listing.price)}</span> : null}
          </div>
          <span className="card-line bg-sky-300" aria-hidden="true" />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "card group flex flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor focus-visible:border-deep-harbor",
        className,
      )}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-linen-100">
        <Photo image={listing.hero} sizes={sizes} priority={priority} className="card-img" />
        <ListingTag listing={listing} className="absolute left-4 top-4" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="t-h3 text-navy">{listing.title}</h3>
          <span className="shrink-0 font-mono text-[15px] font-medium text-navy">{formatPrice(listing.price)}</span>
        </div>
        <p className="t-record text-graphite-500">
          {listing.neighborhood?.name ?? marketName(listing.market)}
          {listing.address.city ? ` · ${listing.address.city}` : ""}
        </p>
        <p className="t-record uppercase text-graphite-600">
          {factsLine(listing)}
          {listing.status === "sold" && listing.percentOfList ? ` · ${listing.percentOfList}% OF LIST` : ""}
          {listing.status !== "sold" && listing.daysOnMarket !== undefined
            ? ` · ${listing.daysOnMarket === 0 ? "NEW" : `${listing.daysOnMarket} DAYS`}`
            : ""}
        </p>
        <span className="card-line mt-auto bg-sky-300" aria-hidden="true" />
      </div>
    </Link>
  );
}
