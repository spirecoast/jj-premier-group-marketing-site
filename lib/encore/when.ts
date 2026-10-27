import type { EventCategory } from "@/lib/content/types";

/**
 * A listing with no published start time is one of two things. An
 * exhibition, a festival, a market or an art walk really does run all day.
 * A play, a concert, a screening or a talk has a curtain time the venue
 * just didn't publish in a way the collector could read, and the calendar
 * must not call that "All day": a visitor would arrive hours early or late.
 * The kind decides which, and the words below say it the same way
 * everywhere (tiles, rows, cards, the event page, the newsletter).
 */
const ALL_DAY_SUBCATEGORIES = new Set(["exhibition", "art-walk", "festival", "market"]);
const ALL_DAY_CATEGORIES = new Set<EventCategory>(["gallery", "festival", "market"]);

/** True when a listing without a time is an all-day kind of thing. */
export function isAllDayKind(category: EventCategory, subcategory?: string): boolean {
  if (subcategory && subcategory !== "other") return ALL_DAY_SUBCATEGORIES.has(subcategory);
  return ALL_DAY_CATEGORIES.has(category);
}

export const UNTIMED = {
  /** The short form for a time column or a tile. */
  allDay: "All day",
  unknown: "Time not listed",
  /** The event page's line, as a link to the venue's own listing. */
  onSite: "Time on the venue’s site ↗",
  /** The note before that link. */
  note: "The listing gives no start time.",
} as const;

/** "All day" or "Time not listed" for a listing with no time. */
export function untimedLabel(category: EventCategory, subcategory?: string): string {
  return isAllDayKind(category, subcategory) ? UNTIMED.allDay : UNTIMED.unknown;
}
