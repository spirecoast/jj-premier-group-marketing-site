/**
 * What to search for when a page isn't there. Most 404s are a mistyped or
 * expired address for a neighborhood, an event or a guide, and the last
 * segment of the path usually names it: "/neighborhoods/lake-club" → "lake
 * club". Pure, so the 404 page can test it; no imports.
 */

/** Segments that name a kind of page, not a thing: the query would be the segment before them. */
const SECTIONS = new Set(["neighborhoods", "calendar", "venues", "guides", "blog", "tide", "listings", "from", "sell", "buy", "search", "tools", "print"]);

/** The words a reader would type for a path, or "" when the path says nothing. */
export function queryFromPath(pathname: string): string {
  const segments = pathname
    .split("?")[0]!
    .split("#")[0]!
    .split("/")
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })
    .map((s) => s.replace(/\.(html?|php|aspx?)$/i, "").trim())
    .filter(Boolean);
  // The last segment that isn't a section's name, an index file or a bare number.
  const last = [...segments].reverse().find((s) => !SECTIONS.has(s.toLowerCase()) && !/^(index|default)$/i.test(s) && !/^\d+$/.test(s));
  if (!last) return "";
  return last
    .replace(/[-_+.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
