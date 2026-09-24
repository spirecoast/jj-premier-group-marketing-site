/**
 * Sanity configuration. Reads are public and go through the CDN; writes and
 * draft previews use tokens that never reach the browser.
 * Spec: docs/handoff/integrations/sanity.md
 */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
/** Date-pinned. Never `vX` in production code. */
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-09-01";
export const studioBasePath = "/studio";

export function isSanityConfigured(): boolean {
  return /^[a-z0-9-]+$/.test(projectId);
}
