import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Inline, Source } from "./types";

/**
 * Flood zones and elevation certificates on the Suncoast.
 *
 * Every figure and every factual paragraph carries the page it came from.
 * The sources were opened on the day in CHECKED; where a page would not
 * load for us the source line says so. Numbers in the worked example and
 * the timeline are illustrative and say so on the figure. Places and rules,
 * never people; no premium figures.
 */

const CHECKED = "checked October 1, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const FEMA_ZONES = "https://www.fema.gov/glossary/flood-zones";
const FEMA_ZONE_AE = "https://www.fema.gov/about/glossary/zone-ae";
const FEMA_BFE = "https://www.fema.gov/about/glossary/base-flood-elevation-bfe";
const FEMA_COASTAL = "https://www.fema.gov/flood-maps/coastal/insurance-rate-maps";
const FEMA_MSC = "https://msc.fema.gov/portal/search";
const FEMA_LOMC = "https://www.fema.gov/flood-maps/change-your-flood-zone";
const FEMA_GLOSS_FIRM = "https://www.fema.gov/glossary/flood-insurance-rate-map-firm";
const FEMA_GLOSS_LOMA = "https://www.fema.gov/glossary/letter-map-amendment-loma";
const FEMA_GLOSS_LOMR = "https://www.fema.gov/glossary/letter-map-revision-lomr";
const FEMA_GLOSS_CRS = "https://www.fema.gov/glossary/community-rating-system-crs";
const FEMA_EC_FORM = "https://www.fema.gov/sites/default/files/documents/fema_form-ff-206-fy-22-152.pdf";
const FEMA_EC_FAQ = "https://www.fema.gov/sites/default/files/documents/fema_floodplain_elevation-certificate-faq_2023.pdf";
const FEMA_UEC = "https://www.fema.gov/fact-sheet/understanding-elevation-certificates";
const FEMA_RR2 = "https://www.fema.gov/flood-insurance/risk-rating";
const FEMA_FLOOD_INSURANCE = "https://www.fema.gov/flood-insurance";
const FEMA_WAIT = "https://www.fema.gov/fema-common-faq/waiting-period-activating-flood-policy";
const FLOODSMART_ZONE = "https://www.floodsmart.gov/flood-zones-and-maps/what-is-my-flood-zone";
const FLOODSMART_EC = "https://agents.floodsmart.gov/write-policy/elevation-certificates";
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
const SARASOTA_COUNTY_MAPS = "https://www.scgov.net/government/stormwater/flood-maps";

const GUIDE_INSPECTIONS = "/blog/inspections-on-the-suncoast-what-a-good-one-covers";
const GUIDE_INSURANCE = "/blog/homeowners-wind-and-flood-insurance-on-this-coast";
const GUIDE_HURRICANE = "/blog/hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  zones: src("FEMA, Flood zones (glossary)", FEMA_ZONES),
  zoneAe: src("FEMA, Zone AE (glossary)", FEMA_ZONE_AE),
  bfe: src("FEMA, Base flood elevation (glossary)", FEMA_BFE),
  coastal: src("FEMA, Features of flood insurance rate maps in coastal areas", FEMA_COASTAL),
  msc: src("FEMA Flood Map Service Center", FEMA_MSC),
  lomc: src("FEMA, Change your flood zone designation (Letters of Map Change)", FEMA_LOMC),
  firm: src("FEMA, Flood Insurance Rate Map (glossary)", FEMA_GLOSS_FIRM),
  loma: src("FEMA, Letter of Map Amendment (glossary)", FEMA_GLOSS_LOMA),
  lomr: src("FEMA, Letter of Map Revision (glossary)", FEMA_GLOSS_LOMR),
  crs: src("FEMA, Community Rating System (glossary)", FEMA_GLOSS_CRS),
  ecForm: src("FEMA, Elevation Certificate and instructions, Form FF-206-FY-22-152, 2022 edition (PDF)", FEMA_EC_FORM),
  ecFaq: src("FEMA, Elevation Certificate FAQ, October 2023 (PDF)", FEMA_EC_FAQ),
  uec: src("FEMA, Understanding elevation certificates (fact sheet)", FEMA_UEC),
  rr2: src("FEMA, NFIP’s pricing approach (Risk Rating 2.0)", FEMA_RR2),
  femaFlood: src("FEMA, Flood insurance", FEMA_FLOOD_INSURANCE),
  wait: src("FEMA, Waiting period for a flood policy", FEMA_WAIT),
  cfr: src("44 CFR 61.11, effective date and time of NFIP coverage (Legal Information Institute)", CFR_61_11),
  fs101: src("FloodSmart for agents, Flood insurance 101", FLOODSMART_101),
  fsZone: src("FloodSmart, What is my flood zone", FLOODSMART_ZONE),
  fsEc: src("FloodSmart for agents, Elevation certificate questions", FLOODSMART_EC),
  rr2Faq: src("FEMA and NFIP, Risk Rating 2.0 frequently asked questions, December 2022 (PDF)", RR2_FAQ),
  cfo: src("Florida Chief Financial Officer, Flood insurance questions", CFO_FLOOD),
  statute: src("Florida Statutes 689.302, Disclosure of flood risks to prospective purchaser", FS_689_302),
  hb1049: src("Florida Senate, CS/CS/HB 1049 (2024), chapter 2024-215, effective October 1, 2024", HB_1049),
  ch2025: src("Laws of Florida, chapter 2025-166 (CS/CS/SB 948), effective October 1, 2025 (PDF)", CH_2025_166),
  fbc: src("Florida Building Code, Flood resistant construction and the 6th edition (2017) (PDF)", FBC_FLOOD),
  fbc8: src("Florida Division of Emergency Management, Flood resistant provisions in the 8th edition Florida Building Code (2023) (PDF)", FBC_8TH),
  manatee: src("Manatee County, Floodplain management", MANATEE_FLOODPLAIN),
  forerunner: src("Manatee County, ForeRunner flood portal", MANATEE_FORERUNNER, "The portal opens as an application; we confirmed it loads and take its description from the county’s floodplain page"),
  cityMaps: src("City of Sarasota, Flood map information", SARASOTA_CITY_MAPS),
  cityEc: src("City of Sarasota, Elevation certificates and forms", SARASOTA_CITY_EC),
  cityFlood: src("City of Sarasota, Flood information", SARASOTA_CITY_FLOOD),
  countyMaps: src("Sarasota County, Flood maps (scgov.net)", undefined, "returned an access error when we checked; we point people to the city’s page, which links the county’s map"),
};

/* ---- Block helpers --------------------------------------------------------- */

const a = (text: string, href: string): Inline => ({ text, href });
const p = (...segs: Inline[]): Block => ({ kind: "paragraph", segs });
const ps = (source: Source, ...segs: Inline[]): Block => ({ kind: "paragraph", segs, source });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });
const sub = (text: string): Block => ({ kind: "subhead", text });

/* ---- The guide ------------------------------------------------------------- */

export const FLOOD_GUIDE: Guide = {
  slug: "flood-zones-and-elevation-certificates-on-the-suncoast",
  title: "Flood zones and elevation certificates on the Suncoast",
  promise: "How to read the one letter on the map that sets the lender’s rule and the building code’s, and what the paperwork behind it does and doesn’t tell you.",
  howToUse: [
    "Every house in Lakewood Ranch, Sarasota and Bradenton sits in a flood zone, and the letter FEMA gives that ground decides whether a lender requires flood insurance and how a new house there has to be built. FEMA no longer uses it to price its own policies, which surprises people. Much of what buyers hear about it is incomplete.",
    "This guide walks the zones in order, shows you how to look up the exact parcel in either county, explains what each document in the flood file can and can’t tell you, reads an elevation certificate line by line, and puts the insurance deadlines on a calendar. The last section is a checklist for the week before you write an offer.",
    "Rules change and maps get redrawn, so every fact here carries the page it came from and the day we opened it. Confirm the particulars of a house with the county, the surveyor and your insurance agent before you rely on them.",
  ],
  questions: [
    "Which zone is this parcel in, on the current map?",
    "How high is the lowest floor against the base flood elevation?",
    "When does the policy start, and who has to carry it?",
  ],
  cover: img("library/bradenton-canal-ranch-twilight", "A canal-front ranch house at twilight in West Bradenton", "50% 55%"),
  author: { name: "Jessica Garza", slug: "jessica-garza" },
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-01",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "the-zones",
      title: "What one letter on the map decides",
      lead: "The zone letter sets whether a lender requires flood insurance and how a new house must be built. It’s the first thing we look up.",
      blocks: [
        ps(
          S.zones,
          "A flood zone is FEMA’s label for how likely a piece of ground is to flood. FEMA, the Federal Emergency Management Agency, draws the maps and runs the National Flood Insurance Program, the federal program most flood policies on this coast are written under. The high-risk zones together make up what FEMA calls the special flood hazard area: the ground that ",
          a("would be inundated by the flood that has a 1 percent chance of being equaled or exceeded in any given year", FEMA_ZONES),
          ". FEMA calls that flood the base flood, and you’ll also hear it called the 100-year flood. The name misleads people. It doesn’t mean once a century; it means a 1-in-100 chance every year, which adds up over a thirty-year mortgage.",
        ),
        def(
          "Special flood hazard area",
          "The ground FEMA expects the base flood to cover. On this coast that’s zones AE and VE. A federally backed mortgage on a house inside it has to carry flood insurance.",
          S.zones,
        ),
        def(
          "Base flood elevation (BFE)",
          "The height the water is expected to reach in the base flood, printed on the map for zones AE and VE as a number of feet above a fixed reference level called a datum.",
          S.bfe,
        ),
        ps(
          S.zones,
          "Outside the hazard area there are two kinds of X. Shaded X is the ground ",
          a("between the limits of the base flood and the 0.2-percent-annual-chance flood", FEMA_ZONES),
          ", the one with a 1-in-500 chance each year. Unshaded X is higher than that. Much of Lakewood Ranch and many inland streets in Sarasota and Bradenton sit in unshaded X on ",
          a("FEMA’s map", FEMA_MSC),
          ". Federal rules don’t require flood insurance in either X, and FEMA’s own line on it is that ",
          a("a low risk of flooding doesn’t mean no risk", FEMA_COASTAL),
          ". We recommend the policy anyway, and we’ll say why in a moment.",
        ),
        ps(
          S.coastal,
          "Zone AE is ",
          a("the base floodplain where base flood elevations are provided", FEMA_ZONE_AE),
          ". In coastal areas FEMA uses it for ground that ",
          a("has at least a 1 percent annual chance of flooding but where wave heights are less than 3 feet", FEMA_COASTAL),
          ". With a federally backed mortgage, ",
          a("flood insurance is mandatory", FLOODSMART_ZONE),
          " here. Much of Siesta Key and the bayfront is AE on the map.",
        ),
        ps(
          S.coastal,
          "Zone VE is the coastal high hazard area: the same flood, with waves on top. FEMA draws it where ",
          a("wave action and fast-moving water can cause extensive damage during the base flood", FEMA_COASTAL),
          ", which in practice means beachfront and open-bay lots. ",
          a("More stringent building practices are required there, such as elevating a home on pilings so that waves can pass beneath it, or a prohibition on building on fill", FEMA_COASTAL),
          ".",
        ),
        ps(
          S.coastal,
          "The current maps also draw a line inside AE called the limit of moderate wave action, or LiMWA. It marks ",
          a("the inland limit of the coastal A zone, the part of the hazard area where wave heights can be between 1.5 and 3 feet during the base flood", FEMA_COASTAL),
          ". FEMA encourages building to V-zone standards there, and the Florida Building Code goes further: ",
          a("coastal A zones, if designated, are treated as zone V", FBC_FLOOD),
          " for the foundation rules. The LiMWA ",
          a("has no significance for NFIP flood insurance premiums", FEMA_COASTAL),
          ". It matters for how a house is built and rebuilt, not for the quote.",
        ),
        {
          kind: "figure",
          eyebrow: "The zones",
          title: "From dry ground to the open Gulf, one step at a time",
          reading: "Read down. Each step is wetter than the one above it, and each column is a different reader of the same letter.",
          figure: {
            type: "ladder",
            columns: { lender: "The lender", insurer: "The insurer", building: "The building code" },
            steps: [
              {
                code: "X",
                name: "Unshaded X",
                means: "Higher than the 0.2-percent-annual-chance (500-year) flood.",
                lender: "No federal requirement to carry flood insurance.",
                insurer: "Low risk, not no risk: over 20 percent of NFIP claims come from low and moderate risk areas.",
                building: "No flood provisions apply.",
                series: 0,
              },
              {
                code: "X",
                name: "Shaded X",
                means: "Between the base flood and the 0.2-percent-annual-chance flood.",
                lender: "No federal requirement to carry flood insurance.",
                insurer: "FEMA doesn’t price by zone; the building’s own data sets the premium.",
                building: "No flood provisions apply.",
                series: 0,
              },
              {
                code: "AE",
                name: "Zone AE",
                means: "The base floodplain, with a base flood elevation printed on the map. Waves under 3 feet.",
                lender: "Flood insurance is mandatory with a federally backed mortgage.",
                insurer: "Priced from the building’s own elevation and distance to water.",
                building: "Lowest floor at or above the BFE plus 1 foot for new construction.",
                series: 1,
              },
              {
                code: "AE",
                name: "Coastal A zone",
                means: "Inside AE, seaward of the LiMWA line. Waves of 1.5 to 3 feet.",
                lender: "Same as AE.",
                insurer: "Same as AE; the line has no significance for premiums.",
                building: "Treated as zone V: lowest structural member at or above the BFE plus 1 foot; pilings, columns, or a stem wall designed for scour.",
                series: 1,
              },
              {
                code: "VE",
                name: "Zone VE",
                means: "The coastal high hazard area. Waves of 3 feet and higher during the base flood.",
                lender: "Flood insurance is mandatory with a federally backed mortgage.",
                insurer: "Priced from the building’s own elevation; the highest-risk ground on the map.",
                building: "Pilings so waves pass beneath; no building on fill.",
                series: 2,
              },
            ],
          },
          note: "Zones A, AH and AO exist on the maps too; they appear inland and are rare on this coast’s parcels. Zone letters are read from the current map, not the one in the listing.",
          source: {
            label: "FEMA, Flood zones (glossary); FEMA, Features of flood insurance rate maps in coastal areas; FloodSmart, What is my flood zone; FEMA, NFIP’s pricing approach; Florida Building Code flood guides (6th and 8th editions), sections R322.2 and R322.3",
            href: FEMA_COASTAL,
          },
          tool: { tool: "atlas", cta: "Which zones a place sits in, on the Atlas" },
        },
        ps(
          S.coastal,
          "Why we recommend the policy in X. FEMA’s coastal mapping page says that ",
          a("over 20 percent of National Flood Insurance Program claims are filed for properties in low or moderate risk areas", FEMA_COASTAL),
          ". A homeowners policy doesn’t cover flood; the state’s own disclosure form says so in its first line, and we’ll get to that form in section six. A house in X on a canal street in West Bradenton is in X because of the contour lines on the map, and the map describes a probability rather than a promise.",
        ),
      ],
      sources: [S.zones, S.zoneAe, S.bfe, S.coastal, S.fsZone, S.fbc, S.fbc8, S.rr2],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "look-up-the-parcel",
      title: "Look up the parcel, not the street",
      lead: "Zones change block to block and sometimes lot to lot. The street name tells you nothing, and the listing’s zone field is whatever someone typed. Three portals give you the answer in a few minutes.",
      blocks: [
        ps(
          S.msc,
          "Start with FEMA. ",
          a("The Flood Map Service Center", FEMA_MSC),
          " takes an address, a place or coordinates and returns a FIRMette, ",
          a("a printable PDF flood map for your home or business", FEMA_MSC),
          ". It’s built from the National Flood Hazard Layer, so it ",
          a("includes any Letters of Map Revision since the last FIRM effective date", FEMA_MSC),
          ". The same page lists the changes to that panel under three headings, revisions, amendments and revalidations, which is where a house that was moved out of the hazard area by letter will show up. That’s the official map, and ",
          a("the one the lender uses", RR2_FAQ),
          " to decide whether the policy is required.",
        ),
        def(
          "FIRM",
          "The Flood Insurance Rate Map: FEMA’s official map of a community showing the special flood hazard areas, the base flood elevations and the insurance rate zones. A FIRMette is a printable piece of it for one address.",
          S.firm,
        ),
        ps(
          S.manatee,
          "Manatee County runs a public flood site called ",
          a("ForeRunner", MANATEE_FORERUNNER),
          ". ",
          a("Search by address or parcel ID to find out whether a property is in a flood zone and the applicable base flood elevation", MANATEE_FLOODPLAIN),
          ". The county’s own map viewer works too: ",
          a("switch on the FEMA Flood layer on the Live Maps tile", MANATEE_FLOODPLAIN),
          " and search by owner, address or parcel number. The county’s floodplain page is the place to start for either.",
        ),
        ps(
          S.cityMaps,
          "Sarasota County and the City of Sarasota are on maps that ",
          a("became effective on March 27, 2024, replacing the previous maps dated November 4, 2016", SARASOTA_CITY_MAPS),
          ". The 2024 set is the one that ",
          a("added the limit of moderate wave action", SARASOTA_CITY_MAPS),
          " described in section one, so a house that was AE on the 2016 map may now sit in a coastal A zone with different building rules and the same insurance rules. The city’s page links the county’s own Flood Zone Information Maps application. The county’s flood maps page returned an access error when we checked, so we point people to the city’s.",
        ),
        {
          kind: "figure",
          eyebrow: "The portals",
          title: "Where to look up one parcel, and what each site gives back",
          reading: "Start at FEMA for the official map, then the county for what it holds on file about the house.",
          figure: {
            type: "map-callout",
            places: [
              {
                name: "FEMA Flood Map Service Center",
                covers: "Both counties · the official map",
                body: "Enter the address. Print the FIRMette, note the panel number and its effective date, and open the changes to that panel: revisions, amendments and revalidations since the map was published.",
                href: FEMA_MSC,
                cta: "msc.fema.gov",
              },
              {
                name: "Manatee County · ForeRunner",
                covers: "Manatee County · the county’s file",
                body: "Search by address or parcel ID for the zone and the base flood elevation the county applies. Elevation certificates for houses built in the hazard area after January 1, 1975 are on file with the county’s Records Management office.",
                href: MANATEE_FORERUNNER,
                cta: "manateecountyfl.withforerunner.com",
              },
              {
                name: "City of Sarasota · Flood map information",
                covers: "Sarasota County and the city · the 2024 maps",
                body: "The page explains the March 27, 2024 maps and links the county’s Flood Zone Information Maps application. The city’s elevation certificates since the late 1970s are downloadable from its map or by request.",
                href: SARASOTA_CITY_MAPS,
                cta: "sarasotafl.gov",
              },
            ],
          },
          note: "The portals agree on the zone because they draw it from the same federal layer. They differ in what else they hold: Manatee County and the City of Sarasota keep certificates, FEMA keeps the letters.",
          source: {
            label: "FEMA Flood Map Service Center; Manatee County, Floodplain management; City of Sarasota, Flood map information; City of Sarasota, Elevation certificates and forms",
            href: SARASOTA_CITY_MAPS,
          },
        },
        {
          kind: "callout",
          tool: "atlas-match",
          eyebrow: "Atlas match",
          body: "Ten questions about the place, none about you. One of them is water: answer it and Atlas narrows the three markets to the places whose facts fit, with the county lookup linked from every page.",
          cta: "Narrow the map",
        },
        p(
          "Two habits save a lot of trouble. Write the panel number and its effective date on the first page of your file, because a quote, a certificate and a disclosure from three different years can all be right and still disagree. And look the parcel up yourself even when the seller has already done it, because the zone in a listing is a text field that someone typed.",
        ),
      ],
      sources: [S.msc, S.firm, S.rr2Faq, S.manatee, S.forerunner, S.cityMaps, S.cityEc, S.countyMaps],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "the-documents",
      title: "What each document tells you",
      lead: "Five documents come up in every flood conversation, and they don’t say the same thing. The map gives the zone, the certificate gives the house, the letters change the map, the disclosure gives the history, and the county holds the file.",
      blocks: [
        ps(
          S.ecForm,
          "The map is the starting point, and section two covers it. The elevation certificate is the surveyor’s record of the house against that map. ",
          a("It can be used to provide elevation information necessary to ensure compliance with community floodplain management ordinances, to inform the proper insurance premium, and to support a request for a Letter of Map Amendment or a Letter of Map Revision based on fill", FEMA_EC_FORM),
          ". That one sentence from FEMA’s own form instructions is the whole job description. Section four reads the form line by line.",
        ),
        ps(
          S.lomc,
          "The letters are how a parcel moves on the map without the map being redrawn. A Letter of Map Amendment, or LOMA, is ",
          a("a letter from FEMA stating that an existing structure or parcel of land that is on naturally high ground and has not been elevated by fill would not be inundated by the base flood", FEMA_LOMC),
          ". A LOMR-F says the same for ground that ",
          a("has been elevated by earthen fill", FEMA_LOMC),
          ". A Letter of Map Revision without the F is FEMA’s ",
          a("modification to an effective Flood Insurance Rate Map", FEMA_GLOSS_LOMR),
          ", usually for a wider area than one lot. All of them show up in the changes section of the FEMA portal.",
        ),
        ps(
          S.ecForm,
          "Here is the sentence that matters when a seller says the house is out of the flood zone. ",
          a("Only a LOMA or LOMR-F from FEMA can amend the FIRM and remove the federal mandate for a lending institution to require the purchase of flood insurance. However, the lending institution has the option of requiring flood insurance even if a LOMA or LOMR-F has been issued", FEMA_EC_FORM),
          ". An elevation certificate on its own, however good its numbers, ",
          a("does not provide a waiver of the flood insurance purchase requirement", FEMA_EC_FORM),
          ". If the seller has a letter, ask for the letter. If the seller has a certificate, you have the start of an application, not the result.",
        ),
        def(
          "Letter of Map Amendment (LOMA)",
          "An official amendment, by letter, to an effective NFIP map. A LOMA establishes a property’s location in relation to the special flood hazard area.",
          S.loma,
        ),
        {
          kind: "figure",
          eyebrow: "The documents",
          title: "What each document can tell you, and what it can’t",
          reading: "Read across a row. A filled mark means the document answers that question outright; a half mark means it helps but doesn’t settle it.",
          figure: {
            type: "matrix",
            columns: ["The zone", "The base flood elevation", "The house’s lowest floor", "Flood openings and foundation", "Flood claims and assistance", "Whether a lender can require the policy"],
            rows: [
              { label: "FIRM and FIRMette", sub: "FEMA’s map for the address", cells: ["yes", "yes", "no", "no", "no", "yes"] },
              { label: "Elevation certificate", sub: "The surveyor’s form for the building", cells: ["yes", "yes", "yes", "yes", "no", "partial"] },
              { label: "LOMA or LOMR-F", sub: "FEMA’s letter for the parcel", cells: ["yes", "partial", "no", "no", "no", "yes"] },
              { label: "Flood disclosure", sub: "The seller’s form under 689.302", cells: ["no", "no", "no", "no", "yes", "no"] },
              { label: "County flood portal", sub: "ForeRunner, the city’s map", cells: ["yes", "yes", "partial", "no", "no", "no"] },
            ],
            legend: { yes: "Answers it outright", partial: "Helps, doesn’t settle it", no: "Doesn’t address it" },
          },
          note: "The certificate’s half mark under the lender column is the point of this section: it supports a request to change the map, and only the letter changes the lender’s rule. The county’s half mark for the lowest floor is the certificate on file, where there is one.",
          source: {
            label: "FEMA, Elevation Certificate and instructions (Form FF-206-FY-22-152); FEMA, Change your flood zone designation; FEMA glossary (FIRM, LOMA, LOMR); Florida Statutes 689.302; Manatee County, Floodplain management",
            href: FEMA_EC_FORM,
          },
        },
        ps(
          S.ecFaq,
          "One more thing the certificate does that people get wrong: it doesn’t go stale. ",
          a("A complete and correct elevation certificate already completed for a building does not expire unless there is a physical change to the building that invalidates information that was previously certified", FEMA_EC_FAQ),
          ", and ",
          a("a map change alone does not necessitate collecting a new one", FEMA_EC_FAQ),
          ". The form itself says it ",
          a("is not invalidated by the transfer of building ownership", FEMA_EC_FORM),
          ". So a 2009 certificate on an unchanged house is still a certificate. What has changed since 2009 is the map, which is why you read the two together.",
        ),
      ],
      sources: [S.ecForm, S.ecFaq, S.lomc, S.firm, S.loma, S.lomr, S.statute, S.manatee],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "reading-the-certificate",
      title: "Reading an elevation certificate",
      lead: "The certificate is a few pages of numbers, and two of them matter most: the base flood elevation in item B9 and the top of the bottom floor in item C2.a. The difference between them is what the insurer and the building department both want to know.",
      blocks: [
        ps(
          S.ecForm,
          "The current form is FEMA Form FF-206-FY-22-152, the 2022 edition, which ",
          a("replaced form 086-0-33", FEMA_EC_FORM),
          ". Section A describes the building: its address, the ",
          a("building diagram number", FEMA_EC_FORM),
          " in item A7, which tells you what kind of foundation it has, and in item A8 ",
          a("the number of permanent flood openings in the crawlspace or enclosure within 1.0 foot above adjacent grade", FEMA_EC_FORM),
          ". Flood openings are the vents that let water in and out of the space under an elevated house so the walls don’t take the pressure. The building code wants ",
          a("one square inch of net open area for each square foot of enclosed area", FBC_FLOOD),
          " unless the openings are engineered.",
        ),
        ps(
          S.ecForm,
          "Section B is the map as the surveyor found it: the panel and its effective date in B4 through B7, ",
          a("the flood zone in B8, the base flood elevation in B9", FEMA_EC_FORM),
          ", where that number came from in B10, and in B11 the datum. A datum is the fixed zero the heights are measured from. The form offers ",
          a("NGVD 1929 and NAVD 1988", FEMA_EC_FORM),
          ", and the two differ by about a foot on this coast, so the form requires that ",
          a("the datum used for building elevations must be the same as that used for the BFE", FEMA_EC_FORM),
          ". If a certificate shows the house in one datum and the map in the other, the comparison is meaningless until someone converts it.",
        ),
        ps(
          S.ecForm,
          "Section C is the house, as surveyed. Item C2.a is ",
          a("the top of the bottom floor, including basement, crawlspace or enclosure floor", FEMA_EC_FORM),
          "; C2.b is the top of the next higher floor; C2.c is ",
          a("the bottom of the lowest horizontal structural member", FEMA_EC_FORM),
          ", the number that matters in VE and coastal A zones where the rule is set at the beam, not the floor; C2.d is the attached garage slab; C2.e is ",
          a("the lowest elevation of machinery and equipment servicing the building", FEMA_EC_FORM),
          ", which is usually the air conditioner’s compressor on its pad; and C2.f and C2.g are ",
          a("the lowest and highest adjacent grade next to the building", FEMA_EC_FORM),
          ", the ground itself. Section D is where ",
          a("a land surveyor, engineer or architect authorized by state law", FEMA_EC_FORM),
          " signs and seals it.",
        ),
        {
          kind: "figure",
          eyebrow: "The example",
          title: "One house against its base flood elevation",
          reading: "Compare the floor in C2.a to the line in B9. Here the floor clears the base flood by 1.2 feet; the compressor pad and the garage slab don’t.",
          figure: {
            type: "worked-example",
            example: "elevation-certificate",
            datum: "NAVD 1988",
            zone: "AE",
            bfe: 9.0,
            lowestFloor: 10.2,
            garageSlab: 8.1,
            machinery: 8.4,
            lowestAdjacentGrade: 7.6,
            highestAdjacentGrade: 8.0,
            floodOpenings: 0,
            items: [
              { code: "B8", label: "Flood zone", value: "AE" },
              { code: "B9", label: "Base flood elevation", value: "9.0 ft" },
              { code: "B11", label: "Datum", value: "NAVD 1988" },
              { code: "A7", label: "Building diagram", value: "1A, slab on grade" },
              { code: "C2.a", label: "Top of bottom floor", value: "10.2 ft", verdict: "above" },
              { code: "C2.d", label: "Attached garage slab", value: "8.1 ft", verdict: "below" },
              { code: "C2.e", label: "Lowest machinery", value: "8.4 ft", verdict: "below" },
              { code: "C2.f", label: "Lowest adjacent grade", value: "7.6 ft" },
              { code: "C2.g", label: "Highest adjacent grade", value: "8.0 ft" },
            ],
          },
          note: "The house, the zone and every number here are illustrative and hypothetical, chosen to show how the items relate. A real certificate for a real address will differ, and only the surveyor’s sealed copy counts.",
          source: {
            label: "Item names and their meaning: FEMA, Elevation Certificate and instructions, Form FF-206-FY-22-152 (2022 edition), sections A, B and C. The numbers are ours and are not from any source",
            href: FEMA_EC_FORM,
          },
        },
        ps(
          S.fbc,
          "What the numbers are judged against. For a new house in zone AE the Florida Building Code requires ",
          a("the lowest floor, including basement, to be at or above the BFE plus 1 foot, or the design flood elevation if that is higher", FBC_FLOOD),
          ". That extra foot is called freeboard. In zone V and the coastal A zone the same rule applies to ",
          a("the bottom of the lowest horizontal structural member of the lowest floor", FBC_FLOOD),
          ", and foundations in zone V ",
          a("are limited to pilings or columns", FBC_FLOOD),
          "; the coastal A zone also allows ",
          a("stem wall foundations designed to account for wave action", FBC_8TH),
          ". The current, 8th edition of the code keeps ",
          a("the base flood elevation plus 1 foot", FBC_8TH),
          " as the minimum. The code’s own guide notes that ",
          a("many Florida communities adopt requirements ranging from 2 to 4 feet above the BFE", FBC_FLOOD),
          ", so the local ordinance can be stricter than the state minimum. In the example above, the floor would pass the state’s one-foot rule and fail a two-foot local one. A house built before the current map isn’t required to meet either, which is exactly why the certificate exists: it tells you what the house actually does.",
        ),
        def(
          "Freeboard",
          "Height added above the base flood elevation when a community sets the level a lowest floor must reach. The Florida Building Code sets it at one foot; local ordinances can set more.",
          S.fbc,
        ),
        sub("What changed about the certificate and the quote"),
        ps(
          S.rr2Faq,
          "Under FEMA’s current pricing method, called Risk Rating 2.0, ",
          a("an elevation certificate is no longer required to purchase coverage", RR2_FAQ),
          ". ",
          a("FEMA uses its own tools and resources to determine the elevation data of a building", RR2_FAQ),
          ", and prices the policy from ",
          a("flood frequency, the kinds of flooding that reach the site, distance to a water source, and property characteristics such as elevation and the cost to rebuild", FEMA_RR2),
          ". Its pricing ",
          a("does not use flood zones to determine flood risk", FEMA_RR2),
          ". The number FEMA starts from is what it calls the first floor height, ",
          a("the height of the building’s first lowest floor above the adjacent grade", FEMA_UEC),
          ", which it estimates from its own data. ",
          a("If property owners provide a certificate with more detailed first-floor-height and elevation information, the rating engine may return a lower annual premium", FEMA_UEC),
          ". So the certificate went from required to optional, and from a rating input to a way of correcting one. A certificate that shows the floor higher than FEMA assumed is still the one document that can bring a quote down.",
        ),
        ps(
          S.fsEc,
          "You can still ",
          a("provide an elevation certificate and submit it to your agent to see if it will lower the insurance cost", FLOODSMART_EC),
          ". The building department is a different matter: in the hazard zones the certificate ",
          a("is still used for floodplain management building requirements", FLOODSMART_EC),
          ", so a renovation or an addition to a house in AE or VE will need one whatever the insurer says.",
        ),
        sub("Where to find one"),
        ps(
          S.uec,
          "FEMA’s advice is the order we use. ",
          a("When buying a property, ask the sellers if they have a copy they can provide", FEMA_UEC),
          ". If they don’t, the county may: Manatee County required one ",
          a("for any structure in the special flood hazard area whose construction started after January 1, 1975", MANATEE_FLOODPLAIN),
          ", and ",
          a("copies are available from its Records Management office", MANATEE_FLOODPLAIN),
          ". The City of Sarasota ",
          a("has elevation certificates that were completed for building compliance since the late 1970s", SARASOTA_CITY_EC),
          ", downloadable from its map or by request. If nobody has one, ",
          a("a licensed land surveyor, professional engineer or certified architect can provide one for a fee", FEMA_UEC),
          ", and we order it during the inspection period so the quote and the building questions are answered before the contingency runs out. ",
          a("Our inspections guide", GUIDE_INSPECTIONS),
          " covers who orders what, and when.",
        ),
        ps(
          S.cityFlood,
          "One last number the certificate feeds. The Community Rating System is ",
          a("a FEMA program that gives communities that go beyond the minimum floodplain requirements an incentive", FEMA_GLOSS_CRS),
          ", and the incentive is a premium discount that, under FEMA’s current pricing, ",
          a("is applied uniformly to all policies throughout the participating community", FEMA_RR2),
          ". ",
          a("The City of Sarasota holds a CRS Class 5, which allows policyholders up to a 25 percent reduction", SARASOTA_CITY_FLOOD),
          ". The certificates on file are part of how a community earns that class, which is one reason the city keeps them.",
        ),
      ],
      sources: [S.ecForm, S.ecFaq, S.fbc, S.fbc8, S.rr2Faq, S.rr2, S.uec, S.fsEc, S.manatee, S.cityEc, S.cityFlood, S.crs],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "the-thirty-day-wait",
      title: "The thirty-day wait and the loan exception",
      lead: "A flood policy bought the week of closing doesn’t start at closing unless a loan is involved. Cash buyers get no exception, so the application goes on the calendar the day the contract is signed.",
      blocks: [
        ps(
          S.wait,
          "A new federal flood policy ",
          a("typically has a 30-day waiting period from the date of purchase before it goes into effect", FEMA_WAIT),
          ". Buy it the day you close and you own a house with no flood coverage for a month, in a place where a summer storm can put water in the street in an afternoon.",
        ),
        ps(
          S.cfo,
          "The exception most buyers use is the loan. The state’s Department of Financial Services, which the Chief Financial Officer runs, puts it plainly: ",
          a("if the initial purchase of flood insurance is in connection with the making, increasing, extending or renewing of a loan, there is no waiting period", CFO_FLOOD),
          ". The policy starts at closing. The federal rule behind it says the coverage ",
          a("shall be effective as of the time of the loan closing, provided the policy is applied for and the premium presented at or prior to the loan closing", CFR_61_11),
          ", so the application and payment have to be in by then. The rule doesn’t limit it to loans whose lender requires the policy.",
        ),
        ps(
          S.cfo,
          "The map exception is narrower. ",
          a("If the initial purchase is made during the 13-month period following the revision or update of a community’s flood map, there is a one-day waiting period", CFO_FLOOD),
          ", and FEMA applies it when ",
          a("a building is newly designated in a Special Flood Hazard Area", FLOODSMART_101),
          " by that revision. Sarasota County’s maps took effect on March 27, 2024, so that window has closed there. A cash buyer outside such a window waits the full thirty days.",
        ),
        {
          kind: "figure",
          eyebrow: "The wait",
          title: "Days until a new NFIP policy starts",
          reading: "Three ways to buy the same policy. Only the loan starts coverage the day you need it.",
          figure: {
            type: "bar",
            unit: "days",
            max: 30,
            rows: [
              { label: "Bought on its own", sub: "A cash purchase, or any purchase not tied to a loan", segments: [{ label: "30 days", value: 30, series: 0 }] },
              { label: "Within 13 months of a map revision", sub: "Only if the revision newly put the building in the hazard area", segments: [{ label: "1 day", value: 1, series: 0 }] },
              { label: "In connection with a loan", sub: "Making, increasing, extending or renewing", segments: [{ label: "No wait", value: 0, series: 1 }] },
            ],
            legend: [
              { label: "Waiting period", series: 0 },
              { label: "Starts at closing", series: 1 },
            ],
          },
          note: "Private flood policies set their own terms, and some carriers stop writing new policies while a tropical storm or hurricane watch is up; our insurance guide covers that pause.",
          source: {
            label: "FEMA, Waiting period for a flood policy; 44 CFR 61.11; FloodSmart for agents, Flood insurance 101; Florida Chief Financial Officer, Flood insurance questions",
            href: CFO_FLOOD,
          },
        },
        ps(
          S.femaFlood,
          "Who has to carry it. ",
          a("Homes in high-risk flood areas with mortgages from government-backed lenders are required to have flood insurance", FEMA_FLOOD_INSURANCE),
          ", and on this coast high-risk means AE and VE. The lender’s closer will ask for proof of the policy before the loan funds, which is why a financed buyer in AE rarely ends up uncovered and a cash buyer in the same zone sometimes does. ",
          a("Our insurance guide", GUIDE_INSURANCE),
          " covers how the homeowners, wind and flood policies fit together.",
        ),
        {
          kind: "figure",
          eyebrow: "The calendar",
          title: "A purchase, with the flood work on it",
          reading: "Days from the signed contract. The top four lanes are the same for everyone; the last two are the cash buyer and the financed buyer taking different routes to the same closing.",
          figure: {
            type: "timeline",
            max: 48,
            unit: "days",
            ticks: [
              { at: 0, label: "0" },
              { at: 10, label: "10" },
              { at: 20, label: "20" },
              { at: 30, label: "30" },
              { at: 40, label: "40" },
            ],
            markers: [
              { at: 0, label: "Contract signed · disclosure in hand" },
              { at: 45, label: "Closing" },
            ],
            lanes: [
              { label: "Inspection period", sub: "Set by the contract", start: 0, end: 15, series: 0, text: "15 days" },
              { label: "Pull the map and the county file", sub: "Section two", start: 0, end: 2, series: 0 },
              { label: "Order the elevation certificate", sub: "If the seller has none", start: 2, end: 10, series: 0, text: "Surveyor" },
              { label: "Flood quotes, with the certificate", sub: "NFIP and private", start: 10, end: 15, series: 0 },
              { label: "Cash: apply, then wait", sub: "No exception applies", start: 15, end: 45, series: 1, hatched: true, text: "30-day wait" },
              { label: "Financed: bound for closing", sub: "The loan exception", start: 40, end: 45, series: 2, text: "No wait" },
            ],
            legend: [
              { label: "Everyone", series: 0 },
              { label: "Cash buyer", series: 1, hatched: true },
              { label: "Financed buyer", series: 2 },
            ],
          },
          note: "The dates are illustrative. A contract sets its own inspection period and closing date, and the fifteen and forty-five days here are round numbers. The rule that doesn’t move is the thirty days.",
          source: {
            label: "The waiting period and its exceptions: FEMA, Waiting period for a flood policy; 44 CFR 61.11; Florida Chief Financial Officer, Flood insurance questions. The disclosure timing: Florida Statutes 689.302. The dates are ours and are not from any source",
            href: FEMA_WAIT,
          },
          tool: { tool: "relocate", cta: "Put your own dates on one page" },
        },
        {
          kind: "callout",
          tool: "relocate",
          eyebrow: "The relocation planner",
          body: "Give it your target move-in date and whether you’re paying cash or financing, and it puts the contract, the inspection window, the flood disclosure and the thirty-day policy wait on one dated plan you can print.",
          cta: "Plan the move",
        },
        ps(
          S.cfo,
          "A note on what the policy is. ",
          a("Most homeowners policies do not include flood coverage", CFO_FLOOD),
          ", which is why flood is bought separately, either through the National Flood Insurance Program or from a private carrier. ",
          a("Our hurricane guide", GUIDE_HURRICANE),
          " covers what the 2024 storms changed about how the two kinds of water damage are handled.",
        ),
      ],
      sources: [S.wait, S.cfr, S.fs101, S.femaFlood, S.cfo, S.statute],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "what-the-seller-tells-you",
      title: "What the seller has to tell you",
      lead: "Since October 1, 2024, a Florida seller hands the buyer a flood disclosure at or before the contract is signed. It’s short, it’s about history rather than risk, and it’s the one document in the file that comes from the seller.",
      blocks: [
        ps(
          S.hb1049,
          "The rule is ",
          a("section 689.302 of the Florida Statutes", FS_689_302),
          ", created by ",
          a("chapter 2024-215, approved May 29, 2024 and effective October 1, 2024", HB_1049),
          ", and amended by ",
          a("chapter 2025-166, effective October 1, 2025", CH_2025_166),
          ", which added the first of the three statements below and widened the third from federal assistance to any assistance. ",
          a("A seller must complete and provide a flood disclosure to a purchaser of residential real property at or before the time the sales contract is executed", FS_689_302),
          ". The statute prints the form itself, so every disclosure in the state says the same things in the same order.",
        ),
        ps(
          S.statute,
          "It opens with a line about insurance: ",
          a("homeowners’ insurance policies do not include coverage for damage resulting from floods, and the buyer is encouraged to discuss the need to purchase separate flood insurance coverage with the buyer’s insurance agent", FS_689_302),
          ". Then come three statements the seller checks one way or the other.",
        ),
        {
          kind: "table",
          title: "The three statements on the form",
          columns: ["Item", "The seller states whether they", "What it tells you"],
          rows: [
            ["1", "have, or have no, knowledge of any flooding that has damaged the property during the seller’s ownership", "Whether water got in and did damage on this owner’s watch. It says nothing about earlier owners."],
            ["2", "have, or have not, filed a claim with an insurance provider relating to flood damage on the property, including a claim with the National Flood Insurance Program", "Whether a flood claim exists. A seller who never carried flood insurance is unlikely to have one, so a “has not” here is a question, not an answer."],
            ["3", "have, or have not, received assistance for flood damage to the property, including assistance from the Federal Emergency Management Agency", "Whether disaster help, from FEMA or anyone else, was paid for flood damage here. Federal aid can follow the parcel into future aid decisions."],
          ],
          source: S.statute,
        },
        ps(
          S.statute,
          "The statute also defines the word, which is wider than people expect. ",
          a("Flooding means a general or temporary condition of partial or complete inundation of the property caused by the overflow of inland or tidal waters, the unusual and rapid accumulation of runoff or surface waters from any established water source such as a river, stream or drainage ditch, or sustained periods of standing water resulting from rainfall", FS_689_302),
          ". A yard that held water for a week after a summer storm counts. The bay coming up the canal counts. So does the retention pond behind the house if it came over the bank.",
        ),
        p(
          "Read the disclosure next to the elevation certificate and the claims history. A house that flooded once and was repaired properly can be a fine house, and the disclosure is where you learn it was repaired at all. A clean disclosure from a seller who bought the house in 2025 and never carried flood insurance covers a year or two of one owner’s experience. Ask the neighbors, ask the county, and look at the certificate for what the ground and the floor say on their own.",
        ),
        { kind: "pull-quote", text: "We look up the zone first, then the certificate, and only then ask for the quote." },
      ],
      sources: [S.statute, S.hb1049, S.ch2025],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "before-you-write-an-offer",
      title: "Before you write an offer",
      lead: "Everything above fits on one page, and the page is worth filling in before the offer rather than during the inspection period, when every day costs something.",
      blocks: [
        p(
          "The order matters: we look up the zone first, then the certificate, and only then ask for the quote. The zone takes five minutes and can end the conversation. The certificate takes a phone call to the seller or the county, or a week and a surveyor’s fee. The quote takes the certificate. The disclosure is due at or before the contract, so it is the one thing you can ask for before you write anything. If the four don’t agree, that’s the conversation to have first, and it’s a better conversation to have before you’re under contract.",
        ),
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Nine things to have in hand before the offer",
          reading: "Tick them in order. The first three are free and quick; the rest follow from them.",
          figure: {
            type: "checklist",
            items: [
              { text: "The zone for the exact parcel, from the FEMA portal", detail: "Note the panel number and its effective date. In Sarasota County that date is March 27, 2024." },
              { text: "Any letter of map change on the panel", detail: "Open the changes section on the FEMA portal. A LOMA or LOMR-F for this parcel changes the lender’s rule; nothing else does." },
              { text: "The county’s record for the address", detail: "ForeRunner in Manatee County; the city’s page and the county map it links in Sarasota. Manatee County and the City of Sarasota keep certificates on file for houses built in the hazard area." },
              { text: "The seller’s elevation certificate, or a date for the surveyor", detail: "Ask the seller first. If there isn’t one, order it in the first days of the inspection period." },
              { text: "B9 against C2.a, in the same datum", detail: "The base flood elevation against the top of the bottom floor. Then C2.e for the machinery and C2.d for the garage." },
              { text: "The flood disclosure, signed", detail: "Due at or before the contract is executed. Three statements and a definition of flooding. Read it with the certificate." },
              { text: "A flood quote with the certificate attached", detail: "FEMA prices from its own data; the certificate can only improve the estimate. Ask the agent whether it did." },
              { text: "The policy’s start date against the closing date", detail: "Thirty days when it’s bought on its own. There’s no wait when it’s bought with a loan, and one day if a map revision newly put the building in the hazard area within the last thirteen months." },
              { text: "The local freeboard rule, if you plan to build or add", detail: "The state minimum is the BFE plus one foot. The county or city ordinance can require more." },
            ],
          },
          source: {
            label: "Each item is drawn from the section it refers to; the sources are listed there and at the foot of this guide",
            href: FEMA_MSC,
          },
          tool: { tool: "contact", cta: "Send us the address for the first three" },
        },
        {
          kind: "callout",
          tool: "contact",
          eyebrow: "What we do with an address",
          body: "Send us the address before you write an offer and we’ll pull the zone, the changes to the panel, the county’s file and the disclosure, and tell you plainly whether the four agree. If they don’t, we’ll tell you what the surveyor needs to settle.",
          cta: "Send us an address",
        },
      ],
      sources: [S.msc, S.statute, S.cfo, S.cfr, S.fbc, S.fbc8],
    },
  ],

  onOnePage: {
    title: "The flood file, on one page",
    reading: "Fill in the right-hand column for the house you’re looking at. Everything on this page comes from the sections above.",
    rows: [
      { label: "Zone, on the current map", value: "X · shaded X · AE · coastal A · VE" },
      { label: "Panel number and effective date", value: "From the FIRMette" },
      { label: "Letters of map change on the panel", value: "LOMA · LOMR-F · none" },
      { label: "Base flood elevation (B9) and datum (B11)", value: "ft · NGVD 1929 or NAVD 1988" },
      { label: "Top of bottom floor (C2.a)", value: "ft · above or below the BFE by" },
      { label: "Lowest machinery (C2.e) and garage slab (C2.d)", value: "ft · ft" },
      { label: "Flood openings (A8), if there is an enclosure", value: "count · square inches" },
      { label: "Seller’s disclosure: flooding, claim, assistance", value: "yes or no, three times" },
      { label: "Who requires the policy", value: "The lender · nobody · recommended either way" },
      { label: "Policy start date against closing", value: "30 days · 1 day · no wait" },
      { label: "Local freeboard rule, if building", value: "BFE plus 1 ft, or the ordinance’s number" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us the address.",
    body: "We’ll pull the zone, the panel’s changes, the county’s file and the disclosure before you write an offer, and say plainly whether they agree. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a house",
    tool: "contact",
  },
};
