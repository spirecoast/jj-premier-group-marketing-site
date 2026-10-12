"use client";

import { useId, type ReactNode } from "react";
import type { ProductFamily } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The three product emblems. Tide is a disc with the water cut through it.
 * Atlas is a folded street map with a pin on its middle panel: finding your
 * place. Encore is a ticket stub with a star: one ticket for a play, a
 * concert or an opening.
 * Each is one solid shape with the details cut out, so it reads at 16px and
 * on any ground. The colour is the family accent unless `ink` asks for the
 * darker shade a light ground needs.
 */
type Family = ProductFamily["key"];

function wave(y: number, a: number) {
  let d = `M0 ${y}`;
  for (let x = 2; x <= 64; x += 2) d += ` L${x} ${(y + a * Math.sin((x / 32) * Math.PI * 2)).toFixed(2)}`;
  return d;
}
function star5(cx: number, cy: number, r: number) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const t = -Math.PI / 2 + (i * Math.PI) / 5;
    d += `${i ? "L" : "M"}${(cx + rr * Math.cos(t)).toFixed(2)} ${(cy + rr * Math.sin(t)).toFixed(2)}`;
  }
  return `${d}Z`;
}

/** The ticket leans a little, like one held up at the door. */
const TICKET_TILT = "rotate(-14 32 32) translate(32 32) scale(0.94) translate(-32 -32)";
const STAR = star5(24.5, 32.6, 10.5);

/** Per family: the solid shape, and what the mask cuts from it (black) or keeps back (white). */
const GEOMETRY: Record<Family, { shape: ReactNode; cut: ReactNode }> = {
  tide: {
    shape: <circle cx="32" cy="32" r="30" />,
    cut: (
      <>
        <path d={wave(33, 2.6)} stroke="#000" strokeWidth={3.4} strokeLinecap="round" fill="none" />
        <path d={wave(42.5, 2.6)} stroke="#000" strokeWidth={2.6} strokeLinecap="round" fill="none" />
        <path d={wave(51, 2.6)} stroke="#000" strokeWidth={1.9} strokeLinecap="round" fill="none" />
      </>
    ),
  },
  atlas: {
    shape: <path d="M4 13 L22 7 L42 13 L60 7 L60 51 L42 57 L22 51 L4 57 Z" strokeLinejoin="round" />,
    cut: (
      <>
        <path d="M22 7 L22 51 M42 13 L42 57" stroke="#000" strokeWidth={2} fill="none" />
        <path d="M32 43 C29.4 39.4 24.6 33.6 24.6 27.6 A7.4 7.4 0 0 1 39.4 27.6 C39.4 33.6 34.6 39.4 32 43 Z" fill="#000" />
        <circle cx="32" cy="27.6" r="2.7" fill="#fff" />
      </>
    ),
  },
  encore: {
    shape: (
      <path
        transform={TICKET_TILT}
        d="M8 14 H56 Q60 14 60 18 V27 A5 5 0 0 0 60 37 V46 Q60 50 56 50 H8 Q4 50 4 46 V37 A5 5 0 0 0 4 27 V18 Q4 14 8 14 Z"
      />
    ),
    cut: (
      <g transform={TICKET_TILT}>
        <path d="M45 18.5 L45 45.5" stroke="#000" strokeWidth={2.2} strokeDasharray="2.6 3.1" strokeLinecap="round" />
        <path d={STAR} fill="#000" stroke="#000" strokeWidth={1} strokeLinejoin="round" />
      </g>
    ),
  },
};

export function Emblem({ family, ink, className, title }: { family: Family; ink?: boolean; className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const g = GEOMETRY[family];
  const color = `var(--color-${family}${ink ? "-ink" : ""})`;
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}>
      <defs>
        <mask id={`${id}-m`}>
          <rect width="64" height="64" fill="#fff" />
          {g.cut}
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
