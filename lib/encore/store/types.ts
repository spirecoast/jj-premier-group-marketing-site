import type { DatasetEvent, DatasetVenue } from "../collect/known";
import type { Availability } from "../collect/types";

/**
 * The calendar as stored (encore_* tables, or a snapshot file in local
 * development): the dataset's event shape plus what the collector keeps per
 * performance (status, availability, price, when it was checked) and the
 * events' images.
 */

export type PerfStatus = "scheduled" | "cancelled" | "postponed" | "removed";

export type StorePerformance = {
  id?: number;
  date: string;
  /** "" when the source gives no time. */
  time: string;
  status: PerfStatus;
  availability: Availability;
  priceMin?: number | null;
  priceMax?: number | null;
  currency?: string | null;
  ticketUrl?: string | null;
  checkedAt?: string | null;
};

export type StoreEvent = Omit<DatasetEvent, "performances"> & {
  performances: StorePerformance[];
  priceMin?: number | null;
  priceMax?: number | null;
  hidden?: boolean;
  sourceId?: string | null;
  externalId?: string | null;
  origin?: "seed" | "collector" | "review";
  /** The last time a source showed this event (a collect run). */
  lastSeenAt?: string | null;
  /** The last time any of its performances was read for status or price. */
  checkedAt?: string | null;
};

export type StoreImage = {
  eventSlug: string;
  imageSourceUrl: string;
  pageUrl?: string | null;
  credit: string;
  alt?: string | null;
  storagePath?: string | null;
  publicUrl?: string | null;
  width?: number | null;
  height?: number | null;
  sha256?: string | null;
  hidden?: boolean;
  error?: string | null;
  fetchedAt?: string | null;
};

export type EncoreSnapshot = {
  generatedAt: string;
  /** Where it came from: the database, a local snapshot file, or the bundled JSON. */
  origin: "db" | "file" | "json";
  venues: DatasetVenue[];
  events: StoreEvent[];
  images: StoreImage[];
};
