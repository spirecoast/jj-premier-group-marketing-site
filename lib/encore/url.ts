import type { Route } from "next";
import { isMarketSlug } from "@/lib/content/markets";
import type { EventCategory, MarketSlug } from "@/lib/content/types";
import { isEventCategory } from "./categories";

export type EncoreView = "days" | "week" | "month" | "onview";
export const VIEWS: EncoreView[] = ["days", "week", "month", "onview"];

/**
 * Every calendar view is a URL: the view, the day it is anchored on, the
 * filters, a search and, when someone shares their saved list, the slugs.
 */
export type EncoreState = {
  view: EncoreView;
  /** YYYY-MM-DD in the site timezone; empty means today. */
  date: string;
  category?: EventCategory;
  market?: MarketSlug;
  venue?: string;
  q: string;
  /** Slugs of a shared list. */
  list: string[];
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;
const one = (p: Params, k: string): string | undefined => {
  if (p instanceof URLSearchParams) return p.get(k) ?? undefined;
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
};

export function parseEncoreState(p: Params): EncoreState {
  const view = one(p, "view");
  const date = one(p, "date");
  const category = one(p, "category");
  const market = one(p, "market");
  const venue = one(p, "venue");
  const list = (one(p, "list") ?? "").split(",").filter((s) => /^[a-z0-9-]{1,120}$/.test(s)).slice(0, 60);
  return {
    view: view === "month" ? "month" : view === "week" ? "week" : view === "onview" ? "onview" : "days",
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
    category: isEventCategory(category) ? category : undefined,
    market: isMarketSlug(market) ? market : undefined,
    venue: venue && /^[a-z0-9-]{1,120}$/.test(venue) ? venue : undefined,
    q: (one(p, "q") ?? "").slice(0, 80),
    list,
  };
}

export function encoreSearch(s: Partial<EncoreState>): string {
  const sp = new URLSearchParams();
  if (s.view && s.view !== "days") sp.set("view", s.view);
  if (s.date) sp.set("date", s.date);
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
