import type { EventCategory, ImageRef } from "@/lib/content/types";
import manifest from "@/lib/content/encore/stock-photos.json";

/**
 * Stand-in photographs for events whose presenter gave us no usable image:
 * free Adobe Stock photos, a few per kind of event, chosen by the event's
 * slug so neighbouring cards differ. They are generic on purpose (no faces,
 * no venues, no signage) and are credited as stock, never as the venue's.
 * Provenance and licence dates: docs/SITE.md.
 */

type Entry = { file: string; theme: string; adobeStockId: string | number; width: number; height: number; alt: string };

const BY_THEME = new Map<string, Entry[]>();
for (const e of manifest as Entry[]) BY_THEME.set(e.theme, [...(BY_THEME.get(e.theme) ?? []), e]);

/** Themes to try for a subcategory, best first. */
const SUBCATEGORY: Record<string, string[]> = {
  exhibition: ["exhibition"],
  "art-walk": ["artwalk", "exhibition"],
  concert: ["concert"],
  band: ["concert"],
  chamber: ["chamber", "orchestra"],
  orchestra: ["orchestra", "chamber"],
  choral: ["choral", "orchestra"],
  jazz: ["jazz", "concert"],
  opera: ["theater", "orchestra"],
  play: ["theater"],
  musical: ["musical", "theater"],
  broadway: ["musical", "theater"],
  cabaret: ["jazz", "musical", "theater"],
  comedy: ["comedy"],
  improv: ["comedy"],
  ballet: ["ballet"],
  dance: ["ballet"],
  circus: ["musical", "theater"],
  gala: ["gala"],
  festival: ["festival"],
  market: ["market"],
  film: ["film"],
  talk: ["talk"],
  family: ["family", "festival"],
};

const CATEGORY: Record<EventCategory, string[]> = {
  music: ["concert", "orchestra"],
  theater: ["theater"],
  gallery: ["exhibition"],
  festival: ["festival"],
  family: ["family", "festival"],
  market: ["market", "festival"],
  film: ["film"],
  talks: ["talk"],
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

type Art = { category: EventCategory; subcategory?: string; seed: string };

function poolFor(o: Art): Entry[] | undefined {
  const themes = [...(o.subcategory ? (SUBCATEGORY[o.subcategory] ?? []) : []), ...CATEGORY[o.category]];
  return themes.map((t) => BY_THEME.get(t)).find((p) => p?.length);
}

/**
 * The stock photo for an event without its own image, or undefined when no
 * theme fits. `pick` names one of the theme's photos outright (from
 * varyStock, for a card in a list); otherwise the slug chooses.
 */
export function stockPhoto(o: Art & { pick?: number }): (ImageRef & { credit: string }) | undefined {
  const pool = poolFor(o);
  if (!pool) return undefined;
  const e = pool[(o.pick ?? hash(o.seed)) % pool.length]!;
  return { src: `/images/encore-stock/${e.file}`, alt: e.alt, width: e.width, height: e.height, credit: "Adobe Stock" };
}

/**
 * Picks for a list of cards so the same stand-in never sits beside itself.
 * Each theme has a few photos; a card takes the one its slug names unless a
 * card just before it (within the pool's size) already has it, in which
 * case it takes the next. The result is one pick per item, or undefined for
 * an item with no theme (it draws key art). The event's own page keeps the
 * slug's pick, so the rule only ever moves a card in a grid.
 */
export function varyStock(items: Art[]): (number | undefined)[] {
  const recent = new Map<Entry[], number[]>();
  return items.map((it) => {
    const pool = poolFor(it);
    if (!pool) return undefined;
    const n = pool.length;
    const last = recent.get(pool) ?? [];
    let k = hash(it.seed) % n;
    for (let step = 0; step < n && last.includes(k); step++) k = (k + 1) % n;
    last.push(k);
    while (last.length > n - 1) last.shift();
    recent.set(pool, last);
    return k;
  });
}
