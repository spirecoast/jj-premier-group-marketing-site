/**
 * The caps on Google Places, with no I/O so the tests can hold them
 * (photo.test.ts). Every call is counted against these before it's made
 * (./budget.ts). Nobody has authorized any spend, so they keep each SKU
 * inside Google's free monthly allowance and must never go up.
 */

/** Calls per SKU: 30 a Pacific-time day and 900 a month, inside the 1,000 free a month each SKU has. */
export const PLACES_CAP = { day: 30, month: 900 } as const;

/**
 * Lists one visitor can open in a Pacific-time day, across Nearby and Text
 * Search, inside the site-wide cap: a Planner evening with two shows (dinner,
 * drinks and a hotel near each) is six, and a few more for a change of mind.
 * At most a quarter of a day's calls go to any one visitor. Photos have a
 * count of their own with the same cap, so a photo never costs a list.
 */
export const PLACES_VISITOR_CAP = 8;

/**
 * Google's billing SKUs, one row each in places_usage: Nearby Search and Text
 * Search (both on the Enterprise SKU, for the rating and hours), and Place
 * Photos (the "Place Details Photos" SKU).
 */
export type Sku = "nearby" | "text" | "photo";

export type Take = { ok: true } | { ok: false; reason: "day" | "month" | "error" };
export type CapReason = "day" | "month" | "error" | "visitor";
