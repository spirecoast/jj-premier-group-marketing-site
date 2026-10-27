import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink } from "@/components/ui/external-link";
import { marketName } from "@/lib/content/markets";
import { checkedLabel, type CompareCell, type CompareRow } from "@/lib/neighborhoods/compare";
import { LEVEL_LABEL, TYPE_LABEL } from "@/lib/neighborhoods/format";
import type { NeighborhoodRecord } from "@/lib/neighborhoods/types";
import { SavePlaceButton } from "./save-place";
import "./compare.css";

export const NOT_KNOWN = "Not known yet";

export type ComparePlace = { record: NeighborhoodRecord; ancestors: NeighborhoodRecord[] };

/** One cell: the value (linked when it has a page of its own), then where it came from and when it was checked. */
export function Cell({ c }: { c: CompareCell }) {
  if (!c.value) return <span className="t-small text-graphite-500">{NOT_KNOWN}</span>;
  return (
    <span className="compare-cell">
      <span className="t-small text-body">{c.href ? <ExternalLink href={c.href}>{c.value}</ExternalLink> : c.value}</span>
      {c.source ? (
        <span className="t-note">
          {c.source.host} · checked {checkedLabel(c.source.checked)}
        </span>
      ) : null}
    </span>
  );
}

/**
 * The table: a label column, one column per place, a row per fact. Extra
 * rows (Encore this month, sales nearby when that lands) come in through
 * `extra`, already rendered, so the page decides what is real enough to show.
 */
export function CompareTable({ places, rows, extra = [] }: { places: ComparePlace[]; rows: CompareRow[]; extra?: { id: string; label: string; cells: ReactNode[] }[] }) {
  return (
    <div className="compare-wrap" style={{ ["--compare-cols" as string]: places.length }}>
      <table className="compare">
        <thead>
          <tr>
            <th scope="col">
              <span className="flex flex-col gap-2">
                <span className="t-mono-sm text-graphite-500">
                  {places.length} of 4
                </span>
                {places.length < 4 ? (
                  <Link href={"/neighborhoods" as Route} className="t-small text-harbor-700 underline underline-offset-4 hover:text-navy">
                    Add {places.length === 2 ? "a third" : "a fourth"} from the map
                  </Link>
                ) : null}
              </span>
            </th>
            {places.map(({ record: r, ancestors }) => (
              <th key={r.slug} scope="col">
                <span className="compare-head">
                  <span className="compare-head-top">
                    <span className="t-h3 text-navy">
                      <Link href={`/neighborhoods/${r.slug}`} className="transition-colors hover:text-harbor-700">
                        {r.name}
                      </Link>
                    </span>
                    <SavePlaceButton slug={r.slug} name={r.name} className="-mr-2 -mt-2 shrink-0 !border-transparent !bg-transparent" />
                  </span>
                  <span className="t-note">{[ancestors.length ? ancestors.map((a) => a.name).join(" › ") : marketName(r.market), r.type ? TYPE_LABEL[r.type] : LEVEL_LABEL[r.level]].join(" · ")}</span>
                  <Link href={`/neighborhoods/${r.slug}`} className="link-rule self-start">
                    The full page
                  </Link>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                <span className="t-mono-sm text-graphite-500">{row.label}</span>
              </th>
              {row.cells.map((c, i) => (
                <td key={places[i]!.record.slug}>
                  <Cell c={c} />
                </td>
              ))}
            </tr>
          ))}
          {extra.map((row) => (
            <tr key={row.id}>
              <th scope="row">
                <span className="t-mono-sm text-graphite-500">{row.label}</span>
              </th>
              {row.cells.map((c, i) => (
                <td key={places[i]!.record.slug}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
