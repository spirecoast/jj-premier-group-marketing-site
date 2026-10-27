import { fill } from "@/lib/issues/copy";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { num, type SinceThen as SinceThenModel } from "@/lib/tide/issue";

/** The three markets on the dark band, in market order: Sky 300, Mist and Sky 500, as the share bar above uses them. */
const MARK = ["#89d4e3", "#c7e7ef", "#44a6bb"];

/**
 * The strip under the big figure: what the county has posted for the months
 * after the data month, per market, against a typical month. It is live
 * (never frozen), since its point is what has come in since the issue went
 * out; the figures above it stay as published. Each month is a count, a bar
 * for its share of a typical month, and a note that says partial while the
 * county is still posting.
 */
export function SinceThen({ since }: { since: SinceThenModel }) {
  const markets = since.months[0]?.markets.map((m) => ({ market: m.market, name: m.name })) ?? [];
  return (
    <div className="container-site pb-section" data-tide-since-then="">
      <div className="flex flex-col gap-8 border-t border-sky-300/25 pt-8">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-baseline lg:justify-between lg:gap-8">
          <h3 className="t-label text-mist">{W.sinceHeading}</h3>
          <p className="t-note max-w-none text-linen-200">{fill(W.sinceNote, { asOf: since.asOf })}</p>
        </div>
        <div className="grid gap-7 lg:grid-cols-3 lg:gap-8">
          {markets.map((mk, i) => (
            <div key={mk.market} className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-[0.875rem] leading-snug text-linen-100">
                <span className="size-2 shrink-0" style={{ background: MARK[i] }} aria-hidden="true" />
                {mk.name}
              </p>
              <dl className="flex flex-col">
                {since.months.map((mo) => {
                  const x = mo.markets.find((m) => m.market === mk.market);
                  if (!x) return null;
                  const share = x.share === null ? null : Math.min(100, x.share);
                  const shareLine = x.share === null ? W.sinceNoTypical : fill(W.sinceShare, { pct: String(x.share) });
                  return (
                    <div key={mo.month} className="flex flex-col gap-1.5 pt-4 first:pt-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="t-small text-linen-100">{mo.label}</dt>
                        <dd className="font-mono text-[1.375rem] leading-none text-white tabular-nums">{num(x.count)}</dd>
                      </div>
                      <div className="h-0.5 w-full bg-sky-300/25" aria-hidden="true">
                        <div className="tide-since-bar h-full bg-tide" style={{ width: `${share ?? 0}%` }} />
                      </div>
                      <dd className="t-note max-w-none text-linen-200">{x.count === 0 ? W.sinceNone : x.partial ? `${shareLine} · ${W.sincePartial}` : shareLine}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
