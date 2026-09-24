import type { EventCategory } from "@/lib/content/types";

/**
 * The eight Encore categories with their label, a short verb-free noun for
 * counts, and a muted accent drawn from the brand tokens. The accent is a
 * tick on a card, never a fill, so the page stays linen and navy.
 */
export const CATEGORY_ORDER: EventCategory[] = ["music", "theater", "gallery", "talks", "film", "festival", "family", "market"];

export const CATEGORY: Record<EventCategory, { label: string; one: string; color: string }> = {
  music: { label: "Music", one: "concert", color: "#35899c" },
  theater: { label: "Theater", one: "show", color: "#96702a" },
  gallery: { label: "Galleries", one: "exhibition", color: "#4c728a" },
  talks: { label: "Talks", one: "talk", color: "#7ba1b6" },
  film: { label: "Film", one: "screening", color: "#53565a" },
  festival: { label: "Festivals", one: "festival", color: "#a3927a" },
  family: { label: "Family", one: "program", color: "#63c0d3" },
  market: { label: "Markets", one: "market", color: "#877764" },
};

export const isEventCategory = (v: unknown): v is EventCategory => typeof v === "string" && v in CATEGORY;

/** "Chamber", "Comedy": the dataset's subcategory, made presentable. */
export function subcategoryLabel(s: string | undefined): string | undefined {
  if (!s || s === "other") return undefined;
  return s.replace(/-/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
