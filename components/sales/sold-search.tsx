"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { RuleLink } from "@/components/ui/button";
import { startSheetPath } from "@/lib/net-proceeds-url";
import { SectionHeading } from "@/components/section-heading";
import { ShareButton } from "@/components/share-button";
import { parseHouseNumber } from "@/lib/sales/parcel";
import { pushRecent, readRecent, recentEntry, writeRecent, type RecentSearch } from "@/lib/sales/recent";
import { groupSummary, inSizeBand, isResale, sizeBand } from "@/lib/sales/stats";
import { SOLD_COPY as C } from "./copy";
import { SalesTable, fmtDate, int, saleFlagged, titleCase, typeLabel, usd, type SaleRow as Row, type SalesSummary as Summary } from "./sales-table";
import { SalesTimeline } from "./sales-timeline";
import { useRoving } from "./use-roving";
import { useSalesLookup } from "./use-sales-lookup";
import { useTween } from "./use-tween";
import "./street.css";

/**
 * Tide Street: the search as a street-name sign, then the street's sales as
 * a seller reads them. A house number typed into the sign is honoured (the
 * parcel's last sale as a card above the street); an ambiguous name offers
 * each spelling and ZIP as a chip; a typed city resolves to the ZIPs the
 * county files it in; a place name offers "Sales in {place}". The result
 * keeps resales apart from new builds and lots (the median follows a toggle,
 * never a blend), draws every sale on a timeline, and keeps the whole table
 * behind a disclosure, 25 rows at a time. Nothing typed goes into the
 * address bar; the last five streets stay in this browser only.
 */

type Searched = { street: string; zip: string; place?: string };

type Through = { county: "manatee" | "sarasota"; label: string; to: string | null };

type Place = { slug: string; name: string; zips: string[] };

/** The search as /api/sales takes it: the street (a house number split off and sent apart), and a five-digit ZIP or else a city. Null when the street is too short to search. */
function toQuery(s: string, z: string): { query: URLSearchParams; searched: Searched } | null {
  const typed = s.trim().replace(/\s+/g, " ").slice(0, 80);
  const zip = z.trim().slice(0, 40);
  const { number, street } = parseHouseNumber(typed);
  if (street.length < 2) return null;
  const query = new URLSearchParams({ street });
  if (number) query.set("number", number);
  if (/^\d{5}$/.test(zip)) query.set("zip", zip);
  else if (zip) query.set("city", zip);
  return { query, searched: { street: typed, zip } };
}

type Ok = {
  ok: true;
  query: { street: string | null; zip: string | null; city: string | null; number: string | null; place?: string };
  match: "exact" | "partial" | "fuzzy" | "none" | "area";
  streets: string[];
  zips: string[];
  total: number;
  rows: Row[];
  summary: Summary;
  truncated: boolean;
  parcel?: { number: string; unit: string | null; parcels: number; rows: Row[] };
  place?: Place;
  source: { asOf: string; windowStart: string; counties: string[]; through: Through[] } | null;
};
type Api = Ok | { ok: false; error: "zip-required"; streets: string[]; zips: string[]; options: { street: string; zip: string; count: number }[]; total: number; place?: Place } | { ok: false; error: "no-data" | "street" | "zip" | "number" | "place" };

type Props = {
  /** False when data/sales has not been ingested; the page says so instead of searching. */
  loaded: boolean;
  /** ISO date from the manifest; the as-of fallback for the source line. */
  asOf: string | null;
  counties: string[];
  /** manifest.windowMonths: the "last N months" every line on the page refers to. */
  months: number;
  /** The first day of the window, for the timeline's left edge. */
  windowStart: string | null;
  /** How far each county's file reaches. */
  through: Through[];
};

/** The county the street's sales are in, when they are all in one; a hand-off carries it to the Sale Calculator. */
function streetCounty(rows: Row[]): Row["county"] | null {
  const first = rows[0]?.county ?? null;
  return first && rows.every((r) => r.county === first) ? first : null;
}

type Group = "resales" | "newer" | "like";

const PAGE = 25;
const COUNTY_NAME: Record<Through["county"], string> = { manatee: "Manatee", sarasota: "Sarasota" };

/** "Manatee records through Sep 24, 2026 · Sarasota through Oct 20, 2026", for the counties in the result (or all of them). */
function throughLine(through: Through[], counties: Set<string> | null, asOf: string | null): string {
  const list = through.filter((t) => t.to && (!counties || counties.has(t.county)));
  if (!list.length) return asOf ? `as of ${fmtDate(asOf)}` : "";
  return list.map((t, i) => (i === 0 ? C.results.through(COUNTY_NAME[t.county], fmtDate(t.to!)) : C.results.throughShort(COUNTY_NAME[t.county], fmtDate(t.to!)))).join(" · ");
}

export function SoldSearch({ loaded, asOf, counties, months, windowStart, through }: Props) {
  const uid = useId();
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  // The ask form's address is a snapshot of the last completed search, so typing in the search box never remounts it.
  const [sent, setSent] = useState<{ street: string; zip: string } | null>(null);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [focusRow, setFocusRow] = useState<number | null>(null);
  // Open on a desktop, closed on a phone; the result (and so the disclosure) only renders after a search, so this never hydrates against server markup.
  const [tableOpen, setTableOpen] = useState(() => {
    try {
      return typeof window === "undefined" ? true : !window.matchMedia("(max-width: 47.99rem)").matches;
    } catch {
      return true;
    }
  });
  const [optionIndex, setOptionIndex] = useState(0);
  const { state, run: lookup, resultsRef } = useSalesLookup<Api, Searched>({
    action: "sold-search",
    // A link that carries a street (/sell/sold?street=…&zip=…) runs it on arrival; a ZIP alone is set in the sign.
    fromLink: (p) => {
      if (!loaded) return null;
      const s = (p.get("street") ?? "").trim();
      const z = p.get("zip") ?? "";
      if (z) setZip(z);
      if (s.length < 2) return null;
      setStreet(s);
      return toQuery(s, z);
    },
    onAsk: (_data, searched) => setSent({ street: searched.street, zip: searched.zip }),
  });

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  function run(s: string, z: string) {
    const q = toQuery(s, z);
    if (q) void lookup(q.query, q.searched);
  }

  function runPlace(place: Place) {
    void lookup(new URLSearchParams({ place: place.slug }), { street: place.name, zip: "", place: place.slug });
  }

  function pick(s: string, z: string) {
    setStreet(s);
    setZip(z);
    run(s, z);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(street, zip);
  }

  const data = state.status === "done" && state.data?.ok ? state.data : null;
  const failed = state.status === "done" && state.data && !state.data.ok ? state.data : null;

  // A settled search with sales goes to the front of the recent list; a new result starts the groups and the paging over.
  const key = data ? `${data.query.place ?? ""}|${data.streets.join(",")}|${data.zips.join(",")}|${data.total}` : "";
  useEffect(() => {
    setGroup(null);
    setShown(PAGE);
    setFocusRow(null);
    if (!data || !data.rows.length || data.match === "area" || !state.searched) return;
    const entry = recentEntry(state.searched.street, state.searched.zip);
    if (!entry) return;
    setRecent((cur) => {
      const next = pushRecent(cur, entry);
      writeRecent(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // The street goes into a link only when the visitor shares it, never into the address bar.
  const shareUrl = state.searched
    ? state.searched.place
      ? `/sell/sold?${new URLSearchParams({ place: state.searched.place })}`
      : `/sell/sold?${new URLSearchParams(state.searched.zip ? { street: state.searched.street, zip: state.searched.zip } : { street: state.searched.street })}`
    : undefined;
  const askAddress = sent ? [sent.street, sent.zip].filter(Boolean).join(", ") : "";

  // The medians by group. "Like yours" needs the parcel's size and every row (a street, never a truncated area).
  const summary = data?.summary;
  const parcelLast = data?.parcel?.rows[0] ?? null;
  const band = parcelLast?.livingArea && data && !data.truncated ? sizeBand(parcelLast.livingArea) : null;
  const like = useMemo(() => (band && data ? groupSummary(data.rows.filter((r) => isResale(r) && inSizeBand(r, band))) : null), [band, data]);
  const defaultGroup: Group = summary && summary.homes === 0 && summary.lots > 0 ? "newer" : "resales";
  const activeGroup: Group = group ?? defaultGroup;
  const groups: { key: Group; label: string; chip: string; count: number }[] = summary
    ? [
        { key: "resales", label: C.summary.groupResales, chip: C.summary.chip(C.summary.groupResales, summary.homes), count: summary.homes },
        { key: "newer", label: C.summary.groupNewer, chip: C.summary.chip(C.summary.groupNewer, summary.lots), count: summary.lots },
        ...(like && band ? [{ key: "like" as const, label: C.summary.groupLike, chip: C.summary.likeChip(int.format(band.from), int.format(band.to), like.count), count: like.count }] : []),
      ]
    : [];
  const activeIndex = Math.max(0, groups.findIndex((g) => g.key === activeGroup));
  const { row: groupRow, onKeyDown: onGroupKeys } = useRoving(groups.length, activeIndex, (i) => setGroup(groups[i]?.key ?? null));
  const medianValue = !summary ? null : activeGroup === "like" ? (like?.medianPrice ?? null) : activeGroup === "newer" ? summary.medianNewerPrice : summary.medianResalePrice;
  const medianShown = useTween(medianValue);
  const ppsfValue = !summary ? null : activeGroup === "like" ? (like?.medianPricePerSqft ?? null) : summary.medianPricePerSqft;
  const ppsfSample = !summary ? 0 : activeGroup === "like" ? (like?.sqftSampleSize ?? 0) : summary.sqftSampleSize;
  const ppsfShown = useTween(ppsfValue);
  const activeLabel = groups.find((g) => g.key === activeGroup)?.label ?? C.summary.groupResales;
  const medianNote = !summary
    ? ""
    : activeGroup === "like" && band && like
      ? C.summary.medianNoteLike(like.count, int.format(band.from), int.format(band.to))
      : C.summary.medianNote(activeGroup === "newer" ? summary.lots : summary.homes, activeLabel);

  // The source line names the counties in the result and how far each one's record reaches.
  const resultCounties = data?.rows.length ? new Set(data.rows.map((r) => r.county as string)) : null;
  const sourceThrough = data?.source?.through ?? through;
  const sourceLabels = resultCounties ? sourceThrough.filter((t) => resultCounties.has(t.county)).map((t) => t.label) : counties;
  const sourceLine = C.results.source(sourceLabels.length ? sourceLabels.join(" / ") : C.results.sourceDefault, throughLine(sourceThrough, resultCounties, asOf));
  const headerThrough = throughLine(sourceThrough, resultCounties, asOf);

  // Ambiguous: the chips, one per spelling and ZIP.
  const options = failed?.error === "zip-required" ? failed.options : [];
  const optionActive = Math.min(optionIndex, Math.max(0, options.length - 1));
  const { row: optionRow, onKeyDown: onOptionKeys } = useRoving(options.length, optionActive, setOptionIndex);

  const rows = data?.rows ?? [];
  const visible = rows.slice(0, shown);
  const cities = data ? [...new Set(data.rows.map((r) => titleCase(r.city)))].filter(Boolean) : [];
  const headerParts = data
    ? data.match === "area" && data.place
      ? [C.results.areaHeading(data.place.name), `${C.results.areaLabel} ${data.place.zips.join(", ")}`]
      : [C.summary.heading(data.streets.map(titleCase)), ...(data.zips.length <= 3 ? data.zips : []), ...(cities.length <= 2 ? cities : [])]
    : [];
  const timelineWindow = windowStart ? { from: windowStart, to: [...sourceThrough.map((t) => t.to ?? ""), asOf ?? ""].filter(Boolean).sort().pop() ?? windowStart } : null;
  const medianRuleLabel =
    summary && medianValue !== null
      ? `${C.timeline.legendMedian(activeGroup === "like" ? `${like?.count ?? 0} resales like yours` : `${activeGroup === "newer" ? summary.lots : summary.homes} ${activeLabel.toLowerCase()}`)} ${usd.format(medianValue)}`
      : null;

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
                  autoCapitalize="words"
                  enterKeyHint="next"
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
                {/* A ZIP gets the number pad; a city typed or pasted in instead switches the box back to letters. */}
                <input
                  id={`${uid}-zip`}
                  name="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder={C.form.zipPlaceholder}
                  autoComplete="postal-code"
                  inputMode={zip === "" || /^\d+$/.test(zip) ? "numeric" : "text"}
                  enterKeyHint="search"
                  maxLength={40}
                  className="street-sign-input"
                />
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

        {/* The last few streets searched in this browser. */}
        {loaded && recent.length ? (
          <nav aria-label={C.results.recentHeading} className="flex flex-col gap-3 border-t border-hairline pt-5" data-recent-searches="">
            <div className="flex items-baseline justify-between gap-4">
              <p className="t-label text-linen-700">{C.results.recentHeading}</p>
              <button
                type="button"
                className="t-small text-graphite-500 underline underline-offset-4 hover:text-navy"
                onClick={() => {
                  setRecent([]);
                  writeRecent([]);
                }}
              >
                {C.results.recentClear}
              </button>
            </div>
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {recent.map((r) => (
                <li key={`${r.street}|${r.zip}`}>
                  <button type="button" className="link-rule" onClick={() => pick(r.street, r.zip)}>
                    {[titleCase(r.street), r.zip].filter(Boolean).join(" · ")}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div ref={resultsRef} tabIndex={-1} className="outline-none" aria-live="polite" aria-busy={state.status === "loading"}>
          {state.status === "error" ? (
            <p className="t-body text-danger" role="alert">
              {C.results.error}
            </p>
          ) : null}

          {failed ? (
            <div className="flex flex-col gap-5 border-t border-hairline pt-6">
              <p className="t-h3 text-navy">
                {failed.error === "no-data" ? C.results.notLoaded : failed.error === "zip-required" ? C.results.zipRequired(failed.streets) : C.results.empty(months)}
              </p>
              {failed.error === "zip-required" && failed.place ? <PlaceChip place={failed.place} onPick={runPlace} /> : null}
              {options.length ? (
                <div ref={optionRow} role="toolbar" aria-label={C.results.optionsLabel} className="flex flex-wrap gap-2" onKeyDown={onOptionKeys} data-street-options="">
                  {options.map((o, i) => (
                    <button
                      key={`${o.street}|${o.zip}`}
                      type="button"
                      className="street-chip"
                      tabIndex={i === optionActive ? 0 : -1}
                      aria-label={C.results.option(titleCase(o.street), o.zip, o.count)}
                      onClick={() => pick(titleCase(o.street), o.zip)}
                    >
                      {titleCase(o.street)} · {o.zip}
                      <span className="street-chip-count" aria-hidden="true">
                        {o.count}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {data && data.rows.length === 0 ? (
            <div className="flex flex-col gap-3 border-t border-hairline pt-6">
              <p className="t-h3 text-navy">{C.results.empty(months)}</p>
              <p className="t-body max-w-measure text-body">{C.results.emptyHelp}</p>
              {data.place ? <PlaceChip place={data.place} onPick={runPlace} /> : null}
              <p className="t-note">{sourceLine}</p>
            </div>
          ) : null}

          {data && data.rows.length > 0 ? (
            <div className="flex flex-col gap-8 border-t border-hairline pt-6">
              {/* The house, when a number was typed and the roll has it. */}
              {data.parcel ? (
                parcelLast ? (
                  <div className="flex flex-col gap-4 border border-hairline bg-white p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:p-6" data-parcel-card="">
                    <div className="flex flex-col gap-2">
                      <h2 className="t-h3 text-navy">
                        {titleCase(parcelLast.address)} · {titleCase(parcelLast.city)} {parcelLast.zip}
                      </h2>
                      <p className="t-record text-graphite-600">
                        {[
                          `${C.parcel.lastSale} ${fmtDate(parcelLast.saleDate)}`,
                          usd.format(parcelLast.salePrice),
                          parcelLast.livingArea ? `${int.format(parcelLast.livingArea)} sq ft` : null,
                          parcelLast.pricePerSqft ? C.parcel.perSqft(usd.format(parcelLast.pricePerSqft)) : null,
                          parcelLast.yearBuilt ? C.parcel.built(parcelLast.yearBuilt) : null,
                          typeLabel(parcelLast),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        {saleFlagged(parcelLast) ? <span title={C.results.rollChanged}> ·&nbsp;†</span> : null}
                      </p>
                      {data.parcel.parcels > 1 ? <p className="t-note">{C.parcel.units(data.parcel.parcels)}</p> : null}
                    </div>
                    <a href={`/sell/home-value?${new URLSearchParams({ address: `${data.parcel.number} ${data.streets[0] ? titleCase(data.streets[0]) : ""}`.trim(), zip: parcelLast.zip })}`} className="link-rule shrink-0 self-start">
                      {C.homeValueLink}
                    </a>
                  </div>
                ) : (
                  <p className="t-note max-w-measure" data-parcel-none="">
                    {C.parcel.none(`${data.parcel.number} ${titleCase(data.streets[0] ?? state.searched?.street ?? "")}`.trim(), months)}
                  </p>
                )
              ) : null}

              {/* The result's name and how far the record reaches. */}
              <div className="flex flex-col gap-3.5">
                {data.match === "partial" || data.match === "fuzzy" ? (
                  <p className="t-small text-graphite-500">
                    {data.match === "fuzzy" ? C.results.fuzzyMatch : C.results.partialMatch} {data.streets.map(titleCase).join(", ")}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="flex flex-col gap-1.5">
                    <h2 className="t-h3 text-navy" data-street-heading="">
                      {C.summary.headingLine(headerParts)}
                    </h2>
                    <p className="t-note max-w-none">{data.match === "area" && data.place ? C.results.areaNote(data.place.zips) : headerThrough}</p>
                  </div>
                  <ShareButton title={C.title} url={shareUrl} what="sold-street" label={C.share} />
                </div>
                {data.place && data.match !== "area" ? <PlaceChip place={data.place} onPick={runPlace} /> : null}
              </div>

              {/* Which sales the median reads: resales, new builds and lots, or the homes like yours. */}
              {summary ? (
                <div className="flex flex-col gap-4">
                  <div ref={groupRow} role="radiogroup" aria-label={C.summary.groupLabel} className="flex flex-wrap gap-2" onKeyDown={onGroupKeys} data-median-group={activeGroup}>
                    {groups.map((g, i) => (
                      <button
                        key={g.key}
                        type="button"
                        role="radio"
                        aria-checked={g.key === activeGroup}
                        tabIndex={i === activeIndex ? 0 : -1}
                        className="street-chip"
                        disabled={g.count === 0}
                        onClick={() => setGroup(g.key)}
                      >
                        {g.chip}
                      </button>
                    ))}
                  </div>
                  {activeGroup === "like" ? <p className="t-note">{C.summary.likeNote}</p> : null}
                </div>
              ) : null}

              {summary ? (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-4 lg:gap-x-8">
                  <Stat label={C.summary.medianOf(activeLabel)} value={medianShown === null ? "—" : usd.format(medianShown)} note={medianValue === null ? C.summary.medianNone : medianNote} />
                  <Stat label={C.summary.perSqft} value={ppsfShown === null ? "—" : usd.format(ppsfShown)} note={ppsfValue ? C.summary.perSqftNote(ppsfSample) : C.summary.perSqftNone} />
                  <Stat label={C.summary.sales} value={int.format(summary.count)} note={C.summary.salesNote(summary.homes, summary.lots, months)} />
                  <Stat label={C.summary.range} value={summary.from && summary.to ? `${fmtDate(summary.from)} – ${fmtDate(summary.to)}` : "—"} small />
                </dl>
              ) : null}
              {medianValue ? (
                <p className="t-small text-graphite-500">
                  <RuleLink href={startSheetPath(medianValue, streetCounty(rows))}>{C.summary.startSheet}</RuleLink>
                </p>
              ) : null}

              {/* Every sale on the street, in time. An area's rows are the newest few hundred, so it has no timeline. */}
              {summary && timelineWindow && !data.truncated ? (
                <SalesTimeline
                  points={rows.map((r) => ({ saleDate: r.saleDate, salePrice: r.salePrice, resale: isResale(r) }))}
                  window={timelineWindow}
                  median={medianValue !== null && medianRuleLabel ? { value: medianValue, label: medianRuleLabel } : null}
                  months={months}
                  resaleMedian={summary.medianResalePrice}
                  newerMedian={summary.medianNewerPrice}
                />
              ) : null}

              {/* The whole table, behind its disclosure, 25 rows at a time. */}
              <details className="street-table flex flex-col gap-5 border-t border-hairline" open={tableOpen} onToggle={(e) => setTableOpen((e.currentTarget as HTMLDetailsElement).open)} data-street-table="">
                <summary className="flex min-h-14 items-center justify-between gap-4 py-3">
                  <span className="t-h3 text-navy">{C.results.allSales(int.format(data.total))}</span>
                  <svg className="street-table-chevron shrink-0 text-navy" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </summary>
                <div className="flex flex-col gap-4 pb-2">
                  <SalesTable rows={visible} focusRow={focusRow} />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <p className="t-note">{data.truncated ? C.results.truncated(rows.length, data.total) : C.results.showing(visible.length, rows.length)}</p>
                    {visible.length < rows.length ? (
                      <button
                        type="button"
                        className="link-rule"
                        onClick={() => {
                          setFocusRow(visible.length);
                          setShown((n) => n + PAGE);
                        }}
                      >
                        {C.results.showMore(Math.min(PAGE, rows.length - visible.length))}
                      </button>
                    ) : null}
                  </div>
                </div>
              </details>

              <div className="flex flex-col gap-2">
                {rows.some((r) => r.propertyUse === "vacant") ? <p className="t-note">{C.results.newBuildNote}</p> : null}
                {rows.some(saleFlagged) ? <p className="t-note">† {C.results.rollChanged}</p> : null}
                <p className="t-note">
                  {sourceLine} {C.results.note}
                </p>
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
          {/* The form itself lives on /sell/home-value; the street searched goes with the link. */}
          <div className="flex flex-col items-start gap-3 lg:pt-2">
            <RuleLink href={askAddress ? `/sell/home-value?ask=${encodeURIComponent(titleCase(askAddress))}#ask` : "/sell/home-value#ask"}>
              {askAddress ? C.ask.linkFor(titleCase(askAddress)) : C.ask.link}
            </RuleLink>
            <p className="t-note">{C.ask.linkNote}</p>
          </div>
        </div>
      </section>
    </>
  );
}

/** "Sales in The Lake Club": the second path when the sign names a place rather than a street. */
function PlaceChip({ place, onPick }: { place: Place; onPick: (p: Place) => void }) {
  return (
    <div className="flex flex-col gap-2" data-place-chip="">
      <p className="t-note">{C.results.placeHint}</p>
      <div>
        <button type="button" className="street-chip" onClick={() => onPick(place)}>
          {C.results.placeChip(place.name)}
          <span className="street-chip-count" aria-hidden="true">
            {C.results.areaLabel}
          </span>
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, note, small }: { label: string; value: string; note?: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-2 border-t border-hairline pt-4 sm:pt-5">
      <dt className="t-label text-linen-700">{label}</dt>
      <dd className={small ? "font-display text-[clamp(1.375rem,1.1rem+0.8vw,1.75rem)] font-light leading-tight text-navy" : "street-stat font-mono text-[clamp(1.75rem,1.3rem+1.2vw,2.25rem)] leading-none font-medium tracking-[-0.01em] text-navy tabular-nums"}>{value}</dd>
      {note ? <dd className="t-note">{note}</dd> : null}
    </div>
  );
}
