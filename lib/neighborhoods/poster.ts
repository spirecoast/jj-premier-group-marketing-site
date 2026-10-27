/**
 * The still picture a neighborhood page shows in the map's frame before the
 * map itself is asked for: the place, its children and its parent as points,
 * projected into a safe area in the middle of a 600 x 380 canvas so nothing
 * is cropped when the frame is only 340 px wide and the SVG is drawn to cover
 * it. Pure geometry; the page turns the result into SVG.
 */
export type PosterPoint = { name: string; lng: number; lat: number; kind: "self" | "child" | "parent" };
export type PosterMark = { name: string; x: number; y: number; kind: "self" | "child" | "parent" };

export const POSTER_W = 600;
export const POSTER_H = 380;
/** The box the points are fitted into: 280 wide so a 340 px frame still shows every mark. */
const SAFE = { left: 160, right: 440, top: 64, bottom: 316 };

/** Metres per degree of longitude shrink with latitude; one factor for the whole catalog is close enough here. */
const COS_LAT = Math.cos((27.42 * Math.PI) / 180);

export function posterMarks(points: PosterPoint[]): PosterMark[] {
  if (!points.length) return [];
  let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
  for (const p of points) {
    w = Math.min(w, p.lng); e = Math.max(e, p.lng); s = Math.min(s, p.lat); n = Math.max(n, p.lat);
  }
  const spanX = Math.max((e - w) * COS_LAT, 1e-6);
  const spanY = Math.max(n - s, 1e-6);
  const boxW = SAFE.right - SAFE.left;
  const boxH = SAFE.bottom - SAFE.top;
  // One point, or points on a line: a scale from the other axis keeps them from collapsing to nothing.
  const scale = points.length === 1 ? 0 : Math.min(boxW / spanX, boxH / spanY);
  const cx = (SAFE.left + SAFE.right) / 2;
  const cy = (SAFE.top + SAFE.bottom) / 2;
  const midX = ((w + e) / 2) * COS_LAT;
  const midY = (n + s) / 2;
  return points.map((p) => ({
    name: p.name,
    kind: p.kind,
    x: Math.round((cx + (p.lng * COS_LAT - midX) * scale) * 10) / 10,
    y: Math.round((cy - (p.lat - midY) * scale) * 10) / 10,
  }));
}
