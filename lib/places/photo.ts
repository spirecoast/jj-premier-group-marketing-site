import { PLACES_CAP, PLACES_VISITOR_CAP, type CapReason, type Take } from "./caps";

/**
 * A thumbnail for each place in the Planner's Nearby lists, from Google's
 * Place Photos (billed on its own SKU, "Place Details Photos": 1,000 free a
 * month, then about $7 per 1,000). The pure side, tested on its own
 * (photo.test.ts): which photo names may be asked for, whether a list gets
 * its photos at all, and the order a photo is counted and fetched in, so
 * nothing reaches Google without a count and every failure means no photo.
 *
 * Google's terms: a photo name can't be cached and can expire, so names go
 * from the list straight to the browser and are asked for at once; the
 * photo itself is never stored here (the browser is sent to Google's own
 * copy, cached only as Google's headers allow); the author is credited
 * beside it; and the photo's own page on Google Maps is one tap away.
 */

/** One photo of a place: the name to ask Google for, who took it, and the photo's page on Google Maps. */
export type PlacePhoto = { name: string; authors: { name: string; uri?: string }[]; mapsUri?: string };

/** Google's photo, as Nearby Search returns it in `places.photos`. */
export type GooglePhoto = {
  name?: string;
  authorAttributions?: { displayName?: string; uri?: string }[];
  googleMapsUri?: string;
};

/**
 * The size asked of Google, on each side. The thumbnail is 64px square
 * (components/places/place-tabs.tsx), so a 2x screen needs 128 on its
 * shorter side; 240 keeps a wide photo (240×135) above that, and a tall one
 * comes back 180×240 instead of something larger.
 */
export const PHOTO_PX = 240;

const NAME = /^places\/[A-Za-z0-9_-]{1,256}\/photos\/[A-Za-z0-9_-]{1,1024}$/;

/** A photo name in Google's shape (places/{place}/photos/{photo}); nothing else is ever sent on. */
export const isPhotoName = (s: unknown): s is string => typeof s === "string" && NAME.test(s);

const https = (s: unknown): string | undefined => {
  if (typeof s !== "string") return undefined;
  try {
    return new URL(s).protocol === "https:" ? s : undefined;
  } catch {
    return undefined;
  }
};

/** The first usable photo of a place, with its credit; undefined when Google has none. */
export function firstPhoto(photos: GooglePhoto[] | undefined): PlacePhoto | undefined {
  const p = photos?.find((x) => isPhotoName(x.name));
  if (!p) return undefined;
  const authors = (p.authorAttributions ?? []).flatMap((a) => (a.displayName?.trim() ? [{ name: a.displayName.trim(), uri: https(a.uri) }] : []));
  return { name: p.name!, authors, mapsUri: https(p.googleMapsUri) };
}

/** Where the server asks Google for a photo: the JSON answer (skipHttpRedirect) so the key never travels with the image. */
export function photoMediaUrl(name: string): string {
  return `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${PHOTO_PX}&maxHeightPx=${PHOTO_PX}&skipHttpRedirect=true`;
}

/** Only an https image on Google's own content host is passed to the browser. */
export function isGooglePhotoUri(s: unknown): s is string {
  try {
    const u = new URL(String(s));
    return u.protocol === "https:" && (u.hostname === "googleusercontent.com" || u.hostname.endsWith(".googleusercontent.com"));
  } catch {
    return false;
  }
}

/** Photos left right now: the least of the site's day, the site's month and this visitor's day. Never below zero. */
export function photoRoom(used: { day: number; month: number; visitor: number }): number {
  const left = Math.min(PLACES_CAP.day - used.day, PLACES_CAP.month - used.month, PLACES_VISITOR_CAP - used.visitor);
  return Number.isFinite(left) ? Math.max(0, left) : 0;
}

/**
 * A list gets its photos only when all of them fit in what's left, so a
 * list never mixes rows with a photo and rows without; otherwise every
 * photo is dropped and the list is exactly what it was before photos.
 */
export function grantPhotos<T extends { photo?: PlacePhoto }>(places: T[], room: number): T[] {
  const wanted = places.filter((p) => p.photo).length;
  if (!wanted || room >= wanted) return places;
  return places.map((p) => {
    if (!p.photo) return p;
    const rest = { ...p };
    delete rest.photo;
    return rest;
  });
}

export type PhotoFailure = "name" | "key" | CapReason | "google";
export type PhotoResult = { ok: true; uri: string } | { ok: false; reason: PhotoFailure };

export type PhotoDeps = {
  key: string | undefined;
  /** This visitor's photo count for the day (fails closed). */
  takeVisitor: () => Promise<{ ok: boolean }>;
  /** The site-wide count on the photo SKU (fails closed). */
  takeCall: () => Promise<Take>;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
};

/**
 * One photo's address on Google's image host. A name that isn't Google's
 * shape, a missing key, this visitor's share used, the site's day or month
 * used, or a count that can't be taken: no call. Each call is counted before
 * it's made; anything Google sends back that isn't a photo address is a
 * failure, and every failure means the list shows without the photo.
 */
export async function fetchPhotoUri(name: string, d: PhotoDeps): Promise<PhotoResult> {
  if (!isPhotoName(name)) return { ok: false, reason: "name" };
  if (!d.key) return { ok: false, reason: "key" };
  const visitor = await d.takeVisitor().catch(() => ({ ok: false }));
  if (!visitor.ok) return { ok: false, reason: "visitor" };
  const take = await d.takeCall().catch((): Take => ({ ok: false, reason: "error" }));
  if (!take.ok) return { ok: false, reason: take.reason };
  try {
    const res = await d.fetch(photoMediaUrl(name), {
      headers: { "X-Goog-Api-Key": d.key },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { ok: false, reason: "google" };
    const body = (await res.json().catch(() => ({}))) as { photoUri?: unknown };
    return isGooglePhotoUri(body.photoUri) ? { ok: true, uri: body.photoUri } : { ok: false, reason: "google" };
  } catch {
    return { ok: false, reason: "google" };
  }
}
