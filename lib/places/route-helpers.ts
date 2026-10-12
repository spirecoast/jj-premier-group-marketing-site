import "server-only";
import { NextResponse } from "next/server";
import { RateLimiter } from "@/lib/search/query";
import { PlacesCapError } from "./budget";
import type { Place } from "./rank";

/** 20 lists a minute per IP, per server instance. Google Cloud's daily quota is the real cap. */
export const placesLimiter = new RateLimiter(20, 60_000);

const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export const placesJson = (body: { places: Place[] } | { error: string }, status = 200, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...HEADERS, ...extra } });

/** A whole number from a query string, inside [min, max]; undefined otherwise. */
export function intParam(v: string | null, min: number, max: number): number | undefined {
  if (v == null || !/^\d+$/.test(v)) return undefined;
  const n = Number(v);
  return n >= min && n <= max ? n : undefined;
}

const CAP_MESSAGE = {
  day: "That’s all the Google lists we can show today. Try again tomorrow.",
  month: "That’s all the Google lists we can show this month. They’re back on the 1st.",
  error: "Google lists aren’t available right now.",
} as const;

/** The answer when a Places call fails: the cap reached, or Google not answering. */
export function placesFailure(err: unknown, tag: string) {
  if (err instanceof PlacesCapError) return placesJson({ error: CAP_MESSAGE[err.reason] }, err.reason === "error" ? 503 : 429);
  console.error(`[${tag}]`, err instanceof Error ? err.message : err);
  return placesJson({ error: "Google didn’t answer. Try again in a moment." }, 502);
}
