import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { processLead } from "@/lib/lead-pipeline";
import { leadSchema } from "@/lib/leads";

/**
 * JSON entry to the same pipeline the forms use, for the launch rehearsal
 * (scripts/test-lead.mjs). It reports which sinks accepted the lead, which
 * is more than a visitor should ever see, so it is locked:
 *
 *   - Development: open on localhost.
 *   - Elsewhere: requires `Authorization: Bearer <LEAD_TEST_SECRET>`; without
 *     the secret configured the route does not exist (404).
 *
 * Body: the same fields as the forms (lib/leads.ts leadSchema) plus an
 * optional `test: true`, which tags the lead "test" everywhere it lands.
 */

export const runtime = "nodejs";

function authorised(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.LEAD_TEST_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ message: "Not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Body must be JSON" }, { status: 400 });
  }
  const { test, utm, ...fields } = body;
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "string") raw[k] = v;
    else if (typeof v === "boolean") raw[k] = v ? "true" : "";
    else if (typeof v === "number") raw[k] = String(v);
  }
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid lead", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  if (parsed.data.website) return NextResponse.json({ message: "Honeypot" }, { status: 400 });

  const utmMap: Record<string, string> = {};
  if (utm && typeof utm === "object") {
    for (const [k, v] of Object.entries(utm as Record<string, unknown>)) if (typeof v === "string" && v) utmMap[k] = v.slice(0, 200);
  }

  const outcome = await processLead(parsed.data, {
    utm: utmMap,
    referrer: request.headers.get("referer"),
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    test: test === true,
  });

  return NextResponse.json(
    {
      ok: outcome.captured,
      leadId: outcome.leadId,
      form: outcome.lead.form,
      tags: outcome.lead.tags,
      sinks: outcome.sinks,
    },
    { status: outcome.captured ? 200 : 503 },
  );
}
