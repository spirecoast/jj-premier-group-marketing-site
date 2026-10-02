import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Homestead, Save Our Homes and portability, explained.
 *
 * Plain on purpose: short sentences, everyday words, one idea at a time,
 * and every official term explained the first time it appears. The facts
 * were checked against the cited pages on October 2, 2026. Dollar amounts
 * are written out ("25,000 dollars") because the guides carry no "$"
 * figures. The "same house, two values" bars in figure 03 are made up and
 * say so; the portability bars in figure 05 are the Manatee County
 * Property Appraiser's own example.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const DOR_PT113 = "https://floridarevenue.com/property/Documents/pt113.pdf";
const DOR_PT112 = "https://floridarevenue.com/property/Documents/pt112.pdf";
const DOR_PT107 = "https://floridarevenue.com/property/Documents/pt107.pdf";
const DOR_CPI = "https://floridarevenue.com/property/Documents/cpi_homestead_exemption.pdf";
const DOR_CALENDAR = "https://www.floridarevenue.com/property/Documents/taxcalendar.pdf";
const DOR_DR501T = "https://floridarevenue.com/property/Documents/dr501t.pdf";
const FS_196_031 = "https://www.flsenate.gov/Laws/Statutes/2026/196.031";
const FS_196_011 = "https://www.flsenate.gov/Laws/Statutes/2026/196.011";
const FS_193_155 = "https://www.flsenate.gov/Laws/Statutes/2026/193.155";
const CH_2026_239 = "https://laws.flrules.org/2026/239";
const MANATEE_PAO_SOH = "https://www.manateepao.gov/definitions/exemptions-save-our-homes/";
const MANATEE_PAO_PORT = "https://www.manateepao.gov/definitions/portability-of-save-our-homes/";
const MANATEE_PAO_DATES = "https://www.manateepao.gov/important-dates/";
const MANATEE_PAO_AMEND = "https://www.manateepao.gov/data/downloads/Proposed%202026%20Florida%20Property%20Tax%20Amendment%20FAQ.pdf";
const SARASOTA_PAO_OVERVIEW = "https://www.sarasotapropertyappraiser.gov/exemptions/homestead/overview/";
const SARASOTA_PAO_SOH = "https://www.sarasotapropertyappraiser.gov/exemptions/homestead/save-our-homesportability/";
const SARASOTA_PAO_PORT_FAQ = "https://www.sarasotapropertyappraiser.gov/exemptions/homestead/portability-faq/";
const SARASOTA_PAO_DATES = "https://www.sarasotapropertyappraiser.gov/appraisal-info/important-dates/";
const SARASOTA_PAO_TRIM = "https://www.sarasotapropertyappraiser.gov/media/gu2dpe5u/2026-supplement.pdf";
const HOUSE_HJR1 = "https://www.flhouse.gov/Sections/Documents/loaddoc.aspx?BillNumber=1&DocumentType=Analysis&FileName=h0001z.SAC.DOCX&Session=2026F";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  pt113: src("Florida Department of Revenue, Property tax information for homestead exemption, PT-113, revised August 2025 (PDF)", DOR_PT113),
  pt112: src("Florida Department of Revenue, Save Our Homes assessment limitation and portability transfer, PT-112, revised August 2024 (PDF)", DOR_PT112),
  pt107: src("Florida Department of Revenue, Property tax information for first-time Florida homebuyers, PT-107, revised August 2024 (PDF)", DOR_PT107),
  cpi: src("Florida Department of Revenue, Additional homestead exemption adjustment, revised January 2026 (PDF)", DOR_CPI),
  calendar: src("Florida Department of Revenue, Florida property tax calendar, typical year (PDF)", DOR_CALENDAR),
  dr501t: src("Florida Department of Revenue, Transfer of Homestead Assessment Difference, form DR-501T (PDF)", DOR_DR501T),
  fs196031: src("Florida Statutes 196.031 (2026), Exemption of homesteads", FS_196_031),
  fs196011: src("Florida Statutes 196.011 (2026), Annual application required for exemption", FS_196_011),
  fs193155: src("Florida Statutes 193.155 (2026), Homestead assessments", FS_193_155),
  ch2026239: src("Laws of Florida, chapter 2026-239 (HB 7031-E), sections 3 and 4, amending 193.155(8) from the 2027 tax roll", CH_2026_239),
  manateeSoh: src("Manatee County Property Appraiser, Exemptions and Save Our Homes", MANATEE_PAO_SOH),
  manateePort: src("Manatee County Property Appraiser, Portability of Save Our Homes", MANATEE_PAO_PORT),
  manateeDates: src("Manatee County Property Appraiser, Important dates", MANATEE_PAO_DATES),
  manateeAmend: src("Manatee County Property Appraiser, Proposed 2026 Florida property tax amendment, Amendment 3 (CS/HJR 1F), frequently asked questions (PDF)", MANATEE_PAO_AMEND),
  sarasotaOverview: src("Sarasota County Property Appraiser, Homestead exemption overview", SARASOTA_PAO_OVERVIEW),
  sarasotaSoh: src("Sarasota County Property Appraiser, Save Our Homes and portability", SARASOTA_PAO_SOH),
  sarasotaPortFaq: src("Sarasota County Property Appraiser, Portability FAQ", SARASOTA_PAO_PORT_FAQ),
  sarasotaDates: src("Sarasota County Property Appraiser, Important dates", SARASOTA_PAO_DATES),
  sarasotaTrim: src("Sarasota County Property Appraiser, 2026 TRIM notice supplement (PDF)", SARASOTA_PAO_TRIM),
  house: src("Florida House of Representatives, final bill analysis, HJR 1 (2026 special session F)", HOUSE_HJR1),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });

/* ---- The guide ------------------------------------------------------------- */

export const HOMESTEAD_GUIDE: Guide = {
  slug: "homestead-save-our-homes-and-portability",
  title: "Homestead, Save Our Homes and portability, explained",
  promise: "Why the tax on a listing isn’t yours, what homestead takes off your bill, and what you can carry to the next house.",
  howToUse: [
    "Read this guide once, start to finish. Then use the worksheet at the end when you look at a house.",
    "Tax rules change, and voters may change them again in November 2026. Each part of this guide says where its facts come from. Before you count on a number for one house, check with the county property appraiser.",
  ],
  questions: ["What will my first full-year bill be?", "Did I file for homestead by March 1?", "Can I carry my cap from my old Florida home?"],
  cover: img("library/kitchen-white-palms", "A white kitchen with palms outside the window", "50% 50%"),
  author: { name: "Jessica Garza", slug: "jessica-garza" },
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "the-listing-is-the-sellers-bill",
      title: "The tax on a listing is the seller’s bill",
      lead: "A listing shows what the seller pays now. Your bill will be figured a different way, starting the January after you buy.",
      blocks: [
        p(
          "Picture two houses on the same street. They’re the same size and the same age.",
          "One owner has lived there for twenty years. The other bought last year.",
          "The long-time owner pays far less tax. The houses are alike, so why?",
        ),
        p(
          "In Florida, two things lower the bill for people who live in their home.",
          "One is an exemption. It takes some value off the top.",
          "The other is a cap. It slows how fast the taxed value can rise.",
          "Both belong to the owner, not to the house.",
        ),
        p(
          "When the house sells, both come off.",
          "On the January 1 after you buy, the county sets the taxed value back to the home’s market value.",
          "Your own exemption and cap then start from there, if you file for them.",
        ),
        p(
          "So don’t budget on the listing. Budget on what the house is worth now.",
          "The state’s own guide for new Florida owners says it plainly.",
          "Many new owners are surprised when their bill is higher than the last owner’s.",
        ),
        {
          kind: "figure",
          eyebrow: "Two bills",
          title: "The seller’s bill and yours are figured on different numbers",
          reading: "Read each side. The seller’s side ends at closing. Your side starts the next January 1.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "The seller’s bill was figured on",
                title: "Years of capped value, minus their exemption",
                items: ["A taxed value that could rise only a little each year, for as long as they owned the home", "Minus their homestead exemption", "None of it stays with the house"],
              },
              {
                eyebrow: "Your first full-year bill is figured on",
                title: "The home’s market value on the next January 1",
                items: ["The value the county sets on the January 1 after you buy", "Minus your own exemption, if you file by March 1", "Your cap starts the year after that"],
              },
            ],
          },
          source: { label: "Florida Department of Revenue, PT-107, Your taxes vs. the previous owner’s taxes; PT-112, Change or transfer of ownership", href: DOR_PT107 },
        },
      ],
      sources: [S.pt107, S.pt112, S.fs193155, S.sarasotaTrim],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "what-homestead-is",
      title: "What homestead is",
      lead: "Homestead is a tax break for the home you live in. It takes value off the top before your tax is figured.",
      blocks: [
        p(
          "The home must be your permanent home on January 1.",
          "Then you apply with the county property appraiser by March 1. In Manatee and Sarasota you can apply online.",
          "Once it’s granted, it stays on the home each year while you live there.",
        ),
        p(
          "The break comes in two parts. The first part takes 25,000 dollars off the home’s value.",
          "That part counts against every tax on your bill, school taxes too.",
        ),
        p(
          "The second part takes a bit more off. In 2026 it’s 26,411 dollars.",
          "It only counts on the value above 50,000 dollars. And it skips school taxes.",
          "This part rises a little each January with inflation.",
        ),
        p(
          "If you miss March 1, the law allows a late application only in a few cases. The appraiser decides.",
          "Don’t count on it. Miss the date, and you pay the full bill for a year.",
        ),
        {
          kind: "figure",
          eyebrow: "The two parts",
          title: "What homestead takes off a home’s value",
          reading: "Read from the bottom up. The lowest value is at the bottom. Green and blue bands are exempt.",
          figure: {
            type: "tiers",
            axis: "The home’s assessed value, lowest at the bottom",
            top: 100,
            bands: [
              { from: 0, to: 25, range: "The first 25,000 dollars", label: "Exempt from every tax", detail: "School taxes too.", tone: "exempt" },
              { from: 25, to: 50, range: "25,000 to 50,000 dollars", label: "Taxed", detail: "No exemption on this slice.", tone: "taxed" },
              { from: 50, to: 76.4, range: "50,000 to 76,411 dollars", label: "Exempt from all but school taxes", detail: "The second part. It’s 26,411 dollars in 2026 and rises with inflation.", tone: "partial" },
              { from: 76.4, to: 100, range: "Above 76,411 dollars", label: "Taxed", detail: "The rest of the value is taxed, after the cap in the next section.", tone: "taxed" },
            ],
            legend: { exempt: "Exempt from every tax", partial: "Exempt from all but school taxes", taxed: "Taxed" },
          },
          note: "This drawing uses the 2026 amounts. The second part changes each January.",
          source: { label: "Florida Department of Revenue, PT-113, Examples of applying homestead; Additional homestead exemption adjustment (2026); Florida Statutes 196.031(1)", href: DOR_PT113 },
        },
      ],
      sources: [S.pt113, S.cpi, S.fs196031, S.fs196011, S.manateeSoh, S.sarasotaOverview],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "the-cap",
      title: "Save Our Homes: the cap",
      lead: "Once you have homestead, the value your tax is figured on can rise only a little each year. That’s the cap.",
      blocks: [
        p(
          "Every home has two values on the county’s books. The first is the market value.",
          "The appraiser calls it the just value. It can jump a lot in a hot year.",
        ),
        p(
          "The second is the assessed value. That’s the one your tax is figured on.",
          "With homestead, it can rise by no more than 3 percent a year.",
          "If prices in general rose less than that, it rises by that smaller amount. In 2026 the cap is 2.7 percent.",
        ),
        p(
          "The gap between the two values is your Save Our Homes benefit.",
          "After many years of rising prices, the gap can be big. That’s why the long-time owner’s bill is so small.",
        ),
        p(
          "The cap starts the year after your homestead starts.",
          "In your first year, the assessed value is the market value. From the second year on, it’s capped.",
        ),
        {
          kind: "figure",
          eyebrow: "Two values",
          title: "Same house, two values",
          reading: "Each bar is one number for the same house. The gap is the owner’s benefit.",
          figure: {
            type: "bar",
            unit: "percent of today’s market value",
            max: 100,
            rows: [
              { label: "Market value (just value)", sub: "What the home is worth today", segments: [{ label: "100", value: 100, series: 0 }] },
              { label: "Assessed value, after ten years under the cap", sub: "What the tax is figured on", segments: [{ label: "About 65", value: 65, series: 2 }] },
              { label: "The Save Our Homes benefit", sub: "The gap between the two", segments: [{ label: "About 35", value: 35, series: 1, hatched: true }] },
            ],
            legend: [
              { label: "Market value", series: 0 },
              { label: "Assessed value", series: 2 },
              { label: "The gap", series: 1, hatched: true },
            ],
          },
          note: "These numbers are made up to show the idea. Here the market value doubled in ten years while the assessed value rose 3 percent a year. A real home has its own numbers on the appraiser’s site.",
          source: { label: "The rule: Florida Department of Revenue, PT-112; Florida Statutes 193.155(1). The numbers are illustrative and are not from any source", href: DOR_PT112 },
        },
      ],
      sources: [S.pt112, S.fs193155, S.manateeSoh, S.sarasotaSoh, S.sarasotaTrim],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "the-reset",
      title: "The reset: what happens the January after you buy",
      lead: "The seller’s exemption and cap stay on the bill through December 31. On the next January 1, the value resets, and your own break can begin.",
      blocks: [
        p(
          "In the year you buy, nothing changes on the county’s books.",
          "The seller’s exemption and cap stay through December 31. That year’s bill still carries their breaks.",
        ),
        p(
          "On the January 1 after you buy, the appraiser takes the seller’s breaks off. The assessed value becomes the market value.",
          "Live there on that January 1 and file by March 1. Then your own homestead comes off that value the same year.",
        ),
        p(
          "Your cap begins the year after that.",
          "So your bill runs in three steps: the seller’s year, the reset year, and then the capped years.",
        ),
        p(
          "There’s one way to soften the reset.",
          "If you had a Florida homestead before, you may carry part of your old cap to the new house. The next section explains.",
        ),
        {
          kind: "figure",
          eyebrow: "Three years",
          title: "The seller’s year, the reset year, and the capped years",
          reading: "Read left to right from the day you buy. Each lane is one thing on the county’s books.",
          figure: {
            type: "timeline",
            max: 36,
            unit: "months",
            ticks: [
              { at: 0, label: "You buy" },
              { at: 12, label: "Jan 1" },
              { at: 24, label: "Jan 1" },
            ],
            markers: [],
            lanes: [
              { label: "The seller’s exemption and cap", sub: "Through December 31", start: 0, end: 12, series: 0, text: "On the bill" },
              { label: "The reset", sub: "The first January 1", start: 12, end: 24, series: 1, hatched: true, text: "Market value" },
              { label: "Your homestead exemption", sub: "If you file by March 1", start: 12, end: 36, series: 2, text: "Off the value" },
              { label: "Your cap", sub: "From the second January 1", start: 24, end: 36, series: 2, hatched: true, text: "Capped" },
            ],
            legend: [
              { label: "The seller’s breaks", series: 0 },
              { label: "The reset", series: 1, hatched: true },
              { label: "Your exemption", series: 2 },
              { label: "Your cap", series: 2, hatched: true },
            ],
          },
          note: "This shows a home bought partway through a year. The exact dates depend on when you close.",
          source: { label: "Florida Department of Revenue, PT-107 and PT-112; Manatee County Property Appraiser, Exemptions and Save Our Homes; Florida Statutes 193.155(1) and (3)", href: MANATEE_PAO_SOH },
        },
      ],
      sources: [S.pt107, S.pt112, S.manateeSoh, S.fs193155, S.sarasotaTrim],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "portability",
      title: "Portability: what you can carry to the next house",
      lead: "If you’re moving from one Florida homestead to another, you can take some or all of your cap’s benefit with you.",
      blocks: [
        p(
          "Remember the gap between the market value and the assessed value?",
          "Florida lets you move that gap to your next homestead. The state calls it portability.",
          "The most you can carry is 500,000 dollars.",
        ),
        p(
          "There’s a clock. You must set up the new homestead within three years of January 1 of the year you left the old one.",
          "The state’s brochure is careful to say it’s not three years from the sale date.",
        ),
        p(
          "Moving to a home worth more? You carry the whole gap, up to the limit.",
          "Moving to a home worth less? You carry the same share of the value, not the same dollars.",
        ),
        def(
          "Form DR-501T",
          "The form that moves the gap. Its full name is the Transfer of Homestead Assessment Difference. File it with your homestead application by March 1. The homestead application alone doesn’t move the gap.",
          S.dr501t,
        ),
        p(
          "The Legislature rewrote this part of the law in 2026, starting with the 2027 tax roll.",
          "The 500,000 dollar limit and the three-year clock are the same in the new text. Check the current rule the year you move.",
        ),
        {
          kind: "figure",
          eyebrow: "The county’s example",
          title: "Carrying a 30,000 dollar gap to a new home",
          reading: "Each bar is a home’s market value, in thousands of dollars. The hatched part at the start is the gap that isn’t taxed.",
          figure: {
            type: "bar",
            unit: "thousand dollars",
            max: 300,
            rows: [
              {
                label: "The old home",
                sub: "Worth 225, taxed on 195",
                segments: [
                  { label: "gap 30", value: 30, series: 1, hatched: true },
                  { label: "taxed on 195", value: 195, series: 0 },
                ],
              },
              {
                label: "A new home worth more (300)",
                sub: "You carry the whole gap",
                segments: [
                  { label: "gap 30", value: 30, series: 1, hatched: true },
                  { label: "taxed on 270", value: 270, series: 0 },
                ],
              },
              {
                label: "A new home worth less (200)",
                sub: "You carry the same share",
                segments: [
                  { label: "gap 26", value: 26, series: 1, hatched: true },
                  { label: "taxed on 174", value: 174, series: 0 },
                ],
              },
            ],
            legend: [
              { label: "What the tax is figured on", series: 0 },
              { label: "The gap you carry", series: 1, hatched: true },
            ],
          },
          note: "The numbers come from the Manatee County appraiser’s own example, in thousands of dollars. The old gap was 30,000 dollars, about 13 percent of the old home’s value. Moving down, 13 percent of 200,000 is about 26,000.",
          source: { label: "Manatee County Property Appraiser, Portability of Save Our Homes (the worked examples)", href: MANATEE_PAO_PORT },
        },
      ],
      sources: [S.pt112, S.fs193155, S.manateePort, S.sarasotaPortFaq, S.dr501t, S.ch2026239],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "four-dates",
      title: "Four dates in the tax year",
      lead: "The property tax year runs on a few fixed dates. Knowing them tells you when your bill will change.",
      blocks: [
        p(
          "January 1 is the day that counts. The county values every home as of that day.",
          "It’s also the day you must be living in the home to get homestead for that year.",
        ),
        p("March 1 is the last day to file for homestead, and for portability. Both counties take the application online."),
        p(
          "In August the appraiser mails a notice of proposed property taxes. It’s called the TRIM notice. It isn’t a bill.",
          "It shows your value, your exemptions and the tax each local government proposes.",
          "If something looks wrong, that’s the time to ask.",
        ),
        p("In November the tax collector mails the bill. You get a small discount for paying early. The taxes are due by the next March 31."),
        {
          kind: "figure",
          eyebrow: "The year",
          title: "The four dates on one calendar",
          reading: "Each numbered line is a date. The shaded part is the window for filing.",
          figure: {
            type: "year",
            spans: [{ from: 0, to: 2, label: "The window to file for homestead, January 1 to March 1", series: 2 }],
            marks: [
              { at: 0, label: "January 1", detail: "The county sets every home’s value. You must live in the home on this day to get homestead for the year." },
              { at: 2, label: "March 1", detail: "The last day to file for homestead and for portability." },
              { at: 7.77, label: "August", detail: "The TRIM notice comes. It shows your value, your exemptions and the proposed tax. It isn’t a bill." },
              { at: 10, label: "November", detail: "The tax collector mails the bill. Pay early for a small discount. It’s due by March 31." },
            ],
          },
          source: { label: "Florida Department of Revenue, Florida property tax calendar; Sarasota County Property Appraiser, Important dates; Manatee County Property Appraiser, Important dates", href: DOR_CALENDAR },
        },
      ],
      sources: [S.calendar, S.sarasotaDates, S.manateeDates, S.pt107, S.fs196011],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "november-2026-vote",
      title: "What voters decide in November 2026",
      lead: "A change to Florida’s constitution is on the November 3, 2026 ballot. If it passes, the homestead exemption would grow a lot from 2027.",
      blocks: [
        p("The Legislature put Amendment 3 on the ballot. It needs 60 percent of the vote to pass. Until then, the rules in this guide stand."),
        p(
          "If it passes, the part of the exemption that skips school taxes would grow.",
          "It would be up to 150,000 dollars in 2027 and up to 250,000 dollars in 2028.",
          "The first 25,000 dollars off school taxes would stay as it is.",
        ),
        p(
          "The cap and portability would not change.",
          "A homestead set up by someone new to Florida in 2027 or later would start smaller.",
          "We’ll update this guide after the vote.",
        ),
        {
          kind: "figure",
          eyebrow: "Now and later",
          title: "The exemption now, and if the amendment passes",
          reading: "One card for each year. The cards for 2027 and 2028 apply only if 60 percent of voters say yes.",
          figure: {
            type: "zone-cards",
            labels: { lender: "Off school taxes", build: "Off every other tax" },
            cards: [
              {
                code: "Now",
                name: "The rules in this guide",
                tone: "lower",
                means: "The two-part exemption in section 2.",
                lender: { mark: "yes", text: "The first 25,000 dollars" },
                build: "Up to 26,411 dollars more, on value above 50,000 dollars",
              },
              {
                code: "2027",
                name: "If the amendment passes",
                tone: "high",
                means: "Takes effect January 1, 2027. First seen on the August 2027 TRIM notice.",
                lender: { mark: "yes", text: "The first 25,000 dollars, as now" },
                build: "Up to 150,000 dollars",
              },
              {
                code: "2028",
                name: "If the amendment passes",
                tone: "highest",
                means: "The second step. Adjusted for inflation from 2029.",
                lender: { mark: "yes", text: "The first 25,000 dollars, as now" },
                build: "Up to 250,000 dollars",
              },
            ],
          },
          note: "The county appraisers don’t take sides on the amendment, and this guide doesn’t either. It shows what the ballot measure says.",
          source: { label: "Manatee County Property Appraiser, Proposed 2026 Florida property tax amendment FAQ; Florida House, final bill analysis, HJR 1 (2026F)", href: MANATEE_PAO_AMEND },
        },
      ],
      sources: [S.manateeAmend, S.house],
    },

    /* ---- 08 ---------------------------------------------------------------- */
    {
      id: "before-you-buy",
      title: "Before you buy: your tax homework",
      lead: "Five things to do, in order. The first two take ten minutes on the appraiser’s website.",
      blocks: [
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Five things to do before you buy",
          reading: "Go in order. Each step helps with the next one.",
          figure: {
            type: "checklist",
            items: [
              { text: "Look up the home on the county appraiser’s site", detail: "Note the market (just) value, the assessed value and the exemptions. The gap is what comes off when the home sells." },
              { text: "Figure your own first full-year bill", detail: "Start from the market value, not the seller’s bill. Take off your exemption. Some appraiser sites have a tax estimator." },
              { text: "Mark March 1 on your calendar", detail: "File for homestead online in the first year you live there on January 1." },
              { text: "If you’re selling a Florida homestead, file the portability form too", detail: "Form DR-501T, with the homestead application, by March 1. Within three years of January 1 of the year you left the old home." },
              { text: "Read the TRIM notice in August", detail: "Check the value and the exemptions. Ask the appraiser’s office if something is missing." },
            ],
          },
          source: { label: "Each step comes from the section it sums up. The sources are listed there and at the end of this guide", href: DOR_PT107 },
          tool: { tool: "contact", cta: "Send us an address" },
        },
        p("Moving here from another Florida homestead? Put the portability form on your moving list, with a date beside it."),
      ],
      sources: [S.pt107, S.pt112, S.pt113, S.calendar],
    },
  ],

  onOnePage: {
    title: "Your tax notes for one house",
    reading: "Fill in the right side for the house you’re looking at.",
    rows: [
      { label: "Address", value: "Write it here" },
      { label: "Market (just) value", value: "From the appraiser’s site" },
      { label: "Assessed value", value: "From the appraiser’s site" },
      { label: "The gap (market minus assessed)", value: "Comes off when the home sells" },
      { label: "The seller’s exemptions", value: "They come off too" },
      { label: "Your first full-year bill, estimated", value: "Market value, minus your exemption" },
      { label: "Day to file for homestead", value: "By March 1 of the first year" },
      { label: "Portability form", value: "DR-501T, if you had a Florida homestead" },
      { label: "TRIM notice checked", value: "August" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us an address.",
    body: "We’ll pull the appraiser’s record for that house and walk through the two values and the dates with you. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a house",
    tool: "contact",
  },
};
