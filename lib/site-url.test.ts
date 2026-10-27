import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalHostRedirects, LAUNCH_ORIGIN, PRELAUNCH_ORIGIN, resolveSiteUrl } from "./site-url";

const DOMAIN_ATTACHED = "jjpremiergroup.com";
const ALIAS = "jj-premier-group-marketing-site.vercel.app";

describe("resolveSiteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL when it's a valid URL, as a bare origin", () => {
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://jjpremiergroup.com/" }), "https://jjpremiergroup.com");
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: " https://jjpremiergroup.com/path?x=1 " }), "https://jjpremiergroup.com");
    assert.equal(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://example.vercel.app", NEXT_PUBLIC_ROBOTS_NOINDEX: "true", VERCEL_PROJECT_PRODUCTION_URL: DOMAIN_ATTACHED }),
      "https://example.vercel.app",
    );
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }), "http://localhost:3000");
  });

  it("holds the vercel.app address before launch, even once the domain is attached to the project", () => {
    // The state on 2026-10-26: the domain is attached (so Vercel reports it as the production URL)
    // but has no DNS records, the site URL variable is empty, and noindex is on.
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "", NEXT_PUBLIC_ROBOTS_NOINDEX: "true", VERCEL_PROJECT_PRODUCTION_URL: DOMAIN_ATTACHED }), PRELAUNCH_ORIGIN);
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_ROBOTS_NOINDEX: "true", VERCEL_PROJECT_PRODUCTION_URL: ALIAS }), PRELAUNCH_ORIGIN);
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_ROBOTS_NOINDEX: "true" }), PRELAUNCH_ORIGIN);
  });

  it("uses Vercel's production URL once noindex is off", () => {
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_ROBOTS_NOINDEX: "", VERCEL_PROJECT_PRODUCTION_URL: DOMAIN_ATTACHED }), "https://jjpremiergroup.com");
    assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: DOMAIN_ATTACHED }), "https://jjpremiergroup.com");
    assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: ALIAS }), PRELAUNCH_ORIGIN);
  });

  it("treats only the exact string true as noindex", () => {
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_ROBOTS_NOINDEX: "false", VERCEL_PROJECT_PRODUCTION_URL: DOMAIN_ATTACHED }), "https://jjpremiergroup.com");
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_ROBOTS_NOINDEX: "1", VERCEL_PROJECT_PRODUCTION_URL: DOMAIN_ATTACHED }), "https://jjpremiergroup.com");
  });

  it("falls through a blank or malformed value without throwing", () => {
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "jjpremiergroup.com", NEXT_PUBLIC_ROBOTS_NOINDEX: "true" }), PRELAUNCH_ORIGIN);
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "   " }), LAUNCH_ORIGIN);
    assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "ftp://jjpremiergroup.com" }), LAUNCH_ORIGIN);
    assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "not a host" }), LAUNCH_ORIGIN);
    assert.equal(resolveSiteUrl({}), LAUNCH_ORIGIN);
  });
});

describe("canonicalHostRedirects", () => {
  const launched = { VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://jjpremiergroup.com", VERCEL_PROJECT_PRODUCTION_URL: DOMAIN_ATTACHED };

  it("sends the vercel.app alias to the domain on a launched production build", () => {
    const r = canonicalHostRedirects(launched);
    assert.equal(r.length, 1);
    assert.deepEqual(r[0], {
      source: "/:path*",
      has: [{ type: "host", value: "jj-premier-group-marketing-site\\.vercel\\.app" }],
      destination: "https://jjpremiergroup.com/:path*",
      permanent: true,
    });
  });

  it("also redirects at launch when the domain comes from Vercel rather than the variable", () => {
    const r = canonicalHostRedirects({ VERCEL_ENV: "production", VERCEL_PROJECT_PRODUCTION_URL: DOMAIN_ATTACHED });
    assert.equal(r.length, 1);
    assert.equal(r[0]!.destination, "https://jjpremiergroup.com/:path*");
  });

  it("does nothing before launch, on previews, or locally", () => {
    assert.deepEqual(canonicalHostRedirects({ VERCEL_ENV: "production", NEXT_PUBLIC_ROBOTS_NOINDEX: "true", VERCEL_PROJECT_PRODUCTION_URL: DOMAIN_ATTACHED }), []);
    assert.deepEqual(canonicalHostRedirects({ ...launched, VERCEL_ENV: "preview" }), []);
    assert.deepEqual(canonicalHostRedirects({ ...launched, VERCEL_ENV: undefined }), []);
    assert.deepEqual(canonicalHostRedirects({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: PRELAUNCH_ORIGIN }), []);
    assert.deepEqual(canonicalHostRedirects({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }), []);
  });

  it("covers a renamed vercel.app production alias too", () => {
    const r = canonicalHostRedirects({ VERCEL_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://jjpremiergroup.com", VERCEL_PROJECT_PRODUCTION_URL: "jj-site.vercel.app" });
    assert.deepEqual(r.map((x) => x.has[0]!.value).sort(), ["jj-premier-group-marketing-site\\.vercel\\.app", "jj-site\\.vercel\\.app"]);
  });
});
