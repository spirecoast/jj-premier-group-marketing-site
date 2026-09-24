#!/usr/bin/env node
// Regenerate data/neighborhoods.search.json from data/neighborhoods.json. No network.
//   node scripts/build-search-index.mjs [--data path] [--out path]
// Run after any edit to the full dataset. The index drops notes, sources and descriptions (not for display / too heavy)
// and adds `path` (ancestor names) and `q` (normalized search text).
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DATA_DIR, parseArgs, dataPath, loadData } from './lib.mjs';

const args = parseArgs();
const records = loadData(dataPath(args));
const out = resolve(args.out || `${DATA_DIR}/neighborhoods.search.json`);
const by = new Map(records.map((r) => [r.slug, r]));

export const norm = (s) => (s || '').toLowerCase().replace(/&/g, ' and ').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const idx = [...records].sort((a, b) => a.slug.localeCompare(b.slug)).map((r) => {
  const path = [];
  for (let p = r.parentSlug; p && by.has(p) && path.length < 4; p = by.get(p).parentSlug) path.unshift(by.get(p).name);
  const terms = [r.name, ...(r.aliases || []), ...path, ...(r.zips || []), ...(r.activeBuilders || []), r.developer, r.hoa?.name,
    r.jurisdiction, r.type];
  const q = [...new Set(terms.filter(Boolean).map(norm).filter(Boolean))].join(' ');
  return {
    slug: r.slug, name: r.name, aliases: r.aliases || [], level: r.level, parentSlug: r.parentSlug, path,
    market: r.market, bradentonArea: r.bradentonArea, county: r.county, jurisdiction: r.jurisdiction, zips: r.zips || [],
    type: r.type, status: r.status, homeTypes: r.homeTypes || [], activeBuilders: r.activeBuilders || [], gated: r.gated,
    lat: r.lat, lng: r.lng, research: r.research, q,
  };
});

writeFileSync(out, JSON.stringify(idx));
console.log(JSON.stringify({ entries: idx.length, out }));
