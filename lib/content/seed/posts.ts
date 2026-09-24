import type { Post } from "../types";
import { h, img, p, quote, rich } from "./helpers";

/**
 * The Coast Market Report and a few guides. One page a quarter:
 * lead with the number that surprised us, name the streets, own what we
 * got wrong last time.
 */
export const POSTS: Post[] = [
  {
    _id: "post-guide-hoa-cdd",
    title: "What to ask before you buy in a gated community.",
    slug: "what-to-ask-before-you-buy-in-a-gated-community",
    cover: img("library/lwr-lakefront-row", "Lakefront homes along a quiet street"),
    excerpt:
      "HOA dues, CDD assessments, reserves, rules and the estoppel letter. The documents that decide whether a house in a master-planned community is the right one.",
    publishedAt: "2026-09-01",
    author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
    categories: ["Guides"],
    body: rich(
      p(
        "Most of Lakewood Ranch and a good part of Sarasota and Bradenton is inside a homeowners association, and many of those communities also sit inside a community development district. Both cost money every year, both come with rules, and both are knowable before you make an offer. Here’s what we ask for.",
      ),
      h(2, "The HOA budget and reserves"),
      p(
        "Ask for the current budget, the reserve study if there is one, and the last two years of financial statements. You’re looking for whether the dues actually cover what the association maintains, and whether there’s money set aside for the roof on the clubhouse and the resurfacing of the roads. A community that has skipped its reserves will ask you for the difference later, and it’ll be called a special assessment.",
      ),
      h(2, "The CDD line on the tax bill"),
      p(
        "A community development district is a separate unit of government that borrowed money to build the roads, lakes and amenities, and pays it back through an assessment on each lot’s property tax bill. It isn’t part of the HOA dues, and it doesn’t go away when you pay off the mortgage. Pull the tax bill for the exact parcel and read the non-ad valorem section. That number is real and it’s yours.",
      ),
      h(2, "The rules"),
      p(
        "Read the covenants and the architectural guidelines before you fall for a house. Fence heights, paint colors, boats and trailers in the driveway, how long a home can be rented and to whom, and whether you can put in a pool where you want one. Every one of these has ended a deal we’ve seen. None of them is a surprise if you read the documents first.",
      ),
      h(2, "The estoppel letter"),
      p(
        "Before closing, the association issues an estoppel certificate stating what the seller owes and what transfers with the property. Read it for unpaid fines, pending assessments and any transfer or capital contribution fee the buyer pays on the way in. Those fees are common in newer communities and easy to miss on a first pass.",
      ),
      quote("The house is what you fall in love with. The documents are what you live with."),
      p(
        "Send us the address and we’ll pull the documents and read them with you. It’s the part of buying here that most people wish someone had explained sooner.",
      ),
    ),
  },
  {
    _id: "post-guide-inspections",
    title: "Inspections on the Suncoast: what a good one covers.",
    slug: "inspections-on-the-suncoast-what-a-good-one-covers",
    cover: img("library/listing-exterior-canal-golden", "A canal-front home in the late light"),
    excerpt:
      "The four-point, the wind mitigation, the termite letter, the roof, the seawall and the dock. Why an inspection here is different from the one you had up north.",
    publishedAt: "2026-08-14",
    author: { name: "Jessica Garza", slug: "jessica-garza" },
    categories: ["Guides"],
    body: rich(
      p(
        "A general home inspection is the start, not the whole list. On this coast, the insurance company and the lender each want their own paperwork, and the water adds a few things nobody inspects in a landlocked state. Here’s the set we order and why.",
      ),
      h(2, "The four-point and the wind mitigation"),
      p(
        "Insurers on older homes ask for a four-point inspection: roof, electrical, plumbing and heating and cooling, with ages and conditions. The wind mitigation report documents the roof shape, how the roof deck is attached, whether the openings are protected, and other features that earn credits on the premium. Both are short, both are cheap, and both can change the insurance quote enough to change whether the house pencils.",
      ),
      h(2, "The roof"),
      p(
        "Roof age drives the insurance conversation more than any other single fact. Ask for the permit for the last replacement and the material. If the roof is near the end of the life the insurers use, expect the quote to reflect it, and plan for the replacement in your number.",
      ),
      h(2, "Termites and moisture"),
      p(
        "A wood-destroying organism inspection is standard here, and so is looking for moisture where the building meets the ground and around every window. Stucco over block handles our climate well when it’s maintained; when it isn’t, the problems hide behind a fresh coat of paint.",
      ),
      h(2, "Seawalls, docks and lifts"),
      p(
        "If the house is on a canal or the bay, the seawall is the most expensive thing on the lot that nobody looks at. A marine contractor can assess the cap, the panels and the tiebacks. The dock and the lift get their own look, and so does the depth at low tide if you’re bringing a boat.",
      ),
      h(2, "The flood paperwork"),
      p(
        "Ask for the elevation certificate and any flood insurance history the seller has. The certificate moves the quote more than anything else on a waterfront street. If there isn’t one, we order it during the inspection period.",
      ),
      p(
        "We keep a short list of inspectors and marine contractors we trust, and we’re at every inspection. Ask us for the list before you write an offer so the timeline already fits.",
      ),
    ),
  },
  {
    _id: "post-guide-selling-from-away",
    title: "Selling a home you don’t live in.",
    slug: "selling-a-home-you-dont-live-in",
    cover: img("library/moment-contract", "A contract on a kitchen island"),
    excerpt:
      "Out of state, out of season, or handling a family home. How a sale runs when the owner isn’t here, from the keys to the closing.",
    publishedAt: "2026-07-22",
    author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
    categories: ["Guides"],
    body: rich(
      p(
        "A lot of the homes we sell belong to someone who isn’t here: seasonal owners back up north, someone handling a parent’s house, people who moved for work before the house sold. The sale runs the same way, with a few parts that need planning. Here’s how we handle each of them.",
      ),
      h(2, "The keys and the house"),
      p(
        "We hold the keys, set the showing instructions and check the house after showings. If the house is empty, we make sure the air conditioning stays on and the insurance carrier knows the home is vacant, because some policies change when nobody lives there. If it’s furnished, we tell you what to leave and what to clear before the photographs.",
      ),
      h(2, "The paperwork"),
      p(
        "Listing agreements, disclosures and the contract itself are signed electronically. The closing documents can be signed in front of a notary where you are, or by remote online notarization where the title company allows it. If someone else needs to sign for you, a power of attorney has to be drafted for that purpose and reviewed by the title company before closing, not the week of.",
      ),
      h(2, "Estates and trusts"),
      p(
        "If the home is in an estate or a trust, the title company will need the documents that show who has the authority to sell. Getting those in order before the listing goes live is the single thing that keeps a closing on schedule. We’ll tell you what they’ll ask for on the first call.",
      ),
      h(2, "The weekly report"),
      p(
        "You get the showing feedback, the market activity on the street and our read on it, every week, in writing. When an offer comes in, you get it the same way, with our recommendation and the reason for it. Nothing about being away should mean knowing less.",
      ),
      quote("The house is here. You don’t have to be. Someone who reads the documents does."),
      p(
        "Tell us where you are and where the house is. We’ll set the timeline around your travel, not the other way around.",
      ),
    ),
  },
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
      h(2, "What we’d do"),
      p(
        "If you’re selling on the Ranch this fall, price to the spring comps, not the summer listings around you. If you’re buying, the 2021 builds in the new villages are where the negotiation is. Tell us the timing and we’ll tell you which street.",
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
        "A surveyor's document that states the finished floor height against the base flood elevation. It is the single page that moves a quote most. Ask for it before you make an offer; if the seller doesn’t have one, we order it during inspection.",
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
        "Weeks one and two: we walk the house and tell you what we’d change. Usually it is three things, and one of them is the front door. Weeks three to six: the work. Paint, the roof inspection, the pool cage screens, the seawall report if there’s water. Weeks seven and eight: staging, photography, the video walk-through at four in the afternoon when the light is right.",
      ),
      h(2, "What not to do"),
      p(
        "Do not renovate the kitchen. Do not replace the roof unless it will not pass a four-point inspection. Do not price to the listing next door; price to the sale two doors down.",
      ),
      p("Tell us the timing. October is when the plan gets easy."),
    ),
  },
];
