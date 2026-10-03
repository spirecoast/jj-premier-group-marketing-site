import Image from "next/image";
import type { ImageRef } from "@/lib/content/types";
import { coversFrame } from "@/lib/photo-fit";
import { cn } from "@/lib/utils";

type FillProps = {
  image: ImageRef;
  /** Fills its (relative, sized) parent. Default. */
  fill?: true;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  className?: string;
  /**
   * The box's own shape, width over height (3 / 2 for a card, 21 / 9 for a
   * hero). A picture whose shape is far from it (a poster in a wide hero, a
   * season banner in a card) is shown whole on a soft, blurred copy of
   * itself instead of losing its top and bottom to the crop.
   */
  frame?: number;
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
 * point and blur placeholder from the content layer through to next/image,
 * and gives every box the same treatment: a crop to the box's shape, or,
 * when the picture's shape is far from it, the picture whole on a blurred
 * fill (the same look the Encore event hero has always had).
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
  const whole = props.frame !== undefined && image.width > 0 && image.height > 0 && !coversFrame(image.width / image.height, props.frame);
  if (whole) {
    return (
      <>
        <Image src={image.src} alt="" aria-hidden="true" fill sizes="64px" quality={30} className="photo-fill" />
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={image.blurDataURL}
          className={cn("object-contain", className)}
        />
      </>
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
