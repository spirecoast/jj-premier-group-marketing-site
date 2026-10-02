import type { ImageRef } from "@/lib/content/types";

/**
 * A guide is structured data, not Portable Text: sections of blocks, each
 * block one of a small set of kinds, every figure and factual block with a
 * "Source:" line. docs/GUIDES.md explains how to author one.
 */

/** A run of paragraph text, or a run that carries a link. */
export type Inline = string | { text: string; href: string };

/** One source line: a page we opened, with the day we opened it. A source with no href is one that would not load. */
export type Source = { label: string; href?: string; note?: string };

export type ParagraphBlock = { kind: "paragraph"; segs: Inline[]; source?: Source };
export type DefinitionBlock = { kind: "definition"; term: string; definition: string; source?: Source };
export type PullQuoteBlock = { kind: "pull-quote"; text: string };
export type TableBlock = { kind: "table"; title: string; columns: string[]; rows: string[][]; source: Source };
export type SubheadBlock = { kind: "subhead"; text: string };

/** The site's own tools, named once so a guide can point at them without hand-typing paths. */
export type Tool = "atlas" | "atlas-match" | "relocate" | "sold" | "home-value" | "net-proceeds" | "contact";
export type CalloutBlock = { kind: "callout"; tool: Tool; eyebrow: string; body: string; cta: string };

/* ---- Figures ------------------------------------------------------------ */

/** Series slots are assigned in fixed order and never cycled (dataviz rule). */
export type Series = 0 | 1 | 2;

export type BarSegment = { label: string; value: number; series: Series; hatched?: boolean };
export type BarFigure = {
  type: "bar";
  unit: string;
  /** The axis maximum. Bars are drawn to this scale. */
  max: number;
  rows: { label: string; sub?: string; segments: BarSegment[] }[];
  legend: { label: string; series: Series; hatched?: boolean }[];
};

export type ComparisonCell = string | { text: string; mark: "yes" | "no" | "dash" };
export type ComparisonFigure = {
  type: "comparison";
  columns: string[];
  rows: { label: string; sub?: string; cells: ComparisonCell[] }[];
};

export type MatrixFigure = {
  type: "matrix";
  columns: string[];
  rows: { label: string; sub?: string; cells: ("yes" | "no" | "partial")[] }[];
  legend: { yes: string; partial: string; no: string };
};

export type TimelineLane = { label: string; sub?: string; start: number; end: number; series: Series; hatched?: boolean; text?: string };
export type TimelineFigure = {
  type: "timeline";
  /** The axis runs 0..max in `unit`. */
  max: number;
  unit: string;
  ticks: { at: number; label: string }[];
  markers: { at: number; label: string }[];
  lanes: TimelineLane[];
  legend: { label: string; series: Series; hatched?: boolean }[];
};

/** An illustrative elevation certificate drawn as a house against the base flood elevation. Every number is hypothetical. */
export type ElevationExampleFigure = {
  type: "worked-example";
  example: "elevation-certificate";
  datum: string;
  zone: string;
  bfe: number;
  lowestFloor: number;
  garageSlab: number;
  machinery: number;
  lowestAdjacentGrade: number;
  highestAdjacentGrade: number;
  floodOpenings: number;
  /** The item labels as the form prints them, so the figure can be read against the real certificate. */
  items: { code: string; label: string; value: string; verdict?: "above" | "below" }[];
};

export type MapCalloutFigure = {
  type: "map-callout";
  places: { name: string; covers: string; body: string; href: string; cta: string }[];
};

export type ChecklistFigure = {
  type: "checklist";
  items: { text: string; detail?: string }[];
};

export type LadderFigure = {
  type: "ladder";
  steps: { code: string; name: string; means: string; lender: string; insurer: string; building: string; series: Series }[];
  columns: { lender: string; insurer: string; building: string };
};

/**
 * The coast seen from the side, from the Gulf to higher ground, with the big
 * flood drawn across it. A drawing of the idea, not of a real place. The
 * three zones are drawn in this order, left to right: VE, AE, X.
 */
export type CoastFigure = {
  type: "coast";
  /** The dashed line's label: the base flood. */
  floodLine: string;
  /** The solid line's label: the water on an ordinary day. */
  calmWater: string;
  zones: [CoastZone, CoastZone, CoastZone];
};
export type CoastZone = { code: string; name: string; means: string };

/** One card per zone: the letter, what it means, the lender's rule and the building rule. */
export type ZoneCardsFigure = {
  type: "zone-cards";
  cards: {
    code: string;
    /** "Highest risk", "High risk", "Lower risk". */
    name: string;
    tone: "highest" | "high" | "lower";
    means: string;
    /** "maybe" draws a half-filled mark: not required by the base rule, but sometimes required (a lender, Citizens). */
    lender: { mark: "yes" | "no" | "maybe"; text: string };
    build: string;
  }[];
  labels: { lender: string; build: string };
};

/**
 * Two houses on the same street against the same flood line, side by side.
 * Heights are in feet and are illustrative; the figure's note must say so.
 */
export type TwoHousesFigure = {
  type: "two-houses";
  floodLine: number;
  floodLabel: string;
  floorLabel: string;
  houses: [TwoHouse, TwoHouse];
};
export type TwoHouse = { name: string; floor: number; verdict: "above" | "below"; says: string };

/** Two panels that answer different questions: what the zone decides, what the house decides. */
export type DecidesFigure = {
  type: "decides";
  panels: [DecidesPanel, DecidesPanel];
};
export type DecidesPanel = { eyebrow: string; title: string; items: string[] };

/** Numbered questions set large, the way a form asks them, with a yes-or-no box beside each. */
export type QuestionsFigure = {
  type: "questions";
  items: { question: string; note?: string }[];
  answers: [string, string];
};

/**
 * Villages grouped by the district they sit in: one block per kind of
 * district, each with one row per district and that district's villages set
 * as chips. The CDD guide's "which district is my village in".
 */
export type VillagesFigure = {
  type: "villages";
  groups: { title: string; sub: string; series: Series; rows: { name: string; villages: string[] }[] }[];
};

/**
 * A building drawn from the front with a numbered mark on each part a
 * reserve study must cover. The drawing is fixed and carries only the
 * numbers; the parts are listed as text under it, in the same order.
 */
export type PartsFigure = {
  type: "parts";
  items: { label: string; means?: string }[];
};

/**
 * A fixed drawing with numbered marks on it: the islands from above, the
 * roads from the Skyway to the islands, a house from the side, a seawall in
 * section. The drawing is part of the scene; the words for each mark come
 * from the guide and are set under the drawing as text.
 */
export type SketchFigure = {
  type: "sketch";
  scene: "islands" | "corridor" | "house" | "seawall";
  marks: { code: string; name: string; body: string }[];
};

/**
 * One calendar year as a strip of twelve months, with shaded spans and
 * numbered marks. Positions are months from January 1, 0 to 12: March 1
 * is 2, June 1 is 5, September 10 is about 8.3.
 */
export type YearFigure = {
  type: "year";
  spans: { from: number; to: number; label: string; series: Series; hatched?: boolean }[];
  marks: { at: number; label: string; detail: string }[];
};

/**
 * A home's value drawn as a column, lowest value at the bottom, cut into
 * bands that are exempt or taxed. `from` and `to` set each band's height
 * against `top`; `range` is the words for it, since the drawing carries none.
 */
export type TiersFigure = {
  type: "tiers";
  /** The small line over the column, saying what it measures. */
  axis: string;
  top: number;
  bands: { from: number; to: number; range: string; label: string; detail: string; tone: "exempt" | "partial" | "taxed" }[];
  legend: { exempt: string; partial: string; taxed: string };
};

/** The spots on the house-points drawing a point can name. */
export type HousePoint = "roof-cover" | "roof-deck" | "roof-wall" | "roof-shape" | "water-barrier" | "openings";

/** A house from the side with numbered points on the parts a wind inspection checks. */
export type HousePointsFigure = {
  type: "house-points";
  points: { at: HousePoint; label: string; detail: string }[];
};

export type FigureSpec =
  | BarFigure
  | ComparisonFigure
  | MatrixFigure
  | TimelineFigure
  | ElevationExampleFigure
  | MapCalloutFigure
  | ChecklistFigure
  | LadderFigure
  | CoastFigure
  | ZoneCardsFigure
  | TwoHousesFigure
  | DecidesFigure
  | QuestionsFigure
  | VillagesFigure
  | PartsFigure
  | SketchFigure
  | YearFigure
  | TiersFigure
  | HousePointsFigure;

export type FigureBlock = {
  kind: "figure";
  /** "The zones", "The example" — the mono eyebrow after "Fig. 03". */
  eyebrow: string;
  title: string;
  /** One line on how to read it. */
  reading: string;
  figure: FigureSpec;
  /** A note under the drawing, before the source line. */
  note?: string;
  source: Source;
  /** An optional pointer at one of the site's tools, set in the figure's foot. */
  tool?: { tool: Tool; cta: string };
};

export type Block = ParagraphBlock | DefinitionBlock | PullQuoteBlock | TableBlock | SubheadBlock | CalloutBlock | FigureBlock;

export type Section = {
  /** The short slug used as the anchor. */
  id: string;
  title: string;
  /** The one-line "why it matters", set under the section header. */
  lead: string;
  blocks: Block[];
  sources: Source[];
};

export type Guide = {
  slug: string;
  title: string;
  /** The one-sentence promise under the title on the cover. */
  promise: string;
  /** Short "How to use this guide" paragraphs. */
  howToUse: string[];
  /** Three questions the reader keeps coming back to. */
  questions: [string, string, string];
  cover: ImageRef;
  author: { name: string; slug: string };
  publishedAt: string;
  updatedAt: string;
  /** The day the sources were opened, printed on every source line. */
  checked: string;
  sections: Section[];
  /** The "On one page" summary at the end: label and the line to fill in or remember. */
  onOnePage: { title: string; reading: string; rows: { label: string; value: string }[] };
  /** The closing: what we'll do if you send us the address. */
  next: { eyebrow: string; title: string; body: string; cta: string; tool: Tool };
};
