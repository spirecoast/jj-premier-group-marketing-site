#!/usr/bin/env node
/**
 * Render the Encore and Tide issues to local files, without the server and
 * without sending anything.
 *
 *   npm run issue:preview -- encore                     # the week on or after today
 *   npm run issue:preview -- encore --date 2026-10-05   # the week on or after that day
 *   npm run issue:preview -- tide                       # the month before today
 *   npm run issue:preview -- tide --month 2026-07       # a named month
 *   npm run issue:preview -- both --out scratchpad/issues --site https://jjpremiergroup.com
 *
 * Writes <out>/<kind>-<period>.html, .txt and .json (subject, warnings and,
 * for Tide, every computed figure) and prints the paths. Default out:
 * scratchpad/issues/ (gitignored). The npm script runs this under tsx with
 * the react-server condition so the server modules it reuses (lib/issues/load.ts)
 * import as they do in the app; run it the same way by hand:
 *   npx tsx --conditions=react-server scripts/issue-preview.mjs encore
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const kind = args.find((a) => !a.startsWith("--")) ?? "both";
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const date = opt("date");
const month = opt("month");
const out = opt("out") ?? path.join("scratchpad", "issues");
const site = opt("site");

if (!["encore", "tide", "both"].includes(kind)) {
  console.error(`Unknown issue "${kind}". Use encore, tide or both.`);
  process.exit(1);
}
if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("--date takes YYYY-MM-DD");
  process.exit(1);
}
if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
  console.error("--month takes YYYY-MM");
  process.exit(1);
}
// lib/site.ts reads the origin when it loads, so set it before the import.
if (site) process.env.NEXT_PUBLIC_SITE_URL = site;

const { issueToday, loadEncoreIssue, loadTideIssue } = await import("../lib/issues/load.ts");
const today = date ?? issueToday();
mkdirSync(out, { recursive: true });

function write(issue, extra) {
  const base = path.join(out, `${issue.kind}-${issue.kind === "tide" ? issue.month : issue.period.from}`);
  writeFileSync(`${base}.html`, issue.html);
  writeFileSync(`${base}.txt`, issue.text);
  writeFileSync(`${base}.json`, JSON.stringify({ subject: issue.subject, preheader: issue.preheader, period: issue.period, needsEdit: issue.needsEdit, warnings: issue.warnings, ...extra }, null, 2));
  console.log(`${issue.subject}\n  ${base}.html\n  ${base}.txt\n  ${base}.json`);
  for (const w of issue.warnings) console.log(`  ! ${w}`);
}

if (kind === "encore" || kind === "both") {
  const issue = await loadEncoreIssue(today);
  write(issue, { performances: issue.performances, picks: issue.picks.map((o) => ({ slug: o.e.s, day: o.day, time: o.time, market: o.e.m, category: o.e.c })), onView: issue.onView.map((e) => e.s) });
}
if (kind === "tide" || kind === "both") {
  const issue = await loadTideIssue(today, month);
  if (!issue) {
    console.error("No county sales data in data/sales (docs/SALES-DATA.md).");
    process.exit(1);
  }
  write(issue, { month: issue.month, asOf: issue.asOf, through: issue.through, latestComplete: issue.latestComplete, markets: issue.markets });
}
