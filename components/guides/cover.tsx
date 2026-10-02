import type { Guide } from "@/lib/guides/types";

/**
 * The cover, set the way the Virtus guides set theirs: a deep harbor ground
 * with a fine grid, faint contour lines like a survey map on the right, the
 * mono "Guide · 8 sections · 12 min read" line, the title in the display
 * face, the one-sentence promise and the byline. No photograph: a cover
 * photo has to be approved by the client first, and a soft one stretched to
 * the full width looked grainy. The guide's `cover` image still feeds its
 * card and its share image, where it's shown small.
 */
export function GuideCover({ guide, minutes, updated }: { guide: Guide; minutes: number; updated: string }) {
  const sections = guide.sections.length;
  return (
    <header className="guide-cover guide-cover-ground relative -mt-header overflow-hidden text-white">
      <Contours className="pointer-events-none absolute -right-[12%] top-1/2 h-[150%] w-auto -translate-y-1/2 md:-right-[4%] md:h-[135%]" />
      <div className="container-site relative flex min-h-[520px] flex-col justify-end gap-5 pb-14 pt-[calc(var(--header-h)+4rem)] lg:min-h-[600px]">
        <p className="t-eyebrow text-mist">
          Guide · {sections} sections · {minutes} min read
        </p>
        <span className="block h-px w-14 bg-sky-300" aria-hidden="true" />
        <h1 className="t-display max-w-[820px] text-balance text-white">{guide.title}</h1>
        <p className="t-lead max-w-[620px] text-linen-100">{guide.promise}</p>
        <p className="t-record text-linen-200">
          By {guide.author.name} · Updated {updated}
        </p>
      </div>
    </header>
  );
}

/**
 * Contour lines, drawn once from a fixed formula so every cover gets the same
 * quiet texture: nested rings whose radius wobbles with three slow waves,
 * like the height lines on a survey. One ring is drawn a little brighter.
 */
function Contours({ className }: { className?: string }) {
  const rings = 11;
  const cx = 500;
  const cy = 500;
  const paths: { d: string; bright: boolean }[] = [];
  for (let k = 0; k < rings; k += 1) {
    const r0 = 70 + k * 38;
    const pts: string[] = [];
    const steps = 120;
    for (let i = 0; i <= steps; i += 1) {
      const t = (i / steps) * Math.PI * 2;
      const wobble = 1 + 0.07 * Math.sin(3 * t + k * 0.35) + 0.045 * Math.sin(5 * t + 1.2 + k * 0.2) + 0.025 * Math.sin(8 * t + 2.1);
      const r = r0 * wobble;
      const x = cx + r * Math.cos(t) * 1.08;
      const y = cy + r * Math.sin(t) * 0.92;
      pts.push(`${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    paths.push({ d: `${pts.join(" ")}Z`, bright: k === 6 });
  }
  return (
    <svg viewBox="0 0 1000 1000" className={className} aria-hidden="true">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none" stroke={p.bright ? "var(--color-sky-300)" : "var(--color-mist)"} strokeOpacity={p.bright ? 0.42 : 0.14 + i * 0.008} strokeWidth={p.bright ? 1.4 : 1} />
      ))}
    </svg>
  );
}
