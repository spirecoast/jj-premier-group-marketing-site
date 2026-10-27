import { normTitle, stripDateSuffix } from "./collect/util";

/**
 * Event slugs: the title, cut at a word boundary, then the month of the
 * first date (`…-2026-11`), and `-2`, `-3` for a second production of the
 * same name that month.
 *
 * The first collector cut titles at 70 characters mid-word and sometimes
 * lost the month (`…museum-of-fine-arts-bosto`). Those stored slugs stay as
 * they are (the collector, the review queue and the image rows know events
 * by them), and the site serves each under a clean public slug, with the old
 * address answering a permanent redirect (`publicSlugs`).
 */

/** Longest title part of a slug, before the month. */
export const SLUG_TITLE_MAX = 64;

/** Words a shortened slug shouldn't end on. */
const TRAILING = new Set(["a", "an", "and", "at", "by", "dr", "for", "from", "in", "of", "on", "or", "the", "to", "with"]);

/**
 * Lowercase words joined by hyphens. A title longer than `max` is cut at
 * the last whole word that fits, and a dangling "and", "of the" or the like
 * is dropped from the end.
 */
export function slugify(s: string, max = SLUG_TITLE_MAX): string {
  const full = normTitle(s).replace(/\s+/g, "-").replace(/-+/g, "-");
  if (full.length <= max) return full;
  const cut = full.slice(0, max + 1);
  const at = cut.lastIndexOf("-");
  // One very long word: cut it rather than leave a stub.
  if (at < max / 2) return full.slice(0, max).replace(/-+$/, "");
  const words = cut.slice(0, at).split("-");
  while (words.length > 1 && TRAILING.has(words[words.length - 1]!)) words.pop();
  return words.join("-");
}

/** The slug a new production gets: its title without a trailing date, then the month of its first date. */
export function eventSlug(title: string, firstDate: string): string {
  return `${slugify(stripDateSuffix(title))}-${firstDate.slice(0, 7)}`;
}

/** A slug ending in its month (and maybe a `-2` for a second run that month). */
const COMPLETE = /-\d{4}-(0[1-9]|1[0-2])(?:-\d+)?$/;

/** True for a stored slug the old collector clipped: no month at the end. */
export const isClippedSlug = (slug: string): boolean => !COMPLETE.test(slug);

/**
 * For every clipped slug in `events`, the clean slug the site serves it
 * under. Deterministic: clipped slugs are handled in sorted order, and a
 * clean slug already taken (by any stored slug or an earlier clean one)
 * gets the next free `-2`, `-3`.
 */
export function publicSlugs(events: { slug: string; title: string; startDate?: string | null }[]): Map<string, string> {
  const out = new Map<string, string>();
  const clipped = events.filter((e) => e.startDate && isClippedSlug(e.slug)).sort((a, b) => a.slug.localeCompare(b.slug));
  if (!clipped.length) return out;
  const taken = new Set(events.filter((e) => !clipped.includes(e)).map((e) => e.slug));
  for (const e of clipped) {
    const base = eventSlug(e.title, e.startDate!);
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    taken.add(slug);
    out.set(e.slug, slug);
  }
  return out;
}
