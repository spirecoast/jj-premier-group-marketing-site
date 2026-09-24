import type { EventCategory } from "@/lib/content/types";
import { CATEGORY } from "./categories";

/**
 * Key art for the calendar, drawn in code in the brand: one motif per
 * category, varied by the event so no two cards look alike, on linen with
 * navy line work and a tick of the category's accent. It stands in wherever
 * a venue has not supplied a photograph, and it never needs a licence.
 */
const INK = "#2e4a5c";
const AMBER = "#96702a";
const GROUNDS = ["#f3eee6", "#ece5d9", "#f2f6f9", "#eef0e6"];

/** A tiny seeded generator so the same event always draws the same art. */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = { r: () => number; W: number; H: number; accent: string; sub: string };
const f = (n: number) => n.toFixed(1);

function music({ r, W, H, accent, sub }: Ctx): string {
  const lines = 5;
  const top = H * 0.32;
  const gap = H * 0.09;
  let s = "";
  for (let i = 0; i < lines; i += 1) s += `<line x1="${f(W * 0.08)}" y1="${f(top + i * gap)}" x2="${f(W * 0.92)}" y2="${f(top + i * gap)}" stroke="${INK}" stroke-opacity="0.35" stroke-width="1.5"/>`;
  const dense = sub === "orchestra" || sub === "choral" || sub === "gala";
  const n = dense ? 14 : sub === "chamber" ? 8 : 10;
  const jazz = sub === "jazz" || sub === "band";
  let x = W * 0.12;
  for (let i = 0; i < n; i += 1) {
    x += (W * 0.76) / n * (jazz ? 0.6 + r() * 0.8 : 1);
    if (x > W * 0.9) break;
    const line = Math.floor(r() * (lines * 2 - 1));
    const y = top + (line * gap) / 2;
    const rad = 9 + r() * 9;
    const fill = i % 4 === 1 ? accent : i % 7 === 3 ? AMBER : INK;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rad * 1.15)}" ry="${f(rad)}" fill="${fill}" transform="rotate(-18 ${f(x)} ${f(y)})"/>`;
    if (r() > 0.25) s += `<line x1="${f(x + rad * 1.05)}" y1="${f(y)}" x2="${f(x + rad * 1.05)}" y2="${f(y - gap * 2.6)}" stroke="${fill}" stroke-width="2.5"/>`;
    if (sub === "choral" && r() > 0.5) s += `<ellipse cx="${f(x)}" cy="${f(y - gap)}" rx="${f(rad * 1.15)}" ry="${f(rad)}" fill="${INK}" fill-opacity="0.7" transform="rotate(-18 ${f(x)} ${f(y - gap)})"/>`;
  }
  return s;
}

function theater({ r, W, H, accent, sub }: Ctx): string {
  const left = W * 0.16;
  const right = W * 0.84;
  const top = H * 0.16;
  const bottom = H * 0.86;
  const arch = `M${f(left)} ${f(bottom)} V${f(top + H * 0.22)} A${f((right - left) / 2)} ${f(H * 0.22)} 0 0 1 ${f(right)} ${f(top + H * 0.22)} V${f(bottom)}`;
  let s = `<path d="${arch}" fill="none" stroke="${INK}" stroke-width="3"/>`;
  s += `<line x1="${f(W * 0.08)}" y1="${f(bottom)}" x2="${f(W * 0.92)}" y2="${f(bottom)}" stroke="${INK}" stroke-width="2"/>`;
  const folds = sub === "circus" ? 9 : 6;
  for (const side of [0, 1]) {
    for (let i = 0; i < folds; i += 1) {
      const x0 = side ? right - i * (W * 0.028) - 6 : left + i * (W * 0.028) + 6;
      const sway = 6 + r() * 10;
      s += `<path d="M${f(x0)} ${f(top + H * 0.2)} C${f(x0 + sway)} ${f(H * 0.45)} ${f(x0 - sway)} ${f(H * 0.65)} ${f(x0)} ${f(bottom - 2)}" fill="none" stroke="${i % 2 ? accent : INK}" stroke-opacity="${i % 2 ? 0.9 : 0.45}" stroke-width="${sub === "circus" ? 5 : 2}"/>`;
    }
  }
  const lx = W * (0.4 + r() * 0.2);
  s += `<ellipse cx="${f(lx)}" cy="${f(bottom - 4)}" rx="${f(W * 0.12)}" ry="${f(H * 0.04)}" fill="${AMBER}" fill-opacity="0.35"/>`;
  s += `<path d="M${f(lx)} ${f(top + H * 0.1)} L${f(lx - W * 0.12)} ${f(bottom - 4)} L${f(lx + W * 0.12)} ${f(bottom - 4)} Z" fill="${AMBER}" fill-opacity="0.12"/>`;
  if (sub === "ballet" || sub === "dance") {
    for (let i = 0; i < 3; i += 1) s += `<path d="M${f(lx - 80 + i * 40)} ${f(H * 0.6)} q40 -60 80 0" fill="none" stroke="${accent}" stroke-width="2" stroke-opacity="0.8"/>`;
  }
  if (sub === "comedy" || sub === "improv") {
    s += `<circle cx="${f(lx - 26)}" cy="${f(H * 0.5)}" r="16" fill="none" stroke="${accent}" stroke-width="3"/><circle cx="${f(lx + 26)}" cy="${f(H * 0.5)}" r="16" fill="${accent}"/>`;
  }
  return s;
}

function gallery({ r, W, H, accent }: Ctx): string {
  const n = 3 + Math.floor(r() * 3);
  let s = `<line x1="${f(W * 0.06)}" y1="${f(H * 0.82)}" x2="${f(W * 0.94)}" y2="${f(H * 0.82)}" stroke="${INK}" stroke-opacity="0.35" stroke-width="1.5"/>`;
  let x = W * 0.08;
  for (let i = 0; i < n; i += 1) {
    const w = W * (0.12 + r() * 0.14);
    const h = H * (0.22 + r() * 0.3);
    if (x + w > W * 0.94) break;
    const y = H * (0.2 + r() * 0.25);
    s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
    s += `<rect x="${f(x + 10)}" y="${f(y + 10)}" width="${f(w - 20)}" height="${f(h - 20)}" fill="none" stroke="${INK}" stroke-opacity="0.3" stroke-width="1"/>`;
    const kind = Math.floor(r() * 3);
    if (kind === 0) s += `<circle cx="${f(x + w / 2)}" cy="${f(y + h / 2)}" r="${f(Math.min(w, h) * 0.22)}" fill="${accent}"/>`;
    else if (kind === 1) s += `<path d="M${f(x + 16)} ${f(y + h - 16)} L${f(x + w - 16)} ${f(y + 16)}" stroke="${accent}" stroke-width="4"/>`;
    else s += `<path d="M${f(x + 16)} ${f(y + h * 0.6)} q${f(w * 0.25)} -${f(h * 0.3)} ${f(w * 0.5)} 0 t${f(w * 0.5 - 32)} 0" fill="none" stroke="${i === 1 ? AMBER : accent}" stroke-width="3"/>`;
    x += w + W * (0.03 + r() * 0.05);
  }
  return s;
}

function talks({ r, W, H, accent }: Ctx): string {
  const cx = W * 0.18;
  const cy = H * 0.52;
  let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="10" fill="${accent}"/>`;
  for (let i = 1; i <= 5; i += 1) {
    const rad = i * (H * 0.11);
    s += `<path d="M${f(cx + rad * 0.5)} ${f(cy - rad * 0.866)} A${f(rad)} ${f(rad)} 0 0 1 ${f(cx + rad * 0.5)} ${f(cy + rad * 0.866)}" fill="none" stroke="${i % 2 ? INK : accent}" stroke-opacity="${(1 - i * 0.14).toFixed(2)}" stroke-width="${i === 1 ? 3 : 2}"/>`;
  }
  const lines = 4 + Math.floor(r() * 3);
  for (let i = 0; i < lines; i += 1) {
    const w = W * (0.16 + r() * 0.22);
    s += `<line x1="${f(W * 0.6)}" y1="${f(H * 0.3 + i * (H * 0.09))}" x2="${f(W * 0.6 + w)}" y2="${f(H * 0.3 + i * (H * 0.09))}" stroke="${i === 0 ? AMBER : INK}" stroke-opacity="${i === 0 ? 1 : 0.5}" stroke-width="4" stroke-linecap="round"/>`;
  }
  return s;
}

function film({ r, W, H, accent }: Ctx): string {
  const y0 = H * 0.3;
  const hh = H * 0.42;
  let s = `<rect x="${f(-W * 0.02)}" y="${f(y0)}" width="${f(W * 1.04)}" height="${f(hh)}" fill="${INK}" transform="rotate(-6 ${f(W / 2)} ${f(H / 2)})"/>`;
  const holes = 14;
  for (let i = 0; i < holes; i += 1) {
    const x = (W / holes) * i + 10;
    s += `<rect x="${f(x)}" y="${f(y0 + 10)}" width="18" height="12" fill="#f3eee6" transform="rotate(-6 ${f(W / 2)} ${f(H / 2)})"/>`;
    s += `<rect x="${f(x)}" y="${f(y0 + hh - 22)}" width="18" height="12" fill="#f3eee6" transform="rotate(-6 ${f(W / 2)} ${f(H / 2)})"/>`;
  }
  const frames = 5;
  const lit = Math.floor(r() * frames);
  for (let i = 0; i < frames; i += 1) {
    const x = W * 0.05 + i * (W * 0.185);
    s += `<rect x="${f(x)}" y="${f(y0 + 34)}" width="${f(W * 0.16)}" height="${f(hh - 68)}" fill="${i === lit ? accent : "#f3eee6"}" fill-opacity="${i === lit ? 1 : 0.9}" transform="rotate(-6 ${f(W / 2)} ${f(H / 2)})"/>`;
  }
  s += `<circle cx="${f(W * 0.82)}" cy="${f(H * 0.18)}" r="${f(H * 0.05)}" fill="${AMBER}" fill-opacity="0.6"/>`;
  return s;
}

function festival({ r, W, H, accent }: Ctx): string {
  let s = "";
  const strings = 3;
  for (let k = 0; k < strings; k += 1) {
    const y = H * (0.18 + k * 0.22);
    const sag = H * (0.08 + r() * 0.08);
    const n = 9 + Math.floor(r() * 4);
    s += `<path d="M0 ${f(y)} Q${f(W / 2)} ${f(y + sag * 2)} ${f(W)} ${f(y)}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="1.5"/>`;
    for (let i = 0; i < n; i += 1) {
      const t = (i + 0.5) / n;
      const x = t * W;
      const yy = y + 2 * sag * t * (1 - t) * 2;
      const size = 26 + r() * 10;
      const fill = (i + k) % 3 === 0 ? accent : (i + k) % 3 === 1 ? INK : AMBER;
      s += `<path d="M${f(x - size / 2)} ${f(yy)} L${f(x + size / 2)} ${f(yy)} L${f(x)} ${f(yy + size * 1.3)} Z" fill="${fill}" fill-opacity="${fill === INK ? 0.85 : 1}"/>`;
    }
  }
  return s;
}

function family({ r, W, H, accent }: Ctx): string {
  let s = "";
  const n = 6 + Math.floor(r() * 4);
  for (let i = 0; i < n; i += 1) {
    const cx = W * (0.15 + r() * 0.7);
    const cy = H * (0.18 + r() * 0.45);
    const rad = H * (0.06 + r() * 0.08);
    const outline = r() > 0.6;
    const fill = i % 3 === 0 ? accent : i % 3 === 1 ? AMBER : INK;
    s += outline
      ? `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rad)}" ry="${f(rad * 1.15)}" fill="none" stroke="${fill}" stroke-width="3"/>`
      : `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rad)}" ry="${f(rad * 1.15)}" fill="${fill}" fill-opacity="0.9"/>`;
    s += `<path d="M${f(cx)} ${f(cy + rad * 1.15)} q${f(rad * 0.4)} ${f(H * 0.12)} 0 ${f(H * 0.24)}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="1.5"/>`;
  }
  return s;
}

function market({ r, W, H, accent }: Ctx): string {
  let s = "";
  const scallops = 10;
  const w = W / scallops;
  for (let i = 0; i < scallops; i += 1) {
    const x = i * w;
    s += `<rect x="${f(x)}" y="${f(H * 0.14)}" width="${f(w + 1)}" height="${f(H * 0.16)}" fill="${i % 2 ? accent : "#fff"}"/>`;
    s += `<path d="M${f(x)} ${f(H * 0.3)} a${f(w / 2)} ${f(H * 0.06)} 0 0 0 ${f(w)} 0 Z" fill="${i % 2 ? accent : "#fff"}"/>`;
  }
  s += `<line x1="0" y1="${f(H * 0.14)}" x2="${f(W)}" y2="${f(H * 0.14)}" stroke="${INK}" stroke-width="3"/>`;
  const stalls = 3 + Math.floor(r() * 2);
  for (let i = 0; i < stalls; i += 1) {
    const x = W * (0.1 + i * (0.8 / stalls));
    const sw = W * (0.8 / stalls) * 0.7;
    s += `<rect x="${f(x)}" y="${f(H * 0.58)}" width="${f(sw)}" height="${f(H * 0.24)}" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
    const items = 2 + Math.floor(r() * 3);
    for (let k = 0; k < items; k += 1) s += `<circle cx="${f(x + 18 + k * (sw / items))}" cy="${f(H * 0.58 - 12)}" r="${f(8 + r() * 6)}" fill="${k % 2 ? AMBER : INK}"/>`;
  }
  return s;
}

const MOTIF: Record<EventCategory, (c: Ctx) => string> = { music, theater, gallery, talks, film, festival, family, market };

export type KeyArtOptions = { category: EventCategory; seed: string; subcategory?: string; width?: number; height?: number };

/** The SVG markup, sized to `width` x `height` (default 16:9), safe to inline. */
export function keyArtSvg({ category, seed, subcategory, width = 1200, height = 675 }: KeyArtOptions): string {
  const r = rng(`${category}:${seed}`);
  const ground = GROUNDS[Math.floor(r() * GROUNDS.length)]!;
  const accent = CATEGORY[category].color;
  const body = MOTIF[category]({ r, W: width, H: height, accent, sub: subcategory ?? "" });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${CATEGORY[category].label} key art"><rect width="${width}" height="${height}" fill="${ground}"/>${body}</svg>`;
}

export function keyArtDataUri(o: KeyArtOptions): string {
  return `data:image/svg+xml;base64,${Buffer.from(keyArtSvg(o)).toString("base64")}`;
}
