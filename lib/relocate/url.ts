/**
 * The six answers as a query string. The URL is the plan's source of truth:
 * the page, the ICS feed and the share link all read the same keys.
 *
 *   /relocate?in=2027-02-15&path=buying&sell=no&from=NY&work=remote&county=manatee&fin=financed&off=3
 */
import { normalizeAnswers, type Answers } from "./plan";

export const KEYS = {
  moveInDate: "in",
  path: "path",
  homeToSell: "sell",
  fromState: "from",
  work: "work",
  commuteTo: "to",
  county: "county",
  financing: "fin",
  closingOffset: "off",
} as const;

export type QueryParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

/** True when the query carries at least one answer, so the page can tell a shared link from a fresh visit. */
export function hasAnswers(params: QueryParams): boolean {
  return Object.values(KEYS).some((k) => first(params[k]) !== undefined);
}

export function parseAnswers(params: QueryParams, today: string): Answers {
  const off = first(params[KEYS.closingOffset]);
  return normalizeAnswers(
    {
      moveInDate: first(params[KEYS.moveInDate]),
      path: first(params[KEYS.path]) as Answers["path"],
      homeToSell: first(params[KEYS.homeToSell]) as Answers["homeToSell"],
      fromState: first(params[KEYS.fromState])?.toUpperCase(),
      work: first(params[KEYS.work]) as Answers["work"],
      commuteTo: first(params[KEYS.commuteTo]),
      county: first(params[KEYS.county]) as Answers["county"],
      financing: first(params[KEYS.financing]) as Answers["financing"],
      closingOffset: off === undefined ? undefined : Number(off),
    },
    today,
  );
}

export function answersToQuery(a: Answers): string {
  const sp = new URLSearchParams();
  sp.set(KEYS.moveInDate, a.moveInDate);
  sp.set(KEYS.path, a.path);
  sp.set(KEYS.homeToSell, a.homeToSell);
  sp.set(KEYS.fromState, a.fromState);
  sp.set(KEYS.work, a.work);
  if (a.work === "commute" && a.commuteTo) sp.set(KEYS.commuteTo, a.commuteTo);
  sp.set(KEYS.county, a.county);
  sp.set(KEYS.financing, a.financing);
  sp.set(KEYS.closingOffset, String(a.closingOffset));
  return sp.toString();
}

export function planPath(a: Answers): string {
  return `/relocate?${answersToQuery(a)}`;
}

export function icsPath(a: Answers): string {
  return `/api/relocate/plan.ics?${answersToQuery(a)}`;
}
