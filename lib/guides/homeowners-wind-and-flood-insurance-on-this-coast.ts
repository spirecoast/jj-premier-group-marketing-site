import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Wind and flood insurance on this coast, explained.
 *
 * Plain on purpose: short sentences, everyday words, one idea at a time,
 * and every official term explained the first time it appears. The facts
 * were checked against the cited pages on October 2, 2026. No premium
 * figures: the hurricane deductible bars in figure 04 use a made-up
 * coverage amount to show the arithmetic, and the day-by-day timeline in
 * figure 07 is illustrative. Both say so.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const CFO_OVERVIEW = "https://www.myfloridacfo.com/division/consumers/understanding-insurance/homeownersinsuranceoverview";
const CFO_FLOOD = "https://www.myfloridacfo.com/division/consumers/storm/flood-disaster-faqs";
const CFO_DEDUCTIBLE = "https://www.myfloridacfo.com/division/consumers/consumerprotections/floridashurricanedeductible";
const CFO_MSFH = "https://www.myfloridacfo.com/mysafeflhome";
const MSFH = "https://mysafeflhome.com/";
const MSFH_FAQ = "https://mysafeflhome.com/faq/";
const OIR_WIND = "https://floir.gov/consumers/wind-mitigation-resources";
const CITIZENS_WHO = "https://www.citizensfla.com/who-we-are";
const CITIZENS_DEPOP = "https://www.citizensfla.com/depopulation";
const CITIZENS_DEPOP_PL = "https://www.citizensfla.com/depoppl";
const CITIZENS_FLOOD = "https://www.citizensfla.com/flood";
const CITIZENS_BINDING_RULE = "https://securesupport.citizensfla.com/app/answers/detail/a_id/1455/~/what-is-citizens-hurricane-or-tropical-storm-binding-suspension-rule%3F";
const CITIZENS_BINDING_NOTICE = "https://www.citizensfla.com/-/20260719-citizens-is-under-binding-suspension";
const CITIZENS_UMVI = "https://www.citizensfla.com/-/20260319-uniform-mitigation-verification-inspection-form-changes";
const FS_627_7011 = "https://www.flsenate.gov/Laws/Statutes/2026/627.7011";
const FS_627_0629 = "https://www.flsenate.gov/Laws/Statutes/2026/627.0629";
const FS_627_351 = "https://www.flsenate.gov/Laws/Statutes/2026/627.351";
const FS_627_701 = "https://www.flsenate.gov/Laws/Statutes/2026/627.701";
const FS_627_715 = "https://www.flsenate.gov/Laws/Statutes/2026/627.715";
const FS_215_5586 = "https://www.flsenate.gov/Laws/Statutes/2026/215.5586";
const FEMA_FLOOD_INSURANCE = "https://www.fema.gov/flood-insurance";
const FEMA_RR2 = "https://www.fema.gov/flood-insurance/risk-rating";
const FEMA_UEC = "https://www.fema.gov/fact-sheet/understanding-elevation-certificates";
const FEMA_WAIT = "https://www.fema.gov/fema-common-faq/waiting-period-activating-flood-policy";
const CFR_61_11 = "https://www.law.cornell.edu/cfr/text/44/61.11";
const FLOODSMART_101 = "https://agents.floodsmart.gov/topics/flood-insurance-101";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  cfoOverview: src("Florida Chief Financial Officer, Homeowners insurance overview", CFO_OVERVIEW),
  cfoFlood: src("Florida Chief Financial Officer, Flood insurance questions", CFO_FLOOD),
  cfoDeductible: src("Florida Chief Financial Officer, Florida’s hurricane deductible", CFO_DEDUCTIBLE),
  cfoMsfh: src("Florida Department of Financial Services, My Safe Florida Home", CFO_MSFH),
  msfh: src("My Safe Florida Home, program site", MSFH),
  msfhFaq: src("My Safe Florida Home, frequently asked questions", MSFH_FAQ, "said new inspection applications were paused when we checked"),
  oirWind: src("Florida Office of Insurance Regulation, Wind mitigation resources (the uniform mitigation verification inspection form, OIR-B1-1802)", OIR_WIND),
  citizensWho: src("Citizens Property Insurance Corporation, Who we are", CITIZENS_WHO),
  citizensDepop: src("Citizens Property Insurance Corporation, Depopulation", CITIZENS_DEPOP),
  citizensDepopPl: src("Citizens Property Insurance Corporation, Personal lines depopulation", CITIZENS_DEPOP_PL),
  citizensFlood: src("Citizens Property Insurance Corporation, Flood insurance requirement", CITIZENS_FLOOD),
  citizensBindingRule: src("Citizens Property Insurance Corporation, What is Citizens’ hurricane or tropical storm binding suspension rule?", CITIZENS_BINDING_RULE),
  citizensBindingNotice: src("Citizens Property Insurance Corporation, binding suspension notice of July 19, 2026", CITIZENS_BINDING_NOTICE),
  citizensUmvi: src("Citizens Property Insurance Corporation, Uniform mitigation verification inspection form changes, March 19, 2026", CITIZENS_UMVI),
  fs6277011: src("Florida Statutes 627.7011(5) (2026), Homeowners’ policies; roof age", FS_627_7011),
  fs6270629: src("Florida Statutes 627.0629(1) (2026), Residential property insurance; rate filings; windstorm mitigation discounts", FS_627_0629),
  fs627351: src("Florida Statutes 627.351(6) (2026), Citizens Property Insurance Corporation", FS_627_351),
  fs627701: src("Florida Statutes 627.701(3) and (5) (2026), Deductibles; hurricane deductibles", FS_627_701),
  fs627715: src("Florida Statutes 627.715 (2026), Flood insurance (private flood policies)", FS_627_715),
  fs2155586: src("Florida Statutes 215.5586 (2026), My Safe Florida Home Program", FS_215_5586),
  femaFlood: src("FEMA, Flood insurance", FEMA_FLOOD_INSURANCE),
  rr2: src("FEMA, NFIP’s pricing approach (Risk Rating 2.0)", FEMA_RR2),
  uec: src("FEMA, Understanding elevation certificates (fact sheet)", FEMA_UEC),
  wait: src("FEMA, Waiting period for a flood policy", FEMA_WAIT),
  cfr: src("44 CFR 61.11, effective date and time of NFIP coverage (Legal Information Institute)", CFR_61_11),
  fs101: src("FloodSmart for agents, Flood insurance 101", FLOODSMART_101),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });

/* ---- The guide ------------------------------------------------------------- */

export const WIND_AND_FLOOD_GUIDE: Guide = {
  slug: "homeowners-wind-and-flood-insurance-on-this-coast",
  title: "Wind and flood insurance on this coast, explained",
  promise: "What a homeowners policy covers, what sets its price near the water, and what to check before you make an offer.",
  howToUse: [
    "Read this guide once, start to finish. Then use the checklist at the end each time you look at a house.",
    "Insurance rules change often. Each part of this guide says where its facts come from. Before you count on them for one house, get a real quote from an agent.",
  ],
  questions: ["How old is the roof?", "What does the wind report say?", "When will each policy start?"],
  cover: img("guides/homeowners-wind-and-flood-insurance-on-this-coast", "Palms bent by wind under a grey storm sky", "30% 35%"),
  author: { name: "Jessica Garza", slug: "jessica-garza" },
  publishedAt: "2026-09-23",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "two-policies",
      title: "Two policies, not one",
      lead: "A homeowners policy covers wind. It doesn’t cover flood. On this coast you need both.",
      blocks: [
        p(
          "Picture a storm coming in off the Gulf. First the wind hits. It pulls at the roof and drives rain in through any gap.",
          "Then the water rises from the bay and the canals. Two kinds of damage, from one storm.",
        ),
        p(
          "A homeowners policy covers the house, the things in it and a place to stay while it’s fixed.",
          "Wind is normally covered. Only in certain cases can an insurer leave wind out. Then you buy wind coverage on its own.",
        ),
        p(
          "Flood is different. A homeowners policy doesn’t cover it.",
          "Water that rises from the Gulf, a bay, a river or heavy rain needs a separate flood policy.",
          "You can buy one through FEMA’s program or from a private company.",
        ),
        p(
          "Citizens, the state-run insurer, goes a step further.",
          "If it covers a home for wind, it also requires flood insurance, in any flood zone. Some homes need it already.",
          "By January 1, 2027, all of them will, whatever the home is worth. Condo unit policies are left out.",
        ),
        {
          kind: "figure",
          eyebrow: "Two policies",
          title: "What each policy pays for",
          reading: "Read each side. One storm can cause both kinds of damage.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "Your homeowners policy covers",
                title: "The house, your things, and wind",
                items: ["The house and the structures beside it", "What’s inside it", "A place to stay while it’s repaired, in most policies", "Wind, unless the policy says wind is left out"],
              },
              {
                eyebrow: "A separate flood policy covers",
                title: "Water that rises",
                items: ["Water from the Gulf, a bay or a river that comes over the land", "Rain that runs off and piles up", "Sold by FEMA’s program and by private companies"],
              },
            ],
          },
          source: { label: "Florida Chief Financial Officer, Homeowners insurance overview; Florida Chief Financial Officer, Flood insurance questions", href: CFO_OVERVIEW },
        },
      ],
      sources: [S.cfoOverview, S.cfoFlood, S.citizensFlood],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "the-roof",
      title: "The roof comes first",
      lead: "The age of the roof is the first thing an insurer asks about. Florida law draws a line at 15 years.",
      blocks: [
        p("Ask for the permit from the last time the roof was replaced. Its date is the age the insurer uses. A seller’s guess isn’t enough."),
        p("If the roof is under 15 years old, an insurer can’t refuse to write or renew the policy just because of its age."),
        p(
          "If the roof is 15 or older, the law gives you a path. Get the roof inspected.",
          "If the report shows 5 or more years of life left, the insurer can’t turn you down for age alone.",
        ),
        p(
          "That rule stops a refusal. It doesn’t stop a price. An old roof can still cost more to insure.",
          "If the roof is near the end, put a new one in your budget.",
        ),
        {
          kind: "figure",
          eyebrow: "The roof",
          title: "Three questions to ask about the roof",
          reading: "Answer each one before you get a quote.",
          figure: {
            type: "questions",
            answers: ["Yes", "No"],
            items: [
              { question: "Is the roof under 15 years old?", note: "Count from the permit date for the last replacement." },
              { question: "Is there a permit for that roof job?", note: "Ask the seller, or look it up with the county or city." },
              { question: "If it’s 15 or older, has an inspector said it has 5 or more years left?", note: "That report keeps an insurer from refusing you for age alone." },
            ],
          },
          source: { label: "Florida Statutes 627.7011(5) (2026)", href: FS_627_7011 },
        },
      ],
      sources: [S.fs6277011],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "the-wind-report",
      title: "The wind report, and a free one",
      lead: "A wind mitigation report says how the house is built against wind. The credits it earns can cut the price a lot.",
      blocks: [
        p(
          "The report is a short state form. An inspector walks the house and checks six things.",
          "The roof covering. How the roof deck is nailed down. How the roof is tied to the walls. The roof’s shape.",
          "Whether there’s a second water barrier under the shingles. And whether every window and door is protected.",
        ),
        p(
          "Florida law says insurers must give discounts for features that cut wind damage. The report is how you prove them.",
          "It stays good for up to five years if the house doesn’t change.",
        ),
        p(
          "The state revised the form in 2026. A report done on the old form before April 1, 2026 is still accepted for a time.",
          "A new one costs a little and can be worth a lot. Get one, or ask the seller for theirs.",
        ),
        p(
          "The state also runs a program called My Safe Florida Home. It gives free wind inspections.",
          "For some homes it also gives grants for the upgrades. The state pays two dollars for each dollar you spend, up to a limit.",
          "The law sets who qualifies. The home must have homestead and have been built before 2008, among other rules.",
        ),
        p("The program opens and pauses as its money comes and goes. When we checked, it had paused new inspection applications. Check its site the week you need it."),
        {
          kind: "figure",
          eyebrow: "The house",
          title: "Six things the wind inspector checks",
          reading: "Find each number on the house. The list under it says what the inspector looks for.",
          figure: {
            type: "house-points",
            points: [
              { at: "roof-cover", label: "Roof covering", detail: "What the roof is made of and when it was put on." },
              { at: "roof-deck", label: "Roof deck attachment", detail: "How well the roof boards are nailed to the frame." },
              { at: "roof-wall", label: "Roof-to-wall attachment", detail: "Straps or clips that tie the roof down to the walls." },
              { at: "roof-shape", label: "Roof shape", detail: "Whether the roof slopes on all sides (a hip roof) or has flat ends (a gable)." },
              { at: "water-barrier", label: "Secondary water barrier", detail: "A sealed layer under the shingles that keeps rain out if they blow off." },
              { at: "openings", label: "Opening protection", detail: "Shutters or impact glass on every window and door." },
            ],
          },
          note: "The drawing shows one house. The form has a line for each of these six things, and a photo for each. Its official name is the Uniform Mitigation Verification Inspection Form, OIR-B1-1802.",
          source: { label: "Florida Office of Insurance Regulation, Wind mitigation resources; Citizens, Uniform mitigation verification inspection form changes (March 2026)", href: OIR_WIND },
        },
      ],
      sources: [S.fs6270629, S.oirWind, S.citizensUmvi, S.fs2155586, S.cfoMsfh, S.msfh, S.msfhFaq],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "the-hurricane-deductible",
      title: "The hurricane deductible",
      lead: "Your policy has a second, bigger deductible. It’s just for hurricane damage, and it’s a percent of what the house is insured for.",
      blocks: [
        def("Deductible", "The part of a claim you pay yourself before the insurer pays anything.", S.cfoDeductible),
        p(
          "Most policies have a flat deductible for everyday claims. For a hurricane, Florida uses a different one.",
          "The law makes insurers offer you choices. The common ones are 2, 5 or 10 percent of the amount the house is insured for.",
          "A bigger deductible means a lower price, and a bigger bill after a storm.",
        ),
        p(
          "Do the math before you choose. Two percent of a house insured for 400,000 dollars is 8,000 dollars.",
          "Ten percent is 40,000 dollars. That’s what you pay before the insurer pays anything.",
        ),
        p(
          "You pay it only once in a calendar year, no matter how many hurricanes hit.",
          "The first page of your policy, called the declarations page, shows which one you have.",
        ),
        {
          kind: "figure",
          eyebrow: "The deductible",
          title: "What you’d pay first, on a house insured for 400,000 dollars",
          reading: "Each bar is one choice of deductible. The longer the bar, the more you pay before the insurer pays.",
          figure: {
            type: "bar",
            unit: "thousand dollars",
            max: 40,
            rows: [
              { label: "2 percent", sub: "Of the amount the house is insured for", segments: [{ label: "8,000 dollars", value: 8, series: 2 }] },
              { label: "5 percent", sub: "Of the amount the house is insured for", segments: [{ label: "20,000 dollars", value: 20, series: 0 }] },
              { label: "10 percent", sub: "Of the amount the house is insured for", segments: [{ label: "40,000 dollars", value: 40, series: 1 }] },
            ],
            legend: [],
          },
          note: "The house and its coverage amount are made up to show the arithmetic. Your own policy’s declarations page shows your deductible.",
          source: { label: "The choices: Florida Statutes 627.701(3)(a); Florida Chief Financial Officer, Florida’s hurricane deductible. The coverage amount is illustrative and is not from any source", href: CFO_DEDUCTIBLE },
        },
      ],
      sources: [S.fs627701, S.cfoDeductible],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "citizens",
      title: "Citizens, and why your policy might move",
      lead: "Citizens is the state’s insurer of last resort. If you buy a house with a Citizens policy, expect a letter.",
      blocks: [
        p(
          "The Legislature created Citizens in 2002 for owners who can’t find coverage in the private market. It’s run by the state, not for profit.",
          "After a very bad storm, Florida law lets it charge extra to cover a deficit. Its own policyholders pay first.",
        ),
        p(
          "Citizens is meant to be temporary. A program called depopulation matches its policies with private companies that want them.",
          "If a company offers to take your policy, Citizens sends you a packet with the offers.",
        ),
        p(
          "This rule has teeth. If a private offer is no more than 20 percent above Citizens’ price, the policy can’t stay with Citizens.",
          "If no offer that close comes in, you can stay.",
        ),
        p(
          "Pick an offer by the date on the form. If you don’t, Citizens picks the cheapest one for you.",
          "Once the policy moves, it’s final. There’s no longer a 30-day window to come back.",
        ),
        {
          kind: "figure",
          eyebrow: "The offer",
          title: "What happens when a private company offers to take a Citizens policy",
          reading: "Each card is one case. Find the one in the packet.",
          figure: {
            type: "zone-cards",
            labels: { lender: "Can the policy stay with Citizens?", build: "What to do" },
            cards: [
              {
                code: "1",
                name: "No offer",
                tone: "lower",
                means: "No private company asks for the policy this year.",
                lender: { mark: "yes", text: "Yes. It renews with Citizens." },
                build: "Read the renewal, and shop anyway.",
              },
              {
                code: "2",
                name: "An offer up to 20 percent more",
                tone: "highest",
                means: "A private company offers coverage for no more than 20 percent above Citizens’ price.",
                lender: { mark: "no", text: "No. The policy must move." },
                build: "Pick an offer by the date on the form, or Citizens picks the cheapest for you.",
              },
              {
                code: "3",
                name: "Only offers more than 20 percent more",
                tone: "high",
                means: "Every offer costs more than 20 percent above Citizens’ price.",
                lender: { mark: "yes", text: "Yes. You can choose to stay." },
                build: "Compare the offers with Citizens’ price before the date on the form.",
              },
            ],
          },
          source: { label: "Citizens Property Insurance Corporation, Personal lines depopulation; Citizens, Depopulation", href: CITIZENS_DEPOP_PL },
        },
      ],
      sources: [S.citizensWho, S.fs627351, S.citizensDepop, S.citizensDepopPl],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "the-flood-policy",
      title: "The flood policy",
      lead: "The flood zone decides whether your lender requires a flood policy. The house decides what FEMA’s policy costs.",
      blocks: [
        p(
          "If the house is in a high-risk zone and your mortgage comes from a government-backed lender, U.S. rules require flood insurance.",
          "In other zones it’s your choice. We suggest it anywhere on this coast.",
        ),
        p(
          "FEMA’s program no longer prices by zone. It looks at the house.",
          "How high does it sit? How far is it from water? What kinds of flooding can reach it? What would it cost to rebuild?",
        ),
        p(
          "An elevation certificate is a surveyor’s form that shows how high the house sits. You don’t need one to buy FEMA’s policy.",
          "But if it shows the floor is higher than FEMA assumed, the price can go down. Give it to your agent.",
        ),
        p(
          "Private flood policies are sold too. Florida law sets out the kinds, from one that matches FEMA’s to broader ones.",
          "A private policy can say whether it meets the lender’s rule. Get both quotes.",
        ),
        p("Our flood guide covers the zones, the certificate and the seller’s flood form in full."),
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
                title: "If your lender requires a flood policy",
                items: ["VE or AE: yes, with a mortgage from a government-backed lender", "X: not under U.S. rules, but a lender can still require it, and we suggest it"],
              },
              {
                eyebrow: "The house decides",
                title: "What FEMA’s flood policy costs",
                items: ["How high the floor sits", "How close the house is to water", "The kinds of flooding that can reach it", "What it would cost to rebuild", "An elevation certificate can lower it, if it shows a higher floor"],
              },
            ],
          },
          source: { label: "FEMA, Flood insurance; FEMA, NFIP’s pricing approach (Risk Rating 2.0); FEMA, Understanding elevation certificates", href: FEMA_RR2 },
        },
      ],
      sources: [S.femaFlood, S.rr2, S.uec, S.fs627715, S.cfoFlood],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "when-the-policies-start",
      title: "When the policies start, and when they can’t",
      lead: "A flood policy usually takes 30 days to start. And once a storm is coming, insurers stop writing new policies at all.",
      blocks: [
        p(
          "A new FEMA flood policy normally starts 30 days after you buy it.",
          "If you buy it as part of getting your mortgage, there’s no wait. It starts when the loan closes.",
          "If you’re paying cash, buy it at least 30 days before closing.",
        ),
        def("Bind", "When an insurer agrees in writing to cover you from a set date. Until a policy is bound, you’re not covered.", S.citizensBindingRule),
        p(
          "Now the stop. The trigger is a tropical storm or hurricane watch or warning. It can be for any part of Florida.",
          "When the National Weather Service issues one, Citizens stops binding. No new policies, and no coverage increases.",
          "It starts again when the suspension is lifted.",
        ),
        p(
          "That rule is Citizens’ own. Private companies set their own rules. Ask your agent what theirs are.",
          "A closing that needs a new policy can wait for the all-clear.",
        ),
        p("So in season, bind the policies early. The week the contract is signed is not too soon."),
        {
          kind: "figure",
          eyebrow: "Day by day",
          title: "A purchase in hurricane season, day by day",
          reading: "Read left to right from the day the contract is signed. The coral lines are the contract and the closing.",
          figure: {
            type: "timeline",
            max: 45,
            unit: "days",
            ticks: [
              { at: 0, label: "0" },
              { at: 15, label: "15" },
              { at: 30, label: "30" },
            ],
            markers: [
              { at: 0, label: "Contract signed" },
              { at: 45, label: "Closing" },
            ],
            lanes: [
              { label: "Get the roof permit, the wind report and the elevation certificate", sub: "The first week", start: 0, end: 7, series: 2, text: "Days 1 to 7" },
              { label: "Get quotes and bind the homeowners policy", sub: "Before any watch or warning", start: 7, end: 12, series: 0, text: "Bind" },
              { label: "Flood policy bought on its own", sub: "The 30-day wait", start: 12, end: 42, series: 1, hatched: true, text: "30 days" },
              { label: "Flood policy bought with the mortgage", sub: "No wait", start: 45, end: 45, series: 2, text: "Starts at closing" },
            ],
            legend: [
              { label: "Documents", series: 2 },
              { label: "Bound", series: 0 },
              { label: "Waiting", series: 1, hatched: true },
            ],
          },
          note: "The days are made up to show the order. A real contract sets its own dates. The 30-day wait is FEMA’s rule for a policy bought on its own.",
          source: { label: "The timeline is illustrative. The wait: 44 CFR 61.11; FloodSmart for agents, Flood insurance 101. The stop: Citizens’ binding suspension rule", href: CFR_61_11 },
        },
      ],
      sources: [S.cfr, S.fs101, S.wait, S.cfoFlood, S.citizensBindingRule, S.citizensBindingNotice],
    },

    /* ---- 08 ---------------------------------------------------------------- */
    {
      id: "before-you-make-an-offer",
      title: "Before you make an offer",
      lead: "Use this list each time you look at a house. Get the quotes before the offer, not after.",
      blocks: [
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Seven things to check before you make an offer",
          reading: "Go in order. Each step helps with the next one.",
          figure: {
            type: "checklist",
            items: [
              { text: "Get the permit for the last roof replacement", detail: "Its date is the roof’s age. Under 15 years is the line." },
              { text: "Ask for the wind mitigation report", detail: "If there isn’t one, order one. It’s good for up to five years." },
              { text: "Ask for the elevation certificate and look up the flood zone", detail: "The zone decides if your lender requires flood insurance. The certificate can lower the price." },
              { text: "Get a homeowners quote and two flood quotes", detail: "One from FEMA’s program and one private. Compare the hurricane deductibles too." },
              { text: "If the house has a Citizens policy, expect it to move", detail: "Read any offer against Citizens’ price. The line is 20 percent." },
              { text: "Check My Safe Florida Home", detail: "A free wind inspection, and a grant for some homes, when the program is open." },
              { text: "Bind before the first watch or warning", detail: "Buy the flood policy with your mortgage, or at least 30 days before closing if you’re paying cash." },
            ],
          },
          source: { label: "Each step comes from the section it sums up. The sources are listed there and at the end of this guide", href: OIR_WIND },
          tool: { tool: "contact", cta: "Send us an address" },
        },
      ],
      sources: [S.fs6277011, S.oirWind, S.uec, S.citizensDepopPl, S.msfh, S.cfr],
    },
  ],

  onOnePage: {
    title: "Your insurance notes for one house",
    reading: "Fill in the right side for the house you’re looking at.",
    rows: [
      { label: "Address", value: "Write it here" },
      { label: "Last roof permit", value: "Date, from the permit" },
      { label: "Roof age", value: "Years. Under 15 is the line" },
      { label: "Wind mitigation report", value: "Date, and the credits it shows" },
      { label: "Flood zone", value: "VE, AE or X" },
      { label: "Elevation certificate", value: "Lowest floor, compared with the flood height" },
      { label: "Homeowners quote", value: "And the hurricane deductible, in dollars" },
      { label: "Flood quotes", value: "One from FEMA’s program, one private" },
      { label: "Citizens policy on the house?", value: "Yes or no. If yes, expect an offer" },
      { label: "Policies bound by", value: "A date before closing, and before any watch" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Send us an address.",
    body: "We’ll ask for the roof permit, the wind report and the elevation certificate for that house and go through the quotes with you. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Ask about a house",
    tool: "contact",
  },
};
