/**
 * How a photograph meets its box (components/photo.tsx, the Encore tiles).
 * A picture whose shape is close to the box's is cropped to fill it; one
 * far from it (a poster in a wide hero, a season banner in a 3:2 card) is
 * shown whole on a blurred copy of itself instead of losing its top and
 * bottom to the crop.
 */

/** How far a picture's shape may sit from its box, as a ratio of ratios, before it is shown whole. */
export const FIT_TOLERANCE = 1.35;

/** True when a picture of this shape (width over height) should fill a box of that shape. */
export function coversFrame(ratio: number, frame: number): boolean {
  if (!(ratio > 0) || !(frame > 0)) return true;
  return ratio >= frame / FIT_TOLERANCE && ratio <= frame * FIT_TOLERANCE;
}
