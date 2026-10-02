import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Flood zones and flood insurance, explained.
 *
 * Written plainly on purpose: short sentences, everyday words, one idea at a
 * time, and every official term explained the first time it appears. The
 * client's brief is a third-grade reading level with the Virtus guides'
 * calm voice, so scripts/check-guides.ts measures the reading grade of the
 * running text and fails the build if it drifts up (lib/guides/readability.ts).
 *
 * No links inside the paragraphs. Each figure carries one source line and
 * each section lists its sources at the foot of the guide. The facts are the
 * ones the October 1, 2026 fact check verified against the cited pages. The
 * two houses in figure 04 and their heights are made up and say so.
 */

const CHECKED = "checked October 1, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const FEMA_ZONES = "https://www.fema.gov/glossary/flood-zones";
const FEMA_BFE = "https://www.fema.gov/about/glossary/base-flood-elevation-bfe";
const FEMA_COASTAL = "https://www.fema.gov/flood-maps/coastal/insurance-rate-maps";
const FEMA_MSC = "https://msc.fema.gov/portal/search";
const FEMA_LOMC = "https://www.fema.gov/flood-maps/change-your-flood-zone";
const FEMA_GLOSS_CRS = "https://www.fema.gov/glossary/community-rating-system-crs";
const FEMA_EC_FORM = "https://www.fema.gov/sites/default/files/documents/fema_form-ff-206-fy-22-152.pdf";
const FEMA_EC_FAQ = "https://www.fema.gov/sites/default/files/documents/fema_floodplain_elevation-certificate-faq_2023.pdf";
const FEMA_UEC = "https://www.fema.gov/fact-sheet/understanding-elevation-certificates";
const FEMA_RR2 = "https://www.fema.gov/flood-insurance/risk-rating";
const FEMA_FLOOD_INSURANCE = "https://www.fema.gov/flood-insurance";
const FEMA_WAIT = "https://www.fema.gov/fema-common-faq/waiting-period-activating-flood-policy";
const RR2_FAQ = "https://agents.floodsmart.gov/sites/default/files/media/document/2025-07/fema-nfip-risk-rating-2.0-FAQs.pdf";
const CFO_FLOOD = "https://www.myfloridacfo.com/division/consumers/storm/flood-disaster-faqs";
const FS_689_302 = "https://www.flsenate.gov/Laws/Statutes/2026/689.302";
const HB_1049 = "https://www.flsenate.gov/Session/Bill/2024/1049";
const CH_2025_166 = "https://laws.flrules.org/2025/166";
const CFR_61_11 = "https://www.law.cornell.edu/cfr/text/44/61.11";
const FLOODSMART_101 = "https://agents.floodsmart.gov/topics/flood-insurance-101";
const FBC_FLOOD = "https://www.floridabuilding.org/fbc/thecode/2017-6edition/basf_2017_flood_061217.pdf";
const FBC_8TH = "https://www.floridadisaster.org/globalassets/8th-ed_fbc_floodprovisions_dec20232.pdf";
const MANATEE_FLOODPLAIN = "https://www.mymanatee.org/departments/building___development_services/floodplain_management";
const MANATEE_FORERUNNER = "https://manateecountyfl.withforerunner.com/";
const SARASOTA_CITY_MAPS = "https://www.sarasotafl.gov/Department-Pages/Development-Services/Flood-Information/Map-Information";
const SARASOTA_CITY_EC = "https://www.sarasotafl.gov/Department-Pages/Development-Services/Flood-Information/Elevation-Certificates-and-Forms";
const SARASOTA_CITY_FLOOD = "https://www.sarasotafl.gov/Department-Pages/Development-Services/Flood-Information";
const CITIZENS_FLOOD = "https://www.citizensfla.com/flood";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  zones: src("FEMA, Flood zones (glossary)", FEMA_ZONES),
  bfe: src("FEMA, Base flood elevation (glossary)", FEMA_BFE),
  coastal: src("FEMA, Features of flood insurance rate maps in coastal areas", FEMA_COASTAL),
  msc: src("FEMA Flood Map Service Center", FEMA_MSC),
  lomc: src("FEMA, Change your flood zone designation (Letters of Map Change)", FEMA_LOMC),
  crs: src("FEMA, Community Rating System (glossary)", FEMA_GLOSS_CRS),
  ecForm: src("FEMA, Elevation Certificate and instructions, Form FF-206-FY-22-152, 2022 edition (PDF)", FEMA_EC_FORM),
  ecFaq: src("FEMA, Elevation Certificate FAQ, October 2023 (PDF)", FEMA_EC_FAQ),
  uec: src("FEMA, Understanding elevation certificates (fact sheet)", FEMA_UEC),
  rr2: src("FEMA, NFIP’s pricing approach (Risk Rating 2.0)", FEMA_RR2),
  femaFlood: src("FEMA, Flood insurance", FEMA_FLOOD_INSURANCE),
  wait: src("FEMA, Waiting period for a flood policy", FEMA_WAIT),
  cfr: src("44 CFR 61.11, effective date and time of NFIP coverage (Legal Information Institute)", CFR_61_11),
  fs101: src("FloodSmart for agents, Flood insurance 101", FLOODSMART_101),
  rr2Faq: src("FEMA and NFIP, Risk Rating 2.0 frequently asked questions, December 2022 (PDF)", RR2_FAQ),
  cfo: src("Florida Chief Financial Officer, Flood insurance questions", CFO_FLOOD),
  statute: src("Florida Statutes 689.302, Disclosure of flood risks to prospective purchaser", FS_689_302),
  hb1049: src("Florida Senate, CS/CS/HB 1049 (2024), chapter 2024-215, effective October 1, 2024", HB_1049),
  ch2025: src("Laws of Florida, chapter 2025-166 (CS/CS/SB 948), effective October 1, 2025", CH_2025_166),
  fbc: src("Florida Building Code, Flood resistant construction, 6th edition (2017) (PDF)", FBC_FLOOD),
  fbc8: src("Florida Division of Emergency Management, Flood resistant provisions in the 8th edition Florida Building Code (2023) (PDF)", FBC_8TH),
  manatee: src("Manatee County, Floodplain management", MANATEE_FLOODPLAIN),
  forerunner: src("Manatee County, ForeRunner flood portal", MANATEE_FORERUNNER, "The portal opens as an application; its description comes from the county’s floodplain page"),
  cityMaps: src("City of Sarasota, Flood map information", SARASOTA_CITY_MAPS),
  cityEc: src("City of Sarasota, Elevation certificates and forms", SARASOTA_CITY_EC),
  cityFlood: src("City of Sarasota, Flood information", SARASOTA_CITY_FLOOD),
  citizens: src("Citizens Property Insurance Corporation, Flood insurance requirement", CITIZENS_FLOOD, "checked October 2, 2026"),
  countyMaps: src("Sarasota County, Flood maps (scgov.net)", undefined, "returned an access error when we checked, so the guide points to the city’s page, which links the county’s map"),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });
const sub = (text: string): Block => ({ kind: "subhead", text });

/* ---- The guide ------------------------------------------------------------- */

export const FLOOD_GUIDE: Guide = {
  slug: "flood-zones-and-elevation-certificates-on-the-suncoast",
  title: "Flood zones and flood insurance, explained",
  promise: "What a flood zone is, how to find the zone for a house, and what to check before you make an offer.",
  howToUse: [
    "Read this guide once from start to finish. Then use the checklist at the end each time you look at a house.",
    "Maps and rules change. Each drawing names its sources, and the full list is at the end. Before you count on them for one house, check with the county, a surveyor and your insurance agent.",
  ],
  questions: ["What flood zone is the house in?", "How high does the house sit?", "When will the flood policy start?"],
  cover: img("library/listing-exterior-canal-golden", "Homes on canals by the water, from above", "50% 55%"),
  author: { name: "Jessica Garza", slug: "jessica-garza" },
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "what-a-flood-zone-is",
      title: "What a flood zone is",
      lead: "A flood zone is a label on a flood map. It tells you how likely the land is to flood.",
      blocks: [
        p(
          "Picture the Gulf on a calm, sunny day. Now picture a big storm.",
          "Strong wind pushes the water up onto the land. Heavy rain fills the canals and ponds.",
          "Some streets stay dry. Others get water in them.",
        ),
        p(
          "FEMA studies where that water could go. FEMA is the part of the U.S. government that makes flood maps and runs the national flood insurance program.",
          "It draws its answer on a flood map. The map splits the land into flood zones, and each zone has a name, like X or AE.",
        ),
        p(
          "The most important line on the map marks one big flood. It’s a flood with a 1 in 100 chance of happening in any year.",
          "FEMA calls it the base flood. Some people call it the 100-year flood, but that name gives the wrong idea.",
          "It doesn’t mean once every 100 years. It means a 1 in 100 chance every single year.",
        ),
        {
          kind: "paragraph",
          segs: ["Those chances add up. A home loan often lasts 30 years. Over 30 years, a 1 in 100 chance each year comes to about 1 in 4."],
          source: { label: "Our arithmetic", note: "the chance of no big flood in 30 years is 0.99 to the 30th power, about 0.74, so the chance of at least one is about 0.26" },
        },
        {
          kind: "figure",
          eyebrow: "The coast, from the side",
          title: "From the Gulf to higher ground",
          reading: "Read from left to right. The land gets higher as you move away from the Gulf, and the zone changes with it.",
          figure: {
            type: "coast",
            floodLine: "The big flood, a 1 in 100 chance each year",
            calmWater: "The Gulf on a calm day",
            zones: [
              { code: "VE", name: "Highest risk", means: "The beach and the open bay. In the big flood, waves can be 3 feet tall or more." },
              { code: "AE", name: "High risk", means: "Land the big flood is expected to cover. Any waves here are under 3 feet." },
              { code: "X", name: "Lower risk", means: "Land that sits above the big flood." },
            ],
          },
          note: "This drawing shows the idea, not a real place. Real zones follow the shape of the land, street by street.",
          source: { label: "FEMA, Flood zones (glossary); FEMA, Features of flood insurance rate maps in coastal areas", href: FEMA_COASTAL },
        },
      ],
      sources: [S.zones, S.bfe, S.coastal],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "the-three-zones",
      title: "The three zones you’ll hear about most",
      lead: "This guide covers the three zones you’ll hear about most on the coast: VE, AE and X. Each one means something different for you.",
      blocks: [
        sub("VE: the beach and the open bay"),
        p(
          "VE is the beach and the open bay. In the big flood, waves here can be 3 feet tall or more.",
          "That’s why new homes in VE must stand up on posts called pilings. The waves can then pass under the house.",
        ),
        sub("AE: where the big flood reaches"),
        p(
          "AE is land the big flood is expected to cover. Any waves here are under 3 feet. The map shows how high the water would rise.",
          "New homes in AE must have the lowest floor at least 1 foot above that height. Some cities and counties require more.",
        ),
        p("In both VE and AE, you must have flood insurance if your mortgage comes from a lender the U.S. government regulates or backs."),
        sub("X: higher ground"),
        p(
          "X is land that sits above the big flood, so the risk is lower.",
          "U.S. rules don’t require flood insurance here. But a lender can still require it.",
        ),
        p(
          "Citizens, the state-run home insurance company, can require it too. Most of its home policies that cover wind need flood insurance by January 1, 2027, in any zone.",
          "Some need it sooner, based on the home’s value. Ask your agent which rule fits the house.",
        ),
        p(
          "But lower risk isn’t no risk. More than 1 in 5 flood insurance claims come from places FEMA rates as low or moderate risk.",
          "So we suggest flood insurance in X too.",
        ),
        {
          kind: "figure",
          eyebrow: "The three zones",
          title: "What each zone means for you",
          reading: "Each card is one zone. Find the one the house is in.",
          figure: {
            type: "zone-cards",
            labels: { lender: "Is flood insurance required?", build: "How new homes must be built" },
            cards: [
              {
                code: "VE",
                name: "Highest risk",
                tone: "highest",
                means: "The beach and the open bay. In the big flood, waves can be 3 feet or more.",
                lender: { mark: "yes", text: "Yes, with a mortgage from a lender the U.S. government regulates or backs" },
                build: "Up on pilings, so waves can pass under the house",
              },
              {
                code: "AE",
                name: "High risk",
                tone: "high",
                means: "Land the big flood is expected to cover. Any waves are under 3 feet.",
                lender: { mark: "yes", text: "Yes, with a mortgage from a lender the U.S. government regulates or backs" },
                build: "Lowest floor at least 1 foot above the big flood’s height. Some places require more, especially near open water",
              },
              {
                code: "X",
                name: "Lower risk",
                tone: "lower",
                means: "Higher ground that sits above the big flood.",
                lender: { mark: "maybe", text: "Not by U.S. rules. But a lender or Citizens can require it, and we suggest it" },
                build: "No special flood rules",
              },
            ],
          },
          note: "Some maps show other zones too, like A, AH or AO. If the house is in one of those, ask us what it means. Shaded X is still X, just a little closer to the big flood.",
          source: {
            label: "FEMA, Flood zones (glossary); FEMA, Features of flood insurance rate maps in coastal areas; FEMA, Flood insurance; FloodSmart for agents, Flood insurance 101; Citizens Property Insurance, Flood insurance requirement; Florida Building Code flood provisions, 6th and 8th editions",
            href: FEMA_COASTAL,
          },
        },
      ],
      sources: [S.zones, S.coastal, S.femaFlood, S.fs101, S.rr2Faq, S.citizens, S.fbc, S.fbc8],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "find-the-zone",
      title: "How to find the zone for a house",
      lead: "Don’t go by the listing. Look up the exact address yourself. It only takes a few minutes.",
      blocks: [
        p(
          "Flood zones can change from one block to the next, and sometimes from one lot to the next.",
          "A listing may show a zone, but someone typed it in by hand. It could be old, or just wrong.",
        ),
        p(
          "Start with FEMA’s flood map website. Type in the address.",
          "It shows you the zone, and you can print a small map of that spot. This is the map your lender will use.",
        ),
        p(
          "Then check with the county. In Manatee County, use the county’s flood website, called ForeRunner.",
          "Type in the address to see the zone and how high the big flood would reach.",
        ),
        p(
          "In Sarasota County, start with the City of Sarasota’s flood page. It explains the maps and links to the county’s flood map.",
          "New flood maps took effect there on March 27, 2024. If someone quotes an older map, the zone may have changed.",
        ),
        {
          kind: "figure",
          eyebrow: "Where to look",
          title: "Three places to look up a flood zone",
          reading: "Start with FEMA. Then check the county for the house’s own records.",
          figure: {
            type: "map-callout",
            places: [
              {
                name: "FEMA Flood Map Service Center",
                covers: "Both counties",
                body: "Type in the address. See the zone and print a small map of that spot.",
                href: FEMA_MSC,
                cta: "msc.fema.gov",
              },
              {
                name: "Manatee County ForeRunner",
                covers: "Manatee County",
                body: "Type in the address or the parcel number. See the zone and how high the big flood would reach.",
                href: MANATEE_FORERUNNER,
                cta: "manateecountyfl.withforerunner.com",
              },
              {
                name: "City of Sarasota flood maps",
                covers: "Sarasota County",
                body: "Read about the maps from March 27, 2024, and open the county’s flood map from there.",
                href: SARASOTA_CITY_MAPS,
                cta: "sarasotafl.gov",
              },
            ],
          },
          note: "In Sarasota County, the city’s page links to the county’s map tool, so start there.",
          source: { label: "FEMA Flood Map Service Center; Manatee County, Floodplain management; City of Sarasota, Flood map information", href: SARASOTA_CITY_MAPS },
        },
        p("Write down the zone and the date of the map. Papers from different years can show different zones."),
      ],
      sources: [S.msc, S.rr2Faq, S.manatee, S.forerunner, S.cityMaps, S.countyMaps],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "how-high-the-house-sits",
      title: "How high the house sits",
      lead: "Two houses in the same zone can face very different risks. What matters most is how high the floor is.",
      blocks: [
        p(
          "Picture two houses on the same street. They’re the same size and the same age, and they’re in the same flood zone.",
          "But one sits higher than the other. In a big flood, water is less likely to get inside the higher one. It can cost less to insure, too.",
        ),
        p(
          "To compare them, you need two numbers. The first is the height the big flood would reach.",
          "FEMA calls it the base flood elevation. In AE and VE, you’ll find it on the flood map and on the county’s flood site.",
        ),
        p(
          "The second is the height of the house’s lowest floor. A form called an elevation certificate tells you.",
          "A licensed surveyor measures the house and fills it in.",
        ),
        p("Now compare the two. If the floor is above the flood height, that’s good. If it’s below, water could come inside in a big flood."),
        {
          kind: "figure",
          eyebrow: "Two houses",
          title: "Same street, same zone, different floors",
          reading: "The dashed line is how high the big flood would reach. Look at where each floor sits.",
          figure: {
            type: "two-houses",
            floodLine: 9,
            floodLabel: "Big flood height",
            floorLabel: "Lowest floor",
            houses: [
              { name: "House A", floor: 11, verdict: "above", says: "The floor is 2 feet above the flood height. Water is less likely to get inside." },
              { name: "House B", floor: 8, verdict: "below", says: "The floor is 1 foot below the flood height. In a big flood, water could come inside." },
            ],
          },
          note: "These two houses and their heights are made up to show the idea. A real house has its own numbers, on its own certificate.",
          source: { label: "The idea: FEMA, Understanding elevation certificates. The houses and their heights are illustrative and are not from any source", href: FEMA_UEC },
        },
        def(
          "Elevation certificate",
          "A form that shows how high a house sits compared with the big flood. A licensed surveyor, engineer or architect fills it in and signs it.",
          S.ecForm,
        ),
        sub("Where to get one"),
        p(
          "Ask the seller first. They may have a copy. If they don’t, ask the county or the city.",
          "Manatee County may have one if the home is in a high-risk zone and was built since 1975. The City of Sarasota has the ones made for building permits since the late 1970s.",
          "If no one has one, a licensed surveyor can make one for a fee.",
        ),
        p(
          "A complete, correct certificate doesn’t expire. It stays good when the house is sold or the map changes.",
          "But check its flood height against the current map, because the map may have changed since.",
          "It needs to be redone only if the house or the ground around it changes, like when someone adds a room.",
        ),
        sub("If the seller says it’s not in a flood zone"),
        p(
          "Sometimes a seller says FEMA took the house out of the flood zone. If so, ask for FEMA’s letter. It’s called a LOMA or a LOMR-F.",
          "Only that letter changes what your lender has to require. An elevation certificate on its own doesn’t.",
        ),
      ],
      sources: [S.uec, S.bfe, S.ecForm, S.ecFaq, S.manatee, S.cityEc, S.lomc],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "what-sets-the-price",
      title: "What sets the price of flood insurance",
      lead: "The zone decides if your lender must require flood insurance. The house and its land decide what FEMA’s policy costs.",
      blocks: [
        p(
          "First, a key fact. A regular homeowners policy doesn’t cover flood damage. You need a separate flood policy.",
          "You can get one from the National Flood Insurance Program, which FEMA runs, or from a private insurance company.",
        ),
        p(
          "FEMA changed how it prices its flood policies. It no longer uses the flood zone to set the price.",
          "Instead, it looks at the house and its land. How often does it flood there, and from what? How high does the house sit? How close is it to water? What would it cost to rebuild?",
        ),
        p(
          "You don’t need an elevation certificate to buy a FEMA policy anymore. FEMA uses its own data to judge how high the house sits.",
          "But if your certificate shows the floor is higher than FEMA thought, the price can go down. So give it to your insurance agent.",
        ),
        p(
          "In the City of Sarasota, FEMA flood policies get a discount of up to 25 percent.",
          "That’s because the city does extra work to lower its flood risk.",
        ),
        p("Ask for a flood quote before you make an offer. The price can change what you can afford each month."),
        {
          kind: "figure",
          eyebrow: "Who decides what",
          title: "The zone and the house answer different questions",
          reading: "Read each side. The zone answers one question, and the house answers the other.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "The flood zone decides",
                title: "If your lender requires flood insurance",
                items: ["VE or AE: yes, with a mortgage from a lender the U.S. government regulates or backs", "X: not by U.S. rules, but a lender or Citizens can require it. We suggest it."],
              },
              {
                eyebrow: "The house and its land decide",
                title: "What FEMA’s flood insurance costs",
                items: ["How often it floods there", "How high the floor sits", "How close the house is to water", "The kinds of flooding that can reach it", "What it would cost to rebuild"],
              },
            ],
          },
          source: { label: "FEMA, NFIP’s pricing approach (Risk Rating 2.0); FEMA, Flood insurance; Citizens Property Insurance, Flood insurance requirement", href: FEMA_RR2 },
        },
      ],
      sources: [S.cfo, S.statute, S.rr2, S.rr2Faq, S.uec, S.cityFlood, S.crs, S.femaFlood, S.citizens],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "when-the-policy-starts",
      title: "When the flood policy starts",
      lead: "A new FEMA flood policy usually takes 30 days to start. If you buy it with your home loan, it can start the day you close.",
      blocks: [
        p(
          "Here’s a mistake people make, most often when they pay cash. They buy flood insurance on its own, the week they close on a house.",
          "Then they find out it won’t start for 30 days. For a whole month, the house has no flood coverage.",
        ),
        p(
          "There’s one big exception. If you buy the policy as part of getting your mortgage, there’s no wait.",
          "The policy starts when the loan closes. To get this, apply and pay for the policy at or before closing.",
        ),
        p("If you’re paying cash, there’s no loan, so the 30-day wait applies. Buy the policy at least 30 days before you close."),
        p("Private flood companies set their own rules about waiting. Ask your agent."),
        {
          kind: "figure",
          eyebrow: "The wait",
          title: "How long until a new FEMA flood policy starts",
          reading: "Two ways to buy the same policy. Only one starts on closing day.",
          figure: {
            type: "bar",
            unit: "days",
            max: 30,
            rows: [
              { label: "Bought with your mortgage", sub: "Applied for and paid at or before closing", segments: [{ label: "No wait", value: 0, series: 2 }] },
              { label: "Bought any other way", sub: "Including when you pay cash", segments: [{ label: "30 days", value: 30, series: 1, hatched: true }] },
            ],
            legend: [
              { label: "Starts at closing", series: 2 },
              { label: "Waiting period", series: 1, hatched: true },
            ],
          },
          note: "One rare case has a 1-day wait. It’s for a house that a new flood map just moved into a high-risk zone. It lasts for 13 months after the map changes.",
          source: { label: "FEMA, Waiting period for a flood policy; 44 CFR 61.11; FloodSmart for agents, Flood insurance 101; Florida Chief Financial Officer, Flood insurance questions", href: CFO_FLOOD },
        },
      ],
      sources: [S.wait, S.cfr, S.cfo, S.fs101],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "what-the-seller-tells-you",
      title: "What the seller has to tell you",
      lead: "In Florida, the seller has to give you a short flood form by the time you sign the contract. It answers three questions.",
      blocks: [
        p(
          "Florida law says a home seller must fill out a flood form and give it to the buyer.",
          "You get it at or before the time the contract is signed.",
        ),
        p(
          "The form starts with a reminder that homeowners insurance doesn’t cover floods.",
          "Then the seller answers three questions, each with a yes or a no.",
        ),
        {
          kind: "figure",
          eyebrow: "The seller’s form",
          title: "The three questions, in plain words",
          reading: "The seller answers yes or no to each one.",
          figure: {
            type: "questions",
            answers: ["Yes", "No"],
            items: [
              { question: "Do you know of any flooding that damaged the home while you owned it?" },
              { question: "Have you ever filed an insurance claim for flood damage to the home?", note: "This includes a claim with FEMA’s flood insurance program." },
              { question: "Have you ever received assistance for flood damage to the home?", note: "This includes help from FEMA." },
            ],
          },
          note: "These are plain-language versions of the questions. The real form uses the exact words in Florida law.",
          source: { label: "Florida Statutes 689.302, as changed by chapter 2025-166, effective October 1, 2025", href: FS_689_302 },
        },
        p(
          "The form counts more than storm surge as flooding. Water that rises out of the bay, a river or a canal counts.",
          "So does water from a river, stream or ditch that piles up fast, and rain that stands on the land for a long time.",
        ),
        p(
          "A no answer has limits. It covers only this seller’s time in the home. And a seller who never had flood insurance probably has no claim to report.",
          "So read the form next to the elevation certificate, and ask questions.",
        ),
      ],
      sources: [S.statute, S.hb1049, S.ch2025],
    },

    /* ---- 08 ---------------------------------------------------------------- */
    {
      id: "before-you-make-an-offer",
      title: "Before you make an offer",
      lead: "Use this list each time you look at a house. The first few steps only take a few minutes.",
      blocks: [
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Seven things to check before you make an offer",
          reading: "Go in order. Each step helps with the next one.",
          figure: {
            type: "checklist",
            items: [
              { text: "Look up the flood zone for the exact address", detail: "Use FEMA’s flood map site or the county’s. Don’t go by the listing." },
              { text: "Ask the seller for the elevation certificate", detail: "If there isn’t one, ask the county or the city. If they don’t have one, a surveyor can make one." },
              { text: "Compare the floor with the flood height", detail: "Is the lowest floor above or below the big flood? By how much?" },
              { text: "If the seller says it’s out of the flood zone, ask for FEMA’s letter", detail: "Ask for a LOMA or LOMR-F. Only that letter changes what your lender has to require." },
              { text: "Read the seller’s flood form", detail: "Read it next to the elevation certificate." },
              { text: "Get a flood insurance quote", detail: "Give the agent the elevation certificate. It can lower the price." },
              { text: "Plan when the policy will start", detail: "Buy it with your mortgage, applied for and paid by closing. Paying cash? Buy it at least 30 days before closing." },
            ],
          },
          source: { label: "Each step comes from the section it sums up. All sources are listed at the end of this guide", href: FEMA_MSC },
          tool: { tool: "contact", cta: "Send us an address" },
        },
      ],
      sources: [S.msc, S.uec, S.lomc, S.statute, S.rr2, S.cfo],
    },
  ],

  onOnePage: {
    title: "Your flood notes for one house",
    reading: "Fill in the right side for the house you’re looking at.",
    rows: [
      { label: "Address", value: "Write it here" },
      { label: "Flood zone", value: "VE, AE or X" },
      { label: "Date of the flood map", value: "From FEMA’s site" },
      { label: "Big flood height (base flood elevation)", value: "Feet, from the current map. An older certificate may show an old number." },
      { label: "Lowest floor height", value: "Feet, from the certificate" },
      { label: "Floor compared with the flood height", value: "Above or below, and by how much. Ask a surveyor if the certificate is older than the map." },
      { label: "Seller’s flood form", value: "Three answers, yes or no" },
      { label: "Flood insurance quote", value: "From your agent" },
      { label: "Policy start date", value: "On or before closing day" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us an address.",
    body: "We’ll look up the flood zone and the county’s records for that house and go through them with you. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a house",
    tool: "contact",
  },
};
