"use client";

import { useId, useState, type FormEvent } from "react";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { ShareButton } from "@/components/share-button";
import { SOLD_COPY as C } from "./copy";
import { SalesTable, fmtDate, saleFlagged, titleCase, usd, type SaleRow as Row, type SalesSummary as Summary } from "./sales-table";
import { useSalesLookup } from "./use-sales-lookup";
import "./street.css";

/** The search as /api/sales takes it: the street, and a five-digit ZIP or else a city. Null when the street is too short to search. */
function toQuery(s: string, z: string): { query: URLSearchParams; searched: { street: string; zip: string } } | null {
  const street = s.trim().slice(0, 80);
  const zip = z.trim().slice(0, 40);
  if (street.length < 2) return null;
  const query = new URLSearchParams({ street });
  if (/^\d{5}$/.test(zip)) query.set("zip", zip);
  else if (zip) query.set("city", zip);
  return { query, searched: { street, zip } };
}

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

export function SoldSearch({ loaded, asOf, counties, months }: Props) {
  const uid = useId();
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  // The ask form's address is a snapshot of the last completed search, so typing in the search box never remounts it.
  const [sent, setSent] = useState<{ street: string; zip: string } | null>(null);
  const { state, run: lookup, resultsRef } = useSalesLookup<Api, { street: string; zip: string }>({
    action: "sold-search",
    // A link that carries a street (/sell/sold?street=…&zip=…) runs it on arrival.
    fromLink: (p) => {
      if (!loaded) return null;
      const s = (p.get("street") ?? "").trim();
      if (s.length < 2) return null;
      const z = p.get("zip") ?? "";
      setStreet(s);
      setZip(z);
      return toQuery(s, z);
    },
    onAsk: (_data, searched) => setSent(searched),
  });

  function run(s: string, z: string) {
    const q = toQuery(s, z);
    if (q) void lookup(q.query, q.searched);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(street, zip);
  }

  const data = state.status === "done" && state.data?.ok ? state.data : null;
  // The street goes into a link only when the visitor shares it, never into the address bar.
  const shareUrl = state.searched ? `/sell/sold?${new URLSearchParams(state.searched.zip ? { street: state.searched.street, zip: state.searched.zip } : { street: state.searched.street })}` : undefined;
  const failed = state.status === "done" && state.data && !state.data.ok ? state.data : null;
  const sourceLine = C.results.source(counties.length ? counties.join(" / ") : C.results.sourceDefault, asOf ?? "—");
  const askAddress = sent ? [sent.street, sent.zip].filter(Boolean).join(", ") : "";

  return (
    <>
      {/* The search. */}
      <section className="container-site flex flex-col gap-8 pb-section">
        {loaded ? (
          <form onSubmit={onSubmit} className="street-search" role="search" aria-label={C.title}>
            <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_auto] lg:items-stretch">
              {/* The street as a street-name sign: a plate with a white keyline, the name set large on it. */}
              <label htmlFor={`${uid}-street`} className="street-sign">
                <span className="street-sign-label">{C.form.street}</span>
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
                  className="street-sign-input"
                />
              </label>
              <label htmlFor={`${uid}-zip`} className="street-sign street-sign-sm">
                <span className="street-sign-label">
                  {C.form.zip} <span>(optional)</span>
                </span>
                <input id={`${uid}-zip`} name="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder={C.form.zipPlaceholder} autoComplete="postal-code" maxLength={40} className="street-sign-input" />
              </label>
              <button type="submit" disabled={state.status === "loading"} className="btn btn-linen min-h-14 self-stretch lg:min-w-[200px]">
                {state.status === "loading" ? C.form.searching : C.form.submit}
                <span className="btn-dash" aria-hidden="true" />
              </button>
            </div>
            <p className="relative t-small text-linen-200/80">
              {C.form.hint}{" "}
              <a href="/sell/home-value" className="text-tide underline underline-offset-4 hover:text-white">
                {C.homeValueLink}
              </a>
            </p>
            <span className="street-search-road" aria-hidden="true" />
          </form>
        ) : (
          <div className="flex flex-col gap-3 border border-hairline bg-white p-6 sm:p-8">
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
              <p className="t-note">{sourceLine}</p>
            </div>
          ) : null}

          {data && data.rows.length > 0 ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3.5 border-t border-hairline pt-6">
                {data.match !== "exact" ? (
                  <p className="t-small text-graphite-500">
                    {data.match === "fuzzy" ? C.results.fuzzyMatch : C.results.partialMatch} {data.streets.map(titleCase).join(", ")}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <h2 className="street-sign street-sign-title self-start">
                    <span className="street-sign-input">{C.summary.heading(data.streets.map(titleCase))}</span>
                  </h2>
                  <ShareButton title={C.title} url={shareUrl} what="sold-street" label={C.share} />
                </div>
                <dl className="grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label={C.summary.sales} value={String(data.summary.count)} note={C.summary.salesNote(data.summary.homes, data.summary.lots, months)} />
                  <Stat label={C.summary.medianPrice} value={data.summary.medianPrice ? usd.format(data.summary.medianPrice) : "—"} />
                  <Stat
                    label={C.summary.perSqft}
                    value={data.summary.medianPricePerSqft ? usd.format(data.summary.medianPricePerSqft) : "—"}
                    note={data.summary.medianPricePerSqft ? C.summary.perSqftNote(data.summary.sqftSampleSize) : C.summary.perSqftNone}
                  />
                  <Stat label={C.summary.range} value={data.summary.from && data.summary.to ? `${fmtDate(data.summary.from)} – ${fmtDate(data.summary.to)}` : "—"} small />
                </dl>
              </div>

              <SalesTable rows={data.rows} />

              <div className="flex flex-col gap-2">
                {data.truncated ? <p className="t-small text-graphite-500">{C.results.truncated(data.rows.length, data.total, Boolean(data.query.zip))}</p> : null}
                {data.rows.some((r) => r.propertyUse === "vacant") ? <p className="t-small max-w-measure text-graphite-500">{C.results.newBuildNote}</p> : null}
                {data.rows.some(saleFlagged) ? <p className="t-small max-w-measure text-graphite-500">† {C.results.rollChanged}</p> : null}
                <p className="t-note">{sourceLine}</p>
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
            <SectionHeading title={C.ask.title} />
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

function Stat({ label, value, note, small }: { label: string; value: string; note?: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 bg-white p-5 sm:p-6">
      <dt className="t-small text-graphite-500">{label}</dt>
      <dd className={small ? "font-display text-[1.375rem] font-light leading-tight text-navy" : "font-display text-[2.25rem] font-light leading-none text-navy tabular-nums"}>{value}</dd>
      {note ? <dd className="t-small text-graphite-500">{note}</dd> : null}
    </div>
  );
}
