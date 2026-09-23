import type { Post } from "../types";
import { h, img, p, quote, rich } from "./helpers";

/**
 * The Coast Market Report and a few guides. One page a quarter, no pitch:
 * lead with the number that surprised us, name the streets, own what we
 * got wrong last time.
 */
export const POSTS: Post[] = [
  {
    _id: "post-q3-2026-letter",
    title: "Inventory doubled on the Ranch this quarter and prices did not move.",
    slug: "q3-2026-inventory-doubled-prices-did-not-move",
    edition: "Q3 2026",
    cover: img("library/manatee-river-dusk", "The Manatee River at dusk"),
    excerpt:
      "One page, once a quarter. What your street actually did, what it means for you, and what we got wrong last time.",
    publishedAt: "2026-07-15",
    author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
    categories: ["Market report"],
    body: rich(
      p(
        "Ninety-one homes were for sale in Lakewood Ranch on the first of July. On the first of April it was forty-four. That is the number that surprised us, and the second number is the one that did not: the median closed price per square foot was $712, against $709 in the spring.",
        "So the Ranch has twice the choice and the same prices. That is not a contradiction. Most of the new inventory is 2021 and 2022 builds in the newer villages, listed by owners who bought at the top and priced to get out whole. Those homes are sitting. The homes that sold were the ones on water, on a cul-de-sac, or with a kitchen someone had actually finished.",
      ),
      h(2, "The streets"),
      p(
        "Cliffside Terrace in The Lake Club: four sales, all inside nine days, all at or above list. Waterside Way: three sales, thirty-one, forty and fifty-two days, all below the first price. The difference was not the houses. It was the first number.",
        "West of the Trail in Sarasota did the same thing with fewer homes: twenty-three closings at a median of $742, and the three that took longest were the three that started highest.",
      ),
      h(2, "What we got wrong"),
      p(
        "In April we wrote that Bradenton's canal streets would slow down over the summer. They did not. Zone X lots west of 75th sold in eleven days on average, because the insurance quote is the whole conversation now and those streets win it.",
        "We also said the bayfront condominiums in Sarasota would keep sliding. Units in recertified buildings held; units in buildings with a special assessment pending dropped nine percent. It was never one market.",
      ),
      h(2, "What we would do"),
      p(
        "If you are selling on the Ranch this fall, price to the spring comps, not the summer listings around you. If you are buying, the 2021 builds in the new villages are where the negotiation is. Tell us the timing and we will tell you which street.",
      ),
    ),
  },
  {
    _id: "post-q2-2026-letter",
    title: "What we got wrong last quarter, and the two streets that proved it.",
    slug: "q2-2026-what-we-got-wrong",
    edition: "Q2 2026",
    cover: img("library/place-storm-gulf", "A storm over the Gulf"),
    excerpt:
      "The spring letter, with the winter's predictions marked against what happened. Bradenton was the surprise.",
    publishedAt: "2026-04-15",
    author: { name: "Jessica Garza", slug: "jessica-garza" },
    categories: ["Market report"],
    body: rich(
      p(
        "In January we said inventory would stay tight through the spring. Forty-four active listings on the Ranch on April first says we were right about that and wrong about what it would do to prices, which held at $709 rather than rising.",
        "Bradenton was the surprise. Sixty-eight closings west of 75th at a median of $389 per foot, up from $361, and the canal streets in zone X led it. The insurance renewals landed in February and buyers did the arithmetic.",
      ),
      h(2, "Siesta Key"),
      p(
        "308 Riverwalk Court sold in nine days at 104 percent of list. Priced right, that street clears asking; the two listings that started $300,000 higher are still there. We had one of them and we said so at the time.",
      ),
      h(2, "The sentence for sellers"),
      p(
        "The first number is the only number. Everything after it is a conversation about why the first one was wrong.",
      ),
    ),
  },
  {
    _id: "post-water-table",
    title: "Ask us about the water table.",
    slug: "ask-us-about-the-water-table",
    cover: img("library/place-mangrove-tunnel", "A mangrove tunnel on the bay"),
    excerpt:
      "Flood zones X, AE and VE, elevation certificates, and why the insurance quote is now the first question on any waterfront street.",
    publishedAt: "2026-05-20",
    author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
    categories: ["Guides"],
    body: rich(
      p(
        "Every waterfront conversation on this coast now starts with a letter. X, AE or VE. It decides the insurance quote, the lender's requirement, and often whether a house is worth the drive.",
      ),
      h(2, "The three letters"),
      p(
        "Zone X is outside the special flood hazard area. Flood insurance is optional for a lender and usually inexpensive. Several canal streets in West Bradenton and most of the Ranch sit here.",
        "Zone AE is the hundred-year floodplain with a base flood elevation on the map. Insurance is required with a mortgage, and the premium depends on how the finished floor compares to that elevation. Most of Siesta Key and the bayfront is AE.",
        "Zone VE is AE with wave action. Beachfront and open-bay lots. Construction rules are stricter and premiums are higher.",
      ),
      h(2, "The elevation certificate"),
      p(
        "A surveyor's document that states the finished floor height against the base flood elevation. It is the single page that moves a quote most. Ask for it before you make an offer; if the seller does not have one, we order it during inspection.",
      ),
      quote("The map tells you the zone. The neighbors tell you what happened the last time it rained for three days. Ask both."),
      p(
        "History matters as much as the map. We ask what a street did in the last big storms before you fall in love with the kitchen, and we tell you what we hear.",
      ),
    ),
  },
  {
    _id: "post-start-in-october",
    title: "Thinking about spring? Start in October.",
    slug: "thinking-about-spring-start-in-october",
    cover: img("library/moment-key-handoff", "Keys handed over at a closing table"),
    excerpt:
      "Prep takes eight weeks and the good photographers book six ahead. The sellers who list in February started in the fall.",
    publishedAt: "2026-08-28",
    author: { name: "Jessica Garza", slug: "jessica-garza" },
    categories: ["Selling"],
    body: rich(
      p(
        "The spring market on the Suncoast opens the week after the Super Bowl and peaks in April. The homes that sell in that window were photographed in January, and the ones photographed in January were painted in November.",
      ),
      h(2, "The eight weeks"),
      p(
        "Weeks one and two: we walk the house and tell you what we would change. Usually it is three things, and one of them is the front door. Weeks three to six: the work. Paint, the roof inspection, the pool cage screens, the seawall report if there is water. Weeks seven and eight: staging, photography, the video walk-through at four in the afternoon when the light is right.",
      ),
      h(2, "What not to do"),
      p(
        "Do not renovate the kitchen. Do not replace the roof unless it will not pass a four-point inspection. Do not price to the listing next door; price to the sale two doors down.",
      ),
      p("Tell us the timing. October is when the plan gets easy."),
    ),
  },
];
