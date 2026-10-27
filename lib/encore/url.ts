import type { Route } from "next";
import { isMarketSlug } from "@/lib/content/markets";
import type { EventCategory, MarketSlug } from "@/lib/content/types";
import { isEventCategory } from "./categories";

export type EncoreView = "days" | "week" | "month" | "onview";
export const VIEWS: EncoreView[] = ["days", "week", "month", "onview"];

/** The two shortcuts the team can put in a post: tonight, and the coming weekend. */
export type EncoreWhen = "tonight" | "weekend";

/**
 * Every calendar view is a URL: the view, the day it is anchored on, the
 * filters, a search, a shortcut (`when`) and, when someone shares their
 * saved list, the slugs.
 */
export type EncoreState = {
  view: EncoreView;
  /** YYYY-MM-DD in the site timezone; empty means today. */
  date: string;
  category?: EventCategory;
  market?: MarketSlug;
  venue?: string;
  q: string;
  /** Tonight or this weekend, as a list of its own in the Days view. */
  when?: EncoreWhen;
  /** Slugs of a shared list. */
  list: string[];
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;
const one = (p: Params, k: string): string | undefined => {
  if (p instanceof URLSearchParams) return p.get(k) ?? undefined;
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
};

/**
 * Reads the state out of a URL. With `today` (YYYY-MM-DD in the site
 * timezone) a date in the past is dropped, so a stale shared link opens on
 * today instead of an empty week of history.
 */
export function parseEncoreState(p: Params, today?: string): EncoreState {
  const view = one(p, "view");
  const rawDate = one(p, "date");
  const category = one(p, "category");
  const market = one(p, "market");
  const venue = one(p, "venue");
  const whenRaw = one(p, "when");
  const when: EncoreWhen | undefined = whenRaw === "tonight" || whenRaw === "weekend" ? whenRaw : undefined;
  const list = (one(p, "list") ?? "").split(",").filter((s) => /^[a-z0-9-]{1,120}$/.test(s)).slice(0, 60);
  let date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : "";
  if (today && date && date < today) date = "";
  return {
    // A shortcut is a Days view on today.
    view: when ? "days" : view === "month" ? "month" : view === "week" ? "week" : view === "onview" ? "onview" : "days",
    date: when ? "" : date,
    category: isEventCategory(category) ? category : undefined,
    market: isMarketSlug(market) ? market : undefined,
    venue: venue && /^[a-z0-9-]{1,120}$/.test(venue) ? venue : undefined,
    q: (one(p, "q") ?? "").slice(0, 80),
    when,
    list,
  };
}

export function encoreSearch(s: Partial<EncoreState>): string {
  const sp = new URLSearchParams();
  if (s.when) sp.set("when", s.when);
  else {
    if (s.view && s.view !== "days") sp.set("view", s.view);
    if (s.date) sp.set("date", s.date);
  }
  if (s.category) sp.set("category", s.category);
  if (s.market) sp.set("market", s.market);
  if (s.venue) sp.set("venue", s.venue);
  if (s.q) sp.set("q", s.q);
  if (s.list?.length) sp.set("list", s.list.join(","));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function encoreHref(s: Partial<EncoreState>): Route {
  return `/calendar${encoreSearch(s)}` as Route;
}
