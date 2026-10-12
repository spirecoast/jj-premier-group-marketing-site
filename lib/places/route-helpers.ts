import "server-only";
import { NextResponse } from "next/server";
import { RateLimiter } from "@/lib/search/query";
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
