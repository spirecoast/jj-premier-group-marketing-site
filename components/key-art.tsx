import type { EventCategory } from "@/lib/content/types";
import { keyArtSvg } from "@/lib/encore/key-art";
import { cn } from "@/lib/utils";

/**
 * Key art for an event that has no photograph: the category's motif, varied
 * by the event's slug. Fills its box like a photograph would.
 */
export function KeyArt({
  category,
  seed,
  subcategory,
  className,
  ratio = 16 / 9,
}: {
  category: EventCategory;
  seed: string;
  subcategory?: string;
  className?: string;
  /** Width over height of the box the art fills, so the motif is composed for it rather than cropped. */
  ratio?: number;
}) {
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
