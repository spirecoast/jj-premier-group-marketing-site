/**
 * Prices as published: "$25", "$25–$65", "From $37", "$20 members / $25
 * non-members", "Free". The text is kept as written for the page; the
 * numbers drive the "From the venue" panel's range.
 */
export function parsePrice(s: string | undefined | null): { min?: number; max?: number; free?: boolean } {
  if (!s) return {};
  const text = s.replace(/,(?=\d{3}\b)/g, "");
  const nums = [...text.matchAll(/\$\s?(\d+(?:\.\d{1,2})?)/g)].map((m) => Number(m[1])).filter((n) => Number.isFinite(n) && n < 100_000);
  const free = /\bfree\b/i.test(text) && !nums.length;
  if (!nums.length) return free ? { min: 0, max: 0, free: true } : {};
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

/** "$25", "$25–$65", "Free" from numbers. */
export function formatPrice(min?: number | null, max?: number | null): string | undefined {
  if (min == null && max == null) return undefined;
  const lo = min ?? max!;
  const hi = max ?? min!;
  if (hi === 0) return "Free";
  const f = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
  return lo === hi ? f(lo) : `${f(lo)}–${f(hi)}`;
}

/** "$25 members; $30 not-yet-members" → the text as published plus its range. */
export function priceFields(text: string | undefined | null): { price?: string; priceMin?: number; priceMax?: number } {
  const t = (text ?? "").replace(/\s+/g, " ").replace(/^(?:price|prices|tickets?|cost|admission)\s*:\s*/i, "").trim();
  if (!t) return {};
  const p = parsePrice(t);
  return { price: t, priceMin: p.min, priceMax: p.max };
}
