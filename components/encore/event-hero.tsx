import Image from "next/image";
import { KeyArt } from "@/components/key-art";
import type { Event } from "@/lib/content/types";

/**
 * The event page's picture. The presenter's own image when the collector
 * found one, credited underneath with a link to where it came from; key art
 * drawn for the category otherwise. Promotional images come in every shape
 * (posters, banners, squares), so a wide one fills the frame and anything
 * else sits whole on a soft, blurred copy of itself instead of losing its
 * top and bottom to a crop.
 */
export function EventHero({ event }: { event: Event }) {
  const img = event.image;
  if (!img) {
    return (
      <div className="relative aspect-[21/9] max-h-[420px] overflow-hidden bg-linen-100">
        <KeyArt category={event.category} seed={event.slug} subcategory={event.subcategory} ratio={21 / 9} />
      </div>
    );
  }
  const ratio = img.width / img.height;
  const wide = ratio >= 1.6 && ratio <= 2.6;
  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-[16/9] max-h-[560px] w-full overflow-hidden bg-linen-100 sm:aspect-[21/9]">
        {wide ? (
          <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 1024px) 1248px, 100vw" className="object-cover" />
        ) : (
          <>
            <Image src={img.src} alt="" aria-hidden="true" fill sizes="64px" quality={30} className="scale-110 object-cover opacity-60 blur-2xl" />
            <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 1024px) 1248px, 100vw" className="object-contain" />
          </>
        )}
      </div>
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
