import type { DatasetVenue } from "./collect/known";

/**
 * Venues that get no page of their own.
 *
 * - `tbd`: a placeholder the dataset uses while a presenter hasn't named
 *   the room ("Venue TBD (Sarasota)", "Various venues, Sarasota", online).
 *   The event says "Venue to be announced".
 * - `private`: someone's home, used for a ticketed house concert. The
 *   presenter gives the address to ticket holders; the site names the city
 *   only and never mints a "how to get there" page for a house.
 *
 * Neither is listed with the venues, in the calendar's venue filter, in the
 * sitemap or in search, and neither has coordinates for Nearby.
 */
export type UnlistedVenue = "tbd" | "private";

const TBD = /\b(tbd|tba|to be (announced|determined|confirmed)|various|multiple (venues|locations)|online|virtual|livestream)\b/i;
const PRIVATE = /\b(residence|private (home|residence|address)|home of|house concert)\b/i;

export function unlistedVenue(v: Pick<DatasetVenue, "key" | "name" | "type" | "address" | "notes">): UnlistedVenue | undefined {
  const name = v.name ?? "";
  const address = v.address ?? "";
  if (v.key === "venue-tbd" || /^(tbd|various|online)-/.test(v.key) || TBD.test(name) || /^(tbd|tba)$/i.test(address.trim())) return "tbd";
  if (PRIVATE.test(name) || v.type === "residence" || /\bprivate residence\b/i.test(v.notes ?? "")) return "private";
  return undefined;
}

/** What an event at an unlisted venue says in place of the venue's name. */
export const UNLISTED_NAME: Record<UnlistedVenue, string> = {
  tbd: "Venue to be announced",
  private: "A private home",
};

/** The line under it, in place of a street address. */
export const UNLISTED_NOTE: Record<UnlistedVenue, string> = {
  tbd: "The presenter hasn’t named the venue yet.",
  private: "Address given with tickets.",
};
