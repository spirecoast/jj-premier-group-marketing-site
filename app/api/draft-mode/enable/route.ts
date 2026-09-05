import { defineEnableDraftMode } from "next-sanity/draft-mode";
import type { NextRequest } from "next/server";
import { isSanityConfigured } from "@/sanity/env";
import { getClient } from "@/sanity/lib/client";
import { previewToken } from "@/sanity/lib/write-client";

/**
 * Entry point for the Presentation tool. Verifies the request came from the
 * Studio (signed URL) and turns on Next draft mode for the editor's browser.
 */
export async function GET(request: NextRequest) {
  if (!isSanityConfigured()) {
    return new Response("Sanity is not configured", { status: 503 });
  }
  const token = previewToken();
  if (!token) {
    return new Response("SANITY_VIEWER_TOKEN or SANITY_WRITE_TOKEN is required for previews", {
      status: 503,
    });
  }
  const { GET: enable } = defineEnableDraftMode({
    client: getClient().withConfig({ token, useCdn: false }),
  });
  return enable(request);
}
