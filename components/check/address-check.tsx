"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { fmtDate, int, titleCase, usd } from "@/components/sales/format";
import { ExternalLink } from "@/components/ui/external-link";
import { WatchButton } from "@/components/watch/watch-button";
import { track } from "@/lib/analytics";
import type { CheckResult } from "@/lib/check/check";
import { CHECK_COPY as C } from "@/lib/check/copy";
import type { EvacGuidePiece, FloodGuidePiece } from "@/lib/check/guide";
import { isShadedX, parseAddress, type County, type EvacZone, type FloodZone } from "@/lib/check/parse";
import { useUrlInitial } from "@/lib/url-state";

type Ok = {
  ok: true;
  query: { display: string; number: string; zip: string };
  result: CheckResult;
  sale: { date: string; price: number } | null;
  saleWindowStart: string | null;
  salesThrough: string | null;
  guides: { flood: FloodGuidePiece | null; evacuation: EvacGuidePiece | null };
};
type Failed = { ok: false; error: "not-found" | "outside" | "unavailable" | "rate" | "number" | "street" | "zip" };
type State = { status: "idle" } | { status: "loading" } | { status: "done"; data: Ok } | { status: "failed"; error: Failed["error"] | "error" };

const fill = (t: string, vars: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");

/**
 * Atlas Check's lookup and its result. The address is never written to the
 * address bar (docs/SITE.md, "The tools and the address bar"); a link that
 * carries one (/check?address=&zip=, from search or an Atlas page) runs it
 * once on arrival. The result takes focus when it settles.
 */
export function AddressCheck() {
  // A link that carries an address (/check?address=&zip=) fills the form and runs it once, right after hydration.
  const { initial, key, fromUrl } = useUrlInitial((p) => {
    const address = p.get("address")?.slice(0, 120) ?? "";
    return address ? { address, zip: p.get("zip")?.slice(0, 10) ?? "" } : null;
  }, EMPTY);
  return <Check key={key} initial={initial} runOnArrival={fromUrl} />;
}

const EMPTY = { address: "", zip: "" };

function Check({ initial, runOnArrival }: { initial: { address: string; zip: string }; runOnArrival: boolean }) {
  const uid = useId();
  const [address, setAddress] = useState(initial.address);
  const [zip, setZip] = useState(initial.zip);
  const [formError, setFormError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: "idle" });
  const abort = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const run = useCallback(async (a: string, z: string) => {
    const parsed = parseAddress(a, z);
    if ("error" in parsed) {
      setFormError(C.form.errors[parsed.error]);
      return;
    }
    setFormError(null);
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setState({ status: "loading" });
    track("Explore", { action: "address-check" });
    try {
      const res = await fetch(`/api/check?${new URLSearchParams({ address: a.trim(), zip: z.trim() })}`, { signal: controller.signal });
      const data = (await res.json().catch(() => null)) as Ok | Failed | null;
      if (data && data.ok) setState({ status: "done", data });
      else setState({ status: "failed", error: data && "error" in data ? data.error : res.status === 429 ? "rate" : "error" });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setState({ status: "failed", error: "error" });
    }
  }, []);

  // Arrived with an address: run it once. Nothing is written back to the address bar.
  const arrival = useRef(runOnArrival ? initial : null);
  useEffect(() => {
    const a = arrival.current;
    arrival.current = null;
    if (a) void run(a.address, a.zip);
  }, [run]);

  useEffect(() => {
    if (state.status === "done" || state.status === "failed") resultsRef.current?.focus();
  }, [state.status]);
  useEffect(() => () => abort.current?.abort(), []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void run(address, zip);
  }

  const loading = state.status === "loading";

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={onSubmit} noValidate role="search" aria-label={C.form.label} className="grid gap-6 border border-hairline bg-white p-6 sm:grid-cols-[1.8fr_1fr_auto] sm:items-end sm:p-8">
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
            maxLength={120}
            required
            className="field-input"
            aria-invalid={formError && formError !== C.form.errors.zip ? true : undefined}
            aria-describedby={formError ? `${uid}-err` : `${uid}-hint`}
          />
        </div>
        <div className="field">
          <label htmlFor={`${uid}-zip`} className="field-label">
            {C.form.zip}
          </label>
          <input
            id={`${uid}-zip`}
            name="zip"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder={C.form.zipPlaceholder}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={10}
            className="field-input"
            aria-invalid={formError === C.form.errors.zip ? true : undefined}
            aria-describedby={formError ? `${uid}-err` : undefined}
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-navy">
          {loading ? C.form.checking : C.form.submit}
          <span className="btn-dash" aria-hidden="true" />
        </button>
        {formError ? (
          <p id={`${uid}-err`} className="t-small text-danger sm:col-span-3" role="alert">
            {formError}
          </p>
        ) : (
          <p id={`${uid}-hint`} className="t-small text-graphite-500 sm:col-span-3">
            {C.form.hint}
          </p>
        )}
      </form>

      <div ref={resultsRef} tabIndex={-1} className="outline-none" aria-live="polite" aria-busy={loading}>
        {state.status === "done" ? <Result data={state.data} /> : null}
        {state.status === "failed" ? <Failure error={state.error} onRetry={() => void run(address, zip)} /> : null}
      </div>
    </div>
  );
}

function Failure({ error, onRetry }: { error: Failed["error"] | "error"; onRetry: () => void }) {
  const R = C.results;
  const [heading, help, retry] =
    error === "not-found"
      ? [R.notFound, R.notFoundHelp, false]
      : error === "outside"
        ? [R.outside, R.outsideHelp, false]
        : error === "unavailable"
          ? [R.unavailable, R.unavailableHelp, true]
          : error === "rate"
            ? [R.rate, R.rateHelp, true]
            : error === "number" || error === "street" || error === "zip"
              ? [C.form.errors[error], "", false]
              : [R.error, R.errorHelp, true];
  return (
    <div className="flex max-w-measure flex-col gap-3 border border-hairline bg-white p-6 sm:p-8" data-check-error={error}>
      <h2 className="t-h3 text-navy">{heading}</h2>
      {help ? <p className="t-body text-body">{help}</p> : null}
      {retry ? (
        <button type="button" onClick={onRetry} className="btn btn-outline self-start">
          {R.retry}
        </button>
      ) : null}
    </div>
  );
}

/** One fact: its label, the value set large, a line or two under it, and where it came from. */
function Fact({ label, value, children, source }: { label: string; value: ReactNode; children?: ReactNode; source: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 bg-white p-6 sm:p-7">
      <dt className="t-mono-sm text-graphite-500">{label}</dt>
      <dd className="flex grow flex-col gap-4">
        <p className="t-h2 text-navy">{value}</p>
        {children ? <div className="flex flex-col gap-1.5 t-small text-body">{children}</div> : null}
        <p className="t-note mt-auto border-t border-hairline pt-3">{source}</p>
      </dd>
    </div>
  );
}

function SourceLine({ label, date, href, cta }: { label: string; date: string; href: string; cta: string }) {
  return (
    <>
      {label}, read {fmtDate(date)}.{" "}
      <ExternalLink href={href} className="text-harbor-700 underline decoration-hairline underline-offset-4 hover:text-navy hover:decoration-navy">
        {cta} ↗
      </ExternalLink>
    </>
  );
}

function Unanswered({ href, cta }: { href: string; cta: string }) {
  return (
    <p className="t-small text-body">
      {C.results.partial}{" "}
      <ExternalLink href={href} className="text-harbor-700 underline decoration-hairline underline-offset-4 hover:text-navy">
        {cta} ↗
      </ExternalLink>
    </p>
  );
}

const evacText = (county: County, z: EvacZone) => (z === "none" ? C.evacuation.none[county] : fill(C.evacuation.value[county], { z }));

function floodLines(z: FloodZone): string[] {
  const out: string[] = [z.sfha ? C.flood.sfha : C.flood.notSfha];
  if (isShadedX(z)) out.push(C.flood.shaded);
  if (z.bfe !== null) out.push(fill(C.flood.bfe, { ft: String(z.bfe), datum: z.datum ?? "NAVD88" }));
  return out;
}

function Result({ data }: { data: Ok }) {
  const r = data.result;
  const county = r.county;
  const E = C.evacuation;
  const F = C.flood;
  const R = C.roll;
  const street = r.parcel ? titleCase(r.parcel.street) : "";
  const evac = r.evacuation.status === "ok" ? r.evacuation.value : null;
  const flood = r.flood.status === "ok" ? r.flood.value : null;
  const fg = data.guides.flood;
  const eg = data.guides.evacuation;
  const valueHref = `/sell/home-value?${new URLSearchParams({ address: `${data.query.number} ${street || data.query.display.split(",")[0]!.replace(/^\d+\s+/, "")}`, zip: r.zip })}`;

  return (
    <article className="flex flex-col gap-10" aria-labelledby="check-result-title" data-check-located={r.located}>
      <header className="flex flex-col gap-2">
        <h2 id="check-result-title" className="t-h2 text-navy">
          {titleCase(r.address)}
        </h2>
        <p className="t-note">
          {[r.city ? titleCase(r.city) : null, `FL ${r.zip}`, C.results.county[county]].filter(Boolean).join(" · ")}
          {r.located === "parcel" ? ` · ${C.results.onRoll}` : null}
        </p>
        {r.located === "geocoder" ? <p className="t-small max-w-measure text-body">{C.results.geocoded}</p> : null}
        {r.units > 1 ? <p className="t-small max-w-measure text-body">{fill(C.results.units, { n: String(r.units) })}</p> : null}
      </header>

      <dl className="grid gap-px border border-hairline bg-hairline md:grid-cols-3" data-check-facts>
        <Fact
          label={E.label[county]}
          value={evac ? evacText(county, evac.zone) : "—"}
          source={<SourceLine label={E.source[county]} date={r.checked} href={r.sources.evacuation.page} cta={E.page} />}
        >
          {evac?.others.length ? <p>{fill(evac.zone === "none" ? E.outsideOthers[county] : E.others[county], { z: evac.others.join(", ") })}</p> : null}
          {!evac ? <Unanswered href={r.sources.evacuation.page} cta={E.page} /> : null}
        </Fact>
        <Fact
          label={F.label}
          value={flood ? fill(F.value, { z: flood.zone.zone }) : r.flood.status === "ok" ? F.none : "—"}
          source={<SourceLine label={F.source} date={r.checked} href={r.sources.flood.page} cta={F.page} />}
        >
          {flood ? floodLines(flood.zone).map((l) => <p key={l}>{l}</p>) : null}
          {flood?.others.length ? <p>{fill(F.others, { z: flood.others.map((o) => o.zone).join(", ") })}</p> : null}
          {flood?.panel ? <p>{fill(F.panel, { id: flood.panel.id, date: flood.panel.effective ? fmtDate(flood.panel.effective) : "—" })}</p> : null}
          {r.flood.status === "ok" && !flood ? <p>{F.noneHelp}</p> : null}
          {r.flood.status === "error" ? <Unanswered href={r.sources.flood.page} cta={F.page} /> : null}
        </Fact>
        <Fact
          label={R.label}
          value={r.roll?.yearBuilt ? fill(R.built, { year: String(r.roll.yearBuilt) }) : r.roll?.livingArea ? `${int.format(r.roll.livingArea)} sq ft` : r.roll ? R.blank : "—"}
          source={
            r.sources.roll ? (
              <SourceLine label={R.source[county]} date={r.checked} href={r.sources.roll.page} cta={R.page} />
            ) : (
              <>{R.source[county]}</>
            )
          }
        >
          {r.roll ? (
            <dl className="flex flex-col">
              {(
                [
                  [R.livingArea, r.roll.livingArea ? `${int.format(r.roll.livingArea)} sq ft` : R.blank],
                  [R.lot, r.roll.lotSqft ? `${int.format(r.roll.lotSqft)} sq ft` : R.blank],
                  ...(r.roll.use ? [[R.use, r.roll.use] as const] : []),
                  [R.lastSale, data.sale ? `${usd.format(data.sale.price)}, ${fmtDate(data.sale.date)}` : data.saleWindowStart ? fill(R.noSale, { date: fmtDate(data.saleWindowStart) }) : R.noSaleUndated],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 border-b border-hairline py-1.5 last:border-b-0">
                  <dt className="text-graphite-500">{k}</dt>
                  <dd className="text-right text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>{r.units > 1 ? R.unitsHidden : R.notOnRoll}</p>
          )}
          {data.salesThrough ? <p className="t-note pt-1">{fill(R.salesSource, { date: fmtDate(data.salesThrough) })}</p> : null}
        </Fact>
      </dl>

      {fg || eg ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {fg ? (
            <section className="flex flex-col gap-4 border-t border-hairline pt-6" aria-labelledby="check-flood-guide">
              <h3 id="check-flood-guide" className="t-h3 text-navy">
                {flood && fg.card ? fill(C.guide.floodHeading, { z: flood.zone.zone }) : C.guide.floodNoCard}
              </h3>
              {fg.card ? (
                <>
                  <p className="t-body max-w-measure text-body">
                    <span className="text-navy">{fg.card.name}.</span> {fg.card.means}
                  </p>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <dt className="t-small font-semibold text-navy">{fg.card.labels.lender}</dt>
                      <dd className="t-small text-body">{fg.card.lender}</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="t-small font-semibold text-navy">{fg.card.labels.build}</dt>
                      <dd className="t-small text-body">{fg.card.build}</dd>
                    </div>
                  </dl>
                </>
              ) : null}
              {fg.note ? <p className="t-small max-w-measure text-body">{fg.note}</p> : null}
              <Link href={fg.url as Route} className="link-rule self-start">
                {C.guide.read}
              </Link>
            </section>
          ) : null}
          {eg ? (
            <section className="flex flex-col gap-4 border-t border-hairline pt-6" aria-labelledby="check-evac-guide">
              <h3 id="check-evac-guide" className="t-h3 text-navy">
                {C.guide.evacHeading}
              </h3>
              {eg.lead ? <p className="t-body max-w-measure text-body">{eg.lead}</p> : null}
              <Link href={eg.url as Route} className="link-rule self-start">
                {C.guide.read}
              </Link>
            </section>
          ) : null}
        </div>
      ) : null}

      <section className="flex flex-col gap-3 border-l-2 border-sky-700 pl-5" aria-labelledby="check-verify">
        <h3 id="check-verify" className="t-h4 text-navy">
          {C.verify.heading}
        </h3>
        <p className="t-small max-w-measure text-body">{fill(C.verify.body, { date: fmtDate(r.checked) })}</p>
      </section>

      <section className="flex flex-col gap-5 border-t border-hairline pt-8" aria-labelledby="check-next">
        <h3 id="check-next" className="t-h3 text-navy">
          {C.next.heading}
        </h3>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href={valueHref as Route} className="btn btn-navy">
            {C.next.value}
            <span className="btn-dash" aria-hidden="true" />
          </Link>
          {r.parcel ? (
            <Link href={`/sell/sold?${new URLSearchParams({ street: r.parcel.street, zip: r.parcel.zip })}` as Route} className="link-rule">
              {fill(C.next.sold, { street })}
            </Link>
          ) : null}
          <Link href={"/contact" as Route} className="link-rule">
            {C.next.ask}
          </Link>
        </div>
        {r.parcel ? <WatchButton target={{ kind: "street", street: r.parcel.street, zip: r.parcel.zip, label: street }} source="atlas-check" /> : null}
      </section>
    </article>
  );
}
