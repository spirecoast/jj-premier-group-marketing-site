"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { track } from "@/lib/analytics";
import { SOLD_COPY as C } from "./copy";
import { SalesTable, saleFlagged, titleCase, usd, type SaleRow as Row, type SalesSummary as Summary } from "./sales-table";

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

              <SalesTable rows={data.rows} />

              <div className="flex flex-col gap-2">
                {data.truncated ? <p className="t-small text-graphite-500">{C.results.truncated(data.rows.length, data.total, Boolean(data.query.zip))}</p> : null}
                {data.rows.some(saleFlagged) ? <p className="t-small max-w-measure text-graphite-500">† {C.results.rollChanged}</p> : null}
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
