import { addDays } from "./dates";
import type { CollectedEvent } from "./types";
import { normTitle, normUrl } from "./util";

/**
 * Which known event a collected one is. In order of trust: a link that
 * belongs to exactly one known event (its own page, its ticket page, a
 * TNEW production id); otherwise the title, the dates and the venue
 * together. Pure: the run builds the matcher from the database (or the
 * JSON) and asks it about each collected event.
 */

export type KnownEvent = {
  slug: string;
  title: string;
  venueKey?: string | null;
  urls: string[];
  /** Every performance date. */
  dates: string[];
  startDate?: string | null;
  endDate?: string | null;
};

export type KnownVenue = { key: string; name: string; aliases?: string[] };

export type Match = { slug: string; via: "url" | "title"; score: number };

const STOP = new Set(["the", "a", "an", "of", "and", "in", "at", "with", "for", "on", "to", "by", "presents", "featuring", "feat", "live", "concert", "2026", "2027", "2028"]);

/** Plural and possessive endings off, so "Jazz Thursdays" meets "Jazz Thursday | Five Points Quintet". */
const stem = (t: string) => (t.length > 4 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t);

export function titleTokens(s: string): string[] {
  return normTitle(s)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map(stem);
}

/** "National Theatre Live: The Misanthrope" → ["national theatre live", "the misanthrope"]; no series → null. */
function seriesSplit(t: string): [string, string] | null {
  const m = t.match(/^([^:|–—]{3,40}?)\s*[:|–—]\s+(.{3,})$/);
  return m ? [normTitle(m[1]!), m[2]!] : null;
}

/**
 * 0..1: the larger of token Jaccard and how much of the shorter title the
 * longer one contains. Two titles in one series ("Golden Groovers: The
 * Music of Carole King" and "…: The Music of The Eagles") are compared on
 * what follows the series name.
 */
export function titleSimilarity(a: string, b: string): number {
  const sa = seriesSplit(a);
  const sb = seriesSplit(b);
  if (sa && sb && sa[0] === sb[0] && normTitle(sa[1]) !== normTitle(sb[1])) return baseSimilarity(sa[1], sb[1]);
  return baseSimilarity(a, b);
}

function baseSimilarity(a: string, b: string): number {
  const ta = new Set(titleTokens(a));
  const tb = new Set(titleTokens(b));
  if (!ta.size || !tb.size) return normTitle(a) === normTitle(b) ? 1 : 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const jaccard = inter / (ta.size + tb.size - inter);
  const contain = inter / Math.min(ta.size, tb.size);
  // Containment alone is too generous for one-word titles ("Dracula" inside "Dracula: A Comedy of Terrors" is right, "Jazz" inside anything is not).
  const containWeight = Math.min(ta.size, tb.size) >= 2 ? 0.92 : 0.75;
  return Math.max(jaccard, contain * containWeight);
}

/** URL variants worth indexing: the URL itself and, for numeric ticket paths (TNEW /8267/8355), the production level. */
export function urlKeys(u: string): string[] {
  const n = normUrl(u);
  if (!n) return [];
  const out = [n];
  const m = n.match(/^([^/]+\/(?:[a-z]+\/)?\d+)\/\d+$/);
  if (m) out.push(m[1]!);
  const ot = n.match(/^ci\.ovationtix\.com\/(\d+)\/production\/(\d+)/);
  if (ot) out.push(`ci.ovationtix.com/${ot[1]}/production/${ot[2]}`);
  const eventId = n.match(/boxofficecentral\.com\/(?:eventavailability\?eventid=|chooseseats\/)(\d+)/);
  if (eventId) out.push(`boxofficecentral/${eventId[1]}`);
  return out;
}

export function venueResolver(venues: KnownVenue[]) {
  const byName = new Map<string, string>();
  const list: [string, string][] = [];
  for (const v of venues) {
    for (const name of [v.name, ...(v.aliases ?? [])]) {
      const n = normTitle(name);
      if (!n) continue;
      byName.set(n, v.key);
      list.push([n, v.key]);
    }
  }
  return (name: string | undefined | null): string | undefined => {
    if (!name) return undefined;
    const n = normTitle(name);
    if (!n) return undefined;
    const exact = byName.get(n);
    if (exact) return exact;
    let best: string | undefined;
    let len = 0;
    for (const [vn, key] of list) {
      if (vn.length >= 6 && (n.includes(vn) || vn.includes(n)) && vn.length > len) {
        best = key;
        len = vn.length;
      }
    }
    return best;
  };
}

function datesOf(c: CollectedEvent): string[] {
  const d = c.performances.map((p) => p.date);
  if (c.startDate) d.push(c.startDate);
  if (c.endDate) d.push(c.endDate);
  return d;
}

const dayMs = 86_400_000;
const dayDiff = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / dayMs;

export function buildMatcher(known: KnownEvent[], venues: KnownVenue[] = []) {
  const resolveVenue = venueResolver(venues);
  const urlIndex = new Map<string, Set<string>>();
  for (const k of known) {
    for (const u of k.urls) {
      for (const key of urlKeys(u)) {
        const s = urlIndex.get(key) ?? new Set<string>();
        s.add(k.slug);
        urlIndex.set(key, s);
      }
    }
  }
  const bySlug = new Map(known.map((k) => [k.slug, k]));

  function span(k: KnownEvent): [string, string] | null {
    const all = [...k.dates, k.startDate, k.endDate].filter((x): x is string => Boolean(x)).sort();
    return all.length ? [all[0]!, all[all.length - 1]!] : null;
  }

  /**
   * `taken`: known events already claimed by a URL match in this run, skipped by title matching.
   * `defaultVenue`: the source's own venue, for events that name none.
   */
  function match(c: CollectedEvent, taken: Set<string> = new Set(), defaultVenue?: string): Match | null {
    const venueKey = c.venueKey ?? resolveVenue(c.venueName) ?? defaultVenue;
    const cDates = datesOf(c);
    // 1. A link that belongs to one known event only.
    const urls = [c.sourceUrl, c.ticketUrl, ...c.performances.map((p) => p.ticketUrl)].filter((u): u is string => Boolean(u));
    const hits = new Map<string, number>();
    for (const u of urls) {
      for (const key of urlKeys(u)) {
        const s = urlIndex.get(key);
        if (s && s.size === 1) {
          const slug = [...s][0]!;
          hits.set(slug, (hits.get(slug) ?? 0) + 1);
        }
      }
    }
    if (hits.size === 1) {
      const slug = [...hits.keys()][0]!;
      const k = bySlug.get(slug)!;
      // A page reused for a later, different program is not proof: the title or the dates have to agree too.
      const sp = span(k);
      const nearSpan = Boolean(sp) && cDates.some((d) => d >= addDays(sp![0], -14) && d <= addDays(sp![1], 14));
      if (titleSimilarity(k.title, c.title) >= 0.3 || !cDates.length || nearSpan) return { slug, via: "url", score: 1 };
    }
    // 2. Title, dates and venue.
    let best: Match | null = null;
    for (const k of known) {
      if (taken.has(k.slug)) continue;
      if (venueKey && k.venueKey && venueKey !== k.venueKey) continue;
      const sim = titleSimilarity(k.title, c.title);
      if (sim < 0.55) continue;
      const sp = span(k);
      let dateScore = 0;
      if (sp && cDates.length) {
        const shared = cDates.some((d) => k.dates.includes(d));
        const inside = cDates.some((d) => d >= sp[0] && d <= sp[1]) || (c.startDate && c.endDate && c.startDate <= sp[1] && c.endDate >= sp[0]);
        const near = cDates.some((d) => dayDiff(d, sp[0]) <= 7 || dayDiff(d, sp[1]) <= 7);
        dateScore = shared ? 1 : inside ? 0.8 : near && sim >= 0.85 ? 0.5 : 0;
        // Most of its dates have to sit in (or right by) the known run: a venue's rental listed
        // under the company's name ("The Sarasota Ballet") shares one date with the gala, not the season.
        const close = cDates.filter((d) => d >= addDays(sp[0], -3) && d <= addDays(sp[1], 3)).length;
        if (cDates.length >= 3 && close / cDates.length < 0.5) dateScore = 0;
      } else if (!cDates.length) dateScore = 0.4;
      if (dateScore === 0) continue;
      const score = sim * 0.7 + dateScore * 0.3 + (venueKey && venueKey === k.venueKey ? 0.05 : 0);
      if (score >= 0.62 && (!best || score > best.score)) best = { slug: k.slug, via: "title", score };
    }
    return best;
  }

  return { match, resolveVenue };
}
