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

/** The stock photo for an event without its own image, or undefined when no theme fits. */
export function stockPhoto(o: { category: EventCategory; subcategory?: string; seed: string }): (ImageRef & { credit: string }) | undefined {
  const themes = [...(o.subcategory ? (SUBCATEGORY[o.subcategory] ?? []) : []), ...CATEGORY[o.category]];
  const pool = themes.map((t) => BY_THEME.get(t)).find((p) => p?.length);
  if (!pool) return undefined;
  const e = pool[hash(o.seed) % pool.length]!;
  return { src: `/images/encore-stock/${e.file}`, alt: e.alt, width: e.width, height: e.height, credit: "Adobe Stock" };
}
