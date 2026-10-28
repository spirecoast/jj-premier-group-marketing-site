import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { HOME_FAQS } from "../../components/home/questions";
import data from "../../neighborhood-data/data/neighborhoods.json";
import { NEIGHBORHOODS } from "../content/seed/neighborhoods";
import { checkFairHousing } from "../fair-housing";
import { GUIDES } from "../guides";
import { HUBS } from "../hubs/copy";
import type { NeighborhoodRecord } from "../neighborhoods/types";
import { FAQS } from "../relocate/copy";
import { buildBank, placeFactsOf } from "./bank";
import { answerStrings } from "./copy";
import { answerFor, bestDefinition, buildMatcher, declineTopic, factField, factLine, isQuestion, namedPlaces, norm } from "./match";
import type { Answer } from "./types";

const records = data as unknown as NeighborhoodRecord[];
const bank = buildBank({
  hubs: Object.values(HUBS),
  editorial: NEIGHBORHOODS,
  records,
  relocate: FAQS,
  home: HOME_FAQS.map((f) => ({ q: f.q, answer: f.answer })),
  guides: GUIDES,
});
const m = buildMatcher(bank);
const ask = (q: string) => answerFor(q, m);
const asked = (q: string) => {
  const a = ask(q);
  return a && a.kind !== "decline" ? a.question : a?.kind ?? null;
};

describe("question shape", () => {
  test("a question word first, or a question mark, reads as a question", () => {
    for (const q of ["is Lakewood Ranch in Manatee or Sarasota County", "what's a CDD", "flood insurance?", "How do I find my evacuation zone"]) assert.ok(isQuestion(q), q);
  });
  test("a topic, a place or a street does not", () => {
    for (const q of ["flood insurance", "lakewood ranch", "Lilac Sky Dr", "is", "what?"]) assert.equal(isQuestion(q), false, q);
  });
  test("norm folds case, accents, curly apostrophes and punctuation", () => {
    assert.equal(norm("What’s  a CDD?"), "whats a cdd");
    assert.equal(norm("Café & Bar"), "cafe and bar");
  });
});

describe("places named in a query", () => {
  test("the longest name wins and a county phrase is not the place", () => {
    const n = namedPlaces("is Lakewood Ranch in Manatee or Sarasota County", m.ix);
    assert.deepEqual([...n.keys], ["market:lakewood-ranch"]);
    assert.ok(!n.keys.has("market:sarasota"));
  });
  test("a leading 'the' is optional", () => {
    assert.ok(namedPlaces("is the lake club gated", m.ix).keys.has("place:the-lake-club"));
    assert.ok(namedPlaces("lake club hoa", m.ix).keys.has("place:the-lake-club"));
  });
  test("a common word that is also a place's name is read as the word", () => {
    assert.equal(namedPlaces("homes on the river", m.ix).keys.size, 0);
  });
});

describe("answers from the site's own questions", () => {
  test("the review's example: the county question is answered from the Lakewood Ranch page", () => {
    const a = ask("is Lakewood Ranch in Manatee or Sarasota County") as Exclude<Answer, { kind: "decline" }>;
    assert.equal(a.kind, "faq");
    assert.equal(a.from.url, "/lakewood-ranch#hub-faq-title");
  });
  test("the same question, worded the hub's way and others", () => {
    assert.equal(asked("which county is lakewood ranch in"), "Which county is Lakewood Ranch in?");
    assert.equal(asked("what flood zone is siesta key in"), "What flood zone is Siesta Key in?");
    assert.equal(asked("how long does it take to buy a home"), "How long does it take to buy a home here?");
    assert.equal(asked("is there an hoa in west bradenton"), "Is there an HOA in West Bradenton?");
    assert.equal(asked("what's a CDD"), "What’s a CDD, and does every village have one?");
  });
  test("a question about a whole region stands for any of the three markets", () => {
    assert.equal(asked("do I need flood insurance in Sarasota"), "Do I need flood insurance in Lakewood Ranch, Sarasota or Bradenton?");
  });
  test("a question about a place needs the query to name that place", () => {
    // Downtown Bradenton's page answers this; the query doesn't say where.
    assert.equal(ask("what's the flood situation by the river"), null);
    // Sarasota's hub answers the title question for Sarasota County; the relocation page answers it in general.
    assert.equal(asked("who pays for the owner's title policy"), "Who pays for the owner's title policy?");
  });
  test("the place's own question beats its market's", () => {
    assert.equal(asked("is anna maria island in a flood zone"), "Is the whole island in a flood zone?");
  });
  test("nothing for noise, a bare topic or a question the site doesn't answer", () => {
    for (const q of ["xyzzy blorp", "flood zone", "lakewood ranch", "does sarasota have good restaurants", "where is the farmers market", "how do I find a home inspector"]) assert.equal(ask(q), null, q);
  });
});

describe("definitions from the guides", () => {
  test("what is a term the guide defines", () => {
    assert.equal(bestDefinition("what is an elevation certificate", bank)?.term, "Elevation certificate");
    assert.equal(bestDefinition("what are reserves", bank)?.term, "Reserves");
    assert.equal(bestDefinition("define estoppel certificate", bank)?.term, "Estoppel certificate");
  });
  test("only the whole term, not a word of it", () => {
    assert.equal(bestDefinition("what is a certificate", bank), null);
  });
});

describe("one sourced fact about one place", () => {
  test("a fact the record holds and cites", () => {
    const a = ask("is camargo in a cdd") as Exclude<Answer, { kind: "decline" }>;
    assert.equal(a.kind, "fact");
    assert.equal(a.text, "Yes. Camargo is in the Lakewood Ranch Stewardship District.");
    assert.ok(a.source?.url.startsWith("https://"));
    assert.match(a.source!.checked, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(a.from.url, "/neighborhoods/camargo");
  });
  test("an evacuation level says where it was read and points to the address check", () => {
    const a = ask("belleisle evacuation level") as Exclude<Answer, { kind: "decline" }>;
    assert.equal(a.kind, "fact");
    assert.match(a.text, /address point we checked/);
    assert.equal(a.next?.url, "/check");
  });
  test("a fact about the place named beats a general answer from its market's page", () => {
    assert.equal(asked("is the lake club in a cdd"), "Is The Lake Club in a CDD?");
  });
  test("an unknown fact is no answer, never a guess", () => {
    const p = placeFactsOf({ ...records.find((r) => r.research === "full")!, gated: null, sources: [] });
    assert.equal(factLine(p, "gated"), null);
    assert.equal(ask("is waterside gated"), null);
  });
  test("two facts in one question go to the page instead", () => {
    assert.equal(factField("is it gated and in a cdd"), null);
    assert.equal(factField("which county is it in"), "county");
  });
  test("every fact the bank can state is cited", () => {
    for (const p of bank.places) {
      for (const f of ["county", "gated", "hoa", "cdd", "evacuation", "zips", "jurisdiction", "water"] as const) {
        const s = p.sources[f];
        if (s) assert.ok(s.url && s.checked, `${p.key} ${f}`);
      }
    }
  });
});

describe("what we don't answer", () => {
  test("school quality, safety and who lives where get a decline, never an answer", () => {
    assert.equal(declineTopic("best schools in lakewood ranch"), "schools");
    assert.equal(declineTopic("is lakewood ranch good for families"), "people");
    assert.equal(declineTopic("safe neighborhoods in sarasota"), "safety");
    assert.equal(declineTopic("crime in bradenton"), "safety");
    assert.equal(ask("is siesta key safe")?.kind, "decline");
  });
  test("the same words about a house, a deposit or the land are not declined", () => {
    assert.equal(declineTopic("is my deposit safe"), null);
    assert.equal(declineTopic("safe from flooding"), null);
    assert.equal(declineTopic("school taxes on the tax bill"), null);
    assert.equal(declineTopic("kids theater"), null);
  });
  test("the school decline links both districts' locators", () => {
    const a = ask("top rated schools near waterside");
    assert.equal(a?.kind, "decline");
    assert.equal(a?.kind === "decline" ? a.links.filter((l) => l.external).length : 0, 2);
  });
});

describe("the bank's words", () => {
  test("every answer the card can show passes the Fair Housing check", () => {
    for (const f of bank.faqs) assert.equal(checkFairHousing(`${f.q} ${f.answer}`).passed, true, f.id);
    for (const d of bank.definitions) assert.equal(checkFairHousing(d.definition).passed, true, d.id);
    for (const s of answerStrings()) assert.equal(checkFairHousing(s.text).passed, true, s.where);
  });
  test("every FAQ and definition points at a page and anchor on this site", () => {
    for (const e of [...bank.faqs, ...bank.definitions]) assert.match(e.url, /^\/[a-z0-9/-]*#[a-z0-9-]+$/, e.id);
  });
});
