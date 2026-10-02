import "server-only";
import { cache } from "react";
import { easternDay } from "@/lib/issues/render";
import { addMonths, latestCompleteMonth, monthBounds, previousMonth } from "@/lib/issues/tide-monthly";
import { getSalesManifest, salesBetween } from "@/lib/sales";
import { ridgeMonths, type RidgeMonth } from "./tide";

/** How many months the Tide portrait draws at most. */
export const RIDGE_MONTHS = 24;

/**
 * The months the Tide portrait draws: up to RIDGE_MONTHS ending with the
 * latest month complete in all three markets, the same month the Tide issue
 * reports on (lib/issues/tide-monthly.ts, looking back from the month before
 * today). Oldest first. Empty until the sales data has been ingested. The
 * prices never leave the server: the drawing is what goes to the browser.
 */
export const loadRidgeMonths = cache(async (): Promise<RidgeMonth[]> => {
  const manifest = await getSalesManifest();
  if (!manifest) return [];
  const prev = previousMonth(easternDay(new Date()));
  const sales = await salesBetween(monthBounds(addMonths(prev, -(RIDGE_MONTHS + 12))).from, monthBounds(prev).to);
  const last = latestCompleteMonth(sales, prev) ?? prev;
  return ridgeMonths(sales, last, RIDGE_MONTHS);
});
