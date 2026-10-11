/**
 * Every string the relocation page shows, in one place so the fair-housing
 * check in lib/relocate/plan.test.ts can read them all. Facts and figures
 * stay in sources.ts; this file is the voice.
 */
import { COUNTIES, FACTS, type SourceId } from "./sources";

export const HERO = {
  title: "Plan your move",
  lead: "Answer five questions and get every date and deadline for your move to Lakewood Ranch, Sarasota or Bradenton on one page.",
};

export const QUESTIONS = {
  title: "Five questions",
  skipAll: "Skip to a sample plan",
  next: "Next",
  back: "Back",
  skip: "Skip",
  showPlan: "Show my plan",
  editAnswers: "Change answers",
  live: "Your plan updates as you change an answer.",
  folded: (n: number) => `${n} answers in.`,
  moveIn: { label: "When do you want to move in?", hint: "A target date is fine." },
  path: {
    label: "Are you buying or renting first?",
    options: { buying: "Buying", "renting-first": "Renting first", undecided: "Not sure yet" } as const,
  },
  homeToSell: {
    label: "Do you have a home to sell?",
    options: { yes: "Yes", no: "No", listed: "It’s already listed" } as const,
  },
  fromState: { label: "Where are you moving from?", other: "Outside the US" },
  county: {
    label: "Where are you looking?",
    hint: "Lakewood Ranch is in both counties.",
    options: { sarasota: "Sarasota County", manatee: "Manatee County", both: "Both, or not sure" } as const,
  },
  financing: { label: "Mortgage or cash?", options: { financed: "Mortgage", cash: "Cash" } as const },
  closingOffset: {
    label: "How long between closing and moving in?",
    options: [
      { value: 0, label: "Same day" },
      { value: 7, label: "About a week" },
      { value: 14, label: "Two weeks" },
      { value: 30, label: "A month" },
      { value: 60, label: "Two months" },
    ],
  },
};

export const PLAN = {
  title: "Your move plan",
  genericTitle: "A sample move plan",
  intro: "Dates follow the standard Florida contract and the state’s own deadlines. Open any step to see why.",
  keyDates: "Key dates",
  basisLabel: "Why this date",
  sourceLabel: "Source",
  ourRule: "Our planning rule",
  askUs: "Ask us",
  rangePrefix: "Window",
  undated: "When you’re ready",
  flags: {
    hurricaneSeason: "Hurricane season",
    nfip30: "Flood policy wait",
    forceMajeure: "Weather clause",
    homesteadNextYear: "Next cycle",
    portability: "Florida to Florida",
    askUs: "Ask us",
  } as const,
  documents: { title: "Documents to gather" },
  county: { titlePrefix: "Who pays what in" },
  countyBody: (name: string, custom: string) => `In ${name}, ${custom}. The deed's documentary stamp tax is customarily paid by the seller. All of it is negotiable, and the contract controls; custom only fills the silence.`,
  countyBoth: "Lakewood Ranch straddles the county line, so the first thing we'll ask is which side of it the house is on.",
  docStamps: `Documentary stamps run ${FACTS.docStamps.deedCentsPer100} cents per $100 on the deed and ${FACTS.docStamps.noteCentsPer100} cents per $100 on a mortgage note, statewide outside Miami-Dade. We'll put the actual figure on the estimate, not here.`,
  sources: { title: "Sources", checked: "Checked" },
  useDates: "Use the dates in this plan",
};

export const EXPORTS = {
  label: "Save or share this plan",
  calendar: "Add to calendar",
  print: "Print",
  copy: "Copy link",
  copied: "Link copied",
};

export type FaqCopy = { q: string; answer: string; source: SourceId };

export const FAQS: FaqCopy[] = [
  {
    q: "How soon do I need a Florida driver license and plates?",
    answer: `Once you've established residency, Florida gives you ${FACTS.residency.licenseDays} days for the driver license and ${FACTS.residency.vehicleDays} days to title and register each vehicle. Residency starts when you begin a job, register to vote, file for homestead, or have lived here more than ${FACTS.residency.consecutiveMonths} consecutive months, whichever comes first.`,
    source: "flhsmv-new-resident",
  },
  {
    q: "If I close in February, when does homestead start?",
    answer: "You have to own and live in the home on January 1 and file with the property appraiser by March 1 of that year. A February closing misses that January 1, so your first homestead year is the following one; the planner above works out which. Until then the bill runs on the seller's assessment, and the home resets to just value on the next January 1.",
    source: "dor-homestead",
  },
  {
    q: "Who pays for the owner's title policy?",
    answer: "By custom, the buyer in Sarasota County and the seller in Manatee County, and whoever pays chooses the title agent. It's a custom, not a law, and the contract can say otherwise. Lakewood Ranch sits on the county line, so the answer depends on which side the house is on.",
    source: "barnes-walker-title",
  },
  {
    q: "Can I close without flying down?",
    answer: "Often. Florida law allows online notarization (Florida Statutes 117.201 to 117.305), so the closing package can be signed remotely when the title company and, if there's a loan, the lender accept it. We ask both at the start, and we'll tell you plainly if a trip is needed.",
    source: "fs-117-ron",
  },
  {
    q: "What happens to my closing if a storm is named?",
    answer: `When a tropical storm or hurricane watch or warning is issued for any part of Florida, Citizens stops binding new policies until it lifts, and most carriers are reported to follow similar rules. If a storm stops either side performing, the standard contract extends the deadlines up to ${FACTS.contract.forceMajeureExtensionDays} days after it clears, and if that runs more than ${FACTS.contract.forceMajeureTerminateDays} days past the closing date, either side may cancel. We bind insurance a week early for exactly this reason.`,
    source: "citizens-binding",
  },
  {
    q: "I'm paying cash. Do I still need to plan for flood insurance?",
    answer: `Yes, and earlier than a financed buyer. A new NFIP policy usually takes ${FACTS.nfip.waitDays} days to start unless it's bought in connection with a loan closing, so a cash buyer orders it a month before closing. Within ${FACTS.nfip.mapRevisionMonths} months of a flood map revision the wait is ${FACTS.nfip.mapRevisionWaitDays} day instead. Sellers also have to disclose past flood claims and federal flood assistance in writing at or before the contract.`,
    source: "fema-nfip-wait",
  },
];

export const ASK = {
  title: "Send us your plan",
  body: "We'll look at your dates and tell you what we'd change. One of us will call or write back.",
  submit: "Send my plan",
  placeholder: "Anything else we should know?",
};

export const FAQ_SECTION = { title: "Common questions about moving here" };

/** Every string above, for the fair-housing check. */
export const RELOCATE_COPY: string[] = [
  ...Object.values(HERO),
  ...flatten(QUESTIONS),
  ...flatten(PLAN),
  ...Object.values(EXPORTS),
  ...FAQS.flatMap((f) => [f.q, f.answer]),
  ...Object.values(ASK),
  ...Object.values(FAQ_SECTION),
  QUESTIONS.folded(5),
  PLAN.countyBody(COUNTIES.sarasota.name, COUNTIES.sarasota.titleCustom),
  PLAN.countyBody(COUNTIES.manatee.name, COUNTIES.manatee.titleCustom),
].filter(Boolean);

function flatten(o: unknown): string[] {
  if (typeof o === "string") return [o];
  if (typeof o === "function") return [];
  if (o && typeof o === "object") return Object.values(o).flatMap(flatten);
  return [];
}
