#!/usr/bin/env node
// Check the builder pages behind every selling / coming-soon / built-out record and report where the builder's own
// site no longer matches the dataset. REPORT ONLY — a person reviews the report and edits the data (see
// docs/REFRESH-RUNBOOK.md). Builder sites change their markup often; when a parser stops matching, fix it here.
//
//   node scripts/check-builders.mjs                 # all records with builder pages
//   node scripts/check-builders.mjs --slug riversong,coasterra
//   node scripts/check-builders.mjs --limit 10
//
// Some builder sites block server-side requests (Cloudflare) or render status with JavaScript only. Those come back as
// 'blocked' or 'needs-browser'; open them in a browser and read the status by hand.
import { parseArgs, dataPath, loadData, writeReport, fetchText, fetchJson, sleep } from './lib.mjs';

const args = parseArgs();
const slugs = args.slug ? String(args.slug).split(',') : null;

export const BUILDER_HOSTS = {
  'drhorton.com': 'D.R. Horton', 'taylormorrison.com': 'Taylor Morrison', 'medallionhome.com': 'Medallion Home', 'lennar.com': 'Lennar',
  'homesbywestbay.com': 'Homes by WestBay', 'pulte.com': 'Pulte Homes', 'mihomes.com': 'M/I Homes', 'nealcommunities.com': 'Neal Communities',
  'kbhome.com': 'KB Home', 'lwhomes.com': 'Lee Wetherington Homes', 'johncannonhomes.com': 'John Cannon Homes', 'meritagehomes.com': 'Meritage Homes',
  'delwebb.com': 'Del Webb', 'richmondamerican.com': 'Richmond American Homes', 'ryanhomes.com': 'Ryan Homes', 'cardelhomes.com': 'Cardel Homes',
  'mattamyhomes.com': 'Mattamy Homes', 'highlandhomes.org': 'Highland Homes', 'dreamfindershomes.com': 'Dream Finders Homes',
  'kolterhomes.com': 'Kolter Homes', 'davidweekleyhomes.com': 'David Weekley Homes', 'tollbrothers.com': 'Toll Brothers',
  'ashtonwoods.com': 'Ashton Woods', 'starlighthomes.com': 'Starlight Homes', 'centex.com': 'Centex', 'perryhomes.com': 'Perry Homes',
  'nealsignaturehomes.com': 'Neal Signature Homes', 'homesbytowne.com': 'Homes by Towne', 'arhomes.com': 'AR Homes by Arthur Rutenberg',
};
const JS_ONLY = new Set(['perryhomes.com', 'richmondamerican.com']);
const PULTE_FAMILY = new Set(['pulte.com', 'delwebb.com', 'centex.com']);
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const builderHost = (u) => Object.keys(BUILDER_HOSTS).find((h) => hostOf(u) === h || hostOf(u).endsWith(`.${h}`));

// Status vocabulary: selling | coming-soon | sold-out | not-listed | blocked | needs-browser | error | unknown
function redirectedAway(requested, finalUrl) {
  try {
    const a = new URL(requested).pathname.replace(/\/+$/, '');
    const b = new URL(finalUrl).pathname.replace(/\/+$/, '');
    const last = a.split('/').pop();
    return a !== b && !b.includes(last);
  } catch { return false; }
}
const has = (t, re) => re.test(t);
const PARSERS = {
  'taylormorrison.com': (t) => {
    const m = t.match(/"community-status"\s*:\s*"(\w+)"/);
    if (!m) return null;
    return { OPEN: 'selling', COMINGSOON: 'coming-soon', CLOSED: 'sold-out' }[m[1]] || `unknown:${m[1]}`;
  },
  'lennar.com': (t) => (has(t, /Actively selling/i) ? 'selling' : has(t, /Coming soon/i) ? 'coming-soon' : has(t, /Sold out|Closed out/i) ? 'sold-out' : null),
  'mihomes.com': (t) => (has(t, /No Longer Available/i) ? 'sold-out' : has(t, /Community Status\s*(<[^>]+>\s*)*Now Selling/i) || has(t, /Now Selling/i) ? 'selling' : has(t, /Coming Soon/i) ? 'coming-soon' : null),
  'meritagehomes.com': (t) => (has(t, /\bSold Out\b|\bCloseout\b/i) ? 'sold-out' : has(t, /Priced from|Sales Office/i) ? 'selling' : has(t, /Coming Soon/i) ? 'coming-soon' : null),
  'mattamyhomes.com': (t) => (has(t, /SOLD OUT/) ? 'sold-out' : has(t, /NOW SELLING/) ? 'selling' : has(t, /COMING SOON/) ? 'coming-soon' : null),
};
// Low-confidence fallback for hosts without a parser: only phrases, reported as signals.
function genericSignals(t) {
  const body = t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/gi, ' ');
  const s = [];
  if (/\bsold[- ]out\b|\bno longer available\b|\bclosed out\b/i.test(body)) s.push('sold-out phrase');
  if (/\bcoming soon\b|\bjoin (the|our) (vip|interest) list\b/i.test(body)) s.push('coming-soon phrase');
  if (/\bnow selling\b|\bactively selling\b|\bmove-in ready\b|\bquick move-in\b|\bmodel (home|open)\b|\bschedule a tour\b/i.test(body)) s.push('selling phrase');
  return s;
}

// PulteGroup brands: one map-marker call per brand/region instead of scraping pages.
let pulteMarkers = null;
async function loadPulteMarkers() {
  if (pulteMarkers) return pulteMarkers;
  pulteMarkers = new Map();
  // Verified 2026-09-23: brand values are 'Pulte', 'Del Webb' (with the space), 'Centex', 'DiVosta'; each call returns a
  // mixed-brand subset, so take the union. Each marker carries Id (the number at the end of the community URL).
  // CommunityStatus is marketing text ("Now Open", "Quick Move-Ins Available", "Coming Soon", "New Low Pricing").
  for (const brand of ['Pulte', 'Del Webb', 'Centex', 'DiVosta']) {
    for (const region of ['Sarasota', 'Tampa']) {
      const r = await fetchJson(`https://www.pulte.com/api/marker/mapmarkers?brand=${encodeURIComponent(brand)}&state=Florida&region=${region}&qmi=false`);
      const list = Array.isArray(r.json) ? r.json : [];
      for (const m of list) {
        const id = String(m.Id ?? String(m.CommunityLink || '').match(/-(\d{5,})\/?$/)?.[1] ?? '');
        if (id) pulteMarkers.set(id, m);
      }
      await sleep(400);
    }
  }
  return pulteMarkers;
}

async function checkUrl(url) {
  const host = builderHost(url);
  if (JS_ONLY.has(host)) return { url, host, status: 'needs-browser', how: 'site renders status with JavaScript' };
  if (PULTE_FAMILY.has(host)) {
    const id = url.match(/-(\d{5,})\/?(\?.*)?$/)?.[1];
    const markers = await loadPulteMarkers();
    if (id && markers.size) {
      const m = markers.get(id);
      if (!m) return { url, host, status: 'not-listed', how: `community id ${id} not in the PulteGroup map-marker API (Sarasota/Tampa)` };
      const st = m.IsCommunitySoldOut ? 'sold-out' : /coming soon/i.test(m.CommunityStatus || '') ? 'coming-soon' : /sold out|closed out/i.test(m.CommunityStatus || '') ? 'sold-out' : 'selling';
      return { url, host, status: st, how: `map-marker API: CommunityStatus=${m.CommunityStatus}, IsCommunitySoldOut=${m.IsCommunitySoldOut}, IsActiveAdult=${m.IsActiveAdult}` };
    }
  }
  const r = await fetchText(url, { headers: { Accept: 'text/html' } });
  if (r.status === 404 || r.status === 410) return { url, host, status: 'not-listed', how: `HTTP ${r.status}` };
  if (r.status === 403 || r.status === 429 || /cf-chl|Just a moment\.\.\.|Attention Required/i.test(r.text.slice(0, 5000))) return { url, host, status: 'blocked', how: `HTTP ${r.status}; open in a browser` };
  if (!r.ok) return { url, host, status: 'error', how: `HTTP ${r.status} ${r.error || ''}`.trim() };
  if (redirectedAway(url, r.url)) return { url, host, status: 'not-listed', how: `redirected to ${r.url}` };
  const p = PARSERS[host]?.(r.text);
  if (p) return { url, host, status: p, how: 'host parser' };
  const sig = genericSignals(r.text);
  return { url, host, status: 'unknown', how: PARSERS[host] ? 'host parser found no status marker (markup may have changed)' : 'no parser for this host', signals: sig };
}

// ---- main ----
const records = loadData(dataPath(args));
let todo = records.filter((r) => ['selling', 'coming-soon', 'built-out'].includes(r.status) || r.activeBuilders.length);
if (slugs) todo = todo.filter((r) => slugs.includes(r.slug));
if (args.limit) todo = todo.slice(0, Number(args.limit));

const results = [];
const findings = [];
let n = 0;
for (const rec of todo) {
  const urls = [...new Set([rec.officialUrl, ...rec.sources.filter((s) => /status|activeBuilders/.test(s.supports)).map((s) => s.url)]
    .filter((u) => u && builderHost(u)))];
  if (!urls.length) { if (rec.status === 'selling' || rec.status === 'coming-soon') findings.push({ slug: rec.slug, issue: `status ${rec.status} but no builder page on record to check (developer or lakewoodranch.com page?) — check by hand` }); continue; }
  const checks = [];
  for (const u of urls) { checks.push(await checkUrl(u)); await sleep(500); }
  results.push({ slug: rec.slug, name: rec.name, status: rec.status, activeBuilders: rec.activeBuilders, checks });

  const byBuilder = {};
  for (const c of checks) (byBuilder[BUILDER_HOSTS[c.host]] ||= []).push(c.status);
  const anySelling = checks.some((c) => c.status === 'selling');
  const anyComing = checks.some((c) => c.status === 'coming-soon');
  const allGone = checks.every((c) => ['sold-out', 'not-listed'].includes(c.status));
  if (anySelling && rec.status !== 'selling') findings.push({ slug: rec.slug, issue: `a builder page shows selling; dataset status is ${rec.status}` });
  if (!anySelling && anyComing && rec.status !== 'coming-soon') findings.push({ slug: rec.slug, issue: `builder page shows coming soon; dataset status is ${rec.status}` });
  if (allGone && (rec.status === 'selling' || rec.status === 'coming-soon')) findings.push({ slug: rec.slug, issue: `every builder page is sold out / gone; dataset status is ${rec.status} — consider built-out` });
  for (const b of rec.activeBuilders) {
    const st = byBuilder[b];
    if (st && st.every((x) => ['sold-out', 'not-listed'].includes(x))) findings.push({ slug: rec.slug, issue: `${b} no longer selling here per its site — consider removing from activeBuilders` });
  }
  for (const [b, st] of Object.entries(byBuilder)) {
    if (b && st.includes('selling') && !rec.activeBuilders.includes(b)) findings.push({ slug: rec.slug, issue: `${b} page shows selling but ${b} is not in activeBuilders` });
  }
  if (++n % 10 === 0) console.log(`  ${n}/${todo.length}`);
}

const tally = {};
for (const r of results) for (const c of r.checks) tally[c.status] = (tally[c.status] || 0) + 1;
const report = { generated: new Date().toISOString(), records: todo.length, pageStatus: tally, findings, results };
const p = writeReport('check-builders', report);
console.log(JSON.stringify({ records: todo.length, pages: tally, findings: findings.length }));
console.log(`report: ${p}`);
