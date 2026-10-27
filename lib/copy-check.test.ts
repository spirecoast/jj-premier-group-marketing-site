import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeEntities, literals } from "../scripts/copy-literals.mjs";
import { peopleHits } from "../scripts/copy-rules.mjs";
import { aiTells } from "./voice";

const texts = (src: string) => literals(src).map((l: { text: string }) => l.text);

describe("the copy check's source scan", () => {
  it("reads JSX text written with entities as a reader sees it", () => {
    assert.equal(decodeEntities("We&rsquo;re here &amp; there&nbsp;today &#8212; &#x2019;"), "We’re here & there today — ’");
    assert.equal(decodeEntities("&notanentity; stays"), "&notanentity; stays");
    const found = texts(`export const A = () => (
      <p className="t-body">
        Whether you&rsquo;re buying your first home, selling, or building a portfolio, call us.
      </p>
    );`);
    assert.deepEqual(found, ["Whether you’re buying your first home, selling, or building a portfolio, call us."]);
    assert.ok(aiTells(found[0]!).length > 0, "the banned opener is caught once decoded");
  });

  it("keeps a sentence with a semicolon, and text that meets an expression", () => {
    const found = texts(`const B = () => (
      <p>
        We&rsquo;re a team with {site.brokerage}. We help people buy and sell; we answer every call.
      </p>
    );`);
    assert.ok(found.includes("We’re a team with"), found.join(" | "));
    assert.ok(found.includes(". We help people buy and sell; we answer every call."), found.join(" | "));
  });

  it("leaves code between braces alone", () => {
    const found = texts(`import { a, b } from "./x";
      import type { C } from "./y";
      const D = () => <span>{typical ? W.vsTypicalMore : W.vsTypicalFewer}</span>;
      function f(x: Array<string>) { return x.length > 2 && x.length < 9; }`);
    assert.deepEqual(found, []);
  });
});

describe("places, never people, over the site's source", () => {
  const reasons = (where: string, text: string) => peopleHits(where, text).map((r: { reason: string }) => r.reason);

  it("flags a judgment about part of a street or town", () => {
    for (const s of [
      "We tell you the flood zone, the age of the roof and which end of the street is the good one.",
      "A kitchen rebuilt in 2019, and the good end of the street.",
      "It's on the right side of town.",
      "The better part of the island for a first home.",
    ]) {
      assert.ok(reasons("app/(site)/about/page.tsx", s).some((r) => r.startsWith("steering")), s);
    }
  });

  it("flags people words outside their honest uses", () => {
    assert.ok(reasons("components/x.tsx", "A great street for families.").length > 0);
    assert.ok(reasons("components/x.tsx", "Close to the best schools.").length > 0);
    assert.ok(reasons("components/x.tsx", "A safe, quiet street.").length > 0);
  });

  it("leaves facts, names and taxes alone", () => {
    for (const s of [
      "Adjusted for the water, the flood zone, and which end of the street.",
      "The lake side of the street gets the evening light.",
      "Single-family homes, condos, villas and townhomes.",
      "Foreclosures and transfers between family members aren’t counted.",
      "The state runs a program called My Safe Florida Home.",
      "Exempt from every tax but school taxes.",
      "This website is not directed at children under sixteen.",
      "We do it the way we’d want it done for our own family.",
    ]) {
      assert.deepEqual(reasons("components/x.tsx", s), [], s);
    }
  });

  it("lets Atlas name zoned schools, and nothing else", () => {
    const s = "Jurisdiction, ZIPs, zoned schools and evacuation zone.";
    assert.deepEqual(reasons("app/(site)/neighborhoods/page.tsx", s), []);
    assert.ok(reasons("app/(site)/sell/page.tsx", s).length > 0);
  });
});
