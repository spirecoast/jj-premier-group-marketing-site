"use client";

import { useEffect, useRef, useState } from "react";

/** The frame's measures, in pixels: the gap between its two lines, the rise of the arch, and the room between bulbs. */
const GAP = 16;
const SPACING = 38;

type Pt = { x: number; y: number };

/** A closed frame inset by `m` from the box: up the left side, over an elliptical arch, down the right, back along the foot. */
function frame(w: number, h: number, rise: number, m: number): Pt[] {
  const pts: Pt[] = [];
  const cx = w / 2;
  const rx = cx - m;
  const ry = rise - m * 0.6;
  const yArch = rise + m * 0.4;
  const steps = 96;
  pts.push({ x: m, y: h - m });
  pts.push({ x: m, y: yArch });
  for (let i = 1; i < steps; i++) {
    const t = Math.PI - (i / steps) * Math.PI;
    pts.push({ x: cx + rx * Math.cos(t), y: yArch - ry * Math.sin(t) });
  }
  pts.push({ x: w - m, y: yArch });
  pts.push({ x: w - m, y: h - m });
  return pts;
}

const toPath = (pts: Pt[]) => `M${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L")} Z`;

/** Points every `spacing` along the closed loop through `pts`, the count rounded so the gaps come out even. */
function along(pts: Pt[], spacing: number): Pt[] {
  const loop = [...pts, pts[0]!];
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < loop.length; i++) {
    const d = Math.hypot(loop[i]!.x - loop[i - 1]!.x, loop[i]!.y - loop[i - 1]!.y);
    seg.push(d);
    total += d;
  }
  const n = Math.max(8, Math.round(total / spacing));
  const step = total / n;
  const out: Pt[] = [];
  let k = 0;
  let acc = 0;
  for (let j = 0; j < n; j++) {
    const target = j * step;
    while (k < seg.length - 1 && acc + seg[k]! < target) acc += seg[k++]!;
    const f = seg[k] ? (target - acc) / seg[k]! : 0;
    out.push({ x: loop[k]!.x + (loop[k + 1]!.x - loop[k]!.x) * f, y: loop[k]!.y + (loop[k + 1]!.y - loop[k]!.y) * f });
  }
  return out;
}

/**
 * Encore's marquee: a theatre frame of two gold lines, closed all the way
 * round with an arched top, and a run of bulbs between the lines on every
 * side. Drawn to the masthead's size once it's on the page (and again when
 * it changes), so the bulbs always sit evenly spaced between the lines.
 */
export function EncoreMarquee() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The layout size, not the on-screen one: the page's entrance animation scales it for a moment.
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setBox((b) => (b && Math.abs(b.w - w) < 1 && Math.abs(b.h - h) < 1 ? b : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shape = box && box.w > 200 && box.h > 160
    ? (() => {
        const rise = Math.min(44, box.h * 0.1);
        const outer = frame(box.w, box.h, rise, 1);
        const inner = frame(box.w, box.h, rise, GAP);
        const bulbs = along(frame(box.w, box.h, rise, GAP / 2 + 0.5), SPACING);
        return { outer: toPath(outer), inner: toPath(inner), bulbs };
      })()
    : null;

  return (
    <div ref={ref} className="encore-marquee" aria-hidden="true">
      {shape && box ? (
        <>
          <svg className="encore-marquee-frame" width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}>
            <path d={shape.outer} pathLength={1} className="encore-marquee-line" />
            <path d={shape.inner} pathLength={1} className="encore-marquee-line encore-marquee-line-inner" />
          </svg>
          {shape.bulbs.map((p, i) => (
            <i key={i} className="encore-marquee-bulb" style={{ left: p.x, top: p.y, ["--i" as string]: i }} />
          ))}
        </>
      ) : null}
    </div>
  );
}
