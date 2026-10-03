import { clean } from "../html";
import { parsePrice } from "../price";
import type { Adapter, CollectedEvent } from "../types";
import { filterTitles, groupEvents, sha256, str, upcoming } from "../util";

/**
 * The Events Calendar (WordPress "Tribe") REST API:
 * /wp-json/tribe/events/v1/events, 50 a page from today. Recurring events
 * come back once per date and are folded into one production.
 *
 * config: { base, perPage?, maxPages?, exclude?, categories? (only these slugs) }
 */
type TribeEvent = {
  id: number;
  url: string;
  title: string;
  description?: string;
  slug?: string;
  image?: { url?: string } | false;
  all_day?: boolean;
  start_date: string;
  end_date?: string;
  cost?: string;
  website?: string;
  venue?: { venue?: string } | unknown[];
  organizer?: { organizer?: string }[];
  categories?: { slug: string; name: string }[];
  status?: string;
};

export function tribeToCollected(e: TribeEvent): CollectedEvent {
  const [date, clock] = e.start_date.split(" ") as [string, string | undefined];
  const endDate = (e.end_date ?? e.start_date).slice(0, 10);
  const venue = !Array.isArray(e.venue) && e.venue && typeof e.venue === "object" ? str(e.venue.venue) : undefined;
  const price = str(clean(e.cost ?? ""));
  const p = parsePrice(price);
  const multiDay = endDate > date;
  const base: CollectedEvent = {
    // A recurrence's URL ends in its date; the production's page is the part before it.
    sourceUrl: e.url.replace(/\/\d{4}-\d{2}-\d{2}\/?$/, "/"),
    externalId: e.slug ?? String(e.id),
    title: clean(e.title),
    presenter: str(e.organizer?.[0]?.organizer ? clean(e.organizer[0].organizer) : undefined),
    venueName: venue ? clean(venue) : undefined,
    performances: [],
    complete: true,
    price,
    priceMin: p.min,
    priceMax: p.max,
    // "Event website" is anything from a ticket page to a vendor form: only ticket sellers count.
    ticketUrl: str(e.website) && /^https?:\/\//.test(e.website!) && /ticket|eventbrite|tix|ovationtix|cuebox|our\.show|onthestage|purplepass|ludus|showclix|etix|universe\.com|simpletix/i.test(e.website!) ? e.website : undefined,
    imageUrl: e.image && typeof e.image === "object" ? str(e.image.url) : undefined,
    sourceText: clean(e.description ?? "").slice(0, 600),
    categoryHint: e.categories?.map((c) => c.name).join(", "),
  };
  if (e.all_day && multiDay) return { ...base, startDate: date, endDate };
  return { ...base, performances: [{ date, time: e.all_day ? "" : (clock ?? "").slice(0, 5), priceMin: p.min, priceMax: p.max }] };
}

export const tribeAdapter: Adapter = {
  name: "tribe",
  kind: "generic",
  async collect(source, ctx) {
    const base = String(source.config.base ?? `https://${source.domain}`).replace(/\/$/, "");
    const perPage = Number(source.config.perPage ?? 50);
    const maxPages = Number(source.config.maxPages ?? 12);
    const only = Array.isArray(source.config.categories) ? (source.config.categories as string[]) : null;
    const raw: TribeEvent[] = [];
    const warnings: string[] = [];
    let complete = true;
    let url: string | null = `${base}/wp-json/tribe/events/v1/events?per_page=${perPage}&start_date=${ctx.today}&status=publish`;
    for (let page = 1; url && page <= maxPages; page += 1) {
      if (ctx.deadline && Date.now() > ctx.deadline) {
        complete = false;
        warnings.push("stopped at the deadline");
        break;
      }
      const res = await ctx.fetch(url, { accept: "json" });
      if (!res.ok) {
        if (page === 1) throw new Error(`Tribe API ${res.status} at ${url}`);
        warnings.push(`page ${page}: HTTP ${res.status}`);
        complete = false;
        break;
      }
      const body = JSON.parse(res.text) as { events?: TribeEvent[]; next_rest_url?: string; total_pages?: number };
      raw.push(...(body.events ?? []));
      url = body.next_rest_url ?? null;
      if (url && page === maxPages) complete = false;
    }
    let events = raw
      .filter((e) => !only || (e.categories ?? []).some((c) => only.includes(c.slug)))
      .map(tribeToCollected)
      .map((e) => ({ ...e, complete }));
    events = filterTitles(events, source.config);
    return {
      events: upcoming(groupEvents(events), ctx.today),
      warnings,
      contentHash: sha256(JSON.stringify(raw.map((e) => [e.id, e.start_date, e.title, e.cost, e.status]))),
    };
  },
};
