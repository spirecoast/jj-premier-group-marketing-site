/**
 * Every string on /sell/sold, in one place so the Fair Housing check
 * (lib/fair-housing.ts) can run over all of it at once. Nothing here is a
 * number: every figure on the page is computed from the county files or
 * absent. No people words, no licence numbers. Microcopy only: plain and
 * warm, contractions, nothing cute.
 */
export const SOLD_COPY = {
  title: "What sold on your street",
  lead: (months: number) => `What sold on your street in the last ${months} months.`,
  homeValueLink: "See the record for one address",
  share: "Share this street",
  form: {
    street: "Your street",
    streetPlaceholder: "Lilac Sky Dr",
    zip: "ZIP or city",
    zipPlaceholder: "34211",
    submit: "Show the sales",
    searching: "Looking…",
    hint: "Manatee and Sarasota counties. No house number needed.",
  },
  results: {
    columns: {
      address: "Address",
      date: "Sold",
      price: "Price",
      sqft: "Living sq ft",
      perSqft: "$ / sq ft",
      year: "Built",
      type: "Type",
    },
    typeLabel: {
      "single-family": "Detached house",
      condo: "Condo",
      townhome: "Townhome",
      villa: "Villa or paired home",
      vacant: "New build or lot",
      other: "Other",
    } as const,
    newBuild: "New build",
    lot: "Lot",
    /** Shown when any row is a new build or a lot: the county still lists the parcel as land. */
    newBuildNote:
      "New build: the home sold, but the county records a new house on the next January 1 roll, so its size and year built aren’t on the record yet. New builds and lots are left out of the price per square foot.",
    /** What a cell says when the record has no size for the row. */
    missing: { newBuild: "Not recorded yet", lot: "Land only", other: "Not recorded" },
    /** Rows the county updated after the sale. */
    rollChanged:
      "The county updated this record after the sale, so size and year built may describe the house as it is now. These sales are left out of the price per square foot.",
    partialMatch: "Not quite as typed. The closest the county spells it:",
    fuzzyMatch: "Nothing by that spelling. The county has this one, one letter off:",
    truncated: (shown: number, total: number) => `Showing the newest ${shown} of ${total}.`,
    /** Over the chips an ambiguous search offers: one spelling or ZIP each. */
    zipRequired: (streets: string[]) => (streets.length > 1 ? "More than one street answers to that name. Pick the one you mean." : "That street runs through more than one ZIP. Pick the stretch you mean."),
    optionsLabel: "Streets that answer",
    /** A chip's accessible name: "Main St in 34221, 12 sales". */
    option: (street: string, zip: string, count: number) => `${street} in ${zip}, ${count} ${count === 1 ? "sale" : "sales"}`,
    /** The typed text names a place on Atlas or a postal city, not a street. */
    placeChip: (place: string) => `Sales in ${place}`,
    placeHint: "That reads as a place, not a street.",
    areaLabel: "ZIP area",
    areaHeading: (place: string) => `Sales in ${place}`,
    areaNote: (zips: string[]) => `Every qualified sale in ZIP ${zips.length === 1 ? zips[0] : zips.join(", ")}, newest first.`,
    recentHeading: "Recent searches",
    recentClear: "Clear",
    /** "Manatee records through Sep 24, 2026 · Sarasota through Oct 20, 2026": how far each county's file reaches. */
    through: (county: string, date: string) => `${county} records through ${date}`,
    throughShort: (county: string, date: string) => `${county} through ${date}`,
    empty: (months: number) => `No qualified sales on that street in the county's record for the last ${months} months.`,
    emptyHelp: "Try the street without “Dr” or “Ave”, or add the ZIP. Foreclosures and transfers between family members aren’t counted.",
    notLoaded: "The county record isn't loaded on this site yet.",
    notLoadedHelp: "Until it is, tell us the street and we'll pull the sales by hand from the appraiser's file.",
    error: "The record didn't answer. Try once more in a moment.",
    /** "Source: Manatee County Property Appraiser, public record. Manatee records through Sep 24, 2026." */
    source: (counties: string, through: string) => `Source: ${counties}, public record. ${through}.`,
    sourceDefault: "Manatee County Property Appraiser / Sarasota County Property Appraiser",
    note: "Not MLS data. The county’s record runs a few weeks behind closings.",
    /** The table behind its disclosure. */
    allSales: (n: string) => `All ${n} ${n === "1" ? "sale" : "sales"}`,
    showing: (shown: number, total: number) => `Showing ${shown} of ${total}, newest first.`,
    showMore: (n: number) => `Show ${n} more`,
  },
  parcel: {
    /** "Last sale Jul 30, 2026 · $410,000 · 1,872 sq ft · $219 per sq ft · built 2024 · Detached house" */
    lastSale: "Last sale",
    perSqft: (x: string) => `${x} per sq ft`,
    built: (year: number) => `built ${year}`,
    units: (n: number) => `${n} units at this number; the newest sale among them is shown`,
    none: (address: string, months: number) => `No qualified sale at ${address} in the county’s record for the last ${months} months. The street is below.`,
  },
  timeline: {
    title: (months: number) => `Every sale on the street, ${months} months`,
    legendResale: "Resales",
    legendNewer: "New builds and lots",
    legendMedian: (group: string) => `Median of ${group}`,
    /** The figure in words, for a screen reader. */
    label: (count: number, from: string, to: string, resales: string | null, newer: string | null) =>
      `${count} ${count === 1 ? "sale" : "sales"} from ${from} to ${to}${resales ? `; median resale ${resales}` : ""}${newer ? `; median new build or lot ${newer}` : ""}. The table below lists each one.`,
  },
  summary: {
    heading: (streets: string[]) => streets.join(" and "),
    /** "Lilac Sky Ter · 34211 · Bradenton" */
    headingLine: (parts: string[]) => parts.join(" · "),
    sales: "Sales",
    salesNote: (homes: number, newer: number, months: number) =>
      newer ? `${homes} resale${homes === 1 ? "" : "s"}, ${newer} new build${newer === 1 ? "" : "s"} or lots, in ${months} months` : `In the last ${months} months`,
    medianPrice: "Median price",
    /** The two groups a seller can read the median for, and the one filtered to homes like theirs. */
    groupResales: "Resales",
    groupNewer: "New builds and lots",
    groupLike: "Like yours",
    groupLabel: "Which sales the median reads",
    chip: (group: string, n: number) => `${group} · ${n}`,
    likeChip: (from: string, to: string, n: number) => `Like yours · ${from} to ${to} sq ft · ${n}`,
    likeNote: "The size band comes from the house’s recorded living area. The timeline and the table keep every sale; the median and the price per sq ft are the resales in the band.",
    medianOf: (group: string) => `Median price · ${group}`,
    medianNote: (n: number, group: string) => `${n} ${group.toLowerCase()}`,
    medianNoteLike: (n: number, from: string, to: string) => `${n} resale${n === 1 ? "" : "s"}, ${from} to ${to} sq ft`,
    medianNone: "None in the window",
    perSqft: "Price per sq ft",
    perSqftNote: (sample: number) => `Median of ${sample} ${sample === 1 ? "home" : "homes"} with a recorded size`,
    perSqftNone: "Too few homes with a recorded size",
    range: "Dates",
    /** A hand-off to the Sale Calculator at the street's median price. */
    startSheet: "Start a sale sheet at this price",
  },
  ask: {
    title: "Get a price for your home",
    body: "Give us the address. We’ll walk the house, compare it with the sales that match it, and call you with a number and the reason for it. No listing agreement needed.",
    /** The link to the ask on /sell/home-value, with the street searched when there is one. */
    link: "Get the number",
    linkFor: (street: string) => `Ask for the number for ${street}`,
    linkNote: "One short form: the address, the timing, and anything you already know about the house.",
  },
} as const;
