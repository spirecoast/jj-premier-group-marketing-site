/**
 * Every string the relocation page shows, in one place so the fair-housing
 * check in lib/relocate/plan.test.ts can read them all. Facts and figures
 * stay in sources.ts; this file is the voice.
 */
import { COUNTIES, FACTS, SOURCES, type SourceId } from "./sources";

export const HERO = {
  eyebrow: "Relocating",
  title: "Moving here from somewhere else.",
  lead:
    "Many of the people we talk to are buying from a few states away, and the first visit is often the only one before the offer. So we pull the flood map, the roof age and the HOA file before you land, walk the house on video, and put every date on one page.",
  body: "Six questions, no email, and you get a dated plan: the contract deadlines the Florida form sets, the week insurance has to be bound, and the days the state gives you once you're here.",
};

export const QUESTIONS = {
  eyebrow: "Six questions",
  title: "Tell the planner what you know.",
  skipAll: "I'll just read",
  skipAllHint: "Shows a generic plan you can adjust later.",
  next: "Next",
  back: "Back",
  skip: "Skip this one",
  showPlan: "Show my plan",
  editAnswers: "Change my answers",
  live: "The plan below follows your answers as you change them.",
  folded: (n: number) => `${n} answers in. Not quite right?`,
  moveIn: { label: "When do you want to be in?", hint: "A target is enough. Everything else counts back from it." },
  path: {
    label: "Buying, or renting first?",
    options: { buying: "Buying", "renting-first": "Renting first", undecided: "Not sure yet" } as const,
  },
  homeToSell: {
    label: "Is there a home to sell first?",
    options: { yes: "Yes", no: "No", listed: "It's already listed" } as const,
  },
  fromState: { label: "Which state are you moving from?", other: "Outside the US" },
  work: {
    label: "Will you be working from here?",
    options: { remote: "Remotely", commute: "Driving somewhere", na: "Doesn't apply" } as const,
    commuteTo: { label: "Where to?", placeholder: "Downtown Sarasota, the airport, a hospital campus", hint: "Context for us, nothing more." },
  },
  county: {
    label: "Which county are you looking in?",
    hint: "Lakewood Ranch sits on the line, so this changes who pays for title.",
    options: { sarasota: "Sarasota", manatee: "Manatee", both: "Both, or not sure" } as const,
  },
  financing: { label: "Cash or financed?", options: { financed: "Financed", cash: "Cash" } as const },
  closingOffset: { label: "Days between closing and move-in", hint: "Zero means keys and movers the same day." },
};

export const PLAN = {
  eyebrow: "Your plan",
  title: "Every date, and the rule behind it.",
  genericTitle: "A plan to read, then adjust.",
  intro: "Dates come from the Florida contract's defaults and the state's own deadlines, each with its source. The planning rules are ours and say so. Nothing here is advice on your contract; that's a conversation.",
  basisLabel: "Why this date",
  sourceLabel: "Source",
  ourRule: "Our planning rule",
  askUs: "Ask us",
  rangePrefix: "Window",
  undated: "When you're ready",
  flags: {
    hurricaneSeason: "Hurricane season",
    nfip30: "Flood policy wait",
    forceMajeure: "Weather clause",
    homesteadNextYear: "Next cycle",
    portability: "Florida to Florida",
    askUs: "Ask us",
  } as const,
  documents: { eyebrow: "Documents to gather", title: "What to have in the folder." },
  county: { eyebrow: "Who customarily pays what", titlePrefix: "In" },
  countyBody: (name: string, custom: string) => `In ${name}, ${custom}. The deed's documentary stamp tax is customarily paid by the seller. All of it is negotiable, and the contract controls; custom only fills the silence.`,
  countyBoth: "Lakewood Ranch straddles the county line, so the first thing we'll ask is which side of it the house is on.",
  docStamps: `Documentary stamps run ${FACTS.docStamps.deedCentsPer100} cents per $100 on the deed and ${FACTS.docStamps.noteCentsPer100} cents per $100 on a mortgage note, statewide outside Miami-Dade. We'll put the actual figure on the estimate, not here.`,
  sources: { eyebrow: "Sources", title: "Where each date comes from.", checked: "Each one opened on" },
  useDates: "Use the dates in this plan",
};

export const EXPORTS = {
  eyebrow: "Take it with you",
  calendar: "Add to my calendar",
  calendarHint: "One event per dated step, with the source in the notes.",
  print: "Print this plan",
  printHint: "Prints clean, with the documents list.",
  copy: "Copy a link",
  copied: "Link copied",
  copyHint: "The answers travel in the address. No account.",
};

export type DifferentCard = { title: string; body: string; source: SourceId; guide?: { label: string; href: string } };

export const DIFFERENT = {
  eyebrow: "What's different here",
  title: "Three things that surprise people who move from away.",
  cards: [
    {
      title: "Property tax works off homestead",
      body: `Live in the home on January 1 and file by March 1, and the exemption and the assessment cap start that year. Miss January 1 and both wait a year. The seller's cap doesn't transfer; the home resets to just value on the first January 1 after you close.`,
      source: "dor-homestead",
    },
    {
      title: "Insurance is the second-biggest line, and it stops under a storm watch",
      body: "Homeowners, wind and flood are quoted separately, and the premium shapes the budget as much as the rate does. When a tropical storm or hurricane watch or warning is issued for any part of Florida, Citizens stops binding new policies until it lifts, and most carriers are reported to follow. We bind a week early.",
      source: "citizens-binding",
    },
    {
      title: "The contract is AS IS, with an inspection window",
      body: `The standard Florida form sells the home as it stands and gives you ${FACTS.contract.inspectionDays} days from the effective date, unless the blank is filled differently, to inspect and walk away with your deposit. What the inspection finds becomes a credit conversation, not a repair list.`,
      source: "frbar-asis",
      guide: { label: "What a good inspection covers", href: "/blog/inspections-on-the-suncoast-what-a-good-one-covers" },
    },
  ] satisfies DifferentCard[],
};

export const FROM_AWAY = {
  eyebrow: "How we work with you from away",
  title: "Here's what we'd do, before you ever get on a plane.",
  items: [
    {
      title: "Video walk-throughs, slowly",
      body: "We walk the house on video the way you would in person: the closets, the water heater, the view from the lanai at the hour you'd be sitting there, the street from the front door. You get the file, not a highlight reel.",
    },
    {
      title: "A written update after every step",
      body: "Inspection, appraisal, insurance, title: a short note after each one with what happened, what's next and the date it happens. You never have to ask where things stand from three time zones away.",
    },
    {
      title: "Closing without flying down",
      body: `Florida allows online notarization under its statutes (Florida Statutes 117.201 to 117.305), so a closing can be signed remotely when the title company and, if there's a loan, the lender accept it. We ask both early, and we'll say plainly if a trip is needed for the signing.`,
      source: "fs-117-ron" as SourceId,
    },
    {
      title: "Who signs what",
      body: "You sign the closing package; with a mortgage, that includes the note and the mortgage. The seller signs the deed. The title agent tells us which pages need a notary and which can be signed ahead, and we'll walk you through the stack before closing day.",
    },
  ],
  guide: { label: "Selling a home you don't live in", href: "/blog/selling-a-home-you-dont-live-in" },
  airport: { label: "Where SRQ flies nonstop", href: SOURCES["flysrq-nonstop"].url },
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
  eyebrow: "Tell us the timing",
  title: "Send us the plan, and we'll tell you what we'd change.",
  body: "The dates above are the form's defaults and the state's deadlines. Your contract will be negotiated, your sale may move the whole chain, and the storm season may or may not matter. Send it over and one of us will call or write back with what we'd do differently.",
  submit: "Send the plan",
  placeholder: "Anything the six questions didn't cover.",
};

export const FAQ_SECTION = { eyebrow: "Questions people ask first", title: "Asked before the first visit." };

/** Every string above, for the fair-housing check. */
export const RELOCATE_COPY: string[] = [
  ...Object.values(HERO),
  ...flatten(QUESTIONS),
  ...flatten(PLAN),
  ...Object.values(EXPORTS),
  DIFFERENT.eyebrow,
  DIFFERENT.title,
  ...DIFFERENT.cards.flatMap((c) => [c.title, c.body, c.guide?.label ?? ""]),
  FROM_AWAY.eyebrow,
  FROM_AWAY.title,
  ...FROM_AWAY.items.flatMap((i) => [i.title, i.body]),
  FROM_AWAY.guide.label,
  FROM_AWAY.airport.label,
  ...FAQS.flatMap((f) => [f.q, f.answer]),
  ...Object.values(ASK),
  ...Object.values(FAQ_SECTION),
  QUESTIONS.folded(6),
  PLAN.countyBody(COUNTIES.sarasota.name, COUNTIES.sarasota.titleCustom),
  PLAN.countyBody(COUNTIES.manatee.name, COUNTIES.manatee.titleCustom),
].filter(Boolean);

function flatten(o: unknown): string[] {
  if (typeof o === "string") return [o];
  if (typeof o === "function") return [];
  if (o && typeof o === "object") return Object.values(o).flatMap(flatten);
  return [];
}
