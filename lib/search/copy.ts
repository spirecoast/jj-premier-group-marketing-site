/**
 * The words of site search: the /search page and the hand-written summary of
 * each main page that goes into the index.
 *
 * No imports, so scripts/check-copy.mjs can load this file and run the Fair
 * Housing check and the house rules over every string. The summaries say only
 * what the page itself says; when a page changes, change its summary here and
 * the next reindex picks it up (the content hash changes).
 */

export const SEARCH_COPY = {
  title: "Search",
  description: "Search the guides, the neighborhoods, Tide, the Encore calendar and the rest of the site.",
  eyebrow: "Search",
  heading: "Search the site.",
  label: "Search the site",
  placeholder: "A question or a place",
  submit: "Search",
  clear: "Clear",
  emptyLead: "Try a question the way you'd ask it, or one of these:",
  suggestionsHeading: "Searches to start with",
  guidesHeading: "Or start with a guide",
  noResults: "Nothing on the site matches that yet.",
  noResultsHelp: "Try fewer words, or a different word for the same thing. If it's a question about a house or a place, ask us.",
  noResultsCta: "Ask Joelyn and Jessica",
  tooShort: "Type at least two letters.",
  fallbackNote: "Matching words only right now; the full search is catching up.",
  resultsFor: "for",
  oneResult: "1 result",
  manyResults: "{n} results",
  searching: "Searching…",
  shortcut: "Search the site",
  headerButton: "Search",
  /** A street or an address typed into search: the lead card to Tide Street and Home Value. */
  streetLead: "Looking for sales on {street}?",
  streetBody: "Tide Street has every qualified sale on that street from the county record.",
  streetCta: "See what sold on {street}",
  addressCta: "What’s my home worth",
  /** An address with its ZIP: Atlas Check. */
  checkCta: "Its flood and evacuation zone",
  zipLead: "Looking for sales in {zip}?",
  zipBody: "Tide Street shows every qualified sale on a street from the county record. Type the street and it narrows to {zip}.",
  zipCta: "Open Tide Street",
};

/** Real guide titles, shortened to what someone would type. Shown when the box is empty. */
export const SUGGESTED_SEARCHES = [
  "flood insurance",
  "CDD fees",
  "homestead exemption",
  "evacuation zone",
  "condo milestone inspection",
  "selling from out of state",
];

export type PageSummary = { url: string; title: string; summary: string[] };

/**
 * One entry per main page. Paragraphs, in the page's own terms. The hubs,
 * the relocation page's sections, the guides and Atlas places are indexed
 * from their own data (lib/search/sources.ts), so these stay short.
 */
export const PAGE_SUMMARIES: PageSummary[] = [
  {
    url: "/",
    title: "JJ Premier Group",
    summary: [
      "Joelyn Nauman and Jessica Garza, a mother and daughter team with Coldwell Banker Realty, helping people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton.",
      "The site has three tools: Atlas, the neighborhood explorer; Encore, the arts calendar; and Tide, the monthly newsletter on what the three markets did. There are plain-language guides to flood zones, insurance, homestead, CDDs, condo documents and selling.",
    ],
  },
  {
    url: "/buy",
    title: "The buyer's guide",
    summary: [
      "Buying a home in Lakewood Ranch, Sarasota or Bradenton in ten steps: make your wish list, work out your budget, get prequalified, choose your agent, find the right home, finalize your financing, make an offer, have the home inspected, get the appraisal, then close and get the keys.",
      "Two questions come first: when do you need to be in, and is there a house to sell first? Then a pre-approval letter from a local lender.",
      "Questions answered on the page: what escrow is and where the deposit goes, what gets inspected and what happens if something's wrong, whether you need flood insurance, what closing costs come to and who pays what, how long it takes and which months are busiest, and how to write an offer that wins without overpaying.",
    ],
  },
  {
    url: "/sell",
    title: "The seller's guide",
    summary: [
      "Selling a home in Lakewood Ranch, Sarasota or Bradenton in eight steps: know why you're selling, set the price, get the house ready, market it, review the offers, accept an offer, get ready to close, and close.",
      "We price to what the street has sold for, not the list. You get the number with the four comparable sales behind it.",
      "Questions answered on the page: how we arrive at the number, what to do to the house before it goes on the market, what it costs to sell (doc stamps on the deed, the owner's title policy, commission), when to list, what happens after you accept an offer, and whether you need to sell before you buy.",
    ],
  },
  {
    url: "/relocate",
    title: "Atlas Move, the moving planner",
    summary: [
      "Atlas Move plans a move to Lakewood Ranch, Sarasota or Bradenton: answer five questions and get every date and deadline on one page, from the Florida contract dates and when insurance has to be in place to homestead and the state's deadlines for a new resident. Add it to your calendar, print it or share the link.",
    ],
  },
  {
    url: "/about",
    title: "Meet Joelyn and Jessica",
    summary: [
      "Joelyn Nauman and Jessica Garza are a mother and daughter team with Coldwell Banker Realty. They help people buy, sell and invest across Lakewood Ranch, Sarasota and Bradenton.",
      "How they work: they're specific (the flood zone, the age of the roof, which end of the street), they tell you what they think, and they're both on your file, so you can call either one.",
    ],
  },
  {
    url: "/contact",
    title: "Contact",
    summary: [
      "Call, text or write to Joelyn Nauman and Jessica Garza. Two questions first: when do you need to be in, and is there a house to sell? Put whatever you know in the box, and one of them will write or call back.",
    ],
  },
  {
    url: "/listings",
    title: "Find your home",
    summary: [
      "Tell Joelyn and Jessica what you're looking for in Lakewood Ranch, Sarasota or Bradenton, and they'll bring you the homes worth seeing, with a straight read on each one.",
    ],
  },
  {
    url: "/tools",
    title: "Atlas, Encore and Tide",
    summary: [
      "Nine free tools for Lakewood Ranch, Sarasota and Bradenton, with no sign-up. Atlas, Atlas Match and Atlas Move help you find a neighborhood and plan the move, and Atlas Check gives the flood and evacuation zone for an address. Encore and Encore Planner show the theater, music and art. Tide, Tide Street and Tide Sale Calculator show what homes sold for and what you'd keep after selling.",
    ],
  },
  {
    url: "/neighborhoods",
    title: "Atlas, the neighborhood explorer",
    summary: [
      "An interactive map of more than two thousand areas, communities and enclaves across Lakewood Ranch, Sarasota and Bradenton: who governs each one, its ZIP codes, zoned schools, evacuation zone, builders and HOA, from county and district sources.",
      "Search by name, filter by market, level, type and status, and share any view as a link.",
    ],
  },
  {
    url: "/neighborhoods/match",
    title: "Atlas Match: find the neighborhoods that fit",
    summary: [
      "Answer up to ten quick questions about the home and the place you want: the area and county, the kind of home, new or resale, a gate, an HOA or a CDD, the water, the evacuation zone and how close to somewhere. Atlas Match narrows every neighborhood in Lakewood Ranch, Sarasota and Bradenton to the ones that fit.",
    ],
  },
  {
    url: "/check",
    title: "Atlas Check: the flood zone and evacuation zone for an address",
    summary: [
      "Type an address in Manatee or Sarasota County and see its evacuation zone from the county’s map, its FEMA flood zone and map panel, and the year built, living area and last qualified sale from the county’s roll, each with where it comes from and the day it was read.",
    ],
  },
  {
    url: "/calendar",
    title: "Encore, the arts calendar",
    summary: [
      "Tonight, this weekend and the whole season: theater, concerts, galleries, talks, film and festivals in Lakewood Ranch, Sarasota and Bradenton, by day, week and month.",
      "Save events to your own list and share it, or subscribe to the calendar feed in your calendar app.",
    ],
  },
  {
    url: "/calendar/plan",
    title: "Encore Planner: your nights out, day by day",
    summary: [
      "Pick any dates, up to a month, and Encore Planner lays out each day: up to three shows, concerts or openings every evening from different venues, plus an afternoon pick. Coming to look at homes? It keeps ten to four free for showings. Add the plan to your calendar or share the link.",
    ],
  },
  {
    url: "/sell/sold",
    title: "Tide Street: what sold on your street",
    summary: [
      "Tide Street shows every qualified home sale the Manatee and Sarasota County Property Appraisers recorded on your street: address, date, price and living area, from the public record, not an estimate.",
      "Type the street, and the ZIP or city if you know it. Resales are kept apart from new builds and lots, every sale sits on a timeline, and the whole table is there to read. Sold prices on my street, what the house next door sold for, what homes sold for in Lakewood Ranch, Sarasota or Bradenton.",
    ],
  },
  {
    url: "/sell/home-value",
    title: "What’s my home worth: the record for your address",
    summary: [
      "No algorithm guess. The county's public record for your address: recent qualified sales on your street, the last sale the roll has for the house, what the record can't see, and then a written range from two people who have stood in it.",
      "Home value, house value, what is my home worth, what my house would sell for: type the house number, the street and the ZIP.",
    ],
  },
  {
    url: "/sell/net-proceeds",
    title: "Seller net proceeds",
    summary: [
      "What you'd walk away with: the sale price less the mortgage payoff, documentary stamp tax at the state rate, the title policy at Florida's promulgated rate, and the property tax proration to the day before closing. Every line says where its number comes from. Sarasota and Manatee counties.",
      "It isn't a closing statement, and commissions aren't suggested here.",
    ],
  },
  {
    url: "/guides",
    title: "Guides",
    summary: [
      "Plain-language guides to buying and selling a home in Lakewood Ranch, Sarasota and Bradenton. Each one explains a topic simply, with pictures and a worksheet. They're free, with no sign-up.",
    ],
  },
  {
    url: "/tide",
    title: "Tide, the monthly market report",
    summary: [
      "Tide is the monthly real estate market report for Lakewood Ranch, Sarasota and Bradenton: what sold, for how much, and what it means if you're buying or selling, from the county record. Read every issue, or get it by email.",
    ],
  },
  {
    url: "/refer",
    title: "Refer someone",
    summary: [
      "Know someone moving to Lakewood Ranch, Sarasota or Bradenton? Let them know you're passing their details along, then tell us the timing and we'll take it from there. We write back to you first and reach out to them at their pace.",
    ],
  },
  {
    url: "/reviews",
    title: "Reviews",
    summary: [
      "Bought or sold with Joelyn and Jessica? Tell us how it went: a review on Google, or your own words on this site, with your permission. Nothing about you goes on the site without asking first.",
    ],
  },
  {
    url: "/privacy",
    title: "Privacy",
    summary: [
      "How JJ Premier Group collects, uses and protects the information you share on this website, including phone numbers and text-message consent, and how long it's kept.",
    ],
  },
  {
    url: "/terms",
    title: "Terms",
    summary: ["The terms that apply to your use of this website, including listing data, the Encore Arts Calendar, and the limits of what a website can promise."],
  },
];

/** Every string above, for scripts/check-copy.mjs. */
export function searchStrings(): { where: string; text: string }[] {
  return [
    ...Object.entries(SEARCH_COPY).map(([k, text]) => ({ where: `lib/search/copy.ts: SEARCH_COPY.${k}`, text })),
    ...SUGGESTED_SEARCHES.map((text, i) => ({ where: `lib/search/copy.ts: SUGGESTED_SEARCHES[${i}]`, text })),
    ...PAGE_SUMMARIES.flatMap((p) => [
      { where: `lib/search/copy.ts: ${p.url} title`, text: p.title },
      ...p.summary.map((text, i) => ({ where: `lib/search/copy.ts: ${p.url} summary ${i + 1}`, text })),
    ]),
  ];
}
