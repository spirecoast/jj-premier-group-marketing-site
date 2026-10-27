import assert from "node:assert/strict";
import { test } from "node:test";
import { guidePdfHref } from "./guides";
import { nextStepFor, teamMenu } from "./site";

test("the phone bar's next step: each page's own, or none", () => {
  assert.deepEqual(nextStepFor("/listings/123-main"), { label: "Showing", href: "#inquire" });
  assert.deepEqual(nextStepFor("/sell/net-proceeds"), { label: "Your number", href: "#net-sheet" });
  assert.deepEqual(nextStepFor("/sell/home-value"), { label: "Get the number", href: "#ask" });
  assert.deepEqual(nextStepFor("/sell/sold"), { label: "Get the number", href: "#ask" });
  assert.deepEqual(nextStepFor("/valuation"), { label: "Get the number", href: "#ask" });
  assert.deepEqual(nextStepFor("/sell"), { label: "Home value", href: "/valuation" });
  assert.deepEqual(nextStepFor("/calendar"), { label: "Tonight", href: "#tonight" });
  assert.deepEqual(nextStepFor("/calendar/plan"), { label: "Ask us", href: "#ask" });
  assert.deepEqual(nextStepFor("/neighborhoods/the-lake-club"), { label: "On the map", href: "/neighborhoods?place=the-lake-club" });
  assert.equal(nextStepFor("/neighborhoods/match"), null);
  assert.equal(nextStepFor("/neighborhoods"), null);
  assert.equal(nextStepFor("/"), null);
  assert.equal(nextStepFor("/about"), null);
  assert.equal(nextStepFor("/calendar/some-event"), null);
});

test("a guide's next step is its PDF, at the path the guides serve it from", () => {
  const slug = "flood-zones-and-elevation-certificates-on-the-suncoast";
  assert.deepEqual(nextStepFor(`/guides/${slug}`), { label: "PDF", href: guidePdfHref(slug) });
  assert.equal(nextStepFor("/guides"), null);
});

test("the team menu's items are real routes and keep the two-word rule for the bar", () => {
  assert.deepEqual(
    teamMenu.items.map((i) => i.href),
    ["/about", "/contact", "/refer", "/reviews"],
  );
});
