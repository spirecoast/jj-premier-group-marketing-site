import "server-only";
import { getSiteSettings } from "@/lib/content";
import { getEncoreIndex } from "@/lib/encore/data";
import { getSalesManifest, salesBetween } from "@/lib/sales";
import { site } from "@/lib/site";
import { buildEncoreIssue, type EncoreIssue } from "./encore-weekly";
import { easternDay, type FooterInput } from "./render";
import { addMonths, buildTideIssue, monthBounds, previousMonth, type TideIssue } from "./tide-monthly";

/**
 * The server side of the two issues: gather the inputs (the Encore index,
 * the county sales, the settings) and hand them to the pure builders. Used
 * by the routes under app/api/issues and by scripts/issue-preview.mjs.
 */

async function footerFacts(): Promise<Omit<FooterInput, "product">> {
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
export async function loadEncoreIssue(today = issueToday()): Promise<EncoreIssue> {
  return buildEncoreIssue({ index: getEncoreIndex(), today, footer: await footerFacts() });
}

/**
 * The Tide issue for the latest month the county record has complete in all
 * three markets (looking back from the month before `today`), or for `month`
 * (YYYY-MM) when named. Never a partial month by default: the appraisers
 * publish weeks after a sale closes, Manatee about two months. Reads the
 * eighteen months before the earlier of the two as well, for the
 * completeness check. Null when no sales data has been ingested.
 */
export async function loadTideIssue(today = issueToday(), month?: string): Promise<TideIssue | null> {
  const manifest = await getSalesManifest();
  if (!manifest) return null;
  const prev = previousMonth(today);
  const earliest = month && month < prev ? month : prev;
  const latest = month && month > prev ? month : prev;
  const sales = await salesBetween(monthBounds(addMonths(earliest, -18)).from, monthBounds(latest).to);
  return buildTideIssue({
    sales,
    manifest: {
      generatedAt: manifest.generatedAt,
      counties: Object.fromEntries(Object.entries(manifest.counties).map(([k, c]) => [k, { label: c?.label ?? k, to: c?.to ?? null }])),
    },
    today,
    month,
    footer: await footerFacts(),
  });
}
