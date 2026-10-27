import "server-only";
import { NextResponse } from "next/server";
import { RateLimiter } from "@/lib/search/query";
import { PlacesCapError, takeVisitorCall, type CapReason } from "./budget";
import type { Place } from "./rank";

/** 20 lists a minute per IP, per server instance. Google Cloud's daily quota is the real cap. */
export const placesLimiter = new RateLimiter(20, 60_000);

const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

/** `capped`: today's or this month's lookups are used up, so the page offers to ask instead of Try again. */
export type PlacesBody = { places: Place[] } | { error: string; capped?: true };

export const placesJson = (body: PlacesBody, status = 200, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...HEADERS, ...extra } });

/** A whole number from a query string, inside [min, max]; undefined otherwise. */
export function intParam(v: string | null, min: number, max: number): number | undefined {
  if (v == null || !/^\d+$/.test(v)) return undefined;
  const n = Number(v);
  return n >= min && n <= max ? n : undefined;
}

const CAP_MESSAGE: Record<CapReason, string> = {
  day: "Today’s lookups are used up.",
  visitor: "Today’s lookups are used up.",
  month: "This month’s lookups are used up.",
  error: "Google lists aren’t available right now.",
};

/** Count this visitor's list (lib/places/budget.ts); a PlacesCapError once they've had their share today. */
export async function takeVisitorList(ip: string): Promise<void> {
  if (!(await takeVisitorCall(ip)).ok) throw new PlacesCapError("visitor");
}

/** The answer when a Places call fails: a cap reached, or Google not answering. */
export function placesFailure(err: unknown, tag: string) {
  if (err instanceof PlacesCapError) {
    return err.reason === "error" ? placesJson({ error: CAP_MESSAGE.error }, 503) : placesJson({ error: CAP_MESSAGE[err.reason], capped: true }, 429);
  }
  console.error(`[${tag}]`, err instanceof Error ? err.message : err);
  return placesJson({ error: "Google didn’t answer. Try again in a moment." }, 502);
}
