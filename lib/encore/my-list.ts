/**
 * The pure half of Encore's "My list" (components/encore/use-my-list.ts): the
 * list as stored, and the changes to it. Slugs only; nothing leaves the
 * browser unless the visitor shares the list.
 */

export const MY_LIST_KEY = "encore:list";

const SLUG = /^[a-z0-9-]{1,120}$/;

/** The stored JSON as a clean list: strings that look like slugs, once each, in order. Anything else reads as empty. */
export function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return [...new Set(v.filter((s): s is string => typeof s === "string" && SLUG.test(s)))];
  } catch {
    return [];
  }
}

export function toggleSlug(list: readonly string[], slug: string): string[] {
  return list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
}

export function addSlugs(list: readonly string[], slugs: readonly string[]): string[] {
  return [...new Set([...list, ...slugs])];
}
