/**
 * The Sale Calculator's inputs as a link, and as the draft kept on the
 * device. Pure: no React, no site imports, so it runs under `node --test`.
 *
 *   /sell/net-proceeds?price=650000&county=manatee&close=2026-12-15&mortgage=312400
 *     &list=2.5&buyer=2.5&tax=7840&hoa=1&dues=1200&per=year&estoppel=299&settle=595&rec=18.5
 *
 * The address bar is written once per settled change (a field losing focus,
 * a tile or a box), never per keystroke (lib/url-state.ts); the same shape is
 * mirrored to localStorage so a return visit resumes. Nothing here is a
 * figure of the site's own: every value is what the seller typed.
 */
import { ESTOPPEL_CAP, parseYmd, type County, type DuesPeriod } from "./net-proceeds";

export type TitleChoice = "custom" | "seller" | "buyer";

/** Every input as the form holds it: strings as typed, booleans for the boxes. */
export type SheetForm = {
  price: string;
  /** Nothing is chosen until the seller taps a county. */
  county: County | "";
  closingDate: string;
  title: TitleChoice;
  mortgage: string;
  second: string;
  listingPct: string;
  buyerPct: string;
  annualTax: string;
  hasAssociation: boolean;
  dues: string;
  duesPeriod: DuesPeriod;
  estoppel: string;
  settlement: string;
  recording: string;
  /** True once the recording figure was typed over its computed default. */
  recordingTouched: boolean;
  repairs: string;
  staging: string;
  other: string;
  taxPaid: boolean;
  foreignSeller: boolean;
};

export const EMPTY_FORM: SheetForm = {
  price: "",
  county: "",
  closingDate: "",
  title: "custom",
  mortgage: "",
  second: "",
  listingPct: "",
  buyerPct: "",
  annualTax: "",
  hasAssociation: false,
  dues: "",
  duesPeriod: "year",
  estoppel: String(ESTOPPEL_CAP),
  settlement: "",
  recording: "",
  recordingTouched: false,
  repairs: "",
  staging: "",
  other: "",
  taxPaid: false,
  foreignSeller: false,
};

/** The query keys, short so a link stays readable. */
export const KEYS = {
  price: "price",
  county: "county",
  closingDate: "close",
  title: "title",
  mortgage: "mortgage",
  second: "second",
  listingPct: "list",
  buyerPct: "buyer",
  annualTax: "tax",
  taxPaid: "paid",
  hasAssociation: "hoa",
  dues: "dues",
  duesPeriod: "per",
  estoppel: "estoppel",
  settlement: "settle",
  recording: "rec",
  repairs: "repairs",
  staging: "staging",
  other: "other",
  foreignSeller: "firpta",
} as const;

/** Every key a sheet link can carry (components/url-pending.tsx). */
export const NET_PROCEEDS_KEYS: readonly string[] = Object.values(KEYS);

/** Where the inputs in progress are kept in the browser. */
export const NET_PROCEEDS_DRAFT = "net-proceeds";

/** The What-if row: the net at the price less and plus this. */
export const WHAT_IF_STEP = 25_000;

/** "650,000" or "$650000.50" to a number; undefined when blank or not a number. */
export function toNum(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const cleaned = s.replace(/[$,\s]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

const COUNTIES: readonly County[] = ["sarasota", "manatee"];
const TITLES: readonly TitleChoice[] = ["custom", "seller", "buyer"];
const PERIODS: readonly DuesPeriod[] = ["year", "quarter", "month"];

const oneOf = <T extends string>(v: string | null, list: readonly T[]): T | undefined => (v !== null && (list as readonly string[]).includes(v) ? (v as T) : undefined);

/** A query value that is a number, as the form's string ("650000", "2.5"); undefined otherwise. */
const money = (v: string | null): string | undefined => {
  const n = toNum(v);
  return n === undefined ? undefined : v!.replace(/[$,\s]/g, "");
};

/**
 * The form a link asks for, or null when the query carries none of the keys.
 * Anything that isn't a number, a real date or one of the choices is left at
 * the empty form's value, so a mangled link still opens a usable sheet.
 */
export function parseSheetForm(sp: URLSearchParams): SheetForm | null {
  if (!NET_PROCEEDS_KEYS.some((k) => sp.has(k))) return null;
  const f: SheetForm = { ...EMPTY_FORM };
  const str = (key: keyof SheetForm, k: string) => {
    const v = money(sp.get(k));
    if (v !== undefined) (f as Record<string, unknown>)[key] = v;
  };
  str("price", KEYS.price);
  str("mortgage", KEYS.mortgage);
  str("second", KEYS.second);
  str("listingPct", KEYS.listingPct);
  str("buyerPct", KEYS.buyerPct);
  str("annualTax", KEYS.annualTax);
  str("dues", KEYS.dues);
  str("settlement", KEYS.settlement);
  str("repairs", KEYS.repairs);
  str("staging", KEYS.staging);
  str("other", KEYS.other);
  f.county = oneOf(sp.get(KEYS.county), COUNTIES) ?? "";
  f.closingDate = parseYmd(sp.get(KEYS.closingDate)) ? sp.get(KEYS.closingDate)!.trim() : "";
  f.title = oneOf(sp.get(KEYS.title), TITLES) ?? "custom";
  f.duesPeriod = oneOf(sp.get(KEYS.duesPeriod), PERIODS) ?? "year";
  f.taxPaid = sp.get(KEYS.taxPaid) === "1";
  f.hasAssociation = sp.get(KEYS.hasAssociation) === "1";
  f.foreignSeller = sp.get(KEYS.foreignSeller) === "1";
  const estoppel = money(sp.get(KEYS.estoppel));
  if (f.hasAssociation && estoppel !== undefined) f.estoppel = estoppel;
  const rec = money(sp.get(KEYS.recording));
  if (rec !== undefined) {
    f.recording = rec;
    f.recordingTouched = true;
  }
  return f;
}

/** The form as a query string: only what differs from the empty form, numbers without their commas. */
export function sheetFormQuery(f: SheetForm): string {
  const sp = new URLSearchParams();
  const put = (k: string, v: string) => {
    const clean = money(v);
    if (clean !== undefined && toNum(clean) !== 0) sp.set(k, clean);
  };
  put(KEYS.price, f.price);
  if (f.county) sp.set(KEYS.county, f.county);
  if (parseYmd(f.closingDate)) sp.set(KEYS.closingDate, f.closingDate.trim());
  if (f.title !== "custom") sp.set(KEYS.title, f.title);
  put(KEYS.mortgage, f.mortgage);
  put(KEYS.second, f.second);
  put(KEYS.listingPct, f.listingPct);
  put(KEYS.buyerPct, f.buyerPct);
  put(KEYS.annualTax, f.annualTax);
  if (f.taxPaid) sp.set(KEYS.taxPaid, "1");
  if (f.hasAssociation) {
    sp.set(KEYS.hasAssociation, "1");
    put(KEYS.dues, f.dues);
    if (f.duesPeriod !== "year") sp.set(KEYS.duesPeriod, f.duesPeriod);
    put(KEYS.estoppel, f.estoppel);
  }
  put(KEYS.settlement, f.settlement);
  if (f.recordingTouched) put(KEYS.recording, f.recording);
  put(KEYS.repairs, f.repairs);
  put(KEYS.staging, f.staging);
  put(KEYS.other, f.other);
  if (f.foreignSeller) sp.set(KEYS.foreignSeller, "1");
  return sp.toString();
}

/** The sheet as a link on the site, with no query when the form is empty. */
export function sheetPath(f: SheetForm): string {
  const q = sheetFormQuery(f);
  return q ? `/sell/net-proceeds?${q}` : "/sell/net-proceeds";
}

/** True when the form holds nothing the seller typed, so there is nothing worth keeping. */
export function isEmptyForm(f: SheetForm): boolean {
  return sheetFormQuery(f) === "";
}

/** A hand-off from Tide Street or Home Value: a sale's price and county start a sheet. */
export function startSheetPath(price: number, county?: County | null): string {
  const sp = new URLSearchParams();
  if (Number.isFinite(price) && price > 0) sp.set(KEYS.price, String(Math.round(price)));
  if (county && COUNTIES.includes(county)) sp.set(KEYS.county, county);
  const q = sp.toString();
  return q ? `/sell/net-proceeds?${q}` : "/sell/net-proceeds";
}
