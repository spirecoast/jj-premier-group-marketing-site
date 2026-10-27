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

/** Every key a plan link carries. */
export const RELOCATE_KEYS = Object.values(KEYS);

/** The number of questions (components/relocate/questions.tsx). */
export const MOVE_STEPS = 5;

/** Where the answers in progress are kept in the browser. */
export const MOVE_DRAFT = "relocate:answers";

/** What's kept: the answers as a plan query, and where the visitor was. */
export type MoveDraft = { query: string; mode: "questions" | "plan"; step: number; reached: number };

/**
 * The stored record, cleaned: the JSON this version writes, or the bare
 * query string earlier versions kept (which only ever held a finished plan).
 * Null when there's nothing usable.
 */
export function readMoveDraft(raw: string | null): MoveDraft | null {
  if (!raw) return null;
  const clampStep = (n: unknown) => Math.min(MOVE_STEPS - 1, Math.max(0, Math.trunc(Number(n)) || 0));
  try {
    const v = JSON.parse(raw) as Partial<MoveDraft> | null;
    if (v && typeof v === "object" && typeof v.query === "string") {
      return {
        query: v.query,
        mode: v.mode === "plan" ? "plan" : "questions",
        step: clampStep(v.step),
        reached: Math.min(MOVE_STEPS, Math.max(0, Math.trunc(Number(v.reached)) || 0)),
      };
    }
    return null;
  } catch {
    // Not JSON: the bare query string.
  }
  return hasAnswers(Object.fromEntries(new URLSearchParams(raw))) ? { query: raw, mode: "plan", step: 0, reached: MOVE_STEPS } : null;
}
