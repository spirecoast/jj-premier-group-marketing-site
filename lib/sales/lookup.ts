/**
 * The street lookups' shared rules (Tide Street and Home Value both ask
 * /api/sales; components/sales/use-sales-lookup.ts runs them).
 */

export type LookupStatus = "idle" | "loading" | "done" | "error";

/**
 * What an answer from /api/sales means for the page. A 200 is a result. A 400
 * (the street or ZIP needs more) and a 503 (no county records loaded) are
 * answers the page explains in words, so they settle as "done". Anything else
 * (a 500, a proxy page, a body that isn't the API's) is an error.
 */
export function lookupOutcome(httpStatus: number, body: unknown): "done" | "error" {
  const ok = typeof body === "object" && body !== null && "ok" in body;
  if (!ok) return "error";
  if ((body as { ok: unknown }).ok === true) return "done";
  return httpStatus === 400 || httpStatus === 503 ? "done" : "error";
}

/** Whether the ask form should take this lookup's address: a result, or a question back about the street (400). Not "no records" (503). */
export function lookupFeedsAsk(httpStatus: number, body: unknown): boolean {
  return lookupOutcome(httpStatus, body) === "done" && ((body as { ok: boolean }).ok || httpStatus === 400);
}
