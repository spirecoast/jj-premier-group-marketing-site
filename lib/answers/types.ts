/**
 * The answer card on /search: shared shapes. No imports, so the page, the
 * tests and the optional written-answer route can all use them.
 */

/** A place the bank can name: one of the three markets, or a researched Atlas place. */
export type PlaceRef = {
  /** "market:sarasota" or "place:<slug>". */
  key: string;
  name: string;
  /** The market the place belongs to: "lakewood-ranch", "sarasota" or "bradenton". */
  market: string;
  /** Every spelling the place answers to, as written (name and aliases). */
  names: string[];
  url: string;
};

/** A question someone on the team wrote down and answered on a page of the site. */
export type FaqEntry = {
  kind: "faq";
  id: string;
  q: string;
  answer: string;
  /** Where the question is answered on the site, with its anchor. */
  url: string;
  /** The page's name, for "From the Lakewood Ranch page". */
  page: string;
  /** The place the page is about, when it is about one (a hub or an Atlas page). */
  pageKey?: string;
};

/** A term a guide defines in its own words. */
export type DefinitionEntry = {
  kind: "definition";
  id: string;
  term: string;
  definition: string;
  url: string;
  page: string;
  section: string;
};

/** A sourced fact about an Atlas place, as the record holds it. */
export type FactField = "county" | "gated" | "hoa" | "cdd" | "evacuation" | "zips" | "jurisdiction" | "water";

export type PlaceFacts = PlaceRef & {
  county: "Manatee" | "Sarasota" | null;
  gated: boolean | null;
  hoa: string | null;
  cdd: string | null;
  evacuation: "A" | "B" | "C" | "D" | "E" | "none" | null;
  zips: string[];
  jurisdiction: string | null;
  water: string | null;
  /** The source behind each field, when the record cites one: publisher, address, the day it was opened. */
  sources: Partial<Record<FactField, { label: string; url: string; checked: string }>>;
};

export type AnswerBank = {
  faqs: FaqEntry[];
  definitions: DefinitionEntry[];
  places: PlaceFacts[];
  /** The three markets, which have hub pages rather than Atlas records. */
  markets: PlaceRef[];
};

/** Why a question gets a "we don't answer that" card instead of an answer. */
export type DeclineTopic = "schools" | "safety" | "people";

/**
 * What the card shows. Every answer is text the site already carries, with
 * the page it comes from; a fact also names the outside source and the day
 * it was checked. A decline says plainly what we don't answer and where the
 * real source is.
 */
export type Answer =
  | {
      kind: "faq" | "definition" | "fact";
      /** The question as the site words it (a fact's is composed: "Is The Lake Club gated?"). */
      question: string;
      text: string;
      /** The page of this site the answer comes from, and the link's words. */
      from: { label: string; url: string; cta: string };
      /** For a fact: the public source and the day it was opened. */
      source?: { label: string; url: string; checked: string };
      /** One more step, where there is a natural one (an address check for an evacuation level). */
      next?: { label: string; url: string };
    }
  | {
      kind: "decline";
      topic: DeclineTopic;
      /** What was asked, as typed. */
      question: string;
      /** What we don't answer, said plainly. */
      heading: string;
      text: string;
      links: { label: string; url: string; external: boolean }[];
    };
