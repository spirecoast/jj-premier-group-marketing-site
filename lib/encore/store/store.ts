import type { Plan, QueueItem } from "../collect/reconcile";
import type { SourceSpec } from "../collect/sources";
import type { DatasetEvent, DatasetVenue } from "../collect/known";
import type { EncoreSnapshot, StoreImage } from "./types";

/**
 * Where the calendar lives. Two implementations: Postgres over DATABASE_URL
 * (store/pg.ts, production) and a JSON file (store/file.ts, local runs and
 * tests). The collector, the seed and the site only talk to this.
 */

export type SourceState = {
  id: string;
  domain: string;
  adapter: string;
  config: Record<string, unknown>;
  frequency: "daily" | "weekly" | "monthly" | "manual";
  presenter: string | null;
  venueKey: string | null;
  enabled: boolean;
  lastRunAt: string | null;
  lastOkAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  failures: number;
  contentHash: string | null;
  eventsFound: number | null;
  performancesFound: number | null;
  matched: number | null;
  queued: number | null;
  warnings: string[];
};

export type SourceResult =
  | { ok: true; at: string; contentHash?: string; eventsFound: number; performancesFound: number; matched: number; queued: number; warnings: string[] }
  | { ok: false; at: string; error: string };

export type ReviewRow = QueueItem & { id: number; status: "pending" | "approved" | "rejected" | "merged"; seenCount: number; createdAt: string; lastSeenAt: string };

export type RunKind = "collect" | "check" | "seed" | "images";

export interface EncoreStore {
  readonly kind: "pg" | "file";
  /** Everything the site and the collector read: venues, events (hidden ones too), performances, images. */
  load(): Promise<EncoreSnapshot>;
  sources(): Promise<SourceState[]>;
  /** Insert sources that are not stored yet; stored rows keep their config and state. */
  ensureSources(specs: SourceSpec[]): Promise<number>;
  recordSource(id: string, result: SourceResult): Promise<void>;
  /** Fingerprints a person has approved, rejected or merged. */
  settledFingerprints(): Promise<Set<string>>;
  apply(plan: Plan, now: Date, run: "collect" | "check"): Promise<void>;
  setImage(img: StoreImage): Promise<void>;
  /** Note image candidates: a new event, or a source image URL that changed. Hidden images are left alone. */
  queueImages(cands: { slug: string; imageUrl?: string; pageUrl: string; credit: string }[]): Promise<number>;
  /** Images to fetch: never fetched, or failed more than a week ago. */
  pendingImages(limit: number): Promise<StoreImage[]>;
  review(status?: ReviewRow["status"], limit?: number): Promise<ReviewRow[]>;
  startRun(kind: RunKind): Promise<number>;
  finishRun(id: number, r: { sources: number; remaining?: number; stats: Record<string, unknown>; error?: string }): Promise<void>;
  lastRuns(limit?: number): Promise<{ id: number; kind: string; startedAt: string; finishedAt: string | null; sources: number; remaining: number | null; stats: Record<string, unknown>; error: string | null }[]>;
  /** Load the dataset (upserting; nothing is deleted). Returns row counts. */
  seed(data: { venues: DatasetVenue[]; events: DatasetEvent[] }, sources: SourceSpec[], sourceOf: (e: DatasetEvent) => string | undefined): Promise<{ venues: number; events: number; performances: number; sources: number }>;
  close?(): Promise<void>;
}

/** Is a source due? Weekly sources once every six days, monthly every 27, daily every 20 hours; manual never. */
export function isDue(s: Pick<SourceState, "frequency" | "lastRunAt" | "enabled" | "adapter">, now: Date): boolean {
  if (!s.enabled || s.frequency === "manual" || s.adapter === "manual") return false;
  if (!s.lastRunAt) return true;
  const hours = (now.getTime() - Date.parse(s.lastRunAt)) / 3_600_000;
  return hours >= (s.frequency === "daily" ? 20 : s.frequency === "weekly" ? 6 * 24 : 27 * 24);
}
