import { fill } from "@/lib/issues/copy";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { num, usd, type MixPart } from "@/lib/tide/issue";

const MIX_FILL: Record<MixPart["key"], string> = { "single-family": "#35566b", attached: "#35899c", land: "#bcad96" };

/** The month's home sales by kind: a row each, its share as a thin bar, the count and the median price beside it. */
export function HomeMix({ mix }: { mix: MixPart[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="t-label text-linen-700">{W.mixTitle}</p>
      <ul className="flex flex-col gap-3.5">
        {mix.map((p) => (
          <li key={p.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[0.9375rem] leading-snug text-body">{p.label}</span>
              <span className="shrink-0 font-mono text-[0.9375rem] text-navy tabular-nums">{p.share === null ? "–" : fill(W.mixShare, { share: p.share })}</span>
            </div>
            <div className="h-1 w-full bg-linen-200" aria-hidden="true">
              <div className="h-full" style={{ width: `${p.share ?? 0}%`, background: MIX_FILL[p.key] }} />
            </div>
            <p className="t-record text-graphite-500">
              {num(p.count)} {p.count === 1 ? "sale" : "sales"}
              {p.medianPrice !== null ? ` · ${fill(W.mixMedian, { price: usd(p.medianPrice) })}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
