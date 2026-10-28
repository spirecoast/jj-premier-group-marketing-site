/**
 * Living numbers (components/motion/living-number.tsx): a figure already
 * formatted for the page ("$512,000", "1,234", "7%", "−3%") is taken apart,
 * counted up over 600 ms on the brand curve, and written back in the same
 * shape at every frame. Pure, so the shape rules are unit-tested.
 */

export type NumberParts = {
  /** Whatever came before the digits: "$", "about ", a minus sign. */
  prefix: string;
  /** The figure itself, as typed. */
  value: number;
  /** Whatever came after: "%", " sq ft". */
  suffix: string;
  /** How many decimals the text showed. */
  decimals: number;
  /** Whether thousands were grouped with commas. */
  grouped: boolean;
};

const SHAPE = /^(.*?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(.*)$/s;

/** The first number in the text and what surrounds it, or null when there is no digit to count. */
export function splitNumber(text: string): NumberParts | null {
  const m = SHAPE.exec(text);
  if (!m) return null;
  const whole = m[2]!;
  const frac = m[3] ?? "";
  const value = Number(whole.replace(/,/g, "") + frac);
  if (!Number.isFinite(value)) return null;
  return { prefix: m[1]!, value, suffix: m[4]!, decimals: frac ? frac.length - 1 : 0, grouped: whole.includes(",") };
}

/** `v` written in the same shape as the text the parts came from. */
export function formatLike(p: NumberParts, v: number): string {
  const n = Math.max(0, v).toLocaleString("en-US", {
    minimumFractionDigits: p.decimals,
    maximumFractionDigits: p.decimals,
    useGrouping: p.grouped,
  });
  return `${p.prefix}${n}${p.suffix}`;
}

/**
 * cubic-bezier(0.2, 0.7, 0.2, 1), the brand curve in app/globals.css, as a
 * function of time: the x root by a few Newton steps, then the y at it.
 */
export function easeBrand(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const [x1, y1, x2, y2] = [0.2, 0.7, 0.2, 1];
  const ax = 1 - 3 * x2 + 3 * x1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 1 - 3 * y2 + 3 * y1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const slopeX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  let u = t;
  for (let i = 0; i < 6; i += 1) {
    const d = slopeX(u);
    if (Math.abs(d) < 1e-6) break;
    u -= (sampleX(u) - t) / d;
  }
  u = Math.min(1, Math.max(0, u));
  return ((ay * u + by) * u + cy) * u;
}
