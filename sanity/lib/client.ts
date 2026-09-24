import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, isSanityConfigured, projectId, studioBasePath } from "../env";

let cached: SanityClient | null = null;

/**
 * Public read client. `useCdn: true` for every public page read — direct API
 * reads cost roughly ten times more per request.
 */
export function getClient(): SanityClient {
  if (!isSanityConfigured()) {
    throw new Error(
      "Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID (and dataset) to enable it.",
    );
  }
  if (cached) return cached;
  cached = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
    perspective: "published",
    stega: { studioUrl: studioBasePath },
  });
  return cached;
}
