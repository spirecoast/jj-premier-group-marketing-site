import type { EncoreEvent, EncoreIndex, EncorePerf } from "../encore/index-format";
import type { Sale } from "../sales/types";
import type { FooterInput } from "./render";

/**
 * Fixtures for lib/issues/*.test.ts: a small Encore index and a set of
 * county sales, in the shapes the real loaders produce. Nothing here is
 * real; every name is made up.
 */

export const SITE = "https://jjpremiergroup.com";

export const FOOTER: Omit<FooterInput, "product"> = {
  siteUrl: SITE,
  domain: "jjpremiergroup.com",
  teamName: "JJ Premier Group",
  brokerageName: "Coldwell Banker Realty",
  officeAddress: { street: "100 Example Way, Suite 1", city: "Lakewood Ranch", state: "FL", zip: "34202" },
  phoneDisplay: "(941) 907-1033",
};

export const FOOTER_NO_STREET: Omit<FooterInput, "product"> = { ...FOOTER, officeAddress: { street: "", city: "Lakewood Ranch", state: "FL", zip: "" } };

/** Wall-clock America/New_York in October (EDT, UTC-4) to epoch ms. */
const at = (day: string, time: string) => Date.parse(`${day}T${time || "00:00"}:00-04:00`);

type Spec = Omit<EncoreEvent, "s" | "vn"> & { s: string; vn?: string; dates?: [string, string][] };

/**
 * Thirty productions in the week of October 5 to 11, 2026, ten per market,
 * across the categories and a handful of venues, plus: one sold out, one
 * with performances only the week after, two exhibitions on view and one
 * that opens later, one that closed before the week.
 */
export function encoreFixture(): EncoreIndex {
  const cats = ["music", "theater", "gallery", "talks", "film", "festival", "family", "market"] as const;
  const markets = ["lakewood-ranch", "sarasota", "bradenton"] as const;
  const specs: Spec[] = [];
  for (let i = 0; i < 30; i += 1) {
    const m = markets[i % 3]!;
    const day = `2026-10-${String(5 + (i % 7)).padStart(2, "0")}`;
    specs.push({
      s: `show-${i}`,
      t: `Show ${i}`,
      c: cats[i % cats.length]!,
      v: `${m}-venue-${i % 4}`,
      vn: `Venue ${i % 4} in ${m}`,
      m,
      sum: i % 2 ? `A one-line summary for show ${i}.` : undefined,
      dates: [[day, i % 5 === 0 ? "14:00" : "19:30"], [`2026-10-${String(5 + ((i + 3) % 7)).padStart(2, "0")}`, "19:30"]],
    });
  }
  specs.push({ s: "sold-out-gala", t: "Sold Out Gala", c: "music", v: "sarasota-venue-0", m: "sarasota", so: 1, dates: [["2026-10-06", "19:00"]] });
  specs.push({ s: "next-week-only", t: "Next Week Only", c: "theater", v: "bradenton-venue-1", m: "bradenton", dates: [["2026-10-13", "19:30"]] });
  specs.push({ s: "prints-on-paper", t: "Prints on Paper", c: "gallery", v: "sarasota-venue-2", m: "sarasota", x: 1, f: "2026-09-01", r: "2026-10-31" });
  specs.push({ s: "river-photographs", t: "River Photographs", c: "gallery", v: "bradenton-venue-3", m: "bradenton", x: 1, f: "2026-10-08", r: "2026-12-15" });
  specs.push({ s: "opens-in-november", t: "Opens in November", c: "gallery", v: "lakewood-ranch-venue-1", m: "lakewood-ranch", x: 1, f: "2026-11-01", r: "2027-01-10" });
  specs.push({ s: "closed-in-september", t: "Closed in September", c: "gallery", v: "lakewood-ranch-venue-2", m: "lakewood-ranch", x: 1, f: "2026-08-01", r: "2026-09-30" });

  const events: EncoreEvent[] = [];
  const perfs: EncorePerf[] = [];
  for (const { dates, ...e } of specs) {
    const idx = events.length;
    events.push({ ...e, vn: e.vn ?? `Venue ${e.v}` });
    for (const [day, time] of dates ?? []) {
      const start = at(day, time);
      perfs.push([idx, day, time, start, start + 2 * 3600_000]);
    }
  }
  perfs.sort((a, b) => a[3] - b[3]);
  return { generated: "2026-10-01T10:00:00.000Z", events, perfs, venues: [] };
}

export function sale(over: Partial<Sale>): Sale {
  return {
    county: "manatee",
    parcelId: "0000000000",
    number: "100",
    predir: "",
    street: "EXAMPLE",
    suffix: "ST",
    postdir: "",
    unit: "",
    city: "BRADENTON",
    zip: "34209",
    saleDate: "2026-08-10",
    salePrice: 400_000,
    qualified: true,
    qualCode: "01",
    instrument: "WD",
    livingArea: 2000,
    lotSqft: 8000,
    yearBuilt: 1990,
    beds: null,
    baths: null,
    propertyUse: "single-family",
    ...over,
  };
}

/**
 * Four sales a month in each market from August 2025 to July 2026 (the
 * baseline), then August 2026: five Lakewood Ranch home sales with known
 * figures, one Sarasota sale (short of its typical four), none in
 * Bradenton, and rows that must not count.
 */
export function salesFixture(): Sale[] {
  const rows: Sale[] = [];
  const base: [string, string, string][] = [
    ["LAKEWOOD RANCH", "34202", "manatee"],
    ["SARASOTA", "34236", "sarasota"],
    ["BRADENTON", "34209", "manatee"],
  ];
  for (let k = 0; k < 12; k += 1) {
    const d = new Date(Date.UTC(2025, 7 + k, 15));
    const day = d.toISOString().slice(0, 10);
    for (const [city, zip, county] of base) {
      for (let j = 0; j < 4; j += 1) rows.push(sale({ city, zip, county: county as Sale["county"], saleDate: day, street: `BASELINE ${j}`, salePrice: 300_000 + j * 10_000 }));
    }
  }
  rows.push(
    // Lakewood Ranch, August 2026.
    sale({ city: "LAKEWOOD RANCH", zip: "34211", street: "LILAC SKY", suffix: "TER", saleDate: "2026-08-03", salePrice: 500_000, livingArea: 2000, yearBuilt: 2015 }),
    sale({ city: "LAKEWOOD RANCH", zip: "34211", street: "LILAC SKY", suffix: "TER", saleDate: "2026-08-04", salePrice: 600_000, livingArea: 2400, yearBuilt: 2016 }),
    // A Sarasota County ZIP, but the county gives the city as Lakewood Ranch: counts there.
    sale({ county: "sarasota", city: "LAKEWOOD RANCH", zip: "34240", street: "GANDER", suffix: "TER", saleDate: "2026-08-05", salePrice: 700_000, livingArea: null, yearBuilt: null, propertyUse: "vacant" }),
    sale({ city: "LAKEWOOD RANCH", zip: "34202", street: "GANDER", suffix: "TER", saleDate: "2026-08-06", salePrice: 800_000, livingArea: 2000, yearBuilt: 2026 }),
    sale({ city: "LAKEWOOD RANCH", zip: "34202", street: "MANOR", suffix: "LOOP", saleDate: "2026-08-07", salePrice: 900_000, livingArea: 3000, yearBuilt: 2010, qualCode: "03" }),
    // Not counted: a non-residential parcel, an unqualified transfer, a ZIP outside the three markets.
    sale({ city: "LAKEWOOD RANCH", zip: "34202", street: "COMMERCE", suffix: "CT", saleDate: "2026-08-08", salePrice: 2_000_000, propertyUse: "other" }),
    sale({ city: "LAKEWOOD RANCH", zip: "34202", street: "GANDER", suffix: "TER", saleDate: "2026-08-09", salePrice: 10_000, qualified: false, qualCode: "11" }),
    sale({ county: "sarasota", city: "VENICE", zip: "34293", street: "CANE", suffix: "AVE", saleDate: "2026-08-10", salePrice: 450_000 }),
    // Sarasota, August 2026: one sale against a typical four.
    sale({ county: "sarasota", city: "SARASOTA", zip: "34236", street: "GULF OF MEXICO", suffix: "DR", saleDate: "2026-08-11", salePrice: 1_250_000, livingArea: 1250, yearBuilt: 1999, propertyUse: "condo" }),
  );
  return rows;
}

export const MANIFEST_COMPLETE = {
  generatedAt: "2026-09-15T11:00:00.000Z",
  counties: { manatee: { label: "Manatee County Property Appraiser", to: "2026-09-12" }, sarasota: { label: "Sarasota County Property Appraiser", to: "2026-09-12" } },
};

export const MANIFEST_SHORT = {
  generatedAt: "2026-08-25T11:00:00.000Z",
  counties: { manatee: { label: "Manatee County Property Appraiser", to: "2026-08-20" }, sarasota: { label: "Sarasota County Property Appraiser", to: "2026-08-22" } },
};

/** Words the issues never use about a place, a show or a market. */
export const SUPERLATIVES = /\b(best|finest|greatest|biggest|hottest|top-rated|amazing|stunning|incredible|perfect|unbeatable|ultimate|unparalleled|world-class|luxurious|must-see|don['’]t miss|exclusive|premier|spectacular|breathtaking)\b/i;

/** A license number in the form Florida issues them. */
export const LICENSE = /\b(SL|BK)\s?\d{5,}\b/i;
