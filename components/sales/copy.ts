/**
 * Every string on /sell/sold, in one place so the Fair Housing check
 * (lib/fair-housing.ts) can run over all of it at once. Nothing here is a
 * number: every figure on the page is computed from the county files or
 * absent. No people words, no licence numbers.
 */
export const SOLD_COPY = {
  title: "What sold on your street",
  lead: (months: number) => `Every home sale on your street in the last ${months} months.`,
  homeValueLink: "See the record for one address",
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
    truncated: (shown: number, total: number, hasZip: boolean) => `Showing the newest ${shown} of ${total}.${hasZip ? "" : " Add the ZIP to narrow it."}`,
    zipRequired: (streets: string[], zips: string[]) =>
      streets.length > 1
        ? `More than one street answers to that name (${streets.join(", ")}). Add the ZIP to pick one: ${zips.join(", ")}.`
        : `That street runs through more than one ZIP (${zips.join(", ")}). Add the ZIP to pick the stretch you mean.`,
    empty: (months: number) => `No qualified sales on that street in the county's record for the last ${months} months.`,
    emptyHelp: "Try the street without “Dr” or “Ave”, or add the ZIP. Foreclosures and transfers between family members aren’t counted.",
    notLoaded: "The county record isn't loaded on this site yet.",
    notLoadedHelp: "Until it is, tell us the street and we'll pull the sales by hand from the appraiser's file.",
    error: "The record didn't answer. Try once more in a moment.",
    source: (counties: string, asOf: string) => `Source: ${counties}, public record, as of ${asOf}.`,
    sourceDefault: "Manatee County Property Appraiser / Sarasota County Property Appraiser",
    note: "Not MLS data. The county’s record runs a few weeks behind closings.",
  },
  summary: {
    heading: (streets: string[]) => streets.join(" and "),
    sales: "Sales",
    salesNote: (homes: number, newer: number, months: number) =>
      newer ? `${homes} resale${homes === 1 ? "" : "s"}, ${newer} new build${newer === 1 ? "" : "s"} or lots, in ${months} months` : `In the last ${months} months`,
    medianPrice: "Median price",
    perSqft: "Price per sq ft",
    perSqftNote: (sample: number) => `Median of ${sample} ${sample === 1 ? "home" : "homes"} with a recorded size`,
    perSqftNone: "Too few homes with a recorded size",
    range: "Dates",
  },
  ask: {
    title: "Get a price for your home",
    body: "Give us the address. We’ll walk the house, compare it with the sales that match it, and call you with a number and the reason for it. No listing agreement needed.",
    submit: "Get the number",
    placeholder: "The year of the roof, anything you already know needs doing, and whether there's a house to buy next.",
  },
} as const;
