import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Home inspections on the Suncoast: what a good one covers.
 *
 * Plain on purpose: short sentences, everyday words, one idea at a time,
 * and every official form explained the first time it appears. The facts
 * are the ones the October 2, 2026 fact check verified against the cited
 * pages: the statutes for 2026, the state's own forms, and the City of
 * Holmes Beach's seawall manual. Plain-language versions of a form's
 * questions say so in the figure's note.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const FS_468_8311 = "https://www.flsenate.gov/Laws/Statutes/2026/468.8311";
const DBPR_FAQ = "https://www2.myfloridalicense.com/home-inspectors/faqs/";
const CITIZENS_4PT_FAQ = "https://securesupport.citizensfla.com/app/answers/list/kw/HO6%204%20Point/suggested/1/page/1";
const CITIZENS_4PT_FORM = "https://www.citizensfla.com/documents/20702/31330/4-Point+Inspection+Form/3d7e0270-2c1d-4a14-b2e6-3a796c675a7f?version=1.1";
const FS_627_0629 = "https://www.flsenate.gov/Laws/Statutes/2026/627.0629";
const OIR_1802 = "https://floir.gov/docs-sf/property-casualty-libraries/product-review/all-forms/form-oir-1802-adopted-version-(no-watermark).pdf?Status=Master";
const CFO_MITIGATION = "https://www.myfloridacfo.com/division/consumers/storm/mitigation-notices-inspections-and-forms";
const CITIZENS_1802_NOTICE = "https://www.citizensfla.com/-/20260319-uniform-mitigation-verification-inspection-form-changes";
const FS_627_7011 = "https://www.flsenate.gov/Laws/Statutes/2026/627.7011";
const FS_482_226 = "https://www.flsenate.gov/Laws/Statutes/2026/482.226";
const FDACS_13645 = "https://forms.fdacs.gov/13645.pdf";
const HB_SEAWALL = "https://cms9files1.revize.com/holmesbeachfl/seawall_manual_.pdf";
const FEMA_UEC = "https://www.fema.gov/fact-sheet/understanding-elevation-certificates";
const FS_689_302 = "https://www.flsenate.gov/Laws/Statutes/2026/689.302";
const FRBAR_ASIS = "https://www.floridarealtors.org/sites/default/files/2026-02/AS%20IS%20Residential%20Contract%20for%20Sale%20and%20Purchase%20(FloridaRealtors-FloridaBar-ASIS-7x)_Redlined[1].pdf";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  statuteDef: src("Florida Statutes 468.8311, home inspector definitions (2026)", FS_468_8311),
  dbpr: src("Florida Department of Business and Professional Regulation, Home inspectors FAQ", DBPR_FAQ),
  citizensFaq: src("Citizens Property Insurance, Four-point inspection questions", CITIZENS_4PT_FAQ),
  citizensForm: src("Citizens Property Insurance, 4-Point Inspection Form (PDF)", CITIZENS_4PT_FORM),
  windStatute: src("Florida Statutes 627.0629, residential property insurance rate filings and windstorm mitigation discounts (2026)", FS_627_0629),
  oir1802: src("Florida Office of Insurance Regulation, Uniform Mitigation Verification Inspection Form OIR-B1-1802 (Rev. 04/26) (PDF)", OIR_1802),
  cfo: src("Florida Chief Financial Officer, Mitigation notices, inspections and forms", CFO_MITIGATION),
  citizensNotice: src("Citizens Property Insurance, Uniform Mitigation Verification Inspection Form changes, March 19, 2026", CITIZENS_1802_NOTICE),
  roofStatute: src("Florida Statutes 627.7011(5), roof age (2026)", FS_627_7011),
  wdoStatute: src("Florida Statutes 482.226, wood-destroying organism inspection reports (2026)", FS_482_226),
  wdoForm: src("Florida Department of Agriculture and Consumer Services, Wood-Destroying Organisms Inspection Report, form 13645 (PDF)", FDACS_13645),
  seawall: src("City of Holmes Beach, Seawall manual (PDF)", HB_SEAWALL),
  uec: src("FEMA, Understanding elevation certificates (fact sheet)", FEMA_UEC),
  floodStatute: src("Florida Statutes 689.302, disclosure of flood risks to prospective purchaser (2026)", FS_689_302),
  contract: src("Florida Realtors and The Florida Bar, AS IS residential contract for sale and purchase, revision 12/26 redline (PDF)", FRBAR_ASIS, "A redlined copy of the current form. The contract you sign controls"),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });

/* ---- The guide ------------------------------------------------------------- */

export const INSPECTIONS_GUIDE: Guide = {
  slug: "inspections-on-the-suncoast-what-a-good-one-covers",
  title: "Home inspections on the Suncoast: what a good one covers",
  promise: "The reports to order, what each one looks at, and why a house near salt water needs a few more than one inland.",
  howToUse: [
    "Read this guide once from start to finish. Then use the checklist at the end the day your contract is signed.",
    "Forms and rules change. Each part of this guide tells you where its facts come from. Before you count on them for one house, check with your inspector and your insurance agent.",
  ],
  questions: ["How old are the roof and the four systems?", "What did the inspector see, and what couldn’t they see?", "What does the insurance company need?"],
  cover: img("library/listing-exterior-canal-golden", "A canal-front home in the late light"),
  author: { name: "Jessica Garza", slug: "jessica-garza" },
  publishedAt: "2026-08-14",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "what-a-home-inspection-is",
      title: "What a home inspection is",
      lead: "A home inspection is a careful look at the house by a licensed inspector. It tells you what’s there and what’s wrong, in writing.",
      blocks: [
        p(
          "Picture walking through a house with someone trained to find its problems. They open the electrical panel. They run the water. They climb into the attic and walk the roof.",
          "Then they write down what they found.",
        ),
        p(
          "In Florida, that person must hold a state license. The state has licensed home inspectors since 2010, and you can check a license online.",
        ),
        def(
          "Home inspection",
          "Florida law calls it a limited visual look at the parts of a house you can reach. Those parts are the structure, the electrical system, heating and cooling, the roof covering and the plumbing. They also include the inside, the outside, and the conditions of the site that affect the house. The inspector gives you a written opinion of the house’s condition.",
          S.statuteDef,
        ),
        p(
          "Two words in that definition matter. Limited means the inspector doesn’t open walls or move furniture. Visual means they report what they could see.",
          "So read the report for what it says, and for what it says couldn’t be checked.",
        ),
        p("On this coast, the inspection is the start of the list, not the whole list. The insurance company wants its own reports, and the water adds a few more. The rest of this guide goes through them."),
        {
          kind: "figure",
          eyebrow: "The house",
          title: "The parts of a house an inspection covers",
          reading: "The numbers mark the parts the law lists. Read each one below the drawing.",
          figure: {
            type: "sketch",
            scene: "house",
            marks: [
              { code: "1", name: "The roof covering", body: "Shingles, tile or metal, and how old they are. The inspector walks the roof or looks from a ladder." },
              { code: "2", name: "The structure", body: "The walls, the trusses in the attic, and the straps or clips that tie the roof to the walls." },
              { code: "3", name: "The outside and the inside", body: "Windows, doors, the stucco and the paint, then the floors, walls and ceilings inside." },
              { code: "4", name: "The electrical system", body: "The meter, the panel, the wiring type, and whether anything in the panel is a hazard." },
              { code: "5", name: "The plumbing", body: "The pipes, the water heater, the drains, and any sign of a leak, past or present." },
              { code: "6", name: "Heating and cooling", body: "The air conditioner, the air handler and the ducts, and their age." },
              { code: "7", name: "The site around the house", body: "The conditions of the site that affect the house, like whether the ground slopes away from the slab and where water goes when it rains." },
            ],
          },
          note: "This drawing shows the idea, not a real house. The list of parts is the one in Florida’s home inspector law.",
          source: { label: "Florida Statutes 468.8311 (2026); Florida Department of Business and Professional Regulation, Home inspectors FAQ", href: FS_468_8311 },
        },
      ],
      sources: [S.statuteDef, S.dbpr],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "the-four-point",
      title: "The four-point inspection",
      lead: "Insurers ask for a four-point on older homes. It covers four systems: the roof, the electrical, the plumbing, and the heating and cooling.",
      blocks: [
        p("Picture a house built 25 years ago. Before an insurer writes a policy on it, it wants to know how old those four systems are, and whether they work."),
        p(
          "Citizens, the state-backed insurer, requires a four-point on a new application for a home more than 20 years old. Its form is called the 4-Point Inspection Form.",
          "The report must be dated within the last 12 months. A Florida-licensed inspector fills it in and signs it.",
        ),
        p(
          "The form asks each system’s age, when it was last updated, and whether it’s in good working order.",
          "For the roof, it asks the covering, the age, the remaining useful life and the date of the last roofing permit. Photos of the panel and the house go with it.",
        ),
        p("Other insurers have their own rules about when they ask for one. Your agent will know. The point is the same: the four-point is for the insurance company, not for you."),
        {
          kind: "figure",
          eyebrow: "Two reports",
          title: "The home inspection and the four-point answer different questions",
          reading: "Read each side. One report is for you. The other is for the insurance company.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "The home inspection",
                title: "It’s for you",
                items: ["Looks at the whole house, inside and out", "You choose the inspector, and you get the report", "It tells you what to fix, what to ask about, and when to walk away"],
              },
              {
                eyebrow: "The four-point",
                title: "It’s for the insurance company",
                items: [
                  "Roof, electrical, plumbing, and heating and cooling",
                  "Each one’s age, last update and whether it works",
                  "Signed by a Florida-licensed inspector, dated within 12 months",
                  "Citizens asks for it on homes more than 20 years old",
                ],
              },
            ],
          },
          source: { label: "Citizens Property Insurance, Four-point inspection questions; Citizens Property Insurance, 4-Point Inspection Form", href: CITIZENS_4PT_FAQ },
        },
      ],
      sources: [S.citizensFaq, S.citizensForm],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "the-wind-mitigation-report",
      title: "The wind mitigation report",
      lead: "A wind mitigation report lists the parts of the house that stand up to wind. Each one can earn a discount on insurance.",
      blocks: [
        p(
          "Picture two houses in a storm. One has a roof strapped to its walls and shutters on every window. The other doesn’t.",
          "The first one is less likely to lose its roof. Florida law says its insurance should cost less.",
        ),
        p(
          "The law makes insurers give discounts or credits for features that cut wind damage. They include the roof’s strength and covering, and how the roof is tied to the walls.",
          "They include how the walls are tied to the floor and the foundation. And they include protection for the windows and doors.",
        ),
        p(
          "An inspector records those features on a state form. Its official name is the Uniform Mitigation Verification Inspection Form, and people call it the 1802.",
          "A new version took effect on April 1, 2026. A form is good for up to five years, as long as the house hasn’t changed.",
        ),
        p(
          "Who can sign it? A licensed home inspector with the state’s wind training, a building code inspector, a licensed contractor, an engineer or an architect.",
          "Each answer needs a photo or a document to back it up.",
        ),
        {
          kind: "figure",
          eyebrow: "The form",
          title: "What the wind mitigation form asks, in plain words",
          reading: "Each line is one part of the form, in plain words. A yes, backed by a photo, can earn a discount.",
          figure: {
            type: "questions",
            answers: ["Yes", "No"],
            items: [
              { question: "Was the house built under the Florida Building Code of 2001 or later?" },
              { question: "Was the roof covering put on under that code?", note: "The form asks what the roof is made of and when it was put on." },
              { question: "Is the roof deck nailed down the stronger way?", note: "The form asks the size of the nails and how close together they are." },
              { question: "Is the roof tied to the walls with metal clips or straps?", note: "Nails driven at an angle earn less." },
              { question: "Is it a hip roof?", note: "A hip roof slopes on all four sides." },
              { question: "Is the roof deck sealed, or is there a second water barrier under the covering?" },
              { question: "Are the windows, doors and garage door all protected from flying debris?", note: "Rated shutters or impact glass." },
            ],
          },
          note: "These are plain-language versions of the form’s questions. The real form uses exact words and has more than one answer for each. The 2026 version also asks the wind region and the roof’s slope.",
          source: { label: "Florida Office of Insurance Regulation, form OIR-B1-1802 (Rev. 04/26); Florida Statutes 627.0629 (2026); Florida Chief Financial Officer, Mitigation notices, inspections and forms", href: OIR_1802 },
        },
      ],
      sources: [S.windStatute, S.oir1802, S.cfo, S.citizensNotice],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "the-roof",
      title: "The roof",
      lead: "Roof age is one of the first things an insurer asks about. Florida law draws a line at 15 years.",
      blocks: [
        p("Ask for the permit for the last time the roof was replaced. Its date is the age the insurer will use. Ask what the roof is made of, too."),
        p(
          "Here’s the rule. If the roof is less than 15 years old, an insurer can’t refuse to write or renew the policy just because of its age.",
          "If the roof is 15 years or older, the insurer must let you have it inspected first, at your own expense. Only then can it ask you to replace the roof to get or keep the policy.",
          "If that inspection shows 5 or more years of life left, the insurer still can’t say no because of age alone.",
        ),
        p("The law doesn’t stop the insurer from pricing an old roof. So if the roof is near the end of its life, put the replacement in your number before you make an offer."),
        {
          kind: "figure",
          eyebrow: "Roof age",
          title: "How the 15-year line works",
          reading: "Read each bar. The first is a younger roof. The second is an older roof with an inspection.",
          figure: {
            type: "bar",
            unit: "years",
            max: 20,
            rows: [
              { label: "A roof under 15 years old", sub: "The insurer can’t say no because of age alone", segments: [{ label: "Under 15 years", value: 15, series: 2 }] },
              {
                label: "A roof 15 years or older",
                sub: "An inspection must show 5 or more years of life left",
                segments: [
                  { label: "15 years", value: 15, series: 0 },
                  { label: "5 more", value: 5, series: 1, hatched: true },
                ],
              },
            ],
            legend: [
              { label: "Age alone can’t be the reason", series: 2 },
              { label: "Years the inspection must find", series: 1, hatched: true },
            ],
          },
          note: "The years are the ones in the law, not from any one house.",
          source: { label: "Florida Statutes 627.7011(5) (2026)", href: FS_627_7011 },
        },
      ],
      sources: [S.roofStatute, S.citizensForm],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "termites-and-moisture",
      title: "Termites and moisture",
      lead: "In Florida, a termite report is its own form from the state. It says what the inspector could see, and what they couldn’t.",
      blocks: [
        p(
          "The state calls termites and their kind wood-destroying organisms. The list includes termites, powder post beetles, old house borers and the fungi that rot wood.",
        ),
        p(
          "When the inspection is for a sale, the inspector must report on the state’s form, called the Wood-Destroying Organisms Inspection Report.",
          "It says whether they saw live pests, signs of them, damage, or signs of an old treatment.",
          "It also lists the parts of the house they couldn’t see or reach, and why.",
        ),
        p(
          "The form says, in capital letters, that it covers only what was visible and reachable that day. It isn’t a guarantee. And it isn’t a report on whether the house is sound.",
          "If it finds damage, ask a contractor to look at the structure.",
        ),
        p("Ask the home inspector to look for moisture too: around the windows, and where the walls meet the ground. Fresh paint can hide a wet wall, so ask what they checked."),
        {
          kind: "figure",
          eyebrow: "The report",
          title: "What the termite report answers",
          reading: "Each line is one finding on the state’s form, in plain words. The form marks each one yes or no.",
          figure: {
            type: "questions",
            answers: ["Yes", "No"],
            items: [
              { question: "Did the inspector see live termites or other wood-eating pests?" },
              { question: "Did they see signs of them, like mud tubes, exit holes or droppings?" },
              { question: "Did they see damage?", note: "The form says it isn’t a report on whether the house is sound. A contractor checks that." },
              { question: "Did they see signs of an old treatment?", note: "The company that did the treatment can tell you about any warranty." },
              { question: "Were parts of the house blocked from view?", note: "The form lists each one and the reason." },
            ],
          },
          note: "These are plain-language versions of the form’s findings. The real form uses exact words and is made on the basis of what was visible and readily accessible.",
          source: { label: "Florida Department of Agriculture and Consumer Services, form 13645; Florida Statutes 482.226 (2026)", href: FDACS_13645 },
        },
      ],
      sources: [S.wdoStatute, S.wdoForm],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "seawalls-docks-and-lifts",
      title: "Seawalls, docks and lifts",
      lead: "On a canal or the bay, the seawall holds the yard in place. Repairs can cost a lot, so have it checked before you buy.",
      blocks: [
        p("A seawall keeps the land in, not the water out. That’s how the City of Holmes Beach puts it in its seawall manual, and it’s a good way to picture it."),
        p(
          "The wall is a row of panels, made of concrete, vinyl, composite or metal. They stand from below the canal floor up to the yard.",
          "A concrete cap runs along the top and ties the panels together. Rods run from the cap back into the yard, to buried concrete blocks called deadmen. The rods and the deadmen hold the wall up.",
        ),
        p(
          "Here’s what trouble looks like. Dips or sinkholes in the yard behind the wall. Mounds of sand in the water at the joints, which show at low tide.",
          "A cap that cracks, leans or pulls away. Panels that wave or sag. Rust stains on the face of the wall.",
        ),
        p(
          "Holmes Beach says it plainly: have the seawall evaluated by an engineer or a marine contractor before you buy. Many of the island’s original seawalls are near the end of their lives.",
          "The same goes for any canal on this coast.",
        ),
        p("The dock and the lift get their own look. And if you’ll keep a boat, check the depth of the water at low tide."),
        {
          kind: "figure",
          eyebrow: "The seawall",
          title: "The parts of a seawall, from the side",
          reading: "The canal is on the left and the yard is on the right. The numbers mark the parts to ask about.",
          figure: {
            type: "sketch",
            scene: "seawall",
            marks: [
              { code: "1", name: "The cap", body: "The concrete beam along the top. It ties the panels together. Cracks, rust marks or a lean are the first signs of trouble." },
              { code: "2", name: "The panels", body: "Concrete, vinyl, composite or metal, standing side by side. They aren’t watertight, and a small hole lets water behind them drain." },
              { code: "3", name: "The rods and the deadmen", body: "Rods run from the cap back into the yard to buried concrete blocks. They hold the wall up. When they rust through, the wall leans." },
              { code: "4", name: "The toe", body: "Where the panels go into the canal floor. If the floor washes away here, sand slips out from behind the wall." },
              { code: "5", name: "The dock", body: "Built on pilings. It gets its own look, and so does a boat lift." },
              { code: "6", name: "The depth at low tide", body: "The solid line is high tide and the dashed line is low tide. If you’ll keep a boat, measure the water at low tide." },
            ],
          },
          note: "This drawing shows the idea, not a real wall. Walls differ, and some have pilings along the water side too.",
          source: { label: "City of Holmes Beach, Seawall manual", href: HB_SEAWALL },
        },
      ],
      sources: [S.seawall],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "the-flood-papers",
      title: "The flood papers",
      lead: "Two papers tell you about water: the elevation certificate and the seller’s flood form. Ask for both during the inspection period.",
      blocks: [
        p(
          "The elevation certificate is a form that shows how high the lowest floor sits, compared with the height the big flood would reach.",
          "A licensed surveyor, engineer or architect fills it in. You don’t need one to buy a FEMA flood policy, but it can lower the price.",
        ),
        p("Ask the seller for it first. If they don’t have one, ask the county. If no one has one, a surveyor can make one for a fee."),
        p(
          "The seller’s flood form comes from Florida law, which calls it a flood disclosure. The seller must give it to you at or before the time the contract is signed.",
          "It answers three questions with a yes or a no. Do they know of flood damage while they owned the home? Did they file an insurance claim for flood damage? Did they get help for flood damage, like from FEMA?",
        ),
        p("Our flood guide goes through both papers step by step, and the flood zone too."),
        {
          kind: "figure",
          eyebrow: "Two papers",
          title: "The certificate and the seller’s form answer different questions",
          reading: "Read each side. One is about the house’s height. The other is about the seller’s years in it.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "The elevation certificate",
                title: "How high the floor sits",
                items: ["Filled in by a licensed surveyor, engineer or architect", "Compares the lowest floor with the big flood’s height", "Not required for a FEMA policy, but it can lower the price"],
              },
              {
                eyebrow: "The seller’s flood form",
                title: "What happened while they owned it",
                items: ["Any flood damage they know of", "Any flood insurance claim they filed", "Any help they got for flood damage, like from FEMA", "Due at or before the contract is signed"],
              },
            ],
          },
          source: { label: "FEMA, Understanding elevation certificates; Florida Statutes 689.302 (2026)", href: FEMA_UEC },
        },
      ],
      sources: [S.uec, S.floodStatute],
    },

    /* ---- 08 ---------------------------------------------------------------- */
    {
      id: "before-the-inspection-period-ends",
      title: "Before the inspection period ends",
      lead: "The standard Florida contract gives you a set number of days to inspect. If the blank is left empty, it’s 15. Use them in order.",
      blocks: [
        p(
          "On the standard AS IS contract, you can cancel in writing before the inspection period ends and get your deposit back.",
          "After that, you own what the reports found. So order everything the day the contract is signed.",
        ),
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Eight things to do inside the inspection period",
          reading: "Go in order. The first five are orders to place on day one.",
          figure: {
            type: "checklist",
            items: [
              { text: "Hire a licensed home inspector", detail: "Check the license on the state’s site first." },
              { text: "Order the four-point and the wind mitigation report", detail: "On an older home, the insurer will ask for both. The same inspector can often do all three." },
              { text: "Get the date of the last roof permit", detail: "That’s the roof age the insurer will use." },
              { text: "Order the termite report on the state’s form", detail: "Read the list of places the inspector couldn’t see." },
              { text: "On the water, have a marine contractor or an engineer check the seawall", detail: "And the dock, the lift, and the depth at low tide." },
              { text: "Ask for the elevation certificate and the seller’s flood form", detail: "Our flood guide walks through both." },
              { text: "Send the reports to your insurance agent", detail: "The quote can change what you can afford each month." },
              { text: "Decide before the last day", detail: "Cancel in writing before the period ends, or go forward with what you know." },
            ],
          },
          note: "The 15 days are the contract’s default when the blank is left empty. Your contract may say a different number, and it controls.",
          source: { label: "Florida Realtors and The Florida Bar, AS IS residential contract, paragraph 12; each other step comes from the section it sums up", href: FRBAR_ASIS },
          tool: { tool: "contact", cta: "Send us an address" },
        },
      ],
      sources: [S.contract, S.dbpr, S.citizensFaq, S.oir1802, S.wdoForm, S.seawall, S.uec, S.floodStatute],
    },
  ],

  onOnePage: {
    title: "Your inspection notes for one house",
    reading: "Fill in the right side for the house you’re looking at.",
    rows: [
      { label: "Address", value: "Write it here" },
      { label: "Year built", value: "From the county’s records" },
      { label: "Inspection period ends", value: "The date, from your contract" },
      { label: "Home inspector", value: "Name, and the license checked" },
      { label: "Four-point", value: "Date, and who signed it" },
      { label: "Wind mitigation form", value: "Date, and who signed it" },
      { label: "Roof", value: "Last permit date, and the covering" },
      { label: "Termite report", value: "Date, and what it found" },
      { label: "Seawall, dock and lift", value: "Who looked, and what they found" },
      { label: "Elevation certificate", value: "Yes or no, and the floor height" },
      { label: "Seller’s flood form", value: "Three answers, yes or no" },
      { label: "Insurance quote", value: "From your agent" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us an address.",
    body: "We’ll tell you which reports that house needs and line them up inside the inspection period. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a house",
    tool: "contact",
  },
};
