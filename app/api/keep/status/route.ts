import { NextResponse } from "next/server";
import { keepEmailEnabled } from "@/lib/keep/limits";

/**
 * GET /api/keep/status: whether "Email me this" is on, so the tools offer it
 * only when it can send. Built with the deployment (the setting it reads is
 * an environment variable), served from the CDN.
 */
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ email: keepEmailEnabled() });
}
