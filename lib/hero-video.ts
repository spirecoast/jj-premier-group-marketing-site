/**
 * The home hero's video (components/home/hero-video.tsx): which file plays,
 * which still stands in for it, when it may start by itself, and when it's
 * moving. Pure, so the rules have tests.
 */

/**
 * One loop: the 1080p file, the 720p file for small screens, the portrait cut
 * for phones held upright, and the two stills (each the first frame of its
 * cut). Both stills and every file take one framing, `poster.position`, so the
 * video always fades in exactly over its still.
 */
export type HeroClip<Poster> = { desktop: string; phone: string; portrait: string; poster: Poster; posterPortrait: Poster };

/**
 * Phones held upright get the portrait cut and its still: a narrow screen
 * (below `sm`) that's taller than it's wide. The still's <source> and its
 * preload read this same query, so the still always matches the file.
 */
export const PORTRAIT_QUERY = "(max-width: 39.99rem) and (orientation: portrait)";

/** Every other screen gets the landscape still: the exact opposite of PORTRAIT_QUERY, so one preload applies, never both. */
export const LANDSCAPE_QUERY = `not all and ${PORTRAIT_QUERY}`;

/**
 * Other small screens get the 720p landscape file: a narrow one that isn't
 * upright, or a short one (a phone held sideways; 500px is where the header
 * and the action bar already step down).
 */
export const PHONE_VIDEO_QUERY = "(max-width: 39.99rem), (max-height: 31.25rem)";

/** The file that plays, from the two queries above (checked once, in the browser). */
export function heroVideoFile(clip: Pick<HeroClip<unknown>, "desktop" | "phone" | "portrait">, screen: { portrait: boolean; phone: boolean }): string {
  if (screen.portrait) return clip.portrait;
  return screen.phone ? clip.phone : clip.desktop;
}

/** Seconds of video buffered ahead of the playhead before the loop first starts (components/home/hero-video.tsx). */
export const START_BUFFER_S = 2.5;

/** The longest the still waits for that buffer before the loop starts anyway. */
export const START_WAIT_MS = 6000;

type Ranges = { length: number; start(i: number): number; end(i: number): number };

/**
 * How many seconds are buffered ahead of `t`: the end of the range that holds
 * `t` (a tenth of a second of slack for the decoder's rounding), or 0 when `t`
 * isn't buffered.
 */
export function bufferedAhead(ranges: Ranges, t: number): number {
  for (let i = 0; i < ranges.length; i++) {
    if (ranges.start(i) <= t + 0.1 && ranges.end(i) > t) return ranges.end(i) - t;
  }
  return 0;
}

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
