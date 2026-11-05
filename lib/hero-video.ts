/**
 * The home hero's video (components/home/hero-video.tsx): which file plays,
 * when it may start by itself, and when it's moving. Pure, so the rules have
 * tests.
 */

/** One loop: the 1080p file, the 720p file for phones, and the still that stands in for both. */
export type HeroClip<Poster> = { desktop: string; phone: string; poster: Poster };

/**
 * Phones get the 720p file: a narrow screen (below `sm`, where the hero is
 * 3:2) or a short one (a phone held sideways; 500px is where the header and
 * the action bar already step down).
 */
export const PHONE_VIDEO_QUERY = "(max-width: 39.99rem), (max-height: 31.25rem)";

type Connection = { saveData?: boolean; effectiveType?: string } | null | undefined;

/** The browser asked to go easy on data: Save-Data is on, or the connection is 2G. */
export function savingData(c: Connection): boolean {
  if (!c) return false;
  return c.saveData === true || c.effectiveType === "2g" || c.effectiveType === "slow-2g";
}

/**
 * Whether the video should be moving. A pause (the corner button, remembered
 * across visits) always wins. Otherwise it starts by itself unless the
 * visitor asked for reduced motion, the browser asks to save data, or the
 * browser refused to autoplay it (Low Power Mode); in those cases it waits
 * for the visitor to press Play.
 */
export function videoWanted(s: {
  paused: boolean;
  reducedMotion: boolean;
  savingData: boolean;
  autoplayRefused: boolean;
  pressedPlay: boolean;
}): boolean {
  if (s.paused) return false;
  return s.pressedPlay || (!s.reducedMotion && !s.savingData && !s.autoplayRefused);
}
