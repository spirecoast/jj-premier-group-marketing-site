import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { encoreChecks, encoreEvents, encoreImages, encorePerformances, encoreReviewQueue, encoreRuns, encoreSources, encoreVenues } from "@/lib/db/encore-schema";
import type { DatasetEvent, DatasetVenue } from "../collect/known";
import type { Plan } from "../collect/reconcile";
import type { SourceSpec } from "../collect/sources";
import { datasetToStore } from "./convert";
import type { EncoreStore, ReviewRow, RunKind, SourceResult, SourceState } from "./store";
import type { EncoreSnapshot, StoreEvent, StoreImage, StorePerformance } from "./types";

/** The encore_* tables over DATABASE_URL (Drizzle + postgres-js). */

const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);
const chunks = <T,>(rows: T[], n = 500): T[][] => Array.from({ length: Math.ceil(rows.length / n) }, (_, i) => rows.slice(i * n, i * n + n));

export function pgStore(db: Database): EncoreStore {
  return {
    kind: "pg",

    async load(): Promise<EncoreSnapshot> {
      const [venues, events, perfs, images] = await Promise.all([
        db.select().from(encoreVenues),
        db.select().from(encoreEvents),
        db.select().from(encorePerformances),
        db.select().from(encoreImages),
      ]);
      const byEvent = new Map<string, StorePerformance[]>();
      for (const p of perfs) {
        const list = byEvent.get(p.eventSlug) ?? [];
        list.push({
          id: p.id,
          date: p.date,
          time: p.time,
          status: p.status as StorePerformance["status"],
          availability: p.availability as StorePerformance["availability"],
          priceMin: p.priceMin,
          priceMax: p.priceMax,
          currency: p.currency,
          ticketUrl: p.ticketUrl,
          checkedAt: iso(p.checkedAt),
        });
        byEvent.set(p.eventSlug, list);
      }
      return {
        generatedAt: new Date().toISOString(),
        origin: "db",
        venues: venues.map((v) => ({
          key: v.key,
          name: v.name,
          type: v.type,
          address: v.address,
          city: v.city,
          market: v.market,
          website: v.website,
          eventsUrl: v.eventsUrl,
          residentCompanies: v.residentCompanies,
          notes: v.notes,
        })),
        events: events.map(
          (e): StoreEvent => ({
            slug: e.slug,
            title: e.title,
            presenter: e.presenter,
            market: e.market,
            category: e.category,
            siteCategory: e.siteCategory,
            subcategory: e.subcategory,
            venueKey: e.venueKey,
            venueName: e.venueName,
            room: e.room,
            city: e.city,
            startDate: e.startDate,
            endDate: e.endDate,
            startTime: e.startTime,
            recurrence: e.recurrence,
            price: e.price,
            priceMin: e.priceMin,
            priceMax: e.priceMax,
            ticketUrl: e.ticketUrl,
            sources: e.sources,
            description: e.description,
            status: e.status as StoreEvent["status"],
            notes: e.notes,
            hidden: e.hidden,
            sourceId: e.sourceId,
            externalId: e.externalId,
            origin: e.origin as StoreEvent["origin"],
            lastSeenAt: iso(e.lastSeenAt),
            checkedAt: iso(e.checkedAt),
            performances: (byEvent.get(e.slug) ?? []).sort((a, b) => `${a.date}|${a.time}`.localeCompare(`${b.date}|${b.time}`)),
          }),
        ),
        images: images.map((i) => ({
          eventSlug: i.eventSlug,
          imageSourceUrl: i.imageSourceUrl,
          pageUrl: i.pageUrl,
          credit: i.credit,
          alt: i.alt,
          storagePath: i.storagePath,
          publicUrl: i.publicUrl,
          width: i.width,
          height: i.height,
          sha256: i.sha256,
          hidden: i.hidden,
          error: i.error,
          fetchedAt: iso(i.fetchedAt),
        })),
      };
    },

    async sources(): Promise<SourceState[]> {
      const rows = await db.select().from(encoreSources);
      return rows.map((r) => ({
        id: r.id,
        domain: r.domain,
        adapter: r.adapter,
        config: r.config,
        frequency: r.frequency as SourceState["frequency"],
        presenter: r.presenter,
        venueKey: r.venueKey,
        enabled: r.enabled,
        lastRunAt: iso(r.lastRunAt),
        lastOkAt: iso(r.lastOkAt),
        lastError: r.lastError,
        lastErrorAt: iso(r.lastErrorAt),
        failures: r.failures,
        contentHash: r.contentHash,
        eventsFound: r.eventsFound,
        performancesFound: r.performancesFound,
        matched: r.matched,
        queued: r.queued,
        warnings: r.warnings,
      }));
    },

    async ensureSources(specs: SourceSpec[]) {
      if (!specs.length) return 0;
      const res = await db
        .insert(encoreSources)
        .values(specs.map((s) => ({ id: s.id, domain: s.domain, adapter: s.adapter, config: {}, frequency: s.frequency, presenter: s.presenter || null, venueKey: s.venueKey ?? null, enabled: s.enabled !== false })))
        .onConflictDoNothing()
        .returning({ id: encoreSources.id });
      return res.length;
    },

    async recordSource(id: string, r: SourceResult) {
      const at = new Date(r.at);
      if (r.ok) {
        await db
          .update(encoreSources)
          .set({
            lastRunAt: at,
            lastOkAt: at,
            failures: 0,
            contentHash: r.contentHash ?? sql`${encoreSources.contentHash}`,
            eventsFound: r.eventsFound,
            performancesFound: r.performancesFound,
            matched: r.matched,
            queued: r.queued,
            warnings: r.warnings.slice(0, 20),
            updatedAt: sql`now()`,
          })
          .where(eq(encoreSources.id, id));
      } else {
        await db
          .update(encoreSources)
          .set({ lastRunAt: at, lastError: r.error.slice(0, 2000), lastErrorAt: at, failures: sql`${encoreSources.failures} + 1`, updatedAt: sql`now()` })
          .where(eq(encoreSources.id, id));
      }
    },

    async settledFingerprints() {
      const rows = await db.select({ f: encoreReviewQueue.fingerprint }).from(encoreReviewQueue).where(ne(encoreReviewQueue.status, "pending"));
      return new Set(rows.map((r) => r.f));
    },

    async apply(plan: Plan, now: Date, run) {
      await db.transaction(async (tx) => {
        for (const group of chunks(plan.perfs.filter((w) => w.isNew))) {
          await tx
            .insert(encorePerformances)
            .values(
              group.map((w) => ({
                eventSlug: w.slug,
                date: w.date,
                time: w.time,
                status: w.status ?? "scheduled",
                availability: w.availability ?? "unknown",
                priceMin: w.priceMin ?? null,
                priceMax: w.priceMax ?? null,
                currency: w.currency ?? "USD",
                ticketUrl: w.ticketUrl ?? null,
                sourceUrl: w.sourceUrl ?? null,
                lastSeenAt: now,
              })),
            )
            .onConflictDoNothing();
        }
        for (const w of plan.perfs.filter((x) => !x.isNew)) {
          const set: Partial<typeof encorePerformances.$inferInsert> = { lastSeenAt: now, updatedAt: now };
          if (w.status) set.status = w.status;
          if (w.availability) set.availability = w.availability;
          if (w.priceMin !== undefined) set.priceMin = w.priceMin;
          if (w.priceMax !== undefined) set.priceMax = w.priceMax;
          if (w.ticketUrl !== undefined) set.ticketUrl = w.ticketUrl;
          if (w.newTime !== undefined) set.time = w.newTime;
          await tx
            .update(encorePerformances)
            .set(set)
            .where(and(eq(encorePerformances.eventSlug, w.slug), eq(encorePerformances.date, w.date), eq(encorePerformances.time, w.time)));
        }
        if (plan.checks.length) {
          const slugs = [...new Set(plan.checks.map((c) => c.slug))];
          const ids = await tx
            .select({ id: encorePerformances.id, slug: encorePerformances.eventSlug, date: encorePerformances.date, time: encorePerformances.time })
            .from(encorePerformances)
            .where(inArray(encorePerformances.eventSlug, slugs));
          const idOf = new Map(ids.map((r) => [`${r.slug}|${r.date}|${r.time}`, r.id]));
          const rows = plan.checks
            .map((c) => ({ c, id: idOf.get(`${c.slug}|${c.date}|${c.time}`) }))
            .filter((x): x is { c: (typeof plan.checks)[number]; id: number } => x.id !== undefined);
          for (const group of chunks(rows)) {
            await tx.insert(encoreChecks).values(
              group.map(({ c, id }) => ({
                performanceId: id,
                run,
                status: c.status,
                availability: c.availability,
                priceMin: c.priceMin ?? null,
                priceMax: c.priceMax ?? null,
                currency: c.currency ?? "USD",
                sourceUrl: c.sourceUrl ?? null,
                checkedAt: now,
              })),
            );
            await tx.update(encorePerformances).set({ checkedAt: now }).where(inArray(encorePerformances.id, group.map((g) => g.id)));
          }
          await tx.update(encoreEvents).set({ checkedAt: now }).where(inArray(encoreEvents.slug, slugs));
        }
        for (const p of plan.patches) {
          await tx
            .update(encoreEvents)
            .set({ ...p.set, updatedAt: now } as Partial<typeof encoreEvents.$inferInsert>)
            .where(eq(encoreEvents.slug, p.slug));
        }
        if (plan.seen.length && run === "collect") await tx.update(encoreEvents).set({ lastSeenAt: now }).where(inArray(encoreEvents.slug, plan.seen));
        for (const q of plan.queue) {
          await tx
            .insert(encoreReviewQueue)
            .values({
              kind: q.kind,
              fingerprint: q.fingerprint,
              sourceId: q.sourceId,
              eventSlug: q.eventSlug ?? null,
              title: q.title,
              sourceUrl: q.sourceUrl ?? null,
              firstDate: q.firstDate ?? null,
              payload: q.payload,
              proposed: q.proposed,
              note: q.note ?? null,
              lastSeenAt: now,
            })
            .onConflictDoUpdate({
              target: encoreReviewQueue.fingerprint,
              set: {
                seenCount: sql`${encoreReviewQueue.seenCount} + 1`,
                lastSeenAt: now,
                updatedAt: now,
                payload: sql`case when ${encoreReviewQueue.status} = 'pending' then excluded.payload else ${encoreReviewQueue.payload} end`,
                proposed: sql`case when ${encoreReviewQueue.status} = 'pending' then excluded.proposed else ${encoreReviewQueue.proposed} end`,
                firstDate: sql`case when ${encoreReviewQueue.status} = 'pending' then excluded.first_date else ${encoreReviewQueue.firstDate} end`,
              },
            });
        }
      });
    },

    async setImage(img: StoreImage) {
      const values = {
        eventSlug: img.eventSlug,
        imageSourceUrl: img.imageSourceUrl,
        pageUrl: img.pageUrl ?? null,
        credit: img.credit,
        alt: img.alt ?? null,
        storagePath: img.storagePath ?? null,
        publicUrl: img.publicUrl ?? null,
        width: img.width ?? null,
        height: img.height ?? null,
        sha256: img.sha256 ?? null,
        error: img.error ?? null,
        fetchedAt: img.fetchedAt ? new Date(img.fetchedAt) : new Date(),
      };
      // `hidden` is a person's decision: never touched here.
      const { eventSlug: _slug, ...rest } = values;
      await db
        .insert(encoreImages)
        .values(values)
        .onConflictDoUpdate({ target: encoreImages.eventSlug, set: { ...rest, updatedAt: sql`now()` } });
    },

    async queueImages(cands) {
      if (!cands.length) return 0;
      let n = 0;
      for (const group of chunks(cands, 200)) {
        const res = await db
          .insert(encoreImages)
          .values(group.map((c) => ({ eventSlug: c.slug, imageSourceUrl: c.imageUrl ?? "", pageUrl: c.pageUrl, credit: c.credit })))
          .onConflictDoUpdate({
            target: encoreImages.eventSlug,
            set: { imageSourceUrl: sql`excluded.image_source_url`, pageUrl: sql`excluded.page_url`, credit: sql`excluded.credit`, fetchedAt: null, error: null, updatedAt: sql`now()` },
            // A new image from the source, or (still without one) a better page to look on.
            setWhere: sql`${encoreImages.hidden} = false and ((excluded.image_source_url <> '' and excluded.image_source_url <> ${encoreImages.imageSourceUrl}) or (${encoreImages.publicUrl} is null and excluded.image_source_url = '' and excluded.page_url is distinct from ${encoreImages.pageUrl}))`,
          })
          .returning({ slug: encoreImages.eventSlug });
        n += res.length;
      }
      return n;
    },

    async pendingImages(limit) {
      const rows = await db
        .select()
        .from(encoreImages)
        .where(sql`${encoreImages.hidden} = false and (${encoreImages.fetchedAt} is null or (${encoreImages.error} is not null and ${encoreImages.fetchedAt} < now() - interval '7 days'))`)
        .limit(limit);
      return rows.map((i) => ({
        eventSlug: i.eventSlug,
        imageSourceUrl: i.imageSourceUrl,
        pageUrl: i.pageUrl,
        credit: i.credit,
        alt: i.alt,
        storagePath: i.storagePath,
        publicUrl: i.publicUrl,
        width: i.width,
        height: i.height,
        sha256: i.sha256,
        hidden: i.hidden,
        error: i.error,
        fetchedAt: iso(i.fetchedAt),
      }));
    },

    async review(status = "pending", limit = 200): Promise<ReviewRow[]> {
      const rows = await db.select().from(encoreReviewQueue).where(eq(encoreReviewQueue.status, status)).orderBy(encoreReviewQueue.firstDate).limit(limit);
      return rows.map((r) => ({
        id: r.id,
        kind: r.kind as ReviewRow["kind"],
        status: r.status as ReviewRow["status"],
        fingerprint: r.fingerprint,
        sourceId: r.sourceId ?? "",
        eventSlug: r.eventSlug ?? undefined,
        title: r.title,
        sourceUrl: r.sourceUrl ?? undefined,
        firstDate: r.firstDate ?? undefined,
        payload: r.payload,
        proposed: r.proposed,
        note: r.note ?? undefined,
        seenCount: r.seenCount,
        createdAt: r.createdAt.toISOString(),
        lastSeenAt: r.lastSeenAt.toISOString(),
      }));
    },

    async startRun(kind: RunKind) {
      const [row] = await db.insert(encoreRuns).values({ kind }).returning({ id: encoreRuns.id });
      return row!.id;
    },

    async finishRun(id, r) {
      await db
        .update(encoreRuns)
        .set({ finishedAt: sql`now()`, sources: r.sources, remaining: r.remaining ?? null, stats: r.stats, error: r.error ?? null })
        .where(eq(encoreRuns.id, id));
    },

    async lastRuns(limit = 10) {
      const rows = await db.select().from(encoreRuns).orderBy(desc(encoreRuns.startedAt)).limit(limit);
      return rows.map((r) => ({ id: r.id, kind: r.kind, startedAt: r.startedAt.toISOString(), finishedAt: iso(r.finishedAt), sources: r.sources, remaining: r.remaining, stats: r.stats, error: r.error }));
    },

    async seed(input: { venues: DatasetVenue[]; events: DatasetEvent[] }, specs: SourceSpec[], sourceOf) {
      const data = datasetToStore(input);
      const nSources = await this.ensureSources(specs);
      for (const group of chunks(data.venues, 200)) {
        await db
          .insert(encoreVenues)
          .values(group.map((v) => ({ key: v.key, name: v.name!, type: v.type, address: v.address, city: v.city, market: v.market, website: v.website, eventsUrl: v.eventsUrl, residentCompanies: v.residentCompanies ?? [], notes: v.notes })))
          .onConflictDoNothing();
      }
      const known = new Set((await db.select({ key: encoreVenues.key }).from(encoreVenues)).map((r) => r.key));
      const ids = new Set(specs.map((s) => s.id));
      // Events the collector already keeps are left alone; the seed only adds what is missing.
      for (const group of chunks(data.events, 200)) {
        await db
          .insert(encoreEvents)
          .values(
            group.map((e) => {
              const src = sourceOf(input.events.find((x) => x.slug === e.slug)!);
              return {
                slug: e.slug,
                title: e.title,
                presenter: e.presenter,
                market: e.market,
                category: e.category,
                siteCategory: e.siteCategory,
                subcategory: e.subcategory,
                venueKey: e.venueKey && known.has(e.venueKey) ? e.venueKey : null,
                venueName: e.venueName,
                room: e.room,
                city: e.city,
                startDate: e.startDate,
                endDate: e.endDate,
                startTime: e.startTime,
                recurrence: e.recurrence,
                price: e.price,
                priceMin: e.priceMin ?? null,
                priceMax: e.priceMax ?? null,
                ticketUrl: e.ticketUrl,
                sources: e.sources,
                description: e.description,
                status: e.status,
                notes: e.notes,
                sourceId: src && ids.has(src) ? src : null,
                origin: "seed",
              };
            }),
          )
          .onConflictDoNothing();
      }
      let perfs = 0;
      const rows = data.events.flatMap((e) => e.performances.map((p) => ({ eventSlug: e.slug, date: p.date, time: p.time, status: p.status, availability: p.availability })));
      for (const group of chunks(rows, 500)) {
        const res = await db.insert(encorePerformances).values(group).onConflictDoNothing().returning({ id: encorePerformances.id });
        perfs += res.length;
      }
      return { venues: data.venues.length, events: data.events.length, performances: perfs, sources: nSources };
    },
  };
}
