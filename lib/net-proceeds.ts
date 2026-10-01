/**
 * Seller net-proceeds math for /sell/net-proceeds. Pure: no React, no
 * network, no site imports, so it runs under `node --test`.
 *
 * Every rate and statutory figure below is taken from a published source
 * that was opened on the date in CHECKED, listed in SOURCES and cited on the
 * page. Anything that varies by title company or association (settlement fee,
 * recording, estoppel, survey) is an input the visitor can edit; the module
 * never supplies a figure for those on its own.
 *
 * The tool is for Sarasota and Manatee counties only: Miami-Dade has a
 * different documentary stamp rate and surtax, and Broward/Miami-Dade use a
 * different title paragraph in the FR/BAR contract.
 */

/** The day every source below was opened. Shown on the page as "checked". */
export const CHECKED = "2026-10-01";

export type County = "sarasota" | "manatee";
export type DuesPeriod = "year" | "quarter" | "month";

export type SourceKey =
  | "docStamps"
  | "titleRates"
  | "titleCustom"
  | "estoppel"
  | "estoppelStatute"
  | "recording"
  | "prorations";

export type Source = {
  title: string;
  publisher: string;
  url: string;
  /** What the calculator takes from it, in the source's own figures. */
  figure: string;
};

export const SOURCES: Record<SourceKey, Source> = {
  docStamps: {
    title: "Documentary Stamp Tax",
    publisher: "Florida Department of Revenue",
    url: "https://floridarevenue.com/taxes/taxesfees/Pages/doc_stamp.aspx",
    figure: "Deeds: 70 cents on each $100 or portion thereof of the consideration. Miami-Dade is 60 cents plus a 45-cent surtax, so this sheet is for Sarasota and Manatee only.",
  },
  titleRates: {
    title: "Rule 69O-186.003, Title Insurance Rates",
    publisher: "Florida Administrative Code (Cornell LII copy); rule named on the Florida CFO's title insurance overview",
    url: "https://www.law.cornell.edu/regulations/florida/Fla-Admin-Code-Ann-R-69O-186-003",
    figure: "Original owner's policy: $5.75 per $1,000 to $100,000; $5.00 per $1,000 from $100,000 to $1,000,000; $2.50 to $5,000,000; $2.25 to $10,000,000; $2.00 above, considering any fraction of $100 as a full $100. Minimum premium $100.",
  },
  titleCustom: {
    title: "Who Pays for Title Insurance in Florida?",
    publisher: "Barnes Walker, a Bradenton and Sarasota closing firm",
    url: "https://barneswalker.com/who-pays-for-title-insurance-in-florida/",
    figure: "Sarasota County: buyer pays for the owner's policy and chooses the title agent. Manatee County: seller pays and chooses. Customs, not laws; always negotiable in the contract (FR/BAR paragraph 9(c)).",
  },
  estoppel: {
    title: "Estoppel Certificate Fees (adjusted amounts)",
    publisher: "Florida Department of Business and Professional Regulation",
    url: "https://www2.myfloridalicense.com/lsc/documents/ESTOPPEL_CERTIFICATE_FEES.pdf",
    figure: "Preparation and delivery: not more than $299. Expedited (3 business days): an additional $119. Delinquent account: an additional fee not to exceed $179. Next update by July 1, 2027.",
  },
  estoppelStatute: {
    title: "F.S. 720.30851 (HOA) and F.S. 718.116(8) (condominium)",
    publisher: "Florida Legislature",
    url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0720/Sections/0720.30851.html",
    figure: "Sets the base caps ($250, $150 delinquent, $100 expedited) and directs DBPR to adjust them for CPI every five years; the DBPR figures above are the ones in force.",
  },
  recording: {
    title: "Recording Fees",
    publisher: "Sarasota County Clerk and Manatee County Clerk (both under F.S. 28.24)",
    url: "https://www.sarasotaclerk.com/Records/Recording-Services/Recording-Requirements/Recording-Fees-and-Taxes-Required",
    figure: "$10.00 for the first page of a document and $8.50 for each additional page. The buyer records the deed (FR/BAR 9(b)); the seller records a release of any mortgage under 9(a), recording and other fees needed to cure title.",
  },
  prorations: {
    title: "Residential Contract for Sale and Purchase, Standard K and paragraph 9",
    publisher: "Florida Realtors and The Florida Bar (form FloridaRealtors/FloridaBar-6xx, Rev. 8/24)",
    url: "https://www.floridarealtors.org/sites/default/files/2024-08/FloridaRealtors-FloridaBar-6xx[2].pdf",
    figure: "Real estate taxes, CDD assessments and association fees are prorated as of the day prior to the closing date, on the current year's tax at the maximum allowable discount (prior year's if the bill isn't out); estimates are readjusted when the bill arrives. 9(a): the seller pays doc stamps on the deed and the association estoppel fee.",
  },
};

export const MANATEE_RECORDING_URL = "https://www.manateeclerk.com/departments/recording/recording-fees/";
export const CFO_TITLE_URL = "https://www.myfloridacfo.com/division/consumers/understanding-insurance/title-insurance-overview";
export const TAX_DISCOUNT_URL = "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0100-0199/0197/Sections/0197.162.html";
/** F.S. 197.162: 4 percent off for payment in November. */
export const NOVEMBER_DISCOUNT_PCT = 4;
export const CONDO_STATUTE_URL = "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0718/Sections/0718.116.html";

/** FL DOR: 70 cents on each $100 or portion thereof. */
export const DOC_STAMP_RATE_PER_100 = 0.7;

/** DBPR's adjusted estoppel cap, in force until the next update by July 1, 2027. */
export const ESTOPPEL_CAP = 299;

/** The clerks' per-page recording fees under F.S. 28.24. */
export const RECORDING_FIRST_PAGE = 10;
export const RECORDING_ADDITIONAL_PAGE = 8.5;

/** Rule 69O-186.003 original owner's policy tiers: [upper bound of tier, rate per $1,000]. */
export const TITLE_TIERS: readonly (readonly [number, number])[] = [
  [100_000, 5.75],
  [1_000_000, 5.0],
  [5_000_000, 2.5],
  [10_000_000, 2.25],
  [Infinity, 2.0],
];
export const TITLE_MINIMUM_PREMIUM = 100;

export const COUNTY_LABEL: Record<County, string> = {
  sarasota: "Sarasota County",
  manatee: "Manatee County",
};

/** Barnes Walker: the seller customarily pays the owner's policy in Manatee, the buyer in Sarasota. */
export function defaultSellerPaysOwnerPolicy(county: County): boolean {
  return county === "manatee";
}

function cents(n: number): number {
  return Math.round(n * 100) / 100;
}

function num(v: number | undefined | null): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
}

/** Documentary stamps on the deed: $0.70 per $100 or portion thereof. */
export function docStamps(price: number): number {
  const p = num(price);
  if (p === 0) return 0;
  return cents(Math.ceil(p / 100) * DOC_STAMP_RATE_PER_100);
}

/**
 * Original owner's title policy premium at the promulgated rate, on the price.
 * The rule computes on the amount "considering any fraction of $100.00 as a
 * full $100.00", so the price rounds up to the next $100 first.
 */
export function ownerPolicyPremium(amount: number): number {
  const a = Math.ceil(num(amount) / 100) * 100;
  if (a === 0) return 0;
  let premium = 0;
  let lower = 0;
  for (const [upper, rate] of TITLE_TIERS) {
    if (a <= lower) break;
    const portion = Math.min(a, upper) - lower;
    premium += (portion / 1000) * rate;
    lower = upper;
  }
  return cents(Math.max(premium, TITLE_MINIMUM_PREMIUM));
}

/** A recording allowance for one instrument of `pages` pages at the clerks' rates. */
export function recordingFee(pages: number): number {
  const p = Math.max(0, Math.floor(pages));
  if (p === 0) return 0;
  return cents(RECORDING_FIRST_PAGE + (p - 1) * RECORDING_ADDITIONAL_PAGE);
}

export type Ymd = { y: number; m: number; d: number };

/** "YYYY-MM-DD" to parts, or undefined when it is not a real calendar date. */
export function parseYmd(s: string | undefined | null): Ymd | undefined {
  if (!s) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return undefined;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return undefined;
  return { y, m: mo, d };
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInYear(y: number): number {
  return isLeapYear(y) ? 366 : 365;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 1 for January 1. */
export function dayOfYear({ y, m, d }: Ymd): number {
  const start = Date.UTC(y, 0, 1);
  const day = Date.UTC(y, m - 1, d);
  return Math.round((day - start) / 86_400_000) + 1;
}

export type Proration = { amount: number; sellerDays: number; periodDays: number };

/**
 * Taxes are paid in arrears, so the seller credits the buyer for January 1
 * through the day before closing (FR/BAR Standard K), on the year's actual
 * day count.
 */
export function prorateTaxes(annual: number, closing: Ymd): Proration {
  const a = num(annual);
  const periodDays = daysInYear(closing.y);
  const sellerDays = dayOfYear(closing) - 1;
  return { amount: cents((a * sellerDays) / periodDays), sellerDays, periodDays };
}

export type DuesCredit = { amount: number; remainingDays: number; periodDays: number; periodLabel: string };

/**
 * Association dues are billed ahead. When the current period is paid, the
 * buyer credits the seller for closing day through the end of that period
 * (Standard K: association fees prorated as of the day prior to closing).
 */
export function prorateAdvanceDues(amountPerPeriod: number, period: DuesPeriod, closing: Ymd): DuesCredit {
  const a = num(amountPerPeriod);
  let startM: number;
  let endM: number;
  let periodLabel: string;
  if (period === "year") {
    startM = 1;
    endM = 12;
    periodLabel = `calendar year ${closing.y}`;
  } else if (period === "quarter") {
    const q = Math.floor((closing.m - 1) / 3);
    startM = q * 3 + 1;
    endM = startM + 2;
    periodLabel = `Q${q + 1} ${closing.y}`;
  } else {
    startM = closing.m;
    endM = closing.m;
    periodLabel = `${closing.y}-${String(closing.m).padStart(2, "0")}`;
  }
  let periodDays = 0;
  for (let m = startM; m <= endM; m++) periodDays += daysInMonth(closing.y, m);
  // Days from the first of the period up to the day before closing.
  const elapsed = dayOfYear(closing) - dayOfYear({ y: closing.y, m: startM, d: 1 });
  const remainingDays = periodDays - elapsed;
  return { amount: cents((a * remainingDays) / periodDays), remainingDays, periodDays, periodLabel };
}

export type NetProceedsInput = {
  price: number;
  county: County;
  /** YYYY-MM-DD. Without it the prorations are left out and the sheet says so. */
  closingDate?: string;
  /** Overrides the county custom when the contract says otherwise. */
  sellerPaysOwnerPolicy?: boolean;
  mortgagePayoff?: number;
  secondLienPayoff?: number;
  /** Percent of price, as negotiated. Undefined means "not entered". */
  listingCommissionPct?: number;
  buyerBrokerPct?: number;
  /** Current year's tax bill, CDD included. */
  annualTax?: number;
  hasAssociation?: boolean;
  duesAmount?: number;
  duesPeriod?: DuesPeriod;
  estoppelFee?: number;
  settlementFee?: number;
  recordingFee?: number;
  repairsConcessions?: number;
  stagingPhotos?: number;
};

export type LineKind = "payoff" | "cost" | "credit";

export type SheetLine = {
  key: string;
  label: string;
  /** Always positive; `kind` says which way it goes. */
  amount: number;
  /** "0.70 per $100", "promulgated rate", "prorated 212 of 365 days". */
  basis: string;
  kind: LineKind;
  source?: SourceKey;
  /** True when the line is on the sheet for completeness but carries no amount. */
  empty?: boolean;
};

export type Sheet = {
  price: number;
  county: County;
  closing?: Ymd;
  lines: SheetLine[];
  payoffs: number;
  costs: number;
  credits: number;
  net: number;
  /** Things the visitor should know about this particular sheet. */
  notes: string[];
};

export function computeSheet(input: NetProceedsInput): Sheet {
  const price = num(input.price);
  const county = input.county;
  const closing = parseYmd(input.closingDate);
  const lines: SheetLine[] = [];
  const notes: string[] = [];

  // Payoffs
  const payoff = num(input.mortgagePayoff);
  if (payoff > 0) {
    lines.push({ key: "mortgage", label: "Mortgage payoff", amount: cents(payoff), basis: "your figure; the lender's payoff letter adds interest to the closing date", kind: "payoff" });
  }
  const second = num(input.secondLienPayoff);
  if (second > 0) {
    lines.push({ key: "secondLien", label: "Second lien payoff", amount: cents(second), basis: "your figure; the lender's payoff letter governs", kind: "payoff" });
  }

  // Commission, as negotiated
  const listingPct = roundPct(input.listingCommissionPct);
  if (listingPct > 0) {
    lines.push({ key: "listingCommission", label: "Listing commission", amount: cents((price * listingPct) / 100), basis: `${trimPct(listingPct)}% of price, as negotiated in the listing agreement`, kind: "cost" });
  } else {
    lines.push({ key: "listingCommission", label: "Listing commission", amount: 0, basis: "as negotiated; not entered", kind: "cost", empty: true });
  }
  const buyerPct = roundPct(input.buyerBrokerPct);
  if (buyerPct > 0) {
    lines.push({ key: "buyerBroker", label: "Buyer-broker compensation", amount: cents((price * buyerPct) / 100), basis: `${trimPct(buyerPct)}% of price, as negotiated; a separate decision from the listing side`, kind: "cost" });
  } else {
    lines.push({ key: "buyerBroker", label: "Buyer-broker compensation", amount: 0, basis: "as negotiated; not entered", kind: "cost", empty: true });
  }

  // Doc stamps
  lines.push({ key: "docStamps", label: "Documentary stamps on the deed", amount: docStamps(price), basis: `$${DOC_STAMP_RATE_PER_100.toFixed(2)} per $100 or portion thereof · seller pays, FR/BAR 9(a)`, kind: "cost", source: "docStamps" });

  // Owner's title policy
  const sellerPaysTitle = input.sellerPaysOwnerPolicy ?? defaultSellerPaysOwnerPolicy(county);
  const customSeller = defaultSellerPaysOwnerPolicy(county);
  const customNote = sellerPaysTitle === customSeller ? `${COUNTY_LABEL[county]} custom` : `contract overrides the ${COUNTY_LABEL[county]} custom`;
  if (sellerPaysTitle) {
    lines.push({ key: "ownerPolicy", label: "Owner's title policy", amount: ownerPolicyPremium(price), basis: `promulgated rate, Rule 69O-186.003 · ${customNote}, seller pays`, kind: "cost", source: "titleRates" });
  } else {
    lines.push({ key: "ownerPolicy", label: "Owner's title policy", amount: 0, basis: `${customNote}: buyer pays the premium`, kind: "cost", source: "titleCustom", empty: true });
  }

  // Settlement and recording
  const settlement = num(input.settlementFee);
  lines.push(settlement > 0
    ? { key: "settlement", label: "Settlement or closing fee", amount: cents(settlement), basis: "your title agent's quote; varies by company", kind: "cost" }
    : { key: "settlement", label: "Settlement or closing fee", amount: 0, basis: "varies by title company; not entered", kind: "cost", empty: true });
  const recording = num(input.recordingFee);
  lines.push(recording > 0
    ? { key: "recording", label: "Recording", amount: cents(recording), basis: `clerk's rate: $${RECORDING_FIRST_PAGE.toFixed(2)} first page, $${RECORDING_ADDITIONAL_PAGE.toFixed(2)} each additional`, kind: "cost", source: "recording" }
    : { key: "recording", label: "Recording", amount: 0, basis: "nothing to record on the seller's side; the buyer records the deed", kind: "cost", source: "recording", empty: true });

  // Association
  if (input.hasAssociation) {
    const estoppel = num(input.estoppelFee);
    lines.push({ key: "estoppel", label: "Association estoppel certificate", amount: cents(estoppel), basis: estoppel > ESTOPPEL_CAP ? `above the $${ESTOPPEL_CAP} DBPR cap unless expedited or delinquent` : `capped at $${ESTOPPEL_CAP} by DBPR under F.S. 720.30851 / 718.116`, kind: "cost", source: "estoppel", empty: estoppel === 0 });
    const dues = num(input.duesAmount);
    const period: DuesPeriod = input.duesPeriod ?? "year";
    if (dues > 0 && closing) {
      const c = prorateAdvanceDues(dues, period, closing);
      lines.push({ key: "duesCredit", label: "Association dues, prepaid portion back to you", amount: c.amount, basis: `prorated ${c.remainingDays} of ${c.periodDays} days of ${c.periodLabel}, if that period is paid · Standard K`, kind: "credit", source: "prorations" });
    } else if (dues > 0) {
      notes.push("Add a closing date to prorate the association dues.");
    }
  }

  // Property tax
  const tax = num(input.annualTax);
  if (tax > 0 && closing) {
    const p = prorateTaxes(tax, closing);
    lines.push({ key: "taxProration", label: "Property tax credit to the buyer", amount: p.amount, basis: `prorated ${p.sellerDays} of ${p.periodDays} days, January 1 through the day before closing · Standard K`, kind: "cost", source: "prorations" });
  } else if (tax > 0) {
    notes.push("Add a closing date to prorate the property tax.");
  } else {
    lines.push({ key: "taxProration", label: "Property tax credit to the buyer", amount: 0, basis: "taxes are paid in arrears; enter the annual bill and a closing date", kind: "cost", source: "prorations", empty: true });
  }

  // Optional lines
  const repairs = num(input.repairsConcessions);
  if (repairs > 0) lines.push({ key: "repairs", label: "Repairs or concessions", amount: cents(repairs), basis: "your figure", kind: "cost" });
  const staging = num(input.stagingPhotos);
  if (staging > 0) lines.push({ key: "staging", label: "Staging and photographs", amount: cents(staging), basis: "your figure; often paid before closing rather than on the statement", kind: "cost" });

  const sum = (kind: LineKind) => cents(lines.filter((l) => l.kind === kind).reduce((s, l) => s + l.amount, 0));
  const payoffs = sum("payoff");
  const costs = sum("cost");
  const credits = sum("credit");
  const net = cents(price - payoffs - costs + credits);
  if (net < 0) notes.push("Payoffs and costs are more than the price; you'd bring the difference to closing.");

  return { price, county, closing, lines, payoffs, costs, credits, net, notes };
}

/** A percent entered by hand, kept to three decimals so the basis string and the math agree. */
function roundPct(n: number | undefined): number {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 1000) / 1000;
}

function trimPct(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatUsd(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const whole = Number.isInteger(abs);
  return `${sign}$${abs.toLocaleString("en-US", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export function formatYmd(d: Ymd): string {
  return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
}

/** The plain-text sheet for the clipboard and the "send me this" message. */
export function summaryText(sheet: Sheet): string {
  const out: string[] = [];
  out.push("Estimated net proceeds");
  out.push(`${COUNTY_LABEL[sheet.county]}${sheet.closing ? ` · closing ${formatYmd(sheet.closing)}` : ""}`);
  out.push("");
  out.push(`Sale price  ${formatUsd(sheet.price)}`);
  for (const l of sheet.lines) {
    if (l.empty) {
      out.push(`  ${l.label}: ${l.basis}`);
      continue;
    }
    const sign = l.kind === "credit" ? "+" : "-";
    out.push(`${sign} ${l.label}  ${formatUsd(l.amount)}  (${l.basis})`);
  }
  out.push("");
  out.push(`= Estimated net  ${formatUsd(sheet.net)}`);
  for (const n of sheet.notes) out.push(`  ${n}`);
  out.push("");
  out.push(`This is an estimate, not a closing statement. The title company's figures govern; commissions are negotiated. Sources checked ${CHECKED} at jjpremiergroup.com/sell/net-proceeds.`);
  return out.join("\n");
}
