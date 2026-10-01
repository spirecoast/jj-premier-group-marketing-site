import { CATEGORY } from "../encore/categories";
import type { EncoreEvent, EncoreIndex } from "../encore/index-format";
import { occurrences, type Occ } from "../encore/select";
import { ENCORE_COPY, fill } from "./copy";
import {
  C,
  MARKET_NAMES,
  SANS,
  SERIF,
  absolute,
  addDays,
  addressWarnings,
  clock,
  column,
  dateShort,
  dayLong,
  dayShort,
  documentHtml,
  esc,
  footer,
  header,
  heading,
  link,
  para,
  rangeLabel,
  row,
  small,
  spacer,
  tagged,
  textHeading,
  weekdayOf,
  wrap,
  wrapLine,
  type FooterInput,
  type Issue,
} from "./render";

/**
 * Encore, the Monday issue: the coming week (Monday to Sunday, America/New_York)
 * from the Encore index, as 8 to 12 picks spread across the three markets and
 * the categories, then the exhibitions on view, then the footer.
 *
 * Pure: the index, the day and the footer facts come in, the issue comes out.
 * The route (app/api/issues/encore) loads them; the tests pass a fixture.
 * Selection follows lib/encore/plan.ts: score every candidate, take the top
 * one, re-score the rest with it in mind.
 */

export const MAX_PICKS = 12;
export const MIN_PICKS = 8;
export const MAX_ON_VIEW = 6;

export type EncoreIssueInput = {
  index: EncoreIndex;
  /** Today in America/New_York, YYYY-MM-DD. */
  today: string;
  footer: Omit<FooterInput, "product">;
};

export type EncoreIssue = Issue & {
  kind: "encore";
  picks: Occ[];
  onView: EncoreEvent[];
  /** Dated performances on the calendar in the week. */
  performances: number;
};

/** The week the Monday issue covers: today when today is a Monday, otherwise the next Monday; through Sunday. */
export function encoreWeek(today: string): { from: string; to: string } {
  const w = weekdayOf(today);
  const from = w === 1 ? today : addDays(today, ((8 - w) % 7) || 7);
  return { from, to: addDays(from, 6) };
}

/**
 * Up to MAX_PICKS performances, one per production, none sold out. Each pick
 * pushes the next away from its market (hardest, so the three places share
 * the issue), its venue, its category and its day.
 */
export function pickWeek(index: EncoreIndex, from: string, to: string, max = MAX_PICKS): Occ[] {
  const pool = occurrences(index, from, to, {}).filter((o) => !o.e.so && !o.e.x);
  const markets = new Map<string, number>();
  const cats = new Map<string, number>();
  const venues = new Map<string, number>();
  const days = new Map<string, number>();
  const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  const score = (o: Occ) =>
    -3 * (markets.get(o.e.m) ?? 0) - 1.5 * (cats.get(o.e.c) ?? 0) - 2 * (venues.get(o.e.v) ?? 0) - 1 * (days.get(o.day) ?? 0) + (o.time >= "17:00" ? 0.5 : 0);
  const picked: Occ[] = [];
  let rest = pool;
  while (picked.length < max && rest.length) {
    rest.sort((a, b) => score(b) - score(a) || a.start - b.start || a.e.t.localeCompare(b.e.t));
    const o = rest[0]!;
    picked.push(o);
    bump(markets, o.e.m);
    bump(cats, o.e.c);
    bump(venues, o.e.v);
    bump(days, o.day);
    rest = rest.filter((x) => x.e.s !== o.e.s);
  }
  return picked.sort((a, b) => a.start - b.start || a.e.t.localeCompare(b.e.t));
}

/** Exhibitions and runs open at some point in the week, closing soonest first. */
export function onViewInWeek(index: EncoreIndex, from: string, to: string): EncoreEvent[] {
  return index.events
    .filter((e) => e.x && (e.r ?? "") >= from && (e.f ?? "") <= to)
    .sort((a, b) => (a.r ?? "").localeCompare(b.r ?? "") || a.t.localeCompare(b.t));
}

const number = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function buildEncoreIssue(input: EncoreIssueInput): EncoreIssue {
  const { index, today } = input;
  const { from, to } = encoreWeek(today);
  const range = rangeLabel(from, to);
  const campaign = `encore-${from}`;
  const site = input.footer.siteUrl;
  const performances = occurrences(index, from, to, {}).length;
  const picks = pickWeek(index, from, to);
  const allOnView = onViewInWeek(index, from, to);
  const onView = allOnView.slice(0, MAX_ON_VIEW);
  const eventUrl = (slug: string) => tagged(absolute(site, `/calendar/${slug}`), "encore", campaign);
  const weekUrl = tagged(absolute(site, `/calendar?view=week&date=${from}`), "encore", campaign);
  const onViewUrl = tagged(absolute(site, `/calendar?view=onview&date=${from}`), "encore", campaign);

  const subject = fill(ENCORE_COPY.subject, { range });
  const title = fill(ENCORE_COPY.title, { range });
  const preheader = picks.length ? fill(ENCORE_COPY.preheader, { picks: picks.length }) : ENCORE_COPY.preheaderEmpty;
  const intro = picks.length ? fill(ENCORE_COPY.intro, { picks: picks.length, performances: number(performances) }) : ENCORE_COPY.introEmpty;

  const warnings = [...addressWarnings(input.footer.officeAddress)];
  if (!picks.length) warnings.push(`The calendar has no dated performances for ${range}. The issue carries only what's on view; consider skipping this week.`);
  else if (picks.length < MIN_PICKS) warnings.push(`Only ${picks.length} performances could be picked for ${range} (the issue aims for ${MIN_PICKS} to ${MAX_PICKS}).`);
  const marketsCovered = new Set(picks.map((o) => o.e.m));
  if (picks.length && marketsCovered.size < 3) {
    const missing = (Object.keys(MARKET_NAMES) as (keyof typeof MARKET_NAMES)[]).filter((m) => !marketsCovered.has(m)).map((m) => MARKET_NAMES[m]);
    warnings.push(`No picks in ${missing.join(" or ")} this week: the calendar has nothing there that isn't sold out.`);
  }

  const when = (o: Occ) => `${dayLong(o.day)} · ${o.time ? clock(o.time) : ENCORE_COPY.allDay}`;
  const pickHtml = (o: Occ) => {
    const cat = CATEGORY[o.e.c];
    const meta = [when(o), o.e.vn].map(esc).join(" &middot; ");
    const extra = [o.e.p ? fill(ENCORE_COPY.presentedBy, { presenter: o.e.p }) : "", o.e.pr ?? ""].filter(Boolean).join(" · ");
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="56" valign="top" style="width:56px;padding:16px 0;border-top:1px solid ${C.rule};">
<p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.3;letter-spacing:1px;text-transform:uppercase;color:${C.muted};">${esc(dayShort(o.day))}</p>
<p style="margin:0;font-family:${SERIF};font-size:28px;line-height:1.1;color:${C.navy};">${Number(o.day.slice(8, 10))}</p>
</td>
<td valign="top" style="padding:16px 0 16px 12px;border-top:1px solid ${C.rule};">
<p style="margin:0 0 4px 0;font-family:${SANS};font-size:12px;line-height:1.4;letter-spacing:1px;text-transform:uppercase;color:${C.muted};"><span style="display:inline-block;width:16px;height:3px;background-color:${cat.color};vertical-align:middle;margin-right:6px;"></span>${esc(cat.label)} &middot; ${esc(MARKET_NAMES[o.e.m])}</p>
<p style="margin:0 0 4px 0;font-family:${SERIF};font-size:20px;line-height:1.3;"><a href="${esc(eventUrl(o.e.s))}" style="color:${C.navy};text-decoration:none;">${esc(o.e.t)}</a></p>
<p style="margin:0 0 6px 0;font-family:${SANS};font-size:14px;line-height:1.45;color:${C.muted};">${meta}</p>
${o.e.sum ? `<p style="margin:0 0 4px 0;font-family:${SANS};font-size:15px;line-height:1.5;color:${C.ink};">${esc(o.e.sum)}</p>` : ""}
${extra ? `<p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.45;color:${C.muted};">${esc(extra)}</p>` : ""}
</td></tr></table>`;
  };
  const onViewHtml = (e: EncoreEvent) =>
    `<p style="margin:0 0 12px 0;font-family:${SANS};font-size:15px;line-height:1.45;color:${C.ink};"><a href="${esc(eventUrl(e.s))}" style="color:${C.navy};font-family:${SERIF};font-size:17px;text-decoration:none;">${esc(e.t)}</a><br><span style="color:${C.muted};font-size:14px;">${esc(
      [e.r ? fill(ENCORE_COPY.through, { date: dateShort(e.r) }) : "", e.vn, MARKET_NAMES[e.m]].filter(Boolean).join(" · "),
    )}</span></p>`;

  const lead = picks[0];
  const foot = footer({ ...input.footer, product: "Encore" }, "encore", campaign);
  const rows = [
    header({ eyebrow: ENCORE_COPY.eyebrow, wordmark: "Encore", title, homeHref: tagged(absolute(site, "/calendar"), "encore", campaign) }),
    spacer(24),
    row(para(esc(intro))),
    // The lead pick's picture: the venue's photo or the Encore key art, as a PNG from the site (app/api/issues/encore/image).
    lead
      ? row(
          `<a href="${esc(eventUrl(lead.e.s))}"><img src="${esc(absolute(site, `/api/issues/encore/image/${lead.e.s}`))}" width="536" alt="${esc(lead.e.t)}" style="display:block;width:100%;max-width:536px;height:auto;border:0;background-color:${C.linen};"></a>`,
        )
      : "",
    picks.length ? row(heading(ENCORE_COPY.picksHeading) + picks.map(pickHtml).join("\n"), "0 32px 8px 32px") : "",
    picks.length ? row(para(link(weekUrl, ENCORE_COPY.calendarCta)), "8px 32px 16px 32px") : "",
    onView.length
      ? row(
          heading(ENCORE_COPY.onViewHeading) +
            small(esc(ENCORE_COPY.onViewIntro)) +
            onView.map(onViewHtml).join("\n") +
            (allOnView.length > onView.length ? small(link(onViewUrl, fill(ENCORE_COPY.onViewMore, { more: allOnView.length - onView.length }))) : ""),
          "8px 32px 16px 32px",
        )
      : "",
    foot.html,
  ].filter(Boolean);
  const bodyHtml = column(rows.join("\n"));
  const html = documentHtml({ title: subject, preheader, body: bodyHtml });

  const text = wrap(
    [
      `ENCORE · ${title.toUpperCase()}`,
      "",
      intro,
      "",
      ...(picks.length
        ? [
            textHeading(ENCORE_COPY.picksHeading),
            "",
            ...picks.flatMap((o) => [
              // The title line wraps under itself, indented like the lines that follow it.
              wrapLine(`${dayShort(o.day)} ${dateShort(o.day)}, ${o.time ? clock(o.time) : ENCORE_COPY.allDay} · ${o.e.t}`, 72, "  "),
              `  ${[o.e.vn, MARKET_NAMES[o.e.m], CATEGORY[o.e.c].label].join(" · ")}`,
              ...(o.e.sum ? [`  ${o.e.sum}`] : []),
              `  ${eventUrl(o.e.s)}`,
              "",
            ]),
            `${ENCORE_COPY.calendarCta}: ${weekUrl}`,
            "",
          ]
        : []),
      ...(onView.length
        ? [
            textHeading(ENCORE_COPY.onViewHeading),
            ENCORE_COPY.onViewIntro,
            "",
            ...onView.flatMap((e) => [
              wrapLine(e.t, 72, "  "),
              `  ${[e.r ? fill(ENCORE_COPY.through, { date: dateShort(e.r) }) : "", e.vn, MARKET_NAMES[e.m]].filter(Boolean).join(" · ")}`,
              `  ${eventUrl(e.s)}`,
              "",
            ]),
            ...(allOnView.length > onView.length ? [`${fill(ENCORE_COPY.onViewMore, { more: allOnView.length - onView.length })} ${onViewUrl}`, ""] : []),
          ]
        : []),
      foot.text,
    ].join("\n"),
  );

  return {
    kind: "encore",
    subject,
    preheader,
    period: { from, to, label: range },
    html,
    bodyHtml,
    text,
    needsEdit: false,
    warnings,
    picks,
    onView,
    performances,
  };
}

/** The subject of the internal email that carries the issue to the team. */
export function encoreTeamSubject(issue: Pick<Issue, "period">): string {
  const [y, m, d] = issue.period.from.split("-").map(Number) as [number, number, number];
  const month = new Date(Date.UTC(y, m - 1, d)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return `Encore for Monday ${month} ${d}, ${y}: ready to send`;
}
