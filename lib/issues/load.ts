import "server-only";
import { getSiteSettings } from "@/lib/content";
import { loadEncoreIndex } from "@/lib/encore/data";
import { getSalesManifest, salesBetween } from "@/lib/sales";
import { site } from "@/lib/site";
import { buildEncoreIssue, type EncoreIssue } from "./encore-weekly";
import { easternDay, type FooterInput } from "./render";
import { buildIssueModel } from "@/lib/tide/issue";
import { TIDE_ISSUES, type TideIssueEntry } from "@/lib/tide/issues";
import { writingFacts } from "@/lib/tide/narrative";
import { narrativeOf, noteSlots } from "@/lib/tide/notes";
import { addMonths, buildTideIssue, monthBounds, previousMonth, tideMonthFor, type TideIssue } from "./tide-monthly";

/**
 * The server side of the two issues: gather the inputs (the Encore index,
 * the county sales, the settings) and hand them to the pure builders. Used
 * by the routes under app/api/issues and by scripts/issue-preview.mjs.
 */

/** Who the build is for. The subscriber copy carries the subscriber's unsubscribe links (placeholders filled per recipient). */
export type IssueBuildOptions = { audience?: "team" | "subscriber"; unsubscribe?: FooterInput["unsubscribe"] };

export async function footerFacts(): Promise<Omit<FooterInput, "product">> {
  const settings = await getSiteSettings();
  return {
    siteUrl: site.url,
    domain: site.domain,
    teamName: site.name,
    brokerageName: settings.brokerageName || site.brokerage,
    officeAddress: settings.officeAddress,
    phoneDisplay: settings.primaryPhoneDisplay || undefined,
  };
}

/** Today in America/New_York. */
export function issueToday(): string {
  return easternDay(new Date());
}

/** The Monday issue for the week on or after `today`. */
export async function loadEncoreIssue(today = issueToday(), opts: IssueBuildOptions = {}): Promise<EncoreIssue> {
  return buildEncoreIssue({ index: await loadEncoreIndex(), today, footer: { ...(await footerFacts()), unsubscribe: opts.unsubscribe } });
}

/**
 * The Tide issue for the latest month the county record has complete in all
 * three markets (looking back from the month before `today`), or for `month`
 * (YYYY-MM) when named. Never a partial month by default: the appraisers
 * publish weeks after a sale closes, Manatee about two months. Reads the
 * twenty-four months before the earlier of the two as well, for the
 * completeness check. Null when no sales data has been ingested.
 */
export async function loadTideIssue(today = issueToday(), month?: string, opts: IssueBuildOptions = {}): Promise<TideIssue | null> {
  const manifest = await getSalesManifest();
  if (!manifest) return null;
  const prev = previousMonth(today);
  const earliest = month && month < prev ? month : prev;
  const latest = month && month > prev ? month : prev;
  // Twenty-four months: the twelve on the charts and the twelve each typical month is taken over.
  const sales = await salesBetween(monthBounds(addMonths(earliest, -24)).from, monthBounds(latest).to);
  const tideManifest = {
    generatedAt: manifest.generatedAt,
    counties: Object.fromEntries(Object.entries(manifest.counties).map(([k, c]) => [k, { label: c?.label ?? k, to: c?.to ?? null, from: c?.from ?? null }])),
  };
  const covers = tideMonthFor(sales, today, month);
  // The subscriber send names its month but is this month's issue: it takes this month's words even before `data` is pinned.
  const entry = tideEntryFor(covers, today, opts.audience === "subscriber" ? undefined : month);
  // The web issue's model for the same month gives the facts to write from: the same figures the page shows.
  const model = buildIssueModel({ entry: { ...entry, data: covers }, sales, manifest: tideManifest, posts: [] });
  return buildTideIssue({
    sales,
    manifest: tideManifest,
    today,
    month,
    footer: { ...(await footerFacts()), unsubscribe: opts.unsubscribe },
    audience: opts.audience,
    writing: { narrative: narrativeOf(entry), notes: noteSlots(entry.commentary, "draft"), facts: writingFacts(model) },
  });
}

/**
 * The web issue whose words go with the email for `covers`: the entry pinned
 * to that data month, else (for the default build) the entry for this month's
 * issue that hasn't pinned one yet, else a bare entry with no words.
 */
export function tideEntryFor(covers: string, today: string, month?: string): TideIssueEntry {
  const pinned = TIDE_ISSUES.find((e) => e.data === covers);
  if (pinned) return pinned;
  const current = !month ? TIDE_ISSUES.find((e) => !e.data && e.issue === today.slice(0, 7)) : undefined;
  return current ?? { issue: today.slice(0, 7) };
}

/** The newest Tide issue page, for the welcome email: /tide/<issue>. */
export function latestTidePath(): string {
  const newest = TIDE_ISSUES[0];
  return newest ? `/tide/${newest.issue}` : "/tide";
}
