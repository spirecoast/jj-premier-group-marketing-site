import { fill } from "@/lib/issues/copy";
import { stackGeometry } from "@/lib/tide/chart";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { num, type Bands } from "@/lib/tide/issue";

/** Light to dark with price: the bands are ordered, so one hue in steps (Harbor 200, 400, 600, 900). */
const BAND_FILL = ["#c3d5e0", "#7ba1b6", "#4c728a", "#1e3442"];

/**
 * The month's homes by price band as one horizontal stacked bar, drawn in
 * SVG like the issue's other charts, with the shares written out beneath it
 * (the legend is the data, so nothing depends on telling the fills apart).
 */
export function PriceBands({ bands, market }: { bands: Bands; market: string }) {
  const g = stackGeometry(
    bands.bands.map((b) => b.share),
    320,
    2,
  );
  const shares = bands.bands.filter((b) => b.share !== null);
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="t-label text-linen-700">{W.bandsTitle}</span>
        <span className="t-record text-graphite-500">{fill(W.bandsNote, { n: num(bands.sample) })}</span>
      </figcaption>
      {g.length ? (
        <svg viewBox="0 0 320 14" preserveAspectRatio="none" className="block h-3.5 w-full" role="img" aria-label={`${market}: ${shares.map((b) => `${b.label} ${b.share}%`).join(", ")}`}>
          {bands.bands
            .map((b, i) => ({ b, i }))
            .filter(({ b }) => b.share)
            .map(({ b, i }, k) => (
              <rect key={b.key} x={g[k]!.x} y={0} width={g[k]!.w} height={14} fill={BAND_FILL[i]} />
            ))}
        </svg>
      ) : null}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4">
        {bands.bands.map((b, i) => (
          <div key={b.key} className="flex flex-col-reverse gap-1 border-t-2 pt-2.5" style={{ borderColor: BAND_FILL[i] }}>
            <dt className="text-[0.8125rem] leading-snug text-body-muted">{b.label}</dt>
            <dd className="font-mono text-[1.375rem] leading-none text-navy tabular-nums">{b.share === null ? "–" : `${b.share}%`}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
