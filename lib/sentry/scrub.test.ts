import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ErrorEvent } from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent, scrubUrl } from "./scrub";

describe("sentry scrub: URLs", () => {
  it("drops the query and the fragment", () => {
    assert.equal(scrubUrl("https://jjpremiergroup.com/calendar/plan?when=2026-11-01&venue=van-wezel#nearby"), "https://jjpremiergroup.com/calendar/plan");
    assert.equal(scrubUrl("/unsubscribe?token=abc123"), "/unsubscribe");
    assert.equal(scrubUrl("/subscribe/confirm?t=xyz"), "/subscribe/confirm");
  });

  it("hides the questionnaire token in a URL, a path and a route name", () => {
    assert.equal(scrubUrl("https://jjpremiergroup.com/q/9f8e7d6c5b4a/export?x=1"), "https://jjpremiergroup.com/q/[token]/export");
    assert.equal(scrubUrl("/q/9f8e7d6c5b4a"), "/q/[token]");
    assert.equal(scrubUrl("GET /q/9f8e7d6c5b4a"), "GET /q/[token]");
  });

  it("leaves ordinary paths alone", () => {
    assert.equal(scrubUrl("/neighborhoods/the-lake-club"), "/neighborhoods/the-lake-club");
    assert.equal(scrubUrl("/faq/quick"), "/faq/quick");
    assert.equal(scrubUrl(""), "");
  });
});

describe("sentry scrub: breadcrumbs", () => {
  it("drops console breadcrumbs", () => {
    assert.equal(scrubBreadcrumb({ category: "console", message: "[lead] database mirror failed pat@example.com" }), null);
  });

  it("cleans the URLs a fetch or navigation carries", () => {
    assert.deepEqual(scrubBreadcrumb({ category: "fetch", data: { url: "/api/places/night?venue=x&kind=dinner", method: "GET" } }), {
      category: "fetch",
      data: { url: "/api/places/night", method: "GET" },
    });
    assert.deepEqual(scrubBreadcrumb({ category: "navigation", data: { from: "/q/abc?x=1", to: "/thanks/contact?market=sarasota" } }), {
      category: "navigation",
      data: { from: "/q/[token]", to: "/thanks/contact" },
    });
  });
});

describe("sentry scrub: events", () => {
  it("keeps the page, the method and the browser, and nothing else from the request", () => {
    const event = scrubEvent({
      type: undefined,
      user: { ip_address: "203.0.113.9", email: "pat@example.com" },
      server_name: "lambda-1",
      transaction: "POST /q/abc123",
      request: {
        url: "https://jjpremiergroup.com/contact?utm_source=x",
        method: "POST",
        data: { name: "Pat", email: "pat@example.com", phone: "9415550100" },
        cookies: { cxlp_anonymous_id: "abc" },
        query_string: "utm_source=x",
        headers: { "User-Agent": "Mozilla/5.0", Cookie: "a=b", "x-forwarded-for": "203.0.113.9", Referer: "https://www.google.com/search?q=pat" },
        env: { REMOTE_ADDR: "203.0.113.9" },
      },
      breadcrumbs: [
        { category: "console", message: "pat@example.com" },
        { category: "ui.click", message: "button.btn" },
      ],
      contexts: { nextjs: { request_path: "/q/abc123?x=1", router_kind: "App Router", route_type: "render" } },
      tags: { url: "https://jjpremiergroup.com/q/abc123?x=1", runtime: "node" },
      extra: { landing: "/from/youtube?utm_source=yt", count: 3 },
    } as ErrorEvent);

    assert.equal(event.user, undefined);
    assert.equal(event.server_name, undefined);
    assert.equal(event.transaction, "POST /q/[token]");
    assert.deepEqual(event.request, {
      url: "https://jjpremiergroup.com/contact",
      method: "POST",
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://www.google.com/search" },
    });
    assert.deepEqual(event.breadcrumbs, [{ category: "ui.click", message: "button.btn" }]);
    assert.deepEqual(event.contexts, { nextjs: { request_path: "/q/[token]", router_kind: "App Router", route_type: "render" } });
    assert.deepEqual(event.tags, { url: "https://jjpremiergroup.com/q/[token]", runtime: "node" });
    assert.deepEqual(event.extra, { landing: "/from/youtube", count: 3 });
  });

  it("leaves an event without a request alone", () => {
    const event = scrubEvent({ type: undefined, message: "boom" } as ErrorEvent);
    assert.deepEqual(event, { type: undefined, message: "boom" });
  });
});
