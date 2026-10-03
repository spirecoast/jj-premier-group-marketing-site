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
    title: "Buying on the Suncoast",
    summary: [
      "Two questions before we look at anything: when do you need to be in, and is there a house to sell first? Then a pre-approval letter from a local lender.",
      "Four steps from the first call to the keys: the two questions, the list of homes worth seeing (with the flood zone, the HOA, the age of the roof and what the street has sold for), the offer, and escrow through the walk-through.",
      "Questions answered on the page: what escrow is and where the deposit goes, what gets inspected and what happens if something's wrong, whether you need flood insurance, what closing costs come to and who pays what, how long it takes and which months are busiest, and how to write an offer that wins without overpaying.",
    ],
  },
  {
    url: "/sell",
    title: "Selling on the Suncoast",
    summary: [
      "We price to the sold price, not the list. You get a number with the four comparable sales behind it, eight weeks of preparation that return their cost, and a first-weekend report on the Monday.",
      "Four steps: we come to the house, paint, light and the front door come first, the first weekend, and the offers laid out side by side.",
      "Questions answered on the page: how we arrive at the number, what to do to the house before it goes on the market, what it costs to sell (doc stamps on the deed, the owner's title policy, commission), when to list, what happens after you accept an offer, and whether you need to sell before you buy.",
    ],
  },
  {
    url: "/valuation",
    title: "What is my home worth",
    summary: [
      "You get a real number from two people who have stood in the house. Send the address and the timing, and Joelyn or Jessica pulls the comparable sales, drives the street and calls with the number and the reason for it.",
      "No algorithm guess and no listing agreement attached. The county record is open too: what sold on your street, and the public record for your own address.",
    ],
  },
  {
    url: "/relocate",
    title: "Moving to the Suncoast",
    summary: [
      "The relocation planner: six questions, no email, and you get a dated plan with the Florida contract deadlines, the week insurance has to be bound, the homestead cycle your move-in falls in, and the days the state gives a new resident. Every rule comes with its source.",
      "For buyers coming from a few states away: video walk-throughs, a written update after every step, and closing without flying down when the title company and lender accept online notarization.",
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
    url: "/neighborhoods",
    title: "Atlas, the neighborhood explorer",
    summary: [
      "An interactive map of more than two thousand areas, communities and enclaves across Lakewood Ranch, Sarasota and Bradenton: who governs each one, its ZIP codes, zoned schools, evacuation zone, builders and HOA, from county and district sources.",
      "Search by name, filter by market, level, type and status, and share any view as a link.",
    ],
  },
  {
    url: "/neighborhoods/match",
    title: "Atlas match",
    summary: [
      "Ten questions about the place and the home, and none about you: market and county, home type, gated or not, association, CDD, water, evacuation zone and distance. Atlas narrows its places to the ones whose facts fit. There's no ranking and no score.",
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
    title: "Plan a visit",
    summary: [
      "Coming to look at homes? Give Encore your dates and the places you want to see, and get a day-by-day plan: showings from ten to four, then the evening's theater, music and openings. Add the whole plan to your calendar.",
    ],
  },
  {
    url: "/sell/sold",
    title: "What sold on your street",
    summary: [
      "Every qualified sale the Manatee and Sarasota County Property Appraisers recorded on your street: address, date, price and living area, from the public record, not an estimate.",
    ],
  },
  {
    url: "/sell/home-value",
    title: "What your house is worth",
    summary: [
      "No algorithm guess. The county's public record for your address: recent qualified sales on your street, the last sale the roll has for the house, what the record can't see, and then a written range from two people who have stood in it.",
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
    url: "/blog",
    title: "Tide, the Coast real estate newsletter",
    summary: [
      "Once a month, Tide gives you one page on what happened in Lakewood Ranch, Sarasota and Bradenton and what it means for you, computed from the county record. Subscribe by email, or read every issue here.",
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
    summary: ["The terms that apply to your use of this website, including listing data, the Encore arts calendar, and the limits of what a website can promise."],
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
