#!/usr/bin/env node
/**
 * County sales ingest: Manatee + Sarasota property appraiser public files →
 * data/sales/<county>.json.gz + data/sales/manifest.json.
 *
 *   npm run sales:ingest                 # download, normalize, write
 *   node scripts/sales/ingest.mjs --months 24 --cache-dir .cache/sales --out data/sales
 *   node scripts/sales/ingest.mjs --county manatee   # one county only
 *   node scripts/sales/ingest.mjs --no-download      # reuse cached source files
 *
 * Sources (public record, Florida Statutes ch. 119; see docs/SALES-DATA.md):
 *   Manatee County Property Appraiser, CAMA reports
 *     https://www.manateepao.gov/cama-reports/
 *     /data/Manateesales.csv            sales from Jan 1 of last year to now, nightly
 *     /data/manateesales<YYYY>.csv      one calendar year each, for the tail of the window
 *     /data/manatee_situs_addresses.zip parsed situs addresses (number, street, suffix, unit)
 *   Sarasota County Property Appraiser, data downloads
 *     https://www.sarasotapropertyappraiser.gov/downloads/download-data/
 *     /downloads/SCPA_Parcels_Sales_CSV.zip
 *       Parcel_Sales_CSV/ParcelSales.csv  every transfer since 2000 with FDOR qualification code
 *       Parcel_Sales_CSV/Sarasota.csv     parcel characteristics from the last certified roll
 *
 * NO-NAMES RULE: grantor, grantee and owner columns (Manatee SALE_GRANTOR,
 * SALE_GRANTEE; Sarasota Grantor, NAME1..NAME_ADD5, mailing address) are read
 * off the row and discarded here. They never reach the output file, the
 * server module or the browser. Only the property, the date and the price.
 *
 * Only Node built-ins: fetch, zlib, streams. No zip library: the two zips are
 * read with a small central-directory reader below.
 */

import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { open, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip, createInflateRaw } from "node:zlib";

// ---------------------------------------------------------------------------
// Arguments

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
};
const MONTHS = Number(flag("months", 24));
const CACHE_DIR = path.resolve(String(flag("cache-dir", ".cache/sales")));
const OUT_DIR = path.resolve(String(flag("out", "data/sales")));
const ONLY = flag("county", null);
const DOWNLOAD = !args.includes("--no-download");
const DRY = args.includes("--dry-run");

const TODAY = new Date();
const WINDOW_START = new Date(Date.UTC(TODAY.getUTCFullYear(), TODAY.getUTCMonth() - MONTHS, TODAY.getUTCDate()));
const WINDOW_START_ISO = WINDOW_START.toISOString().slice(0, 10);

const log = (...m) => console.error(`[sales] ${m.join(" ")}`);
log(`window: qualified sales from ${WINDOW_START_ISO} (${MONTHS} months)`);
log("names rule: grantor/grantee/owner columns are discarded at ingest and never written");

// ---------------------------------------------------------------------------
// Sources

const SOURCES = {
  manatee: {
    label: "Manatee County Property Appraiser",
    page: "https://www.manateepao.gov/cama-reports/",
    base: "https://www.manateepao.gov/data/",
  },
  sarasota: {
    label: "Sarasota County Property Appraiser",
    page: "https://www.sarasotapropertyappraiser.gov/downloads/download-data/",
    base: "https://www.sarasotapropertyappraiser.gov/downloads/",
  },
};

/**
 * FDOR sale qualification codes (Form DR-409 / NAL "sale qualification").
 * 01–04: a qualified, arm's-length sale of this parcel. 05–06 are qualified
 * too but span several parcels, so the price belongs to more than one
 * address and $/sqft would mislead; they are excluded with the disqualified
 * codes (11–43, 98, 99). Pre-2009 single-digit codes are out of the window.
 */
const QUALIFIED = new Set(["01", "02", "03", "04"]);

/**
 * DOR use code → the buckets the page talks about. The two counties extend
 * the two-digit DOR classes differently, so the third and fourth digits are
 * read per county:
 *   Manatee  0100 SFR, 0101 model home, 0105 SFR on 10+ acres, 0108 half
 *            duplex / paired villa, 0110 townhouse, 0164 uninhabitable
 *   Sarasota 0100 detached, 0101/0102 attached end/inside unit, 0105 SFR
 *            plus other building
 */
function propertyUse(dor, county) {
  const code = (dor ?? "").trim().padStart(4, "0");
  const major = code.slice(0, 2);
  if (code === "0900") return "other"; // common area
  if (major === "00") return "vacant";
  if (major === "04") return "condo";
  if (major === "01") {
    if (county === "manatee") {
      if (code === "0108") return "villa";
      if (code === "0110") return "townhome";
      if (code === "0164") return "other";
      return "single-family";
    }
    if (code === "0101" || code === "0102") return "townhome";
    return "single-family";
  }
  return "other";
}

// ---------------------------------------------------------------------------
// Download with a disk cache

async function download(url, file) {
  const dest = path.join(CACHE_DIR, file);
  mkdirSync(CACHE_DIR, { recursive: true });
  if (!DOWNLOAD && existsSync(dest)) {
    log(`cache: ${file} (${mb(statSync(dest).size)} MB)`);
    return dest;
  }
  log(`get: ${url}`);
  const res = await fetch(url, { headers: { "user-agent": "jjpremiergroup-sales-ingest/1 (+https://github.com/spirecoast/real-estate)" } });
  if (!res.ok || !res.body) throw new Error(`${url}: HTTP ${res.status}`);
  const tmp = `${dest}.part`;
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
  await rename(tmp, dest);
  log(`got: ${file} (${mb(statSync(dest).size)} MB)`);
  return dest;
}

const mb = (n) => (n / 1048576).toFixed(1);

// ---------------------------------------------------------------------------
// Minimal zip reader: find an entry in the central directory, stream it out

async function zipEntryStream(zipPath, entryName) {
  const fh = await open(zipPath, "r");
  const size = (await fh.stat()).size;
  // End of central directory record: last 64KB + 22 bytes.
  const tailLen = Math.min(size, 65557);
  const tail = Buffer.alloc(tailLen);
  await fh.read(tail, 0, tailLen, size - tailLen);
  let eocd = -1;
  for (let i = tailLen - 22; i >= 0; i--) {
    if (tail.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new Error(`${zipPath}: no end-of-central-directory`);
  let cdSize = tail.readUInt32LE(eocd + 12);
  let cdOffset = tail.readUInt32LE(eocd + 16);
  let entries = tail.readUInt16LE(eocd + 10);
  // ZIP64 (files over 4GB or >65535 entries): locator sits just before the EOCD.
  if (cdOffset === 0xffffffff || cdSize === 0xffffffff || entries === 0xffff) {
    const loc = eocd - 20;
    if (loc < 0 || tail.readUInt32LE(loc) !== 0x07064b50) throw new Error(`${zipPath}: zip64 locator missing`);
    const z64 = Number(tail.readBigUInt64LE(loc + 8));
    const rec = Buffer.alloc(56);
    await fh.read(rec, 0, 56, z64);
    entries = Number(rec.readBigUInt64LE(32));
    cdSize = Number(rec.readBigUInt64LE(40));
    cdOffset = Number(rec.readBigUInt64LE(48));
  }
  const cd = Buffer.alloc(cdSize);
  await fh.read(cd, 0, cdSize, cdOffset);
  let p = 0;
  const found = [];
  for (let n = 0; n < entries && p + 46 <= cd.length; n++) {
    if (cd.readUInt32LE(p) !== 0x02014b50) break;
    const method = cd.readUInt16LE(p + 10);
    let compSize = cd.readUInt32LE(p + 20);
    const nameLen = cd.readUInt16LE(p + 28);
    const extraLen = cd.readUInt16LE(p + 30);
    const commentLen = cd.readUInt16LE(p + 32);
    let localOffset = cd.readUInt32LE(p + 42);
    const name = cd.toString("utf8", p + 46, p + 46 + nameLen);
    if (compSize === 0xffffffff || localOffset === 0xffffffff) {
      // zip64 extra field 0x0001: [uncompressed][compressed][offset] for the 0xffffffff fields, in order.
      let q = p + 46 + nameLen;
      const end = q + extraLen;
      while (q + 4 <= end) {
        const id = cd.readUInt16LE(q);
        const len = cd.readUInt16LE(q + 2);
        if (id === 1) {
          let r = q + 4;
          if (cd.readUInt32LE(p + 24) === 0xffffffff) r += 8;
          if (compSize === 0xffffffff) {
            compSize = Number(cd.readBigUInt64LE(r));
            r += 8;
          }
          if (localOffset === 0xffffffff) localOffset = Number(cd.readBigUInt64LE(r));
        }
        q += 4 + len;
      }
    }
    found.push(name);
    if (name === entryName || name.endsWith(`/${entryName}`)) {
      const local = Buffer.alloc(30);
      await fh.read(local, 0, 30, localOffset);
      if (local.readUInt32LE(0) !== 0x04034b50) throw new Error(`${zipPath}: bad local header for ${name}`);
      const start = localOffset + 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
      await fh.close();
      const raw = createReadStream(zipPath, { start, end: start + compSize - 1 });
      if (method === 0) return raw;
      if (method === 8) return raw.pipe(createInflateRaw());
      throw new Error(`${zipPath}: ${name} uses unsupported compression method ${method}`);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  await fh.close();
  throw new Error(`${zipPath}: entry ${entryName} not found (have: ${found.join(", ")})`);
}

// ---------------------------------------------------------------------------
// Streaming CSV (RFC 4180: quotes, doubled quotes, CR/LF inside quotes)

function csvRows(stream, { encoding = "latin1" } = {}) {
  let field = "";
  let row = [];
  let inQuotes = false;
  let afterQuote = false;
  let header = null;
  const out = new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      const text = chunk.toString(encoding);
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
          if (c === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              inQuotes = false;
              afterQuote = true;
            }
          } else field += c;
          continue;
        }
        if (c === '"' && field === "" && !afterQuote) {
          inQuotes = true;
        } else if (c === ",") {
          row.push(field);
          field = "";
          afterQuote = false;
        } else if (c === "\n" || c === "\r") {
          if (c === "\r" && text[i + 1] === "\n") i++;
          row.push(field);
          field = "";
          afterQuote = false;
          if (row.length > 1 || row[0] !== "") {
            if (!header) header = row.map((h) => h.trim().replace(/^﻿/, ""));
            else {
              const obj = {};
              for (let k = 0; k < header.length; k++) obj[header[k]] = row[k] ?? "";
              this.push(obj);
            }
          }
          row = [];
        } else field += c;
      }
      cb();
    },
    flush(cb) {
      if (field !== "" || row.length) {
        row.push(field);
        if (header && (row.length > 1 || row[0] !== "")) {
          const obj = {};
          for (let k = 0; k < header.length; k++) obj[header[k]] = row[k] ?? "";
          this.push(obj);
        }
      }
      cb();
    },
  });
  stream.on("error", (e) => out.destroy(e));
  return stream.pipe(out);
}

async function eachRow(stream, fn) {
  for await (const row of csvRows(stream)) fn(row);
}

// ---------------------------------------------------------------------------
// Field helpers

const SUFFIXES = new Set([
  "ALY", "AVE", "BLVD", "BND", "CIR", "CT", "CV", "CRES", "DR", "EXPY", "HWY", "LN", "LOOP", "PATH", "PKWY", "PL", "PT", "RD",
  "ROW", "RUN", "SQ", "ST", "TER", "TRCE", "TRL", "WAY", "XING", "GLN", "HOLW", "KY", "LNDG", "MNR", "PASS", "PIKE", "PLZ", "RDG", "VW", "WALK",
]);
const DIRS = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]);

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim().toUpperCase();
const int = (s) => {
  const n = Number(String(s ?? "").replace(/[,$\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};
const num = (s) => {
  const n = Number(String(s ?? "").replace(/[,$\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** "MIDNIGHT PASS RD" → { name: "MIDNIGHT PASS", suffix: "RD" }; a trailing directional is kept on the name. */
function splitStreet(street) {
  const parts = clean(street).split(" ").filter(Boolean);
  let postdir = "";
  if (parts.length > 1 && DIRS.has(parts[parts.length - 1])) postdir = parts.pop();
  let suffix = "";
  if (parts.length > 1 && SUFFIXES.has(parts[parts.length - 1])) suffix = parts.pop();
  return { name: parts.join(" "), suffix, postdir };
}

/** Unparsed "5133 96TH ST E UNIT 102B" → number, street, unit (Manatee rows with no situs match). */
function parseAddressLine(line) {
  const s = clean(line);
  const m = s.match(/^(\d+[A-Z]?)\s+(.*)$/);
  if (!m) return null;
  let rest = m[2];
  let unit = "";
  const u = rest.match(/\s+(?:UNIT|APT|STE|#|BLDG|LOT)\s*([A-Z0-9-]+)$/);
  if (u) {
    unit = u[1];
    rest = rest.slice(0, u.index);
  }
  return { number: m[1], unit, ...splitStreet(rest) };
}

function record(county, r) {
  if (!r.number || !r.street) return null;
  const out = {
    county,
    parcelId: r.parcelId,
    number: r.number,
    predir: r.predir || "",
    street: r.street,
    suffix: r.suffix || "",
    postdir: r.postdir || "",
    unit: r.unit || "",
    city: r.city || "",
    zip: r.zip || "",
    saleDate: r.saleDate,
    salePrice: r.salePrice,
    qualified: true,
    qualCode: r.qualCode,
    instrument: r.instrument || "",
    livingArea: r.livingArea ?? null,
    lotSqft: r.lotSqft ?? null,
    yearBuilt: r.yearBuilt ?? null,
    beds: r.beds ?? null,
    baths: r.baths ?? null,
    propertyUse: r.propertyUse,
  };
  if (typeof r.lat === "number" && typeof r.lng === "number") {
    out.lat = r.lat;
    out.lng = r.lng;
  }
  return out;
}

function inWindow(iso) {
  return iso >= WINDOW_START_ISO && iso <= TODAY.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Manatee

async function ingestManatee() {
  const src = SOURCES.manatee;
  const files = [];
  // Current file: all sales from Jan 1 of the previous calendar year.
  files.push(await download(`${src.base}Manateesales.csv`, "Manateesales.csv"));
  // The window can reach into earlier calendar years; each has its own file.
  const prevYear = TODAY.getUTCFullYear() - 1;
  for (let y = WINDOW_START.getUTCFullYear(); y < prevYear; y++) {
    try {
      files.push(await download(`${src.base}manateesales${y}.csv`, `manateesales${y}.csv`));
    } catch (e) {
      log(`warn: ${e.message}; the window will start at ${prevYear}-01-01 for Manatee`);
    }
  }
  const situsZip = await download(`${src.base}manatee_situs_addresses.zip`, "manatee_situs_addresses.zip");

  // Pass 1: the sales rows inside the window.
  const sales = new Map(); // dedup key → partial record
  let seen = 0;
  for (const f of files) {
    await eachRow(createReadStream(f), (row) => {
      seen++;
      const code = (row.SALE_TRANSFER_CODE ?? "").trim().padStart(2, "0");
      if (!QUALIFIED.has(code)) return;
      const price = int(row.SALE_PRICE);
      if (!price || price < 1000) return;
      const [mm, dd, yyyy] = (row.SALE_DATE ?? "").split("/");
      if (!yyyy) return;
      const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
      if (!inWindow(iso)) return;
      const parcelId = (row.PARID ?? "").trim();
      const key = `${parcelId}|${iso}|${price}`;
      if (sales.has(key)) return;
      // SALE_GRANTOR / SALE_GRANTEE are on this row and are not read. (No-names rule.)
      sales.set(key, {
        parcelId,
        addressLine: row.SITUS_ADDRESS,
        city: clean(row.SITUS_POSTAL_CITY),
        zip: (row.SITUS_POSTAL_ZIP ?? "").trim().slice(0, 5),
        saleDate: iso,
        salePrice: price,
        qualCode: code,
        instrument: (row.SALE_INSTR_TYPE ?? "").trim(),
        livingArea: int(row.BLDGS_SQFT_LIVING),
        lotSqft: num(row.LAND_ACREAGE) ? Math.round(num(row.LAND_ACREAGE) * 43560) : null,
        yearBuilt: int(row.BLDG1_YEAR_BUILT),
        propertyUse: propertyUse(row.LAND_USE_CODE, "manatee"),
      });
    });
  }
  log(`manatee: ${seen} sale rows read, ${sales.size} qualified in window`);

  // Pass 2: structured situs parts for those parcels (primary address only).
  const wanted = new Set([...sales.values()].map((s) => s.parcelId));
  const situs = new Map();
  await eachRow(await zipEntryStream(situsZip, "manatee_situs_addresses.csv"), (row) => {
    const id = (row.PARID ?? "").trim();
    if (!wanted.has(id)) return;
    if ((row.SITUS_TYPE ?? "").trim() !== "PRIMARY" && situs.has(id)) return;
    situs.set(id, {
      number: clean(row.SITUS_ADDRESS_NUM),
      predir: clean(row.SITUS_PREDIR),
      street: clean(row.SITUS_STREET_NAME),
      suffix: clean(row.SITUS_STREET_SUF),
      postdir: clean(row.SITUS_POSTDIR),
      unit: clean(row.SITUS_SECADDUNIT),
    });
  });
  log(`manatee: situs parts matched for ${situs.size} of ${wanted.size} parcels`);

  const out = [];
  let dropped = 0;
  for (const s of sales.values()) {
    const parts = situs.get(s.parcelId) ?? (() => {
      const p = parseAddressLine(s.addressLine);
      return p ? { number: p.number, predir: "", street: p.name, suffix: p.suffix, postdir: p.postdir, unit: p.unit } : null;
    })();
    if (!parts || !parts.number || !parts.street) {
      dropped++;
      continue;
    }
    const rec = record("manatee", { ...s, ...parts });
    if (rec) out.push(rec);
    else dropped++;
  }
  log(`manatee: ${out.length} records, ${dropped} without a usable situs address`);
  return { records: out, sources: [`${src.base}Manateesales.csv`, ...files.slice(1).map((f) => `${src.base}${path.basename(f)}`), `${src.base}manatee_situs_addresses.zip`] };
}

// ---------------------------------------------------------------------------
// Sarasota

async function ingestSarasota() {
  const src = SOURCES.sarasota;
  const zip = await download(`${src.base}SCPA_Parcels_Sales_CSV.zip`, "SCPA_Parcels_Sales_CSV.zip");

  // Pass 1: transfers inside the window with a qualifying code.
  const sales = new Map();
  let seen = 0;
  await eachRow(await zipEntryStream(zip, "ParcelSales.csv"), (row) => {
    seen++;
    const code = (row.QualCode ?? "").trim().padStart(2, "0");
    if (!QUALIFIED.has(code)) return;
    const iso = (row.SaleDate ?? "").trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !inWindow(iso)) return;
    const price = int(row.SalePrice);
    if (!price || price < 1000) return;
    const parcelId = (row.Account ?? "").trim();
    const key = `${parcelId}|${iso}|${price}`;
    if (sales.has(key)) return;
    // row.Grantor is on this row and is not read. (No-names rule.)
    sales.set(key, { parcelId, saleDate: iso, salePrice: price, qualCode: code, instrument: (row.DeedType ?? "").trim() });
  });
  log(`sarasota: ${seen} transfer rows read, ${sales.size} qualified in window`);

  // Pass 2: the parcel record for each of those accounts.
  const wanted = new Set([...sales.values()].map((s) => s.parcelId));
  const parcels = new Map();
  await eachRow(await zipEntryStream(zip, "Sarasota.csv"), (row) => {
    const id = (row.ACCOUNT ?? "").trim();
    if (!wanted.has(id)) return;
    // NAME1..NAME_ADD5, CITY/STATE/ZIP (mailing) are owner fields and are not read. (No-names rule.)
    const street = splitStreet(row.LOCS);
    const baths = (num(row.BATH) ?? 0) + (num(row.HALFBATH) ?? 0) * 0.5;
    parcels.set(id, {
      number: clean(row.LOCN).replace(/^0+$/, ""),
      predir: "",
      street: street.name,
      suffix: street.suffix,
      postdir: clean(row.LOCD) || street.postdir,
      unit: clean(row.UNIT),
      city: clean(row.LOCCITY),
      zip: (row.LOCZIP ?? "").trim().slice(0, 5),
      livingArea: int(row.LIVING),
      lotSqft: int(row.LSQFT),
      yearBuilt: int(row.YRBL),
      beds: int(row.BEDR),
      baths: baths > 0 ? baths : null,
      propertyUse: propertyUse(row.STCD, "sarasota"),
    });
  });
  log(`sarasota: parcel records matched for ${parcels.size} of ${wanted.size} accounts`);

  const out = [];
  let dropped = 0;
  for (const s of sales.values()) {
    const p = parcels.get(s.parcelId);
    if (!p || !p.number || !p.street) {
      dropped++;
      continue;
    }
    const rec = record("sarasota", { ...p, ...s });
    if (rec) out.push(rec);
    else dropped++;
  }
  log(`sarasota: ${out.length} records, ${dropped} without a parcel record or situs address`);
  return { records: out, sources: [`${src.base}SCPA_Parcels_Sales_CSV.zip`] };
}

// ---------------------------------------------------------------------------
// Output

async function writeGz(file, data) {
  const json = JSON.stringify(data);
  await pipeline(Readable.from([json]), createGzip({ level: 9 }), createWriteStream(file));
  return { bytes: statSync(file).size, sha256: createHash("sha256").update(json).digest("hex").slice(0, 16) };
}

function dateRange(records) {
  let from = null;
  let to = null;
  for (const r of records) {
    if (!from || r.saleDate < from) from = r.saleDate;
    if (!to || r.saleDate > to) to = r.saleDate;
  }
  return { from, to };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const manifestPath = path.join(OUT_DIR, "manifest.json");
  let manifest = { counties: {} };
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    // first run
  }
  const runners = { manatee: ingestManatee, sarasota: ingestSarasota };
  const names = ONLY ? [String(ONLY)] : Object.keys(runners);
  for (const name of names) {
    const run = runners[name];
    if (!run) throw new Error(`unknown county ${name}; expected manatee or sarasota`);
    const { records, sources } = await run();
    records.sort((a, b) => (a.saleDate < b.saleDate ? 1 : a.saleDate > b.saleDate ? -1 : a.parcelId.localeCompare(b.parcelId)));
    const byUse = {};
    for (const r of records) byUse[r.propertyUse] = (byUse[r.propertyUse] ?? 0) + 1;
    if (DRY) {
      log(`dry-run: ${name} ${records.length} records`, JSON.stringify(byUse));
      continue;
    }
    const file = path.join(OUT_DIR, `${name}.json.gz`);
    const { bytes, sha256 } = await writeGz(file, records);
    manifest.counties[name] = {
      label: SOURCES[name].label,
      page: SOURCES[name].page,
      sources,
      rows: records.length,
      byUse,
      ...dateRange(records),
      hasCoordinates: records.some((r) => typeof r.lat === "number"),
      file: path.basename(file),
      bytes,
      sha256,
    };
    log(`wrote ${file} (${mb(bytes)} MB gz, ${records.length} rows)`);
  }
  if (DRY) return;
  manifest.generatedAt = TODAY.toISOString();
  manifest.windowStart = WINDOW_START_ISO;
  manifest.windowMonths = MONTHS;
  manifest.qualifiedCodes = [...QUALIFIED];
  manifest.namesStripped = true;
  manifest.licence =
    "Public record under Florida Statutes chapter 119, published by the Manatee County and Sarasota County Property Appraisers. Not MLS data. Owner, grantor and grantee names are removed at ingest.";
  manifest.schema = 1;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const total = Object.values(manifest.counties).reduce((n, c) => n + c.bytes, 0);
  log(`manifest written; ${mb(total)} MB of gzipped data`);
  if (total > 8 * 1048576) log("WARNING: data exceeds the 8MB budget; shorten the window or drop fields");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
