"use client";

import { useId } from "react";
import type { ProductFamily } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The three product emblems, from the Figma file's "06 Logos" page: Tide a
 * disc with the water cut through it, Atlas a map tile with contour rings
 * round a summit, Encore a stage arch with a spotlight star. Solid shapes
 * with the details cut out, so they read at 16px and on any ground. The
 * colour is the family accent unless `ink` asks for the darker shade a light
 * ground needs.
 */
type Family = ProductFamily["key"];

function contour(cx: number, cy: number, r: number, k: number) {
  let d = "";
  for (let i = 0; i <= 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const rr = r * (1 + 0.1 * Math.sin(3 * t + 0.6 + k * 0.5) + 0.05 * Math.sin(5 * t + 1.7 - k * 0.3));
    d += `${i ? "L" : "M"}${(cx + rr * Math.cos(t)).toFixed(2)} ${(cy + rr * Math.sin(t) * 0.92).toFixed(2)}`;
  }
  return `${d}Z`;
}
function wave(y: number, a: number) {
  let d = `M0 ${y}`;
  for (let x = 2; x <= 64; x += 2) d += ` L${x} ${(y + a * Math.sin((x / 32) * Math.PI * 2)).toFixed(2)}`;
  return d;
}
function star(cx: number, cy: number, r: number) {
  const q = r * 0.22;
  return `M${cx} ${cy - r} Q${cx + q} ${cy - q} ${cx + r} ${cy} Q${cx + q} ${cy + q} ${cx} ${cy + r} Q${cx - q} ${cy + q} ${cx - r} ${cy} Q${cx - q} ${cy - q} ${cx} ${cy - r}Z`;
}

const GEOMETRY = {
  tide: { shape: <circle cx="32" cy="32" r="30" />, cuts: [wave(33, 2.6), wave(42.5, 2.6), wave(51, 2.6)], widths: [3.4, 2.6, 1.9], fills: [] as string[] },
  atlas: { shape: <rect x="2" y="2" width="60" height="60" rx="15" />, cuts: [contour(37, 38, 9, 0), contour(37, 38, 19, 1), contour(37, 38, 30, 2)], widths: [2.7, 2.7, 2.7], fills: [] as string[] },
  encore: { shape: <path d="M8 62 L8 27 C8 12 19 2 32 2 C45 2 56 12 56 27 L56 62 Z" />, cuts: ["M17 51 L47 51"], widths: [2.6], fills: [star(32, 27, 11)] },
} as const;

export function Emblem({ family, ink, className, title }: { family: Family; ink?: boolean; className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const g = GEOMETRY[family];
  const color = `var(--color-${family}${ink ? "-ink" : ""})`;
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}>
      <defs>
        <mask id={`${id}-m`}>
          <rect width="64" height="64" fill="#fff" />
          {g.cuts.map((d, i) => (
            <path key={i} d={d} stroke="#000" strokeWidth={g.widths[i]} strokeLinecap="round" fill="none" />
          ))}
          {g.fills.map((d, i) => (
            <path key={`f${i}`} d={d} fill="#000" />
          ))}
          {family === "atlas" ? <circle cx="37" cy="38" r="2.6" fill="#000" /> : null}
        </mask>
      </defs>
      <g fill={color} mask={`url(#${id}-m)`}>
        {g.shape}
      </g>
    </svg>
  );
}

/**
 * A product's lockup: the emblem, the product's name (the family's name first,
 * Encore's in italic), and JJ Premier Group under it. `tone` is the ground:
 * dark for a photograph or a family colour, light for the page.
 */
export function ProductLockup({
  family,
  name,
  familyName,
  tone = "dark",
  size = "md",
  className,
}: {
  family: Family;
  /** The full product name, e.g. "Tide Sale Calculator". */
  name: string;
  /** The family's name, set first ("Encore" in italic). */
  familyName: string;
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
}) {
  const rest = name.startsWith(familyName) ? name.slice(familyName.length) : ` ${name}`;
  const s = {
    sm: { em: "size-7", name: "text-[17px]", by: "text-[7.5px]", gap: "gap-2.5", rows: "gap-1" },
    md: { em: "size-10", name: "text-[22px]", by: "text-[8.5px]", gap: "gap-3", rows: "gap-1.5" },
    lg: { em: "size-14", name: "text-[30px]", by: "text-[10px]", gap: "gap-4", rows: "gap-2" },
    hero: { em: "size-11 lg:size-[54px]", name: "text-[24px] lg:text-[30px]", by: "text-[8.5px] lg:text-[10px]", gap: "gap-3 lg:gap-4", rows: "gap-1.5 lg:gap-2" },
  }[size];
  const by = tone === "dark" ? "text-white/75" : "text-graphite-500";
  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      <Emblem family={family} ink={tone === "light"} className={cn("shrink-0", s.em)} />
      {/* The name sets the width; the JJ Premier Group line runs to the name's right edge with a hairline, so both lines end together. */}
      <span className={cn("inline-flex flex-col", s.rows)}>
        <span className={cn("whitespace-nowrap font-display font-light leading-none tracking-[-0.01em]", s.name, tone === "dark" ? "text-white" : "text-navy")}>
          <span className={family === "encore" ? "italic" : undefined}>{familyName}</span>
          {rest}
        </span>
        <span className={cn("flex w-0 min-w-full items-center gap-2", by)}>
          <span className={cn("whitespace-nowrap font-sans font-medium uppercase leading-none tracking-[0.22em]", s.by)}>JJ Premier Group</span>
          <span className="h-px min-w-3 flex-1 bg-current opacity-50" aria-hidden="true" />
        </span>
      </span>
    </span>
  );
}
