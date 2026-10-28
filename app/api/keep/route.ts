import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sendKeepEmail } from "@/lib/keep/send";
import { isKeepTool } from "@/lib/keep/tools";

/**
 * POST /api/keep: "Email me this" (components/keep/keep-row.tsx).
 * Body: { tool, url, email, website } where `website` is the honeypot.
 * Sends one email with the link to the visitor's own result on this site
 * (lib/keep/send.ts has the rules and the limits). Off, and 404, unless the
 * email path and the database are configured.
 */

export const runtime = "nodejs";

const Body = z.object({
  tool: z.string().refine(isKeepTool),
  url: z.string().max(2000),
  email: z.string().trim().max(254).email(),
  website: z.string().max(200).optional(),
});

function clientAddress(headers: Headers): string | null {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || null;
}

/** Same-site only: a page on another site can't drive sends from a visitor's browser. */
function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.nextUrl.host || new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 403 });
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  const { tool, url, email, website } = parsed.data;
  if (!isKeepTool(tool)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const result = await sendKeepEmail({ tool, url, email, honeypot: Boolean(website?.trim()), address: clientAddress(request.headers) });
  if (result.ok) return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ ok: false, error: result.error }, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
