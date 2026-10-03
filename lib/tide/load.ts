import "server-only";
import { cache } from "react";
import { getPosts } from "@/lib/content";
import { addMonths, monthBounds, previousMonth } from "@/lib/issues/tide-monthly";
import { getSalesManifest, salesBetween } from "@/lib/sales";
import { buildIssueModel, issueCard, type IssueModel } from "./issue";
import { TIDE_ISSUES, getIssueEntry } from "./issues";

/**
 * The server side of the web issue: the county sales, the manifest and the
 * posts in, the model out (lib/tide/issue.ts). Null when the issue isn't in
 * lib/tide/issues.ts, no sales data has been ingested, or the data doesn't
 * reach the issue's data month.
 *
 * Reads two years back from the month before the issue: the charts' twelve
 * months, the typical month's twelve before those, and the completeness check.
 */
export const loadIssueModel = cache(async (issue: string): Promise<IssueModel | null> => {
  const entry = getIssueEntry(issue);
  if (!entry) return null;
  const manifest = await getSalesManifest();
  if (!manifest) return null;
  const prev = previousMonth(`${issue}-01`);
  const [sales, posts] = await Promise.all([salesBetween(monthBounds(addMonths(prev, -24)).from, monthBounds(prev).to), getPosts()]);
  const model = buildIssueModel({
    entry,
    sales,
    manifest: {
      generatedAt: manifest.generatedAt,
      counties: Object.fromEntries(Object.entries(manifest.counties).map(([k, c]) => [k, { label: c?.label ?? k, to: c?.to ?? null, from: c?.from ?? null }])),
    },
    posts,
    showSamples: process.env.NEXT_PUBLIC_SHOW_SAMPLE_LISTINGS === "true",
  });
  // The data window is 24 months: an issue whose month it no longer reaches is a 404, not a page of zeros.
  if (model.markets.every((m) => m.stats.count === 0)) return null;
  if (!model.fairHousing.passed) {
    // A street name or a paragraph tripped the checker: stop the build rather than publish it.
    throw new Error(`Tide ${issue}: Fair Housing check flagged ${model.fairHousing.flags.map((f) => f.reason).join("; ")}`);
  }
  return model;
});

/** The archive cards for every issue the data can build, newest first. */
export async function loadIssueCards() {
  const models = await Promise.all(TIDE_ISSUES.map((e) => loadIssueModel(e.issue)));
  return models.filter((m): m is IssueModel => m !== null).map((m) => ({ ...issueCard(m), issue: m.issue }));
}
