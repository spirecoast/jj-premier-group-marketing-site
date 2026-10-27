#!/usr/bin/env node
// Open every source URL the dataset cites and report the ones that have gone: 404 and 410 ("dead"), pages that
// redirect somewhere else entirely ("moved"), hosts that refuse scripted requests ("blocked"; open them in a
// browser) and network errors. For each dead page it asks the Wayback Machine for the closest snapshot so the
// link can be swapped for the archived copy (the site labels web.archive.org links "archived copy"). REPORT ONLY —
// a person reviews the report and edits the data (see docs/REFRESH-RUNBOOK.md, "Dead sources").
//
//   node scripts/check-sources.mjs                 # every unique URL, about 450 of them, 5–10 minutes
//   node scripts/check-sources.mjs --slug harbour-isle,sweetwater
//   node scripts/check-sources.mjs --limit 20
//   node scripts/check-sources.mjs --no-wayback    # skip the snapshot lookups
//
// Map services (arcgis.com, scgov.net, mymanatee.org) answer every path with 200, so they are only checked for
// reachability; a layer that was renamed shows up in refresh-gis.mjs instead.
import { parseArgs, dataPath, loadData, writeReport, fetchText, fetchJson, sleep } from './lib.mjs';

const args = parseArgs();
const slugs = args.slug ? String(args.slug).split(',') : null;
const limit = args.limit ? Number(args.limit) : Infinity;
const wayback = !args['no-wayback'];

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const pathOf = (u) => { try { return new URL(u).pathname.replace(/\/+$/, '').toLowerCase(); } catch { return ''; } };

/** A redirect to another page entirely (the home page, a market page) means the cited page is gone too. */
function movedAway(requested, finalUrl) {
  const a = pathOf(requested); const b = pathOf(finalUrl);
  if (!a || a === b) return false;
  if (hostOf(requested) !== hostOf(finalUrl)) return true;
  const last = a.split('/').pop();
  return last.length > 3 && !b.includes(last);
}

async function classify(url) {
  const host = hostOf(url);
  if (host === 'web.archive.org') return { status: 'archived' };
  const r = await fetchText(url, { timeoutMs: 25000, retries: 1 });
  if (r.status === 0) return { status: 'error', detail: r.error };
  if (r.status === 404 || r.status === 410) return { status: 'dead', http: r.status };
  if (r.status === 401 || r.status === 403 || r.status === 429 || r.status === 503) return { status: 'blocked', http: r.status };
  if (r.status >= 400) return { status: 'error', http: r.status };
  if (movedAway(url, r.url)) return { status: 'moved', http: r.status, to: r.url };
  return { status: 'ok', http: r.status };
}

async function snapshot(url) {
  const r = await fetchJson(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`, { timeoutMs: 20000, retries: 1 });
  const c = r.json?.archived_snapshots?.closest;
  return c?.available ? { url: c.url, timestamp: c.timestamp } : null;
}

const records = loadData(dataPath(args));
const cited = new Map(); // url -> [{ slug, supports }]
for (const r of records) {
  if (slugs && !slugs.includes(r.slug)) continue;
  for (const s of r.sources || []) {
    if (!cited.has(s.url)) cited.set(s.url, []);
    cited.get(s.url).push({ slug: r.slug, supports: s.supports });
  }
}
const urls = [...cited.keys()].slice(0, limit);
console.log(`checking ${urls.length} unique source URLs across ${slugs ? slugs.length : records.length} records`);

// One request at a time per host, a few hosts at once: polite to the small association sites.
const byHost = new Map();
for (const u of urls) {
  const h = hostOf(u);
  if (!byHost.has(h)) byHost.set(h, []);
  byHost.get(h).push(u);
}
const results = new Map();
let done = 0;
async function drain(queue) {
  for (const u of queue) {
    results.set(u, await classify(u));
    done++;
    if (done % 25 === 0) console.log(`  ${done}/${urls.length}`);
    await sleep(600);
  }
}
const lanes = [...byHost.values()];
const WORKERS = 4;
await Promise.all(Array.from({ length: WORKERS }, async (_, i) => {
  for (let k = i; k < lanes.length; k += WORKERS) await drain(lanes[k]);
}));

const findings = [];
for (const [u, res] of results) {
  if (res.status === 'ok' || res.status === 'archived') continue;
  const f = { url: u, ...res, cited: cited.get(u) };
  if (wayback && (res.status === 'dead' || res.status === 'moved')) {
    f.wayback = await snapshot(u);
    await sleep(1500); // archive.org rate-limits quickly
  }
  findings.push(f);
}
findings.sort((a, b) => a.status.localeCompare(b.status) || a.url.localeCompare(b.url));

const counts = {};
for (const r of results.values()) counts[r.status] = (counts[r.status] || 0) + 1;
const report = { generated: new Date().toISOString(), checked: urls.length, counts, findings };
const p = writeReport('check-sources', report);
console.log(counts);
for (const f of findings) {
  console.log(`${f.status.padEnd(7)} ${f.http ?? ''} ${f.url}${f.to ? ` -> ${f.to}` : ''}${f.wayback ? `  archived: ${f.wayback.url}` : f.status === 'dead' ? '  (no snapshot)' : ''}`);
  console.log(`        cited by ${f.cited.map((c) => c.slug).join(', ')}`);
}
console.log(`report: ${p}`);
