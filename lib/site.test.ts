import assert from "node:assert/strict";
import { test } from "node:test";
import { guidePdfHref } from "./guides";
import { buyMenu, footerNav, hasOwnPhoneBar, nextStepFor, productFamilies, teamMenu } from "./site";

test("the phone bar's next step: each page's own, or none", () => {
  assert.deepEqual(nextStepFor("/listings/123-main"), { label: "Showing", href: "#inquire" });
  assert.deepEqual(nextStepFor("/sell/home-value"), { label: "Get the number", href: "#ask" });
  assert.deepEqual(nextStepFor("/sell/sold"), { label: "Get the number", href: "#ask" });
  assert.deepEqual(nextStepFor("/sell"), { label: "Home value", href: "/sell/home-value" });
  // The Sale Calculator's result bar takes the bottom edge, Call cell included, so the page has no middle cell.
  assert.equal(nextStepFor("/sell/net-proceeds"), null);
  assert.deepEqual(nextStepFor("/calendar"), { label: "Tonight", href: "#tonight" });
  assert.deepEqual(nextStepFor("/calendar/plan"), { label: "Ask us", href: "#ask" });
  assert.deepEqual(nextStepFor("/neighborhoods/the-lake-club"), { label: "On the map", href: "/neighborhoods?place=the-lake-club" });
  assert.equal(nextStepFor("/neighborhoods/match"), null);
  assert.equal(nextStepFor("/neighborhoods"), null);
  assert.equal(nextStepFor("/"), null);
  assert.equal(nextStepFor("/about"), null);
  assert.equal(nextStepFor("/calendar/some-event"), null);
});

test("the Sale Calculator is the one page with a bar of its own", () => {
  assert.equal(hasOwnPhoneBar("/sell/net-proceeds"), true);
  assert.equal(hasOwnPhoneBar("/sell/net-proceeds/"), false);
  assert.equal(hasOwnPhoneBar("/sell"), false);
  assert.equal(hasOwnPhoneBar("/"), false);
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

test("the Buy menu names the relocation door by its task, and marks only the pages that aren't a product's", () => {
  assert.deepEqual(
    buyMenu.items.map((i) => i.href),
    ["/buy", "/listings", "/relocate", "/neighborhoods/match"],
  );
  assert.ok(buyMenu.items.some((i) => i.label === "Moving here" && i.href === "/relocate"));
  // /relocate and /neighborhoods/match belong to Atlas, whose menu underlines them; Buy marks the guide and the listings.
  assert.deepEqual([...buyMenu.activeWhen], ["/buy", "/listings"]);
  const atlas = productFamilies.find((f) => f.key === "atlas")!;
  assert.ok(atlas.items.some((i) => i.href === "/relocate" && i.plain === "Moving here"));
  assert.ok(footerNav.buySell.some((l) => l.href === "/relocate" && l.label === "Moving here"));
});
