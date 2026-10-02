/**
 * Path-data helpers the three portraits share. Coordinates are written at one
 * decimal (a tenth of a pixel is below anything a screen shows, and it keeps
 * the markup lean), never as "-0", and a few thousand marks go into one path
 * each rather than one element each.
 */

/** A number for path data: one decimal, no trailing zero, never "-0". */
export function n(v: number): string {
  const r = Math.round(v * 10) / 10;
  return String(r === 0 ? 0 : r);
}

/** A polyline through the points, as path data. */
export function polyline(points: readonly (readonly [number, number])[]): string {
  let d = "";
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i]!;
    d += `${i ? "L" : "M"}${n(p[0])} ${n(p[1])}`;
  }
  return d;
}

/** A dot as path data: a hair of a segment that round caps turn into a disc of the stroke's width. */
export function dot(x: number, y: number): string {
  return `M${n(x)} ${n(y)}h.1`;
}

/** A straight mark from one point to another. */
export function mark(x1: number, y1: number, x2: number, y2: number): string {
  return `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;
}
