import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Condo documents after the 2022 law, explained.
 *
 * Written to the plain template in docs/GUIDES.md: short sentences, everyday
 * words, one idea at a time, and every official term explained the first
 * time it appears. No links inside the paragraphs. Each figure carries one
 * source line and each section lists its sources at the foot. The facts are
 * the ones the October 2, 2026 fact check read in the 2026 Florida Statutes
 * and on the bill pages cited. The condominium act was changed again in
 * 2024 and 2025, and touched by a reviser’s bill in 2026, so the old
 * guide’s 2025 citations were re-read against the 2026 text.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const FS_553_899 = "https://www.flsenate.gov/Laws/Statutes/2026/553.899";
const FS_718_111 = "https://www.flsenate.gov/Laws/Statutes/2026/718.111";
const FS_718_112 = "https://www.flsenate.gov/Laws/Statutes/2026/718.112";
const FS_718_116 = "https://www.flsenate.gov/Laws/Statutes/2026/718.116";
const FS_718_503 = "https://www.flsenate.gov/Laws/Statutes/2026/718.503";
const SB_4D = "https://www.flsenate.gov/Session/Bill/2022D/4D";
const HB_1021 = "https://www.flsenate.gov/Session/Bill/2024/1021";
const HB_913 = "https://www.flsenate.gov/Session/Bill/2025/913";
const SB_104 = "https://flsenate.gov/Session/Bill/2026/104";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  fs553: src("Florida Statutes 553.899 (2026), mandatory structural inspections for condominium and cooperative buildings", FS_553_899),
  fs718_111: src("Florida Statutes 718.111(12) (2026), official records and the association website", FS_718_111),
  fs718_112: src("Florida Statutes 718.112(2)(f) and (g) (2026), reserves and the structural integrity reserve study", FS_718_112),
  fs718_116: src("Florida Statutes 718.116 (2026), assessments and the estoppel certificate", FS_718_116),
  fs718_503: src("Florida Statutes 718.503 (2026), disclosure before a resale and the buyer’s right to cancel", FS_718_503),
  sb4d: src("Florida Senate, SB 4-D (2022 special session), chapter 2022-269, approved May 26, 2022", SB_4D),
  hb1021: src("Florida Senate, CS/CS/CS/HB 1021 (2024), chapter 2024-244, effective July 1, 2024", HB_1021),
  hb913: src("Florida Senate, CS/CS/HB 913 (2025), chapter 2025-175, effective July 1, 2025", HB_913),
  sb104: src("Florida Senate, SB 104 (2026), chapter 2026-14, a reviser’s bill with technical corrections only, effective May 12, 2026", SB_104),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });

/* ---- The guide ------------------------------------------------------------- */

export const CONDO_GUIDE: Guide = {
  slug: "condo-and-hoa-documents-after-the-2022-law",
  title: "Condo documents after the 2022 law, explained",
  promise: "The two documents Florida’s 2022 condo law created, what changed about reserves, and what to ask for before you buy.",
  howToUse: [
    "Read this guide once from start to finish. Then use the questions at the end for each building you look at.",
    "The law has changed almost every year since 2022. Each part of this guide says where its facts come from, and the day we checked. Before you count on them for one building, ask the association for its own documents.",
  ],
  questions: ["Has the building had its milestone inspection?", "Is there a current reserve study?", "Does the budget fund what the study calls for?"],
  cover: img("guides/condo-and-hoa-documents-after-the-2022-law", "Royal palms in front of a mid-rise condo building with balconies", "55% 75%"),
  author: { name: "Jessica Garza", slug: "jessica-garza" },
  publishedAt: "2026-09-27",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "two-documents-the-law-created",
      title: "Two documents the 2022 law created",
      lead: "In 2022, Florida passed a new law for condo buildings. It created two documents. Ask for both before you buy.",
      blocks: [
        p(
          "Picture a tower on the bayfront. It’s forty years old. From the street it looks fine.",
          "But you can’t see most of what holds it up and keeps it dry. That includes the columns and the pipes inside the walls.",
        ),
        p(
          "For years, a buyer had no easy way to know the state of those parts. And the owners could vote to save nothing for them.",
          "The dues stayed low, and the building got older.",
        ),
        p(
          "In May 2022, the Florida Legislature changed that. The new law requires two things for a condo building of three stories or more.",
        ),
        p(
          "The first is a milestone inspection. An engineer or architect checks the building’s structure.",
          "The second is a structural integrity reserve study. It says what the building’s main parts will cost to replace, and how much to save each year.",
          "This guide calls it the reserve study.",
        ),
        p(
          "The law has been changed several times since. This guide uses the rules as they stand in the 2026 Florida Statutes.",
        ),
        {
          kind: "figure",
          eyebrow: "The two documents",
          title: "The inspection and the study",
          reading: "Each card is one document. Find out whether the building has both.",
          figure: {
            type: "zone-cards",
            labels: { lender: "Which buildings need it", build: "What you should get" },
            cards: [
              {
                code: "1",
                name: "The milestone inspection",
                tone: "high",
                means: "A licensed engineer or architect checks the building’s structure. Phase one is a visual check. Phase two is testing, if phase one finds substantial damage.",
                lender: { mark: "yes", text: "Condo and co-op buildings of three stories or more, at 30 years old, then every 10 years" },
                build: "The inspector’s summary, which every owner gets, and the full report",
              },
              {
                code: "2",
                name: "The reserve study",
                tone: "lower",
                means: "A study of the parts that keep the building standing and dry, with the cost to replace each one and the money to save each year.",
                lender: { mark: "yes", text: "Condo buildings of three stories or more, at least every 10 years" },
                build: "The study itself, which the seller must give you, or a statement that there isn’t one",
              },
            ],
          },
          note: "People say SIRS for short. This guide says the reserve study.",
          source: { label: "Florida Statutes 553.899 (2026); Florida Statutes 718.112(2)(g) (2026); Florida Senate, SB 4-D (2022), chapter 2022-269", href: FS_553_899 },
        },
      ],
      sources: [S.sb4d, S.fs553, S.fs718_112, S.sb104],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "the-milestone-inspection",
      title: "The milestone inspection",
      lead: "A milestone inspection is a structural check of the building. The first one is due when the building turns 30, then every 10 years.",
      blocks: [
        p(
          "The rule covers condo and co-op buildings of three stories or more. The clock starts on the day the building got its certificate of occupancy.",
          "That’s the paper that said it was ready to live in.",
        ),
        p("The first inspection is due by December 31 of the year the building turns 30. After that, it’s due every 10 years."),
        p(
          "The local building office can set the clock at 25 years instead. It can do that where local conditions call for it, such as being near salt water.",
          "On the bayfront and the keys, ask which clock the building is on.",
        ),
        p(
          "The inspection has two phases. Phase one is a visual check of the whole building by an engineer or architect.",
          "If it finds substantial damage to the structure, phase two follows, with testing.",
        ),
        p(
          "The association then has 45 days to send the inspector’s summary to every owner. It must post it in the building too.",
          "Ask the seller for the summary. Ask for the full report as well.",
        ),
        {
          kind: "figure",
          eyebrow: "The clock",
          title: "When the inspections are due",
          reading: "The axis is the building’s age. Each bar starts at the first inspection and runs on, with one every 10 years.",
          figure: {
            type: "timeline",
            max: 50,
            unit: "years",
            ticks: [
              { at: 0, label: "0" },
              { at: 10, label: "10" },
              { at: 20, label: "20" },
              { at: 30, label: "30" },
              { at: 40, label: "40" },
            ],
            markers: [{ at: 30, label: "The first inspection" }],
            lanes: [
              { label: "Most buildings", sub: "First at 30, then every 10 years", start: 30, end: 50, series: 2, text: "Every 10 years" },
              { label: "A 25-year clock", sub: "First at 25, where the local building office requires it", start: 25, end: 50, series: 1, text: "Every 10 years" },
            ],
            legend: [
              { label: "The 30-year clock", series: 2 },
              { label: "The 25-year clock", series: 1 },
            ],
          },
          note: "Buildings that were already past 30 when the law passed had earlier deadlines, in 2024 and 2025. Those dates have passed. If an older building has no inspection yet, ask why.",
          source: { label: "Florida Statutes 553.899(3) and (9) (2026)", href: FS_553_899 },
        },
      ],
      sources: [S.fs553, S.hb913],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "the-reserve-study",
      title: "The reserve study, and the parts it covers",
      lead: "The reserve study looks at the parts that keep the building standing and dry. It says what they’ll cost, and what to save.",
      blocks: [
        p(
          "Every condo building of three stories or more must have a reserve study at least every 10 years.",
          "A licensed engineer or architect, or a certified reserve specialist, must do the study or check it.",
        ),
        p("The study must cover seven kinds of parts, from the roof to the windows. The drawing below shows them."),
        p(
          "For each part, the study says how long it should last and what it will cost to replace. It also says how much to save each year.",
          "Any other costly item whose failure would harm those parts counts too.",
        ),
        p(
          "An owner-run association that existed by July 1, 2022 had until the end of 2025 to finish its first study. A building whose milestone inspection was due by the end of 2026 could do both at once.",
          "Within 45 days of getting the study, every owner must get a copy, or a notice that it’s ready.",
        ),
        p("Ask for it by name. If the association doesn’t have one, the seller must give you that statement in writing."),
        {
          kind: "figure",
          eyebrow: "The parts",
          title: "The seven parts the study must cover",
          reading: "The numbers on the drawing match the list under it.",
          figure: {
            type: "parts",
            items: [
              { label: "The roof" },
              { label: "The structure", means: "Including the walls and beams that carry the weight" },
              { label: "Fireproofing and fire protection" },
              { label: "Plumbing" },
              { label: "Electrical" },
              { label: "Waterproofing and exterior painting" },
              { label: "Windows and exterior doors" },
            ],
          },
          note: "The drawing shows the idea, not a real building. The law adds an eighth item: any other costly part whose failure would harm these seven.",
          source: { label: "Florida Statutes 718.112(2)(g) (2026)", href: FS_718_112 },
        },
      ],
      sources: [S.fs718_112, S.hb913],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "what-changed-about-reserves",
      title: "What changed about reserves",
      lead: "Owners used to vote to save nothing for the big repairs. For the parts in the study, they can’t anymore.",
      blocks: [
        def(
          "Reserves",
          "Money the association sets aside each year for big repairs later. The budget shows how much goes in. The reserve study says how much should.",
          S.fs718_112,
        ),
        p(
          "For years, condo owners could vote each budget to save less than needed, or nothing.",
          "Picture a roof two years past its life, and an empty fund to replace it.",
        ),
        p(
          "That vote is now gone for the parts in the reserve study. For any budget adopted on or after December 31, 2024, the owners can’t vote to skip or lower those reserves.",
          "This applies to every building that needs a study. An association that runs more than one condo can skip them only if the state has approved another way to pay.",
        ),
        p("They can still vote to lower reserves for other things, by a majority of all the owners. So read the budget line by line."),
        p(
          "The law gives the owners two ways to ease the cost. First, suppose the building had a milestone inspection in the last two years. Then a majority of all owners can let the board pause or lower reserve payments.",
          "The pause can last up to two budgets, and the money must go to repairs the inspection called for. This option runs through budgets adopted by the end of 2028.",
        ),
        p(
          "Second, the reserves can be paid for with a loan or a line of credit, not just with dues. That also takes a majority of all owners.",
          "Either way, the money is still owed later. Ask how and when it will be paid back.",
        ),
        {
          kind: "figure",
          eyebrow: "The vote",
          title: "What the owners can and can’t vote down",
          reading: "Read each side. The left side is fixed by law. The right side is up to the owners each year.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "Can’t be skipped",
                title: "Reserves for the parts in the study",
                items: [
                  "The roof, the structure, fire protection, plumbing, electrical, waterproofing and paint, windows and doors",
                  "For every budget adopted on or after December 31, 2024",
                  "The owners can vote a pause of up to two budgets, to pay for repairs a milestone inspection called for",
                ],
              },
              {
                eyebrow: "Can still be voted down",
                title: "Reserves for everything else",
                items: ["Items the study doesn’t cover", "By a majority of all the owners, each budget", "Read the budget to see what they chose this year"],
              },
            ],
          },
          note: "A pause means less money saved for those parts. If the building is on a pause, ask when it ends and how the fund will catch up.",
          source: { label: "Florida Statutes 718.112(2)(f) (2026)", href: FS_718_112 },
        },
      ],
      sources: [S.fs718_112, S.sb4d, S.hb913],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "the-documents-to-ask-for",
      title: "The documents to ask for",
      lead: "Florida law lists the documents a condo seller must give you. Ask for all of them, plus the estoppel certificate.",
      blocks: [
        p(
          "When you buy a condo from an owner, not a developer, Florida law lists what the seller must give you.",
          "The list starts with the rules of the building: the declaration, the articles, the bylaws and the rules.",
        ),
        p(
          "Then the money: last year’s financial statement and this year’s budget.",
          "Then the building: the inspection summary, the reserve study, and any turnover report. If there’s no study, the seller gives you a statement saying so.",
        ),
        p("Last, a sheet called Frequently Asked Questions and Answers, with the basics about the building."),
        p(
          "Order the estoppel certificate too. That’s a signed statement of what the seller owes and what comes with the unit. The association issues it.",
          "It lists fees due at the sale, open rule violations, and whether the board must approve you.",
        ),
        p(
          "If the condo has 25 or more units, these documents must be on its website or app. They sit behind an owner login.",
          "Ask the seller to pull them for you.",
        ),
        {
          kind: "figure",
          eyebrow: "The list",
          title: "The resale documents, by name",
          reading: "Tick each one as it arrives. The last one you order yourself.",
          figure: {
            type: "checklist",
            items: [
              { text: "The declaration of condominium", detail: "The recorded document that creates the condo and sets the owners’ rights." },
              { text: "The articles of incorporation and the bylaws", detail: "How the association is set up and run." },
              { text: "The rules of the association", detail: "Pets, rentals, parking, and the rest." },
              { text: "The annual financial statement and the annual budget", detail: "Read the reserve lines next to the study." },
              { text: "The milestone inspection summary", detail: "And the full report, from the association’s records." },
              { text: "The reserve study, or a statement that there isn’t one", detail: "Ask for it by its legal name: the structural integrity reserve study." },
              { text: "The turnover inspection report, if there was one after July 1, 2023", detail: "A report made when the developer handed the building to the owners." },
              { text: "The Frequently Asked Questions and Answers sheet", detail: "The association’s short answers about the building." },
              { text: "The estoppel certificate", detail: "Not on the seller’s list. Order it from the association yourself." },
            ],
          },
          source: { label: "Florida Statutes 718.503(2)(a) (2026); Florida Statutes 718.116(8) (2026)", href: FS_718_503 },
        },
      ],
      sources: [S.fs718_503, S.fs718_116, S.fs718_111, S.hb1021],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "the-clocks",
      title: "The clocks",
      lead: "Once you have the documents, the law gives you a short time to cancel. Other clocks run on the association.",
      blocks: [
        p(
          "Your resale contract must say this, in type that stands out: you can cancel within 7 days of signing and getting the documents.",
          "Weekends and legal holidays don’t count. The right ends at closing.",
        ),
        p("So the day you get the full set, the clock starts. Read everything in those 7 days. Ask for help if you need it."),
        p(
          "The estoppel certificate has a clock too. Once asked, the association has 10 business days to issue it. It stays good for 30 days, or 35 if it came by mail.",
          "Ask for it early.",
        ),
        p(
          "A buyer who relies on the certificate can’t be charged more than it says.",
          "And remember: a new owner can be made to pay what the seller left unpaid, dues and special assessments alike. The certificate is how you find out.",
        ),
        {
          kind: "figure",
          eyebrow: "The clocks",
          title: "How many days each clock gives you",
          reading: "One bar for each clock. The first one is yours. The rest run on the association.",
          figure: {
            type: "bar",
            unit: "days",
            max: 45,
            rows: [
              { label: "Cancel the resale contract", sub: "After signing and getting the documents. Weekends and holidays don’t count", segments: [{ label: "7 days", value: 7, series: 1 }] },
              { label: "The estoppel certificate arrives", sub: "After the association is asked, in business days", segments: [{ label: "10 business days", value: 10, series: 2 }] },
              { label: "The estoppel certificate stays good", sub: "35 days if it came by mail", segments: [{ label: "30 days", value: 30, series: 2 }] },
              { label: "Owners get the milestone summary", sub: "After the association receives the report", segments: [{ label: "45 days", value: 45, series: 0 }] },
            ],
            legend: [
              { label: "Your clock", series: 1 },
              { label: "The association’s clocks", series: 2 },
              { label: "After an inspection", series: 0 },
            ],
          },
          note: "Business days skip weekends and holidays. The 7-day clock skips them too.",
          source: { label: "Florida Statutes 718.503(2)(d) (2026); Florida Statutes 718.116(8) (2026); Florida Statutes 553.899(9) (2026)", href: FS_718_503 },
        },
      ],
      sources: [S.fs718_503, S.fs718_116, S.fs553],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "before-you-make-an-offer",
      title: "Before you make an offer",
      lead: "Here are the questions to ask about any condo building of three stories or more. Each one has a yes or no answer, and a document that shows it.",
      blocks: [
        {
          kind: "figure",
          eyebrow: "The questions",
          title: "Seven questions for the building",
          reading: "Answer each one from the documents, not from the listing.",
          figure: {
            type: "questions",
            answers: ["Yes", "No"],
            items: [
              { question: "Has the building had its milestone inspection?", note: "If it’s past 30 years old, or 25 where the local building office set that clock." },
              { question: "Did phase one find substantial damage to the structure?", note: "If yes, ask for the phase-two report." },
              { question: "Is there a reserve study less than 10 years old?", note: "The structural integrity reserve study." },
              { question: "Does this year’s budget fund the reserves the study calls for?", note: "Compare the two line by line." },
              { question: "Is reserve funding paused or lowered right now?", note: "If yes, ask when it restarts and how." },
              { question: "Is a special assessment pending or planned?", note: "The estoppel certificate lists what has been levied." },
              { question: "Is the building paying off a loan or line of credit for repairs?", note: "Ask what each unit’s share is." },
            ],
          },
          note: "These are questions to ask, not a legal form. The documents in section 5 hold the answers.",
          source: { label: "Each question comes from the section it sums up. The sources are listed there and at the end of this guide", href: FS_718_112 },
          tool: { tool: "contact", cta: "Send us an address" },
        },
        p(
          "If a building has a current inspection, a current study and the reserves the study calls for, you can see where it stands.",
          "If any of the three is missing, ask why before you make an offer.",
        ),
      ],
      sources: [S.fs553, S.fs718_112, S.fs718_503, S.fs718_116],
    },
  ],

  onOnePage: {
    title: "Your notes for one building",
    reading: "Fill in the right side for the building you’re looking at.",
    rows: [
      { label: "Address and unit", value: "Write it here" },
      { label: "Stories, and the year it was built", value: "From the certificate of occupancy" },
      { label: "Milestone inspection", value: "Date, and phase two yes or no" },
      { label: "Reserve study", value: "Date, and who did it" },
      { label: "Reserves funded as the study calls for?", value: "Yes or no, from the budget" },
      { label: "Reserve pause or loan", value: "Yes or no, and when it restarts" },
      { label: "Special assessments", value: "From the estoppel certificate" },
      { label: "Estoppel certificate ordered", value: "The date" },
      { label: "Last day to cancel", value: "7 days after the documents arrive" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us an address.",
    body: "We’ll help you get the documents for that building and read them with you. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a building",
    tool: "contact",
  },
};
