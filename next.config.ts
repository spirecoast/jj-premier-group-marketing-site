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

/** Violations post here (app/api/csp-report/route.ts) and surface as one-line warnings in the logs. */
const CSP_REPORT_PATH = "/api/csp-report";

/** Supabase Storage: Encore's event images live in the public `encore-images` bucket. */
const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})() || "dnftoqwqzoekgfeoxest.supabase.co";

/** Vercel injects its preview toolbar on preview deployments only. */
const VERCEL_PREVIEW = process.env.VERCEL_ENV === "preview" ? ["https://vercel.live"] : [];

type Directives = Record<string, string[]>;

/**
 * The base policy, every route. Report-only for now: Next.js emits inline
 * hydration scripts and next/script inlines the Plausible queue, both of
 * which need 'unsafe-inline' until a per-request nonce is issued from
 * a proxy.ts; 'unsafe-eval' is only for the dev server's React refresh.
 */
function basePolicy(): Directives {
  return {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    // The Studio's Presentation tool frames site pages from /studio, same origin.
    "frame-ancestors": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(IS_DEV ? ["'unsafe-eval'"] : []), PLAUSIBLE_HOST, ...VERCEL_PREVIEW],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://cdn.sanity.io", `https://${SUPABASE_HOST}`],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", PLAUSIBLE_HOST, MAP_HOST, ...SANITY_API, ...VERCEL_PREVIEW],
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
    // Search reads every chunk source: the Atlas dataset and, for Tide, the county data.
    "/search": ["./data/sales/**", "./neighborhood-data/data/neighborhoods.json"],
    "/api/search": ["./data/sales/**", "./neighborhood-data/data/neighborhoods.json"],
    "/api/search/reindex": ["./data/sales/**", "./neighborhood-data/data/neighborhoods.json"],
  },
  images: {
    // AVIF first, WebP for browsers without it; sources stay JPEG in public/images.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: SUPABASE_HOST, pathname: "/storage/v1/object/public/encore-images/**" },
    ],
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
      // The private questionnaire links: the token is in the path, so no referrer, no caching, no indexing.
      {
        source: "/q/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
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
