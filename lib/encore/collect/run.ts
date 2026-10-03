import type { EncoreStore, SourceState } from "../store/store";
import { isDue } from "../store/store";
import type { StoreEvent } from "../store/types";
import { ADAPTERS } from "./adapters";
import { addDays, todayLocal } from "./dates";
import { politeFetcher } from "./http";
import { imageFromPage, looksLikeArt, processImage, type ImageSink } from "./images";
import { knownForSource, type DatasetEvent } from "./known";
import { reconcile } from "./reconcile";
import { SOURCES, type SourceSpec } from "./sources";
import type { Fetcher } from "./types";
import { isTicketingUrl } from "./util";

/**
 * One collector invocation, shared by the routes (app/api/encore/collect
 * and /check) and scripts/encore-collect.ts.
 *
 *  - collect: every source that is due (weekly ones after six days, monthly
 *    after 27), oldest first, a few hosts at a time. Each source's results
 *    are reconciled and applied on their own, so a run cut short by the
 *    deadline keeps what it finished; the rest are still due next time.
 *    Then the images that are waiting, while time is left.
 *  - check: the sources with performances in the next 21 days, read again
 *    for status and price only (no discovery, no images). `cursor` resumes
 *    a check run that ran out of time.
 *
 * A source whose content hash hasn't changed since its last good run is
 * marked checked and skipped (collect mode only).
 */

export type RunOptions = {
  store: EncoreStore;
  mode: "collect" | "check";
  /** Stop starting new work after this (ms epoch). */
  deadline: number;
  fetcher?: Fetcher;
  images?: ImageSink | null;
  /** Only these source ids (and ignore whether they are due). */
  only?: string[];
  /** check mode: resume after this source id. */
  cursor?: string;
  concurrency?: number;
  now?: Date;
  log?: (m: string) => void;
};

export type RunResult = {
  mode: "collect" | "check";
  processed: { id: string; ok: boolean; events?: number; matched?: number; queued?: number; added?: number; changed?: number; removed?: number; checks?: number; unchanged?: boolean; error?: string; seconds: number }[];
  /** Sources still due (collect) or left in this check pass, plus images waiting. */
  remaining: number;
  remainingImages: number;
  cursor?: string;
  images: { stored: number; failed: number };
  requests: number;
};

/** The code's source definitions with each stored row's overrides (config, frequency, enabled). */
export function effectiveSources(states: SourceState[]): (SourceSpec & { state?: SourceState })[] {
  const byId = new Map(states.map((s) => [s.id, s]));
  return SOURCES.map((spec) => {
    const st = byId.get(spec.id);
    return st
      ? { ...spec, config: { ...spec.config, ...(st.config ?? {}) }, frequency: st.frequency, enabled: st.enabled, venueKey: st.venueKey ?? spec.venueKey, state: st }
      : { ...spec };
  });
}

function asDataset(events: StoreEvent[]): DatasetEvent[] {
  return events.map((e) => ({ ...e, performances: e.performances.filter((p) => p.status !== "removed").map((p) => ({ date: p.date, time: p.time || null })) }));
}

/** Image candidates for current events that have never had one: the event's own page, credited to its presenter. */
export function missingImages(events: StoreEvent[], tried: Set<string>, today: string) {
  return events
    .filter((e) => !e.hidden && !tried.has(e.slug) && ((e.endDate ?? e.startDate) >= today || e.performances.some((p) => p.date >= today)))
    .map((e) => {
      const pageUrl = e.sources.find((u) => !isTicketingUrl(u)) ?? e.sources[0] ?? e.ticketUrl;
      return pageUrl ? { slug: e.slug, pageUrl, credit: e.presenter || e.venueName || new URL(pageUrl).hostname.replace(/^www\./, "") } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}

/** Sources with any performance (or open run) in [today, today+days]. */
export function sourcesWithUpcoming(sources: SourceSpec[], events: StoreEvent[], today: string, days: number): SourceSpec[] {
  const until = addDays(today, days);
  const ds = asDataset(events.filter((e) => !e.hidden && e.status !== "announced"));
  return sources.filter((s) =>
    knownForSource(s, ds).some((k) => {
      const e = ds.find((x) => x.slug === k.slug)!;
      return e.performances.some((p) => p.date >= today && p.date <= until);
    }),
  );
}

async function withDeadline<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const t = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: out of time`)), Math.max(1000, ms));
  });
  try {
    return await Promise.race([p, t]);
  } finally {
    clearTimeout(timer);
  }
}

export async function runCollector(opts: RunOptions): Promise<RunResult> {
  const now = opts.now ?? new Date();
  const today = todayLocal(now.getTime());
  const log = opts.log ?? (() => {});
  const store = opts.store;
  const fetcher = opts.fetcher ?? politeFetcher();
  await store.ensureSources(SOURCES);
  const [states, snapshot] = await Promise.all([store.sources(), store.load()]);
  const all = effectiveSources(states).filter((s) => s.adapter !== "manual" && ADAPTERS[s.adapter]);
  let queue: (SourceSpec & { state?: SourceState })[];
  let cursor: string | undefined;
  if (opts.only?.length) queue = all.filter((s) => opts.only!.includes(s.id));
  else if (opts.mode === "collect")
    queue = all
      .filter((s) => s.enabled !== false && s.state && isDue({ ...s.state, enabled: true, frequency: s.frequency }, now))
      .sort((a, b) => (a.state?.lastRunAt ?? "").localeCompare(b.state?.lastRunAt ?? ""));
  else {
    queue = sourcesWithUpcoming(all.filter((s) => s.enabled !== false), snapshot.events, today, 21).sort((a, b) => a.id.localeCompare(b.id));
    if (opts.cursor) queue = queue.filter((s) => s.id > opts.cursor!);
  }
  const settled = opts.mode === "collect" ? await store.settledFingerprints() : new Set<string>();
  const result: RunResult = { mode: opts.mode, processed: [], remaining: 0, remainingImages: 0, images: { stored: 0, failed: 0 }, requests: 0 };
  const pending = [...queue];
  const done = new Set<string>();
  // Sources on the same host run one after another (the fetcher spaces requests per host anyway).
  const busyHosts = new Set<string>();

  async function one(source: SourceSpec & { state?: SourceState }) {
    const started = Date.now();
    const adapter = ADAPTERS[source.adapter]!;
    const at = new Date().toISOString();
    try {
      const known = knownForSource(source, asDataset(snapshot.events));
      const res = await withDeadline(
        adapter.collect(source, { fetch: fetcher, known, mode: opts.mode, today, log, deadline: opts.deadline }),
        // No one source may hold the run: four minutes each at most.
        Math.min(opts.deadline - Date.now() + 15_000, 4 * 60_000),
        source.id,
      );
      const unchanged = opts.mode === "collect" && Boolean(res.contentHash) && res.contentHash === source.state?.contentHash && Boolean(source.state?.lastOkAt);
      const plan = reconcile({ source, collected: res.events, events: snapshot.events, venues: snapshot.venues, today, mode: opts.mode, settled });
      if (!unchanged || plan.perfs.length || plan.patches.length) {
        await store.apply(plan, new Date(), opts.mode);
        if (opts.mode === "collect") await store.queueImages(plan.images.filter((i) => !i.imageUrl || looksLikeArt(i.imageUrl)));
      } else if (plan.checks.length) {
        await store.apply({ ...plan, queue: [], images: [], patches: [], perfs: [] }, new Date(), opts.mode);
      }
      if (opts.mode === "collect")
        await store.recordSource(source.id, { ok: true, at, contentHash: res.contentHash, eventsFound: res.events.length, performancesFound: res.events.reduce((n, e) => n + e.performances.length, 0), matched: plan.stats.matched, queued: plan.stats.queued, warnings: res.warnings });
      result.processed.push({
        id: source.id,
        ok: true,
        events: res.events.length,
        matched: plan.stats.matched,
        queued: plan.stats.queued,
        added: plan.stats.perfsAdded,
        changed: plan.stats.perfsChanged,
        removed: plan.stats.perfsRemoved,
        checks: plan.stats.checks,
        unchanged,
        seconds: Math.round((Date.now() - started) / 1000),
      });
      log(`${source.id}: ${res.events.length} found, ${plan.stats.matched} matched, ${plan.stats.queued} to review, +${plan.stats.perfsAdded}/~${plan.stats.perfsChanged}/-${plan.stats.perfsRemoved} dates${unchanged ? " (unchanged)" : ""}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await store.recordSource(source.id, { ok: false, at, error: message }).catch(() => undefined);
      result.processed.push({ id: source.id, ok: false, error: message, seconds: Math.round((Date.now() - started) / 1000) });
      log(`${source.id}: FAILED ${message}`);
    } finally {
      done.add(source.id);
    }
  }

  const concurrency = opts.concurrency ?? 6;
  const running = new Set<Promise<void>>();
  while (pending.length && Date.now() < opts.deadline) {
    const i = pending.findIndex((s) => !busyHosts.has(s.domain));
    if (running.size >= concurrency || i < 0) {
      await Promise.race(running);
      continue;
    }
    const source = pending.splice(i, 1)[0]!;
    busyHosts.add(source.domain);
    const p = one(source).finally(() => {
      busyHosts.delete(source.domain);
      running.delete(p);
    });
    running.add(p);
  }
  await Promise.all(running);
  result.remaining = pending.length;
  if (opts.mode === "check" && pending.length) cursor = [...done].sort().pop();
  result.cursor = cursor;

  // Images, while there is time.
  if (opts.mode === "collect" && opts.images) {
    // Events no source run has offered an image for (sources without an adapter, events the
    // collector didn't match): look on the event's own page.
    const tried = new Set(snapshot.images.map((i) => i.eventSlug));
    await store.queueImages(missingImages(snapshot.events, tried, today));
    const waiting = await store.pendingImages(400);
    const titles = new Map(snapshot.events.map((e) => [e.slug, e.title]));
    const sink = opts.images;
    // Several at once: the fetcher still spaces requests to any one host.
    const work = [...waiting];
    const worker = async () => {
      for (let img = work.shift(); img; img = work.shift()) {
        if (Date.now() > opts.deadline) return;
        try {
          let url = img.imageSourceUrl;
          if (!looksLikeArt(url) && img.pageUrl) url = (await imageFromPage(img.pageUrl, fetcher, titles.get(img.eventSlug))) ?? "";
          if (!url) throw new Error("no image on the event's page");
          let out;
          try {
            out = await processImage({ slug: img.eventSlug, url, fetch: fetcher, sink });
          } catch (err) {
            // A listing's thumbnail is often too small; the event's own page usually has the full image.
            const small = err instanceof Error && err.message.startsWith("image too small");
            const better = small && img.pageUrl ? await imageFromPage(img.pageUrl, fetcher, titles.get(img.eventSlug)) : undefined;
            if (!better || better === url) throw err;
            url = better;
            out = await processImage({ slug: img.eventSlug, url, fetch: fetcher, sink });
          }
          if (img.storagePath && img.storagePath !== out.storagePath) await sink.remove?.(img.storagePath).catch(() => undefined);
          await store.setImage({ ...img, imageSourceUrl: url, alt: titles.get(img.eventSlug) ?? null, ...out, error: null, fetchedAt: new Date().toISOString() });
          result.images.stored += 1;
        } catch (err) {
          await store.setImage({ ...img, error: (err instanceof Error ? err.message : String(err)).slice(0, 300), fetchedAt: new Date().toISOString() });
          result.images.failed += 1;
        }
      }
    };
    await Promise.all(Array.from({ length: opts.concurrency ?? 6 }, worker));
    result.remainingImages = (await store.pendingImages(1000)).length;
  }
  result.requests = (fetcher as Fetcher & { requests?: () => number }).requests?.() ?? 0;
  return result;
}
