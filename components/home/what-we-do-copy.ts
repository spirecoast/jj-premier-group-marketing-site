import { products } from "@/lib/site";

/**
 * 04 · What we do for you: the copy, kept apart from the layout so every
 * treatment in ./variants reads the same words. Process and promises only:
 * what a buyer gets, what a seller gets, and the three things both get.
 * Nothing here is a record; the team is new, and the page says what happens
 * instead. Photographs belong to the treatment that renders them, so a
 * frame used by one layout can never fail the module every layout imports.
 */
export type Step = { when: string; title: string; body: string };

export const BUYER_PROMISES: Step[] = [
  {
    when: "The first call",
    title: "Two questions before we look at anything",
    body:
      "When do you need to be in, and is there a house to sell first? Those two answers set the budget, the streets and which Saturday we start. Then a pre-approval letter from a local lender, because that’s the first thing a seller here reads.",
  },
  {
    when: "Showings",
    title: "The homes worth your Saturday",
    body:
      "We go through the listings before you do and tell you which ones we’d actually go and see. Flood zone, HOA, the age of the roof, before you get in the car. If you’re buying from away, we walk the house on video, slowly, and open the closets.",
  },
  {
    when: "Offer and inspection",
    title: "Written to the sold price, not the list",
    body:
      "We talk to the listing agent before we write anything, then write to what the street has sold for. Inside the inspection period a licensed inspector goes through the house, and we sort what they find into cosmetic, ask the seller, and walk away. On the standard Florida AS IS contract, cancelling inside that period usually means your deposit comes back; we’ll walk you through the dates.",
  },
  {
    when: "After every step",
    title: "A written update",
    body:
      "A short note after every step: what happened, what’s next, and the date it happens. Escrow, appraisal, insurance, the walk-through. You never have to ask where things stand.",
  },
];

export const SELLER_PROMISES: Step[] = [
  {
    when: "Day one",
    title: "The walk-through",
    body: "Both of us come to the house and walk it the way a buyer will: the roof, the water, which end of the street.",
  },
  {
    when: "That day or the next",
    title: "A written range, with the sales behind it",
    body:
      "You get the number in writing with the recent closed sales it came from, adjusted for the things that matter here. A number without the sales behind it is a guess, and we don’t send those.",
  },
  {
    when: "The weeks before",
    title: "The preparation list",
    body:
      "A short list of what we’d change before the photos, in the order buyers notice: paint, light, the front door. A new kitchen often doesn’t pay for itself before you sell, and we’ll say so before you spend a dollar.",
  },
  {
    when: "Going live",
    title: "Photography and the first weekend",
    body: "Photos in the afternoon light, live on a Thursday, showings from Friday. Nothing goes live until the house is ready.",
  },
  {
    when: "Every Monday",
    title: "The written report",
    body: "How many came through, what they said, and whether the number is right. In writing, every week the house is on the market.",
  },
  {
    when: "At offers",
    title: "Side by side, then a recommendation",
    body:
      "Every offer laid out the same way: price, financing, deposit, inspection period, whether the buyer has a house to sell. The highest isn’t always the one to take, and we’ll tell you which one is and why.",
  },
];

export const BOTH_PROMISES: { title: string; body: string }[] = [
  {
    title: "Two agents on every file",
    body: "Both of us, on every file. One of us is always reachable, and both of us know where your deal stands on any given day.",
  },
  {
    title: "Straight answers, including the expensive parts",
    body: "The seawall, the roof, the flood zone, the kitchen that won’t pay for itself. If we’d wait, we’ll say so.",
  },
  {
    title: "Three free tools, built for this coast",
    body: `${products[0]!.name}, the map of every place in Lakewood Ranch, Sarasota and Bradenton. ${products[1]!.name}, what’s on tonight and this weekend. ${products[2]!.name}, one page a month on what the three markets did. Yours whether or not you ever call us.`,
  },
];

/** The two column headings and the section's own lines, shared by every treatment. */
export const WHAT_WE_DO = {
  title: "Here’s what we’d do, for a buyer and for a seller.",
  aside: "The steps in order, and what you get in writing at each one.",
  buyer: { eyebrow: "For a buyer", title: "From the first call to the keys." },
  seller: { eyebrow: "For a seller", title: "From the walk-through to the closing table." },
  both: "Both get",
} as const;

/** Every sentence above, for the fair-housing check in scripts and tests. */
export const WHAT_WE_DO_COPY = [
  ...BUYER_PROMISES.flatMap((p) => [p.when, p.title, p.body]),
  ...SELLER_PROMISES.flatMap((p) => [p.when, p.title, p.body]),
  ...BOTH_PROMISES.flatMap((p) => [p.title, p.body]),
].join("\n");
