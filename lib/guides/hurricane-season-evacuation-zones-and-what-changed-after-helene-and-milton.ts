import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Hurricane season, evacuation zones and the 2024 storms, explained.
 *
 * Plain on purpose: short sentences, everyday words, one idea at a time,
 * and every official term explained the first time it appears. The facts
 * were checked against the cited pages on October 2, 2026. The water
 * heights and the damage figures come from the National Hurricane
 * Center's reports on Helene and Milton. The two houses in figure 05 and
 * their heights are made up and say so.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const NHC_CLIMO = "https://www.nhc.noaa.gov/climo/";
const NHC_HELENE = "https://www.nhc.noaa.gov/data/tcr/AL092024_Helene.pdf";
const NHC_MILTON = "https://www.nhc.noaa.gov/data/tcr/AL142024_Milton.pdf";
const CITIZENS_BINDING_RULE = "https://securesupport.citizensfla.com/app/answers/detail/a_id/1455/~/what-is-citizens-hurricane-or-tropical-storm-binding-suspension-rule%3F";
const CITIZENS_BINDING_NOTICE = "https://www.citizensfla.com/-/20260719-citizens-is-under-binding-suspension";
const FDEM_ZONE = "https://www.floridadisaster.org/knowyourzone/";
const MANATEE_EVAC = "https://www.mymanatee.org/services-and-amenities/service-listing/service-details/know-your-evacuation-level";
const SARASOTA_311 = "https://sarasotacountyfl.qscend.com/311/knowledgebase/article/966";
const SARASOTA_LAYER = "https://services3.arcgis.com/icrWMv7eBkctFu1f/arcgis/rest/services/StormEvacuationZoneWM/FeatureServer/0";
const SARASOTA_GUIDE = "https://www.sarasotafl.gov/I-Want-to/View-County-Hurricane-Preparedness-Guide";
const FEMA_ZONES = "https://www.fema.gov/glossary/flood-zones";
const FEMA_MSC = "https://msc.fema.gov/portal/search";
const FEMA_FLOOD_INSURANCE = "https://www.fema.gov/flood-insurance";
const FEMA_DR_4828 = "https://www.fema.gov/disaster/4828";
const FEMA_DR_4834 = "https://www.fema.gov/disaster/4834";
const FEMA_FACT_076 = "https://www.fema.gov/fact-sheet/florida-helene-and-milton-recovery-fact-sheet-076";
const FEMA_SUBSTANTIAL = "https://www.fema.gov/about/glossary/substantial-damage";
const FEMA_FREEBOARD = "https://www.fema.gov/glossary/freeboard";
const MANATEE_FLOODPLAIN = "https://www.mymanatee.org/departments/building___development_services/floodplain_management";
const FBC_8TH = "https://www.floridadisaster.org/globalassets/8th-ed_fbc_floodprovisions_dec20232.pdf";
const FBC_6TH = "https://www.floridabuilding.org/fbc/thecode/2017-6edition/basf_2017_flood_061217.pdf";
const FS_689_302 = "https://www.flsenate.gov/Laws/Statutes/2026/689.302";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  climo: src("National Hurricane Center, Tropical cyclone climatology", NHC_CLIMO),
  helene: src("National Hurricane Center, Tropical cyclone report, Hurricane Helene (AL092024) (PDF)", NHC_HELENE),
  milton: src("National Hurricane Center, Tropical cyclone report, Hurricane Milton (AL142024) (PDF)", NHC_MILTON),
  bindingRule: src("Citizens Property Insurance Corporation, What is Citizens’ hurricane or tropical storm binding suspension rule?", CITIZENS_BINDING_RULE),
  bindingNotice: src("Citizens Property Insurance Corporation, binding suspension notice of July 19, 2026", CITIZENS_BINDING_NOTICE),
  fdem: src("Florida Division of Emergency Management, Know Your Zone", FDEM_ZONE),
  manateeEvac: src("Manatee County, Know your evacuation level", MANATEE_EVAC),
  sarasota311: src("Sarasota County 311, Know your evacuation level", SARASOTA_311),
  sarasotaLayer: src("Sarasota County, Storm evacuation zone map layer (ArcGIS feature service), zones A to E", SARASOTA_LAYER),
  sarasotaGuide: src("Sarasota County, Emergency preparedness guide (PDF, on the City of Sarasota’s site)", SARASOTA_GUIDE),
  sarasotaLookup: src("Sarasota County, Know Your Zone lookup map (ags2.scgov.net)", undefined, "returned a server error when we checked, so the guide points to the county’s 311 page, which links it"),
  zones: src("FEMA, Flood zones (glossary)", FEMA_ZONES),
  msc: src("FEMA Flood Map Service Center", FEMA_MSC),
  femaFlood: src("FEMA, Flood insurance", FEMA_FLOOD_INSURANCE),
  dr4828: src("FEMA, Florida Hurricane Helene, DR-4828-FL, declared September 28, 2024", FEMA_DR_4828),
  dr4834: src("FEMA, Florida Hurricane Milton, DR-4834-FL, declared October 11, 2024", FEMA_DR_4834),
  fact076: src("FEMA, Florida Helene and Milton recovery fact sheet 076, February 9, 2026", FEMA_FACT_076),
  substantial: src("FEMA, Substantial damage (glossary)", FEMA_SUBSTANTIAL),
  freeboard: src("FEMA, Freeboard (glossary)", FEMA_FREEBOARD),
  manateeFloodplain: src("Manatee County, Floodplain management", MANATEE_FLOODPLAIN),
  fbc8: src("Florida Division of Emergency Management, Flood resistant provisions in the 8th edition Florida Building Code (2023), sections R322.2.1 and R322.3.2 (PDF)", FBC_8TH),
  fbc6: src("Florida Building Code, Flood resistant construction guide, 6th edition (2017) (PDF)", FBC_6TH),
  statute: src("Florida Statutes 689.302 (2026), Disclosure of flood risks to prospective purchaser", FS_689_302),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });

/* ---- The guide ------------------------------------------------------------- */

export const HURRICANE_GUIDE: Guide = {
  slug: "hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton",
  title: "Hurricane season, evacuation zones and the 2024 storms, explained",
  promise: "What an evacuation zone is, what Helene and Milton did to this coast, and what to ask about a house that was rebuilt since.",
  howToUse: [
    "Read this guide once from start to finish. Then use the checklist at the end when you look at a house near the water.",
    "Storm records and county rules change. Each part of this guide says where its facts come from. Before you count on them for one house, check with the county and your insurance agent.",
  ],
  questions: ["What evacuation zone is the house in?", "What did the two storms do on this street?", "Was the house repaired, or rebuilt to today’s rules?"],
  cover: img("library/place-storm-gulf", "Storm clouds over the water", "50% 50%"),
  author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
  publishedAt: "2026-10-01",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "the-season",
      title: "When hurricane season is",
      lead: "The Atlantic hurricane season runs from June 1 to November 30. The busiest part is late summer and early fall.",
      blocks: [
        p(
          "Picture the calendar. Storms can form in June. They get more common in August.",
          "The peak of the season is September 10. Most storms come between the middle of August and the middle of October.",
        ),
        p(
          "For a home purchase, the season matters in one practical way.",
          "The trigger is a tropical storm or hurricane watch or warning. It can be for any part of Florida.",
          "When the National Weather Service issues one, Citizens stops binding new policies. Private insurers have rules of their own.",
        ),
        def("Bind", "When an insurer agrees in writing to cover you from a set date. Until a policy is bound, you’re not covered.", S.bindingRule),
        p(
          "A closing that needs a new policy can wait days for the all-clear.",
          "So from June on, build that into the contract dates, and bind the policies early.",
        ),
        {
          kind: "figure",
          eyebrow: "The year",
          title: "Hurricane season on one calendar",
          reading: "The shaded part is the season. The hatched part is the busiest stretch. The numbered lines are three dates.",
          figure: {
            type: "year",
            spans: [
              { from: 5, to: 11, label: "Hurricane season, June 1 to November 30", series: 2 },
              { from: 7.5, to: 9.5, label: "The busiest stretch, mid-August to mid-October", series: 1, hatched: true },
            ],
            marks: [
              { at: 5, label: "June 1", detail: "The season opens." },
              { at: 8.3, label: "September 10", detail: "The peak of the season." },
              { at: 11, label: "November 30", detail: "The season closes." },
            ],
          },
          source: { label: "National Hurricane Center, Tropical cyclone climatology", href: NHC_CLIMO },
        },
      ],
      sources: [S.climo, S.bindingRule, S.bindingNotice],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "evacuation-zone-vs-flood-zone",
      title: "An evacuation zone is not a flood zone",
      lead: "The two maps answer different questions. A house can be outside FEMA’s flood zone and still inside an evacuation zone.",
      blocks: [
        p(
          "The county draws the evacuation zones.",
          "Its emergency managers model how high salt water could push inland in a hurricane, by address.",
          "The zones are lettered. Zone A is the most exposed and is called first. The letters run to E in both counties.",
        ),
        p(
          "A flood zone is FEMA’s map for flood insurance. It covers flooding from any source.",
          "It’s the map your lender and your builder follow.",
        ),
        p(
          "Manatee County says it plainly. Evacuation levels are not the same as flood zones, and they don’t match a storm’s category.",
          "The zones are about the water, not the wind.",
        ),
        p("The state’s Know Your Zone page shows the letters A to F. Manatee and Sarasota use A to E. Zone A is called first in both."),
        {
          kind: "figure",
          eyebrow: "Two maps",
          title: "The two maps answer different questions",
          reading: "Read each side. Look up both for any house near the water.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "The evacuation zone decides",
                title: "Whether officials call your street to leave",
                items: ["Drawn by the county from storm surge, by address", "Lettered A to E. Zone A is called first", "Not tied to a storm’s category"],
              },
              {
                eyebrow: "The flood zone decides",
                title: "Flood insurance and building rules",
                items: ["Drawn by FEMA for flooding from any source", "VE or AE: a mortgage from a government-backed lender requires flood insurance", "New homes must be built above the big flood"],
              },
            ],
          },
          source: { label: "Manatee County, Know your evacuation level; Florida Division of Emergency Management, Know Your Zone; FEMA, Flood zones; FEMA, Flood insurance", href: MANATEE_EVAC },
        },
      ],
      sources: [S.manateeEvac, S.fdem, S.sarasotaLayer, S.zones, S.femaFlood],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "find-both-for-a-house",
      title: "How to find both for a house",
      lead: "Look up the exact address twice. Once for the evacuation zone, once for the flood zone.",
      blocks: [
        p(
          "Start with the county. In Manatee County, the Learn Your Level map takes an address and shows the evacuation level.",
          "In Sarasota County, the Know Your Evacuation Level page links to the county’s lookup.",
        ),
        p("Then look up the flood zone on FEMA’s map site. Type in the address. Write both down, with the date."),
        p(
          "Don’t go by the listing. A listing may show a zone that was typed in by hand, from an old map.",
          "The state’s Know Your Zone page explains the letters for all of Florida.",
        ),
        {
          kind: "figure",
          eyebrow: "Where to look",
          title: "Three places to look up a house",
          reading: "The first two give the evacuation zone. The third gives the flood zone.",
          figure: {
            type: "map-callout",
            places: [
              {
                name: "Manatee County, Learn Your Level",
                covers: "Manatee County",
                body: "Type in the address to see the evacuation level.",
                href: MANATEE_EVAC,
                cta: "mymanatee.org",
              },
              {
                name: "Sarasota County, Know Your Evacuation Level",
                covers: "Sarasota County",
                body: "Open the county’s lookup from this page and type in the address.",
                href: SARASOTA_311,
                cta: "sarasotacountyfl.qscend.com",
              },
              {
                name: "FEMA Flood Map Service Center",
                covers: "Every address",
                body: "Type in the address to see the flood zone and print a small map of that spot.",
                href: FEMA_MSC,
                cta: "msc.fema.gov",
              },
            ],
          },
          note: "In Sarasota County, the 311 page links to the county’s lookup map.",
          source: { label: "Manatee County, Know your evacuation level; Sarasota County 311, Know your evacuation level; FEMA Flood Map Service Center", href: MANATEE_EVAC },
        },
      ],
      sources: [S.manateeEvac, S.sarasota311, S.sarasotaLookup, S.sarasotaGuide, S.msc, S.fdem],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "what-the-two-storms-did",
      title: "What Helene and Milton did",
      lead: "Two storms hit this coast two weeks apart in the fall of 2024. One brought water. The other brought wind, and water too.",
      blocks: [
        p(
          "Helene never came ashore here. It made landfall far to the north, in the Big Bend, on the night of September 26, 2024.",
          "But it was huge. Its wind pushed the Gulf onto the land all down this coast.",
        ),
        p(
          "From the Anclote River south to Longboat Key, the water rose 5 to 7 feet above the ground.",
          "A sensor on Longboat Key measured a storm tide of 6.68 feet above the normal high tide.",
          "From Venice to south of Englewood it rose 4 to 6 feet.",
        ),
        p(
          "On Anna Maria Island the damage was severe. On Bradenton Beach, the surge destroyed most of the buildings.",
          "Officials put it at 90 to 95 percent. Along the Sarasota County coast, the surge damaged many homes.",
        ),
        p(
          "Milton came two weeks later. It reached Category 5 over the Gulf.",
          "It came ashore on Siesta Key on the night of October 9, 2024. By then it was a Category 3 hurricane.",
        ),
        p(
          "Near the landfall, from Longboat Key to Venice, the water rose 4 to 6 feet. South of Venice it rose 6 to 9 feet.",
          "The sand and debris Helene left behind made the damage worse. Milton also set off 45 tornadoes across the state.",
        ),
        p("Each storm became a federal disaster for Florida within days. For Helene that came on September 28, and for Milton on October 11."),
        p(
          "FEMA’s numbers show it. Most of the flood insurance claims paid in Florida for the two storms came from Helene.",
          "There were 49,284 claims for Helene and 16,585 for Milton.",
        ),
        {
          kind: "figure",
          eyebrow: "The water",
          title: "How high the water rose on this coast",
          reading: "Each bar is one stretch of coast in one storm. The longer the bar, the higher the water.",
          figure: {
            type: "bar",
            unit: "feet above the ground",
            max: 9,
            rows: [
              { label: "Helene, Anclote River to Longboat Key", sub: "September 26, 2024", segments: [{ label: "5 to 7 ft", value: 7, series: 2 }] },
              { label: "Helene, Venice to south of Englewood", sub: "September 26, 2024", segments: [{ label: "4 to 6 ft", value: 6, series: 2 }] },
              { label: "Milton, Longboat Key to Venice", sub: "October 9, 2024", segments: [{ label: "4 to 6 ft", value: 6, series: 0 }] },
              { label: "Milton, Venice to Boca Grande", sub: "October 9, 2024", segments: [{ label: "6 to 9 ft", value: 9, series: 0 }] },
            ],
            legend: [
              { label: "Helene", series: 2 },
              { label: "Milton", series: 0 },
            ],
          },
          note: "Each bar is drawn to the top of the range the Hurricane Center reports. On any one street the water was somewhere in that range, and waves rode on top.",
          source: { label: "National Hurricane Center, Tropical cyclone reports on Hurricane Helene and Hurricane Milton", href: NHC_HELENE },
        },
      ],
      sources: [S.helene, S.milton, S.dr4828, S.dr4834, S.fact076],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "the-rule-after-a-storm",
      title: "The rule that bites after a storm",
      lead: "If repairs would cost half the house’s value or more, the house has to meet today’s flood rules. That can mean raising it.",
      blocks: [
        def(
          "Substantial damage",
          "FEMA’s name for damage that costs half the building’s value or more to fix. The value is what the building was worth before the damage. Manatee County uses the same words.",
          S.substantial,
        ),
        p(
          "Cross that line in a flood zone, and a plain repair isn’t allowed. The building must be brought up to today’s rules for new construction.",
          "The county says that can be as small as raising the air conditioner, or as big as raising the whole house.",
        ),
        p(
          "Today’s rule for a new home in a flood zone is simple. The lowest floor must sit at least 1 foot above the big flood’s height.",
          "That extra foot is called freeboard. Some places ask for more. FEMA says that extra foot can also mean lower flood insurance rates.",
        ),
        p(
          "That’s why, after 2024, some badly damaged houses on low lots were rebuilt higher instead of repaired.",
          "The county puts its finding in a letter, called a substantial damage determination.",
          "That letter matters as much as the contractor’s bill.",
        ),
        {
          kind: "figure",
          eyebrow: "Two houses",
          title: "Same street after the storm: repaired, or rebuilt higher",
          reading: "The dashed line is how high the big flood would reach. Look at where each floor sits now.",
          figure: {
            type: "two-houses",
            floodLine: 9,
            floodLabel: "Big flood height",
            floorLabel: "Lowest floor",
            houses: [
              { name: "House A, repaired", floor: 8, verdict: "below", says: "The repairs cost less than half its value, so it was fixed as it was. Its floor is still 1 foot below the big flood." },
              { name: "House B, rebuilt", floor: 10, verdict: "above", says: "The repairs would have cost half its value or more, so it had to meet today’s rules. Its floor is now 1 foot above the big flood." },
            ],
          },
          note: "These two houses and their heights are made up to show the rule. A real house has its own numbers, on its own elevation certificate and in the county’s letter.",
          source: { label: "The rule: FEMA, Substantial damage; Florida Building Code flood provisions, 8th edition, R322.2.1. The houses are illustrative and are not from any source", href: FEMA_SUBSTANTIAL },
        },
      ],
      sources: [S.substantial, S.manateeFloodplain, S.freeboard, S.fbc8, S.fbc6],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "a-house-that-was-rebuilt",
      title: "What to ask about a house that was rebuilt",
      lead: "A fresh house on an old street raises good questions. The paperwork answers them.",
      blocks: [
        p(
          "Ask for the permit history from the county or city building department.",
          "It shows what work was done and whether any of it was permitted as repair of substantial damage.",
        ),
        p(
          "Ask whether the county issued a substantial damage determination, and what it required.",
          "If the floor was raised, ask for a new elevation certificate. That’s the surveyor’s form that shows how high the house sits.",
        ),
        p(
          "Ask for the flood policy’s claim history. And read the seller’s flood form. Florida law makes the seller answer three questions.",
          "Do they know of flood damage while they owned the home? Did they file an insurance claim for flood damage? Did they get help for flood damage?",
        ),
        p(
          "A no on that form covers only this seller’s time. A house sold in 2025 may have an owner who never saw the water.",
          "Read the form next to the permit history. Keep the letter and the certificate with your closing papers. The next buyer will ask for them too.",
        ),
        {
          kind: "figure",
          eyebrow: "The questions",
          title: "Four questions for a house that was rebuilt",
          reading: "Ask each one. A yes isn’t bad news by itself. It tells you which papers to read next.",
          figure: {
            type: "questions",
            answers: ["Yes", "No"],
            items: [
              { question: "Was any of the work permitted as repair of substantial damage?", note: "The county or city building department has the permit history." },
              { question: "Did the county issue a substantial damage determination?", note: "That’s the county’s letter. If so, ask what it required." },
              { question: "Was the lowest floor raised?", note: "If so, ask for a new elevation certificate." },
              { question: "Does the seller’s flood form show a claim or help for flood damage?", note: "The seller answers three questions. A no covers only their time in the home." },
            ],
          },
          source: { label: "Florida Statutes 689.302 (2026); Manatee County, Floodplain management", href: FS_689_302 },
        },
      ],
      sources: [S.statute, S.manateeFloodplain, S.substantial],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "before-you-make-an-offer",
      title: "Before you make an offer",
      lead: "Use this list each time you look at a house. The first steps take minutes.",
      blocks: [
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Seven things to check before you make an offer",
          reading: "Go in order. Each step helps with the next one.",
          figure: {
            type: "checklist",
            items: [
              { text: "Look up the evacuation zone", detail: "Use the county’s lookup for the exact address." },
              { text: "Look up the flood zone", detail: "Use FEMA’s map site. It’s a different map." },
              { text: "Ask what the street did in 2024", detail: "Ask the seller, the neighbors and us. Water marks and permits tell the story." },
              { text: "Get the permit history", detail: "From the county or city. Look for repair of substantial damage." },
              { text: "Ask for the substantial damage determination and the elevation certificate", detail: "The determination is the county’s letter. If the floor was raised, there should be a new certificate." },
              { text: "Read the seller’s flood form", detail: "Three answers, yes or no. Read it next to the permit history." },
              { text: "In season, bind the insurance early", detail: "A watch or warning stops new policies. Build it into the contract dates." },
            ],
          },
          source: { label: "Each step comes from the section it sums up. The sources are listed there and at the end of this guide", href: FEMA_MSC },
          tool: { tool: "contact", cta: "Send us an address" },
        },
      ],
      sources: [S.manateeEvac, S.msc, S.substantial, S.statute, S.bindingRule],
    },
  ],

  onOnePage: {
    title: "Your storm notes for one house",
    reading: "Fill in the right side for the house you’re looking at.",
    rows: [
      { label: "Address", value: "Write it here" },
      { label: "Evacuation zone", value: "A to E, from the county" },
      { label: "Flood zone", value: "VE, AE or X, from FEMA" },
      { label: "What the street did in 2024", value: "Water height, if anyone knows it" },
      { label: "Permit history", value: "Checked, with any substantial damage repair" },
      { label: "Substantial damage determination", value: "Yes or no, and what it required" },
      { label: "Elevation certificate", value: "Date, and the lowest floor" },
      { label: "Seller’s flood form", value: "Three answers, yes or no" },
      { label: "Insurance bound by", value: "A date before closing, and before any watch" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us an address.",
    body: "We’ll look up both zones and the county’s records for that house and go through them with you. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a house",
    tool: "contact",
  },
};
