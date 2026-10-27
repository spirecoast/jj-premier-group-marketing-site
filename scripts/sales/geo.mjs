/**
 * Parcel coordinates for the sales ingest, from the county's own GIS layers.
 * Pure (buffers in, numbers out) so lib/sales/geo.test.ts runs it on
 * fixtures; scripts/sales/ingest.mjs does the downloading.
 *
 * - A small ESRI shapefile reader: the .shp records (points and polygons)
 *   and the .dbf attribute rows, both read in record order, which is how a
 *   shapefile pairs a shape with its row.
 * - A polygon's centroid (area-weighted over every ring, so a hole pulls it
 *   the right way), falling back to the middle of the bounding box for a
 *   degenerate shape.
 * - The inverse Transverse Mercator projection (Snyder, USGS Professional
 *   Paper 1395, pp. 60-64) for the Florida West State Plane zone the
 *   Manatee layers are drawn in, so the result is latitude and longitude.
 *   NAD83 and WGS84 differ by about a metre here, under the five-decimal
 *   rounding (about 1.1 m) the ingest keeps.
 */

/** NAD 1983 StatePlane Florida West FIPS 0902, US survey feet (EPSG:2882), as the .prj names it. */
export const FLORIDA_WEST_FT = {
  a: 6378137.0,
  invF: 298.257222101,
  lat0: 24.333333333333332,
  lon0: -82.0,
  k0: 0.99994117647058822,
  falseEasting: 656166.66666666651,
  falseNorthing: 0,
  unit: 0.30480060960121924, // metres per US survey foot
};

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

function meridianArc(phi, a, e2) {
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  return (
    a *
    ((1 - e2 / 4 - (3 * e4) / 64 - (5 * e6) / 256) * phi -
      ((3 * e2) / 8 + (3 * e4) / 32 + (45 * e6) / 1024) * Math.sin(2 * phi) +
      ((15 * e4) / 256 + (45 * e6) / 1024) * Math.sin(4 * phi) -
      ((35 * e6) / 3072) * Math.sin(6 * phi))
  );
}

/** Projected x/y in the zone's units → { lat, lng } in degrees. */
export function inverseTransverseMercator(x, y, p = FLORIDA_WEST_FT) {
  const { a, invF, lat0, lon0, k0, falseEasting, falseNorthing, unit } = p;
  const f = 1 / invF;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const xm = (x - falseEasting) * unit;
  const ym = (y - falseNorthing) * unit;
  const M = meridianArc(rad(lat0), a, e2) + ym / k0;
  const mu = M / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const sin1 = Math.sin(phi1);
  const cos1 = Math.cos(phi1);
  const tan1 = Math.tan(phi1);
  const C1 = ep2 * cos1 * cos1;
  const T1 = tan1 * tan1;
  const N1 = a / Math.sqrt(1 - e2 * sin1 * sin1);
  const R1 = (a * (1 - e2)) / Math.pow(1 - e2 * sin1 * sin1, 1.5);
  const D = xm / (N1 * k0);
  const lat =
    phi1 -
    ((N1 * tan1) / R1) *
      ((D * D) / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4) / 24 + ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6) / 720);
  const lng = rad(lon0) + (D - ((1 + 2 * T1 + C1) * D ** 3) / 6 + ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5) / 120) / cos1;
  return { lat: deg(lat), lng: deg(lng) };
}

/** { lat, lng } in degrees → projected x/y in the zone's units. The tests use it to check the inverse. */
export function forwardTransverseMercator(latDeg, lngDeg, p = FLORIDA_WEST_FT) {
  const { a, invF, lat0, lon0, k0, falseEasting, falseNorthing, unit } = p;
  const f = 1 / invF;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const phi = rad(latDeg);
  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const T = Math.tan(phi) ** 2;
  const C = ep2 * Math.cos(phi) ** 2;
  const A = (rad(lngDeg) - rad(lon0)) * Math.cos(phi);
  const M = meridianArc(phi, a, e2);
  const M0 = meridianArc(rad(lat0), a, e2);
  const xm = k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5) / 120);
  const ym = k0 * (M - M0 + N * Math.tan(phi) * ((A * A) / 2 + ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24 + ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6) / 720));
  return { x: xm / unit + falseEasting, y: ym / unit + falseNorthing };
}

/** Five decimals: about a metre, all a parcel centroid can honestly claim. */
export const round5 = (n) => Math.round(n * 1e5) / 1e5;

/**
 * Every record in a .shp buffer, in order: `{ type, point }` for a point,
 * `{ type, centroid }` for a polygon (area-weighted over its rings; the
 * middle of the box when the area is nil), `null` for a null shape.
 */
export function shpRecords(buf) {
  if (buf.length < 100 || buf.readInt32BE(0) !== 9994) throw new Error("not a shapefile (.shp header)");
  const out = [];
  let p = 100;
  while (p + 8 <= buf.length) {
    const len = buf.readInt32BE(p + 4) * 2; // content length in 16-bit words
    const c = p + 8;
    if (c + len > buf.length) break;
    const type = len >= 4 ? buf.readInt32LE(c) : 0;
    if (type === 1 || type === 11 || type === 21) {
      out.push({ type: "point", point: { x: buf.readDoubleLE(c + 4), y: buf.readDoubleLE(c + 12) } });
    } else if (type === 5 || type === 15 || type === 25) {
      const xmin = buf.readDoubleLE(c + 4);
      const ymin = buf.readDoubleLE(c + 12);
      const xmax = buf.readDoubleLE(c + 20);
      const ymax = buf.readDoubleLE(c + 28);
      const numParts = buf.readInt32LE(c + 36);
      const numPoints = buf.readInt32LE(c + 40);
      const parts = [];
      for (let i = 0; i < numParts; i++) parts.push(buf.readInt32LE(c + 44 + i * 4));
      const pts = c + 44 + numParts * 4;
      let area2 = 0;
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < numParts; i++) {
        const start = parts[i];
        const end = i + 1 < numParts ? parts[i + 1] : numPoints;
        // Shoelace over the ring, relative to the box corner to keep the sums small.
        for (let j = start; j < end - 1; j++) {
          const x0 = buf.readDoubleLE(pts + j * 16) - xmin;
          const y0 = buf.readDoubleLE(pts + j * 16 + 8) - ymin;
          const x1 = buf.readDoubleLE(pts + (j + 1) * 16) - xmin;
          const y1 = buf.readDoubleLE(pts + (j + 1) * 16 + 8) - ymin;
          const cross = x0 * y1 - x1 * y0;
          area2 += cross;
          cx += (x0 + x1) * cross;
          cy += (y0 + y1) * cross;
        }
      }
      const centroid = Math.abs(area2) > 1e-6 ? { x: xmin + cx / (3 * area2), y: ymin + cy / (3 * area2) } : { x: (xmin + xmax) / 2, y: (ymin + ymax) / 2 };
      out.push({ type: "polygon", centroid });
    } else {
      out.push(null);
    }
    p = c + len;
  }
  return out;
}

/** The .dbf's rows, in order, with only the named fields read (trimmed strings). Deleted rows come back as null to keep the order. */
export function dbfRows(buf, fieldNames) {
  const count = buf.readUInt32LE(4);
  const headerLen = buf.readUInt16LE(8);
  const recordLen = buf.readUInt16LE(10);
  const fields = [];
  let offset = 1; // the deletion flag
  for (let p = 32; p < headerLen - 1 && buf[p] !== 0x0d; p += 32) {
    const name = buf.toString("latin1", p, p + 11).replace(/\0.*$/, "");
    const len = buf[p + 16];
    fields.push({ name, offset, len });
    offset += len;
  }
  const wanted = fields.filter((f) => fieldNames.includes(f.name));
  const missing = fieldNames.filter((n) => !fields.some((f) => f.name === n));
  if (missing.length) throw new Error(`dbf: missing field(s) ${missing.join(", ")} (have ${fields.map((f) => f.name).join(", ")})`);
  const out = [];
  for (let i = 0; i < count; i++) {
    const r = headerLen + i * recordLen;
    if (r + recordLen > buf.length) break;
    if (buf[r] === 0x2a) {
      out.push(null);
      continue;
    }
    const row = {};
    for (const f of wanted) row[f.name] = buf.toString("latin1", r + f.offset, r + f.offset + f.len).trim();
    out.push(row);
  }
  return out;
}

/**
 * Parcel id → { lat, lng } for the ids in `wanted`, from a shapefile's
 * records and rows. The first shape for an id wins; a later layer passed
 * to the caller can fill the ids this one missed.
 */
export function parcelPoints(shp, dbf, idField, wanted, project = inverseTransverseMercator) {
  const shapes = shpRecords(shp);
  const rows = dbfRows(dbf, [idField]);
  const out = new Map();
  const n = Math.min(shapes.length, rows.length);
  for (let i = 0; i < n; i++) {
    const row = rows[i];
    const shape = shapes[i];
    if (!row || !shape) continue;
    // The sales rows and the GIS layer can disagree on leading zeros; try the id as written, then without them.
    const raw = row[idField];
    const id = wanted.has(raw) ? raw : raw.replace(/^0+(?=\d)/, "");
    if (!wanted.has(id) || out.has(id)) continue;
    const xy = shape.type === "point" ? shape.point : shape.centroid;
    if (!Number.isFinite(xy.x) || !Number.isFinite(xy.y)) continue;
    const { lat, lng } = project(xy.x, xy.y);
    // Manatee and Sarasota sit between about 26.9 and 27.7 N, 82.9 and 81.9 W; anything else is a bad shape.
    if (lat < 26.5 || lat > 28 || lng < -83.2 || lng > -81.5) continue;
    out.set(id, { lat: round5(lat), lng: round5(lng) });
  }
  return out;
}
