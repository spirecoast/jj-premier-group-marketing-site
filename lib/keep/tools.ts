/**
 * The results a visitor can keep (F91): print them, save them as a PDF from
 * the print dialog, or have the link emailed to them. One entry per tool,
 * read by the browser (components/keep/*) and by the server (app/api/keep),
 * so a request can only ever name one of these and a path on this site.
 *
 * Pure and free of server imports.
 */

import type { ProductFamily } from "@/lib/site";

type Family = ProductFamily["key"];

export type KeepToolId = "atlas-move" | "atlas-match" | "encore-planner" | "tide-street" | "tide-home-value" | "tide-sale-calculator" | "tide-issue";

export type KeepTool = {
  /** The product family, for the lockup at the head of the printed sheet. */
  family: Family;
  /** The product's name as the lockup draws it; the home value page is the team's own, so it has none. */
  product?: string;
  /** What the thing is, in a sentence: "your plan", "your list". */
  noun: string;
  /** The email's subject. */
  subject: string;
  /** The page it lives on: the link in an email has to be this path (or under it, with `under`). */
  path: string;
  under?: boolean;
  /** One line at the foot of the printed sheet saying where the numbers come from. Existing sentences from each tool, never new claims. */
  source: string;
};

export const KEEP_TOOLS: Record<KeepToolId, KeepTool> = {
  "atlas-move": {
    family: "atlas",
    product: "Atlas Move",
    noun: "your moving plan",
    subject: "Your Atlas Move plan",
    path: "/relocate",
    source: "Each date’s reason and its source are on the plan on our site: scan the code to open it.",
  },
  "atlas-match": {
    family: "atlas",
    product: "Atlas Match",
    noun: "your Atlas Match list",
    subject: "Your Atlas Match list",
    path: "/neighborhoods/match",
    source: "Facts come from county, district, association and builder sources.",
  },
  "encore-planner": {
    family: "encore",
    product: "Encore Planner",
    noun: "your Encore plan",
    subject: "Your Encore plan",
    path: "/calendar/plan",
    source: "From Encore, the arts calendar for Lakewood Ranch, Sarasota and Bradenton, built from each venue’s own listing.",
  },
  "tide-street": {
    family: "tide",
    product: "Tide Street",
    noun: "the sales on your street",
    subject: "Tide Street: the sales on your street",
    path: "/sell/sold",
    source: "Source: Manatee County Property Appraiser / Sarasota County Property Appraiser, public record.",
  },
  "tide-home-value": {
    family: "tide",
    noun: "the record for your address",
    subject: "The record for your address",
    path: "/sell/home-value",
    source: "Not MLS data. The county’s roll runs a few weeks behind the closing table, and a sale the appraiser didn’t qualify as arm’s-length isn’t shown.",
  },
  "tide-sale-calculator": {
    family: "tide",
    product: "Tide Sale Calculator",
    noun: "your sale estimate",
    subject: "Your sale estimate",
    path: "/sell/net-proceeds",
    source: "This is an estimate, built from Florida’s standard rates and fees. Your title company’s closing statement has the final numbers.",
  },
  "tide-issue": {
    family: "tide",
    product: "Tide Market Report",
    noun: "this Tide issue",
    subject: "Tide Market Report",
    path: "/tide/",
    under: true,
    source: "Every number here comes from the home sales in the county’s public record.",
  },
};

export function isKeepTool(v: unknown): v is KeepToolId {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(KEEP_TOOLS, v);
}

/** The longest link we'll put in an email: every tool's link fits well inside it. */
export const KEEP_URL_MAX = 1500;

/**
 * The link to email: the path and query of `raw` on this site, if it is this
 * tool's page; null otherwise. `raw` may be absolute (any host is replaced by
 * the site's own, so a request can't point the email anywhere else) or a path.
 */
export function keepPath(tool: KeepToolId, raw: unknown): string | null {
  if (typeof raw !== "string" || !raw || raw.length > KEEP_URL_MAX) return null;
  let u: URL;
  try {
    u = new URL(raw, "https://site.invalid");
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const t = KEEP_TOOLS[tool];
  const path = u.pathname;
  const ok = t.under ? path.startsWith(t.path) && path.length > t.path.length && /^[a-z0-9/-]+$/.test(path) : path === t.path;
  if (!ok) return null;
  return `${path}${u.search}`;
}
