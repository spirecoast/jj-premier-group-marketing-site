/**
 * Which origin the site calls itself, and which hosts forward to it. Pure
 * functions of the environment so lib/site.ts and next.config.ts agree and the
 * rules can be tested (site-url.test.ts).
 */

/** The address that resolves today, the Vercel production alias. */
export const PRELAUNCH_ORIGIN = "https://jj-premier-group-marketing-site.vercel.app";

/** The launch domain; also the last resort. */
export const LAUNCH_ORIGIN = "https://jjpremiergroup.com";

export type SiteUrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_ROBOTS_NOINDEX?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_ENV?: string;
};

function origin(candidate: string | undefined): string | null {
  if (!candidate) return null;
  try {
    const u = new URL(candidate);
    return u.protocol === "https:" || u.protocol === "http:" ? u.origin : null;
  } catch {
    return null;
  }
}

/**
 * Public origin of the site, for canonicals, og:url, the sitemap, robots.txt,
 * llms.txt and ICS UIDs.
 *
 * 1. `NEXT_PUBLIC_SITE_URL`, when it's a valid absolute URL.
 * 2. Before launch (`NEXT_PUBLIC_ROBOTS_NOINDEX=true`), the vercel.app alias. Vercel's
 *    `VERCEL_PROJECT_PRODUCTION_URL` becomes the shortest custom domain the moment one is
 *    attached, whether or not its DNS resolves yet, so it can't be trusted until launch.
 * 3. At launch (noindex off), `VERCEL_PROJECT_PRODUCTION_URL`, which is then the domain.
 * 4. The launch domain.
 *
 * An empty or malformed value (easy to leave behind in a hosting dashboard) never breaks
 * the build; it falls through to the next rule.
 */
export function resolveSiteUrl(env: SiteUrlEnv): string {
  const explicit = origin(env.NEXT_PUBLIC_SITE_URL?.trim());
  if (explicit) return explicit;
  if (env.NEXT_PUBLIC_ROBOTS_NOINDEX === "true") return PRELAUNCH_ORIGIN;
  const production = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return origin(production && `https://${production}`) ?? LAUNCH_ORIGIN;
}

/**
 * Once the site's origin is the real domain, production requests that arrive on the
 * vercel.app alias are sent there (308), so there is one site to index and to share.
 * Only on production builds, and never while the origin is itself a vercel.app address
 * (which is the case for the whole pre-launch period, see resolveSiteUrl).
 */
export function canonicalHostRedirects(env: SiteUrlEnv) {
  if (env.VERCEL_ENV !== "production") return [];
  const canonical = new URL(resolveSiteUrl(env));
  if (canonical.hostname.endsWith(".vercel.app") || canonical.hostname === "localhost") return [];
  const aliases = new Set([new URL(PRELAUNCH_ORIGIN).host]);
  const production = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production?.endsWith(".vercel.app")) aliases.add(production);
  aliases.delete(canonical.host);
  return [...aliases].map((host) => ({
    source: "/:path*",
    // `has` values are patterns; escape the dots so only this exact host matches.
    has: [{ type: "host" as const, value: host.replace(/\./g, "\\.") }],
    destination: `${canonical.origin}/:path*`,
    permanent: true,
  }));
}
