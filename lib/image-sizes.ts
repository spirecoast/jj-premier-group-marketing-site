/**
 * `sizes` for photographs whose box follows the page grid, so the browser
 * picks the smallest file that is still sharp (next.config.ts lists the widths
 * it can pick from). The gutters are the ones in styles/tokens.css: 24px on a
 * phone, 48px from 768px, 96px from 1024px, and `.container-site` stops
 * growing at 1440px, where its content is 1248px wide.
 */

/** A box the width of `.container-site`'s content. */
export const CONTAINER_SIZES = "(min-width: 1440px) 1248px, (min-width: 1024px) calc(100vw - 12rem), (min-width: 768px) calc(100vw - 6rem), calc(100vw - 3rem)";

/** The home hero: full bleed below 1024px, then inset by the gutter on each side with no maximum. */
export const HOME_HERO_SIZES = "(min-width: 1024px) calc(100vw - 12rem), 100vw";

/**
 * A guide section's photograph: the 860px reading column beside the contents
 * (240px and a 64px gap from 1024px, 260px from 1280px), full width below that.
 */
export const GUIDE_PHOTO_SIZES =
  "(min-width: 1376px) 860px, (min-width: 1280px) calc(100vw - 32.25rem), (min-width: 1024px) calc(100vw - 31rem), (min-width: 768px) calc(100vw - 6rem), calc(100vw - 3rem)";
