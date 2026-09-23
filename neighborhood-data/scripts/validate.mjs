#!/usr/bin/env node
// Validate data/neighborhoods.json against the dataset rules. No network, no dependencies.
//   node scripts/validate.mjs [--data path] [--quiet]
// Exit code 1 when any ERROR is found; warnings never fail the run.
import { parseArgs, dataPath, loadData, today } from './lib.mjs';

const args = parseArgs();
const records = loadData(dataPath(args));

const ENUM = {
  market: ['lakewood-ranch', 'sarasota', 'bradenton'],
  level: ['area', 'community', 'enclave'],
  type: ['downtown district', 'island', 'historic district', 'neighborhood', 'master-planned community', 'village',
    'golf community', 'gated community', 'condo community', 'subdivision'],
  status: ['established', 'selling', 'coming-soon', 'built-out'],
  waterAccess: ['gulf-front', 'bayfront', 'canal', 'river', 'lake', 'none'],
  homeTypes: ['single-family', 'villa', 'paired villa', 'townhome', 'condominium', 'carriage home', 'coach home', 'estate', 'manufactured'],
  research: ['full', 'registry-only'],
  county: ['Manatee', 'Sarasota'],
  evacuationZone: ['A', 'B', 'C', 'D', 'E', 'none'],
};
const KEYS = ['_id', 'slug', 'name', 'aliases', 'level', 'parentSlug', 'market', 'bradentonArea', 'jurisdiction', 'county', 'zips',
  'lat', 'lng', 'type', 'developer', 'activeBuilders', 'yearsBuilt', 'homeTypes', 'homeCount', 'gated', 'ageRestricted', 'hoa', 'cdd',
  'amenities', 'waterAccess', 'zonedSchools', 'evacuationZone', 'status', 'officialUrl', 'description', 'research', 'sources', 'notes'];
const BOX = { latMin: 26.8, latMax: 27.8, lngMin: -83.0, lngMax: -81.9 };

// Fair-housing and "describe places, not people" rules. Same lists the dataset was built against.
const FAIR_HOUSING = [
  /\bperfect for families\b/i, /\bgreat for kids\b/i, /\bideal for (children|kids)\b/i, /\bfamily home\b/i, /\bempty nesters?\b/i,
  /\bbachelor pad\b/i, /\bstarter home\b/i, /\bno (children|kids)\b/i, /\bexclusive (neighborhood|community|area)\b/i,
  /\b(safe|unsafe) (neighborhood|community|area)\b/i, /\b(good|bad|great|nice) (schools?|area|neighborhood)\b/i,
  /\bdesirable (neighborhood|community|area)\b/i, /\bup-and-coming (neighborhood|area)\b/i,
  /\b(christian|jewish|muslim|catholic|hindu|buddhist) (neighborhood|community)\b/i, /\bwalking distance to (church|temple|mosque|synagogue)\b/i,
  /\b(young|old) professionals?\b/i, /\b55\+ (only|community)\b/i, /\bable[- ]bodied\b/i, /\bperfect for (active|able)\b/i,
  /\bno (section[- ]?8|vouchers?)\b/i, /\bworking professionals? only\b/i, /\bno smokers?\b/i,
  /family[- ]friendly/i, /(?<!single-)\bfamil(y|ies)\b/i, /\bkids?\b/i, /\bchildren\b/i, /\bretirees?\b/i, /\bretirement\b/i,
  /\bprofessionals?\b/i, /\bsingles\b/i, /\bcouples\b/i, /\bexclusive\b/i, /\bsafe(ty)?\b/i, /\bquiet\b/i, /\bdesirable\b/i,
  /\bprestigious\b/i, /\bup-and-coming\b/i, /\btop[- ]rated\b/i, /\bchurch(es)?\b/i, /\bplaces? of worship\b/i, /\bcrime\b/i,
  /\bactive[- ]adult\b/i, /\bseniors?\b/i, /\bluxur(y|ious)\b/i, /\bpremier\b/i, /\bstunning\b/i, /\bbeautiful\b/i, /\bvibrant\b/i,
  /\bcharming\b/i, /\bidyllic\b/i, /\bpristine\b/i, /\bupscale\b/i, /\belite\b/i,
];
// No prices, values or market statistics.
const PRICE = [/\$\s?\d/, /\bprice[sd]?\b/i, /\bmillion\b/i, /\bhoa fees?\b/i, /\bdues\b/i, /\bmedian\b/i, /\bappreciat(e|ion)\b/i, /\bper square foot\b/i];
// 55+ language is only allowed when ageRestricted is true (and backed by HOPA documents).
const AGE = /\b55\s?\+|\bage[- ](restricted|qualified)\b|\bover[- ]55\b/i;
// People's contact details never belong in the data (sources are exempt: URLs only).
const EMAIL = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const PHONE = /\(?\b\d{3}\)?[-. ]\d{3}[-.]\d{4}\b/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
const warnings = [];
const err = (slug, msg) => errors.push(`${slug}: ${msg}`);
const warn = (slug, msg) => warnings.push(`${slug}: ${msg}`);

const bySlug = new Map();
const ids = new Set();
for (const r of records) {
  if (bySlug.has(r.slug)) err(r.slug, 'duplicate slug');
  bySlug.set(r.slug, r);
  if (ids.has(r._id)) err(r.slug, `duplicate _id ${r._id}`);
  ids.add(r._id);
}

const staleCutoff = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 2); return d.toISOString().slice(0, 10); })();
let staleRecords = 0;

for (const r of records) {
  const s = r.slug || '(no slug)';
  // shape
  for (const k of KEYS) if (!(k in r)) err(s, `missing field ${k}`);
  for (const k of Object.keys(r)) if (!KEYS.includes(k)) warn(s, `unexpected field ${k}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug || '')) err(s, 'slug must be lower-case kebab-case');
  if (r._id !== `neighborhood-${r.slug}`) err(s, `_id should be neighborhood-${r.slug}`);
  if (!r.name || typeof r.name !== 'string') err(s, 'name required');

  // enums
  for (const k of ['market', 'level', 'research']) if (!ENUM[k].includes(r[k])) err(s, `${k} '${r[k]}' not allowed`);
  for (const k of ['type', 'status', 'waterAccess', 'county', 'evacuationZone']) {
    if (r[k] !== null && !ENUM[k].includes(r[k])) err(s, `${k} '${r[k]}' not allowed`);
  }
  for (const h of r.homeTypes || []) if (!ENUM.homeTypes.includes(h)) err(s, `homeType '${h}' not allowed`);
  for (const k of ['aliases', 'zips', 'activeBuilders', 'homeTypes', 'amenities', 'sources']) {
    if (!Array.isArray(r[k])) err(s, `${k} must be an array`);
  }
  for (const z of r.zips || []) if (!/^\d{5}$/.test(z)) err(s, `zip '${z}' is not 5 digits`);
  if (r.market !== 'bradenton' && r.bradentonArea) err(s, 'bradentonArea can only be true in the bradenton market');
  if (r.homeCount !== null && !(Number.isInteger(r.homeCount) && r.homeCount > 0)) err(s, 'homeCount must be a positive integer or null');

  // hierarchy
  if (r.parentSlug) {
    if (r.parentSlug === r.slug) err(s, 'parentSlug points to itself');
    else if (!bySlug.has(r.parentSlug)) err(s, `parentSlug '${r.parentSlug}' does not exist`);
    else {
      const seen = new Set([r.slug]);
      let p = r.parentSlug;
      while (p) {
        if (seen.has(p)) { err(s, 'parent chain has a cycle'); break; }
        seen.add(p);
        p = bySlug.get(p)?.parentSlug;
      }
    }
  } else if (r.level === 'enclave') warn(s, 'enclave without a parentSlug');

  // coordinates
  if ((r.lat === null) !== (r.lng === null)) err(s, 'lat and lng must both be set or both null');
  if (r.lat !== null && (r.lat < BOX.latMin || r.lat > BOX.latMax || r.lng < BOX.lngMin || r.lng > BOX.lngMax)) {
    err(s, `point ${r.lat},${r.lng} is outside the Manatee/Sarasota bounding box`);
  }

  // sources
  if (!r.sources?.length) err(s, 'at least one source is required');
  for (const src of r.sources || []) {
    if (!/^https?:\/\//.test(src.url || '')) err(s, `source url '${src.url}' is not http(s)`);
    if (!src.supports) err(s, `source ${src.url} has no supports`);
    if (!DATE.test(src.checked || '')) err(s, `source ${src.url} has bad checked date '${src.checked}'`);
    if (src.checked > today()) err(s, `source ${src.url} checked date is in the future`);
  }
  const stale = (r.sources || []).filter((x) => x.sourceDate && String(x.sourceDate).slice(0, 10) < staleCutoff);
  if (stale.length) staleRecords++;

  // text rules
  const own = [r.name, ...(r.aliases || [])];
  for (let p = r.parentSlug, n = 0; p && n < 5; p = bySlug.get(p)?.parentSlug, n++) own.push(bySlug.get(p)?.name);
  const scrub = (t) => own.filter(Boolean).reduce((acc, nm) => acc.split(nm).join(' '), t || '');
  const desc = scrub(r.description);
  for (const re of FAIR_HOUSING) if (re.test(desc)) err(s, `description matches fair-housing rule ${re}`);
  for (const re of PRICE) if (re.test(desc)) err(s, `description mentions price/market data (${re})`);
  if (r.ageRestricted !== true && AGE.test(desc)) err(s, 'description uses 55+/age-restricted language but ageRestricted is not true');
  for (const a of r.amenities || []) {
    for (const re of [...FAIR_HOUSING, ...PRICE]) if (re.test(scrub(a))) warn(s, `amenity '${a}' matches ${re}`);
  }
  if (r.description && r.description.length > 400) warn(s, `description is ${r.description.length} characters (aim for 1-2 sentences)`);

  // 55+
  if (r.ageRestricted === true && !(r.sources || []).some((x) => /ageRestricted/.test(x.supports))) {
    err(s, 'ageRestricted is true without a source whose supports include ageRestricted (HOPA documents required)');
  }

  // schools
  const z = r.zonedSchools;
  if (z) {
    if (!z.note || !/zoning is by address/i.test(z.note)) err(s, 'zonedSchools.note must say zoning is by address and can change');
    if (!/^https:\/\//.test(z.sourceUrl || '')) err(s, 'zonedSchools.sourceUrl must link to the district locator');
    if (!z.checkedAddress) err(s, 'zonedSchools.checkedAddress missing');
    if (!z.elementary && !z.middle && !z.high) err(s, 'zonedSchools has no school names');
    for (const k of Object.keys(z)) {
      if (!['elementary', 'middle', 'high', 'checkedAddress', 'checkedPoint', 'sourceUrl', 'note'].includes(k)) err(s, `zonedSchools.${k} not allowed (no ratings or extra fields)`);
    }
    if (!z.checkedPoint) warn(s, 'zonedSchools.checkedPoint missing (refresh-gis will fall back to lat/lng)');
  }

  // contact details (anything except sources and notes' URLs)
  const { sources, ...rest } = r;
  const flat = JSON.stringify(rest).replace(/https?:\/\/[^\s"|)]+/g, '');
  if (EMAIL.test(flat)) err(s, 'contains an email address');
  if (PHONE.test(flat)) err(s, 'contains a phone number');
}

const summary = { records: records.length, errors: errors.length, warnings: warnings.length, recordsWithStaleSources: staleRecords, staleCutoff };
if (!args.quiet) {
  for (const e of errors.slice(0, 200)) console.log('ERROR', e);
  for (const w of warnings.slice(0, 100)) console.log('warn ', w);
  if (errors.length > 200) console.log(`... ${errors.length - 200} more errors`);
  if (warnings.length > 100) console.log(`... ${warnings.length - 100} more warnings`);
}
console.log(JSON.stringify(summary));
process.exit(errors.length ? 1 : 0);
