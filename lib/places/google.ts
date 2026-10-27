import "server-only";
import { sideEffectsAllowed } from "@/lib/deploy-env";
import { PlacesCapError, takeCall } from "./budget";
import { rank, type Period, type Place, type RawPlace } from "./rank";
import venueGeo from "./venue-geo.json";

/**
 * Google Places (the New API), fetched when someone asks and never stored:
 * Google's terms let a site keep place IDs and nothing else, so every list
 * is a live call and the response goes out with no-store.
 *
 * Asking for rating, review count, price, website, phone and hours puts
 * every call on the Enterprise SKU of Nearby Search or Text Search: 1,000
 * free calls a month on each, then about $35 per 1,000. Every call is
 * counted first and refused past the cap in ./budget.ts, which keeps both
 * inside the free tier.
 *
 * Without GOOGLE_MAPS_API_KEY, or without DATABASE_URL to keep the count,
 * both lists are hidden and the routes 404. The same on a preview
 * deployment (lib/deploy-env.ts): previews share production's key and its
 * daily count, so only production spends it.
 */

export const placesEnabled = (): boolean => Boolean(process.env.GOOGLE_MAPS_API_KEY && process.env.DATABASE_URL) && sideEffectsAllowed();

const BASE = "https://places.googleapis.com/v1/places";
const FIELDS = [
  "id",
  "displayName",
  "rating",
  "userRatingCount",
  "priceLevel",
  "shortFormattedAddress",
  "location",
  "googleMapsUri",
  "websiteUri",
  "nationalPhoneNumber",
  "regularOpeningHours",
  "businessStatus",
]
  .map((f) => `places.${f}`)
  .join(",");

/** Coordinates for Encore's venues, from the Census geocoder and OpenStreetMap. */
const GEO = venueGeo as Record<string, number[]> as Record<string, [number, number]>;
export const venueLatLng = (slug: string): [number, number] | undefined => GEO[slug];
/** The venues the Planner can search around, or undefined when Places is off. */
export const nearbyVenues = (): string[] | undefined => (placesEnabled() ? Object.keys(GEO) : undefined);

/** Around a show: where to eat, where to have a drink, where to stay. */
export const NIGHT = {
  dinner: { includedTypes: ["restaurant"], excludedTypes: ["fast_food_restaurant"], radius: 3000 },
  drinks: { includedTypes: ["bar"], excludedTypes: [] as string[], radius: 3000 },
  stay: { includedTypes: ["hotel", "resort_hotel", "bed_and_breakfast"], excludedTypes: [] as string[], radius: 10000 },
} as const;
export type NightKind = keyof typeof NIGHT;
export const isNightKind = (k: string): k is NightKind => k in NIGHT;

/** Help with a move, searched across the county. */
export const PROS = {
  movers: "moving company",
  painters: "house painter",
  handyman: "handyman",
  cleaners: "house cleaning service",
} as const;
export type ProKind = keyof typeof PROS;
export const isProKind = (k: string): k is ProKind => k in PROS;

type Box = { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } };
const box = (s: number, n: number, w: number, e: number): Box => ({ low: { latitude: s, longitude: w }, high: { latitude: n, longitude: e } });
/** County bounding boxes, from OpenStreetMap (relations 1210734 and 1210690). */
export const COUNTY_BOX = {
  sarasota: box(26.94536, 27.38979, -82.70544, -82.05669),
  manatee: box(27.20798, 27.64668, -82.82303, -82.05435),
  both: box(26.94536, 27.64668, -82.82303, -82.05435),
} as const;
export type CountyKey = keyof typeof COUNTY_BOX;
export const isCountyKey = (k: string): k is CountyKey => k in COUNTY_BOX;

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  shortFormattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: { periods?: Period[] };
  businessStatus?: string;
};

async function call(path: "searchNearby" | "searchText", body: object): Promise<RawPlace[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");
  const take = await takeCall(path === "searchNearby" ? "nearby" : "text");
  if (!take.ok) throw new PlacesCapError(take.reason);
  const res = await fetch(`${BASE}:${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
    body: JSON.stringify({ languageCode: "en", regionCode: "us", ...body }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const data = (await res.json().catch(() => ({}))) as { places?: GooglePlace[]; error?: { message?: string; status?: string } };
  if (!res.ok) throw new Error(`Places ${path} ${res.status}: ${data.error?.status ?? ""} ${data.error?.message ?? ""}`.trim());
  return (data.places ?? []).map((p) => ({
    id: p.id ?? "",
    name: p.displayName?.text ?? "",
    rating: p.rating,
    count: p.userRatingCount,
    priceLevel: p.priceLevel,
    address: p.shortFormattedAddress,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    mapsUri: p.googleMapsUri,
    website: p.websiteUri,
    phone: p.nationalPhoneNumber,
    status: p.businessStatus,
    periods: p.regularOpeningHours?.periods,
  }));
}

/** The best-rated places of one kind near a venue, open at the hour asked about. */
export async function nearVenue(venue: string, kind: NightKind, openAt?: { day: number; minutes: number }): Promise<Place[]> {
  const at = venueLatLng(venue);
  if (!at) return [];
  const k = NIGHT[kind];
  const raw = await call("searchNearby", {
    includedTypes: k.includedTypes,
    ...(k.excludedTypes.length ? { excludedTypes: k.excludedTypes } : {}),
    maxResultCount: 20,
    rankPreference: "POPULARITY",
    locationRestriction: { circle: { center: { latitude: at[0], longitude: at[1] }, radius: k.radius } },
  });
  return rank(raw, { from: at, openAt: kind === "stay" ? undefined : openAt });
}

/** The best-rated businesses of one kind in a county. */
export async function inCounty(county: CountyKey, kind: ProKind): Promise<Place[]> {
  const raw = await call("searchText", {
    textQuery: PROS[kind],
    pageSize: 20,
    minRating: 4,
    locationRestriction: { rectangle: COUNTY_BOX[county] },
  });
  return rank(raw);
}
