import type { QueryParams } from "next-sanity";
import { draftMode } from "next/headers";
import { getClient } from "./client";
import { previewToken } from "./write-client";

/**
 * One fetch helper for all public reads.
 *
 * - Published content: CDN client, cached, tagged by document type so the
 *   Sanity webhook can expire exactly what changed (app/api/revalidate).
 * - Draft mode (Presentation tool / Visual Editing): token client, no CDN,
 *   `drafts` perspective, stega encoding for click-to-edit.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
}: {
  query: string;
  params?: QueryParams;
  tags?: string[];
}): Promise<T> {
  let isDraft = false;
  try {
    isDraft = (await draftMode()).isEnabled;
  } catch {
    // Outside a request scope (generateStaticParams, cron). Published only.
  }

  if (isDraft) {
    const token = previewToken();
    if (!token) throw new Error("Draft mode needs SANITY_VIEWER_TOKEN or SANITY_WRITE_TOKEN.");
    return getClient()
      .withConfig({ useCdn: false, token, perspective: "drafts", stega: true })
      .fetch<T>(query, params, { cache: "no-store" });
  }

  return getClient().fetch<T>(query, params, {
    next: { revalidate: 3600, tags },
  });
}
