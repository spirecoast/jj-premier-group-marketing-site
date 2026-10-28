/**
 * The regression gate for the weekly sales refresh (docs/SALES-DATA.md):
 * compare what the ingest just wrote with what the site serves now, fail
 * the run on a broken or truncated county file, warn on a stall, and list
 * the sales that are new since the last refresh (Street Watch reads them).
 * Pure: records and manifests in, findings out, so lib/sales/verify.test.ts
 * runs it on fixtures. scripts/sales/verify.mjs does the reading and writing.
 */

/** Every ZIP each county's record has carried (October 2026). A row outside them is a parse or column problem, not a new town. */
export const KNOWN_ZIPS = {
  manatee: ["33598", "34201", "34202", "34203", "34205", "34207", "34208", "34209", "34210", "34211", "34212", "34215", "34216", "34217", "34219", "34221", "34222", "34228", "34243", "34250", "34251"],
  sarasota: ["34223", "34224", "34228", "34229", "34231", "34232", "34233", "34234", "34235", "34236", "34237", "34238", "34239", "34240", "34241", "34242", "34243", "34251", "34275", "34285", "34286", "34287", "34288", "34289", "34291", "34292", "34293"],
};

export const LIMITS = {
  /** Fail when a county loses more than this share of its rows. */
  rowDrop: 0.1,
  /** Fail when the share of rows with a living area falls by more than this (0.05 = five points). */
  livingAreaDrop: 0.05,
  /** Fail when more than this share of rows carry a ZIP outside the county's known set. */
  unknownZip: 0.01,
  /** Warn when the newest sale date hasn't moved for this many refreshes in a row. */
  staleRuns: 3,
  /** Warn when the newest sale is this many days older than the run. */
  staleDays: 21,
  /** Warn when the share of rows with coordinates or a subdivision name falls by more than this. */
  optionalDrop: 0.05,
};

const share = (rows, pred) => (rows.length ? rows.filter(pred).length / rows.length : 0);
const pts = (x) => `${(x * 100).toFixed(1)}%`;
const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** The key a sale keeps from one refresh to the next. */
export const saleKey = (r) => `${r.county}|${r.parcelId}|${r.saleDate}`;

/**
 * One county's checks. `before` is null on a county's first run (nothing to
 * compare). Returns plain-sentence errors (the run fails, no PR) and
 * warnings (the PR opens, and says so at the top).
 */
export function checkCounty(county, { before, after, generatedAt, limits = LIMITS }) {
  const errors = [];
  const warnings = [];
  const a = after.rows;
  if (!a.length) errors.push(`${county}: the new file has no rows.`);
  if (before) {
    const b = before.rows;
    if (b.length && a.length < b.length * (1 - limits.rowDrop)) {
      errors.push(`${county}: rows fell from ${b.length.toLocaleString("en-US")} to ${a.length.toLocaleString("en-US")} (${pts(1 - a.length / b.length)} fewer; the limit is ${pts(limits.rowDrop)}).`);
    }
    if (before.manifest?.to && after.manifest?.to && after.manifest.to < before.manifest.to) {
      errors.push(`${county}: the newest sale moved backwards, from ${before.manifest.to} to ${after.manifest.to}.`);
    }
    const lostUses = Object.keys(before.manifest?.byUse ?? {}).filter((u) => (before.manifest.byUse[u] ?? 0) > 0 && !(after.manifest?.byUse?.[u] > 0));
    if (lostUses.length) errors.push(`${county}: no rows left for ${lostUses.join(", ")} (there were ${lostUses.map((u) => before.manifest.byUse[u]).join(", ")}).`);
    const laBefore = share(b, (r) => r.livingArea !== null);
    const laAfter = share(a, (r) => r.livingArea !== null);
    if (b.length && laBefore - laAfter > limits.livingAreaDrop) {
      errors.push(`${county}: rows with a living area fell from ${pts(laBefore)} to ${pts(laAfter)} (more than ${Math.round(limits.livingAreaDrop * 100)} points).`);
    }
    for (const [label, pred] of [
      ["coordinates", (r) => typeof r.lat === "number"],
      ["a subdivision name", (r) => Boolean(r.subdivision)],
    ]) {
      const was = share(b, pred);
      const now = share(a, pred);
      if (b.length && was - now > limits.optionalDrop) warnings.push(`${county}: rows with ${label} fell from ${pts(was)} to ${pts(now)}.`);
    }
  }
  const known = new Set(KNOWN_ZIPS[county] ?? []);
  if (known.size && a.length) {
    const outside = a.filter((r) => !known.has(r.zip));
    if (outside.length / a.length > limits.unknownZip) {
      const sample = [...new Set(outside.map((r) => r.zip || "(blank)"))].slice(0, 6).join(", ");
      errors.push(`${county}: ${outside.length.toLocaleString("en-US")} rows (${pts(outside.length / a.length)}) have a ZIP outside the county's known set (${sample}).`);
    }
  }
  const to = after.manifest?.to;
  const runs = after.manifest?.toUnchangedRuns ?? 0;
  if (to && runs >= limits.staleRuns) warnings.push(`${county}: the newest sale has been ${to} for ${runs} refreshes in a row. That's the county's file, not the ingest; Street Watch alerts for ${county} wait with it.`);
  else if (to && generatedAt && days(to, generatedAt.slice(0, 10)) > limits.staleDays) warnings.push(`${county}: the newest sale is ${to}, ${days(to, generatedAt.slice(0, 10))} days before this run.`);
  return { errors, warnings };
}

/** The sales in `after` that weren't in `before`: what the county recorded since the last refresh. Newest first. */
export function newSales(beforeRows, afterRows) {
  const seen = new Set(beforeRows.map(saleKey));
  return afterRows.filter((r) => !seen.has(saleKey(r))).sort((x, y) => (x.saleDate < y.saleDate ? 1 : x.saleDate > y.saleDate ? -1 : 0));
}

/** "+1,204" / "−37" / "0". */
const signed = (n) => (n > 0 ? `+${n.toLocaleString("en-US")}` : n < 0 ? `−${Math.abs(n).toLocaleString("en-US")}` : "0");

/**
 * The PR body's table: one line per county with rows ±, the newest sale
 * and how far it moved, and the new sales by Tide market.
 */
export function deltaTable(counties, zipMarket = {}) {
  const lines = ["| County | Rows | Newest sale | New since last refresh |", "| --- | --- | --- | --- |"];
  for (const c of counties) {
    const rowsNow = c.after.rows.length;
    const rowsWas = c.before?.rows.length ?? 0;
    const toNow = c.after.manifest?.to ?? "none";
    const toWas = c.before?.manifest?.to ?? null;
    const moved = toWas && toNow !== "none" ? days(toWas, toNow) : null;
    const byMarket = new Map();
    for (const r of c.added) {
      const m = zipMarket[r.zip] ?? "other ZIPs";
      byMarket.set(m, (byMarket.get(m) ?? 0) + 1);
    }
    const markets = [...byMarket.entries()].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m} ${n}`).join(", ");
    lines.push(
      `| ${c.county} | ${rowsNow.toLocaleString("en-US")} (${signed(rowsNow - rowsWas)}) | ${toNow}${moved === null ? "" : moved === 0 ? " (unchanged)" : ` (${signed(moved)} days)`} | ${c.added.length.toLocaleString("en-US")}${markets ? ` · ${markets}` : ""} |`,
    );
  }
  return lines.join("\n");
}

/** Pull the ZIP → market table out of lib/issues/tide-markets.ts without a TypeScript loader. */
export function parseZipMarket(source) {
  const out = {};
  for (const m of source.matchAll(/"(\d{5})":\s*"([a-z-]+)"/g)) out[m[1]] = m[2];
  return out;
}
