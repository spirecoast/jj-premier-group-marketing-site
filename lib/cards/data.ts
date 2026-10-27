import "server-only";
import { getNeighborhood } from "@/lib/content";
import { SITE_TIMEZONE } from "@/lib/content/format";
import { getMarket, marketName } from "@/lib/content/markets";
import { loadEncoreIndex } from "@/lib/encore/data";
import { checkFairHousing } from "@/lib/fair-housing";
import { encoreWeek, pickWeek } from "@/lib/issues/encore-weekly";
import { getAllRecords, getAncestors } from "@/lib/neighborhoods/data";
import { TYPE_LABEL } from "@/lib/neighborhoods/format";
import { getSalesManifest, searchByStreet } from "@/lib/sales";
import { site } from "@/lib/site";
import { dayIn } from "@/lib/time";
import { TIDE_ISSUES } from "@/lib/tide/issues";
import { loadIssueModel } from "@/lib/tide/load";
import { CARDS_COPY as C, type CardKind } from "./copy";

export type CardChannel = "instagram" | "facebook" | "youtube" | "nextdoor";
export const CARD_CHANNELS: { slug: CardChannel; name: string }[] = [
  { slug: "instagram", name: "Instagram" },
  { slug: "facebook", name: "Facebook" },
  { slug: "nextdoor", name: "Nextdoor" },
  { slug: "youtube", name: "YouTube" },
];
export const isCardChannel = (v: unknown): v is CardChannel => CARD_CHANNELS.some((c) => c.slug === v);

/** The short address printed on a card and ending its caption: the channel's landing page. */
export const shortUrl = (channel: CardChannel) => `${site.domain}/from/${channel}`;

export type CardModel = {
  kind: CardKind;
  eyebrow: string;
  title: string;
  /** Figures as label and value, set large (Tide's medians, a street's median). */
  rows?: { label: string; value: string }[];
  /** Plain lines (the week's picks, a place's facts). */
  lines?: string[];
  note?: string;
  /** A /public photograph for the top of the card. */
  photo?: string;
  caption: string;
  /** The caption failed the Fair Housing check: the page holds the card. */
  held: boolean;
};

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const finish = (m: Omit<CardModel, "held">): CardModel => ({ ...m, held: !checkFairHousing(`${m.title} ${m.caption} ${(m.lines ?? []).join(" ")}`).passed });

/** Tide's latest issue: the three markets' median sale prices for its data month. */
async function tideCard(channel: CardChannel): Promise<CardModel | null> {
  const latest = [...TIDE_ISSUES].sort((a, b) => a.issue.localeCompare(b.issue)).at(-1);
  const model = latest ? await loadIssueModel(latest.issue) : null;
  if (!model) return null;
  const rows = model.markets.filter((m) => m.stats.medianPrice !== null).map((m) => ({ label: m.name, value: usd(m.stats.medianPrice!) }));
  if (!rows.length) return null;
  return finish({
    kind: "tide",
    eyebrow: C.tide.eyebrow(model.issueLabel),
    title: C.tide.title,
    rows,
    note: C.tide.rowNote(model.dataLabel),
    photo: model.cover.src,
    caption: C.tide.caption(model.issueLabel, model.dataLabel, shortUrl(channel)),
  });
}

const dayLabel = (day: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

/** The Monday issue's picks for this week (or next, from a Monday), as the issue chooses them. */
async function weekCard(channel: CardChannel, size: "feed" | "story"): Promise<CardModel | null> {
  const index = await loadEncoreIndex();
  const { from, to } = encoreWeek(dayIn(SITE_TIMEZONE));
  const picks = pickWeek(index, from, to, size === "story" ? 6 : 4);
  if (!picks.length) return null;
  const venue = new Map(index.venues.map((v) => [v.s, v.n]));
  return finish({
    kind: "week",
    eyebrow: C.week.eyebrow,
    title: C.week.title,
    lines: picks.map((o) => `${dayLabel(o.day)} · ${o.e.t} · ${venue.get(o.e.v) ?? marketName(o.e.m)}`),
    note: `${dayLabel(from)} to ${dayLabel(to)}`,
    photo: "/images/library/culture-opera-house-red-seats.jpg",
    caption: C.week.caption(dayLabel(from), dayLabel(to), picks.length, shortUrl(channel)),
  });
}

/** One researched place, found by its name or slug: the facts its page carries, on its photograph or its market's. */
async function placeCard(channel: CardChannel, q: string): Promise<CardModel | null> {
  const want = q.trim().toLowerCase();
  if (!want) return null;
  const records = (await getAllRecords()).filter((r) => r.research === "full");
  const r = records.find((x) => x.slug === want) ?? records.find((x) => x.name.toLowerCase() === want);
  if (!r) return null;
  const [ancestors, editorial] = await Promise.all([getAncestors(r.slug), getNeighborhood(r.slug)]);
  const where = ancestors.length ? ancestors.map((a) => a.name).join(" › ") : marketName(r.market);
  const lines = [
    r.type ? TYPE_LABEL[r.type] : null,
    r.jurisdiction,
    r.gated === true ? "Gated" : r.gated === false ? "Not gated" : null,
    r.hoa?.name ? "HOA on record" : null,
    r.cdd ? "CDD on record" : null,
    r.evacuationZone ? (r.evacuationZone === "none" ? "Outside every evacuation zone" : `Evacuation zone ${r.evacuationZone}`) : null,
    r.zips.length ? `ZIP ${r.zips.join(", ")}` : null,
  ].filter((l): l is string => Boolean(l));
  return finish({
    kind: "place",
    eyebrow: C.place.eyebrow(where),
    title: r.name,
    lines,
    photo: editorial?.neighborhood.hero.src ?? getMarket(r.market)?.image.src,
    caption: C.place.caption(r.name, where, shortUrl(channel)),
  });
}

/** Tide Street's summary for one street: how many sold in the window, and the median price. */
async function streetCard(channel: CardChannel, q: string): Promise<CardModel | null> {
  const m = /^(.*?)(?:\s+(\d{5}))?$/.exec(q.trim());
  const street = m?.[1]?.trim();
  if (!street) return null;
  const [first, manifest] = await Promise.all([searchByStreet({ street, zip: m?.[2], limit: 1 }), getSalesManifest()]);
  // A name on several streets or ZIPs: the one with the most sales, as Tide Street offers it first.
  const top = first.match === "ambiguous" ? first.options[0] : undefined;
  const res = top ? await searchByStreet({ street: top.street, zip: top.zip, limit: 1 }) : first;
  if (!res.total || res.match === "none" || res.match === "ambiguous") return null;
  const months = manifest?.windowMonths ?? 24;
  const name = res.streets[0] ?? street;
  const s = res.summary;
  return finish({
    kind: "street",
    eyebrow: C.street.eyebrow,
    title: C.street.title(name),
    rows: s.medianPrice !== null ? [{ label: C.street.median, value: usd(s.medianPrice) }] : undefined,
    lines: [C.street.count(s.count, months)],
    note: C.source,
    photo: "/images/library/listing-twilight-exterior-pool.jpg",
    caption: C.street.caption(name, s.count, months, shortUrl(channel)),
  });
}

export async function loadCard(kind: CardKind, o: { channel: CardChannel; size: "feed" | "story"; q?: string }): Promise<CardModel | null> {
  try {
    if (kind === "tide") return await tideCard(o.channel);
    if (kind === "week") return await weekCard(o.channel, o.size);
    if (kind === "place") return await placeCard(o.channel, o.q ?? "");
    return await streetCard(o.channel, o.q ?? "");
  } catch (err) {
    console.error("[cards]", kind, err);
    return null;
  }
}
