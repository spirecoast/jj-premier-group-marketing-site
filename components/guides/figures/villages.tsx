import type { VillagesFigure } from "@/lib/guides/types";
import { FigureTable, seriesBg } from "./shared";

/**
 * Villages grouped by the district they sit in. One block per kind of
 * district, with a colour bar in its series colour, then one row per
 * district naming its villages as chips. The chips wrap, so the figure
 * reads the same on a phone as on a desk; nothing is drawn that carries
 * words.
 */
export function VillagesView({ figure, title }: { figure: VillagesFigure; title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-4">
        {figure.groups.map((g) => (
          <li key={g.title} className="flex flex-col border border-hairline bg-white">
            <span className={`block h-1.5 ${seriesBg(g.series)}`} aria-hidden="true" />
            <div className="flex flex-col gap-4 p-5 md:p-6">
              <div className="flex flex-col gap-1">
                <p className="t-h4 text-navy">{g.title}</p>
                <p className="text-[13.5px] leading-snug text-body-muted">{g.sub}</p>
              </div>
              <dl className="flex flex-col divide-y divide-hairline border-t border-hairline">
                {g.rows.map((r) => (
                  <div key={r.name} className="grid gap-x-5 gap-y-2 py-3 sm:grid-cols-[160px_1fr]">
                    <dt className="flex items-center gap-2.5 text-[14px] font-medium leading-snug text-ink">
                      <span className={`h-2.5 w-2.5 shrink-0 ${seriesBg(g.series)}`} aria-hidden="true" />
                      {r.name}
                    </dt>
                    <dd className="flex flex-wrap gap-2">
                      {r.villages.map((v) => (
                        <span key={v} className="border border-hairline bg-linen-50 px-2.5 py-1 text-[13.5px] leading-snug text-ink">
                          {v}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ol>
      <FigureTable caption={title} columns={["District", "Villages"]} rows={figure.groups.flatMap((g) => g.rows.map((r) => [`${r.name} (${g.title})`, r.villages.join(", ")]))} />
    </div>
  );
}
