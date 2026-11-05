import { monthLabel } from "../issues/render";
import { NARRATIVE_FIELDS, TIDE_MARKET_KEYS, type NarrativeField, type TideIssueEntry, type TideMove } from "./issues";
import { num, pctChange, usd, type Combined, type IssueMarket, type StretchPair, type Trend } from "./issue";

/**
 * The figures a Tide narrative may quote, as tokens. A writer puts
 * `{bradenton.sales}` in a sentence and the page fills it from the same
 * figures the tiles and charts are drawn from, so the words and the numbers
 * can't disagree. A number typed in digits still passes through the number
 * check in lib/tide/narrative.ts; a token that names nothing fails the build.
 *
 * Tokens, per market (`lakewood-ranch`, `sarasota`, `bradenton`) and for `all`
 * (the three together):
 *
 *   {m.sales} {m.typical} {m.vsTypicalPct} {m.vsTypicalSales} {m.vsTypicalWord}
 *   {m.lastYearSales} {m.vsLastYearPct} {m.vsLastYearWord} {m.lastYearMonth}
 *   {m.share}                                        the market's share of the three
 *   {m.medianPrice} {m.typicalMedianPrice} {m.lastYearMedianPrice}
 *   {m.medianPriceVsTypicalPct} {m.medianPriceVsLastYearPct}
 *   {m.ppsf} {m.typicalPpsf} {m.lastYearPpsf} {m.ppsfVsTypicalPct} {m.ppsfVsLastYearPct}
 *   {m.ppsfVsLastYearDir}                            up, down, or flat
 *   {m.newBuild} {m.newBuildPct} {m.typicalNewBuildPct}
 *   {m.prevSales} {m.prevMonth} {m.prevPpsf}         the month before
 *   {m.highSales} {m.highMonth} {m.lowSales} {m.lowMonth}   on the twelve-month chart
 *   {m.sales.2026-06} {m.ppsf.2026-06} {m.medianPrice.2026-06}   any chart month
 *   {m.houses.median} {m.attached.median} {m.houses.count} {m.attached.count} {m.land.count} {m.land.share}
 *   {m.band.under400k} {m.band.400kTo750k} {m.band.750kTo1.5m} {m.band.1.5mUp}   shares
 *   {m.under750k} {m.under1.5m} {m.over400k} {m.over750k}    cumulative shares
 *   {m.streets.1.name} {m.streets.1.street} {m.streets.1.place} {m.streets.1.sales}  … up to 5
 *
 * The trend behind the month, per market and for `all`: `last3` is the three
 * months ending with the data month ("June to August"), `ytd` is January
 * through it, each against the same months a year before:
 *
 *   {m.last3.sales} {m.last3.lastYearSales} {m.last3.vsLastYearPct} {m.last3.vsLastYearWord} {m.last3.vsLastYearSales}
 *   {m.last3.ppsf} {m.last3.lastYearPpsf} {m.last3.ppsfVsLastYearPct} {m.last3.ppsfVsLastYearDir}
 *   {m.last3.medianPrice} {m.last3.lastYearMedianPrice} {m.last3.medianPriceVsLastYearPct} {m.last3.medianPriceVsLastYearDir}
 *   {m.last3.newBuild} {m.last3.lastYearNewBuild} {m.last3.newBuildVsLastYearPct} {m.last3.newBuildVsLastYearWord}
 *   {m.last3.existing} {m.last3.lastYearExisting} {m.last3.existingVsLastYearPct} {m.last3.existingVsLastYearWord}
 *                                                    existing = every sale that wasn't a new build or a lot
 *   {m.last3.span} {m.last3.lastYearSpan}            "June to August", "June to August 2025"
 *   … and the same with `ytd` in place of `last3` ("January to August").
 *
 * For `all` only, the three markets together on the twelve-month chart:
 *
 *   {all.sales.2026-01} {all.highSales} {all.highMonth} {all.lowSales} {all.lowMonth}
 *
 * Counts carry commas, dollars a sign, percents a sign and no decimals; every
 * percent is the size of the change, so the sentence says which way.
 */

export type TokenInput = { dataMonth: string; markets: IssueMarket[]; combined: Combined; trend?: Trend | null };

const TOKEN = /\{([a-z][a-z0-9-]*(?:\.[a-zA-Z0-9-]+)+)\}/g;

const pct = (v: number | null | undefined) => (v === null || v === undefined || Number.isNaN(v) ? null : `${Math.round(Math.abs(v))}%`);
const word = (v: number | null | undefined, more: string, fewer: string, same: string) =>
  v === null || v === undefined || Number.isNaN(v) ? null : Math.round(v) > 0 ? more : Math.round(v) < 0 ? fewer : same;
const monthName = (m: string) => monthLabel(m).split(" ")[0]!;

/** "June to August" for a run inside one year ("June to August 2025" with the year), "November 2026 to January 2027" across two, "January" for one month. */
export function spanLabel(from: string, to: string, withYear = false): string {
  if (from === to) return withYear ? monthLabel(to) : monthName(to);
  if (from.slice(0, 4) !== to.slice(0, 4)) return `${monthLabel(from)} to ${monthLabel(to)}`;
  return `${monthName(from)} to ${withYear ? monthLabel(to) : monthName(to)}`;
}

/** Every token and its value for an issue's figures. */
export function figureTokens(f: TokenInput): Map<string, string> {
  const t = new Map<string, string>();
  const set = (key: string, value: string | null | undefined) => {
    if (value !== null && value !== undefined) t.set(key, value);
  };
  const money = (v: number | null | undefined) => (v === null || v === undefined ? null : usd(v));
  const count = (v: number | null | undefined) => (v === null || v === undefined ? null : num(v));

  for (const m of f.markets) {
    const k = m.market;
    const s = m.stats;
    const b = m.baseline;
    const ly = m.lastYear;
    set(`${k}.sales`, count(s.count));
    set(`${k}.typical`, count(b.count));
    set(`${k}.vsTypicalPct`, pct(pctChange(s.count, b.count)));
    set(`${k}.vsTypicalSales`, b.count === null ? null : count(Math.abs(s.count - b.count)));
    set(`${k}.vsTypicalWord`, word(pctChange(s.count, b.count), "more", "fewer", "about the same"));
    set(`${k}.medianPrice`, money(s.medianPrice));
    set(`${k}.typicalMedianPrice`, money(b.medianPrice));
    set(`${k}.medianPriceVsTypicalPct`, pct(pctChange(s.medianPrice, b.medianPrice)));
    set(`${k}.ppsf`, money(s.medianPpsf));
    set(`${k}.typicalPpsf`, money(b.medianPpsf));
    set(`${k}.ppsfVsTypicalPct`, pct(pctChange(s.medianPpsf, b.medianPpsf)));
    set(`${k}.newBuild`, count(s.newBuild));
    set(`${k}.newBuildPct`, pct(s.newBuildPct));
    set(`${k}.typicalNewBuildPct`, pct(b.newBuildPct));
    set(`${k}.share`, pct(f.combined.parts.find((p) => p.market === k)?.share));
    if (ly) {
      set(`${k}.lastYearMonth`, monthLabel(ly.month));
      set(`${k}.lastYearSales`, count(ly.count));
      set(`${k}.vsLastYearPct`, pct(ly.countPct));
      set(`${k}.vsLastYearWord`, word(ly.countPct, "more", "fewer", "about the same"));
      set(`${k}.lastYearMedianPrice`, money(ly.medianPrice));
      set(`${k}.medianPriceVsLastYearPct`, pct(ly.pricePct));
      set(`${k}.lastYearPpsf`, money(ly.medianPpsf));
      set(`${k}.ppsfVsLastYearPct`, pct(ly.ppsfPct));
      set(`${k}.ppsfVsLastYearDir`, word(ly.ppsfPct, "up", "down", "flat"));
    }
    const prev = m.series.length >= 2 ? m.series[m.series.length - 2]! : null;
    if (prev) {
      set(`${k}.prevSales`, count(prev.count));
      set(`${k}.prevMonth`, monthLabel(prev.month));
      set(`${k}.prevPpsf`, money(prev.medianPpsf));
    }
    const sorted = [...m.series].sort((a, c) => c.count - a.count || a.month.localeCompare(c.month));
    const high = sorted[0];
    const low = sorted[sorted.length - 1];
    if (high && low) {
      set(`${k}.highSales`, count(high.count));
      set(`${k}.highMonth`, monthLabel(high.month));
      set(`${k}.lowSales`, count(low.count));
      set(`${k}.lowMonth`, monthLabel(low.month));
    }
    for (const p of m.series) {
      set(`${k}.sales.${p.month}`, count(p.count));
      set(`${k}.ppsf.${p.month}`, money(p.medianPpsf));
      set(`${k}.medianPrice.${p.month}`, money(p.medianPrice));
    }
    const mixKey = { "single-family": "houses", attached: "attached", land: "land" } as const;
    for (const p of m.mix) {
      const name = mixKey[p.key];
      set(`${k}.${name}.count`, count(p.count));
      set(`${k}.${name}.share`, pct(p.share));
      set(`${k}.${name}.median`, money(p.medianPrice));
    }
    const bandKey = { "under-400k": "under400k", "400k-750k": "400kTo750k", "750k-1.5m": "750kTo1.5m", "1.5m-up": "1.5mUp" } as const;
    const edge = { "400k-750k": "400k", "750k-1.5m": "750k", "1.5m-up": "1.5m" } as const;
    m.bands.bands.forEach((band, i) => {
      set(`${k}.band.${bandKey[band.key]}`, pct(band.share));
      set(`${k}.band.${bandKey[band.key]}.count`, count(band.count));
      if (i > 0 && m.bands.sample) {
        const below = m.bands.bands.slice(0, i).reduce((a, c) => a + c.count, 0);
        const e = edge[band.key as keyof typeof edge];
        set(`${k}.under${e}`, pct((100 * below) / m.bands.sample));
        set(`${k}.over${e}`, pct((100 * (m.bands.sample - below)) / m.bands.sample));
      }
    });
    m.streets.forEach((st, i) => {
      const [street, place] = st.label.split(", ");
      set(`${k}.streets.${i + 1}.name`, st.label);
      set(`${k}.streets.${i + 1}.street`, street);
      set(`${k}.streets.${i + 1}.place`, place ?? "");
      set(`${k}.streets.${i + 1}.sales`, count(st.count));
    });
  }

  const c = f.combined;
  set("all.sales", count(c.count));
  set("all.typical", count(c.typical));
  set("all.vsTypicalPct", pct(c.pct));
  set("all.vsTypicalSales", c.diff === null ? null : count(Math.abs(c.diff)));
  set("all.vsTypicalWord", word(c.pct, "more", "fewer", "about the same"));
  if (c.lastYear) {
    set("all.lastYearMonth", monthLabel(c.lastYear.month));
    set("all.lastYearSales", count(c.lastYear.count));
    set("all.vsLastYearPct", pct(c.lastYear.pct));
    set("all.vsLastYearWord", word(c.lastYear.pct, "more", "fewer", "about the same"));
  }
  set("all.month", monthName(f.dataMonth));
  set("all.monthYear", monthLabel(f.dataMonth));

  // The three markets together on the twelve-month chart.
  const months = f.markets[0]?.series.map((p) => p.month) ?? [];
  const totals = months.map((month, i) => ({ month, count: f.markets.reduce((a, m) => a + (m.series[i]?.count ?? 0), 0) }));
  for (const p of totals) set(`all.sales.${p.month}`, count(p.count));
  const byCount = [...totals].sort((a, c) => c.count - a.count || a.month.localeCompare(c.month));
  if (byCount.length) {
    set("all.highSales", count(byCount[0]!.count));
    set("all.highMonth", monthLabel(byCount[0]!.month));
    set("all.lowSales", count(byCount[byCount.length - 1]!.count));
    set("all.lowMonth", monthLabel(byCount[byCount.length - 1]!.month));
  }

  // The trend: the last three complete months and the year to date, against a year before.
  const stretch = (key: string, p: StretchPair) => {
    const n = p.now;
    const ly = p.lastYear;
    set(`${key}.span`, spanLabel(n.from, n.to));
    set(`${key}.sales`, count(n.count));
    set(`${key}.newBuild`, count(n.newBuild));
    set(`${key}.existing`, count(n.count - n.newBuild));
    set(`${key}.medianPrice`, money(n.medianPrice));
    set(`${key}.ppsf`, money(n.medianPpsf));
    if (!ly) return;
    set(`${key}.lastYearSpan`, spanLabel(ly.from, ly.to, true));
    set(`${key}.lastYearSales`, count(ly.count));
    set(`${key}.vsLastYearSales`, count(Math.abs(n.count - ly.count)));
    set(`${key}.vsLastYearPct`, pct(pctChange(n.count, ly.count)));
    set(`${key}.vsLastYearWord`, word(pctChange(n.count, ly.count), "more", "fewer", "about the same"));
    set(`${key}.lastYearNewBuild`, count(ly.newBuild));
    set(`${key}.newBuildVsLastYearPct`, pct(pctChange(n.newBuild, ly.newBuild)));
    set(`${key}.newBuildVsLastYearWord`, word(pctChange(n.newBuild, ly.newBuild), "more", "fewer", "about the same"));
    set(`${key}.lastYearExisting`, count(ly.count - ly.newBuild));
    set(`${key}.existingVsLastYearPct`, pct(pctChange(n.count - n.newBuild, ly.count - ly.newBuild)));
    set(`${key}.existingVsLastYearWord`, word(pctChange(n.count - n.newBuild, ly.count - ly.newBuild), "more", "fewer", "about the same"));
    set(`${key}.lastYearMedianPrice`, money(ly.medianPrice));
    set(`${key}.medianPriceVsLastYearPct`, pct(pctChange(n.medianPrice, ly.medianPrice)));
    set(`${key}.medianPriceVsLastYearDir`, word(pctChange(n.medianPrice, ly.medianPrice), "up", "down", "flat"));
    set(`${key}.lastYearPpsf`, money(ly.medianPpsf));
    set(`${key}.ppsfVsLastYearPct`, pct(pctChange(n.medianPpsf, ly.medianPpsf)));
    set(`${key}.ppsfVsLastYearDir`, word(pctChange(n.medianPpsf, ly.medianPpsf), "up", "down", "flat"));
  };
  if (f.trend) {
    for (const w of ["last3", "ytd"] as const) {
      for (const m of f.markets) stretch(`${m.market}.${w}`, f.trend[w].markets[m.market]);
      stretch(`all.${w}`, f.trend[w].all);
    }
  }
  return t;
}

/** The tokens written in a text, in order, without their braces. */
export function tokensIn(text: string): string[] {
  return [...text.matchAll(TOKEN)].map((m) => m[1]!);
}

/** `text` with every known token filled; the unknown ones are left as written and listed. */
export function fillTokens(text: string, tokens: Map<string, string>): { text: string; missing: string[] } {
  const missing: string[] = [];
  const out = text.replace(TOKEN, (whole, key: string) => {
    const v = tokens.get(key);
    if (v === undefined) {
      missing.push(key);
      return whole;
    }
    return v;
  });
  return { text: out, missing };
}

export type MissingToken = { field: string; token: string };

/**
 * The entry with every token in its narrative filled from the figures. The
 * signed notes are never touched: Joelyn's and Jessica's words are their own.
 */
export function fillEntry(entry: TideIssueEntry, tokens: Map<string, string>): { entry: TideIssueEntry; missing: MissingToken[] } {
  const missing: MissingToken[] = [];
  const one = (field: string, text: string | undefined): string | undefined => {
    if (text === undefined) return undefined;
    const r = fillTokens(text, tokens);
    for (const token of r.missing) missing.push({ field, token });
    return r.text;
  };
  const many = (field: string, texts: string[] | undefined): string[] | undefined => texts?.map((t, i) => one(`${field}[${i}]`, t)!);
  const moves = (field: string, xs: TideMove[] | undefined): TideMove[] | undefined =>
    xs?.map((m, i) => ({
      move: one(`${field}[${i}].move`, m.move)!,
      why: one(`${field}[${i}].why`, m.why)!,
      ...(m.link ? { link: { href: m.link.href, label: one(`${field}[${i}].link.label`, m.link.label)! } } : {}),
    }));
  const out: TideIssueEntry = { ...entry };
  const text: Extract<NarrativeField, "coverTitle" | "coverKicker" | "headline" | "dek">[] = ["coverTitle", "coverKicker", "headline", "dek"];
  for (const f of text) out[f] = one(f, entry[f]);
  for (const f of ["opening", "buyers", "sellers", "watch"] as const) out[f] = many(f, entry[f]);
  if (entry.markets) {
    out.markets = {};
    for (const k of TIDE_MARKET_KEYS) if (entry.markets[k]) out.markets[k] = many(`markets.${k}`, entry.markets[k]);
  }
  out.buying = moves("buying", entry.buying);
  out.selling = moves("selling", entry.selling);
  return { entry: out, missing };
}

/** Every narrative field an entry may carry tokens in, for the tests. */
export const TOKEN_FIELDS = NARRATIVE_FIELDS;
