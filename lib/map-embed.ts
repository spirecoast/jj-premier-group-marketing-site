import type { SiteSettings } from "@/lib/content/types";

/**
 * The map on /contact: Google's keyless embed (`maps?q=…&output=embed`),
 * driven by the office address once the brokerage confirms it
 * (lib/content/seed/settings.ts, LAUNCH.md 1.1). Until then the pin comes
 * from NEXT_PUBLIC_MAP_QUERY, and failing that from the default below, so the
 * page never shows an empty frame. The CSP's frame-src names www.google.com
 * for it (next.config.ts).
 */
export const DEFAULT_MAP_QUERY = "Coldwell Banker Realty, Lakewood Ranch, FL";

/** What the map searches for: the office address when it is filled, else the env, else the default. */
export function mapQuery(settings: Pick<SiteSettings, "brokerageName" | "officeAddress">, env: string | undefined = process.env.NEXT_PUBLIC_MAP_QUERY): string {
  const a = settings.officeAddress;
  if (a.street.trim()) {
    return [settings.brokerageName, a.street, `${a.city}, ${a.state} ${a.zip}`.trim()]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
  }
  const fromEnv = env?.trim();
  return fromEnv || DEFAULT_MAP_QUERY;
}

/** The iframe source: no API key, no cookies set by us. */
export function mapEmbedUrl(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/** The "Open in Google Maps" fallback, the documented search URL. */
export function mapLinkUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
