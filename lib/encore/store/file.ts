import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { CheckWrite, Plan } from "../collect/reconcile";
import type { SourceSpec } from "../collect/sources";
import { datasetToStore } from "./convert";
import type { EncoreStore, ReviewRow, RunKind, SourceResult, SourceState } from "./store";
import type { EncoreSnapshot, StoreImage } from "./types";

/**
 * The store as one JSON file: for running the collector and the site
 * locally without a database (ENCORE_SNAPSHOT_FILE), and for tests (no
 * path: memory only). Same behaviour as the Postgres store.
 */
type FileData = EncoreSnapshot & {
  sources: SourceState[];
  queue: ReviewRow[];
  checks: (CheckWrite & { run: string; at: string })[];
  runs: { id: number; kind: string; startedAt: string; finishedAt: string | null; sources: number; remaining: number | null; stats: Record<string, unknown>; error: string | null }[];
};

const empty = (): FileData => ({ generatedAt: new Date(0).toISOString(), origin: "file", venues: [], events: [], images: [], sources: [], queue: [], checks: [], runs: [] });

export function fileStore(path?: string): EncoreStore & { data: () => FileData } {
  let data: FileData = path && existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as FileData) : empty();
  const save = () => {
    data.generatedAt = new Date().toISOString();
    if (!path) return;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(data));
  };
  const nextId = (rows: { id: number }[]) => rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  return {
    kind: "file",
    data: () => data,
    async load() {
      return structuredClone({ generatedAt: data.generatedAt, origin: "file" as const, venues: data.venues, events: data.events, images: data.images });
    },
    async sources() {
      return structuredClone(data.sources);
    },
    async ensureSources(specs: SourceSpec[]) {
      let n = 0;
      for (const s of specs) {
        if (data.sources.some((x) => x.id === s.id)) continue;
        data.sources.push({
          id: s.id,
          domain: s.domain,
          adapter: s.adapter,
          config: {},
          frequency: s.frequency,
          presenter: s.presenter || null,
          venueKey: s.venueKey ?? null,
          enabled: s.enabled !== false,
          lastRunAt: null,
          lastOkAt: null,
          lastError: null,
          lastErrorAt: null,
          failures: 0,
          contentHash: null,
          eventsFound: null,
          performancesFound: null,
          matched: null,
          queued: null,
          warnings: [],
        });
        n += 1;
      }
      save();
      return n;
    },
    async recordSource(id: string, r: SourceResult) {
      const s = data.sources.find((x) => x.id === id);
      if (!s) return;
      s.lastRunAt = r.at;
      if (r.ok) {
        Object.assign(s, { lastOkAt: r.at, failures: 0, contentHash: r.contentHash ?? s.contentHash, eventsFound: r.eventsFound, performancesFound: r.performancesFound, matched: r.matched, queued: r.queued, warnings: r.warnings });
      } else {
        Object.assign(s, { lastError: r.error, lastErrorAt: r.at, failures: s.failures + 1 });
      }
      save();
    },
    async settledFingerprints() {
      return new Set(data.queue.filter((q) => q.status !== "pending").map((q) => q.fingerprint));
    },
    async apply(plan: Plan, now: Date, run) {
      const at = now.toISOString();
      const ev = new Map(data.events.map((e) => [e.slug, e]));
      for (const w of plan.perfs) {
        const e = ev.get(w.slug);
        if (!e) continue;
        let p = e.performances.find((x) => x.date === w.date && x.time === w.time);
        if (!p) {
          p = { date: w.date, time: w.time, status: "scheduled", availability: "unknown" };
          e.performances.push(p);
          e.performances.sort((a, b) => `${a.date}|${a.time}`.localeCompare(`${b.date}|${b.time}`));
        }
        if (w.status) p.status = w.status;
        if (w.availability) p.availability = w.availability;
        if (w.priceMin !== undefined) p.priceMin = w.priceMin;
        if (w.priceMax !== undefined) p.priceMax = w.priceMax;
        if (w.ticketUrl !== undefined) p.ticketUrl = w.ticketUrl;
        if (w.currency) p.currency = w.currency;
        if (w.newTime !== undefined) p.time = w.newTime;
      }
      for (const c of plan.checks) {
        const p = ev.get(c.slug)?.performances.find((x) => x.date === c.date && x.time === c.time);
        if (p) p.checkedAt = at;
        data.checks.push({ ...c, run, at });
      }
      for (const slug of new Set(plan.checks.map((c) => c.slug))) {
        const e = ev.get(slug);
        if (e) e.checkedAt = at;
      }
      for (const patch of plan.patches) {
        const e = ev.get(patch.slug);
        if (e) Object.assign(e, patch.set);
      }
      for (const slug of plan.seen) {
        const e = ev.get(slug);
        if (e) e.lastSeenAt = at;
      }
      for (const q of plan.queue) {
        const prev = data.queue.find((x) => x.fingerprint === q.fingerprint);
        if (prev) {
          prev.seenCount += 1;
          prev.lastSeenAt = at;
          if (prev.status === "pending") Object.assign(prev, { payload: q.payload, proposed: q.proposed, firstDate: q.firstDate, title: q.title, note: q.note });
        } else data.queue.push({ ...q, id: nextId(data.queue), status: "pending", seenCount: 1, createdAt: at, lastSeenAt: at });
      }
      save();
    },
    async setImage(img: StoreImage) {
      const i = data.images.findIndex((x) => x.eventSlug === img.eventSlug);
      if (i >= 0) data.images[i] = { ...data.images[i], ...img, hidden: data.images[i]!.hidden };
      else data.images.push(img);
      save();
    },
    async queueImages(cands) {
      let n = 0;
      for (const c of cands) {
        const row = data.images.find((x) => x.eventSlug === c.slug);
        if (row?.hidden) continue;
        if (!row) {
          data.images.push({ eventSlug: c.slug, imageSourceUrl: c.imageUrl ?? "", pageUrl: c.pageUrl, credit: c.credit, fetchedAt: null });
          n += 1;
        } else if ((c.imageUrl && c.imageUrl !== row.imageSourceUrl) || (!c.imageUrl && !row.publicUrl && c.pageUrl !== row.pageUrl)) {
          Object.assign(row, { imageSourceUrl: c.imageUrl, pageUrl: c.pageUrl, credit: c.credit, fetchedAt: null, error: null });
          n += 1;
        }
      }
      save();
      return n;
    },
    async pendingImages(limit) {
      const weekAgo = Date.now() - 7 * 86_400_000;
      return structuredClone(data.images.filter((i) => !i.hidden && (!i.fetchedAt || (i.error && Date.parse(i.fetchedAt) < weekAgo))).slice(0, limit));
    },
    async review(status = "pending", limit = 200) {
      return structuredClone(data.queue.filter((q) => q.status === status).slice(0, limit));
    },
    async startRun(kind: RunKind) {
      const id = nextId(data.runs);
      data.runs.push({ id, kind, startedAt: new Date().toISOString(), finishedAt: null, sources: 0, remaining: null, stats: {}, error: null });
      save();
      return id;
    },
    async finishRun(id, r) {
      const run = data.runs.find((x) => x.id === id);
      if (run) Object.assign(run, { finishedAt: new Date().toISOString(), sources: r.sources, remaining: r.remaining ?? null, stats: r.stats, error: r.error ?? null });
      save();
    },
    async lastRuns(limit = 10) {
      return structuredClone(data.runs.slice(-limit).reverse());
    },
    async seed(input, specs, sourceOf) {
      const converted = datasetToStore(input);
      const ev = new Map(data.events.map((e) => [e.slug, e]));
      for (const v of converted.venues) {
        const i = data.venues.findIndex((x) => x.key === v.key);
        if (i >= 0) data.venues[i] = v;
        else data.venues.push(v);
      }
      let perfs = 0;
      for (const e of converted.events) {
        perfs += e.performances.length;
        const prev = ev.get(e.slug);
        if (prev) continue; // the seed never overwrites what the collector has kept current
        data.events.push({ ...e, sourceId: sourceOf(input.events.find((x) => x.slug === e.slug)!) ?? null });
      }
      const n = await this.ensureSources(specs);
      save();
      return { venues: converted.venues.length, events: converted.events.length, performances: perfs, sources: n };
    },
  };
}
