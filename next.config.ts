import type { NextConfig } from "next";
import { REBUILT_GUIDE_SLUGS } from "./lib/guides/slugs";

/*
 * Security headers. Everything below is derived from the same env vars the
 * app reads, so the policy names the hosts a given build actually talks to.
 */

const IS_DEV = process.env.NODE_ENV === "development";

/** Plausible: plausible.io unless self-hosted (components/analytics.tsx). */
const PLAUSIBLE_HOST = (process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io").replace(/\/$/, "");

/** Map tiles and glyphs: MapTiler with a key, OpenFreeMap without (lib/neighborhoods/map-style.ts). */
const MAP_HOST = process.env.NEXT_PUBLIC_MAPTILER_KEY ? "https://api.maptiler.com" : "https://tiles.openfreemap.org";

/** Sanity: the project's API hosts for draft previews and the Studio; the image CDN always. */
const SANITY_PROJECT = /^[a-z0-9-]+$/.test(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "")
  ? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  : "";
const SANITY_API = SANITY_PROJECT
  ? [`https://${SANITY_PROJECT}.api.sanity.io`, `wss://${SANITY_PROJECT}.api.sanity.io`, `https://${SANITY_PROJECT}.apicdn.sanity.io`, "https://api.sanity.io"]
  : [];

/**
 * Clerk's frontend API host is encoded in the publishable key
 * (base64 of "<host>$" after the pk_test_/pk_live_ prefix). app/layout.tsx
 * wraps every route in ClerkProvider when the key is set, so the host goes
 * into the base policy; without a key the portal is closed (proxy.ts) and
 * only the Clerk routes carry the dev-instance wildcard as a fallback.
 */
function clerkFrontendApi(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const encoded = key.replace(/^pk_(test|live)_/, "");
  if (encoded && encoded !== key) {
    try {
      const host = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
      if (/^[a-z0-9.-]+$/.test(host)) return `https://${host}`;
    } catch {
      // fall through
    }
  }
  return null;
}
const CLERK_FAPI = clerkFrontendApi();

/** Violations post here (app/api/csp-report/route.ts) and surface as one-line warnings in the logs. */
const CSP_REPORT_PATH = "/api/csp-report";

/** Vercel injects its preview toolbar on preview deployments only. */
const VERCEL_PREVIEW = process.env.VERCEL_ENV === "preview" ? ["https://vercel.live"] : [];

type Directives = Record<string, string[]>;

/**
 * The base policy, every route. Report-only for now: Next.js emits inline
 * hydration scripts and next/script inlines the Plausible queue, both of
 * which need 'unsafe-inline' until a per-request nonce is issued from
 * proxy.ts; 'unsafe-eval' is only for the dev server's React refresh.
 */
function basePolicy(): Directives {
  return {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    // The Studio's Presentation tool frames site pages from /studio, same origin.
    "frame-ancestors": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(IS_DEV ? ["'unsafe-eval'"] : []), PLAUSIBLE_HOST, ...(CLERK_FAPI ? [CLERK_FAPI] : []), ...VERCEL_PREVIEW],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://cdn.sanity.io"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", PLAUSIBLE_HOST, MAP_HOST, ...SANITY_API, ...(CLERK_FAPI ? [CLERK_FAPI] : []), ...VERCEL_PREVIEW],
    "worker-src": ["'self'", "blob:"],
    // www.google.com: the keyless Google Maps embed on /contact (lib/map-embed.ts).
    "frame-src": ["'self'", "https://www.google.com", ...VERCEL_PREVIEW],
    "media-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    // report-uri for browsers without the Reporting API, report-to (with the Reporting-Endpoints header) for the rest.
    "report-uri": [CSP_REPORT_PATH],
    "report-to": ["csp-endpoint"],
  };
}

/** /studio: the embedded Sanity Studio talks to the project API and sanity.io services. */
function studioPolicy(): Directives {
  const p = basePolicy();
  p["connect-src"] = [...p["connect-src"], "https://*.sanity.io", "wss://*.api.sanity.io"];
  p["img-src"] = [...p["img-src"], "https://*.sanity.io"];
  return p;
}

/** /portal and /auth: Clerk's frontend API, its avatar CDN and the Turnstile challenge frame. */
function clerkPolicy(): Directives {
  const p = basePolicy();
  const fapi = CLERK_FAPI ?? "https://*.clerk.accounts.dev";
  p["script-src"] = [...new Set([...p["script-src"], fapi, "https://challenges.cloudflare.com"])];
  p["connect-src"] = [...new Set([...p["connect-src"], fapi, "https://clerk-telemetry.com"])];
  p["img-src"] = [...p["img-src"], "https://img.clerk.com"];
  p["frame-src"] = [...p["frame-src"], "https://challenges.cloudflare.com"];
  return p;
}

function serialize(d: Directives): string {
  return Object.entries(d)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
}

const COMMON_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
  // SAMEORIGIN rather than DENY: the Studio's Presentation tool frames the site.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Reporting-Endpoints", value: `csp-endpoint="${CSP_REPORT_PATH}"` },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  // lib/sales reads data/sales/*.json.gz at request time; make sure the
  // files travel with the functions that need them.
  outputFileTracingIncludes: {
    "/api/sales": ["./data/sales/**"],
    "/sell/sold": ["./data/sales/**"],
    "/sell/home-value": ["./data/sales/**"],
    // The Tide issue pages are prerendered; the share image is drawn on request and reads the data.
    "/tide/**": ["./data/sales/**"],
    // The monthly email engine reads the same county data at request time.
    "/api/issues/tide": ["./data/sales/**"],
  },
  images: {
    // AVIF first, WebP for browsers without it; sources stay JPEG in public/images.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  async headers() {
    // Later entries override earlier ones for the same header key, so the
    // route-specific CSPs come after the catch-all.
    return [
      {
        source: "/(.*)",
        headers: [...COMMON_HEADERS, { key: "Content-Security-Policy-Report-Only", value: serialize(basePolicy()) }],
      },
      { source: "/studio/:path*", headers: [{ key: "Content-Security-Policy-Report-Only", value: serialize(studioPolicy()) }] },
      { source: "/portal/:path*", headers: [{ key: "Content-Security-Policy-Report-Only", value: serialize(clerkPolicy()) }] },
      { source: "/auth/:path*", headers: [{ key: "Content-Security-Policy-Report-Only", value: serialize(clerkPolicy()) }] },
    ];
  },
  async redirects() {
    // Routes from the placeholder site, kept alive for any links in the wild.
    // /lakewood-ranch itself is now the market hub (app/(site)/lakewood-ranch).
    return [
      // Old place paths under the hub, but not the hub's own share image route.
      { source: "/lakewood-ranch/:slug((?!opengraph-image).*)", destination: "/neighborhoods/:slug", permanent: true },
      // /relocate is the relocation planner now; its old redirect to /buy is gone.
      // The editorial slug before the neighborhood dataset arrived.
      { source: "/neighborhoods/lake-club", destination: "/neighborhoods/the-lake-club", permanent: true },
      // Guides rebuilt as long-form pages (lib/guides) moved from Tide to /guides; the old links follow.
      ...REBUILT_GUIDE_SLUGS.map((slug) => ({ source: `/blog/${slug}`, destination: `/guides/${slug}`, permanent: true })),
    ];
  },
};

export default nextConfig;
