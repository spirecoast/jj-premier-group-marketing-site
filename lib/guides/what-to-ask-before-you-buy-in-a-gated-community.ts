import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * What to ask before you buy in a gated community.
 *
 * Written to the plain template in docs/GUIDES.md: short sentences, everyday
 * words, one idea at a time, and every official term explained the first
 * time it appears. No links inside the paragraphs. Each figure carries one
 * source line and each section lists its sources at the foot. The facts are
 * the ones the October 2, 2026 fact check read in the 2026 Florida Statutes
 * and in the Lakewood Ranch village manuals cited. The village rules are
 * examples from those manuals, not a statement about any other community.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const FS_190_003 = "https://www.flsenate.gov/Laws/Statutes/2026/190.003";
const FS_190_021 = "https://www.flsenate.gov/Laws/Statutes/2026/190.021";
const FS_197_3632 = "https://www.flsenate.gov/Laws/Statutes/2026/197.3632";
const FS_720_303 = "https://www.flsenate.gov/Laws/Statutes/2026/720.303";
const FS_720_3035 = "https://www.flsenate.gov/Laws/Statutes/2026/720.3035";
const FS_720_3045 = "https://www.flsenate.gov/Laws/Statutes/2026/720.3045";
const FS_720_305 = "https://www.flsenate.gov/Laws/Statutes/2026/720.305";
const FS_720_306 = "https://www.flsenate.gov/Laws/Statutes/2026/720.306";
const FS_720_3085 = "https://www.flsenate.gov/Laws/Statutes/2026/720.3085";
const FS_720_30851 = "https://www.flsenate.gov/Laws/Statutes/2026/720.30851";
const FS_720_401 = "https://www.flsenate.gov/Laws/Statutes/2026/720.401";
const HB_1203 = "https://www.flsenate.gov/Session/Bill/2024/1203";
const LWR_FAQ = "https://content.civicplus.com/api/assets/a5c987e7-c178-4ef2-9144-231beaad61fb";
const LWR_CEVA_MANUAL = "https://content.civicplus.com/api/assets/07e300e3-1105-41c9-b71a-8f514fb7521e";
const LWR_SRVA_MANUAL = "https://content.civicplus.com/api/assets/7dc73591-51b1-47f7-ac5a-58486c64b67a";
const MANATEE_TC_PROPERTY = "https://www.taxcollector.com/services/property-tax.cfm";
const MANATEE_TC_HELP = "https://taxcollector.com/ptaxweb/Help_GeneralInfo_rwd2_MANATEE.jsp";
const SARASOTA_TC_PROPERTY = "https://www.sarasotataxcollector.gov/services/tax-services/property-tax";
const SARASOTA_PAO_DATES = "https://www.sarasotapropertyappraiser.gov/appraisal-info/important-dates/";
const MANATEE_PAO_DATES = "https://www.manateepao.gov/important-dates/";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  fs190_003: src("Florida Statutes 190.003 (2026), definitions, including community development district", FS_190_003),
  fs190_021: src("Florida Statutes 190.021 (2026), taxes and assessments of a district", FS_190_021),
  fs197_3632: src("Florida Statutes 197.3632 (2026), uniform method for collecting non-ad valorem assessments", FS_197_3632),
  fs720_303: src("Florida Statutes 720.303 (2026), association powers, official records, the budget and the financial report", FS_720_303),
  fs720_3035: src("Florida Statutes 720.3035 (2026), architectural control covenants", FS_720_3035),
  fs720_3045: src("Florida Statutes 720.3045 (2026), items an association may not restrict", FS_720_3045),
  fs720_305: src("Florida Statutes 720.305 (2026), fines and suspensions", FS_720_305),
  fs720_306: src("Florida Statutes 720.306 (2026), meetings, voting and rental amendments", FS_720_306),
  fs720_3085: src("Florida Statutes 720.3085 (2026), assessments, liens and a new owner’s liability", FS_720_3085),
  fs720_30851: src("Florida Statutes 720.30851 (2026), the estoppel certificate", FS_720_30851),
  fs720_401: src("Florida Statutes 720.401 (2026), the disclosure summary before a contract", FS_720_401),
  hb1203: src("Florida Senate, CS/CS/HB 1203 (2024), chapter 2024-221, effective July 1, 2024", HB_1203),
  lwrFaq: src("Lakewood Ranch Town Hall, CDD and HOA frequently asked questions, revised September 2019 (PDF)", LWR_FAQ),
  ceva: src("Country Club/Edgewater Village Association, homeowners’ manual, March 2022 (PDF)", LWR_CEVA_MANUAL),
  srva: src("Summerfield/Riverwalk Village Association, homeowners’ manual, January 2019 (PDF)", LWR_SRVA_MANUAL),
  manateeTc: src("Manatee County Tax Collector, Property tax", MANATEE_TC_PROPERTY),
  manateeTcHelp: src("Manatee County Tax Collector, online property tax search help", MANATEE_TC_HELP),
  sarasotaTc: src("Sarasota County Tax Collector, Property tax overview", SARASOTA_TC_PROPERTY),
  sarasotaPortal: src("Sarasota County Tax Collector, online bill search (county-taxes.net)", undefined, "returned an access error when we checked, so the guide points to the tax collector’s property tax page, which links to it"),
  sarasotaPao: src("Sarasota County Property Appraiser, Important dates", SARASOTA_PAO_DATES),
  manateePao: src("Manatee County Property Appraiser, Important dates", MANATEE_PAO_DATES),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });

/* ---- The guide ------------------------------------------------------------- */

export const GATED_GUIDE: Guide = {
  slug: "what-to-ask-before-you-buy-in-a-gated-community",
  title: "What to ask before you buy in a gated community",
  promise: "Who runs a master-planned community, what it costs each year, what the rules are, and the two papers the law says you get.",
  howToUse: [
    "Read this guide once from start to finish. Then use the worksheet at the end for each house you look at.",
    "Every community has its own documents, and the rules in them change. Each part of this guide says where its facts come from. Before you count on them for one house, read that community’s own documents.",
  ],
  questions: ["Who runs the place, and what does each one charge?", "What do the rules say about how I’d live here?", "What will I owe on the day I close?"],
  cover: img("library/lwr-lakefront-row", "Lakefront homes along a quiet street"),
  author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
  publishedAt: "2026-09-01",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "who-runs-a-gated-community",
      title: "Who runs a gated community",
      lead: "Behind the gate, there’s usually an association, and often a district too. Each one charges you. Here’s what each one does.",
      blocks: [
        p(
          "Picture the gate, the clubhouse, the lake and the rows of houses. Someone built all of it. Someone keeps it up.",
          "And someone decides what color you can paint your front door.",
        ),
        p(
          "Most of Lakewood Ranch sits inside homeowners associations, and so do many neighborhoods in Sarasota and Bradenton. People say HOA.",
          "An HOA is a private group of the owners, set up under Florida law. It charges dues and makes rules. It approves changes to your home, and it can fine you for breaking a rule.",
        ),
        p(
          "Many of these places also sit inside a community development district. People say CDD. It’s a unit of local government.",
          "It borrowed money to build the roads, lakes and pipes. It charges each lot on the property tax bill to pay that back and to keep things up.",
        ),
        p(
          "The county is the third body. It sets your property taxes by the value of the house. The district’s charge is on that same bill.",
          "The association’s dues never do.",
        ),
        p("You can learn about both before you make an offer. Here’s what to ask for."),
        {
          kind: "figure",
          eyebrow: "Who decides what",
          title: "The association and the district answer different questions",
          reading: "Read each side. The association sets how you live here. The district charges for the roads and lakes it built.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "The association decides",
                title: "How you live here",
                items: ["The dues, and any special assessment", "The rules: rentals, parking, paint, fences, pets", "Whether a change to your home is approved", "Fines, after notice and a hearing"],
              },
              {
                eyebrow: "The district decides",
                title: "What the roads and lakes cost",
                items: ["The debt line on the tax bill, for the bonds that built the place", "The maintenance line, set each year", "The upkeep of the roads, lakes and gates it built"],
              },
            ],
          },
          note: "Not every community has a CDD. The tax bill tells you whether there is one.",
          source: { label: "Florida Statutes 720.303 and 720.305 (2026); Florida Statutes 190.003 and 190.021 (2026); Lakewood Ranch Town Hall, CDD and HOA frequently asked questions", href: FS_720_303 },
        },
      ],
      sources: [S.fs720_303, S.fs720_305, S.fs190_003, S.fs190_021, S.lwrFaq, S.ceva],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "the-dues-the-budget-and-the-reserves",
      title: "The dues, the budget and the reserves",
      lead: "The dues are the first number you’ll hear. The budget and the reserves tell you whether the dues are likely to go up.",
      blocks: [
        p(
          "Ask the HOA for this year’s budget. Florida law says it must show the year’s expected income and spending, and what’s left over or short at year end.",
          "Florida law calls the dues assessments. Every owner must pay them. Unpaid dues can become a lien on the home.",
        ),
        def(
          "Reserves",
          "Money set aside each year for big repairs later: the clubhouse roof, the roads, the pool. An HOA’s budget may include reserves, but it doesn’t have to. And the owners can vote to set aside less, or nothing.",
          S.fs720_303,
        ),
        p(
          "A community that skips its reserves will ask for the money later. That’s called a special assessment.",
          "It can be large, and it can come with little warning.",
        ),
        p(
          "Ask for the last financial report too. Florida law sets what it must contain, based on the HOA’s size.",
          "The biggest ones must have audited statements.",
        ),
        p("Ask for the reserve study, if there is one. Read it next to the budget. Are the reserves it calls for being funded?"),
        {
          kind: "figure",
          eyebrow: "Three numbers",
          title: "The dues, the reserves and the special assessment",
          reading: "Each card is one number to find. Only the first one is required by law.",
          figure: {
            type: "zone-cards",
            labels: { lender: "Does the law require it?", build: "Where to find it" },
            cards: [
              {
                code: "1",
                name: "The dues",
                tone: "high",
                means: "What every owner pays the association, usually monthly or quarterly. The law calls them assessments.",
                lender: { mark: "yes", text: "Yes. Every member must pay, and unpaid dues can become a lien" },
                build: "This year’s budget, and the disclosure summary",
              },
              {
                code: "2",
                name: "The reserves",
                tone: "lower",
                means: "Money set aside each year for big repairs later: the roads, the clubhouse roof, the pool.",
                lender: { mark: "no", text: "No. The budget may include them, and the owners can vote to set aside less" },
                build: "The budget’s reserve lines, and the reserve study if there is one",
              },
              {
                code: "3",
                name: "The special assessment",
                tone: "highest",
                means: "A one-time charge when the dues and the reserves don’t cover a cost.",
                lender: { mark: "no", text: "No. The association levies one when it needs to" },
                build: "The estoppel certificate lists any that has been levied",
              },
            ],
          },
          note: "Dues can change from year to year. The disclosure summary you get before signing says so in capital letters.",
          source: { label: "Florida Statutes 720.303(6) and (7) (2026); Florida Statutes 720.3085 (2026); Florida Statutes 720.401 (2026)", href: FS_720_303 },
        },
      ],
      sources: [S.fs720_303, S.fs720_3085, S.fs720_401, S.fs720_30851],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "the-districts-line-on-the-tax-bill",
      title: "The district’s line on the tax bill",
      lead: "If the community has a CDD, its charge is on the property tax bill, not in the dues. Pull the bill for the exact parcel.",
      blocks: [
        p(
          "A CDD collects its charge with the property taxes. It sits in the part of the bill called non-ad valorem assessments.",
          "That means it isn’t based on the value of your house. It’s a set amount for your lot.",
        ),
        p(
          "There are two lines. The debt line pays back the bonds that built the roads and lakes. The maintenance line pays for upkeep, and it’s set each year.",
          "When the bonds are paid off, the debt line reads zero. The maintenance line goes on.",
        ),
        p(
          "Paying off your mortgage doesn’t touch either line. The charge stays with the lot.",
          "If it isn’t paid, it can become a lien on the home.",
        ),
        p("Both counties let you look up a bill online. Find the parcel, then read the district’s name beside each line."),
        p(
          "The August notice from the property appraiser is a preview of the next bill. It’s called the TRIM notice.",
          "In Sarasota County it shows the proposed district charges too.",
        ),
        {
          kind: "figure",
          eyebrow: "Where to look",
          title: "Three places to see the district’s charge",
          reading: "Start with the county the house is in. The third card is the preview that comes in August.",
          figure: {
            type: "map-callout",
            places: [
              {
                name: "Manatee County Tax Collector",
                covers: "Manatee County",
                body: "Look up the property. See each charge by taxing body and print a copy of the bill.",
                href: MANATEE_TC_PROPERTY,
                cta: "taxcollector.com",
              },
              {
                name: "Sarasota County Tax Collector",
                covers: "Sarasota County",
                body: "The property tax page explains the bill and links to the search portal. The bill is a combined notice of taxes and assessments.",
                href: SARASOTA_TC_PROPERTY,
                cta: "sarasotataxcollector.gov",
              },
              {
                name: "Sarasota County Property Appraiser",
                covers: "The August notice",
                body: "The notice of proposed property taxes, called TRIM, goes out in August and September. It lists the proposed non-ad valorem assessments too.",
                href: SARASOTA_PAO_DATES,
                cta: "sarasotapropertyappraiser.gov",
              },
            ],
          },
          note: "Manatee County’s property appraiser mails its notice in August as well.",
          source: { label: "Manatee County Tax Collector, Property tax and online search help; Sarasota County Tax Collector, Property tax overview; Sarasota County Property Appraiser, Important dates; Manatee County Property Appraiser, Important dates", href: SARASOTA_TC_PROPERTY },
        },
      ],
      sources: [S.fs197_3632, S.fs190_021, S.lwrFaq, S.manateeTc, S.manateeTcHelp, S.sarasotaTc, S.sarasotaPortal, S.sarasotaPao, S.manateePao],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "the-rules",
      title: "The rules",
      lead: "Read the covenants and the rules early. They decide what you can do with the house.",
      blocks: [
        p(
          "Every HOA has a declaration of covenants. Those are the promises recorded with the county that bind every lot. People call them the covenants.",
          "Under them sit the day-to-day rules and, often, a homeowners’ manual.",
        ),
        p(
          "The rules reach further than people expect. One Lakewood Ranch village doesn’t allow a truck to park in a driveway overnight.",
          "The same village doesn’t allow short-term rentals, and its shortest lease is six months. Some of its neighborhoods require a full year.",
        ),
        p(
          "Most changes to the outside of a home there need approval first. Paint colors, fences, a pool, a shed.",
          "Florida law limits what the HOA can enforce. The standard must be in the covenants or the published rules, or reasonably follow from them. If it says no, it must tell you which rule, and what part of your plan fails.",
        ),
        p(
          "Florida law also protects a few things. An HOA can’t stop you keeping items that can’t be seen from the street, a neighbor’s lot, a common area or a golf course.",
          "And it can’t make you ask before you change the inside of your home, as long as the change can’t be seen from outside.",
        ),
        p(
          "Rentals have a special rule. A new limit on renting applies only to owners who buy after it passes, or who agree to it.",
          "But limits on rentals shorter than six months, or more than three times a year, apply to everyone.",
        ),
        p(
          "If you break a rule, the HOA can fine you. It must give you 14 days’ notice and a chance for a hearing first.",
          "It can’t fine you for garbage cans at the curb within a day of pickup.",
        ),
        {
          kind: "figure",
          eyebrow: "The rules",
          title: "Seven things to look for in the rules",
          reading: "Read the covenants, the rules and the manual for each one. Write down what you find.",
          figure: {
            type: "checklist",
            items: [
              { text: "Rentals", detail: "The shortest lease allowed, how many times a year, and whether the tenant needs approval." },
              { text: "Parking", detail: "Where trucks, boats, trailers and campers can park, and when." },
              { text: "Fences and pools", detail: "Whether they’re allowed, and how high a fence can be." },
              { text: "Paint and the outside of the house", detail: "Approved colors, roofs, yard lamps, and what needs approval first." },
              { text: "Pets", detail: "How many, and any limits by size or kind." },
              { text: "Yards and watering", detail: "Lawn standards, trees, and watering days." },
              { text: "Fines and how they work", detail: "The notice, the hearing, and what a fine can grow to." },
            ],
          },
          note: "The village rules named above are examples from one Lakewood Ranch manual. Every community has its own.",
          source: { label: "Country Club/Edgewater Village Association, homeowners’ manual, March 2022; Florida Statutes 720.3035, 720.3045, 720.305 and 720.306 (2026)", href: LWR_CEVA_MANUAL },
        },
      ],
      sources: [S.ceva, S.srva, S.fs720_3035, S.fs720_3045, S.fs720_306, S.fs720_305],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "two-papers-the-law-gives-you",
      title: "Two papers the law gives you",
      lead: "Florida gives a buyer two papers in a community with an HOA. One comes before you sign. The other comes before you close.",
      blocks: [
        p(
          "Before you sign a contract, the seller must give you a disclosure summary. It says you’ll have to join the HOA and pay its dues.",
          "It says the amounts can change. It warns that a city, county or special district may charge you too, and that unpaid dues can become a lien.",
        ),
        p(
          "If you don’t get it before you sign, you can cancel. You have 3 days after you finally get it, or until closing, whichever comes first.",
          "You can’t give that right away.",
        ),
        p(
          "Before closing, ask the HOA for an estoppel certificate. That’s its signed statement of what the seller owes and what comes with the home.",
          "It must list the dues and whether they’re paid, and any special assessments. It must list open rule violations, and whether the board has to approve you.",
        ),
        p(
          "It also has to say if a fee is due at the sale. Some HOAs charge each new owner a fee, called a capital contribution or a transfer fee.",
          "Those fees are easy to miss.",
        ),
        p(
          "Here’s why it matters. A new owner can be made to pay what the seller left unpaid, dues and special assessments alike.",
          "But a buyer who relies on the certificate can’t be charged more than it says.",
        ),
        p(
          "Once asked, the HOA has 10 business days to issue it. It stays good for 30 days, or 35 if it came by mail.",
          "Order it early, and read it before closing day.",
        ),
        {
          kind: "figure",
          eyebrow: "The clocks",
          title: "How many days each clock gives you",
          reading: "One bar for each clock. The first is yours. The rest run on the association.",
          figure: {
            type: "bar",
            unit: "days",
            max: 30,
            rows: [
              { label: "Cancel after a late disclosure summary", sub: "After you get it, or until closing, whichever comes first", segments: [{ label: "3 days", value: 3, series: 1 }] },
              { label: "The estoppel certificate arrives", sub: "After the association is asked, in business days", segments: [{ label: "10 business days", value: 10, series: 2 }] },
              { label: "The estoppel certificate stays good", sub: "35 days if it came by mail", segments: [{ label: "30 days", value: 30, series: 2 }] },
              { label: "Records an owner asks to see", sub: "After a written request, in business days", segments: [{ label: "10 business days", value: 10, series: 2 }] },
              { label: "Notice before a fine hearing", sub: "At least this long", segments: [{ label: "14 days", value: 14, series: 0 }] },
            ],
            legend: [
              { label: "Your clock", series: 1 },
              { label: "The association’s clocks", series: 2 },
              { label: "Before a fine", series: 0 },
            ],
          },
          note: "Business days skip weekends and holidays.",
          source: { label: "Florida Statutes 720.401, 720.30851, 720.303(5) and 720.305 (2026)", href: FS_720_401 },
        },
      ],
      sources: [S.fs720_401, S.fs720_30851, S.fs720_3085, S.fs720_303, S.fs720_305],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "getting-the-documents",
      title: "Getting the documents, in order",
      lead: "The documents are easier to get than they used to be. Here’s where they live, and the order to ask for them.",
      blocks: [
        p(
          "Since January 1, 2025, an HOA with 100 or more lots must keep its documents on a website or app. That means the covenants, the rules, the budget, the financial reports, the insurance and the meeting notices.",
          "They sit behind a login for owners.",
        ),
        p(
          "Every HOA also had to give each owner a copy of its rules and covenants by October 1, 2024.",
          "After a change, it must send out a new copy.",
        ),
        p(
          "You’re not an owner yet, so ask the seller to pull the set. An owner who asks in writing must be allowed to see the records within 10 business days.",
        ),
        p("If the home is a condo, there’s a second set of documents about the building itself. Our condo guide covers them."),
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Seven things to ask for before you make an offer",
          reading: "Go in order. Each step helps with the next one.",
          figure: {
            type: "checklist",
            items: [
              { text: "This year’s budget and the latest financial report", detail: "From the association, through the seller. Look for the reserve lines." },
              { text: "The reserve study, if there is one", detail: "Read it next to the budget." },
              { text: "The tax bill for the exact parcel", detail: "Manatee or Sarasota tax collector. Find the district’s two lines." },
              { text: "The covenants, the rules and the manual", detail: "Rentals, parking, fences, paint, pets." },
              { text: "The disclosure summary, before you sign", detail: "If it comes late, you have 3 days to cancel." },
              { text: "The estoppel certificate, ordered early", detail: "The association has 10 business days. Read it before closing." },
              { text: "Any fee due at the sale", detail: "A capital contribution, resale or transfer fee. It’s on the certificate." },
            ],
          },
          source: { label: "Each step comes from the section it sums up. The sources are listed there and at the end of this guide", href: FS_720_303 },
          tool: { tool: "contact", cta: "Send us an address" },
        },
      ],
      sources: [S.fs720_303, S.hb1203, S.fs720_401, S.fs720_30851],
    },
  ],

  onOnePage: {
    title: "Your notes for one house behind a gate",
    reading: "Fill in the right side for the house you’re looking at.",
    rows: [
      { label: "Address", value: "Write it here" },
      { label: "Association, and this year’s dues", value: "From the budget" },
      { label: "Reserves in the budget", value: "Yes or no, and are they funded" },
      { label: "Special assessments", value: "Pending, planned or levied" },
      { label: "District lines on the tax bill", value: "Debt and maintenance, from the bill" },
      { label: "Rules that matter to you", value: "Rentals, parking, fences, pets" },
      { label: "Disclosure summary received", value: "The date, before you signed" },
      { label: "Estoppel certificate ordered", value: "The date" },
      { label: "Fees due at the sale", value: "Capital contribution or transfer fee" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us an address.",
    body: "We’ll pull the documents, the bill and the rules for that house and go through them with you. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a house",
    tool: "contact",
  },
};
