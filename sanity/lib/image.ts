import imageUrlBuilder from "@sanity/image-url";
import type { ImageRef } from "@/lib/content/types";
import { dataset, projectId } from "../env";

export type SanityImageSource = {
  asset?: {
    _ref?: string;
    url?: string;
    metadata?: {
      dimensions?: { width?: number; height?: number };
      lqip?: string;
    };
  } | null;
  hotspot?: { x?: number; y?: number } | null;
  crop?: unknown;
  alt?: string | null;
} | null;

const builder = imageUrlBuilder({ projectId, dataset });

/**
 * Normalise a Sanity image (with its asset expanded in GROQ) to the shared
 * ImageRef shape. Returns undefined when there is no asset.
 */
export function toImageRef(
  image: SanityImageSource | undefined,
  fallbackAlt = "",
  maxWidth = 2000,
): ImageRef | undefined {
  if (!image?.asset) return undefined;
  const dims = image.asset.metadata?.dimensions;
  const width = dims?.width ?? 1600;
  const height = dims?.height ?? 1067;
  const src = builder.image(image).width(Math.min(maxWidth, width)).fit("max").auto("format").url();
  const position =
    image.hotspot?.x !== undefined && image.hotspot?.y !== undefined
      ? `${Math.round(image.hotspot.x * 100)}% ${Math.round(image.hotspot.y * 100)}%`
      : undefined;
  return {
    src,
    alt: image.alt ?? fallbackAlt,
    width,
    height,
    position,
    blurDataURL: image.asset.metadata?.lqip ?? undefined,
  };
}
