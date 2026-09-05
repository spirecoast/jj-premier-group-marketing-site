import "server-only";
import type { SanityClient } from "next-sanity";
import { getClient } from "./client";

/**
 * Drafts, preview and mutations. Bypasses the CDN and carries the write token.
 * Server only — this module must never be imported from a client component.
 */
export function getWriteClient(): SanityClient {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) throw new Error("SANITY_WRITE_TOKEN is not set.");
  return getClient().withConfig({ useCdn: false, token, perspective: "published" });
}

/** Read-only token for draft previews; falls back to the write token. */
export function previewToken(): string | undefined {
  return process.env.SANITY_VIEWER_TOKEN ?? process.env.SANITY_WRITE_TOKEN;
}
