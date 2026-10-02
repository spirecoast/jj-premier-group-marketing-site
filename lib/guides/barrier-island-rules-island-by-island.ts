import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Barrier island rules, island by island.
 *
 * Plain on purpose: short sentences, everyday words, one idea at a time,
 * and every official term explained the first time it appears. The facts
 * are the ones the October 2, 2026 fact check verified against the cited
 * pages. Where a government's page wouldn't open or didn't say, the guide
 * says so and sends the reader to the office instead of guessing.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const FEMA_SI = "https://www.fema.gov/glossary/substantial-improvement";
const HB_FLOOD = "https://www.holmesbeachfl.org/i_want_to/flood___hurricane_protection_information.php";
const MANATEE_FLOODPLAIN = "https://www.mymanatee.org/departments/building___development_services/floodplain_management";
const AM_RENTALS = "https://www.cityofannamaria.com/208/Vacation-Rental-Rules-Regulations";
const HB_VRC = "https://www.holmesbeachfl.org/departments/vacation_rental_certificates.php";
const HB_PLAN = "https://cms9files1.revize.com/holmesbeachfl/Comprehensive%20Plan%20Adopted%202022.pdf";
const BB_R2 = "https://www.cityofbradentonbeach.com/DocumentCenter/View/6224/R-2-Zoning-revised-02-06-20-PDF";
const BB_CODE = "https://www.cityofbradentonbeach.com/165/Common-Code-Violations";
const LBK_TAXES = "https://www.longboatkey.org/434/Ad-valorem-Taxes";
const LBK_ELECTIONS = "https://www.longboatkey.org/281/Elections";
const LBK_REGISTRY = "https://www.longboatkey.org/243/Residential-Rental-Registry";
const LBK_STR = "https://www.longboatkey.org/221/Short-Term-Rentals";
const SRQ_RENTALS = "https://www.sarasotafl.gov/government/development-services/vacation-rentals";
const SRQ_ZONING = "https://www.sarasotafl.gov/government/development-services/zoning";
const SRQ_PLAN = "https://www.sarasotafl.gov/files/assets/city/v/1/planning/documents/chapter4_environmentalplanaccessible.pdf";
const SC_CODE = "https://library.municode.com/fl/sarasota_county/codes/code_of_ordinances";
const SC_SITE = "https://www.scgov.net/";
const FS_509 = "https://www.flsenate.gov/Laws/Statutes/2026/509.032";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  femaSi: src("FEMA, Substantial improvement (glossary)", FEMA_SI),
  hbFlood: src("City of Holmes Beach, Flood and hurricane protection information", HB_FLOOD),
  manatee: src("Manatee County, Floodplain management", MANATEE_FLOODPLAIN),
  amRentals: src("City of Anna Maria, Vacation rental rules and regulations", AM_RENTALS),
  hbVrc: src("City of Holmes Beach, Vacation rental certificates", HB_VRC),
  hbPlan: src("City of Holmes Beach, Comprehensive plan, adopted June 14, 2022 (PDF)", HB_PLAN),
  bbR2: src("City of Bradenton Beach, R-2 district sheet from the land development code (PDF)", BB_R2),
  bbCode: src("City of Bradenton Beach, Common code violations", BB_CODE),
  lbkTaxes: src("Town of Longboat Key, Ad valorem taxes", LBK_TAXES),
  lbkElections: src("Town of Longboat Key, Elections", LBK_ELECTIONS),
  lbkRegistry: src("Town of Longboat Key, Residential rental registry", LBK_REGISTRY),
  lbkStr: src("Town of Longboat Key, Short term rentals", LBK_STR),
  srqRentals: src("City of Sarasota, Vacation rentals", SRQ_RENTALS),
  srqZoning: src("City of Sarasota, Zoning", SRQ_ZONING),
  srqPlan: src("Sarasota City Plan, Environmental protection and coastal islands chapter, adopted May 1, 2017 (PDF)", SRQ_PLAN),
  scCode: src("Sarasota County, Code of ordinances (Municode)", SC_CODE, "The page opens as an application; we could not read a chapter through it"),
  scSite: src("Sarasota County, scgov.net", undefined, "returned an access error when we checked, so the guide does not describe the county’s rental or height rules"),
  fs509: src("Florida Statutes 509.032(7), local regulation of vacation rentals (2026)", FS_509),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });

/* ---- The guide ------------------------------------------------------------- */

export const BARRIER_ISLANDS_GUIDE: Guide = {
  slug: "barrier-island-rules-island-by-island",
  title: "Barrier island rules, island by island",
  promise: "Which government makes the rules on each island, the three rules that change at the bridge, and how to check them for one house.",
  howToUse: [
    "Read this guide once from start to finish. Then use the checklist at the end each time you look at a house on an island.",
    "Rules change, and each city reads them its own way. Each part of this guide tells you where its facts come from. Before you count on a rule for one house, check it with the city or county that runs the island.",
  ],
  questions: ["Which government runs this island?", "What is the zoning district for this lot?", "What does that district allow?"],
  cover: img("library/gulf-beach-aerial", "A barrier island beach from the air"),
  author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
  publishedAt: "2026-09-25",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "five-islands",
      title: "Five islands, five sets of rules",
      lead: "From the water, the islands look alike. The rules don’t. Each island answers to its own city or county.",
      blocks: [
        p("A barrier island is a long, thin island that sits between the Gulf and the bay. You reach it by a bridge. Our coast has a chain of them."),
        p(
          "Anna Maria Island is three small cities: Anna Maria, Holmes Beach and Bradenton Beach.",
          "Longboat Key is one town, but the county line runs through it.",
          "Lido Key and St. Armands are part of the City of Sarasota.",
          "Siesta Key has no city hall of its own. A small piece at its north end is in the city, and the rest is run by Sarasota County.",
        ),
        p(
          "Three rules come up on every island. How tall can you build? How short can a rental be? And what happens when a storm wrecks half the house?",
          "Each government answers them its own way. So look up the rules for the exact lot, not the island.",
        ),
        {
          kind: "figure",
          eyebrow: "The islands from above",
          title: "Who makes the rules on each island",
          reading: "North is at the top. Find the island, then read its entry below the drawing.",
          figure: {
            type: "sketch",
            scene: "islands",
            marks: [
              { code: "1", name: "Anna Maria Island", body: "Three cities. Anna Maria is at the north end, Holmes Beach in the middle and Bradenton Beach at the south end. The dashed lines are the city lines." },
              { code: "2", name: "Longboat Key", body: "One town. The county line crosses it, so part of the town is in Manatee County and part is in Sarasota County." },
              { code: "3", name: "Lido Key and St. Armands", body: "Both are inside the City of Sarasota. The city makes the rules here." },
              { code: "4", name: "Siesta Key", body: "No city of its own. The north end is inside the City of Sarasota. The rest is Sarasota County." },
              { code: "5", name: "The county line", body: "Manatee County is north of this line and Sarasota County is south of it. Each county sets its own property tax rate." },
            ],
          },
          note: "This drawing shows the idea, not a real map. The islands are not to scale.",
          source: {
            label: "Town of Longboat Key, Ad valorem taxes; Sarasota City Plan, Environmental protection and coastal islands chapter; the three cities’ and the town’s pages listed under this section",
            href: SRQ_PLAN,
          },
        },
      ],
      sources: [S.amRentals, S.hbVrc, S.bbCode, S.lbkTaxes, S.srqRentals, S.srqPlan],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "the-fifty-percent-rule",
      title: "The rule that shapes every rebuild",
      lead: "This rule is federal, so it’s the same on every island. It decides what happens after a big storm or a big remodel.",
      blocks: [
        p("Picture a house on a canal. A storm fills it with water. The repair bill comes to more than half of what the house is worth."),
        p(
          "Now the house can’t just be fixed as it was. It must be rebuilt to the rules for a new house.",
          "On these islands, that means raising it above the big flood.",
        ),
        def(
          "Substantial improvement",
          "Work on a building that costs half or more of what the building is worth. The value is the building’s, not the land’s. Once work crosses that line, the whole building must meet today’s rules for a new one.",
          S.femaSi,
        ),
        p(
          "Storm damage counts the same way. If the damage comes to half the building’s value, any repair counts, even if you only fix part of it.",
        ),
        p(
          "The counting matters. In Manatee County, work is added up over one year. A kitchen this spring and a roof next winter can count as one project.",
          "Ask the building department for a written decision before you plan.",
        ),
        {
          kind: "figure",
          eyebrow: "The line",
          title: "Under half, or half and more",
          reading: "Read each side. The cost of the work, compared with the building’s value, decides which side you’re on.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "Work that costs less than half",
                title: "Fix it or improve it as it was",
                items: ["Get the normal permits", "The lowest floor can stay where it is"],
              },
              {
                eyebrow: "Work that costs half or more",
                title: "The whole building must meet today’s rules for a new one",
                items: [
                  "On the islands, that means raising it above the big flood",
                  "Storm damage counts, even if you only fix part of it",
                  "In Manatee County, work is added up over one year",
                  "Ask the building department for a written decision",
                ],
              },
            ],
          },
          source: { label: "FEMA, Substantial improvement (glossary); City of Holmes Beach, Flood and hurricane protection information; Manatee County, Floodplain management", href: FEMA_SI },
        },
      ],
      sources: [S.femaSi, S.hbFlood, S.manatee],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "anna-maria-island",
      title: "Anna Maria Island: three cities",
      lead: "One island, three city halls. The rental rules and the height limits change at the city line.",
      blocks: [
        p(
          "Anna Maria, at the north end, licenses every vacation rental. You need a city registration, a state tax registration, and a state license as a transient public lodging establishment.",
          "That last one is the state’s name for a place rented out for short stays. You can’t advertise or rent until the city’s inspection is passed.",
          "The city’s page doesn’t give a shortest stay or a height limit, so ask the city.",
        ),
        p(
          "Holmes Beach, in the middle, requires a vacation rental certificate for every rental. The shortest stay follows the zoning district.",
          "In R-1 and R-1AA it’s 30 days, and the home can be rented only once in any 30 days. In R-2, R-3 and R-4 it’s one week.",
        ),
        p("Holmes Beach caps height at 36 feet. It measures from the crown of the road in front of the house to the top of the roof."),
        p(
          "Bradenton Beach, at the south end, counts how often a home is rented. Rent it more than three times a year for stays under 30 days, and it’s a short-term rental.",
          "That takes a state registration and a city license, which the city calls a transient public lodging establishment license.",
          "In its R-2 district, a building can rise 29 feet above the flood protection elevation, and no more than two stories and a loft.",
        ),
        p("Each city measures height from a different starting line. So you can’t compare the numbers straight across. Ask each city where its line is for the lot."),
        {
          kind: "figure",
          eyebrow: "Three cities",
          title: "The rule on each part of the island",
          reading: "Each card is one city, from north to south. The link opens the city’s own page.",
          figure: {
            type: "map-callout",
            places: [
              {
                name: "City of Anna Maria",
                covers: "North end",
                body: "Every vacation rental needs a city registration, a state lodging license and a state tax registration. No advertising or renting until the inspection is passed. The page gives no shortest stay or height limit, so ask the city.",
                href: AM_RENTALS,
                cta: "cityofannamaria.com",
              },
              {
                name: "City of Holmes Beach",
                covers: "Middle",
                body: "Every rental needs a vacation rental certificate. Shortest stay: 30 days in R-1 and R-1AA, and one week in R-2, R-3 and R-4. Height: 36 feet, measured from the crown of the road.",
                href: HB_VRC,
                cta: "holmesbeachfl.org",
              },
              {
                name: "City of Bradenton Beach",
                covers: "South end",
                body: "Rented more than three times a year for stays under 30 days? That’s a short-term rental. It needs a state registration and a city lodging license. Height in R-2: 29 feet above the flood protection elevation, two stories and a loft.",
                href: BB_CODE,
                cta: "cityofbradentonbeach.com",
              },
            ],
          },
          source: {
            label: "City of Anna Maria, Vacation rental rules and regulations; City of Holmes Beach, Vacation rental certificates and Comprehensive plan; City of Bradenton Beach, Common code violations and R-2 district sheet",
            href: HB_VRC,
          },
        },
      ],
      sources: [S.amRentals, S.hbVrc, S.hbPlan, S.bbCode, S.bbR2],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "longboat-key",
      title: "Longboat Key: one town, two counties",
      lead: "The county line crosses the island. The town makes the rental rules, but your county sets your property tax rate.",
      blocks: [
        p(
          "Picture two houses a block apart. Same town, same beach. One is in Manatee County and one is in Sarasota County.",
          "They pay different county tax rates.",
        ),
        p(
          "The town’s rental rule is simple to state. In residential zoning, the shortest rental is 30 days in a row, or one full calendar month.",
          "The exceptions are homes in a tourism district, and homes with an old tourism use the town let stand.",
        ),
        p(
          "Any home rented for less than six months goes on the town’s rental registry, which it calls the Residential Rental Registry. The registry started on October 1, 2023.",
          "The town inspects the home, and the certificate number must appear in every ad.",
        ),
        p("We didn’t find a height limit on the town’s pages. Ask the planning division before you count on a number."),
        {
          kind: "figure",
          eyebrow: "Who decides what",
          title: "The county and the town answer different questions",
          reading: "Read each side. The county answers the money and voting questions. The town answers the rental ones.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "The county decides",
                title: "Your property tax rate and where you vote",
                items: ["Manatee County and Sarasota County each set their own tax rate", "Each county has its own property appraiser and tax collector"],
              },
              {
                eyebrow: "The town decides",
                title: "How short a rental can be",
                items: [
                  "30 days in a row, or one full calendar month, in residential zoning",
                  "A tourism district, or an old tourism use, can allow shorter stays",
                  "Rentals under six months go on the town’s registry",
                  "A town inspection, and the certificate number in every ad",
                ],
              },
            ],
          },
          source: { label: "Town of Longboat Key: Ad valorem taxes, Elections, Short term rentals, Residential rental registry", href: LBK_STR },
        },
      ],
      sources: [S.lbkTaxes, S.lbkElections, S.lbkStr, S.lbkRegistry],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "lido-key-and-st-armands",
      title: "Lido Key and St. Armands: the City of Sarasota",
      lead: "These keys are part of the city. The city’s rental rule is short: seven days and seven nights, with a certificate.",
      blocks: [
        p(
          "The rule applies to houses and small buildings with one to four units, in the city’s residential zoning districts.",
          "Before you rent, you register with the city and pass its inspection. The city calls the paper you get a vacation rental certificate of registration.",
          "Then each stay must be at least seven full days and seven full nights.",
        ),
        p(
          "The rule doesn’t apply if you live in the home yourself. It also skips condominiums and cooperatives, which follow their own documents.",
          "And it skips stays of 30 days or more.",
        ),
        p(
          "Height here comes from the city’s plan, which has a height map for the coastal islands.",
          "On much of Lido Key and St. Armands, the limit is 35 feet, measured from the minimum FEMA elevation. That’s the height the big flood would reach.",
          "The resort district along the Gulf on southern Lido allows much taller buildings.",
        ),
        p("Which rule applies depends on the zoning district. The city’s zoning maps are on its GIS page, and its zoning staff can tell you the district for an address."),
        {
          kind: "figure",
          eyebrow: "The city’s rule",
          title: "Three questions the city’s rental rule turns on",
          reading: "Answer each one for the house. The note under the questions tells you what the answers mean.",
          figure: {
            type: "questions",
            answers: ["Yes", "No"],
            items: [
              { question: "Is it a house, or a building with one to four units, in a residential zoning district?" },
              { question: "Will guests stay for less than 30 days?" },
              { question: "Do you live there yourself, or is it a condominium or a cooperative?", note: "If so, the city’s registration rule doesn’t apply. A condominium follows its own documents." },
            ],
          },
          note: "If the first two answers are yes and the third is no, the city’s rule applies. Register, pass the inspection, and rent for seven days and seven nights at a time. These are plain-language versions of the city’s rule, which uses its own words.",
          source: { label: "City of Sarasota, Vacation rentals; City of Sarasota, Zoning; Sarasota City Plan, Environmental protection and coastal islands chapter", href: SRQ_RENTALS },
        },
      ],
      sources: [S.srqRentals, S.srqZoning, S.srqPlan],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "siesta-key",
      title: "Siesta Key: Sarasota County",
      lead: "Most of Siesta Key has no city hall. Its rules come from Sarasota County, and the county’s pages wouldn’t open for us.",
      blocks: [
        p(
          "We tried the county’s website on the day we wrote this. It returned an access error.",
          "So we won’t tell you what the county’s rental or height rules say. Read them on the county’s site, or call its planning office.",
        ),
        p(
          "Here’s what we can tell you. Florida law limits what a city or county can do about vacation rentals.",
          "A local rule can’t ban them, and it can’t set how long or how often a home is rented.",
          "But rules adopted on or before June 1, 2011 were allowed to stay. So the date a rule was written matters.",
        ),
        p("The 50 percent rule applies on Siesta Key too. It’s federal. And the north end of the key is inside the City of Sarasota, where the city’s rules apply."),
        {
          kind: "figure",
          eyebrow: "Where to look",
          title: "Three places to read Siesta Key’s rules",
          reading: "Start with the county. The other two tell you how to read what you find.",
          figure: {
            type: "map-callout",
            places: [
              {
                name: "Sarasota County",
                covers: "Most of Siesta Key",
                body: "The county’s own site. It wouldn’t open for us, so try it yourself or call the planning office.",
                href: SC_SITE,
                cta: "scgov.net",
              },
              {
                name: "Sarasota County code of ordinances",
                covers: "The county’s code",
                body: "The county’s rules, chapter by chapter, on Municode.",
                href: SC_CODE,
                cta: "library.municode.com",
              },
              {
                name: "Florida Statutes 509.032",
                covers: "State law",
                body: "The law that limits what local rental rules can do, and the June 1, 2011 date.",
                href: FS_509,
                cta: "flsenate.gov",
              },
            ],
          },
          note: "The county’s site returned an access error when we checked. We list it so you can try it.",
          source: { label: "Florida Statutes 509.032(7) (2026); Sarasota City Plan, which puts the north end of Siesta Key inside the city; Sarasota County’s site, which would not open", href: FS_509 },
        },
      ],
      sources: [S.scSite, S.scCode, S.fs509, S.srqPlan, S.femaSi],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "the-shortest-stay",
      title: "The shortest stay, island by island",
      lead: "Here are the shortest stays side by side. Look up the zoning district first. The number follows the district, not the island.",
      blocks: [
        p("Two islands can share a beach and not a rule. On one, a week is fine. Next door, a month is the floor."),
        {
          kind: "figure",
          eyebrow: "The numbers",
          title: "How short a rental can be, by district",
          reading: "Each bar is one district’s shortest stay, in days. Longer bars mean longer stays.",
          figure: {
            type: "bar",
            unit: "days",
            max: 30,
            rows: [
              { label: "Holmes Beach, R-1 and R-1AA", sub: "Rented once in any 30 days", segments: [{ label: "30 days", value: 30, series: 0 }] },
              { label: "Longboat Key, residential zoning", sub: "Or one full calendar month", segments: [{ label: "30 days", value: 30, series: 0 }] },
              { label: "Holmes Beach, R-2, R-3 and R-4", sub: "Rented once in any 7 days", segments: [{ label: "7 days", value: 7, series: 2 }] },
              { label: "City of Sarasota, Lido Key and St. Armands", sub: "Seven full days and seven full nights", segments: [{ label: "7 days", value: 7, series: 2 }] },
            ],
            legend: [
              { label: "A month", series: 0 },
              { label: "A week", series: 2 },
            ],
          },
          note: "Anna Maria’s page doesn’t give a number. Bradenton Beach counts how often a home is rented, not how long each stay is. Siesta Key’s rule is the county’s, which we couldn’t open.",
          source: { label: "City of Holmes Beach, Vacation rental certificates; Town of Longboat Key, Short term rentals; City of Sarasota, Vacation rentals", href: HB_VRC },
        },
        p("A condominium can set a longer floor on top of the city’s. Read its documents too."),
      ],
      sources: [S.hbVrc, S.lbkStr, S.srqRentals, S.amRentals, S.bbCode],
    },

    /* ---- 08 ---------------------------------------------------------------- */
    {
      id: "before-you-make-an-offer",
      title: "Before you make an offer on an island",
      lead: "Use this list each time you look at a house on an island. The first three steps only take a few minutes.",
      blocks: [
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Seven things to check before you make an offer",
          reading: "Go in order. Each step helps with the next one.",
          figure: {
            type: "checklist",
            items: [
              { text: "Find out which government runs the lot", detail: "A city, a town or the county. On Anna Maria Island and Siesta Key, it changes along the island." },
              { text: "Look up the zoning district for the exact lot", detail: "The rule follows the district, not the island or the street." },
              { text: "Read the rental rule for that district", detail: "The shortest stay, the registration, and the inspection before you can advertise." },
              { text: "Read the height rule, and where it’s measured from", detail: "The crown of the road, the flood protection elevation, or the minimum FEMA elevation." },
              { text: "Ask the building department about the 50 percent rule", detail: "How much work the building’s value allows before it must be rebuilt to today’s rules. Get it in writing." },
              { text: "Check the flood zone and ask for the elevation certificate", detail: "Our flood guide walks through both." },
              { text: "If it’s a condominium, read its documents", detail: "They can set a longer shortest stay than the city’s." },
            ],
          },
          source: { label: "Each step comes from the section it sums up. The sources are listed there and at the end of this guide", href: FEMA_SI },
          tool: { tool: "contact", cta: "Send us an address" },
        },
      ],
      sources: [S.femaSi, S.hbVrc, S.lbkStr, S.srqRentals, S.srqZoning, S.fs509],
    },
  ],

  onOnePage: {
    title: "Your island notes for one house",
    reading: "Fill in the right side for the house you’re looking at.",
    rows: [
      { label: "Address", value: "Write it here" },
      { label: "Island, and the government that runs it", value: "City, town or county" },
      { label: "Zoning district", value: "From the city or county map" },
      { label: "Shortest rental stay", value: "Days, for that district" },
      { label: "Rental registration or certificate", value: "What it takes, and the inspection" },
      { label: "Height limit, and measured from", value: "Feet, and the starting line" },
      { label: "The 50 percent rule", value: "The building department’s written answer" },
      { label: "Flood zone and elevation certificate", value: "From our flood guide’s checklist" },
      { label: "Condominium documents", value: "Their shortest stay, if any" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us an address.",
    body: "We’ll find the district, read the rule with you, and call the city when the page doesn’t say. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a house",
    tool: "contact",
  },
};
