import Image from "next/image";
import type { ImageRef } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type FillProps = {
  image: ImageRef;
  /** Fills its (relative, sized) parent. Default. */
  fill?: true;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  className?: string;
};

type FixedProps = {
  image: ImageRef;
  fill: false;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  className?: string;
};

/**
 * One image component for every photograph. Carries the alt text, focal
 * point and blur placeholder from the content layer through to next/image.
 */
export function Photo(props: FillProps | FixedProps) {
  const { image, sizes = "100vw", priority, quality, className } = props;
  const placeholder = image.blurDataURL ? ("blur" as const) : undefined;
  if (props.fill === false) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={image.blurDataURL}
        className={cn("h-auto w-full", className)}
        style={image.position ? { objectPosition: image.position } : undefined}
      />
    );
  }
  return (
    <Image
      src={image.src}
      alt={image.alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={image.blurDataURL}
      className={cn("object-cover", className)}
      style={image.position ? { objectPosition: image.position } : undefined}
    />
  );
}
