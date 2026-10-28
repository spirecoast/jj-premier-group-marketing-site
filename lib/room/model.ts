import { parsePlanState, planSearch } from "@/lib/encore/plan";
import { answersToQuery, hasAnswers, parseAnswers } from "@/lib/relocate/url";

/**
 * A client room: the private page a client gets at /room/<token>, made and
 * kept by the team from their own private links. Pure: the shape of a room,
 * what a pasted plan link turns into, and the words for where a client is in
 * the buyer's or seller's guide. Storage is lib/room/store.ts, the pages are
 * app/(room) and app/(questionnaire)/q/[token]/rooms.
 */

export const ROOM_KINDS = ["buying", "selling", "both"] as const;
export type RoomKind = (typeof ROOM_KINDS)[number];
export const ROOM_STATUSES = ["open", "closed"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export type GuideKey = "buy" | "sell";
export type RoomStep = { guide: GuideKey; n: number };

export type RoomContent = {
  /** Atlas slugs, in the order they were added. */
  places: string[];
  /** The query of a /relocate plan, without the "?", or null. */
  movePlan: string | null;
  /** The query of a /calendar/plan visit, without the "?", or null. */
  visitPlan: string | null;
  /** Where the client is in the buyer's or seller's guide. */
  step: RoomStep | null;
  /** The agents' notes, plain text; a blank line starts a paragraph. */
  notes: string;
};

export type Room = {
  id: string;
  name: string;
  kind: RoomKind;
  status: RoomStatus;
  content: RoomContent;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export const EMPTY_CONTENT: RoomContent = { places: [], movePlan: null, visitPlan: null, step: null, notes: "" };

/** Most places a room lists, and the most text the notes hold. */
export const MAX_PLACES = 24;
export const MAX_NOTES = 8000;
export const MAX_NAME = 60;

/** Room tokens are 24 base64url characters (18 random bytes); anything far off that isn't one of ours. */
export const TOKEN_SHAPE = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * The steps of the two guides, as app/(site)/buy/page.tsx and sell/page.tsx
 * list them. lib/room/room.test.ts holds these to the pages' own titles, so
 * a renamed step shows up as a failing test rather than a stale room.
 */
export const GUIDE_STEPS: Record<GuideKey, readonly string[]> = {
  buy: [
    "Make your wish list",
    "Work out your budget",
    "Get prequalified",
    "Choose your agent",
    "Find the right home",
    "Finalize your financing",
    "Make an offer",
    "Have the home inspected",
    "Get the appraisal",
    "Close and get the keys",
  ],
  sell: ["Know why you're selling", "Set the price", "Get the house ready", "Market it", "Review the offers", "Accept an offer", "Get ready to close", "Close"],
};

export const GUIDE_PATH: Record<GuideKey, string> = { buy: "/buy#steps", sell: "/sell#steps" };

/** Which guides apply to a room of this kind, buyer's guide first. */
export function guidesFor(kind: RoomKind): GuideKey[] {
  if (kind === "buying") return ["buy"];
  if (kind === "selling") return ["sell"];
  return ["buy", "sell"];
}

/** "buy:4" ↔ { guide: "buy", n: 4 }: the step as a form value. */
export function stepKey(step: RoomStep | null): string {
  return step ? `${step.guide}:${step.n}` : "";
}

export function parseStep(value: unknown): RoomStep | null {
  if (typeof value !== "string") return null;
  const m = /^(buy|sell):(\d{1,2})$/.exec(value);
  if (!m) return null;
  const guide = m[1] as GuideKey;
  const n = Number(m[2]);
  if (n < 1 || n > GUIDE_STEPS[guide].length) return null;
  return { guide, n };
}

/** The step's title, or null when the step isn't one the guide has. */
export function stepTitle(step: RoomStep | null): string | null {
  if (!step) return null;
  return GUIDE_STEPS[step.guide][step.n - 1] ?? null;
}

/**
 * The stored JSON, read back tolerantly: anything missing or malformed falls
 * to its empty value, so a room saved under an older shape still renders.
 */
export function readContent(raw: unknown): RoomContent {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const places = Array.isArray(r.places) ? r.places.filter((s): s is string => typeof s === "string" && /^[a-z0-9-]{1,80}$/.test(s)).slice(0, MAX_PLACES) : [];
  const query = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length <= 400 && !v.includes("?") ? v : null);
  return {
    places: [...new Set(places)],
    movePlan: query(r.movePlan),
    visitPlan: query(r.visitPlan),
    step: parseStep(r.step && typeof r.step === "object" ? stepKey(r.step as RoomStep) : r.step),
    notes: typeof r.notes === "string" ? r.notes.slice(0, MAX_NOTES) : "",
  };
}

const PLAN_PATH: Record<"move" | "visit", string> = { move: "/relocate", visit: "/calendar/plan" };

/**
 * What an agent pasted for a plan, turned into the plan's own canonical
 * query: a full address, a path, or just the query, from Atlas Move or the
 * Encore Planner. Anything on another path, or with nothing in it the plan
 * reads, is refused (null) so a room never links somewhere it shouldn't and
 * never carries a key the planners don't define.
 */
export function planQuery(input: string, kind: "move" | "visit", today: string): string | null {
  const text = input.trim();
  if (!text) return null;
  let query = text;
  let pathname: string | null = null;
  try {
    const u = new URL(text, "https://example.invalid");
    pathname = u.pathname;
    query = u.search;
    // Bare "in=…&path=…" has no "?" and parses as a path; take it as a query.
    if (!text.includes("?") && !text.startsWith("/") && !/^https?:/i.test(text)) {
      pathname = null;
      query = text;
    }
  } catch {
    return null;
  }
  if (pathname !== null && pathname !== "/" && pathname !== PLAN_PATH[kind]) return null;
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(query.replace(/^\?/, ""))) params[k] = v;
  if (kind === "move") {
    if (!hasAnswers(params)) return null;
    return answersToQuery(parseAnswers(params, today));
  }
  if (!params.from && !params.to) return null;
  return planSearch(parsePlanState(params, today).state).replace(/^\?/, "");
}

/** A random room token, as the questionnaire makes them: 18 bytes, base64url, 24 characters. */
export function tokenShape(token: unknown): token is string {
  return typeof token === "string" && TOKEN_SHAPE.test(token);
}

/** Notes as paragraphs: a blank line between them, single line breaks kept inside one. */
export function noteParagraphs(notes: string): string[] {
  return notes
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** "Feb 15, 2027" in the site's time zone, from YYYY-MM-DD. */
export function dayLabel(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** "today", "yesterday", "3 days ago", or the date for anything older. */
export function updatedLabel(iso: string, now: Date = new Date()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const days = Math.floor((now.getTime() - t) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
}
