/**
 * The luminous set the three data portraits are drawn with (components/art):
 * marks of light on the deep harbor ground. Kept apart from the page palette
 * on purpose: these appear only in the art, never as text, a chip or a
 * button. The ground is Harbor 950 to 900; the lights are the brand's sky
 * and the brighter neighbours the portraits need to glow against navy.
 */
export const ART = {
  groundTop: "#142530",
  groundBottom: "#1e3442",
  sky: "#89d4e3",
  turquoise: "#3fd2c7",
  jade: "#2fb59a",
  mango: "#ffb34a",
  coral: "#f26b5b",
  hibiscus: "#e8457b",
  violet: "#a98bff",
  gold: "#f2d06b",
} as const;

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = Number.parseInt(v, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  const c = (x: number) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** The colour `t` of the way from `a` to `b` (0 is `a`, 1 is `b`). */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const k = Math.min(1, Math.max(0, t));
  return rgbToHex([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]);
}

/** A colour along a run of stops, evenly spaced: `t` 0 is the first stop, 1 the last. */
export function ramp(stops: readonly string[], t: number): string {
  if (stops.length === 1) return stops[0]!;
  const k = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(k));
  return mix(stops[i]!, stops[i + 1]!, k - i);
}

/**
 * The Tide ridges, back to front: night water at the back, then the sky
 * turning through violet and hibiscus to the first warm light at the front,
 * where the newest month sits.
 */
export const TIDE_RAMP: readonly string[] = [ART.turquoise, ART.sky, ART.violet, ART.hibiscus, ART.coral, ART.mango];
