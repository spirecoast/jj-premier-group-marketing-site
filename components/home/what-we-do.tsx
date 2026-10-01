import { SectionHeading } from "@/components/section-heading";
import { products } from "@/lib/site";

/**
 * 03 · What we do for you. Process and promises only: what a buyer gets,
 * what a seller gets, and the three things both get. Nothing here is a
 * record; the team is new, and the page says what happens instead. Two
 * columns on desktop with a short third band, stacked on phones.
 */
type Step = { when: string; title: string; body: string };

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

/** Every sentence above, for the fair-housing check in scripts and tests. */
export const WHAT_WE_DO_COPY = [
  ...BUYER_PROMISES.flatMap((p) => [p.when, p.title, p.body]),
  ...SELLER_PROMISES.flatMap((p) => [p.when, p.title, p.body]),
  ...BOTH_PROMISES.flatMap((p) => [p.title, p.body]),
].join("\n");

function Column({ id, eyebrow, title, items }: { id: string; eyebrow: string; title: string; items: Step[] }) {
  return (
    <div className="flex flex-col gap-8" role="group" aria-labelledby={id}>
      <div className="flex flex-col gap-3 border-b border-rule pb-5">
        <p className="t-eyebrow text-amber">{eyebrow}</p>
        <h3 id={id} className="t-h2 text-navy">
          {title}
        </h3>
      </div>
      <ol className="flex flex-col gap-7">
        {items.map((p, i) => (
          <li key={p.title} className="grid gap-2 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-6">
            <div className="flex flex-col gap-1">
              <span className="t-record text-navy">{String(i + 1).padStart(2, "0")}</span>
              <span className="t-mono-sm text-graphite-500">{p.when}</span>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-display text-[1.5rem] font-light leading-[1.15] text-navy">{p.title}</h4>
              <p className="t-body max-w-[52ch] text-body">{p.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function WhatWeDo() {
  return (
    <section className="bg-parchment" aria-labelledby="what-title">
      <div className="container-site flex flex-col gap-14 py-section">
        <SectionHeading
          number="03"
          eyebrow="What we do for you"
          size="display"
          title={<span id="what-title">Here’s what we’d do, for a buyer and for a seller.</span>}
          titleClassName="max-w-[900px]"
          aside={
            <p className="t-body max-w-[380px] text-body-muted">
              The steps in order, and what you get in writing at each one.
            </p>
          }
        />
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <Column id="what-buyer" eyebrow="For a buyer" title="From the first call to the keys." items={BUYER_PROMISES} />
          <Column id="what-seller" eyebrow="For a seller" title="From the walk-through to the closing table." items={SELLER_PROMISES} />
        </div>
        <div className="flex flex-col gap-8 border-t border-rule pt-10">
          <p className="t-eyebrow text-amber">Both get</p>
          <ul className="grid gap-8 md:grid-cols-3 md:gap-10">
            {BOTH_PROMISES.map((p) => (
              <li key={p.title} className="flex flex-col gap-2">
                <h3 className="font-display text-[1.5rem] font-light leading-[1.15] text-navy">{p.title}</h3>
                <p className="t-body max-w-[40ch] text-body">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
