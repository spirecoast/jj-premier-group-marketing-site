/**
 * My places: the neighborhoods a visitor has saved, kept in this browser the
 * way Encore keeps My list. Slugs only. The list travels as `?list=a,b,c` on
 * the explorer when it is shared, and up to four of them go to the compare
 * page as `?places=a,b,c`.
 */

export const MY_PLACES_KEY = "atlas:places";

/** How many places the compare page holds side by side. */
export const COMPARE_MAX = 4;

/** The places to compare: the first four saved, in the order they were saved. */
export function compareSet(saved: readonly string[]): string[] {
  return saved.slice(0, COMPARE_MAX);
}

/** "3 saved", "1 saved". */
export function savedCount(n: number): string {
  return `${n.toLocaleString()} saved`;
}
