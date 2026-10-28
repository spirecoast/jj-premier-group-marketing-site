import { tokenize } from "../search/fallback";
import { ANSWER_COPY as C } from "./copy";
import type { Answer, AnswerBank, DeclineTopic, DefinitionEntry, FactField, FaqEntry, PlaceFacts, PlaceRef } from "./types";

/**
 * The answer card's matcher. Pure, no I/O: given what someone typed into
 * search and the bank of things the site already says (lib/answers/bank.ts),
 * it returns at most one answer, or nothing.
 *
 * It errs toward silence. A wrong answer above the results is worse than no
 * card, so every path needs a strong match:
 *
 *   - a question someone on the team wrote down and answered (a hub's,
 *     an Atlas page's, the relocation page's or the home page's), when the
 *     words of the query and the question cover each other and the places
 *     named agree;
 *   - a term a guide defines, for "what is a ..." with the term's own words;
 *   - one sourced fact about one Atlas place ("Is The Lake Club gated?"),
 *     when the record holds that fact and cites where it came from.
 *
 * Before any of that, a question about school quality, safety or who lives
 * somewhere gets a plain "we don't answer that" with the real source, never
 * an answer (Fair Housing: describe places, never people).
 */

/** Lowercase, accents and apostrophes off, everything but letters and digits to one space. */
export function norm(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u2019'\u0060]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STARTERS = new Set(
  "what whats which who whose where when why how is isnt are arent am was were do does doesnt did can cant could should would will may must has have define".split(" "),
);

/** "Is Lakewood Ranch in Manatee or Sarasota County", "flood insurance?", "what's a CDD": shaped like a question. */
export function isQuestion(raw: string): boolean {
  const t = (raw ?? "").trim();
  if (t.length < 5 || t.length > 200) return false;
  const words = norm(t).split(" ").filter(Boolean);
  if (words.length < 2) return false;
  if (t.endsWith("?")) return true;
  return words.length >= 3 && STARTERS.has(words[0]!);
}

/* ---- Declines ------------------------------------------------------------- */

const DECLINES: { topic: DeclineTopic; test: RegExp }[] = [
  {
    topic: "schools",
    test: /\b(best|good|great|top|bad|worst|better|rated|rating|ratings|ranking|rankings|rank|score|scores|grade|grades|quality)\b[^.?!]{0,30}\bschools?\b|\bschools?\b[^.?!]{0,30}\b(good|great|rated|rating|ratings|ranking|rankings|ranked|best|worst|bad|quality|grade|grades)\b/,
  },
  {
    topic: "safety",
    test: /\b(crime|crimes|criminal|dangerous|unsafe|safest|sketchy|shady|bad area|rough area|bad neighborhood)\b|\b(safe|safety)\b[^.?!]{0,20}\b(neighborhood|neighborhoods|area|areas|street|streets|community|communities|town|place|places|village|villages|to live|at night|to walk)\b|\b(neighborhood|area|street|community|town|place|village)s?\b[^.?!]{0,20}\b(safe|safety)\b(?!\s+from\b)/,
  },
  {
    topic: "people",
    test: /\b(who lives|who live|demographics?|retirees|seniors|young (?:people|families|professionals)|families live|lots of families|diverse|diversity|ethnic|racial|race|religious|religion|churches|synagogues?|mosques?|lgbtq?|gay|wealthy|rich people|income level|neighbors like|kind of people|type of people|people like)\b|\b(good|best|great|ideal|perfect|nice) for (families|kids|children|retirees|seniors|couples|singles|young)\b/,
  },
];

/**
 * Which of the three topics the query is asking about, if any. The word on
 * its own counts only beside a place's name: a deposit or a roof can be
 * fine in that sense, and the same word followed by "from" (flooding, a
 * storm) is a question about the land.
 */
export function declineTopic(raw: string, namesPlace = false): DeclineTopic | null {
  const q = norm(raw);
  for (const d of DECLINES) if (d.test.test(q)) return d.topic;
  if (namesPlace && /\b(safe|safety)\b(?!\s+from\b)/.test(q)) return "safety";
  return null;
}

/** The district pages the place records already cite (neighborhood-data/scripts/refresh-gis.mjs). */
export const SCHOOL_LOCATORS = {
  manatee: "https://www.manateeschools.net/schoollocator",
  sarasota: "https://www.sarasotacountyschools.net/page/student-attendance-zones",
} as const;

export function declineAnswer(topic: DeclineTopic, question: string): Answer {
  const d = C.declines[topic];
  const L = C.declineLinks;
  const links =
    topic === "schools"
      ? [
          { label: L.manateeSchools, url: SCHOOL_LOCATORS.manatee, external: true },
          { label: L.sarasotaSchools, url: SCHOOL_LOCATORS.sarasota, external: true },
        ]
      : topic === "safety"
        ? [{ label: L.check, url: "/check", external: false }]
        : [
            { label: L.match, url: "/neighborhoods/match", external: false },
            { label: L.atlas, url: "/neighborhoods", external: false },
          ];
  return { kind: "decline", topic, question, heading: d.heading, text: d.body, links };
}

/* ---- Places named in a query ----------------------------------------------- */

/** One word that is also a place's name reads as the word, not the place ("Park", "Lakes"). */
const GENERIC = new Set(
  "river lakes lake park village villages downtown harbor bay island beach gulf country club golf preserve woods oaks palms meadows gardens landing pointe point shores estates heights hills ridge creek grove trace place plaza commons central north south east west home homes waterfront the condo condos".split(" "),
);

export type PlaceIndex = {
  /** Normalized name → the place keys that answer to it. */
  names: Map<string, Set<string>>;
  /** Key → the market it belongs to ("market:sarasota" for itself). */
  marketOf: Map<string, string>;
  maxWords: number;
};

const placeName = (s: string) => norm(s).replace(/^the /, "");

export function buildPlaceIndex(markets: PlaceRef[], places: PlaceRef[]): PlaceIndex {
  const names = new Map<string, Set<string>>();
  const marketOf = new Map<string, string>();
  let maxWords = 1;
  for (const p of [...markets, ...places]) {
    marketOf.set(p.key, `market:${p.market}`);
    for (const raw of p.names) {
      const n = placeName(raw);
      const words = n.split(" ").filter(Boolean);
      if (!n || n.length < 4) continue;
      if (words.length === 1 && GENERIC.has(n)) continue;
      maxWords = Math.max(maxWords, words.length);
      const set = names.get(n) ?? new Set<string>();
      set.add(p.key);
      names.set(n, set);
    }
  }
  return { names, marketOf, maxWords: Math.min(maxWords, 8) };
}

/** "manatee or sarasota county" names a county, not the place called Sarasota. */
const COUNTY_PHRASE = /\b(?:(?:manatee|sarasota) or )?(?:manatee|sarasota) county\b/g;

/**
 * The places a text names, longest name first, without overlaps: "Lakewood
 * Ranch Country Club" is that village, not Lakewood Ranch plus a club.
 */
export function namedPlaces(text: string, ix: PlaceIndex): { names: string[]; keys: Set<string>; rest: string } {
  const words = norm(text).replace(COUNTY_PHRASE, " county ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const used = new Array<boolean>(words.length).fill(false);
  const found: string[] = [];
  const keys = new Set<string>();
  for (let len = Math.min(ix.maxWords, words.length); len >= 1; len--) {
    for (let i = 0; i + len <= words.length; i++) {
      if (used.slice(i, i + len).some(Boolean)) continue;
      let gram = words.slice(i, i + len).join(" ");
      let hit = ix.names.get(gram);
      if (!hit && words[i] === "the" && len > 1) {
        gram = words.slice(i + 1, i + len).join(" ");
        hit = ix.names.get(gram);
      }
      if (!hit) continue;
      for (let k = i; k < i + len; k++) used[k] = true;
      found.push(gram);
      for (const key of hit) keys.add(key);
    }
  }
  const rest = words.filter((_, i) => !used[i]).join(" ");
  return { names: found, keys, rest };
}

/* ---- Words ------------------------------------------------------------------- */

/** Words that carry no topic in a question: the search stop list leaves these in. */
const FILLER = new Set(["what", "whi", "which", "s", "t", "need", "should", "much", "mani", "get", "know", "tell", "doe", "would", "could", "im", "ive", "dont", "isnt", "there", "here", "ani", "anyth", "realli", "actual", "pleas", "one", "have", "has", "had", "been", "go", "goe", "about", "also", "just", "some", "like", "want", "look"]);

export function words(text: string): string[] {
  return tokenize(text).filter((w) => w.length > 1 && !FILLER.has(w));
}

/** Inverse document frequency over the bank's questions and answers; a word the bank never uses weighs the most. */
export function idfTable(docs: string[][]): (w: string) => number {
  const df = new Map<string, number>();
  for (const d of docs) for (const w of new Set(d)) df.set(w, (df.get(w) ?? 0) + 1);
  const n = docs.length || 1;
  return (w) => Math.log(1 + n / (1 + (df.get(w) ?? 0)));
}

/* ---- FAQ matching --------------------------------------------------------------- */

export type FaqMatch = {
  entry: FaqEntry;
  score: number;
  cover: number;
  back: number;
  rank: number;
  /** The question is about the very place the query names. */
  exact: boolean;
};

/** The settings, named once so the tests and any later tuning read the same numbers. */
export const THRESHOLDS = {
  /** Share of the query's words (by weight) the question carries (or, at 0.6, its answer). */
  cover: 0.75,
  /** Share of the question's words (by weight) the query carries. */
  back: 0.34,
  /** The mean of the two. */
  score: 0.62,
} as const;

const ALL_MARKETS = ["market:lakewood-ranch", "market:sarasota", "market:bradenton"];

/**
 * Whether the places agree. A question that names places ("Which county is
 * Lakewood Ranch in?") needs the query to name one of them, unless it names
 * all three markets (then it's about the region). A question on an Atlas page
 * that names no place ("Do the lots back onto the golf course?") needs the
 * query to name that place. A question on a market's hub that names no place
 * is about that market: it stands for a query that names no place, or a
 * place in that market.
 */
export function placesAgree(faq: { named: Set<string>; pageKey?: string }, query: Set<string>, ix: PlaceIndex): boolean {
  const generic = ALL_MARKETS.every((m) => faq.named.has(m));
  if (faq.named.size && !generic) return [...query].some((k) => faq.named.has(k));
  if (!faq.named.size && faq.pageKey?.startsWith("place:")) return query.has(faq.pageKey);
  if (!faq.named.size && faq.pageKey?.startsWith("market:")) return !query.size || [...query].some((k) => ix.marketOf.get(k) === faq.pageKey);
  return true;
}

export function bestFaq(q: string, bank: Pick<AnswerBank, "faqs">, ix: PlaceIndex, idf: (w: string) => number): FaqMatch | null {
  const query = namedPlaces(q, ix);
  const qWords = [...new Set(words(query.rest))];
  if (!qWords.length) return null;
  const qWeight = qWords.reduce((a, w) => a + idf(w), 0);
  let best: FaqMatch | null = null;
  for (const entry of bank.faqs) {
    const asked = namedPlaces(entry.q, ix);
    if (!placesAgree({ named: asked.keys, pageKey: entry.pageKey }, query.keys, ix)) continue;
    const fWords = new Set(words(asked.rest));
    if (!fWords.size) continue;
    const aWords = new Set(words(entry.answer));
    const cover = qWords.reduce((a, w) => a + idf(w) * (fWords.has(w) ? 1 : aWords.has(w) ? 0.6 : 0), 0) / qWeight;
    const fWeight = [...fWords].reduce((a, w) => a + idf(w), 0);
    const back = [...fWords].reduce((a, w) => a + (qWords.includes(w) ? idf(w) : 0), 0) / fWeight;
    if (cover < THRESHOLDS.cover || back < THRESHOLDS.back) continue;
    const score = (cover + back) / 2;
    if (score < THRESHOLDS.score) continue;
    // A question about the very place the query names beats one that only shares its market.
    const exact = [...query.keys].some((k) => asked.keys.has(k) || entry.pageKey === k);
    const rank = score + (exact ? 0.1 : 0);
    if (!best || rank > best.rank) best = { entry, score, cover, back, rank, exact };
    continue;
  }
  return best;
}

/* ---- Definitions ------------------------------------------------------------------ */

const DEFINE = [/^(?:what|whats) (?:is|are)? ?(?:an? |the )?(.+?)$/, /^what does (?:an? |the )?(.+?) mean$/, /^(?:define|meaning of|definition of) (?:an? |the )?(.+)$/];

export function bestDefinition(q: string, bank: Pick<AnswerBank, "definitions">): DefinitionEntry | null {
  const n = norm(q);
  let subject: string | null = null;
  for (const re of DEFINE) {
    const m = re.exec(n);
    if (m) {
      subject = m[1]!;
      break;
    }
  }
  if (!subject) return null;
  const want = [...new Set(words(subject))].sort().join(" ");
  if (!want) return null;
  return bank.definitions.find((d) => [...new Set(words(d.term))].sort().join(" ") === want) ?? null;
}

/* ---- Facts about one place ------------------------------------------------------------ */

const FACT_WORDS: [FactField, RegExp][] = [
  ["evacuation", /\b(evacuation|evac)\b/],
  ["cdd", /\b(cdd|community development district)\b/],
  ["hoa", /\b(hoa|homeowners? association|association)\b/],
  ["gated", /\b(gated|gate|gates)\b/],
  ["county", /\b(which|what) county\b|\bin (?:manatee|sarasota)(?: or (?:manatee|sarasota))? county\b/],
  ["zips", /\bzip(?: codes?)?\b/],
  ["jurisdiction", /\b(city limits|incorporated|unincorporated|jurisdiction)\b/],
  ["water", /\b(waterfront|on the water|water access|gulf access)\b/],
];

export function factField(q: string): FactField | null {
  const n = norm(q);
  const hits = FACT_WORDS.filter(([, re]) => re.test(n));
  // Two facts in one question ("gated and an HOA?") is a question for a page, not a line.
  return hits.length === 1 ? hits[0]![0] : null;
}

const WATER_LINE: Record<string, (name: string) => string> = {
  "gulf-front": (n) => `Yes. ${n} is on the Gulf.`,
  bayfront: (n) => `Yes. ${n} is on the bay.`,
  canal: (n) => `${n} has canal access.`,
  river: (n) => `Yes. ${n} is on the river.`,
  lake: (n) => `${n} is on a lake.`,
  none: (n) => `No. ${n} has no water access.`,
};

/** "Evacuation level" in Manatee, "evacuation zone" in Sarasota: each county's own word. */
export const evacWord = (county: "Manatee" | "Sarasota" | null) => (county === "Manatee" ? "level" : "zone");

/** The fact as a question and a line, or null when the record doesn't hold it. */
export function factLine(p: PlaceFacts, field: FactField): { question: string; text: string } | null {
  const n = p.name;
  switch (field) {
    case "county":
      return p.county ? { question: `Which county is ${n} in?`, text: `${n} is in ${p.county} County.` } : null;
    case "gated":
      return p.gated === null ? null : { question: `Is ${n} gated?`, text: p.gated ? `Yes. ${n} is gated.` : `No. ${n} isn’t gated.` };
    case "hoa":
      return p.hoa ? { question: `Does ${n} have an HOA?`, text: `Yes. The association is ${p.hoa}.` } : null;
    case "cdd":
      return p.cdd ? { question: `Is ${n} in a CDD?`, text: `Yes. ${n} is in the ${p.cdd}.` } : null;
    case "evacuation": {
      if (!p.evacuation) return null;
      const word = evacWord(p.county);
      const county = p.county ? `${p.county} County’s` : "The county’s";
      const at = "at the address point we checked. Zones follow property lines, so check the exact address before you count on it.";
      return {
        question: `What evacuation ${word} is ${n} in?`,
        text: p.evacuation === "none" ? `${county} map puts ${n} outside every evacuation ${word}, ${at}` : `${county} map puts ${n} in evacuation ${word} ${p.evacuation}, ${at}`,
      };
    }
    case "zips":
      return p.zips.length ? { question: `What ZIP code is ${n} in?`, text: p.zips.length === 1 ? `${n} is in ${p.zips[0]}.` : `${n} spans ${p.zips.slice(0, -1).join(", ")} and ${p.zips.at(-1)}.` } : null;
    case "jurisdiction":
      return p.jurisdiction ? { question: `Is ${n} inside city limits?`, text: `${n} is in ${p.jurisdiction}.` } : null;
    case "water":
      return p.water && WATER_LINE[p.water] ? { question: `Is ${n} on the water?`, text: WATER_LINE[p.water]!(n) } : null;
  }
}

/** One fact about one place, when the query names exactly one Atlas place and asks for one fact the record holds and sources. */
export function bestFact(q: string, bank: Pick<AnswerBank, "places">, ix: PlaceIndex): Answer | null {
  const field = factField(q);
  if (!field) return null;
  const named = namedPlaces(q, ix);
  const places = [...named.keys].filter((k) => k.startsWith("place:"));
  if (named.names.length !== 1 || places.length !== 1) return null;
  const p = bank.places.find((x) => x.key === places[0]);
  if (!p) return null;
  const line = factLine(p, field);
  const source = p.sources[field];
  if (!line || !source) return null;
  return {
    kind: "fact",
    question: line.question,
    text: line.text,
    from: { label: `${p.name} in Atlas`, url: p.url, cta: C.readPlace },
    source,
    ...(field === "evacuation" ? { next: { label: C.checkAddress, url: "/check" } } : {}),
  };
}

/* ---- The one answer ------------------------------------------------------------------- */

export type Matcher = { ix: PlaceIndex; idf: (w: string) => number; bank: AnswerBank };

export function buildMatcher(bank: AnswerBank): Matcher {
  const ix = buildPlaceIndex(bank.markets, bank.places);
  const idf = idfTable(bank.faqs.map((f) => [...words(f.q), ...words(f.answer)]));
  return { ix, idf, bank };
}

/**
 * The answer for a query, or null. A decline wins for any query; a written
 * answer only for a question, or for a place and one fact ("siesta key
 * evacuation zone").
 */
export function answerFor(raw: string, m: Matcher): Answer | null {
  const q = (raw ?? "").trim();
  if (!q) return null;
  const topic = declineTopic(q, namedPlaces(q, m.ix).keys.size > 0);
  if (topic) return declineAnswer(topic, q);
  const question = isQuestion(q);
  const shortAsk = norm(q).split(" ").length <= 8;
  // A sourced fact about the place named beats a general answer from its market's page.
  const fact = question || shortAsk ? bestFact(q, m.bank, m.ix) : null;
  if (question) {
    const faq = bestFaq(q, m.bank, m.ix, m.idf);
    if (faq && (faq.exact || !fact)) return { kind: "faq", question: faq.entry.q, text: faq.entry.answer, from: { label: faq.entry.page, url: faq.entry.url, cta: C.readFaq } };
    if (fact) return fact;
    const def = bestDefinition(q, m.bank);
    if (def) return { kind: "definition", question: def.term, text: def.definition, from: { label: def.page, url: def.url, cta: C.readGuide } };
    return null;
  }
  return fact;
}
