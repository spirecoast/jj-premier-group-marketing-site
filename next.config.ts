import type { NextConfig } from "next";
import { FOLDED_POSTS, REBUILT_GUIDE_SLUGS } from "./lib/guides/slugs";
import { HOME_PLATFORM_ORIGIN, homePlatformPixelId } from "./lib/home-platform";
import { canonicalHostRedirects } from "./lib/site-url";

/*
 * Security headers. Everything below is derived from the same env vars the
 * app reads, so the policy names the hosts a given build actually talks to.
 */

const IS_DEV = process.env.NODE_ENV === "development";

/** Plausible: plausible.io unless self-hosted (components/analytics.tsx). */
const PLAUSIBLE_HOST = (process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "https://plausible.io").replace(/\/$/, "");

/**
 * Map tiles and glyphs: MapTiler with a key, OpenFreeMap without
 * (lib/neighborhoods/map-style.ts). With a key, OpenFreeMap is still listed:
 * it's the runtime fallback when MapTiler refuses or fails (components/map-runtime.ts).
 */
const MAP_HOSTS = [...(process.env.NEXT_PUBLIC_MAPTILER_KEY ? ["https://api.maptiler.com"] : []), "https://tiles.openfreemap.org"];

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

/** Home Platform's lead pixel (lib/home-platform.ts): its script and the /cxlp/ calls it makes, when this build loads it. */
const HOME_PLATFORM = homePlatformPixelId() ? [HOME_PLATFORM_ORIGIN] : [];

/** Sentry (lib/sentry): the ingest host in the DSN, when this build reports errors. */
const SENTRY_INGEST = (() => {
  try {
    return process.env.NEXT_PUBLIC_SENTRY_DSN ? [new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).origin] : [];
  } catch {
    return [];
  }
})();

/** Vercel injects its preview toolbar on preview deployments only. */
const VERCEL_PREVIEW = process.env.VERCEL_ENV === "preview" ? ["https://vercel.live"] : [];

type Directives = Record<string, string[]>;

/**
 * Report-only, for now. Enforcing means changing this one name to
 * "Content-Security-Policy"; do it once a week of production traffic has sent
 * no reports to /api/csp-report (grep the Vercel logs for "[csp-report]").
 * Checked locally on 2026-10-27 with Plausible and Sentry on: the only report on
 * every page was zod's `Function("")` probe, now off (instrumentation-client.ts).
 * Not yet seen under this policy: the Home Platform pixel (production only) and
 * a configured Sanity Studio, which is why it isn't enforced in the same change.
 */
const CSP_HEADER = "Content-Security-Policy-Report-Only";

/**
 * The base policy, every route. Next.js emits inline hydration scripts and
 * next/script inlines the Plausible queue, both of which need 'unsafe-inline'
 * until a per-request nonce is issued from a proxy.ts (which would make every
 * page dynamic); 'unsafe-eval' is only for the dev server's React refresh.
 * Even with 'unsafe-inline', an enforced policy holds the host allow-list,
 * frame-ancestors, object-src, base-uri and form-action.
 */
function basePolicy(): Directives {
  return {
    "default-src": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    // The Studio's Presentation tool frames site pages from /studio, same origin.
    "frame-ancestors": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(IS_DEV ? ["'unsafe-eval'"] : []), PLAUSIBLE_HOST, ...HOME_PLATFORM, ...VERCEL_PREVIEW],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://cdn.sanity.io", `https://${SUPABASE_HOST}`],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", PLAUSIBLE_HOST, ...MAP_HOSTS, ...SANITY_API, ...HOME_PLATFORM, ...SENTRY_INGEST, ...VERCEL_PREVIEW],
    "worker-src": ["'self'", "blob:"],
    "frame-src": ["'self'", ...VERCEL_PREVIEW],
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
  // The Studio's own typeface (Inter), served from Sanity's design-system CDN.
  p["font-src"] = [...p["font-src"], "https://design-system-static.sanity.io"];
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
  // A page this site opens in another window, or one that opens this site, can't reach back into it.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Reporting-Endpoints", value: `csp-endpoint="${CSP_REPORT_PATH}"` },
];

/**
 * Browser caching for files under /public. Fonts and /_next/static are already immutable.
 * Photos keep their names when a file is replaced, so they get a week plus a month of
 * stale-while-revalidate rather than "immutable". The MapLibre worker sits in a folder named
 * for its version (scripts/copy-maplibre-worker.mjs), so that folder never changes.
 */
const PHOTO_CACHE = "public, max-age=604800, stale-while-revalidate=2592000";
const IMMUTABLE = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // No "X-Powered-By: Next.js".
  poweredByHeader: false,
  // Route changes run inside the View Transitions API (components/view-transitions
  // and the ViewTransition boundaries in app/(site)/layout.tsx and site-header.tsx).
  // Since Next 16.4 React's <ViewTransition> works in the App Router without a flag.
  // lib/sales reads data/sales/*.json.gz at request time; make sure the
  // files travel with the functions that need them.
  outputFileTracingIncludes: {
    // The sales route also reads the Atlas index, to offer "Sales in {place}" when a street box names a place.
    "/api/sales": ["./data/sales/**", "./neighborhood-data/data/neighborhoods.search.json", "./neighborhood-data/data/neighborhoods.json"],
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
    // "What sold nearby" on a place page and the compare table's sales row join the county data to Atlas places.
    "/neighborhoods/[slug]": ["./data/sales/**", "./neighborhood-data/data/neighborhoods.search.json", "./neighborhood-data/data/neighborhoods.json"],
    "/neighborhoods/compare": ["./data/sales/**", "./neighborhood-data/data/neighborhoods.search.json", "./neighborhood-data/data/neighborhoods.json"],
    // Street Watch's daily digest reads the new sales and the place join.
    "/api/cron/street-watch": ["./data/sales/**", "./neighborhood-data/data/neighborhoods.search.json", "./neighborhood-data/data/neighborhoods.json"],
  },
  images: {
    // AVIF first, WebP for browsers without it; sources stay JPEG in public/images.
    formats: ["image/avif", "image/webp"],
    // Optimized images are cached for 31 days (on Vercel's image cache and in the browser);
    // without this the browser got max-age=0 and re-checked every photo on every visit.
    minimumCacheTTL: 2678400,
    // The widths the browser can pick from. Next's defaults jump from 1200 to 1920
    // and end at 3840, so a 1248px hero fetched the 1920 file and a Retina desktop
    // the 3840 one. The source photos are at most 2560px wide, so nothing larger
    // is ever sharper, and the steps between 1080 and 1920 fit the real hero slots
    // (lib/image-sizes.ts).
    deviceSizes: [640, 750, 828, 1080, 1280, 1440, 1600, 1920, 2560],
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
        headers: [...COMMON_HEADERS, { key: CSP_HEADER, value: serialize(basePolicy()) }],
      },
      {
        source: "/studio/:path*",
        headers: [
          { key: CSP_HEADER, value: serialize(studioPolicy()) },
          // Sanity's sign-in can open a provider window and wait for it to report back.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: PHOTO_CACHE }] },
      { source: "/vendor/maplibre-gl/:version/:file", headers: [{ key: "Cache-Control", value: IMMUTABLE }] },
      // The guide PDFs repeat the guide pages; the pages are the ones to index.
      { source: "/guides/pdf/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
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
      // One "what's my home worth" page: the record lookup and the ask live at /sell/home-value (October 2026).
      { source: "/valuation", destination: "/sell/home-value", permanent: true },
      // Tide's home was /blog; it's /tide now, issues only. Guides live at /guides.
      { source: "/blog", destination: "/tide", permanent: true },
      // Guides rebuilt as long-form pages (lib/guides) moved from Tide to /guides; the old links follow.
      ...REBUILT_GUIDE_SLUGS.map((slug) => ({ source: `/blog/${slug}`, destination: `/guides/${slug}`, permanent: true })),
      // A post folded into a guide follows the guide.
      ...Object.entries(FOLDED_POSTS).map(([slug, guide]) => ({ source: `/blog/${slug}`, destination: `/guides/${guide}`, permanent: true })),
      // At launch the vercel.app address sends every path to the domain, so search engines see one
      // site. Before launch (noindex on) the vercel.app address is the site and nothing redirects.
      ...canonicalHostRedirects({
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        NEXT_PUBLIC_ROBOTS_NOINDEX: process.env.NEXT_PUBLIC_ROBOTS_NOINDEX,
        VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
        VERCEL_ENV: process.env.VERCEL_ENV,
      }),
    ];
  },
};

export default nextConfig;
