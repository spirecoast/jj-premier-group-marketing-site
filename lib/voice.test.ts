import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aiTells } from "./voice";

describe("the voice rules", () => {
  it("flag the phrases the owner named, and the rest of the list", () => {
    for (const s of [
      "Here’s the read on July.",
      "The median hit the mark.",
      "The takeaway is simple.",
      "The bottom line for sellers.",
      "We delve into the numbers.",
      "Let’s dive in.",
      "A deep dive into Sarasota.",
      "In today’s market, prices move.",
      "It’s worth noting that sales rose.",
      "Here’s the thing about July.",
      "Let's look at Bradenton.",
      "A game-changer for buyers.",
      "Unlock your home’s value.",
      "A robust month.",
      "A seamless closing.",
      "Elevate your search.",
      "A home nestled by the bay.",
      "A vibrant downtown.",
      "A bustling month.",
      "A whole new way to buy.",
      "A house isn’t just a house.",
      "It’s not just the price, but the street.",
      "Whether you’re buying or selling, call.",
      "At the end of the day, it’s the price.",
      "Buckle up for spring.",
      "Spoiler: prices held.",
      "The answer: price per square foot.",
      "The issue lands on the first.",
      "Wondering what your home’s worth? Start with your street.",
      "The housing landscape is changing.",
      "A rich tapestry of streets.",
      "A testament to the market.",
      "Navigating the closing.",
    ]) {
      assert.ok(aiTells(s).length > 0, s);
    }
  });
  it("leave honest uses alone", () => {
    for (const s of [
      "The market was busy in July.",
      "Mark the date on your calendar.",
      "The parts are listed with a numbered mark on each.",
      "The reader sees every number.",
      "Read the guide first.",
      "Florida law lets you move that gap.",
      "Cross that line and the house has to be brought up, which usually means elevating or rebuilding.",
      "The reserves can be paid with a loan or a line of credit, not just with dues.",
      "Oil paintings of Florida landscape, ecology and history.",
      "What is a CDD?",
      "When do you need to be in, and is there a house to sell first? Those two answers change everything else.",
      "How high does it sit? How far is it from water?",
      "Conservation lands and buildings on the county roll.",
      "Unlock the lockbox before the showing.",
    ]) {
      assert.deepEqual(aiTells(s), [], s);
    }
  });
});
