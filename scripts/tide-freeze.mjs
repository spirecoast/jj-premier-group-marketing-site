#!/usr/bin/env node
/**
 * Freeze a published Tide issue's figures, so a later sales refresh never
 * changes a page readers have already seen (docs/ISSUES.md, "Freezing an issue").
 *
 *   npm run tide:freeze -- 2026-10
 *
 * Builds the issue from data/sales exactly as the page would, writes every
 * computed figure to lib/tide/snapshots/<issue>.json, and rewrites
 * lib/tide/snapshots/index.ts from the folder. Refuses an issue that isn't in
 * lib/tide/issues.ts, one whose entry hasn't pinned its data month, or one
 * whose narrative carries a token the figures can't fill. Commit the result.
 * Run under tsx with the react-server condition (the npm script does), since
 * lib/sales is a server module.
 */
import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const issue = process.argv.slice(2).find((a) => !a.startsWith("--"));
const force = process.argv.includes("--force");
if (!issue || !/^\d{4}-(0[1-9]|1[0-2])$/.test(issue)) {
  console.error("Usage: npm run tide:freeze -- YYYY-MM [--force]");
  process.exit(1);
}

const { getIssueEntry } = await import("../lib/tide/issues.ts");
const { computeFigures, buildIssueModel } = await import("../lib/tide/issue.ts");
const { getSalesManifest, salesBetween } = await import("../lib/sales/index.ts");
const { addMonths, monthBounds, previousMonth } = await import("../lib/issues/tide-monthly.ts");
const { snapshotFor } = await import("../lib/tide/snapshots/index.ts");

const entry = getIssueEntry(issue);
if (!entry) {
  console.error(`No entry for ${issue} in lib/tide/issues.ts.`);
  process.exit(1);
}
if (!entry.data) {
  console.error(`${issue} hasn't pinned its data month. Write \`data: "YYYY-MM"\` into its entry first, so the snapshot and the entry agree.`);
  process.exit(1);
}
if (snapshotFor(issue) && !force) {
  console.error(`${issue} is already frozen (lib/tide/snapshots/${issue}.json). Pass --force to replace it; a published issue should not change.`);
  process.exit(1);
}
const manifest = await getSalesManifest();
if (!manifest) {
  console.error("No county sales data in data/sales (docs/SALES-DATA.md).");
  process.exit(1);
}
const prev = previousMonth(`${issue}-01`);
const sales = await salesBetween(monthBounds(addMonths(prev, -24)).from, monthBounds(prev).to);
const tideManifest = {
  generatedAt: manifest.generatedAt,
  counties: Object.fromEntries(Object.entries(manifest.counties).map(([k, c]) => [k, { label: c?.label ?? k, to: c?.to ?? null, from: c?.from ?? null }])),
};
const figures = computeFigures({ entry, sales, manifest: tideManifest });
if (figures.markets.every((m) => m.stats.count === 0)) {
  console.error(`The sales data doesn't reach ${figures.dataMonth}; nothing to freeze.`);
  process.exit(1);
}
const model = buildIssueModel({ entry, sales, manifest: tideManifest, posts: [], figures });
if (model.missingTokens.length) {
  console.error(`Tokens in the ${issue} narrative name no figure:`);
  for (const t of model.missingTokens) console.error(`  ${t.field}: {${t.token}}`);
  process.exit(1);
}

const dir = path.join(process.cwd(), "lib", "tide", "snapshots");
writeFileSync(path.join(dir, `${issue}.json`), `${JSON.stringify(figures, null, 2)}\n`);
const files = readdirSync(dir)
  .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
  .sort()
  .reverse();
const index = [
  `import type { IssueFigures } from "../issue";`,
  ...files.map((f) => `import s${f.slice(0, 7).replace("-", "_")} from "./${f}";`),
  ``,
  `/**`,
  ` * The frozen figures of every published Tide issue, one JSON file per issue,`,
  ` * written by \`npm run tide:freeze -- <issue>\` once the issue is out (docs/ISSUES.md,`,
  ` * "Freezing an issue"). The loader draws a published issue from its snapshot,`,
  ` * so the weekly sales refresh never changes a page a reader has already seen.`,
  ` * The freeze script rewrites this file from the folder's listing; add an`,
  ` * issue by running it, not by hand.`,
  ` */`,
  `// prettier-ignore`,
  `export const SNAPSHOTS: Readonly<Record<string, IssueFigures>> = {`,
  ...files.map((f) => `  "${f.slice(0, 7)}": s${f.slice(0, 7).replace("-", "_")} as IssueFigures,`),
  `};`,
  ``,
  `export function snapshotFor(issue: string): IssueFigures | undefined {`,
  `  return SNAPSHOTS[issue];`,
  `}`,
  ``,
].join("\n");
writeFileSync(path.join(dir, "index.ts"), index);
console.log(`Froze ${issue} (${figures.dataMonth} figures, data as of ${figures.frozenAt.slice(0, 10)}): lib/tide/snapshots/${issue}.json`);
