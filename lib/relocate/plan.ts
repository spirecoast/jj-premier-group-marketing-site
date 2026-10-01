/**
 * The relocation planner. Pure: six answers in, a dated plan out. No clock,
 * no window, no fetch, so it runs the same on the server, in the browser,
 * in the ICS route and under `node --test`.
 *
 * Two chains hang off the move-in date. Backward: closing, insurance bound,
 * the contract dates the Florida AS IS form sets when a blank is left empty,
 * the visit trip and the pre-approval. Forward: the days Florida gives a new
 * resident, and the homestead cycle the move-in lands in. Every figure comes
 * from lib/relocate/sources.ts; every date is computed from the answers.
 */
import { COUNTIES, FACTS, SOURCES, type CountyNote, type Source, type SourceId } from "./sources";
import { isStateCode, stateName } from "./states";

export type Path = "buying" | "renting-first" | "undecided";
export type HomeToSell = "yes" | "no" | "listed";
export type Work = "remote" | "commute" | "na";
export type County = "sarasota" | "manatee" | "both";
export type Financing = "cash" | "financed";

export type Answers = {
  /** Target move-in, YYYY-MM-DD. */
  moveInDate: string;
  path: Path;
  homeToSell: HomeToSell;
  /** A US state code, or "other". */
  fromState: string;
  work: Work;
  /** Free text, context only: where the commute goes. */
  commuteTo?: string;
  county: County;
  financing: Financing;
  /** Days between closing and move-in, 0 to 7. */
  closingOffset: number;
};

export type Phase = "before" | "contract" | "closing" | "after";

export type MilestoneFlag = "hurricaneSeason" | "nfip30" | "forceMajeure" | "homesteadNextYear" | "portability" | "askUs";

export type Milestone = {
  id: string;
  phase: Phase;
  /** The day, or the deadline when there is a range. Absent for "when you're ready" items. */
  date?: string;
  dateRange?: { start: string; end: string };
  title: string;
  body: string;
  /** The rule behind the date, in words. */
  basis: string;
  /** Absent when the date is a planning rule of ours rather than a cited fact. */
  source?: Source;
  flags: MilestoneFlag[];
  /** A place on the site to go next (Atlas match, the Encore visit planner). */
  link?: { label: string; href: string };
};

export type Callout = {
  id: "hurricane" | "nfip" | "forceMajeure" | "homestead" | "assessment" | "portability" | "undecided" | "renting" | "tight";
  title: string;
  body: string;
  source: Source;
};

export type HomesteadCycle = {
  /** The January 1 you must own and live in the home by. */
  ownAndResideBy: string;
  /** The March 1 filing deadline for that cycle. */
  fileBy: string;
  /** The first tax year the exemption and the cap apply to. */
  exemptionYear: number;
  /** True when the move-in lands after a January 1, so that year's cycle is missed. */
  pushedAYear: boolean;
  /** Days after the January 1 that was just missed, when it was close. */
  missedByDays: number;
};

export type Plan = {
  answers: Answers;
  today: string;
  milestones: Milestone[];
  callouts: Callout[];
  homestead: HomesteadCycle;
  counties: CountyNote[];
  documents: string[];
  /** Plain text for the lead form and the share sheet. */
  summary: string;
};

/* ----------------------------------------------------------------------------
   Dates. ISO day strings and UTC arithmetic, so a plan never depends on the
   visitor's clock or timezone.
   ---------------------------------------------------------------------------- */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(s: unknown): s is string {
  if (typeof s !== "string") return false;
  const m = ISO.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const dt = new Date(t);
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function parseISO(iso: string): { y: number; m: number; d: number } {
  const m = ISO.exec(iso);
  if (!m) throw new Error(`Not a date: ${iso}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function toISO(y: number, m: number, d: number): string {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISO(iso);
  return toISO(y, m, d + days);
}

export function addMonths(iso: string, months: number): string {
  const { y, m, d } = parseISO(iso);
  return toISO(y, m + months, d);
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  const pa = parseISO(a);
  const pb = parseISO(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86_400_000);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function formatDate(iso: string, style: "short" | "long" = "short"): string {
  const { y, m, d } = parseISO(iso);
  return style === "long" ? `${MONTHS_LONG[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function inHurricaneSeason(iso: string): boolean {
  const { m, d } = parseISO(iso);
  const { startMonth, startDay, endMonth, endDay } = FACTS.hurricane;
  const after = m > startMonth || (m === startMonth && d >= startDay);
  const before = m < endMonth || (m === endMonth && d <= endDay);
  return after && before;
}

/* ----------------------------------------------------------------------------
   Answers.
   ---------------------------------------------------------------------------- */

export const PATHS: Path[] = ["buying", "renting-first", "undecided"];
export const HOME_TO_SELL: HomeToSell[] = ["yes", "no", "listed"];
export const WORKS: Work[] = ["remote", "commute", "na"];
export const COUNTY_CHOICES: County[] = ["sarasota", "manatee", "both"];
export const FINANCINGS: Financing[] = ["cash", "financed"];

export function isPath(v: unknown): v is Path {
  return PATHS.includes(v as Path);
}
export function isHomeToSell(v: unknown): v is HomeToSell {
  return HOME_TO_SELL.includes(v as HomeToSell);
}
export function isWork(v: unknown): v is Work {
  return WORKS.includes(v as Work);
}
export function isCounty(v: unknown): v is County {
  return COUNTY_CHOICES.includes(v as County);
}
export function isFinancing(v: unknown): v is Financing {
  return FINANCINGS.includes(v as Financing);
}

/** The generic plan: the first of the month about four months out, buying undecided, both counties. */
export function defaultAnswers(today: string): Answers {
  const { y, m } = parseISO(today);
  return {
    moveInDate: toISO(y, m + 4, 1),
    path: "undecided",
    homeToSell: "no",
    fromState: "other",
    work: "na",
    county: "both",
    financing: "financed",
    closingOffset: 3,
  };
}

/** Clamp anything odd into a plan the builder can draw. */
export function normalizeAnswers(a: Partial<Answers>, today: string): Answers {
  const d = defaultAnswers(today);
  const offset = Number.isFinite(a.closingOffset) ? Math.min(FACTS.planning.closingOffsetMax, Math.max(0, Math.round(a.closingOffset as number))) : d.closingOffset;
  const commuteTo = typeof a.commuteTo === "string" ? a.commuteTo.replace(/\s+/g, " ").trim().slice(0, 80) : "";
  return {
    moveInDate: isISODate(a.moveInDate) ? a.moveInDate : d.moveInDate,
    path: isPath(a.path) ? a.path : d.path,
    homeToSell: isHomeToSell(a.homeToSell) ? a.homeToSell : d.homeToSell,
    fromState: isStateCode(a.fromState) ? a.fromState : "other",
    work: isWork(a.work) ? a.work : d.work,
    ...(commuteTo ? { commuteTo } : {}),
    county: isCounty(a.county) ? a.county : d.county,
    financing: isFinancing(a.financing) ? a.financing : d.financing,
    closingOffset: offset,
  };
}

/* ----------------------------------------------------------------------------
   The homestead cycle.
   ---------------------------------------------------------------------------- */

export function homesteadCycle(moveInDate: string): HomesteadCycle {
  const { y, m, d } = parseISO(moveInDate);
  const onJan1 = m === 1 && d === 1;
  const exemptionYear = onJan1 ? y : y + 1;
  const jan1 = toISO(y, 1, 1);
  return {
    ownAndResideBy: toISO(exemptionYear, 1, 1),
    fileBy: toISO(exemptionYear, FACTS.homestead.fileByMonth, FACTS.homestead.fileByDay),
    exemptionYear,
    pushedAYear: !onJan1,
    missedByDays: onJan1 ? 0 : daysBetween(jan1, moveInDate),
  };
}

/* ----------------------------------------------------------------------------
   The plan.
   ---------------------------------------------------------------------------- */

const src = (id: SourceId): Source => SOURCES[id];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/** The exemption as the Department of Revenue states it (PT-113). */
export const HOMESTEAD_AMOUNTS = `The first ${usd(FACTS.homestead.exemptFirst)} of assessed value is exempt from all property taxes, including school taxes. A second exemption of up to ${usd(FACTS.homestead.additionalExemption)} applies to the assessed value between ${usd(FACTS.homestead.additionalBand.from)} and ${usd(FACTS.homestead.additionalBand.to)} and doesn't apply to school taxes; that second amount has been adjusted for inflation since ${FACTS.homestead.additionalIndexedSince}.`;

const PHASE_ORDER: Record<Phase, number> = { before: 0, contract: 1, closing: 2, after: 3 };

/** A move-in this soon after January 1 gets the "you just missed it, ask the seller" treatment. */
export const HOMESTEAD_NEAR_MISS_DAYS = 60;

/** True when the inspection period would end after the day insurance should be bound. */
export function inspectionRunsPastBind(inspectionEnd: string, bindBy: string): boolean {
  return inspectionEnd > bindBy;
}

export function countiesFor(county: County): CountyNote[] {
  return county === "both" ? [COUNTIES.sarasota, COUNTIES.manatee] : [COUNTIES[county]];
}

function fromLabel(code: string): string {
  return code === "other" ? "outside the US states" : stateName(code);
}

function countyLabel(county: County): string {
  return county === "both" ? "Sarasota or Manatee County" : COUNTIES[county].name;
}

export function buildPlan(input: Partial<Answers>, today: string): Plan {
  const a = normalizeAnswers(input, today);
  const P = FACTS.planning;
  const C = FACTS.contract;
  const financed = a.financing === "financed";
  const buying = a.path !== "renting-first";
  const moveIn = a.moveInDate;
  const closing = addDays(moveIn, -a.closingOffset);
  const bindBy = addDays(closing, -P.bindBeforeClosingDays);
  const contractDays = financed ? P.financedContractDays : P.cashContractDays;
  const effective = addDays(closing, -contractDays.max);
  const inspection = addDays(effective, C.inspectionDays);
  const loanApplication = addDays(effective, C.loanApplicationDays);
  const loanApproval = addDays(effective, C.loanApprovalDays);
  const floodElevation = addDays(effective, C.floodElevationDays);
  const titleEvidenceDays = financed ? C.titleEvidenceDaysBeforeClosing : C.titleEvidenceDaysBeforeClosingCash;
  const titleEvidence = addDays(closing, -titleEvidenceDays);
  const visitStart = addDays(effective, -P.visitBeforeEffectiveDays.max);
  const visitEnd = addDays(effective, -P.visitBeforeEffectiveDays.min);
  const preapproval = addDays(visitStart, -P.preapprovalBeforeVisitDays);
  const listStart = addDays(moveIn, -P.listHomeBeforeTargetDays.max);
  const listEnd = addDays(moveIn, -P.listHomeBeforeTargetDays.min);
  const vehicles = addDays(moveIn, FACTS.residency.vehicleDays);
  const license = addDays(moveIn, FACTS.residency.licenseDays);
  const homestead = homesteadCycle(moveIn);
  const counties = countiesFor(a.county);
  const seasonAtClosing = inHurricaneSeason(closing) || inHurricaneSeason(bindBy);

  const commuteLine =
    a.work === "commute"
      ? a.commuteTo
        ? ` If you'll be driving to ${a.commuteTo}, we'll do that drive together at the hour you'd do it.`
        : " If you'll be commuting, we'll drive it together at the hour you'd do it."
      : "";

  const ms: Milestone[] = [];

  /* Before: selling, pre-approval, the visit. */
  if (a.homeToSell === "yes") {
    ms.push({
      id: "list-home",
      phase: "before",
      date: listStart,
      dateRange: { start: listStart, end: listEnd },
      title: "List the home you're selling",
      body: "The sale sets the budget and the dates on this side, so it goes first. We'd rather talk this one through than hand you a rule; the right week depends on the market you're selling in.",
      basis: `${P.listHomeBeforeTargetDays.min} to ${P.listHomeBeforeTargetDays.max} days before the target move-in, as a starting point. Ask us.`,
      flags: ["askUs"],
    });
  } else if (a.homeToSell === "listed") {
    ms.push({
      id: "listed-home",
      phase: "before",
      title: "Line up the two closings",
      body: "Your home is already on the market. When it goes under contract, send us the closing date and we'll plan the buy side around it, so you're not carrying two homes or none.",
      basis: "No date yet. It comes from the contract on the home you're selling.",
      flags: ["askUs"],
    });
  }

  if (buying && financed) {
    ms.push({
      id: "preapproval",
      phase: "before",
      date: preapproval,
      title: "Pre-approval letter from a local lender",
      body: "A seller here reads the pre-approval before the price. A local lender also knows which insurers are writing in which zip codes, which matters later.",
      basis: `${P.preapprovalBeforeVisitDays} days before the visit trip, our planning rule, so it's in hand when you see the house.`,
      flags: [],
    });
  }

  ms.push(
    buying
      ? {
          id: "visit",
          phase: "before",
          date: visitStart,
          dateRange: { start: visitStart, end: visitEnd },
          title: "The visit trip",
          body: `We walk the shortlist on video before you fly, so the trip is for the few worth standing in. Plan on writing the offer while you're here or the week after.${commuteLine}`,
          basis: `${P.visitBeforeEffectiveDays.min / 7} to ${P.visitBeforeEffectiveDays.max / 7} weeks before the contract's effective date, our planning rule, so an accepted offer lands on the dates below.`,
          flags: [],
          link: { label: "Plan the visit with Encore", href: "/calendar/plan" },
        }
      : {
          id: "visit",
          phase: "before",
          title: "The visit trip",
          body: `We walk the places on video first and plan one trip around the ones worth seeing. Renting first means the contract dates below don't apply yet; when you're ready to buy, switch the answer and they appear.${commuteLine}`,
          basis: "No fixed date on a rental. Ask us and we'll pick the week together.",
          flags: ["askUs"],
          link: { label: "Plan the visit with Encore", href: "/calendar/plan" },
        },
  );

  /* Contract: the dates the AS IS form sets when a blank is left empty. */
  if (buying) {
    ms.push(
      {
        id: "effective",
        phase: "contract",
        date: effective,
        dateRange: { start: effective, end: addDays(closing, -contractDays.min) },
        title: "Contract effective date",
        body: `The day both sides have signed. Every deadline below counts from it. ${financed ? "A financed contract usually needs the longer end of the window, so we plan to it." : "A cash contract can close faster, but thirty days gives the inspection, the insurance quote and the flood policy's waiting period room."}`,
        basis: financed
          ? `${contractDays.min} to ${contractDays.max} days before closing on a financed contract. We plan to the longer end.`
          : `${contractDays.max} days before closing, our planning rule: thirty days gives the inspection, the insurance quote and the NFIP wait room. A shorter close is possible; ask us.`,
        source: src(C.source),
        flags: [],
      },
      {
        id: "flood-disclosure",
        phase: "contract",
        date: effective,
        title: "Read the seller's flood disclosure",
        body: "Florida sellers must say in writing, at or before the contract, whether they've filed a flood claim on the home or received federal flood assistance for it. We read it with you before you sign.",
        basis: `Florida Statutes 689.302, in force since ${formatDate(FACTS.floodDisclosure.effective, "long")}. Due at or before the contract.`,
        source: src(FACTS.floodDisclosure.source),
        flags: [],
      },
    );
    if (financed) {
      ms.push({
        id: "loan-application",
        phase: "contract",
        date: loanApplication,
        title: "Loan application in",
        body: "Your lender needs the signed contract to start the file. Send it the day it's signed and this one takes care of itself.",
        basis: `${C.loanApplicationDays} days after the effective date, the contract default when the blank is left empty.`,
        source: src(C.source),
        flags: [],
      });
    }
    ms.push({
      id: "inspection",
      phase: "contract",
      date: inspection,
      title: "Inspection period ends",
      body: "The inspector, the termite inspector and, on older homes, the four-point and wind mitigation reports your insurer will want. If you're cancelling, the written notice has to be delivered inside this window.",
      basis: `${C.inspectionDays} days after the effective date, the contract default when the blank is left empty.`,
      source: src(C.source),
      flags: [],
    });
    ms.push({
      id: "flood-elevation",
      phase: "contract",
      date: floodElevation,
      title: "Flood elevation check",
      body: "The contract gives you a window to confirm the home's elevation against the flood map and walk away if it's below the base flood elevation. We order it with the inspection so there's time.",
      basis: `${C.floodElevationDays} days after the effective date, the contract default when the blank is left empty.`,
      source: src(C.source),
      flags: [],
    });
    if (financed) {
      ms.push({
        id: "loan-approval",
        phase: "contract",
        date: loanApproval,
        title: "Loan approval",
        body: "The appraisal is in and the underwriter has signed off. If the approval isn't there by this date, the contract spells out what each side can do, and we'll have talked about it before then.",
        basis: `${C.loanApprovalDays} days after the effective date, the contract default when the blank is left empty.`,
        source: src(C.source),
        flags: [],
      });
    } else {
      ms.push({
        id: "nfip-order",
        phase: "contract",
        date: effective,
        title: "Order the flood policy",
        body: `Paying cash means no lender closing to tie the flood policy to, so a new NFIP policy sits in a waiting period before it starts. Order it the day you go under contract; the policy starts ${FACTS.nfip.waitDays} days later.`,
        basis: `On the effective date, because the usual NFIP waiting period is ${FACTS.nfip.waitDays} days when a policy isn't bought in connection with a loan closing. Ordered that day, it's running by closing.`,
        source: src(FACTS.nfip.source),
        flags: ["nfip30"],
      });
    }
    ms.push({
      id: "title-evidence",
      phase: "contract",
      date: titleEvidence,
      title: "Title evidence delivered",
      body: "The title commitment, showing who owns the home and what's recorded against it. Read the exceptions page; that's where easements and old liens live.",
      basis: financed
        ? `${C.titleEvidenceDaysBeforeClosing} days before closing, the contract default (paragraph 9(c)) when the blank is left empty.`
        : `${C.titleEvidenceDaysBeforeClosingCash} days before closing: the contract default (paragraph 9(c)) when the cash box in paragraph 8(a) is checked.`,
      source: src(C.source),
      flags: [],
    });

    /* Closing. */
    ms.push(
      {
        id: "bind-by",
        phase: "closing",
        date: bindBy,
        title: "Insurance bound",
        body: `Homeowners, wind if it's separate, and flood. ${financed ? "A flood policy bought for a loan closing starts at closing with no wait." : "The flood policy was ordered above, so it's already running."} Bound a week early because a storm watch anywhere in Florida stops new policies being written.`,
        basis: `${P.bindBeforeClosingDays} days before closing, our planning rule. Under a tropical storm or hurricane watch or warning, Citizens may not bind new coverage, and most carriers are reported to follow similar rules.`,
        source: src("citizens-binding"),
        flags: inHurricaneSeason(bindBy) ? ["hurricaneSeason"] : [],
      },
      {
        id: "closing",
        phase: "closing",
        date: closing,
        title: "Closing day",
        body: `Walk-through in the morning, signing after. ${a.closingOffset === 0 ? "You've set move-in for the same day; the keys come at the table." : `You've left ${a.closingOffset} ${a.closingOffset === 1 ? "day" : "days"} between closing and move-in, which gives the movers a margin.`}`,
        basis: `${a.closingOffset} ${a.closingOffset === 1 ? "day" : "days"} before move-in, your choice above. If a storm or flood stops either side performing, the contract extends the dates up to ${C.forceMajeureExtensionDays} days after it clears; past ${C.forceMajeureTerminateDays} days beyond the closing date, either side may cancel.`,
        source: src(C.source),
        flags: inHurricaneSeason(closing) ? ["hurricaneSeason", "forceMajeure"] : [],
      },
    );
  }

  /* After: becoming a Floridian. */
  ms.push(
    {
      id: "move-in",
      phase: "after",
      date: moveIn,
      title: "Move-in day",
      body: "Utilities in your name, mail forwarded, and the first night in the house. Everything below counts from today.",
      basis: "Your target date. Driver license, vehicle and homestead clocks all start when you establish residency.",
      source: src(FACTS.residency.source),
      flags: [],
      link: { label: "Find your neighborhood with Atlas", href: "/neighborhoods/match" },
    },
    {
      id: "vehicles",
      phase: "after",
      date: vehicles,
      title: "Title and register your vehicles",
      body: "Florida title and plates for each car. Bring the out-of-state title, or the lienholder's details if there's a loan, and proof of Florida insurance.",
      basis: `${FACTS.residency.vehicleDays} days after establishing residency, per FLHSMV.`,
      source: src(FACTS.residency.source),
      flags: [],
    },
    {
      id: "license",
      phase: "after",
      date: license,
      title: "Florida driver license",
      body: "Residency starts when you begin a job, register to vote, file for homestead, or have lived here more than six consecutive months, whichever comes first. The license follows within a month of that.",
      basis: `${FACTS.residency.licenseDays} days after establishing residency, per FLHSMV.`,
      source: src(FACTS.residency.source),
      flags: [],
    },
    {
      id: "voter",
      phase: "after",
      title: "Register to vote",
      body: `You can register at the license office or online. The books close ${FACTS.voter.daysBeforeElection} days before each election, so check the state's calendar for the next date rather than assuming.`,
      basis: `No deadline of its own: registration closes ${FACTS.voter.daysBeforeElection} days before an election, and the state calendar has the dates.`,
      source: src(FACTS.voter.source),
      flags: [],
    },
    {
      id: "domicile",
      phase: "after",
      title: "Declaration of domicile (optional)",
      body: `A sworn statement that Florida is now home, recorded with the ${counties.length === 1 ? counties[0]!.clerk.label : "county clerk"}. Not required, and not the homestead filing; that's a separate form with the property appraiser. The clerk's fee sheet has the recording cost.`,
      basis: "Florida Statutes 222.17. No deadline; signed before a notary or a deputy clerk and recorded with the clerk.",
      source: src("fs-222-17"),
      flags: [],
    },
  );

  if (buying) {
    ms.push({
      id: "homestead",
      phase: "after",
      date: homestead.fileBy,
      dateRange: { start: homestead.ownAndResideBy, end: homestead.fileBy },
      title: `File for homestead by ${formatDate(homestead.fileBy, "long")}`,
      body: `You have to own the home and live in it on ${formatDate(homestead.ownAndResideBy, "long")}, then file with the ${counties.length === 1 ? counties[0]!.pao.label : "county property appraiser"} by March 1. That makes ${homestead.exemptionYear} your first homestead year, and the assessment cap starts the year after.`,
      basis: `Own and reside by January 1, file by March 1 of the year the exemption is first sought. Moving in ${formatDate(moveIn)} lands in the ${homestead.exemptionYear} cycle.`,
      source: src(FACTS.homestead.source),
      flags: homestead.pushedAYear && homestead.missedByDays <= HOMESTEAD_NEAR_MISS_DAYS ? ["homesteadNextYear"] : [],
    });
    if (a.fromState === "FL") {
      ms.push({
        id: "portability",
        phase: "after",
        date: homestead.fileBy,
        title: "Carry over your Save Our Homes benefit",
        body: `You're moving from a Florida homestead, so the difference between its market and assessed value can move with you. File the portability form with the homestead application, within three years of January 1 of the year you left the old home.`,
        basis: `${FACTS.portability.forms} by March 1; within ${FACTS.portability.years} years of January 1 of the year the old homestead was abandoned; capped at $${FACTS.portability.cap.toLocaleString("en-US")} under Florida Statutes 193.155(8).`,
        source: src(FACTS.portability.source),
        flags: ["portability"],
      });
    }
  } else {
    ms.push({
      id: "homestead-later",
      phase: "after",
      title: "Homestead, when you buy",
      body: "Renting first means no homestead yet. When you buy, the rule is: own and live in the home by January 1, file by March 1, and that's your first homestead year. We'll recompute it the day you go under contract.",
      basis: "Own and reside by January 1, file by March 1 of the year the exemption is first sought.",
      source: src(FACTS.homestead.source),
      flags: [],
    });
  }

  if (a.fromState !== "FL") {
    ms.push({
      id: "prior-state",
      phase: "after",
      title: a.fromState === "other" ? "Close things out where you're coming from" : `Close things out in ${stateName(a.fromState)}`,
      body: `${a.fromState === "other" ? "Where you're coming from" : stateName(a.fromState)} has its own rules on returning plates and licenses and on any property-tax exemption you had there. We don't track those here; put them on your list for the month after you land.`,
      basis: "No Florida deadline. The prior state sets its own.",
      flags: ["askUs"],
    });
  }

  ms.push({
    id: "insurance-renewal",
    phase: "after",
    title: "Re-shop the insurance at the first renewal",
    body: "The policy you bound for closing was the one that could be written in time. A year in, with the wind mitigation report in hand, it's worth quoting again.",
    basis: "Our checklist, not a deadline.",
    flags: [],
  });

  /* Flag every dated milestone that lands in hurricane season. */
  for (const m of ms) {
    if (m.date && inHurricaneSeason(m.date) && !m.flags.includes("hurricaneSeason") && (m.phase === "contract" || m.phase === "closing")) {
      m.flags.push("hurricaneSeason");
    }
  }

  const milestones = sortMilestones(ms);

  /* Callouts: plain paragraphs the plan shows once. */
  const callouts: Callout[] = [];
  if (a.path === "undecided") {
    callouts.push({
      id: "undecided",
      title: "We drew the buying version",
      body: "You said undecided, so the plan shows the contract and closing dates. If you rent first, those two phases drop away and the move-in chain is all that's left. Change the answer and the plan redraws.",
      source: src(C.source),
    });
  }
  if (!buying) {
    callouts.push({
      id: "renting",
      title: "Renting first",
      body: "No contract dates yet, so this plan is the move-in chain: vehicles, license, voter registration, and the homestead rule for when you buy. Switch to buying and the contract dates appear.",
      source: src(FACTS.residency.source),
    });
  }
  if (buying && seasonAtClosing) {
    callouts.push({
      id: "hurricane",
      title: `Your closing lands in hurricane season`,
      body: `Season runs June 1 to November 30. When a tropical storm or hurricane watch or warning is issued for any part of Florida, Citizens stops writing new policies until it lifts, and most carriers are reported to do the same. That's why insurance is bound ${P.bindBeforeClosingDays} days early here, and why the contract carries a weather extension.`,
      source: src("citizens-binding"),
    });
    callouts.push({
      id: "forceMajeure",
      title: "If a storm interrupts",
      body: `The contract's force majeure clause extends the deadlines up to ${C.forceMajeureExtensionDays} days after the event stops preventing performance. If it runs more than ${C.forceMajeureTerminateDays} days past the closing date, either side may cancel. The contract also extends closing when hazard, wind, flood or homeowners' insurance can't be bought.`,
      source: src(C.source),
    });
  }
  if (buying && inspectionRunsPastBind(inspection, bindBy)) {
    callouts.push({
      id: "tight",
      title: "The inspection runs past the insurance date",
      body: `With these dates the inspection period ends ${formatDate(inspection, "long")}, after insurance should be bound on ${formatDate(bindBy, "long")}. Either shorten the inspection period in the contract, bind the day the inspection clears, or move closing. Ask us before the offer is written.`,
      source: src(C.source),
    });
  }
  if (buying && !financed) {
    callouts.push({
      id: "nfip",
      title: "Cash buyers: the flood policy has a waiting period",
      body: `A new NFIP policy usually takes ${FACTS.nfip.waitDays} days to start unless it's bought in connection with a loan closing. There's a ${FACTS.nfip.mapRevisionWaitDays}-day wait instead within ${FACTS.nfip.mapRevisionMonths} months of a flood map revision. Order it ${FACTS.nfip.waitDays} days ahead and closing day is covered.`,
      source: src(FACTS.nfip.source),
    });
  }
  if (buying) {
    callouts.push({
      id: "homestead",
      title: `Your first homestead year is ${homestead.exemptionYear}`,
      body:
        homestead.pushedAYear && homestead.missedByDays <= HOMESTEAD_NEAR_MISS_DAYS
          ? `Moving in ${formatDate(moveIn, "long")} is after January 1, ${homestead.exemptionYear - 1}, so that year's cycle has passed. The first January 1 you'll own and live there is ${formatDate(homestead.ownAndResideBy, "long")}; file by ${formatDate(homestead.fileBy, "long")}. If closing could land on or before January 1, the exemption would start a year sooner. Worth asking the seller.`
          : `You'll own and live in the home on ${formatDate(homestead.ownAndResideBy, "long")}, so you file by ${formatDate(homestead.fileBy, "long")} and the exemption applies from the ${homestead.exemptionYear} tax bill. ${HOMESTEAD_AMOUNTS}`,
      source: src(FACTS.homestead.source),
    });
    callouts.push({
      id: "assessment",
      title: "Year one and year two on the tax bill",
      body: `The seller's Save Our Homes benefit ends at the sale. Your first bill is on the seller's assessment, then the home resets to just value on the January 1 after you close, and the ${FACTS.saveOurHomes.capPercent}% or CPI cap, whichever is less, begins the year after your homestead is established. Plan on the second bill being the real one.`,
      source: src(FACTS.saveOurHomes.resetSource),
    });
    if (a.fromState === "FL") {
      callouts.push({
        id: "portability",
        title: "You can bring your Save Our Homes benefit with you",
        body: `Moving from a Florida homestead, the gap between the old home's market and assessed value can be transferred, up to $${FACTS.portability.cap.toLocaleString("en-US")}, within ${FACTS.portability.years} years of January 1 of the year you left it. It doesn't cross state lines, which is why it only shows for Florida movers.`,
        source: src(FACTS.portability.capSource),
      });
    }
  }

  const documents = [
    "Your current driver license or state ID",
    "Proof of your Florida address once you have one: the closing statement or lease, and a utility bill",
    "Vehicle titles, or the lienholder's details if there's a loan on the car, and proof of Florida auto insurance",
    "Current insurance declarations pages for home, flood and auto, for the quotes",
    ...(a.homeToSell !== "no" ? ["The deed and the mortgage statement for the home you're selling"] : []),
    ...(a.fromState === "FL" ? ["Your old homestead's address, county and the year you left it, for the portability form"] : []),
    ...(buying && financed ? ["Whatever your lender asked for at pre-approval, kept current until closing"] : []),
  ];

  const summary = buildSummary(a, milestones, homestead);

  return { answers: a, today, milestones, callouts, homestead, counties, documents, summary };
}

function sortMilestones(ms: Milestone[]): Milestone[] {
  return [...ms].sort((x, y) => {
    const p = PHASE_ORDER[x.phase] - PHASE_ORDER[y.phase];
    if (p !== 0) return p;
    if (x.date && y.date) return x.date < y.date ? -1 : x.date > y.date ? 1 : 0;
    if (x.date) return -1;
    if (y.date) return 1;
    return 0;
  });
}

/** One line per answer, one line per key date, for the lead form. */
export function buildSummary(a: Answers, milestones: Milestone[], homestead: HomesteadCycle): string {
  const path = a.path === "renting-first" ? "renting first" : a.path === "buying" ? `buying, ${a.financing}` : `undecided, drawn as buying, ${a.financing}`;
  const sell = a.homeToSell === "yes" ? "a home to sell first" : a.homeToSell === "listed" ? "a home already listed" : "no home to sell";
  const work = a.work === "remote" ? "working remotely" : a.work === "commute" ? `commuting${a.commuteTo ? ` to ${a.commuteTo}` : ""}` : "";
  const answers = [`Move-in ${formatDate(a.moveInDate)}`, path, sell, `from ${fromLabel(a.fromState)}`, work, countyLabel(a.county)].filter(Boolean).join(" · ");
  const key = ["effective", "inspection", "loan-approval", "nfip-order", "bind-by", "closing"]
    .map((id) => milestones.find((m) => m.id === id))
    .filter((m): m is Milestone => Boolean(m && m.date))
    .map((m) => `${m.title}: ${formatDate(m.date!)}`);
  const lines = [`My relocation plan from the planner:`, answers, ...key];
  if (a.path !== "renting-first") lines.push(`Homestead filing by ${formatDate(homestead.fileBy)} (first homestead year ${homestead.exemptionYear})`);
  return lines.join("\n");
}

export const PHASE_LABEL: Record<Phase, { eyebrow: string; title: string }> = {
  before: { eyebrow: "Before", title: "Before the contract" },
  contract: { eyebrow: "Under contract", title: "The contract dates" },
  closing: { eyebrow: "Closing", title: "The last week" },
  after: { eyebrow: "After", title: "Becoming a Floridian" },
};
