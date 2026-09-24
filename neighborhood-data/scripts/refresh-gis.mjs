#!/usr/bin/env node
// Re-run the county map-service lookups (checked address, ZIP, jurisdiction, zoned schools, evacuation zone)
// and report what changed. Nothing is written to the dataset unless you pass --apply.
//
//   node scripts/refresh-gis.mjs --limit 5                 # smoke test: 5 records, report only
//   node scripts/refresh-gis.mjs                           # all records, report only
//   node scripts/refresh-gis.mjs --apply                   # write changes + refresh source checked dates
//   node scripts/refresh-gis.mjs --county Manatee --school-year 2027 --apply
//   node scripts/refresh-gis.mjs --slug riversong --slug lakewood-ranch-country-club   (repeat --slug or comma-separate)
//
// Options: --data <path>  --limit <n>  --slug <a,b>  --county Manatee|Sarasota  --school-year <yyyy> (Manatee GuideK12
//          locator path, default 2026)  --concurrency <n> (default 4)  --only schools|evac|address (comma list)  --apply
//
// Method (same as the original build): for each community/enclave, start from zonedSchools.checkedPoint (the county
// address point used last time) or the record's lat/lng; take the nearest county address point within 60, 250 then 700 m;
// run every lookup at that address point. Areas (level 'area') are skipped: one point can't speak for a whole area.
// Postal communities outside the site's markets are flagged, never auto-moved.
import {
  parseArgs, dataPath, loadData, saveData, writeReport, today, arcgisQuery, pointGeom, metersBetween, fetchJson, touchSource, appendNote, sleep, formatAddress,
} from './lib.mjs';

const args = parseArgs();
const APPLY = !!args.apply;
const YEAR = String(args['school-year'] || 2026);
const CONC = Number(args.concurrency || 4);
const ONLY = args.only ? String(args.only).split(',') : ['address', 'schools', 'evac'];
const slugs = args.slug ? String(args.slug).split(',') : null;
// allow repeated --slug flags
if (slugs) for (let i = 0; i < process.argv.length; i++) if (process.argv[i] === '--slug' && process.argv[i + 1]) slugs.push(...process.argv[i + 1].split(','));

export const L = {
  manAddr: 'https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/ADDRESS_POINTS/FeatureServer/2',
  manCity: 'https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/CITY_BOUNDARIES/FeatureServer/0',
  manEvac: 'https://services1.arcgis.com/t03WDvnSR7gSDOB2/arcgis/rest/services/Evacuation%20Levels%20Feature%20Service/FeatureServer/0',
  manEvacPage: 'https://www.mymanatee.org/services-and-amenities/service-listing/service-details/know-your-evacuation-level',
  manSchoolPage: 'https://www.manateeschools.net/schoollocator',
  scAddr: 'https://ags3.scgov.net/server/rest/services/Hosted/AddressPoint/FeatureServer/0',
  scSchools: 'https://services3.arcgis.com/icrWMv7eBkctFu1f/arcgis/rest/services/CountySchoolDistricts/FeatureServer/1',
  scSchoolLocator: 'https://sarco.maps.arcgis.com/apps/instant/lookup/index.html?appid=1e2e26c033b341a3a1791e81906d26f9',
  scSchoolPage: 'https://www.sarasotacountyschools.net/page/student-attendance-zones',
  scEvac: 'https://services3.arcgis.com/icrWMv7eBkctFu1f/arcgis/rest/services/StormEvacuationZoneWM/FeatureServer/0',
  scEvacPage: 'https://www.scgov.net/know-your-evacuation-zone',
};
const guidek12 = (y) => `https://app.guidek12.com/manateefl/school_search/${y}/`;
const MAN_CITY = {
  Bradenton: 'City of Bradenton', Palmetto: 'City of Palmetto', 'Anna Maria': 'City of Anna Maria', 'Holmes Beach': 'City of Holmes Beach',
  'Bradenton Beach': 'City of Bradenton Beach', 'Longboat Key': 'Town of Longboat Key',
};
const SC_MUNI = {
  CS: 'City of Sarasota', SC: 'Unincorporated Sarasota County', 'SARASOTA COUNTY': 'Unincorporated Sarasota County', TLK: 'Town of Longboat Key',
  CV: 'City of Venice', CNP: 'City of North Port', 'CITY OF NORTH PORT': 'City of North Port',
};
const EXCLUDED_POSTAL = new Set(['OSPREY', 'NOKOMIS', 'VENICE', 'NORTH PORT', 'ENGLEWOOD', 'MYAKKA CITY', 'LAUREL', 'ARCADIA']);
const manNote = (y) => {
  const n = Number(y);
  return `Zoning is by address and can change; confirm a specific address with the district locator. Manatee ${n}-${String((n + 1) % 100).padStart(2, '0')} zones${n < 2027 ? ' (high school zones change in 2027-28)' : ''}.`;
};
const SC_NOTE = 'Zoning is by address and can change; confirm a specific address with the district locator.';

// ---- lookups ----
async function nearestAddress(county, pt) {
  const man = county === 'Manatee';
  const outFields = man ? 'ST_NUM,SDIRPRE,SFEANME,SFEATYP,SDIRSUF,ZIP,POSTAL_COMMUNITY,MUN' : 'address,zip,postalcomm,muni';
  for (const distance of [60, 250, 700]) {
    const feats = await arcgisQuery(man ? L.manAddr : L.scAddr, {
      ...pointGeom(pt.lng, pt.lat), distance, units: 'esriSRUnit_Meter', outFields, outSR: 4326, returnGeometry: true,
    });
    if (!feats.length) continue;
    let best = null;
    for (const f of feats) {
      if (!f.geometry) continue;
      const d = metersBetween(pt.lat, pt.lng, f.geometry.y, f.geometry.x);
      if (!best || d < best.d) best = { d, f };
    }
    if (!best) continue;
    const a = best.f.attributes;
    const lat = +best.f.geometry.y.toFixed(6);
    const lng = +best.f.geometry.x.toFixed(6);
    if (man) {
      const street = [a.ST_NUM, a.SDIRPRE, a.SFEANME, a.SFEATYP, a.SDIRSUF].filter(Boolean).join(' ');
      return { lat, lng, meters: Math.round(best.d), street, postal: a.POSTAL_COMMUNITY, zip: a.ZIP, mun: a.MUN };
    }
    return { lat, lng, meters: Math.round(best.d), street: a.address, postal: a.postalcomm, zip: a.zip, mun: a.muni };
  }
  return null;
}

let manSchoolList = null;
async function manateeSchoolList() {
  if (manSchoolList) return manSchoolList;
  const r = await fetchJson(`${guidek12(YEAR)}api.json`, {
    method: 'POST', body: JSON.stringify({ mode: 'list_schools' }),
    headers: { 'Content-Type': 'application/json', Origin: 'https://app.guidek12.com', Referer: guidek12(YEAR) },
  });
  if (!r.json?.result) throw new Error(`GuideK12 list_schools failed (${r.status}). Is the ${YEAR} locator published? ${r.text.slice(0, 200)}`);
  manSchoolList = new Map(r.json.result.map((s) => [s.id, { name: s.school_label, type: String(s.attr?.SCHOOL_TYPE ?? '') }]));
  return manSchoolList;
}
async function manateeSchools(pt) {
  const list = await manateeSchoolList();
  const r = await fetchJson(`${guidek12(YEAR)}api.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://app.guidek12.com', Referer: guidek12(YEAR) },
    body: JSON.stringify({ mode: 'schools_spatial', attr: {}, grades: [], spatial_args: { wkt: `POINT(${pt.lng} ${pt.lat})`, srid: 4326, type: 'point' }, zones: ['attendance'] }),
  });
  const res = r.json?.result;
  if (!res) throw new Error(`GuideK12 schools_spatial failed (${r.status})`);
  if (res.in_district === false) return { outside: true };
  const z = { elementary: [], middle: [], high: [] };
  for (const { id } of res.school_results || []) {
    const s = list.get(id);
    if (!s) continue;
    const t = s.type.toUpperCase();
    const k = t.includes('ELEM') ? 'elementary' : t.includes('MIDD') ? 'middle' : t.includes('HIGH') ? 'high' : null;
    if (k && !z[k].includes(s.name)) z[k].push(s.name);
  }
  return z;
}
async function sarasotaSchools(pt) {
  const feats = await arcgisQuery(L.scSchools, { ...pointGeom(pt.lng, pt.lat), outFields: 'SchoolZone,ZoneType', returnGeometry: false });
  const z = { elementary: [], middle: [], high: [] };
  for (const { attributes: a } of feats) {
    const t = (a.ZoneType || '').toUpperCase();
    const n = a.SchoolZone;
    if (!n) continue;
    if (t.includes('K-8')) { z.elementary.push(n); z.middle.push(n); }
    else if (t.includes('ELEMENTARY')) z.elementary.push(n);
    else if (t.includes('MIDDLE')) z.middle.push(n);
    else if (t.includes('HIGH')) z.high.push(n);
  }
  if (z.middle.length > 1) z.middle = z.middle.filter((m) => !/K-8/.test(m)).length ? z.middle.filter((m) => !/K-8/.test(m)) : z.middle;
  return z;
}
async function evacuation(county, pt) {
  const man = county === 'Manatee';
  const feats = await arcgisQuery(man ? L.manEvac : L.scEvac, { ...pointGeom(pt.lng, pt.lat), outFields: man ? 'EVAC_ZONE' : 'EvacuationZone', returnGeometry: false });
  const vals = feats.map((f) => (man ? f.attributes.EVAC_ZONE : f.attributes.EvacuationZone)).filter((v) => v && v !== 'N/A');
  const v = vals.map((x) => String(x).trim().toUpperCase()).find((x) => /^[A-E]$/.test(x));
  return v || 'none';
}
async function jurisdiction(county, pt, ap) {
  if (county === 'Manatee') {
    const feats = await arcgisQuery(L.manCity, { ...pointGeom(pt.lng, pt.lat), outFields: 'NAME', returnGeometry: false });
    const city = feats.map((f) => f.attributes.NAME).find((n) => MAN_CITY[n]);
    return city ? MAN_CITY[city] : 'Unincorporated Manatee County';
  }
  return SC_MUNI[(ap.mun || '').toUpperCase()] || null;
}
const joinNames = (a) => (a.length ? [...new Set(a)].join(' / ') : null);

async function detectCounty(pt) {
  for (const c of ['Manatee', 'Sarasota']) if (await nearestAddress(c, pt).catch(() => null)) return c;
  return null;
}

async function refresh(rec) {
  const base = rec.zonedSchools?.checkedPoint || (rec.lat != null ? { lat: rec.lat, lng: rec.lng } : null);
  if (!base) return { slug: rec.slug, skipped: 'no point' };
  const county = rec.county || (await detectCounty(base));
  if (!county) return { slug: rec.slug, flag: 'no county address point near this record' };
  const ap = await nearestAddress(county, base);
  if (!ap) return { slug: rec.slug, flag: `no ${county} address point within 700 m of ${base.lat},${base.lng}` };
  const pt = { lat: ap.lat, lng: ap.lng };
  const out = { slug: rec.slug, county, ap };
  if (ONLY.includes('address')) out.jurisdiction = await jurisdiction(county, pt, ap);
  if (ONLY.includes('schools')) out.schools = county === 'Manatee' ? await manateeSchools(pt) : await sarasotaSchools(pt);
  if (ONLY.includes('evac')) out.evac = await evacuation(county, pt);
  return out;
}

function applyResult(rec, res, changes, flags) {
  const ch = (field, from, to) => {
    if (JSON.stringify(from) === JSON.stringify(to)) return false;
    changes.push({ slug: rec.slug, field, from, to });
    return true;
  };
  const man = res.county === 'Manatee';
  const postal = (res.ap.postal || '').toUpperCase();
  if (EXCLUDED_POSTAL.has(postal) && rec.market !== 'lakewood-ranch') {
    flags.push({ slug: rec.slug, issue: `nearest address point has postal community ${postal} (outside the site's markets) — review scope` });
  }
  if (man && postal === 'SARASOTA' && rec.market === 'bradenton') flags.push({ slug: rec.slug, issue: 'Manatee address with a Sarasota mailing address — consider market sarasota' });
  if (rec.county && rec.county !== res.county) flags.push({ slug: rec.slug, issue: `county on record ${rec.county}, address point found in ${res.county}` });
  if (res.ap.meters > 250) flags.push({ slug: rec.slug, issue: `nearest address point is ${res.ap.meters} m away — check the point` });

  const addr = formatAddress(res.ap.street, res.ap.postal, res.ap.zip) || `point ${res.ap.lat}, ${res.ap.lng}`;
  const next = structuredClone(rec);
  if (ONLY.includes('address')) {
    if (res.ap.zip && !next.zips.includes(res.ap.zip)) { ch('zips', rec.zips, [res.ap.zip, ...rec.zips]); next.zips = [res.ap.zip, ...next.zips]; }
    const conflictHeld = rec.jurisdiction === null && /jurisdiction/i.test(rec.notes || '');
    if (res.jurisdiction && !conflictHeld && ch('jurisdiction', rec.jurisdiction, res.jurisdiction)) next.jurisdiction = res.jurisdiction;
    if (conflictHeld && res.jurisdiction) flags.push({ slug: rec.slug, issue: `jurisdiction held null for a documented conflict; county data now says ${res.jurisdiction}` });
  }
  if (ONLY.includes('schools')) {
    if (res.schools?.outside) {
      if (rec.zonedSchools) { ch('zonedSchools', rec.zonedSchools, null); next.zonedSchools = null; }
      flags.push({ slug: rec.slug, issue: 'Manatee locator says this point is outside the district' });
    } else if (res.schools) {
      const z = {
        elementary: joinNames(res.schools.elementary), middle: joinNames(res.schools.middle), high: joinNames(res.schools.high),
        checkedAddress: addr, sourceUrl: man ? guidek12(YEAR) : L.scSchoolLocator, note: man ? manNote(YEAR) : SC_NOTE,
        checkedPoint: { lat: res.ap.lat, lng: res.ap.lng },
      };
      if (!z.elementary && !z.middle && !z.high) flags.push({ slug: rec.slug, issue: 'school lookup returned no zones — left unchanged' });
      else {
        for (const k of ['elementary', 'middle', 'high', 'checkedAddress', 'sourceUrl', 'note']) ch(`zonedSchools.${k}`, rec.zonedSchools?.[k] ?? null, z[k]);
        next.zonedSchools = z;
      }
    }
  }
  if (ONLY.includes('evac') && res.evac && ch('evacuationZone', rec.evacuationZone, res.evac)) next.evacuationZone = res.evac;
  return next;
}

function touchAll(rec, res) {
  const man = res.county === 'Manatee';
  if (ONLY.includes('address')) {
    touchSource(rec, man ? L.manAddr : L.scAddr, 'zips,jurisdiction,zonedSchools.checkedAddress');
    if (man) touchSource(rec, L.manCity, 'jurisdiction');
  }
  if (ONLY.includes('schools') && rec.zonedSchools) {
    if (man) {
      // move any older GuideK12 year path to the current one
      for (const s of rec.sources) if (/guidek12\.com\/manateefl\/school_search\/\d+\//.test(s.url)) s.url = guidek12(YEAR);
      rec.sources = rec.sources.filter((s, i, a) => a.findIndex((x) => x.url === s.url) === i);
    }
    touchSource(rec, man ? L.manSchoolPage : L.scSchoolPage, 'zonedSchools');
    touchSource(rec, man ? guidek12(YEAR) : L.scSchools, 'zonedSchools');
  }
  if (ONLY.includes('evac') && rec.evacuationZone) {
    touchSource(rec, man ? L.manEvac : L.scEvac, 'evacuationZone');
    touchSource(rec, man ? L.manEvacPage : L.scEvacPage, 'evacuationZone');
  }
}

// ---- main ----
const path = dataPath(args);
const records = loadData(path);
let todo = records.filter((r) => r.level !== 'area');
if (slugs) todo = todo.filter((r) => slugs.includes(r.slug));
if (args.county) todo = todo.filter((r) => r.county === args.county);
if (args.limit) todo = todo.slice(0, Number(args.limit));

console.log(`refresh-gis: ${todo.length} records, school year ${YEAR}, lookups ${ONLY.join('+')}, ${APPLY ? 'APPLY' : 'report only'}`);
const changes = [];
const flags = [];
const errors = [];
const results = new Map();
let done = 0;
const queue = [...todo];
async function worker() {
  while (queue.length) {
    const rec = queue.shift();
    try {
      const res = await refresh(rec);
      results.set(rec.slug, res);
      if (res.flag) flags.push({ slug: rec.slug, issue: res.flag });
    } catch (e) {
      errors.push({ slug: rec.slug, error: String(e.message || e) });
    }
    if (++done % 50 === 0) console.log(`  ${done}/${todo.length}`);
    await sleep(100);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));

const bySlug = new Map(records.map((r, i) => [r.slug, i]));
let changedRecords = 0;
for (const rec of todo) {
  const res = results.get(rec.slug);
  if (!res || res.skipped || res.flag) continue;
  const before = changes.length;
  const next = applyResult(rec, res, changes, flags);
  if (changes.length > before) changedRecords++;
  if (APPLY) {
    touchAll(next, res);
    if (changes.length > before) appendNote(next, `map-service lookups refreshed ${today()} (scripts/refresh-gis.mjs)`);
    records[bySlug.get(rec.slug)] = next;
  }
}
if (APPLY) saveData(path, records);

const report = {
  generated: new Date().toISOString(), applied: APPLY, schoolYear: YEAR, lookups: ONLY,
  counts: { checked: todo.length, changedRecords, changes: changes.length, flags: flags.length, errors: errors.length },
  changes, flags, errors,
};
const rp = writeReport('refresh-gis', report);
console.log(JSON.stringify(report.counts));
console.log(`report: ${rp}`);
if (APPLY) console.log('next: node scripts/validate.mjs && node scripts/build-search-index.mjs');
if (errors.length && errors.length === todo.length) process.exit(2);
