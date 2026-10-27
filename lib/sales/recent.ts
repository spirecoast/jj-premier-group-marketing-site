/**
 * The last few streets a visitor searched on Tide Street, kept in their own
 * browser (localStorage) and nowhere else: a street and a ZIP, never a
 * house number. Pure helpers over a list, so the unit tests can check the
 * order and the cap, and a thin read/write pair around storage that fails
 * soft when storage is blocked.
 */

export type RecentSearch = { street: string; zip: string };

export const RECENT_KEY = "tide-street-recent";
export const RECENT_MAX = 5;

/** A leading house number is dropped: a recent search is a street, not an address. */
export function recentEntry(street: string, zip: string): RecentSearch | null {
  const s = street
    .trim()
    .replace(/^\d{1,8}[a-z]?(?:\s+|$)/i, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  const z = zip.trim().slice(0, 40);
  return s.length < 2 ? null : { street: s, zip: z };
}

/** `entry` moved to the front of `list`, duplicates (case aside) removed, at most RECENT_MAX kept. */
export function pushRecent(list: RecentSearch[], entry: RecentSearch): RecentSearch[] {
  const same = (a: RecentSearch, b: RecentSearch) => a.street.toLowerCase() === b.street.toLowerCase() && a.zip.toLowerCase() === b.zip.toLowerCase();
  return [entry, ...list.filter((x) => !same(x, entry))].slice(0, RECENT_MAX);
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readRecent(): RecentSearch[] {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is RecentSearch => Boolean(x) && typeof x === "object" && typeof (x as RecentSearch).street === "string" && typeof (x as RecentSearch).zip === "string").slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

export function writeRecent(list: RecentSearch[]): void {
  const store = storage();
  if (!store) return;
  try {
    if (list.length) store.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
    else store.removeItem(RECENT_KEY);
  } catch {
    // Storage full or blocked: the list is a convenience, not state.
  }
}
