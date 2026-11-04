import "server-only";
import { and, eq, gt, gte, or } from "drizzle-orm";
import { getEncoreIndex } from "@/lib/encore/data";
import { loadEncoreSnapshot } from "@/lib/encore/live";
import { occurrences } from "@/lib/encore/select";
import { buildEncoreIssue, type EncoreIssue } from "@/lib/issues/encore-weekly";
import { footerFacts } from "@/lib/issues/load";
import { addDays } from "@/lib/issues/render";
import { ENCORE_LETTER_WEEKS, currentEncoreMonday, encoreLetterPath, listedEncoreWeeks, weekDrawing, type WeekDay } from "./weeks";

/**
 * Encore's issues on the site (docs/ISSUES.md, "Encore on the web"): which
 * Mondays have a page, and each one built by the email's own builder
 * (lib/issues/encore-weekly.ts buildEncoreIssue) from the same calendar, so
 * the page and the email carry the same picks, in the same order, in the
 * same words.
 */

const DAY_MS = 86_400_000;
const MEMO_MS = 5 * 60_000;

let sentMemo: { at: number; oldest: string; weeks: string[] | null } | null = null;

/**
 * The Mondays the database has as sent to subscribers (issue_sends: kind
 * encore, sent, or going out with at least one delivered), from `oldest` on.
 * Null when there's no database or it can't be read: the page then lists this
 * week's issue alone. Never throws.
 */
export async function sentEncoreWeeks(oldest: string): Promise<string[] | null> {
  if (!process.env.DATABASE_URL) return null;
  if (sentMemo && sentMemo.oldest === oldest && Date.now() - sentMemo.at < MEMO_MS) return sentMemo.weeks;
  let weeks: string[] | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const [{ getDb }, { issueSends }] = await Promise.all([import("@/lib/db"), import("@/lib/db/schema")]);
    const rows = await Promise.race([
      getDb()
        .select({ period: issueSends.period })
        .from(issueSends)
        .where(and(eq(issueSends.kind, "encore"), gte(issueSends.period, oldest), or(eq(issueSends.status, "sent"), gt(issueSends.sentCount, 0)))),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timed out after 4000ms")), 4000);
      }),
    ]);
    weeks = rows.map((r) => r.period);
  } catch (err) {
    console.warn(`[newsletters] couldn't read the Encore sends, listing this week's issue: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timer);
  }
  sentMemo = { at: Date.now(), oldest, weeks };
  return weeks;
}

/** This week's Monday and the Mondays with a page, newest first. */
export async function encoreLetterWeeks(now = new Date()): Promise<{ current: string; listed: string[] }> {
  const current = currentEncoreMonday(now);
  const sent = await sentEncoreWeeks(addDays(current, -7 * (ENCORE_LETTER_WEEKS - 1)));
  return { current, listed: listedEncoreWeeks(current, sent) };
}

/** What a tile and a cover need. */
export type EncoreLetterCard = {
  monday: string;
  href: string;
  /** "November 2 to 8" */
  range: string;
  /** "The week of November 2 to 8" */
  title: string;
  picks: number;
  performances: number;
  days: WeekDay[];
};

export type EncoreLetter = { issue: EncoreIssue; card: EncoreLetterCard };

const letterMemo = new Map<string, { at: number; snap: unknown; value: EncoreLetter }>();

/**
 * The Monday issue for the week starting `monday`, built the way the Monday
 * cron builds the email (app/api/issues/encore): the same builder, the same
 * week, the calendar as it stands. The index reaches back to the day before
 * the Monday, so the days already past keep their picks, as they were on
 * the Monday morning.
 */
export async function loadEncoreLetter(monday: string): Promise<EncoreLetter> {
  const snap = await loadEncoreSnapshot();
  const hit = letterMemo.get(monday);
  if (hit && hit.snap === snap && Date.now() - hit.at < MEMO_MS) return hit.value;
  const index = getEncoreIndex(snap, { since: Date.parse(`${monday}T00:00:00Z`) - DAY_MS });
  const issue = buildEncoreIssue({ index, today: monday, footer: await footerFacts() });
  const occs = occurrences(index, issue.period.from, issue.period.to, {});
  const value: EncoreLetter = {
    issue,
    card: {
      monday,
      href: encoreLetterPath(monday),
      range: issue.period.label,
      title: issue.title,
      picks: issue.picks.length,
      performances: issue.performances,
      days: weekDrawing(occs, issue.picks, issue.period.from),
    },
  };
  if (letterMemo.size > 16) letterMemo.clear();
  letterMemo.set(monday, { at: Date.now(), snap, value });
  return value;
}
