import type { DatasetEvent, DatasetVenue } from "../collect/known";
import { parsePrice } from "../collect/price";
import type { EncoreSnapshot, StoreEvent } from "./types";

/** The dataset (JSON) as stored rows: every performance scheduled, availability unknown, sold-out productions sold out. */
export function datasetToStore(data: { venues: DatasetVenue[]; events: DatasetEvent[] }): { venues: DatasetVenue[]; events: StoreEvent[] } {
  return {
    venues: data.venues.filter((v) => v.name).map((v) => ({ ...v, residentCompanies: v.residentCompanies ?? [] })),
    events: data.events.map((e) => {
      const p = parsePrice(e.price);
      return {
        ...e,
        priceMin: p.min ?? null,
        priceMax: p.max ?? null,
        hidden: false,
        origin: "seed",
        performances: e.performances.map((x) => ({
          date: x.date,
          time: x.time ?? "",
          status: "scheduled" as const,
          availability: e.status === "sold-out" ? ("sold-out" as const) : ("unknown" as const),
        })),
      };
    }),
  };
}

/** The bundled JSON as a snapshot: what the site shows when the database can't be reached. */
export function jsonSnapshot(data: { venues: DatasetVenue[]; events: DatasetEvent[]; generatedAt?: string }): EncoreSnapshot {
  const s = datasetToStore(data);
  return { generatedAt: data.generatedAt ?? new Date(0).toISOString(), origin: "json", venues: s.venues, events: s.events, images: [] };
}
