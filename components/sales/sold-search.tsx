"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { SOLD_COPY as C } from "./copy";

/** One row as /api/sales returns it: the property and the sale, never a name. */
type Row = {
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
  rollChanged: boolean;
};

type Summary = {
  count: number;
  homes: number;
  lots: number;
  medianPricePerSqft: number | null;
  sqftSampleSize: number;
  medianPrice: number | null;
  from: string | null;
  to: string | null;
};

type Api =
  | {
      ok: true;
      query: { street: string; zip: string | null; city: string | null };
      match: "exact" | "partial" | "fuzzy" | "none";
      streets: string[];
      zips: string[];
      total: number;
      rows: Row[];
      summary: Summary;
      truncated: boolean;
      source: { asOf: string; counties: string[] } | null;
    }
  | { ok: false; error: "zip-required"; streets: string[]; zips: string[]; total: number }
  | { ok: false; error: "no-data" | "street" | "zip" };

type Props = {
  /** False when data/sales has not been ingested; the page says so instead of searching. */
  loaded: boolean;
  /** ISO date from the manifest; the source line on the page. */
  asOf: string | null;
  counties: string[];
  /** manifest.windowMonths: the "last N months" every line on the page refers to. */
  months: number;
};

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const int = new Intl.NumberFormat("en-US");
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

/** "LILAC SKY DR" → "Lilac Sky Dr"; ordinals and directionals keep their case. */
function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (/^(n|s|e|w|ne|nw|se|sw)$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function SoldSearch({ loaded, asOf, counties, months }: Props) {
  const uid = useId();
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; data?: Api; searched?: string }>({ status: "idle" });
  // The ask form's address is a snapshot of the last completed search, so typing in the search box never remounts it.
  const [sent, setSent] = useState<{ street: string; zip: string } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  async function run(s: string, z: string) {
    const streetValue = s.trim().slice(0, 80);
    const zipValue = z.trim().slice(0, 40);
    if (streetValue.length < 2) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setState({ status: "loading", searched: streetValue });
    track("Explore", { action: "sold-search" });
    const params = new URLSearchParams({ street: streetValue });
    if (/^\d{5}$/.test(zipValue)) params.set("zip", zipValue);
    else if (zipValue) params.set("city", zipValue);
    try {
      const res = await fetch(`/api/sales?${params}`, { signal: controller.signal });
      const data = (await res.json()) as Api;
      setState({ status: data.ok || res.status === 400 ? "done" : "error", data, searched: streetValue });
      if (data.ok || res.status === 400) setSent({ street: streetValue, zip: zipValue });
      const url = new URL(window.location.href);
      url.searchParams.set("street", streetValue);
      if (zipValue) url.searchParams.set("zip", zipValue);
      else url.searchParams.delete("zip");
      window.history.replaceState(null, "", url);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setState({ status: "error", searched: streetValue });
    }
  }

  // A shared link carries the street in the URL; run it once on load.
  useEffect(() => {
    if (!loaded) return;
    const p = new URLSearchParams(window.location.search);
    const s = p.get("street") ?? "";
    const z = p.get("zip") ?? "";
    if (s) {
      setStreet(s);
      setZip(z);
      void run(s, z);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    if (state.status === "done" || state.status === "error") resultsRef.current?.focus();
  }, [state.status]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void run(street, zip);
  }

  const data = state.status === "done" && state.data?.ok ? state.data : null;
  const failed = state.status === "done" && state.data && !state.data.ok ? state.data : null;
  const sourceLine = C.results.source(counties.length ? counties.join(" / ") : C.results.sourceDefault, asOf ?? "—");
  const askAddress = sent ? [sent.street, sent.zip].filter(Boolean).join(", ") : "";
  const flagged = (r: Row) => r.rollChanged || r.propertyUse === "vacant";

  return (
    <>
      {/* The search. */}
      <section className="container-site flex flex-col gap-8 pb-section">
        {loaded ? (
          <form onSubmit={onSubmit} className="grid gap-6 border border-hairline bg-white p-6 sm:grid-cols-[1.6fr_1fr_auto] sm:items-end sm:p-8" role="search" aria-label={C.title}>
            <div className="field">
              <label htmlFor={`${uid}-street`} className="field-label">
                {C.form.street}
              </label>
              <input
                id={`${uid}-street`}
                name="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder={C.form.streetPlaceholder}
                autoComplete="address-line1"
                maxLength={80}
                required
                minLength={2}
                className="field-input"
              />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-zip`} className="field-label">
                {C.form.zip} <span className="normal-case tracking-normal opacity-70">(optional)</span>
              </label>
              <input id={`${uid}-zip`} name="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder={C.form.zipPlaceholder} autoComplete="postal-code" maxLength={40} className="field-input" />
            </div>
            <button type="submit" disabled={state.status === "loading"} className="btn btn-navy">
              {state.status === "loading" ? C.form.searching : C.form.submit}
              <span className="btn-dash" aria-hidden="true" />
            </button>
            <p className="t-small text-graphite-500 sm:col-span-3">{C.form.hint}</p>
          </form>
        ) : (
          <div className="flex flex-col gap-3 border border-hairline bg-white p-6 sm:p-8">
            <p className="t-eyebrow text-amber">{C.results.eyebrow}</p>
            <p className="t-h3 text-navy">{C.results.notLoaded}</p>
            <p className="t-body max-w-measure text-body">{C.results.notLoadedHelp}</p>
          </div>
        )}

        <div ref={resultsRef} tabIndex={-1} className="outline-none" aria-live="polite" aria-busy={state.status === "loading"}>
          {state.status === "error" ? (
            <p className="t-body text-danger" role="alert">
              {C.results.error}
            </p>
          ) : null}

          {failed ? (
            <div className="flex flex-col gap-3 border-t border-hairline pt-6">
              <p className="t-h3 text-navy">
                {failed.error === "no-data"
                  ? C.results.notLoaded
                  : failed.error === "zip-required"
                    ? C.results.zipRequired(failed.streets.map(titleCase), failed.zips)
                    : C.results.empty(months)}
              </p>
            </div>
          ) : null}

          {data && data.rows.length === 0 ? (
            <div className="flex flex-col gap-3 border-t border-hairline pt-6">
              <p className="t-h3 text-navy">{C.results.empty(months)}</p>
              <p className="t-body max-w-measure text-body">{C.results.emptyHelp}</p>
              <p className="t-mono-sm text-graphite-500">{sourceLine}</p>
            </div>
          ) : null}

          {data && data.rows.length > 0 ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3.5 border-t border-hairline pt-6">
                <p className="t-eyebrow text-amber">{C.results.eyebrow}</p>
                {data.match !== "exact" ? (
                  <p className="t-small text-graphite-500">
                    {data.match === "fuzzy" ? C.results.fuzzyMatch : C.results.partialMatch} {data.streets.map(titleCase).join(", ")}
                  </p>
                ) : null}
                <p className="t-lead max-w-measure text-navy">
                  <span className="t-record">{C.summary.line(data.summary.count, months, data.streets.map(titleCase))}</span>
                  {C.summary.split(data.summary.homes, data.summary.lots)}
                  {data.summary.medianPricePerSqft ? C.summary.perSqft(usd.format(data.summary.medianPricePerSqft), data.summary.sqftSampleSize) : C.summary.noPerSqft}
                </p>
              </div>

              {/* Phones: a stacked list. From md up: the table. */}
              <ul className="flex flex-col divide-y divide-hairline border-y border-hairline md:hidden">
                {data.rows.map((r, i) => {
                  const changed = flagged(r);
                  return (
                    <li key={`${r.address}-${r.saleDate}-${i}`} className="flex flex-col gap-1.5 py-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="t-body text-navy">{titleCase(r.address)}</span>
                        <span className="t-record shrink-0 text-navy">{usd.format(r.salePrice)}</span>
                      </div>
                      <span className="t-mono-sm text-graphite-500">
                        {fmtDate(r.saleDate)} · {titleCase(r.city)} {r.zip}
                        {changed ? <span title={C.results.rollChanged}> ·&nbsp;†</span> : null}
                      </span>
                      <span className="t-small text-body">
                        {[
                          r.livingArea ? `${int.format(r.livingArea)} sq ft` : null,
                          r.pricePerSqft ? `${usd.format(r.pricePerSqft)}/sq ft` : null,
                          r.yearBuilt ? `built ${r.yearBuilt}` : null,
                          C.results.typeLabel[r.propertyUse] ?? C.results.typeLabel.other,
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
                    {data.rows.map((r, i) => {
                      const changed = flagged(r);
                      return (
                        <tr key={`${r.address}-${r.saleDate}-${i}`} className="border-b border-hairline align-baseline">
                          <td className="py-3 pr-4">
                            <span className="t-body text-navy">{titleCase(r.address)}</span>
                            <span className="block t-mono-sm text-graphite-500">
                              {titleCase(r.city)} {r.zip}
                              {changed ? <span title={C.results.rollChanged}> ·&nbsp;†</span> : null}
                            </span>
                          </td>
                          <Td className="whitespace-nowrap">{fmtDate(r.saleDate)}</Td>
                          <Td align="right" className="t-record text-navy">
                            {usd.format(r.salePrice)}
                          </Td>
                          <Td align="right">{r.livingArea ? int.format(r.livingArea) : "—"}</Td>
                          <Td align="right">{r.pricePerSqft ? usd.format(r.pricePerSqft) : "—"}</Td>
                          <Td align="right">{r.yearBuilt ?? "—"}</Td>
                          <Td>{C.results.typeLabel[r.propertyUse] ?? C.results.typeLabel.other}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2">
                {data.truncated ? <p className="t-small text-graphite-500">{C.results.truncated(data.rows.length, data.total, Boolean(data.query.zip))}</p> : null}
                {data.rows.some(flagged) ? <p className="t-small max-w-measure text-graphite-500">† {C.results.rollChanged}</p> : null}
                <p className="t-mono-sm text-graphite-500">{sourceLine}</p>
                <p className="t-small max-w-measure text-graphite-500">{C.results.note}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* The ask. */}
      <section id="ask" className="border-t border-hairline bg-parchment">
        <div className="container-site grid scroll-mt-header gap-10 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <SectionHeading eyebrow={C.ask.eyebrow} title={C.ask.title} />
            <p className="t-body max-w-[440px] text-body">{C.ask.body}</p>
          </div>
          <div className="border border-hairline bg-white p-6 sm:p-8">
            <LeadForm
              key={askAddress}
              form="sell"
              fields={["name", "email", "phone", "address", "timing", "message"]}
              submitLabel={C.ask.submit}
              placeholderMessage={C.ask.placeholder}
              defaultAddress={askAddress ? titleCase(askAddress) : undefined}
              hidden={{ pageTitle: C.title }}
            />
          </div>
        </div>
      </section>
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
