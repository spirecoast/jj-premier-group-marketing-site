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
 *
 *   npm run tide:freeze -- 2026-10 --add-missing --data-root <dir>
 *
 * Adds to an issue already frozen only the figures its snapshot doesn't have
 * yet (a field added to the figures after it was frozen, such as `trend`),
 * computed from the same data refresh the snapshot was frozen from. Every
 * figure already in the snapshot stays exactly as it is. `--data-root` is a
 * folder holding that refresh's data/sales (from git: `git show
 * <commit>:data/sales/<file>`); without it, data/sales here. Refuses when the
 * data's generated date isn't the snapshot's `frozenAt`.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const issue = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--data-root");
const force = args.includes("--force");
const addMissing = args.includes("--add-missing");
const dataRoot = args.includes("--data-root") ? args[args.indexOf("--data-root") + 1] : undefined;
if (!issue || !/^\d{4}-(0[1-9]|1[0-2])$/.test(issue) || (dataRoot !== undefined && !dataRoot)) {
  console.error("Usage: npm run tide:freeze -- YYYY-MM [--force] [--add-missing [--data-root <dir>]]");
  process.exit(1);
}
// The snapshots live in this repo whatever folder the sales are read from.
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// lib/sales reads data/sales under the working directory when it loads: move there first to read an earlier refresh.
if (dataRoot) process.chdir(path.resolve(dataRoot));

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
if (snapshotFor(issue) && !force && !addMissing) {
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
const computed = computeFigures({ entry, sales, manifest: tideManifest });
if (computed.markets.every((m) => m.stats.count === 0)) {
  console.error(`The sales data doesn't reach ${computed.dataMonth}; nothing to freeze.`);
  process.exit(1);
}
const dir = path.join(repo, "lib", "tide", "snapshots");
let figures = computed;
if (addMissing) {
  const file = path.join(dir, `${issue}.json`);
  const frozen = snapshotFor(issue) ? JSON.parse(readFileSync(file, "utf8")) : null;
  if (!frozen) {
    console.error(`${issue} isn't frozen yet: run it without --add-missing.`);
    process.exit(1);
  }
  if (frozen.frozenAt !== manifest.generatedAt) {
    console.error(`${issue} was frozen from the data generated ${frozen.frozenAt}, but data/sales${dataRoot ? ` under ${dataRoot}` : ""} was generated ${manifest.generatedAt}. Point --data-root at that refresh's data/sales so the added figures come from the same record.`);
    process.exit(1);
  }
  if (computed.dataMonth !== frozen.dataMonth) {
    console.error(`${issue}: this data builds ${computed.dataMonth}, but the snapshot covers ${frozen.dataMonth}.`);
    process.exit(1);
  }
  const added = Object.keys(computed).filter((k) => !(k in frozen));
  if (!added.length) {
    console.log(`${issue}: the snapshot already has every figure; nothing added.`);
    process.exit(0);
  }
  // Only the new keys; every figure already frozen stays exactly as it was.
  figures = { ...frozen, ...Object.fromEntries(added.map((k) => [k, computed[k]])) };
  console.log(`${issue}: adding ${added.join(", ")} from the data generated ${manifest.generatedAt}.`);
}
const model = buildIssueModel({ entry, sales, manifest: tideManifest, posts: [], figures });
if (model.missingTokens.length) {
  console.error(`Tokens in the ${issue} narrative name no figure:`);
  for (const t of model.missingTokens) console.error(`  ${t.field}: {${t.token}}`);
  process.exit(1);
}

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
