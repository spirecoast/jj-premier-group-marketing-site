// Shared helpers for the neighborhood data scripts. Node 20+ (built-in fetch), no dependencies.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
/** Where the data files live. Override with NEIGHBORHOODS_DATA_DIR if the scripts are moved away from data/. */
export const DATA_DIR = resolve(process.env.NEIGHBORHOODS_DATA_DIR || `${ROOT}/data`);
/** Where run reports are written (git-ignore this folder). Override with NEIGHBORHOODS_REPORTS_DIR. */
export const REPORTS_DIR = resolve(process.env.NEIGHBORHOODS_REPORTS_DIR || `${ROOT}/reports`);
export const today = () => new Date().toISOString().slice(0, 10);

/** Tiny argv parser: --flag, --key value, --key=value. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const [k, v] = a.slice(2).split('=');
    if (v !== undefined) out[k] = v;
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
    else out[k] = true;
  }
  return out;
}

export function dataPath(args) {
  return resolve(args.data || `${DATA_DIR}/neighborhoods.json`);
}
export function loadData(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
export function saveData(path, records) {
  records.sort((a, b) => a.slug.localeCompare(b.slug));
  writeFileSync(path, JSON.stringify(records, null, 2) + '\n');
}
export function writeReport(name, obj) {
  const dir = REPORTS_DIR;
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const p = `${dir}/${name}-${stamp}.json`;
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
  return p;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

/** fetch with timeout + retries; returns { ok, status, url, text } (never throws). */
export async function fetchText(url, { method = 'GET', body, headers = {}, timeoutMs = 30000, retries = 2 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { method, body, headers: { 'User-Agent': UA, Accept: '*/*', ...headers }, signal: ctl.signal, redirect: 'follow' });
      const text = await r.text();
      clearTimeout(t);
      if ((r.status === 429 || r.status >= 500) && attempt < retries) { await sleep(3000 * (attempt + 1)); continue; }
      return { ok: r.ok, status: r.status, url: r.url, text };
    } catch (e) {
      clearTimeout(t);
      if (attempt < retries) { await sleep(2000 * (attempt + 1)); continue; }
      return { ok: false, status: 0, url, text: '', error: String(e) };
    }
  }
}
export async function fetchJson(url, opts) {
  const r = await fetchText(url, opts);
  try { return { ...r, json: JSON.parse(r.text) }; } catch { return { ...r, json: null }; }
}

/** ArcGIS REST /query helper. Returns features array (throws on service error). */
export async function arcgisQuery(layerUrl, params) {
  return (await arcgisQueryRaw(layerUrl, params)).features || [];
}
export async function arcgisQueryRaw(layerUrl, params) {
  const qs = new URLSearchParams({ f: 'json', ...params });
  const r = await fetchJson(`${layerUrl}/query?${qs}`);
  if (!r.json) throw new Error(`ArcGIS ${r.status} ${layerUrl}: ${r.error || r.text.slice(0, 200)}`);
  if (r.json.error) throw new Error(`ArcGIS error ${layerUrl}: ${JSON.stringify(r.json.error).slice(0, 300)}`);
  return r.json;
}
/** Page through every feature of a layer (resultOffset paging; copes with a server max below pageSize). */
export async function arcgisAll(layerUrl, params, pageSize = 1000) {
  const all = [];
  for (let offset = 0; ; ) {
    const j = await arcgisQueryRaw(layerUrl, { ...params, resultOffset: offset, resultRecordCount: pageSize });
    const f = j.features || [];
    all.push(...f);
    offset += f.length;
    if (!f.length || (!j.exceededTransferLimit && f.length < pageSize)) break;
  }
  return all;
}
export const pointGeom = (lng, lat) => ({
  geometry: `${lng},${lat}`, geometryType: 'esriGeometryPoint', inSR: 4326, spatialRel: 'esriSpatialRelIntersects',
});

export function metersBetween(lat1, lng1, lat2, lng2) {
  const dy = (lat1 - lat2) * 111000;
  const dx = (lng1 - lng2) * 111000 * Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

/** Normalize a community name for matching. */
export function normName(s) {
  return (s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/\b(the|at lakewood ranch|of lakewood ranch|lakewood ranch|on palmer ranch|of sarasota|sarasota|homeowners?|property owners|neighborhood|improvement|civic|association|assn|inc|hoa|poa|condominiums?|condos?|community|by del webb|by lennar|phase [ivx0-9]+)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Add or refresh a source entry on a record (matched by URL). */
export function touchSource(rec, url, supports, checked = today()) {
  const s = rec.sources.find((x) => x.url === url);
  if (s) {
    const set = new Set([...s.supports.split(','), ...supports.split(',')].map((x) => x.trim()).filter(Boolean));
    s.supports = [...set].join(',');
    s.checked = checked;
  } else {
    rec.sources.push({ url, supports, checked, sourceDate: null });
  }
}

export function appendNote(rec, text) {
  if (!text) return;
  if ((rec.notes || '').includes(text)) return;
  rec.notes = rec.notes ? `${rec.notes} | ${text}` : text;
}

// ---- formatting identical to the original build (Python str.title + fixes) ----
export const pyTitle = (s) => s.toLowerCase().replace(/(^|[^a-z])([a-z])/g, (_, p, c) => p + c.toUpperCase());
export function formatAddress(addr, postal, zip) {
  if (!addr) return null;
  let st = pyTitle(addr.replace(/(,\s*|\s+)(?:(?:UNIT|APT|STE|SUITE|BLDG|LOT)\b|#).*$/i, ''));
  st = st.replace(/\b(Nw|Ne|Sw|Se)\b/g, (m) => m.toUpperCase());
  st = st.replace(/\b(\d+)(St|Nd|Rd|Th)\b/g, (_, d, x) => d + x.toLowerCase());
  st = st.replace(/\b(Us|Sr|Cr|Mlk)\b/g, (m) => m.toUpperCase());
  st = st.replace(/\bMc([a-z])/g, (_, c) => 'Mc' + c.toUpperCase());
  return `${st}, ${pyTitle(postal || '')}, FL ${zip || ''}`.trim().replace(/^,+|,+$/g, '');
}
