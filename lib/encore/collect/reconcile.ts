import type { StoreEvent, StorePerformance } from "../store/types";
import { addDays } from "./dates";
import type { DatasetVenue } from "./known";
import { buildMatcher, type KnownEvent } from "./match";
import { formatPrice, parsePrice } from "./price";
import type { SourceSpec } from "./sources";
import type { Availability, CollectedEvent, CollectedPerformance } from "./types";
import { isTicketingUrl, normTitle, normUrl, stripDateSuffix } from "./util";

/**
 * What one source's results change. Pure: the run loads the stored events,
 * hands them here with what the adapter found, and applies the plan.
 *
 * The rules (the owner's): changes to known events apply on their own
 * (dates added or dropped, status, sold out, price, image); anything new
 * waits in the review queue, because a new listing needs a description
 * written fresh and a person's check of its category and venue.
 *
 *  - Dates are added only from structured sources (feeds, APIs, listings
 *    with times). Dates a page only mentions in prose never add a date.
 *  - A date is dropped (status "removed") only when the source lists every
 *    date (`complete`) and no longer has it; more than half the future
 *    dates disappearing at once goes to review instead.
 *  - A run's (exhibition's) first and last day move when the source's
 *    range still overlaps the old one; otherwise review.
 *  - A price text is replaced only when the numbers change.
 */

export type PerfWrite = {
  slug: string;
  date: string;
  time: string;
  status?: StorePerformance["status"];
  availability?: Availability;
  priceMin?: number | null;
  priceMax?: number | null;
  currency?: string;
  ticketUrl?: string | null;
  sourceUrl?: string | null;
  /** The performance moved to this time (same date). */
  newTime?: string;
  /** New performance (insert) vs. a change to an existing one. */
  isNew: boolean;
};

export type CheckWrite = {
  slug: string;
  date: string;
  time: string;
  status: StorePerformance["status"];
  availability: Availability;
  priceMin?: number | null;
  priceMax?: number | null;
  currency?: string;
  sourceUrl?: string | null;
};

export type EventPatch = {
  slug: string;
  set: Partial<Pick<StoreEvent, "status" | "price" | "priceMin" | "priceMax" | "ticketUrl" | "startDate" | "endDate" | "startTime" | "externalId" | "sourceId">>;
};

export type QueueItem = {
  kind: "new-event" | "change" | "removed";
  fingerprint: string;
  sourceId: string;
  eventSlug?: string;
  title: string;
  sourceUrl?: string;
  firstDate?: string;
  payload: Record<string, unknown>;
  proposed: Record<string, unknown>;
  note?: string;
};

export type ImageCandidate = { slug: string; imageUrl?: string; pageUrl: string; credit: string };

export type Plan = {
  sourceId: string;
  patches: EventPatch[];
  perfs: PerfWrite[];
  checks: CheckWrite[];
  queue: QueueItem[];
  images: ImageCandidate[];
  /** Known events the source showed this run (their last_seen_at moves). */
  seen: string[];
  stats: { collected: number; matched: number; queued: number; perfsAdded: number; perfsChanged: number; perfsRemoved: number; checks: number };
};

export type ReconcileInput = {
  source: SourceSpec;
  collected: CollectedEvent[];
  events: StoreEvent[];
  venues: DatasetVenue[];
  today: string;
  mode: "collect" | "check";
  /** Fingerprints a person already approved or rejected: never queued again. */
  settled?: Set<string>;
  /** How far ahead a check reading is kept (days): 21 for the daily check, 60 on the weekly run. */
  checkDays?: number;
};

const sameMoney = (a?: number | null, b?: number | null) => (a ?? null) === (b ?? null) || (a != null && b != null && Math.abs(a - b) < 0.005);

export function slugify(s: string): string {
  return normTitle(s).replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80).replace(/-$/, "");
}

export function fingerprint(sourceId: string, e: Pick<CollectedEvent, "title" | "venueKey" | "venueName">): string {
  return `new|${sourceId}|${normTitle(stripDateSuffix(e.title))}|${e.venueKey ?? normTitle(e.venueName ?? "")}`;
}

function toKnown(e: StoreEvent): KnownEvent {
  return {
    slug: e.slug,
    title: e.title,
    venueKey: e.venueKey,
    urls: [...e.sources, ...(e.ticketUrl ? [e.ticketUrl] : [])],
    dates: e.performances.filter((p) => p.status !== "removed").map((p) => p.date),
    startDate: e.startDate,
    endDate: e.endDate,
  };
}

/** The stored performance a collected one is: same date and time, or the same date when one side has no time. */
function findPerf(perfs: StorePerformance[], p: CollectedPerformance): StorePerformance | undefined {
  return perfs.find((x) => x.date === p.date && x.time === p.time) ?? perfs.find((x) => x.date === p.date && (!x.time || !p.time) && perfs.filter((y) => y.date === p.date).length === 1);
}

export function reconcile(input: ReconcileInput): Plan {
  const { source, collected, events, venues, today, mode } = input;
  const checkUntil = addDays(today, input.checkDays ?? (mode === "check" ? 21 : 60));
  const plan: Plan = {
    sourceId: source.id,
    patches: [],
    perfs: [],
    checks: [],
    queue: [],
    images: [],
    seen: [],
    stats: { collected: collected.length, matched: 0, queued: 0, perfsAdded: 0, perfsChanged: 0, perfsRemoved: 0, checks: 0 },
  };
  const visible = events.filter((e) => !e.hidden);
  const matcher = buildMatcher(visible.map(toKnown), venues.filter((v) => v.name).map((v) => ({ key: v.key, name: v.name! })));
  const bySlug = new Map(visible.map((e) => [e.slug, e]));
  const venueMarket = new Map(venues.map((v) => [v.key, v.market]));

  // URL matches first claim their events, so title matching can't hand the same event to a near-namesake.
  const groups = new Map<string, CollectedEvent[]>();
  const unmatched: CollectedEvent[] = [];
  const taken = new Set<string>();
  const firstPass = collected.map((c) => ({ c, m: matcher.match(c, undefined, source.venueKey) }));
  for (const { m } of firstPass) if (m?.via === "url") taken.add(m.slug);
  for (const { c, m: first } of firstPass) {
    const m = first?.via === "url" ? first : matcher.match(c, taken, source.venueKey);
    if (!m) unmatched.push(c);
    else groups.set(m.slug, [...(groups.get(m.slug) ?? []), c]);
  }
  // The same show under a second page or id at one source ("Al Ernst" on two show pages) joins the first.
  const byTitle = new Map<string, string>();
  for (const [slug, cs] of groups) for (const c of cs) byTitle.set(normTitle(stripDateSuffix(c.title)), slug);
  for (let i = unmatched.length - 1; i >= 0; i -= 1) {
    const slug = byTitle.get(normTitle(stripDateSuffix(unmatched[i]!.title)));
    if (slug) groups.get(slug)!.push(...unmatched.splice(i, 1));
  }

  for (const [slug, cs] of groups) {
    const e = bySlug.get(slug)!;
    plan.stats.matched += 1;
    plan.seen.push(slug);
    const perfs = cs.flatMap((c) => c.performances.map((p) => ({ ...p, c })));
    const structured = cs.some((c) => !c.heuristic);
    const complete = cs.some((c) => c.complete) && perfs.length > 0;
    const future = e.performances.filter((p) => p.date >= today && p.status !== "removed");
    const touched = new Set<StorePerformance>();

    // A run (exhibition) gets no dates added: it stays "on view" until a person says otherwise.
    const isRun = !e.performances.length;
    const onDate = (list: { date: string }[], d: string) => list.filter((x) => x.date === d).length;
    for (const p of perfs) {
      if (p.date < today) continue;
      let existing = findPerf(e.performances, p);
      // One performance that day on both sides, at a different time: the time moved.
      if (!existing && p.time && onDate(perfs, p.date) === 1 && onDate(e.performances.filter((x) => x.status !== "removed"), p.date) === 1 && !p.c.heuristic) {
        const was = e.performances.find((x) => x.date === p.date && x.status !== "removed")!;
        if (was.time && was.time !== p.time) {
          plan.perfs.push({ slug, date: was.date, time: was.time, newTime: p.time, isNew: false });
          plan.stats.perfsChanged += 1;
          existing = { ...was, time: p.time };
          touched.add(was);
        }
      }
      const status = p.status ?? "scheduled";
      const availability = p.availability ?? (p.status === "cancelled" ? "not-on-sale" : undefined);
      const priceMin = p.priceMin ?? p.c.priceMin;
      const priceMax = p.priceMax ?? p.c.priceMax;
      if (existing) {
        touched.add(existing);
        const changes: Partial<PerfWrite> = {};
        if (existing.status !== status && !(existing.status === "removed" && !structured)) changes.status = status;
        if (availability && existing.availability !== availability) changes.availability = availability;
        if (priceMin != null && !sameMoney(existing.priceMin, priceMin)) changes.priceMin = priceMin;
        if (priceMax != null && !sameMoney(existing.priceMax, priceMax)) changes.priceMax = priceMax;
        if (p.ticketUrl && existing.ticketUrl !== p.ticketUrl) changes.ticketUrl = p.ticketUrl;
        if (Object.keys(changes).length) {
          plan.perfs.push({ slug, date: existing.date, time: existing.time, ...changes, isNew: false });
          plan.stats.perfsChanged += 1;
        }
        if (existing.date <= checkUntil) {
          // (after a time change `existing` carries the new time)
          plan.checks.push({
            slug,
            date: existing.date,
            time: existing.time,
            status: changes.status ?? existing.status,
            availability: availability ?? existing.availability,
            priceMin: priceMin ?? existing.priceMin,
            priceMax: priceMax ?? existing.priceMax,
            currency: p.currency ?? "USD",
            sourceUrl: p.c.sourceUrl,
          });
        }
      } else if (mode === "collect" && !isRun && !p.c.heuristic && (p.time || p.c.complete || !e.performances.some((x) => x.date === p.date))) {
        // A run's single untimed date from a listing that only prints ranges is not a new performance.
        if (!p.time && !p.c.complete && !e.performances.length && (e.endDate ?? e.startDate) && cs.every((c) => !c.complete)) continue;
        plan.perfs.push({ slug, date: p.date, time: p.time, status, availability: availability ?? "unknown", priceMin, priceMax, currency: p.currency, ticketUrl: p.ticketUrl, sourceUrl: p.c.sourceUrl, isNew: true });
        plan.stats.perfsAdded += 1;
        if (p.date <= checkUntil) plan.checks.push({ slug, date: p.date, time: p.time, status, availability: availability ?? "unknown", priceMin, priceMax, currency: p.currency ?? "USD", sourceUrl: p.c.sourceUrl });
      }
    }

    // Dates the source no longer lists.
    if (mode === "collect" && complete && structured) {
      const gone = future.filter((p) => !touched.has(p) && p.status !== "removed");
      if (gone.length && gone.length <= Math.max(2, Math.floor(future.length / 2))) {
        for (const p of gone) {
          plan.perfs.push({ slug, date: p.date, time: p.time, status: "removed", isNew: false });
          plan.stats.perfsRemoved += 1;
        }
      } else if (gone.length) {
        plan.queue.push({
          kind: "change",
          fingerprint: `change|${slug}|removed-${gone.length}-of-${future.length}`,
          sourceId: source.id,
          eventSlug: slug,
          title: e.title,
          sourceUrl: cs[0]!.sourceUrl,
          firstDate: gone[0]!.date,
          payload: { gone: gone.map((p) => `${p.date} ${p.time}`.trim()), listed: perfs.map((p) => `${p.date} ${p.time}`.trim()) },
          proposed: { action: "remove-dates" },
          note: `${gone.length} of ${future.length} upcoming dates are no longer listed. Too many to drop on their own.`,
        });
      }
    }

    // The event's own fields.
    const set: EventPatch["set"] = {};
    const after = new Map(e.performances.filter((p) => p.date >= today).map((p) => [`${p.date}|${p.time}`, { ...p }]));
    for (const w of plan.perfs.filter((w) => w.slug === slug)) {
      const k = `${w.date}|${w.time}`;
      const prev = after.get(k);
      after.set(k, { ...(prev ?? { date: w.date, time: w.time, status: "scheduled", availability: "unknown" }), ...(w.status ? { status: w.status } : {}), ...(w.availability ? { availability: w.availability } : {}) } as StorePerformance);
    }
    const live = [...after.values()].filter((p) => p.status !== "removed");
    if (live.length) {
      const status = live.every((p) => p.status === "cancelled")
        ? "cancelled"
        : live.every((p) => p.status === "postponed")
          ? "postponed"
          : live.filter((p) => p.status === "scheduled").every((p) => p.availability === "sold-out")
            ? "sold-out"
            : "scheduled";
      if (status !== e.status && e.status !== "announced") set.status = status;
    } else if (cs.some((c) => c.status === "cancelled" || c.status === "postponed") && e.status !== cs[0]!.status) {
      set.status = cs.find((c) => c.status === "cancelled" || c.status === "postponed")!.status as "cancelled" | "postponed";
    }

    const withPrice = cs.find((c) => c.priceMin != null || c.price);
    if (withPrice) {
      const lo = withPrice.priceMin ?? parsePrice(withPrice.price).min;
      const hi = withPrice.priceMax ?? parsePrice(withPrice.price).max;
      const old = parsePrice(e.price);
      const numbersChanged = lo != null && (!sameMoney(old.min, lo) || !sameMoney(old.max, hi));
      if (lo != null && (!sameMoney(e.priceMin, lo) || !sameMoney(e.priceMax, hi))) {
        set.priceMin = lo;
        set.priceMax = hi ?? lo;
      }
      // The published wording replaces ours only when the numbers changed; bare numbers only fill a blank.
      const text = withPrice.price && numbersChanged ? withPrice.price : !e.price ? (withPrice.price ?? formatPrice(lo, hi)) : undefined;
      if (text && text !== e.price) set.price = text;
    }
    const ticket = cs.map((c) => c.ticketUrl).find((u) => u && /^https?:\/\//.test(u));
    if (!e.ticketUrl && ticket) set.ticketUrl = ticket;

    // A run (no performances) whose first or last day moved.
    if (!e.performances.length) {
      const r = cs.find((c) => c.startDate && c.endDate);
      if (r && (r.startDate !== e.startDate || r.endDate !== e.endDate)) {
        const overlaps = r.startDate! <= (e.endDate ?? e.startDate) && r.endDate! >= e.startDate;
        if (overlaps && r.endDate! >= today && !r.heuristic) {
          if (r.startDate !== e.startDate) set.startDate = r.startDate!;
          if (r.endDate !== e.endDate) set.endDate = r.endDate!;
        } else if (mode === "collect" && r.endDate! >= today && r.startDate! <= r.endDate!) {
          plan.queue.push({
            kind: "change",
            fingerprint: `change|${slug}|run-${r.startDate}-${r.endDate}`,
            sourceId: source.id,
            eventSlug: slug,
            title: e.title,
            sourceUrl: r.sourceUrl,
            firstDate: r.startDate,
            payload: { was: [e.startDate, e.endDate], now: [r.startDate, r.endDate] },
            proposed: { startDate: r.startDate, endDate: r.endDate },
            note: r.heuristic ? "The page now prints different dates for this run. Read off the page's text, so a person confirms." : "The run's dates changed and no longer overlap the old ones.",
          });
        }
      }
    }
    if (!e.sourceId) set.sourceId = source.id;
    const ext = cs.map((c) => c.externalId).find(Boolean);
    if (ext && !e.externalId) set.externalId = ext;
    if (Object.keys(set).length) plan.patches.push({ slug, set });

    if (mode === "collect") {
      const img = cs.find((c) => c.imageUrl);
      // No image in the feed (TNEW, TicketSpice): look on the presenter's own page, not the ticket seller's.
      const ownPage = [...e.sources, ...cs.map((c) => c.sourceUrl)].find((u) => u && !isTicketingUrl(u));
      plan.images.push({ slug, imageUrl: img?.imageUrl, pageUrl: img ? (img.imagePageUrl ?? img.sourceUrl) : (ownPage ?? cs[0]!.sourceUrl), credit: e.presenter || source.presenter || e.venueName || source.domain });
    }
  }

  // Everything new waits for a person.
  if (mode === "collect") {
    const seenFp = new Set<string>();
    for (const c of unmatched) {
      const dates = [...c.performances.map((p) => p.date), c.startDate, c.endDate].filter((d): d is string => Boolean(d)).sort();
      if (!dates.length || dates[dates.length - 1]! < today) continue;
      const fp = fingerprint(source.id, c);
      if (seenFp.has(fp) || input.settled?.has(fp)) continue;
      seenFp.add(fp);
      const venueKey = c.venueKey ?? matcher.resolveVenue(c.venueName) ?? source.venueKey;
      const firstDate = dates.find((d) => d >= today) ?? dates[0]!;
      plan.queue.push({
        kind: "new-event",
        fingerprint: fp,
        sourceId: source.id,
        title: c.title,
        sourceUrl: c.sourceUrl,
        firstDate,
        payload: c as unknown as Record<string, unknown>,
        proposed: {
          slug: `${slugify(stripDateSuffix(c.title))}-${firstDate.slice(0, 7)}`,
          venueKey: venueKey ?? null,
          market: venueKey ? (venueMarket.get(venueKey) ?? null) : null,
          presenter: c.presenter ?? (source.presenter || null),
          categoryHint: c.categoryHint ?? null,
          price: c.price ?? null,
          ticketUrl: c.ticketUrl ?? null,
          imageUrl: c.imageUrl ?? null,
        },
        note: venueKey ? undefined : `Venue "${c.venueName ?? "not given"}" needs mapping.`,
      });
    }
    // A platform that lists everything stopped listing a known production with dates ahead.
    if (source.adapter === "tnew" || source.adapter === "ovationtix") {
      const hosts = new Set(source.hosts);
      for (const e of visible) {
        if (groups.has(e.slug) || e.status === "announced") continue;
        // Only this presenter's own productions: a rental's tickets sold through the house's system don't count.
        if (e.sourceId && e.sourceId !== source.id && e.sourceId.startsWith("manual-")) continue;
        const onPlatform = [e.ticketUrl, ...e.sources].some((u) => {
          if (!u) return false;
          const h = normUrl(u).split("/")[0]!;
          return [...hosts].some((x) => h === x || h.endsWith(`.${x}`)) && /ovationtix|tickets\.|buy\.|cart\.|my\./.test(h);
        });
        const ahead = e.performances.filter((p) => p.date > addDays(today, 1) && p.status !== "removed");
        if (onPlatform && ahead.length && collected.length) {
          plan.queue.push({
            kind: "removed",
            fingerprint: `removed|${e.slug}`,
            sourceId: source.id,
            eventSlug: e.slug,
            title: e.title,
            sourceUrl: e.ticketUrl ?? e.sources[0],
            firstDate: ahead[0]!.date,
            payload: { dates: ahead.map((p) => `${p.date} ${p.time}`.trim()) },
            proposed: { action: "check-cancelled" },
            note: "The ticketing platform no longer lists this production. Cancelled, sold through another seller, or moved?",
          });
        }
      }
    }
  }
  plan.stats.queued = plan.queue.length;
  plan.stats.checks = plan.checks.length;
  return plan;
}
