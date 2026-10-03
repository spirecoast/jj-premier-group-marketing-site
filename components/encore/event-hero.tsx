import { KeyArt } from "@/components/key-art";
import { Photo } from "@/components/photo";
import { SharedFrame } from "@/components/shared-frame";
import { stockPhoto } from "@/lib/encore/stock";
import type { Event } from "@/lib/content/types";

/**
 * The event page's picture. The presenter's own image when the collector
 * found one, credited underneath with a link to where it came from; key art
 * drawn for the category otherwise. Promotional images come in every shape
 * (posters, banners, squares), so a wide one fills the frame and anything
 * else sits whole on a soft, blurred copy of itself instead of losing its
 * top and bottom to a crop: the Photo component's own rule, given the
 * hero's frame.
 */
export function EventHero({ event }: { event: Event }) {
  const img = event.image;
  if (!img) {
    const stock = stockPhoto({ category: event.category, subcategory: event.subcategory, seed: event.slug });
    return (
      <figure className="flex flex-col gap-2">
        <SharedFrame name={`evt-${event.slug}`} role="target" className="relative aspect-[21/9] max-h-[420px] overflow-hidden bg-linen-100">
          <KeyArt category={event.category} seed={event.slug} subcategory={event.subcategory} ratio={21 / 9} sizes="(min-width: 1024px) 1248px, 100vw" priority />
        </SharedFrame>
        {/* A stand-in, said plainly so no one takes it for the production. */}
        {stock ? <figcaption className="image-credit">Stock photo · Adobe Stock</figcaption> : null}
      </figure>
    );
  }
  return (
    <figure className="flex flex-col gap-2">
      {/* The card's picture grows into this box on the way in (components/shared-frame.tsx). */}
      <SharedFrame name={`evt-${event.slug}`} role="target" className="relative aspect-[16/9] max-h-[560px] w-full overflow-hidden bg-linen-100 sm:aspect-[21/9]">
        <Photo image={{ ...img, position: img.position ?? "50% 38%" }} priority sizes="(min-width: 1024px) 1248px, 100vw" frame={21 / 9} />
      </SharedFrame>
      {event.imageCredit ? <ImageCredit credit={event.imageCredit} /> : null}
    </figure>
  );
}

export function ImageCredit({ credit, className }: { credit: NonNullable<Event["imageCredit"]>; className?: string }) {
  return (
    <figcaption className={["image-credit", className].filter(Boolean).join(" ")}>
      {"Image: "}
      {credit.url ? (
        <a href={credit.url} target="_blank" rel="noopener noreferrer">
          {credit.name}
        </a>
      ) : (
        credit.name
      )}
    </figcaption>
  );
}
