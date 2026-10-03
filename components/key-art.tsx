import Image from "next/image";
import type { EventCategory } from "@/lib/content/types";
import { keyArtSvg } from "@/lib/encore/key-art";
import { stockPhoto } from "@/lib/encore/stock";
import { cn } from "@/lib/utils";

/**
 * The picture for an event that has no image of its own: a stock photograph
 * for its kind of event (lib/encore/stock.ts), or, when none fits, the
 * category's drawn motif varied by the event's slug. Fills its box like a
 * photograph would.
 */
export function KeyArt({
  category,
  seed,
  subcategory,
  className,
  ratio = 16 / 9,
  sizes = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw",
  priority,
}: {
  category: EventCategory;
  seed: string;
  subcategory?: string;
  className?: string;
  /** Width over height of the box the art fills, so the motif is composed for it rather than cropped. */
  ratio?: number;
  sizes?: string;
  priority?: boolean;
}) {
  const photo = stockPhoto({ category, subcategory, seed });
  if (photo)
    return <Image src={photo.src} alt={photo.alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  const width = 1200;
  const height = Math.round(width / ratio);
  return (
    <div
      className={cn("absolute inset-0 [&>svg]:h-full [&>svg]:w-full", className)}
      // Our own generated markup: the only input is the slug, used as a numeric seed.
      dangerouslySetInnerHTML={{ __html: keyArtSvg({ category, seed, subcategory, width, height }) }}
    />
  );
}
