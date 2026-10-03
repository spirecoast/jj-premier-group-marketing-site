import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * CDD fees in Lakewood Ranch, explained.
 *
 * Written to the plain template in docs/GUIDES.md: short sentences, everyday
 * words, one idea at a time, and every official term explained the first
 * time it appears. No links inside the paragraphs. Each figure carries one
 * source line and each section lists its sources at the foot. The facts are
 * the ones the October 2, 2026 fact check read on the cited pages. The
 * 30-year bar in figure 02 is illustrative and says so. No dollar amounts,
 * on purpose: they differ by neighborhood and by year.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const FS_190_003 = "https://www.flsenate.gov/Laws/Statutes/2026/190.003";
const FS_190_021 = "https://www.flsenate.gov/Laws/Statutes/2026/190.021";
const FS_197_3632 = "https://www.flsenate.gov/Laws/Statutes/2026/197.3632";
const FS_197_162 = "https://www.flsenate.gov/Laws/Statutes/2026/197.162";
const FS_720_30851 = "https://www.flsenate.gov/Laws/Statutes/2026/720.30851";
const LWR_FAQ = "https://content.civicplus.com/api/assets/a5c987e7-c178-4ef2-9144-231beaad61fb";
const LWR_CEVA_MANUAL = "https://content.civicplus.com/api/assets/07e300e3-1105-41c9-b71a-8f514fb7521e";
const LWR_SRVA_MANUAL = "https://content.civicplus.com/api/assets/7dc73591-51b1-47f7-ac5a-58486c64b67a";
const LWR_GBVA_MANUAL = "https://content.civicplus.com/api/assets/911c1c9c-dea8-4f3c-ac9a-7e405457b0e0";
const LWRSD = "https://lakewoodranchstewardship.com/";
const LWRSD_GUIDE = "https://lakewoodranch.com/wp-content/uploads/2025/09/LWRSD-FAQ-Guide-9-16-25.pdf";
const LWRSD_AUDIT = "https://flauditor.gov/pages/specialdistricts_efile%20rpts/2023%20lakewood%20ranch%20stewardship%20district.pdf";
const WINDWARD_CDD = "https://windwardatlakewoodranchcdd.com/about";
const MANATEE_TC_PROPERTY = "https://www.taxcollector.com/services/property-tax.cfm";
const MANATEE_TC_CURRENT = "https://www.taxcollector.com/services/property-tax/current.cfm";
const MANATEE_TC_HELP = "https://taxcollector.com/ptaxweb/Help_GeneralInfo_rwd2_MANATEE.jsp";
const MANATEE_TC_2025 = "https://www.taxcollector.com/news.cfm?key=2025_open_collection";
const SARASOTA_TC_PROPERTY = "https://www.sarasotataxcollector.gov/services/tax-services/property-tax";
const SARASOTA_TC_BROCHURE = "https://www.sarasotataxcollector.gov/files/docs/Informational_Tax_Brochure.pdf";
const SARASOTA_PAO_DATES = "https://www.sarasotapropertyappraiser.gov/appraisal-info/important-dates/";
const MANATEE_PAO_DATES = "https://www.manateepao.gov/important-dates/";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  fs190_003: src("Florida Statutes 190.003 (2026), definitions, including community development district", FS_190_003),
  fs190_021: src("Florida Statutes 190.021 (2026), taxes and assessments of a district", FS_190_021),
  fs197_3632: src("Florida Statutes 197.3632 (2026), uniform method for collecting non-ad valorem assessments", FS_197_3632),
  fs197_162: src("Florida Statutes 197.162 (2026), discounts for early payment", FS_197_162),
  fs720_30851: src("Florida Statutes 720.30851 (2026), the homeowners association estoppel certificate", FS_720_30851),
  lwrFaq: src("Lakewood Ranch Town Hall, CDD and HOA frequently asked questions, revised September 2019 (PDF)", LWR_FAQ, "The same file carries the Summerfield/Riverwalk homeowners’ manual of August 2020"),
  ceva: src("Country Club/Edgewater Village Association, homeowners’ manual, March 2022 (PDF)", LWR_CEVA_MANUAL),
  srva: src("Summerfield/Riverwalk Village Association, homeowners’ manual, January 2019 (PDF)", LWR_SRVA_MANUAL),
  gbva: src("Greenbrook Village Association, homeowners’ manual, June 2020 (PDF)", LWR_GBVA_MANUAL),
  lwrsd: src("Lakewood Ranch Stewardship District, the district’s website", LWRSD),
  lwrsdGuide: src("A Guide to the Lakewood Ranch Stewardship District, September 2025 (PDF)", LWRSD_GUIDE),
  audit: src("Lakewood Ranch Stewardship District, financial statements for the year ended September 30, 2023, filed with the Florida Auditor General (PDF)", LWRSD_AUDIT),
  windward: src("Windward at Lakewood Ranch Community Development District, About the district", WINDWARD_CDD),
  manateeTc: src("Manatee County Tax Collector, Property tax", MANATEE_TC_PROPERTY),
  manateeTcCurrent: src("Manatee County Tax Collector, Current property taxes and discount periods", MANATEE_TC_CURRENT),
  manateeTcHelp: src("Manatee County Tax Collector, online property tax search help", MANATEE_TC_HELP),
  manateeTc2025: src("Manatee County Tax Collector, Collection of 2025 property taxes begins November 3", MANATEE_TC_2025),
  sarasotaTc: src("Sarasota County Tax Collector, Property tax overview", SARASOTA_TC_PROPERTY),
  sarasotaBrochure: src("Sarasota County Tax Collector, property tax brochure with a sample 2025 bill (PDF)", SARASOTA_TC_BROCHURE),
  sarasotaPortal: src("Sarasota County Tax Collector, online bill search (county-taxes.net)", undefined, "returned an access error when we checked, so the guide points to the tax collector’s property tax page, which links to it"),
  sarasotaPao: src("Sarasota County Property Appraiser, Important dates", SARASOTA_PAO_DATES),
  manateePao: src("Manatee County Property Appraiser, Important dates", MANATEE_PAO_DATES),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });

/* ---- The guide ------------------------------------------------------------- */

export const CDD_GUIDE: Guide = {
  slug: "cdd-fees-in-lakewood-ranch-village-by-village",
  title: "CDD fees in Lakewood Ranch, explained",
  promise: "What a community development district is, which district your village is in, and how to read the two lines on your tax bill.",
  howToUse: [
    "Read this guide once from start to finish. Then use the checklist at the end when you look at a house on the Ranch.",
    "Districts and bills change from year to year. Each part of this guide says where its facts come from. Before you count on them for one house, pull that parcel’s own bill and ask the district.",
  ],
  questions: ["Which district is the house in?", "What are the two lines on the bill?", "Does the debt line ever end?"],
  cover: img("guides/cdd-fees-in-lakewood-ranch-village-by-village", "A planned neighborhood curving around a lake, from the air", "50% 50%"),
  author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "what-a-cdd-is",
      title: "What a CDD is",
      lead: "A CDD is a small unit of local government. It paid for the roads and lakes in your village, and it collects for them on your tax bill.",
      blocks: [
        p(
          "Picture a village before anyone lives there. Someone has to build the roads. Someone has to dig the lakes and lay the pipes.",
          "All of that costs money, long before the first house is sold.",
        ),
        p(
          "In Florida, a developer can set up a community development district to do this work. People call it a CDD for short.",
          "Florida law calls it a local unit of special-purpose government. Its job is to build and look after the things a community shares.",
        ),
        p(
          "The district borrows the money up front by selling bonds. Then each lot pays its share back, year by year.",
          "The district also charges each lot for the upkeep of what it built. Both charges are a lien on the lot until they’re paid.",
        ),
        p(
          "The charge isn’t based on what your house is worth. It’s a set amount for your lot.",
          "The county tax collector adds it to your property tax bill, in a section called non-ad valorem assessments.",
        ),
        def(
          "Non-ad valorem assessment",
          "A charge on the tax bill that isn’t based on the value of the house. Ad valorem means by value. The district sets the amount for each lot, and Florida law lets it become a lien on the home, even a homestead.",
          S.fs197_3632,
        ),
        p(
          "The CDD isn’t your homeowners association, and it isn’t the county. It’s a third thing, with its own elected board and its own budget.",
          "The cards below show the three side by side.",
        ),
        {
          kind: "figure",
          eyebrow: "Three payers",
          title: "The county, the district and the association",
          reading: "Each card is one body you pay. Look at which ones put a line on the tax bill.",
          figure: {
            type: "zone-cards",
            labels: { lender: "Is it on the property tax bill?", build: "What it pays for" },
            cards: [
              {
                code: "County",
                name: "Property taxes",
                tone: "lower",
                means: "Based on the value of the house. Set by the county and the other bodies that tax by value.",
                lender: { mark: "yes", text: "Yes. It’s the main part of the bill" },
                build: "County services, paid by everyone in the county",
              },
              {
                code: "CDD",
                name: "The district",
                tone: "high",
                means: "A unit of local government with its own elected board. A set amount for your lot, not a share of its value.",
                lender: { mark: "yes", text: "Yes, as two lines in the non-ad valorem section" },
                build: "Paying back the bonds that built the roads, lakes and pipes, and keeping them up",
              },
              {
                code: "HOA",
                name: "The association",
                tone: "highest",
                means: "A private association of the owners, with its own board. It bills you directly.",
                lender: { mark: "no", text: "No. The association sends its own bill" },
                build: "Rules, approvals for changes to your home, and the day-to-day upkeep of your village",
              },
            ],
          },
          note: "The association’s dues never appear on the tax bill. On the Ranch, the district’s lines do. That’s the quickest way to tell them apart.",
          source: { label: "Florida Statutes 190.003 and 190.021 (2026); Florida Statutes 197.3632 (2026); Lakewood Ranch Town Hall, CDD and HOA frequently asked questions", href: FS_190_021 },
        },
      ],
      sources: [S.fs190_003, S.fs190_021, S.fs197_3632, S.lwrFaq],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "the-two-lines-on-the-bill",
      title: "The two lines on the tax bill",
      lead: "A district can put two lines on the bill. One pays back the bonds. The other pays for upkeep. Only the first one ever ends.",
      blocks: [
        p(
          "Picture the tax bill that comes in November. Near the bottom is the section for non-ad valorem assessments.",
          "Your district’s name is there, beside its charges.",
        ),
        p(
          "The first is the debt line. On the Ranch it’s labeled I&S, and Town Hall calls it debt service.",
          "It’s your lot’s share of paying back the bonds that built the village.",
        ),
        p(
          "The Stewardship District says its debt line is fixed and can’t go up. It’s paid over about 30 years.",
          "You can also pay it off in full when you buy the house, if you’d rather.",
        ),
        p(
          "The second is the maintenance line, labeled O&M. It pays for the year’s upkeep: the roads, the lakes, the landscaping and the gates.",
          "The district sets it in its budget each year, so it can go up or down.",
        ),
        p(
          "Here’s the part that’s easy to miss. When the bonds are paid off, the debt line reads zero. But the maintenance line goes on for as long as the district does.",
          "So when someone says a village has paid off its CDD, they mean the first line. Ask about the second.",
        ),
        p(
          "Summerfield and Riverwalk are an example. Their village manual said in 2020 that the district had no bonds left to pay.",
          "So the debt line there is gone, and the maintenance line is still on the bill.",
        ),
        {
          kind: "figure",
          eyebrow: "The two lines",
          title: "The debt line ends. The maintenance line doesn’t.",
          reading: "Read left to right, in years from when the bonds were sold. The top bar stops. The bottom bar keeps going.",
          figure: {
            type: "timeline",
            max: 40,
            unit: "years",
            ticks: [
              { at: 0, label: "0" },
              { at: 10, label: "10" },
              { at: 20, label: "20" },
              { at: 30, label: "30" },
            ],
            markers: [{ at: 30, label: "Bonds paid off" }],
            lanes: [
              { label: "Debt line (I&S)", sub: "Pays back the bonds", start: 0, end: 30, series: 1, text: "Fixed amount, then zero" },
              { label: "Maintenance line (O&M)", sub: "Pays for upkeep", start: 0, end: 40, series: 2, text: "Set each year, no end" },
            ],
            legend: [
              { label: "Debt line", series: 1 },
              { label: "Maintenance line", series: 2 },
            ],
          },
          note: "The 30 years is the Stewardship District’s own figure for its bonds. An older numbered district’s bonds may have run on a different clock, and some are already paid off. The bars are illustrative: they show the idea, not one district’s dates.",
          source: { label: "Lakewood Ranch Town Hall, CDD and HOA frequently asked questions; A Guide to the Lakewood Ranch Stewardship District, September 2025. The 30-year bar is illustrative", href: LWRSD_GUIDE },
        },
      ],
      sources: [S.lwrFaq, S.lwrsdGuide, S.lwrsd],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "the-three-kinds-of-district",
      title: "The three kinds of district on the Ranch",
      lead: "Lakewood Ranch has three kinds of district. Which one you’re in depends on your village.",
      blocks: [
        p(
          "The older villages are split into five numbered districts. Town Hall calls this part of the Ranch Phase I.",
          "The districts are CDD 1, 2, 4, 5 and 6. There’s no CDD 3 on the list.",
        ),
        p(
          "Each numbered district has a five-member board, elected by the voters who live there. Town Hall does the office work for all five.",
          "The village manuals say the districts’ job today is upkeep: the roads, the common landscaping and the gates.",
        ),
        p(
          "Every other part of the Ranch is in the Lakewood Ranch Stewardship District. The Legislature created it by a special act in June 2005.",
          "It’s one district across many villages, in both Manatee and Sarasota counties.",
        ),
        p(
          "Its charge differs by neighborhood. It depends on the size of the area and what was built to serve it.",
          "The district doesn’t do the day-to-day upkeep of each village. That stays with the village’s homeowners association.",
        ),
        p(
          "Windward, on the Sarasota County side, has a district of its own. Sarasota County created it by ordinance in December 2019.",
          "When we checked, its website said it hadn’t yet raised the money for its planned improvements. So its bill won’t look like an older village’s.",
          "Read the current bill for the exact parcel.",
        ),
        {
          kind: "figure",
          eyebrow: "Village by village",
          title: "Which district each village is in",
          reading: "Find your village. The color bar shows which kind of district it sits in.",
          figure: {
            type: "villages",
            groups: [
              {
                title: "The five numbered districts",
                sub: "Phase I. Each has its own elected board, with the office work done at Town Hall.",
                series: 0,
                rows: [
                  { name: "CDD 1", villages: ["Summerfield", "Riverwalk"] },
                  { name: "CDD 2", villages: ["Country Club South", "Edgewater"] },
                  { name: "CDD 4", villages: ["Greenbrook"] },
                  { name: "CDD 5", villages: ["Country Club North"] },
                  { name: "CDD 6", villages: ["Country Club West"] },
                ],
              },
              {
                title: "The Stewardship District",
                sub: "One district across the newer villages, in both counties. Its charge differs by neighborhood.",
                series: 2,
                rows: [
                  {
                    name: "Manatee County",
                    villages: ["Country Club East", "The Lake Club", "Lorraine Lakes", "Polo Run", "Star Farms", "Azario", "Cresswind", "Del Webb", "Indigo", "Lakewood National", "The Isles", "Sweetwater", "Central Park"],
                  },
                  { name: "Sarasota County", villages: ["Waterside"] },
                ],
              },
              {
                title: "A district of its own",
                sub: "Created by Sarasota County in December 2019. Its bill won’t look like an older village’s.",
                series: 1,
                rows: [{ name: "Windward CDD", villages: ["Windward"] }],
              },
            ],
          },
          note: "Town Hall’s FAQ names the five numbered districts and their villages, and says every other part of the Ranch is in the Stewardship District. The Stewardship District’s audited statements name these villages by their bond series. If your village isn’t here, send us the address.",
          source: {
            label: "Lakewood Ranch Town Hall, CDD and HOA frequently asked questions; Lakewood Ranch Stewardship District, financial statements for the year ended September 30, 2023; Windward at Lakewood Ranch CDD, About the district",
            href: LWR_FAQ,
          },
        },
      ],
      sources: [S.lwrFaq, S.ceva, S.srva, S.gbva, S.lwrsd, S.lwrsdGuide, S.audit, S.windward],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "how-to-read-a-parcels-bill",
      title: "How to read a parcel’s bill",
      lead: "Don’t go by a neighbor’s bill. Pull the bill for the exact parcel. It takes a few minutes online.",
      blocks: [
        p(
          "Both counties let you look up a tax bill online. In Manatee County, go to the tax collector’s site and look up the property.",
          "You can see each charge by taxing body, and print a copy of the bill.",
        ),
        p(
          "In Sarasota County, the tax collector’s property tax page links to its search portal. The bill is a combined notice.",
          "The taxes based on value are on top. The non-ad valorem assessments are below them.",
        ),
        p(
          "Find that section and read the district’s name beside each line. You’ll see the debt line and the maintenance line, each with its own amount.",
          "Write both down.",
        ),
        p(
          "Then look at the August notice. Each year the property appraiser mails a notice of proposed property taxes. It’s called the TRIM notice.",
          "In Sarasota County it lists the proposed non-ad valorem assessments too. If you’re buying in the fall, it’s a better preview of next year’s bill than last year’s.",
        ),
        p(
          "One more thing. The estoppel certificate is the association’s statement of what a seller owes the association. The district’s lines aren’t part of it.",
          "The district collects with the taxes, so its lines are on the tax bill only.",
        ),
        {
          kind: "figure",
          eyebrow: "Where to look",
          title: "Three places to pull the bill",
          reading: "Start with the county the house is in. The third card is for the newer villages.",
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
                name: "Lakewood Ranch Stewardship District",
                covers: "The newer villages",
                body: "The district’s own site explains its two charges: the bond debt line and the maintenance line.",
                href: LWRSD,
                cta: "lakewoodranchstewardship.com",
              },
            ],
          },
          source: { label: "Manatee County Tax Collector, Property tax and online search help; Sarasota County Tax Collector, Property tax overview; Lakewood Ranch Stewardship District", href: SARASOTA_TC_PROPERTY },
        },
      ],
      sources: [S.manateeTc, S.manateeTcHelp, S.manateeTc2025, S.sarasotaTc, S.sarasotaBrochure, S.sarasotaPortal, S.sarasotaPao, S.manateePao, S.fs720_30851],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "when-the-bill-comes",
      title: "When the bill comes, and the discount for paying early",
      lead: "Tax bills go out in November. Pay that month and the county takes 4 percent off. The discount shrinks each month after that.",
      blocks: [
        p(
          "Here’s the year. The county values every house as of January 1. The property appraiser mails the TRIM notice in August.",
          "The tax collector mails the bills in November, and they’re due by the end of March.",
        ),
        p(
          "Florida law gives a discount for paying early. It’s 4 percent in November, 3 in December, 2 in January and 1 in February.",
          "In March there’s no discount. After March 31, the taxes are late.",
        ),
        p("The discount applies to the district’s lines too. They’re collected under the same rules as the taxes."),
        p("If you close in the fall, the year’s bill may already be out. Ask the title company how it will be split between you and the seller at closing."),
        {
          kind: "figure",
          eyebrow: "The discount",
          title: "What you save by paying early",
          reading: "One bar for each month. The earlier you pay, the longer the bar.",
          figure: {
            type: "bar",
            unit: "percent off",
            max: 4,
            rows: [
              { label: "November", sub: "Or within 30 days of the bill being mailed", segments: [{ label: "4 percent", value: 4, series: 2 }] },
              { label: "December", segments: [{ label: "3 percent", value: 3, series: 2 }] },
              { label: "January", segments: [{ label: "2 percent", value: 2, series: 2 }] },
              { label: "February", segments: [{ label: "1 percent", value: 1, series: 2 }] },
              { label: "March", sub: "The last month to pay before the taxes are late", segments: [{ label: "No discount", value: 0, series: 2 }] },
            ],
            legend: [{ label: "Discount", series: 2 }],
          },
          note: "Manatee County’s 4 percent window for the 2025 bills ran from November 3 to December 2. The exact dates shift a little each year with the mailing date.",
          source: { label: "Florida Statutes 197.162 (2026); Sarasota County Tax Collector, Property tax overview; Manatee County Tax Collector, Current property taxes", href: FS_197_162 },
        },
      ],
      sources: [S.fs197_162, S.fs197_3632, S.sarasotaTc, S.manateeTcCurrent, S.manateeTc2025, S.manateePao, S.sarasotaPao],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "before-you-make-an-offer",
      title: "Before you make an offer",
      lead: "Use this list for any house on the Ranch. Most of it takes a few minutes online.",
      blocks: [
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Seven things to check before you make an offer",
          reading: "Go in order. Each step helps with the next one.",
          figure: {
            type: "checklist",
            items: [
              { text: "Find out which district the village is in", detail: "Use the figure in section 3, or read the district’s name on the parcel’s bill." },
              { text: "Pull the tax bill for the exact parcel", detail: "Manatee or Sarasota tax collector. Don’t go by a neighbor’s bill." },
              { text: "Read the two district lines", detail: "Debt (I&S) and maintenance (O&M). Write down both." },
              { text: "Ask whether the debt line is paid off, or when it will be", detail: "If someone says the CDD is paid off, they mean this line only." },
              { text: "Check the August notice", detail: "The TRIM notice previews next year’s bill." },
              { text: "Ask about paying the debt line off at closing", detail: "The Stewardship District allows it. Ask the district and your lender whether it makes sense for you." },
              { text: "Add the association’s dues on top", detail: "They’re never on the tax bill. Ask the association for its budget." },
            ],
          },
          source: { label: "Each step comes from the section it sums up. The sources are listed there and at the end of this guide", href: LWR_FAQ },
          tool: { tool: "contact", cta: "Send us an address" },
        },
      ],
      sources: [S.lwrFaq, S.lwrsdGuide, S.manateeTc, S.sarasotaTc, S.sarasotaPao],
    },
  ],

  onOnePage: {
    title: "Your district notes for one house",
    reading: "Fill in the right side for the house you’re looking at.",
    rows: [
      { label: "Address", value: "Write it here" },
      { label: "Village, and which district", value: "Numbered CDD, Stewardship or Windward" },
      { label: "Debt line (I&S) this year", value: "From the tax bill" },
      { label: "Maintenance line (O&M) this year", value: "From the tax bill" },
      { label: "Are the bonds paid off?", value: "Yes, no, or the year they will be" },
      { label: "August notice for next year", value: "From the TRIM notice" },
      { label: "Association dues", value: "From the association, not the bill" },
      { label: "Who to ask about the district", value: "Town Hall, or the Stewardship District" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us an address.",
    body: "We’ll pull the parcel’s bill, name the district and read the two lines with you. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a house",
    tool: "contact",
  },
};
