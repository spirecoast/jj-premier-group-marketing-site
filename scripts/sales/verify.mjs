#!/usr/bin/env node
/**
 * The regression gate after the weekly sales ingest (.github/workflows/sales-refresh.yml):
 *
 *   node scripts/sales/verify.mjs --before <copy of data/sales before the ingest> [--after data/sales]
 *        [--summary $GITHUB_STEP_SUMMARY] [--body pr-body.md] [--output $GITHUB_OUTPUT]
 *
 * Exits 1, so the workflow opens no pull request, when any county's file
 * looks broken or truncated (scripts/sales/verify-lib.mjs has the rules).
 * Otherwise writes <after>/new-sales.json.gz, the sales the county recorded
 * since the last refresh, which Street Watch emails to watchers once the
 * pull request is merged and deployed, and a PR body with the delta table.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { checkCounty, deltaTable, newSales, parseZipMarket } from "./verify-lib.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : (args[i + 1] ?? fallback);
};
const BEFORE = flag("before");
const AFTER = path.resolve(flag("after", "data/sales"));
const SUMMARY = flag("summary");
const BODY = flag("body");
const OUTPUT = flag("output");

async function readJson(dir, file) {
  try {
    const buf = await readFile(path.join(dir, file));
    return JSON.parse(file.endsWith(".gz") ? gunzipSync(buf).toString("utf8") : buf.toString("utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const after = await readJson(AFTER, "manifest.json");
  if (!after) throw new Error(`no manifest in ${AFTER}`);
  const before = BEFORE ? await readJson(path.resolve(BEFORE), "manifest.json") : null;
  const zipMarket = parseZipMarket(await readFile(path.resolve("lib/issues/tide-markets.ts"), "utf8").catch(() => ""));

  const errors = [];
  const warnings = [];
  const counties = [];
  const added = [];
  for (const [county, m] of Object.entries(after.counties)) {
    const rows = (await readJson(AFTER, m.file)) ?? [];
    const prevManifest = before?.counties?.[county] ?? null;
    const prevRows = prevManifest ? await readJson(path.resolve(BEFORE), prevManifest.file) : null;
    const res = checkCounty(county, {
      before: prevManifest && prevRows ? { manifest: prevManifest, rows: prevRows } : null,
      after: { manifest: m, rows },
      generatedAt: after.generatedAt,
    });
    errors.push(...res.errors);
    warnings.push(...res.warnings);
    // On a county's first run everything is "new"; nobody should get an email about two years of sales.
    const fresh = prevRows ? newSales(prevRows, rows) : [];
    added.push(...fresh);
    counties.push({ county, before: prevManifest && prevRows ? { manifest: prevManifest, rows: prevRows } : null, after: { manifest: m, rows }, added: fresh });
  }

  const table = deltaTable(counties, zipMarket);
  const report = [
    errors.length ? `**Stopped: ${errors.length === 1 ? "one check failed" : `${errors.length} checks failed`}.** No pull request was opened.` : "Every check passed.",
    ...errors.map((e) => `- ${e}`),
    ...(warnings.length ? ["", "**To look at before merging:**", ...warnings.map((w) => `- ${w}`)] : []),
    "",
    table,
  ].join("\n");
  console.log(report);
  if (SUMMARY) await writeFile(SUMMARY, `## Sales data refresh\n\n${report}\n`, { flag: "a" });
  if (OUTPUT) await writeFile(OUTPUT, `clean=${errors.length || warnings.length ? "false" : "true"}\nnew=${added.length}\n`, { flag: "a" });
  if (errors.length) process.exit(1);

  // Street Watch's input: what is new since the data the site serves now.
  await writeFile(
    path.join(AFTER, "new-sales.json.gz"),
    gzipSync(
      JSON.stringify({
        generatedAt: after.generatedAt,
        since: before?.generatedAt ?? null,
        through: Object.fromEntries(Object.entries(after.counties).map(([k, c]) => [k, c.to])),
        rows: added,
      }),
      { level: 9 },
    ),
  );

  if (BODY) {
    await writeFile(
      BODY,
      [
        "Automated refresh of `data/sales/` from the Manatee and Sarasota County Property Appraisers (public record, Florida Statutes ch. 119; names stripped at ingest).",
        "",
        report,
        "",
        `\`new-sales.json.gz\` lists the ${added.length.toLocaleString("en-US")} sales recorded since the last refresh; once this is merged and deployed, the daily Street Watch run emails them to the people watching those streets and places.`,
        "",
        "The checks: rows may not fall more than 10%, the newest sale may not move backwards, no property type may vanish, the share of rows with a living area may not fall more than 5 points, at most 1% of rows may carry a ZIP outside the county's set, and every column the ingest reads must be in the header. See `docs/SALES-DATA.md`.",
      ].join("\n"),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
