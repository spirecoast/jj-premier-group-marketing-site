import { ART } from "@/lib/art/palette";
import type { EventCategory } from "@/lib/content/types";

/**
 * The eight Encore categories with their label, a short verb-free noun for
 * counts, and a muted accent drawn from the brand tokens. The accent is a
 * tick on a card, never a fill, so the page stays linen and navy. `art` is
 * the category's light in the season clock (lib/art/encore.ts), one of the
 * luminous set in lib/art/palette.ts: it appears only in the art, never on
 * a chip or as text.
 */
export const CATEGORY_ORDER: EventCategory[] = ["music", "theater", "gallery", "talks", "film", "festival", "family", "market"];

export const CATEGORY: Record<EventCategory, { label: string; one: string; color: string; art: string }> = {
  music: { label: "Music", one: "concert", color: "#35899c", art: ART.sky },
  theater: { label: "Theater", one: "show", color: "#96702a", art: ART.coral },
  gallery: { label: "Galleries", one: "exhibition", color: "#4c728a", art: ART.violet },
  talks: { label: "Talks", one: "talk", color: "#7ba1b6", art: ART.turquoise },
  film: { label: "Film", one: "screening", color: "#53565a", art: ART.hibiscus },
  festival: { label: "Festivals", one: "festival", color: "#a3927a", art: ART.mango },
  family: { label: "Family", one: "program", color: "#63c0d3", art: ART.jade },
  market: { label: "Markets", one: "market", color: "#877764", art: ART.gold },
};

export const isEventCategory = (v: unknown): v is EventCategory => typeof v === "string" && v in CATEGORY;

/** "Chamber", "Comedy": the dataset's subcategory, made presentable. */
export function subcategoryLabel(s: string | undefined): string | undefined {
  if (!s || s === "other") return undefined;
  return s.replace(/-/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
