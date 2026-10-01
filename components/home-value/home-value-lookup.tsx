"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { LeadForm } from "@/components/lead-form";
import { SalesTable, fmtDate, int, saleFlagged, titleCase, typeLabel, usd, type SaleRow, type SalesSummary } from "@/components/sales/sales-table";
import { SectionHeading } from "@/components/section-heading";
import { track } from "@/lib/analytics";
import { parseHouseNumber } from "@/lib/sales/parcel";
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
  /** The static "what the record can't tell you" section, rendered on the server, placed between the record and the ask. */
  children?: ReactNode;
};

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

export function HomeValueLookup({ loaded, asOf, counties, months, children }: Props) {
  const uid = useId();
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<{ status: "idle" | "loading" | "done" | "error"; data?: Api; searched?: { address: string; zip: string } }>({ status: "idle" });
  // The ask form's address and message are a snapshot of the last completed lookup, so typing never remounts the form.
  const [sent, setSent] = useState<{ address: string; message: string } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  async function run(a: string, z: string) {
    const addressValue = a.trim().replace(/\s+/g, " ").slice(0, 90);
    const zipValue = z.trim().slice(0, 5);
    const { number, street } = parseHouseNumber(addressValue);
    if (!number) return setFormError(C.form.needNumber);
    if (street.length < 2) return setFormError(C.form.needStreet);
    if (!/^\d{5}$/.test(zipValue)) return setFormError(C.form.needZip);
    setFormError(null);
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const searched = { address: addressValue, zip: zipValue };
    setState({ status: "loading", searched });
    track("Explore", { action: "home-value" });
    const params = new URLSearchParams({ street, zip: zipValue, number });
    try {
      const res = await fetch(`/api/sales?${params}`, { signal: controller.signal });
      const data = (await res.json()) as Api;
      // 400s and the 503 "not loaded" answer are states the page explains; anything else is an error.
      const settled = data.ok || res.status === 400 || res.status === 503;
      setState({ status: settled ? "done" : "error", data, searched });
      if (data.ok || res.status === 400) {
        const shown = displayAddress(addressValue, zipValue);
        const lines = [C.ask.messageIntro(shown)];
        if (data.ok) {
          lines.push(streetLine(data, months));
          const last = data.parcel?.rows[0];
          lines.push(last ? C.ask.messageParcel(fmtDate(last.saleDate), usd.format(last.salePrice), last.livingArea ? int.format(last.livingArea) : null, last.yearBuilt) : C.ask.messageNoParcel);
        }
        setSent({ address: shown, message: lines.join("\n") });
      }
      const url = new URL(window.location.href);
      url.searchParams.set("address", addressValue);
      url.searchParams.set("zip", zipValue);
      window.history.replaceState(null, "", url);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setState({ status: "error", searched });
    }
  }

  // A shared link carries the address in the URL; run it once on load.
  useEffect(() => {
    if (!loaded) return;
    const p = new URLSearchParams(window.location.search);
    const a = p.get("address") ?? "";
    const z = p.get("zip") ?? "";
    if (a) {
      setAddress(a);
      setZip(z);
      void run(a, z);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    if (state.status === "done" || state.status === "error") resultsRef.current?.focus();
  }, [state.status]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void run(address, zip);
  }

  const data = state.status === "done" && state.data?.ok ? state.data : null;
  const failed = state.status === "done" && state.data && !state.data.ok ? state.data : null;
  const sourceLine = C.source(counties.length ? counties.join(" and ") : C.sourceDefault, asOf ?? "—");
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
                <SectionHeading eyebrow={C.street.eyebrow} title={C.street.title(months)} />
                {data.rows.length === 0 ? (
                  <div className="flex flex-col gap-3">
                    <p className="t-lead max-w-measure text-navy">{C.street.empty(months)}</p>
                    <p className="t-body max-w-measure text-body">{C.street.emptyHelp}</p>
                    <p className="t-mono-sm text-graphite-500">{sourceLine}</p>
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
                      <p className="t-mono-sm text-graphite-500">{sourceLine}</p>
                      <p className="t-small max-w-measure text-graphite-500">{C.street.note}</p>
                    </div>
                  </>
                )}
              </div>

              {/* 02 · The parcel. */}
              <div className="flex flex-col gap-6 border-t border-hairline pt-8">
                <SectionHeading eyebrow={C.parcel.eyebrow} title={C.parcel.title} />
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
                    </div>
                    <div className="flex flex-col gap-3 lg:pt-1">
                      <p className="t-body max-w-[440px] text-body">{C.parcel.rollNote}</p>
                      <p className="t-mono-sm text-graphite-500">{sourceLine}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
                    <p className="t-lead max-w-measure text-navy">{C.parcel.none(shownAddress, months)}</p>
                    <div className="flex flex-col gap-3 lg:pt-1">
                      <p className="t-body max-w-[440px] text-body">{C.parcel.noneHelp}</p>
                      <p className="t-mono-sm text-graphite-500">{sourceLine}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* 03 · What the record can't tell you, rendered on the server. */}
      {children}

      {/* 04 · The ask. */}
      <section id="ask" className="border-t border-hairline bg-parchment">
        <div className="container-site grid scroll-mt-header gap-10 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <SectionHeading eyebrow={C.ask.eyebrow} title={C.ask.title} />
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
                defaultMessage={sent?.message}
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
