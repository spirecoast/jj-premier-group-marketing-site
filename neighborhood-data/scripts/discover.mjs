#!/usr/bin/env node
// Find communities that exist in the county registries or on builder/developer sites but are not in the dataset yet.
// REPORT ONLY: each candidate still needs the normal research (docs/RESEARCH-RULES.md) before it becomes a record.
//
//   node scripts/discover.mjs                          # every source
//   node scripts/discover.mjs --source pulte-markers,lennar
//   node scripts/discover.mjs --save cache/            # also save what each source returned (candidate arrays)
//   node scripts/discover.mjs --from cache/            # re-run the matching offline from saved arrays
//   node scripts/discover.mjs --update-baseline        # after review: mark every current candidate as seen
//
// data/discover-baseline.json lists names each source already returned when the dataset was built (2026-09-23) and
// that were deliberately left out (out of scope, apartments, merged into another record, not a neighborhood...).
// Baseline names are never reported again; only names that are new since the baseline show up.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { DATA_DIR, parseArgs, dataPath, loadData, writeReport, fetchText, fetchJson, arcgisAll, normName, sleep } from './lib.mjs';

const args = parseArgs();
const BASELINE = resolve(`${DATA_DIR}/discover-baseline.json`);

// ---- scope ----
export const IN_SCOPE_PLACES = ['lakewood ranch', 'sarasota', 'bradenton', 'palmetto', 'parrish', 'ellenton', 'university park',
  'longboat key', 'anna maria', 'anna maria island', 'holmes beach', 'bradenton beach', 'cortez', 'terra ceia', 'siesta key', 'lido key',
  'bird key'];
export const EXCLUDED_PLACES = ['osprey', 'nokomis', 'venice', 'north port', 'englewood', 'myakka city', 'laurel', 'arcadia'];
const placeKey = (s) => (s || '').toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
// Registry names the original build skipped on purpose (same rules as the build).
const SKIP_RULES = [
  ['apartments/rental', /\bAPTS?\b\.?|APARTMENTS|HOUSING PROJECT/i],
  ['retirement/senior residence', /RETIREMENT|SENIOR|WESTMINSTER ASBURY/i],
  ['RV park/campground/motel', /\bRV\b|CAMPGROUND|TRAVEL TRAILER|TRAVEL RESORT|MOTEL/i],
  ['plat-only name', /SUBDIVISION$|SUBDIVIDION$|ADDITION$|REPLAT|RE-SUBDIVISION|RESUBDIVISION|CAMP ADD$/i],
];

// ---- sources: each returns an array of { name, place, zip, url, builder, status, parent } ----
const titleFromSlug = (s) => s.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const decodeEntities = (s) => (s || '').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/<[^>]+>/g, '').trim();

export const SOURCES = {
  // Manatee County Neighborhoods layer (the registry most Bradenton-market records came from). MUN is a code.
  'manatee-neighborhoods': async () => {
    const url = 'https://www.mymanatee.org/giscomm/rest/services/communityneighborhood/neighborhoods/FeatureServer/0';
    const f = await arcgisAll(url, { where: '1=1', outFields: 'OBJECTID,COMMUNITY,NEIGHBORHOOD,MUN', returnGeometry: false, orderByFields: 'OBJECTID' }, 1000);
    return f.map(({ attributes: a }) => ({ name: a.NEIGHBORHOOD, parent: a.COMMUNITY, place: a.MUN, url }));
  },
  // Sarasota County registered neighborhood associations. Only non-personal fields are requested: this layer also holds
  // contact names, emails and phones, which must never be pulled into the dataset.
  'sarasota-neighborhood-associations': async () => {
    const url = 'https://ags3.scgov.net/server/rest/services/Hosted/NeighborhoodAssociation/FeatureServer/0';
    const f = await arcgisAll(url, { where: '1=1', outFields: 'associationname,registrationstatus,associationtype,city,zipcode,website', returnGeometry: false }, 1000);
    return f.map(({ attributes: a }) => ({ name: a.associationname, place: a.city, zip: String(a.zipcode || '').slice(0, 5) || null, url: a.website || url, status: a.registrationstatus, parent: a.associationtype }));
  },
  // City of Sarasota neighborhoods layer (skip its Email field).
  'city-of-sarasota-neighborhoods': async () => {
    const url = 'https://services3.arcgis.com/AWDwYUpli8WqpWxQ/arcgis/rest/services/Neighborhoods/FeatureServer/0';
    const f = await arcgisAll(url, { where: '1=1', outFields: 'NAME,Association,Website', returnGeometry: false }, 1000);
    return f.map(({ attributes: a }) => ({ name: a.NAME, place: 'Sarasota', url: a.Website || url, parent: a.Association }));
  },
  // Lakewood Ranch villages (the developer's WordPress API).
  'lwr-villages': async () => {
    const r = await fetchJson('https://lakewoodranch.com/wp-json/wp/v2/villages?per_page=100&_fields=id,slug,link,title');
    if (!Array.isArray(r.json)) throw new Error(`LWR villages API ${r.status}`);
    return r.json.map((v) => ({ name: decodeEntities(v.title?.rendered), place: 'Lakewood Ranch', url: v.link, builder: 'Lakewood Ranch (developer)' }));
  },
  // PulteGroup (Pulte, Del Webb, Centex, DiVosta) map-marker API.
  'pulte-markers': async () => {
    const seen = new Map();
    for (const brand of ['Pulte', 'Del Webb', 'Centex', 'DiVosta']) {
      for (const region of ['Sarasota', 'Tampa']) {
        const r = await fetchJson(`https://www.pulte.com/api/marker/mapmarkers?brand=${encodeURIComponent(brand)}&state=Florida&region=${region}&qmi=false`);
        for (const m of Array.isArray(r.json) ? r.json : []) seen.set(m.Id, m);
        await sleep(300);
      }
    }
    return [...seen.values()].map((m) => ({
      name: m.Name, place: m.Address?.City, zip: m.Address?.ZipCode, builder: m.BrandName, status: m.IsCommunitySoldOut ? 'sold out' : m.CommunityStatus,
      url: /^https?:/.test(m.CommunityLink || '') ? m.CommunityLink : `https://www.pulte.com${m.CommunityLink || ''}`,
    }));
  },
  // M/I Homes: community pages in the sitemap (/new-homes/florida/<metro>/<city>/<community>).
  'mi-homes': async () => {
    const r = await fetchText('https://www.mihomes.com/Sitemap/sitemap.xml');
    if (!r.ok) throw new Error(`M/I sitemap ${r.status} (Cloudflare may block server requests; try from a browser)`);
    const urls = [...new Set([...r.text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]))]
      .filter((u) => /^https:\/\/www\.mihomes\.com\/new-homes\/florida\/[^/]+\/[^/]+\/[^/]+\/?$/.test(u));
    return urls.map((u) => { const [, , city, slug] = u.replace(/\/$/, '').split('/new-homes/')[1].split('/'); return { name: titleFromSlug(slug), place: titleFromSlug(city), url: u, builder: 'M/I Homes' }; });
  },
  // Lennar metro pages: named communities and master plans in the page's Apollo state.
  lennar: async () => {
    const out = [];
    for (const metro of ['sarasota-manatee', 'tampa-manatee']) {
      const r = await fetchText(`https://www.lennar.com/new-homes/florida/${metro}`);
      const m = r.text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!m) throw new Error(`Lennar ${metro}: no __NEXT_DATA__ (HTTP ${r.status})`);
      const S = JSON.parse(m[1]).props?.pageProps?.initialApolloState || {};
      for (const [k, o] of Object.entries(S)) {
        if (!/^(CommunityType|MpcType):/.test(k) || !o.name || !o.url) continue;
        const city = o.city?.__ref ? S[o.city.__ref]?.name : o.city;
        out.push({ name: o.name, place: city || titleFromSlug(o.url.split('/')[4] || ''), zip: o.zipCode || null, url: `https://www.lennar.com${o.url}`, builder: 'Lennar', status: o.status });
      }
      await sleep(500);
    }
    return out;
  },
  // Mattamy Homes metro list pages (/florida/<metro>/<city>/<community>).
  mattamy: async () => {
    const out = [];
    for (const metro of ['bradenton', 'sarasota', 'tampa']) {
      const r = await fetchText(`https://mattamyhomes.com/florida/${metro}`);
      const links = [...new Set([...r.text.matchAll(/href="((?:https:\/\/mattamyhomes\.com)?\/florida\/[a-z-]+\/[a-z-]+\/[a-z0-9-]+)\/?"/g)].map((m) => m[1].replace(/^https:\/\/mattamyhomes\.com/, '')))];
      for (const p of links) { const [, , , city, slug] = p.split('/'); out.push({ name: titleFromSlug(slug), place: titleFromSlug(city), url: `https://mattamyhomes.com${p}`, builder: 'Mattamy Homes' }); }
      await sleep(500);
    }
    return out;
  },
};

// ---- matching ----
const normUrl = (u) => (u || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
function buildKnown(records) {
  const names = new Map();
  const urls = new Set();
  const add = (n, slug) => { const k = normName(n); if (k) names.set(k, slug); };
  for (const r of records) {
    for (const n of [r.name, ...r.aliases, r.slug.replace(/-/g, ' ')]) add(n, r.slug);
    for (const m of (r.notes || '').matchAll(/slug changed from '([^']+)'/g)) add(m[1].replace(/-/g, ' '), r.slug);
    for (const u of [r.officialUrl, r.hoa?.website, ...r.sources.map((s) => s.url)]) if (u && !/arcgis|\/rest\/services\//i.test(u)) urls.add(normUrl(u));
  }
  let excluded = [];
  try { excluded = JSON.parse(readFileSync(`${DATA_DIR}/excluded.json`, 'utf8')); } catch { /* optional */ }
  for (const e of excluded) { add(e.name, `(excluded) ${e.slug}`); add((e.slug || '').replace(/-/g, ' '), `(excluded) ${e.slug}`); }
  return { names, urls };
}
function possibleMatches(key, records) {
  const toks = key.split(' ').filter((t) => t.length > 2);
  if (!toks.length) return [];
  return records.filter((r) => { const n = normName(r.name); return toks.every((t) => n.includes(t)) || (n.length > 4 && key.includes(n)); }).slice(0, 3).map((r) => r.slug);
}
function inScope(c, datasetZips) {
  const p = placeKey(c.place);
  if (EXCLUDED_PLACES.includes(p)) return false;
  if (c.zip && /^\d{5}$/.test(c.zip)) return datasetZips.has(c.zip);
  if (/^[A-Z]{2}$/.test(c.place || '')) return c.place !== 'MY'; // Manatee MUN codes; MY = Myakka City
  if (!p) return true; // unknown place: keep, let the reviewer decide
  return IN_SCOPE_PLACES.includes(p);
}

// ---- main ----
const records = loadData(dataPath(args));
const datasetZips = new Set(records.flatMap((r) => r.zips));
const known = buildKnown(records);
const want = args.source ? String(args.source).split(',') : Object.keys(SOURCES);
const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : { generated: null, sources: {} };
const keyOf = (c) => `${normName(c.name)}|${placeKey(c.place)}`;

const report = { generated: new Date().toISOString(), sources: {}, candidates: [], errors: [] };
const current = {};
for (const src of want) {
  if (!SOURCES[src]) { report.errors.push({ source: src, error: 'unknown source' }); continue; }
  let list;
  try {
    if (args.from) list = JSON.parse(readFileSync(resolve(String(args.from), `${src}.json`), 'utf8'));
    else list = await SOURCES[src]();
    if (args.save) { mkdirSync(resolve(String(args.save)), { recursive: true }); writeFileSync(resolve(String(args.save), `${src}.json`), JSON.stringify(list)); }
  } catch (e) {
    report.errors.push({ source: src, error: String(e.message || e) });
    continue;
  }
  const seenBase = new Set(baseline.sources[src] || []);
  const stats = { returned: list.length, outOfScope: 0, skippedByRule: {}, matched: 0, inBaseline: 0, new: 0 };
  current[src] = new Set();
  for (const c of list) {
    if (!c.name) continue;
    if (!inScope(c, datasetZips)) { stats.outOfScope++; continue; }
    const rule = SKIP_RULES.find(([, re]) => re.test(c.name));
    if (rule) { stats.skippedByRule[rule[0]] = (stats.skippedByRule[rule[0]] || 0) + 1; continue; }
    const k = normName(c.name);
    if (known.names.has(k) || (c.url && known.urls.has(normUrl(c.url)))) { stats.matched++; continue; }
    const key = keyOf(c);
    current[src].add(key);
    if (seenBase.has(key)) { stats.inBaseline++; continue; }
    stats.new++;
    report.candidates.push({ source: src, ...c, possibleMatches: possibleMatches(k, records) });
  }
  report.sources[src] = stats;
}

const hadBaseline = !!baseline.generated;
if (args['update-baseline'] || !hadBaseline) {
  for (const [src, keys] of Object.entries(current)) baseline.sources[src] = [...new Set([...(baseline.sources[src] || []), ...keys])].sort();
  baseline.generated = baseline.generated || new Date().toISOString().slice(0, 10);
  baseline.updated = new Date().toISOString().slice(0, 10);
  writeFileSync(BASELINE, JSON.stringify(baseline, null, 1) + '\n');
  console.log(`baseline ${hadBaseline ? 'updated' : 'created (no baseline existed; every current candidate was recorded as seen)'}: ${BASELINE}`);
}
const p = writeReport('discover', report);
console.log(JSON.stringify({ sources: report.sources, newCandidates: report.candidates.length, errors: report.errors }, null, 1));
console.log(`report: ${p}`);
