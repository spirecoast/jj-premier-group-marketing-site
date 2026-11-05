import { deployEnv } from "./deploy-env";

/**
 * The home hero's video (components/home/hero-video.tsx): which file plays,
 * when none does, and the preview-only switch between two clips. Pure, so
 * the rules have tests.
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
 * Whether the page offers the clip switch (`?hero=lake`): on every deployment
 * except production (a preview, `vercel dev`, a local build). Production never
 * passes the alternates, so it has nothing to switch to.
 */
export function heroCompareAllowed(env: Record<string, string | undefined> = process.env): boolean {
  return deployEnv(env) !== "production";
}

/** The clip `?hero=<name>` asks for, when it names one on offer; otherwise null. */
export function requestedClip(search: string, names: readonly string[]): string | null {
  const name = new URLSearchParams(search).get("hero");
  return name && names.includes(name) ? name : null;
}
