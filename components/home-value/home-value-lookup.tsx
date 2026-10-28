"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { LeadForm } from "@/components/lead-form";
import { SalesTable, fmtDate, int, saleFlagged, titleCase, typeLabel, usd, type SaleRow, type SalesSummary } from "@/components/sales/sales-table";
import { SectionHeading } from "@/components/section-heading";
import { RuleLink } from "@/components/ui/button";
import { startSheetPath } from "@/lib/net-proceeds-url";
import { useSalesLookup } from "@/components/sales/use-sales-lookup";
import { parseHouseNumber } from "@/lib/sales/parcel";
import { WatchButton } from "@/components/watch/watch-button";
import { HOME_VALUE_COPY as C } from "./copy";

type Api =
  | {
      ok: true;
      query: { street: string; zip: string | null; number: string | null };
      match: "exact" | "partial" | "fuzzy" | "none";
      streets: string[];
      zips: string[];
      total: number;
      rows: SaleRow[];
      summary: SalesSummary;
      truncated: boolean;
      /** Present when a house number was sent: that parcel's own qualified sales, newest first. */
      parcel?: { number: string; unit: string | null; parcels: number; rows: SaleRow[] };
      /** Similar homes sold nearby (lib/sales/similar.ts), when the house has a recorded size. */
      similar?: {
        basis: { kind: "distance"; miles: number } | { kind: "subdivision"; name: string } | { kind: "zip"; zip: string };
        sizeFrom: number;
        sizeTo: number;
        since: string;
        rows: (SaleRow & { miles?: number })[];
      };
      source: { asOf: string; counties: string[] } | null;
    }
  | { ok: false; error: "zip-required"; streets: string[]; zips: string[]; total: number }
  | { ok: false; error: "no-data" | "street" | "zip" | "number" };

type Props = {
  /** False when data/sales has not been ingested; the page says so instead of searching. */
  loaded: boolean;
  /** ISO date from the manifest; the source line on the page. */
  asOf: string | null;
  counties: string[];
  /** manifest.windowMonths: the "last N months" every line on the page refers to. */
  months: number;
  /** How far each county's file reaches: the honest "as of" for a street in that county. */
  through?: { county: "manatee" | "sarasota"; label: string; to: string | null }[];
  /** The static "what the record can't tell you" section, rendered on the server, placed between the record and the ask. */
  children?: ReactNode;
};

const COUNTY_NAME = { manatee: "Manatee", sarasota: "Sarasota" } as const;

/** "Manatee records through Sep 24, 2026 · Sarasota through Oct 20, 2026", for the counties in the result (or all of them). */
function throughLine(through: NonNullable<Props["through"]>, counties: Set<string> | null, asOf: string | null): string {
  const list = through.filter((t) => t.to && (!counties || counties.has(t.county)));
  if (!list.length) return asOf ? `as of ${fmtDate(asOf)}` : "";
  return list.map((t, i) => (i === 0 ? C.through(COUNTY_NAME[t.county], fmtDate(t.to!)) : C.throughShort(COUNTY_NAME[t.county], fmtDate(t.to!)))).join(" · ");
}

type Searched = { address: string; zip: string };

/** The lookup as /api/sales takes it: the house number, the street and the ZIP, or what's missing. */
function toQuery(a: string, z: string): { query: URLSearchParams; searched: Searched } | { error: string } {
  const address = a.trim().replace(/\s+/g, " ").slice(0, 90);
  const zip = z.trim().slice(0, 5);
  const { number, street } = parseHouseNumber(address);
  if (!number) return { error: C.form.needNumber };
  if (street.length < 2) return { error: C.form.needStreet };
  if (!/^\d{5}$/.test(zip)) return { error: C.form.needZip };
  return { query: new URLSearchParams({ street, zip, number }), searched: { address, zip } };
}

/** The address as the seller typed it, tidied: "9403 9th Ave NW, 34209" (a pasted city, state or ZIP is dropped). */
function displayAddress(address: string, zip: string) {
  const { number, street } = parseHouseNumber(address);
  return [[number, titleCase(street)].filter(Boolean).join(" "), zip].filter(Boolean).join(", ");
}

/** The summary line, built from the computed summary only. */
function streetLine(data: Extract<Api, { ok: true }>, months: number) {
  const s = data.summary;
  return (
    C.street.line(s.count, months, data.streets.map(titleCase)) +
    C.street.split(s.homes, s.lots) +
    (s.medianPricePerSqft ? C.street.perSqft(usd.format(s.medianPricePerSqft), s.sqftSampleSize) : C.street.noPerSqft)
  );
}

export function HomeValueLookup({ loaded, asOf, counties, months, through = [], children }: Props) {
  const uid = useId();
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  // The ask form's address and message are a snapshot of the last completed lookup, so typing never remounts the form.
  const [sent, setSent] = useState<{ address: string; message: string } | null>(null);
  const { state, run: lookup, resultsRef } = useSalesLookup<Api, Searched>({
    action: "home-value",
    // A link that carries an address (/sell/home-value?address=…&zip=…) runs it on arrival;
    // one from Tide Street (?ask=<street>) only carries the street into the ask.
    fromLink: (p) => {
      const ask = p.get("ask")?.trim().slice(0, 90);
      if (ask) setSent({ address: ask, message: "" });
      if (!loaded) return null;
      const a = p.get("address") ?? "";
      if (!a) return null;
      const z = p.get("zip") ?? "";
      setAddress(a);
      setZip(z);
      const q = toQuery(a, z);
      if ("error" in q) {
        setFormError(q.error);
        return null;
      }
      return q;
    },
    onAsk: (data, searched) => {
      const shown = displayAddress(searched.address, searched.zip);
      const lines = [C.ask.messageIntro(shown)];
      if (data.ok) {
        lines.push(streetLine(data, months));
        const last = data.parcel?.rows[0];
        lines.push(last ? C.ask.messageParcel(fmtDate(last.saleDate), usd.format(last.salePrice), last.livingArea ? int.format(last.livingArea) : null, last.yearBuilt) : C.ask.messageNoParcel);
      }
      setSent({ address: shown, message: lines.join("\n") });
    },
  });

  function run(a: string, z: string) {
    const q = toQuery(a, z);
    if ("error" in q) return setFormError(q.error);
    setFormError(null);
    void lookup(q.query, q.searched);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(address, zip);
  }

  const data = state.status === "done" && state.data?.ok ? state.data : null;
  const failed = state.status === "done" && state.data && !state.data.ok ? state.data : null;
  // The source line names the counties in the result and how far each one's record reaches.
  const resultCounties = data?.rows.length ? new Set<string>(data.rows.map((r) => r.county)) : null;
  const sourceLabels = resultCounties ? through.filter((t) => resultCounties.has(t.county)).map((t) => t.label) : counties;
  const sourceLine = C.source(sourceLabels.length ? sourceLabels.join(" and ") : C.sourceDefault, throughLine(through, resultCounties, asOf));
  const shownAddress = state.searched ? displayAddress(state.searched.address, state.searched.zip) : "";
  const last = data?.parcel?.rows[0] ?? null;
  const earlier = data?.parcel?.rows.slice(1) ?? [];

  return (
    <>
      {/* The lookup. */}
      <section className="container-site flex flex-col gap-8 pb-section">
        {loaded ? (
          <form onSubmit={onSubmit} noValidate className="grid gap-6 border border-hairline bg-white p-6 sm:grid-cols-[1.8fr_1fr_auto] sm:items-end sm:p-8" role="search" aria-label={C.title}>
            <div className="field">
              <label htmlFor={`${uid}-address`} className="field-label">
                {C.form.address}
              </label>
              <input
                id={`${uid}-address`}
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={C.form.addressPlaceholder}
                autoComplete="address-line1"
                maxLength={90}
                required
                className="field-input"
                aria-describedby={formError ? `${uid}-form-err` : `${uid}-hint`}
              />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-zip`} className="field-label">
                {C.form.zip}
              </label>
              <input id={`${uid}-zip`} name="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder={C.form.zipPlaceholder} inputMode="numeric" autoComplete="postal-code" maxLength={5} required className="field-input" />
            </div>
            <button type="submit" disabled={state.status === "loading"} className="btn btn-navy">
              {state.status === "loading" ? C.form.searching : C.form.submit}
              <span className="btn-dash" aria-hidden="true" />
            </button>
            {formError ? (
              <p id={`${uid}-form-err`} className="t-small text-danger sm:col-span-3" role="alert">
                {formError}
              </p>
            ) : (
              <p id={`${uid}-hint`} className="t-small text-graphite-500 sm:col-span-3">
                {C.form.hint}
              </p>
            )}
          </form>
        ) : (
          <div className="flex flex-col gap-3 border border-hairline bg-white p-6 sm:p-8">
            <p className="t-eyebrow text-amber">{C.street.eyebrow}</p>
            <p className="t-h3 text-navy">{C.results.notLoaded}</p>
            <p className="t-body max-w-measure text-body">{C.results.notLoadedHelp}</p>
          </div>
        )}

        <div ref={resultsRef} tabIndex={-1} className="flex flex-col gap-14 outline-none" aria-live="polite" aria-busy={state.status === "loading"}>
          {state.status === "error" ? (
            <p className="t-body text-danger" role="alert">
              {C.results.error}
            </p>
          ) : null}

          {failed ? (
            <div className="flex flex-col gap-3 border-t border-hairline pt-6">
              <p className="t-h3 text-navy">
                {failed.error === "no-data" ? C.results.notLoaded : failed.error === "zip-required" ? C.form.needZip : failed.error === "number" ? C.form.needNumber : C.street.empty(months)}
              </p>
            </div>
          ) : null}

          {data ? (
            <>
              {/* 01 · The street. */}
              <div className="flex flex-col gap-6 border-t border-hairline pt-8">
                <SectionHeading title={C.street.title(months)} />
                {data.rows.length === 0 ? (
                  <div className="flex flex-col gap-3">
                    <p className="t-lead max-w-measure text-navy">{C.street.empty(months)}</p>
                    <p className="t-body max-w-measure text-body">{C.street.emptyHelp}</p>
                    <p className="t-note">{sourceLine}</p>
                  </div>
                ) : (
                  <>
                    {data.match !== "exact" ? (
                      <p className="t-small text-graphite-500">
                        {data.match === "fuzzy" ? C.street.fuzzyMatch : C.street.partialMatch} {data.streets.map(titleCase).join(", ")}
                      </p>
                    ) : null}
                    <p className="t-lead max-w-measure text-navy">
                      <span className="t-record">{C.street.line(data.summary.count, months, data.streets.map(titleCase))}</span>
                      {C.street.split(data.summary.homes, data.summary.lots)}
                      {data.summary.medianPricePerSqft ? C.street.perSqft(usd.format(data.summary.medianPricePerSqft), data.summary.sqftSampleSize) : C.street.noPerSqft}
                    </p>
                    <SalesTable rows={data.rows} rollChangedNote={C.street.rollChanged} />
                    <div className="flex flex-col gap-2">
                      {data.truncated ? <p className="t-small text-graphite-500">{C.street.truncated(data.rows.length, data.total)}</p> : null}
                      {data.rows.some(saleFlagged) ? <p className="t-small max-w-measure text-graphite-500">† {C.street.rollChanged}</p> : null}
                      <p className="t-note">{sourceLine}</p>
                      <p className="t-small max-w-measure text-graphite-500">{C.street.note}</p>
                    </div>
                    {/* Street Watch: the same button as Tide Street, for one street in one ZIP. */}
                    {data.streets.length === 1 && data.zips.length === 1 ? (
                      <WatchButton target={{ kind: "street", street: data.streets[0]!, zip: data.zips[0]!, label: `${titleCase(data.streets[0]!)} · ${data.zips[0]}` }} source="home-value" className="pt-2" />
                    ) : null}
                  </>
                )}
              </div>

              {/* 02 · The parcel. */}
              <div className="flex flex-col gap-6 border-t border-hairline pt-8">
                <SectionHeading title={C.parcel.title} />
                {!data.parcel ? (
                  <p className="t-body max-w-measure text-body">{C.parcel.noNumber}</p>
                ) : last ? (
                  <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
                    <div className="flex flex-col gap-4">
                      <p className="t-mono-sm text-graphite-500">{titleCase(last.address)} · {titleCase(last.city)} {last.zip}</p>
                      {data.parcel.parcels > 1 ? <p className="t-small text-amber">{C.parcel.units(data.parcel.parcels)}</p> : null}
                      <p className="t-lead max-w-measure text-navy">
                        {C.parcel.lastSale(fmtDate(last.saleDate))} <span className="t-record">{usd.format(last.salePrice)}</span>
                        {saleFlagged(last) ? <span title={C.parcel.dagger}> †</span> : null}
                      </p>
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-hairline pt-4 sm:grid-cols-3">
                        <Fact label={C.parcel.facts.livingArea} value={last.livingArea ? `${int.format(last.livingArea)} sq ft` : "—"} />
                        <Fact label={C.parcel.facts.yearBuilt} value={last.yearBuilt ? String(last.yearBuilt) : "—"} />
                        <Fact label={C.parcel.facts.type} value={typeLabel(last)} />
                      </dl>
                      {earlier.length ? (
                        <div className="flex flex-col gap-1.5 border-t border-hairline pt-4">
                          <p className="t-eyebrow text-graphite-500">{C.parcel.facts.earlier}</p>
                          <ul className="flex flex-col gap-1">
                            {earlier.map((r, i) => (
                              <li key={`${r.saleDate}-${i}`} className="t-body text-body tabular-nums">
                                {fmtDate(r.saleDate)} · {usd.format(r.salePrice)}
                                {r.livingArea ? ` · ${int.format(r.livingArea)} sq ft` : ""}
                                {saleFlagged(r) ? <span title={C.parcel.dagger}> †</span> : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {saleFlagged(last) || earlier.some(saleFlagged) ? <p className="t-small max-w-measure text-graphite-500">† {C.parcel.dagger}</p> : null}
                      <p className="t-small pt-2 text-graphite-500">
                        <RuleLink href={startSheetPath(last.salePrice, last.county)}>{C.parcel.startSheet}</RuleLink>
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 lg:pt-1">
                      <p className="t-body max-w-[440px] text-body">{C.parcel.rollNote}</p>
                      <p className="t-note">{sourceLine}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
                    <p className="t-lead max-w-measure text-navy">{C.parcel.none(shownAddress, months)}</p>
                    <div className="flex flex-col gap-3 lg:pt-1">
                      <p className="t-body max-w-[440px] text-body">{C.parcel.noneHelp}</p>
                      <p className="t-note">{sourceLine}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}

          {/* Similar homes sold nearby: evidence beside the house, never a number for it. */}
          {data?.parcel && last ? (
            <div className="flex flex-col gap-6 border-t border-hairline pt-8" data-similar="">
              <SectionHeading title={C.similar.title} />
              {data.similar && data.similar.rows.length ? (
                <>
                  <p className="t-body max-w-measure text-body">
                    {C.similar.criteria(typeLabel(last), int.format(data.similar.sizeFrom), int.format(data.similar.sizeTo), fmtDate(data.similar.since))}
                    {data.similar.basis.kind === "distance"
                      ? C.similar.basisDistance(C.similar.miles(data.similar.basis.miles))
                      : data.similar.basis.kind === "subdivision"
                        ? C.similar.basisSubdivision(data.similar.basis.name)
                        : C.similar.basisZip(data.similar.basis.zip)}{" "}
                    <span className="text-graphite-600">{data.similar.basis.kind === "distance" ? C.similar.count(data.similar.rows.length) : C.similar.countByDate(data.similar.rows.length)}</span>
                  </p>
                  <SalesTable rows={data.similar.rows} rollChangedNote={C.street.rollChanged} />
                  <div className="flex flex-col gap-2">
                    <p className="t-small max-w-measure text-graphite-500">{C.similar.note}</p>
                    <p className="t-note">{sourceLine}</p>
                  </div>
                </>
              ) : (
                <p className="t-body max-w-measure text-body">{C.similar.none}</p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* 03 · What the record can't tell you, rendered on the server. */}
      {children}

      {/* 04 · The ask. */}
      <section id="ask" className="border-t border-hairline bg-parchment">
        <div className="container-site grid scroll-mt-header gap-10 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <SectionHeading title={C.ask.title} />
            <p className="t-body max-w-[440px] text-body">{C.ask.body}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="border border-hairline bg-white p-6 sm:p-8">
              <LeadForm
                key={sent?.address ?? ""}
                form="valuation"
                fields={["name", "email", "phone", "address", "timing", "message"]}
                submitLabel={C.ask.submit}
                placeholderMessage={C.ask.placeholder}
                defaultAddress={sent?.address}
                defaultMessage={sent?.message || undefined}
                hidden={{ pageTitle: C.title }}
              />
            </div>
            <p className="t-small max-w-[560px] text-graphite-500">{C.ask.disclaimer}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="t-eyebrow text-graphite-500">{label}</dt>
      <dd className="t-body text-navy tabular-nums">{value}</dd>
    </div>
  );
}
