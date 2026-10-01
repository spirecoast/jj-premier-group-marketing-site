import { isMarketSlug, MARKETS } from "@/lib/content/markets";
import type { MarketSlug } from "@/lib/content/types";
import { STATUS_LABEL, titleCase } from "./format";
import type { IndexEntry } from "./index-format";
import type { Filters } from "./search";
import type { EvacuationZone, HomeType, WaterAccess } from "./types";
import { explorerHref } from "./url";

/**
 * Atlas match: up to ten questions about the place and the home, each read
 * against one field of the index. There is no score and no ranking. A place
 * is in or out, question by question, and a field we do not hold for it is
 * "not known", which the reader can keep in or leave out per question.
 */

export const QUESTION_IDS = ["market", "county", "homes", "build", "gated", "hoa", "cdd", "water", "evac", "near"] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];

export type Build = "new" | "soon" | "resale";
export type EvacPref = "none" | "d" | "c" | "b";
export type County = "Manatee" | "Sarasota";
export type Anchor = { kind: "area"; slug: string } | { kind: "point"; lat: number; lng: number };

export type Answers = {
  /** Empty = anywhere. */
  market: MarketSlug[];
  county: County | null;
  /** Empty = any. */
  homes: HomeType[];
  build: Build | null;
  gated: boolean | null;
  /** The index only records an association or a CDD that is on record, never its absence, so the only answer is yes. */
  hoa: true | null;
  cdd: true | null;
  /** Empty = any. Never includes "none". */
  water: WaterAccess[];
  evac: EvacPref | null;
  near: Anchor | null;
  /** Miles from the anchor. */
  within: number;
  /** Questions where "include places where this isn't known yet" is off. */
  strict: QuestionId[];
  /** Include county-registry names (the explorer's `all=1`). */
  registry: boolean;
};

export const EMPTY_ANSWERS: Answers = {
  market: [],
  county: null,
  homes: [],
  build: null,
  gated: null,
  hoa: null,
  cdd: null,
  water: [],
  evac: null,
  near: null,
  within: 5,
  strict: [],
  registry: false,
};

export const HOME_TYPES: readonly HomeType[] = ["single-family", "villa", "paired villa", "townhome", "condominium", "coach home", "carriage home", "estate", "manufactured"];
export const WATER_TYPES: readonly Exclude<WaterAccess, "none">[] = ["gulf-front", "bayfront", "canal", "river", "lake"];
export const RADII = [3, 5, 10, 15] as const;

export const BUILD_LABEL: Record<Build, string> = { new: "New homes selling now", soon: "Coming soon", resale: "Resale only" };
export const EVAC_LABEL: Record<EvacPref, string> = {
  none: "Outside every evacuation zone",
  d: "Zone D or E, or outside",
  c: "Zone C or further inland",
  b: "Zone B or further inland",
};
export const WATER_LABEL: Record<WaterAccess, string> = { "gulf-front": "Gulf-front", bayfront: "Bayfront", canal: "Canal", river: "River", lake: "Lake", none: "No water access" };

/** Zones in order from the water inland; "none" is outside every zone. */
const EVAC_RANK: Record<EvacuationZone, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, none: 5 };
const EVAC_MIN: Record<EvacPref, number> = { none: 5, d: 3, c: 2, b: 1 };

export type Question = {
  id: QuestionId;
  /** The field of the record the question reads. */
  field: string;
  title: string;
  help: string;
  /** The label on the "any" choice, which clears the answer. */
  any: string;
  /** The answer as a noun, for sentences like "the map doesn't filter by county". */
  noun: string;
};

/** The copy for every question. Every string here passes lib/fair-housing.ts. */
export const QUESTIONS: readonly Question[] = [
  {
    id: "market",
    field: "market",
    title: "Where are you looking?",
    help: "Pick one or more of the three. Skip it and we'll look across all of them.",
    any: "Anywhere on the coast",
    noun: "market",
  },
  {
    id: "county",
    field: "county",
    title: "Does the county matter to you?",
    help: "Lakewood Ranch sits on the line. Property tax rates, and who customarily pays for the owner's title policy, differ between Manatee and Sarasota counties. We'll say which is which when we get to a contract.",
    any: "Either county",
    noun: "county",
  },
  {
    id: "homes",
    field: "homeTypes",
    title: "What kind of home?",
    help: "Pick everything you'd consider. We hold home types only for places whose builder or association lists them.",
    any: "Any kind",
    noun: "home type",
  },
  {
    id: "build",
    field: "status · activeBuilders",
    title: "New construction or resale?",
    help: "New homes selling now means at least one builder lists homes or homesites there today, per the builder's own site. Resale only is a place with no builder selling.",
    any: "Either",
    noun: "new construction or resale",
  },
  {
    id: "gated",
    field: "gated",
    title: "Gated?",
    help: "We mark a place gated only when its association or builder says so.",
    any: "Either",
    noun: "gating",
  },
  {
    id: "hoa",
    field: "hoa",
    title: "An association?",
    help: "An HOA or condominium association means dues, rules and usually shared amenities. We list one only when we've found its own site or legal name, so we can confirm one is there but never that one isn't.",
    any: "Either",
    noun: "association",
  },
  {
    id: "cdd",
    field: "cdd",
    title: "A community development district?",
    help: "A CDD is a special district that financed the roads, drainage or amenities and appears as a line on the property tax bill. We show one only when the district's own site or the county ties it to the place, so we can confirm one is there but never that one isn't.",
    any: "Either",
    noun: "CDD",
  },
  {
    id: "water",
    field: "waterAccess",
    title: "On the water?",
    help: "Pick any that fit. Water access is on record for a few dozen places so far, so leaving the box below ticked keeps the rest in.",
    any: "Doesn't matter",
    noun: "water access",
  },
  {
    id: "evac",
    field: "evacuationZone",
    title: "Storm evacuation zone",
    help: "County evacuation zones (Manatee calls them levels) run from A, nearest the water, to E. They decide when you'd be asked to leave ahead of a storm. We checked one address point per place; confirm a specific address with the county.",
    any: "Any zone",
    noun: "evacuation zone",
  },
  {
    id: "near",
    field: "lat · lng",
    title: "Close to somewhere in particular?",
    help: "Pick an Atlas area, or tap the map to drop a point, then say how far is close enough. Distances are straight-line from the point we hold for each place.",
    any: "No particular place",
    noun: "distance",
  },
];

export function questionIndex(id: QuestionId): number {
  return QUESTION_IDS.indexOf(id);
}

/** Whether the reader gave an answer to the question (an "any" choice is no answer). */
export function answered(a: Answers, id: QuestionId): boolean {
  switch (id) {
    case "market":
      return a.market.length > 0;
    case "county":
      return a.county !== null;
    case "homes":
      return a.homes.length > 0;
    case "build":
      return a.build !== null;
    case "gated":
      return a.gated !== null;
    case "hoa":
      return a.hoa !== null;
    case "cdd":
      return a.cdd !== null;
    case "water":
      return a.water.length > 0;
    case "evac":
      return a.evac !== null;
    case "near":
      return a.near !== null;
  }
}

export function answeredIds(a: Answers): QuestionId[] {
  return QUESTION_IDS.filter((id) => answered(a, id));
}

/** Straight-line miles between two points. */
export function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** The anchor as a point, from the index when it names an area. */
export function anchorPoint(a: Anchor | null, by: Map<string, IndexEntry>): { lat: number; lng: number } | null {
  if (!a) return null;
  if (a.kind === "point") return { lat: a.lat, lng: a.lng };
  const e = by.get(a.slug);
  return e && e.x !== null && e.y !== null ? { lat: e.y, lng: e.x } : null;
}

export type FactState = "match" | "no" | "unknown";
export type Fact = { id: QuestionId; label: string; state: FactState; value?: string };

/** One question against one place: in, out, or not known, with the fact that decided it. */
export function readFact(e: IndexEntry, a: Answers, id: QuestionId, anchor: { lat: number; lng: number } | null): Fact {
  switch (id) {
    case "market":
      return { id, label: "Market", state: a.market.includes(e.m) ? "match" : "no", value: marketLabel(e.m) };
    case "county":
      if (!e.c) return { id, label: "County", state: "unknown" };
      return { id, label: "County", state: e.c === a.county ? "match" : "no", value: `${e.c} County` };
    case "homes":
      if (!e.h.length) return { id, label: "Home types", state: "unknown" };
      return { id, label: "Home types", state: e.h.some((h) => a.homes.includes(h as HomeType)) ? "match" : "no", value: e.h.map(titleCase).join(", ") };
    case "build": {
      const selling = e.st === "selling" || e.b.length > 0;
      if (e.st === null && !selling) return { id, label: "Status", state: "unknown" };
      const ok = a.build === "new" ? selling : a.build === "soon" ? e.st === "coming-soon" : e.st === "established" || e.st === "built-out";
      const value = e.st ? STATUS_LABEL[e.st] : "New homes selling";
      return { id, label: "Status", state: ok ? "match" : "no", value: e.b.length ? `${value} · ${e.b.join(", ")}` : value };
    }
    case "gated":
      if (e.g === null) return { id, label: "Gated", state: "unknown" };
      return { id, label: "Gated", state: e.g === a.gated ? "match" : "no", value: e.g ? "Yes" : "No" };
    case "hoa":
      if (e.ho === null) return { id, label: "Association", state: "unknown" };
      return { id, label: "Association", state: "match", value: "On record" };
    case "cdd":
      if (e.cd === null) return { id, label: "CDD", state: "unknown" };
      return { id, label: "CDD", state: "match", value: "On record" };
    case "water":
      if (e.w === null) return { id, label: "Water", state: "unknown" };
      return { id, label: "Water", state: e.w !== "none" && a.water.includes(e.w) ? "match" : "no", value: WATER_LABEL[e.w] };
    case "evac":
      if (e.ev === null) return { id, label: "Evacuation zone", state: "unknown" };
      return {
        id,
        label: "Evacuation zone",
        state: EVAC_RANK[e.ev] >= EVAC_MIN[a.evac!] ? "match" : "no",
        value: e.ev === "none" ? "Outside every zone" : `Zone ${e.ev}`,
      };
    case "near": {
      if (!anchor || e.x === null || e.y === null) return { id, label: "Distance", state: "unknown" };
      const d = milesBetween(anchor.lat, anchor.lng, e.y, e.x);
      return { id, label: "Distance", state: d <= a.within ? "match" : "no", value: `${d < 10 ? d.toFixed(1) : Math.round(d)} mi` };
    }
  }
}

export type Match = { entry: IndexEntry; facts: Fact[]; confirmed: boolean; miles: number | null };

/**
 * Every place that fits: each answered question is a match, or not known and
 * the reader chose to keep not-known places for that question.
 */
export function matchAll(entries: IndexEntry[], a: Answers, by: Map<string, IndexEntry>): Match[] {
  const anchor = anchorPoint(a.near, by);
  // An anchor the index cannot place (an area without a point, from a hand-edited link) is no answer at all.
  const ids = answeredIds(a).filter((id) => id !== "near" || anchor);
  const strict = new Set(a.strict);
  const out: Match[] = [];
  for (const e of entries) {
    if (!a.registry && e.r === 0) continue;
    const facts: Fact[] = [];
    let ok = true;
    let confirmed = true;
    for (const id of ids) {
      const f = readFact(e, a, id, anchor);
      if (f.state === "no" || (f.state === "unknown" && strict.has(id))) {
        ok = false;
        break;
      }
      if (f.state === "unknown") confirmed = false;
      facts.push(f);
    }
    if (!ok) continue;
    const miles = anchor && e.x !== null && e.y !== null ? milesBetween(anchor.lat, anchor.lng, e.y, e.x) : null;
    out.push({ entry: e, facts, confirmed, miles });
  }
  return out;
}

export function sortMatches(ms: Match[], order: "name" | "distance"): Match[] {
  const byName = (x: Match, y: Match) => x.entry.n.localeCompare(y.entry.n);
  if (order === "name") return [...ms].sort(byName);
  return [...ms].sort((x, y) => {
    if (x.miles === null && y.miles === null) return byName(x, y);
    if (x.miles === null) return 1;
    if (y.miles === null) return -1;
    return x.miles - y.miles || byName(x, y);
  });
}

export function marketLabel(m: MarketSlug): string {
  return MARKETS.find((x) => x.slug === m)?.name ?? m;
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs.at(-1)}`);

export type SummaryPart = { id: QuestionId; text: string };

/** The answers, one short phrase each, for the results chips and the message to the team. An anchor the index cannot place is left out. */
export function summarize(a: Answers, by: Map<string, IndexEntry>): SummaryPart[] {
  const parts: SummaryPart[] = [];
  if (a.market.length) parts.push({ id: "market", text: list(a.market.map(marketLabel)) });
  if (a.county) parts.push({ id: "county", text: `${a.county} County` });
  if (a.homes.length) parts.push({ id: "homes", text: list(a.homes.map(titleCase)) });
  if (a.build) parts.push({ id: "build", text: BUILD_LABEL[a.build].toLowerCase() });
  if (a.gated !== null) parts.push({ id: "gated", text: a.gated ? "gated" : "not gated" });
  if (a.hoa) parts.push({ id: "hoa", text: "with an association" });
  if (a.cdd) parts.push({ id: "cdd", text: "with a CDD" });
  if (a.water.length) parts.push({ id: "water", text: list(a.water.map((w) => WATER_LABEL[w].toLowerCase())) });
  if (a.evac) parts.push({ id: "evac", text: EVAC_LABEL[a.evac] });
  if (a.near && anchorPoint(a.near, by)) {
    const where = a.near.kind === "area" ? by.get(a.near.slug)!.n : `${a.near.lat.toFixed(3)}, ${a.near.lng.toFixed(3)}`;
    parts.push({ id: "near", text: `within ${a.within} miles of ${where}` });
  }
  return parts;
}

/* ---------- URL state ---------- */

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

const one = (p: Params, k: string): string | undefined => {
  if (p instanceof URLSearchParams) return p.get(k) ?? undefined;
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
};
const many = (p: Params, k: string): string[] => (one(p, k) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const flag = (v: string | undefined): boolean | null => (v === "1" ? true : v === "0" ? false : null);

export type MatchState = { answers: Answers; step: number | null };

/**
 * `?market=sarasota,bradenton&homes=villa,condominium&build=new&gated=1&hoa=1&cdd=0&water=lake&evac=c&near=palmer-ranch&within=5&strict=homes&all=1&step=4`
 * `market`, `gated` and `all` mean what they mean in the explorer. `step` is
 * only present mid-flow; a shared link without it opens on the results.
 */
export function parseMatch(p: Params): MatchState {
  const nearRaw = one(p, "near");
  let near: Anchor | null = null;
  if (nearRaw) {
    const pt = nearRaw.match(/^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/);
    if (pt) {
      const lat = Number(pt[1]), lng = Number(pt[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) near = { kind: "point", lat, lng };
    } else if (/^[a-z0-9-]{1,120}$/.test(nearRaw)) near = { kind: "area", slug: nearRaw };
  }
  const within = Number(one(p, "within"));
  const stepRaw = Number(one(p, "step"));
  const county = one(p, "county")?.toLowerCase();
  const build = one(p, "build");
  const evac = one(p, "evac");
  return {
    answers: {
      market: many(p, "market").filter(isMarketSlug),
      county: county === "manatee" ? "Manatee" : county === "sarasota" ? "Sarasota" : null,
      homes: many(p, "homes").filter((h): h is HomeType => (HOME_TYPES as readonly string[]).includes(h)),
      build: build === "new" || build === "soon" || build === "resale" ? build : null,
      gated: flag(one(p, "gated")),
      hoa: one(p, "hoa") === "1" || null,
      cdd: one(p, "cdd") === "1" || null,
      water: many(p, "water").filter((w): w is Exclude<WaterAccess, "none"> => (WATER_TYPES as readonly string[]).includes(w)),
      evac: evac === "none" || evac === "d" || evac === "c" || evac === "b" ? evac : null,
      near,
      within: (RADII as readonly number[]).includes(within) ? within : EMPTY_ANSWERS.within,
      strict: many(p, "strict").filter((s): s is QuestionId => (QUESTION_IDS as readonly string[]).includes(s)),
      registry: one(p, "all") === "1",
    },
    step: Number.isInteger(stepRaw) && stepRaw >= 1 && stepRaw <= QUESTIONS.length ? stepRaw : null,
  };
}

export function matchToSearch(s: MatchState): string {
  const a = s.answers;
  const sp = new URLSearchParams();
  if (a.market.length) sp.set("market", a.market.join(","));
  if (a.county) sp.set("county", a.county);
  if (a.homes.length) sp.set("homes", a.homes.join(","));
  if (a.build) sp.set("build", a.build);
  if (a.gated !== null) sp.set("gated", a.gated ? "1" : "0");
  if (a.hoa) sp.set("hoa", "1");
  if (a.cdd) sp.set("cdd", "1");
  if (a.water.length) sp.set("water", a.water.join(","));
  if (a.evac) sp.set("evac", a.evac);
  if (a.near) {
    sp.set("near", a.near.kind === "area" ? a.near.slug : `${a.near.lat.toFixed(4)},${a.near.lng.toFixed(4)}`);
    if (a.within !== EMPTY_ANSWERS.within) sp.set("within", String(a.within));
  }
  if (a.strict.length) sp.set("strict", a.strict.join(","));
  if (a.registry) sp.set("all", "1");
  if (s.step !== null) sp.set("step", String(s.step));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function matchHref(s: MatchState): string {
  return `/neighborhoods/match${matchToSearch(s)}`;
}

/**
 * The explorer's nearest filter state. It knows market (one), status, gated
 * and registry names; the rest of the answers do not carry over.
 */
export function explorerFilters(a: Answers, placed: QuestionId[] = answeredIds(a)): { href: string; carried: string[]; dropped: string[] } {
  const f: Filters = {};
  const carried: string[] = [];
  const dropped: string[] = [];
  if (a.market.length === 1) {
    f.market = a.market[0];
    carried.push("market");
  } else if (a.market.length > 1) dropped.push("more than one market");
  if (a.build === "new" || a.build === "soon") {
    f.status = a.build === "new" ? "selling" : "coming-soon";
    carried.push("status");
  } else if (a.build) dropped.push("resale only");
  if (a.gated === true) {
    f.gated = true;
    carried.push("gated");
  } else if (a.gated === false) dropped.push("not gated");
  if (a.registry) f.registry = true;
  for (const id of ["county", "homes", "hoa", "cdd", "water", "evac", "near"] as const) if (placed.includes(id)) dropped.push(QUESTIONS[questionIndex(id)]!.noun);
  return { href: explorerHref({ filters: f }), carried, dropped };
}
