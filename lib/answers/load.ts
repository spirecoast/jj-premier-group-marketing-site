import "server-only";
import { HOME_FAQS } from "@/components/home/questions";
import { getNeighborhoods } from "@/lib/content";
import { GUIDES } from "@/lib/guides";
import { HUBS } from "@/lib/hubs/copy";
import { getAllRecords } from "@/lib/neighborhoods/data";
import { FAQS } from "@/lib/relocate/copy";
import { buildBank } from "./bank";
import { answerFor, buildMatcher, type Matcher } from "./match";
import type { Answer } from "./types";

/**
 * The answer card's bank, built once an hour per server process from the same
 * content layer the pages read. A source that fails to load costs only its
 * own answers; the card is never worth breaking the search page for.
 */

let cached: { at: number; value: Promise<Matcher> } | null = null;
const BANK_MS = 60 * 60 * 1000;

async function load(): Promise<Matcher> {
  const safe = async <T>(name: string, f: () => Promise<T[]> | T[]): Promise<T[]> => {
    try {
      return await f();
    } catch (err) {
      console.warn(`[answers] ${name} failed to load:`, err instanceof Error ? err.message : String(err));
      return [];
    }
  };
  const [records, editorial] = await Promise.all([safe("records", getAllRecords), safe("neighborhoods", getNeighborhoods)]);
  return buildMatcher(
    buildBank({
      hubs: Object.values(HUBS),
      editorial,
      records,
      relocate: FAQS,
      home: HOME_FAQS.map((f) => ({ q: f.q, answer: f.answer })),
      guides: GUIDES,
    }),
  );
}

function matcher(): Promise<Matcher> {
  if (!cached || Date.now() - cached.at > BANK_MS) {
    const value = load();
    value.catch(() => {
      cached = null;
    });
    cached = { at: Date.now(), value };
  }
  return cached.value;
}

/** The answer card for a search, or null. Never throws. */
export async function answerForSearch(q: string): Promise<Answer | null> {
  try {
    return answerFor(q, await matcher());
  } catch (err) {
    console.warn("[answers] matcher failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}
