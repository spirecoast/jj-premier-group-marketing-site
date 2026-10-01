import { SOLD_COPY as C } from "./copy";
import { cn } from "@/lib/utils";

/**
 * One county sale as /api/sales returns it, and the list that shows a set
 * of them: a stacked list on phones, a table from md up. Shared by the
 * street search (/sell/sold) and the home-value page (/sell/home-value).
 * Never a name: the row has no field for one.
 */

/** One row as /api/sales returns it: the property and the sale, never a name. */
export type SaleRow = {
  county: "manatee" | "sarasota";
  address: string;
  city: string;
  zip: string;
  saleDate: string;
  salePrice: number;
  livingArea: number | null;
  pricePerSqft: number | null;
  yearBuilt: number | null;
  propertyUse: keyof typeof C.results.typeLabel;
  qualCode: string;
  instrument: string;
  rollChanged: boolean;
};

export type SalesSummary = {
  count: number;
  homes: number;
  lots: number;
  medianPricePerSqft: number | null;
  sqftSampleSize: number;
  medianPrice: number | null;
  from: string | null;
  to: string | null;
};

export const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const int = new Intl.NumberFormat("en-US");
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

/** "LILAC SKY DR" → "Lilac Sky Dr"; ordinals and directionals keep their case. */
export function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (/^(n|s|e|w|ne|nw|se|sw)$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** The roll has not caught up with this row: vacant on the roll, a 03/04 code, or built after the sale year. */
export function saleFlagged(r: SaleRow) {
  return r.rollChanged || r.propertyUse === "vacant";
}

export function typeLabel(r: SaleRow) {
  return C.results.typeLabel[r.propertyUse] ?? C.results.typeLabel.other;
}

type Props = {
  rows: SaleRow[];
  /** The footnote behind the dagger; the sold page's by default. */
  rollChangedNote?: string;
};

export function SalesTable({ rows, rollChangedNote = C.results.rollChanged }: Props) {
  return (
    <>
      {/* Phones: a stacked list. From md up: the table. */}
      <ul className="flex flex-col divide-y divide-hairline border-y border-hairline md:hidden">
        {rows.map((r, i) => {
          const changed = saleFlagged(r);
          return (
            <li key={`${r.address}-${r.saleDate}-${i}`} className="flex flex-col gap-1.5 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="t-body text-navy">{titleCase(r.address)}</span>
                <span className="t-record shrink-0 text-navy">{usd.format(r.salePrice)}</span>
              </div>
              <span className="t-mono-sm text-graphite-500">
                {fmtDate(r.saleDate)} · {titleCase(r.city)} {r.zip}
                {changed ? <span title={rollChangedNote}> ·&nbsp;†</span> : null}
              </span>
              <span className="t-small text-body">
                {[
                  r.livingArea ? `${int.format(r.livingArea)} sq ft` : null,
                  r.pricePerSqft ? `${usd.format(r.pricePerSqft)}/sq ft` : null,
                  r.yearBuilt ? `built ${r.yearBuilt}` : null,
                  typeLabel(r),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              <Th>{C.results.columns.address}</Th>
              <Th>{C.results.columns.date}</Th>
              <Th align="right">{C.results.columns.price}</Th>
              <Th align="right">{C.results.columns.sqft}</Th>
              <Th align="right">{C.results.columns.perSqft}</Th>
              <Th align="right">{C.results.columns.year}</Th>
              <Th>{C.results.columns.type}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const changed = saleFlagged(r);
              return (
                <tr key={`${r.address}-${r.saleDate}-${i}`} className="border-b border-hairline align-baseline">
                  <td className="py-3 pr-4">
                    <span className="t-body text-navy">{titleCase(r.address)}</span>
                    <span className="block t-mono-sm text-graphite-500">
                      {titleCase(r.city)} {r.zip}
                      {changed ? <span title={rollChangedNote}> ·&nbsp;†</span> : null}
                    </span>
                  </td>
                  <Td className="whitespace-nowrap">{fmtDate(r.saleDate)}</Td>
                  <Td align="right" className="t-record text-navy">
                    {usd.format(r.salePrice)}
                  </Td>
                  <Td align="right">{r.livingArea ? int.format(r.livingArea) : "—"}</Td>
                  <Td align="right">{r.pricePerSqft ? usd.format(r.pricePerSqft) : "—"}</Td>
                  <Td align="right">{r.yearBuilt ?? "—"}</Td>
                  <Td>{typeLabel(r)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th scope="col" className={cn("t-eyebrow py-3 pr-4 font-medium text-graphite-500", align === "right" && "text-right")}>
      {children}
    </th>
  );
}

function Td({ children, align, className }: { children: React.ReactNode; align?: "right"; className?: string }) {
  return <td className={cn("t-body py-3 pr-4 text-body tabular-nums", align === "right" && "text-right", className)}>{children}</td>;
}
