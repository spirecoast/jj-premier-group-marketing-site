/**
 * `sizes` for photographs whose box follows the page grid, so the browser
 * picks the smallest file that is still sharp (next.config.ts lists the widths
 * it can pick from). The gutters are the ones in styles/tokens.css: 24px on a
 * phone, 48px from 768px, 96px from 1024px, and `.container-site` stops
 * growing at 1440px, where its content is 1248px wide.
 */

/** A box the width of `.container-site`'s content. */
export const CONTAINER_SIZES = "(min-width: 1440px) 1248px, (min-width: 1024px) calc(100vw - 12rem), (min-width: 768px) calc(100vw - 6rem), calc(100vw - 3rem)";

/**
 * The home hero: from 1024px, inset by the gutter on each side with no maximum.
 * Below that it's full bleed, and on a screen held upright the frame is taller
 * than it is wide, so a landscape picture covering it runs past both sides:
 * about 1.9 times the width at 768x1024 (the video's 16:9 still in a 78svh
 * frame; phones held upright get the portrait still instead, so there this only
 * sizes the photograph in photo mode).
 */
export const HOME_HERO_SIZES = "(min-width: 1024px) calc(100vw - 12rem), (orientation: portrait) 190vw, 100vw";

/**
 * A guide section's photograph: the 860px reading column beside the contents
 * (240px and a 64px gap from 1024px, 260px from 1280px), full width below that.
 */
export const GUIDE_PHOTO_SIZES =
  "(min-width: 1376px) 860px, (min-width: 1280px) calc(100vw - 32.25rem), (min-width: 1024px) calc(100vw - 31rem), (min-width: 768px) calc(100vw - 6rem), calc(100vw - 3rem)";
