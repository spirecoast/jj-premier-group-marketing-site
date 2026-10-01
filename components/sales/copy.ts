/**
 * Every string on /sell/sold, in one place so the Fair Housing check
 * (lib/fair-housing.ts) can run over all of it at once. Nothing here is a
 * number: every figure on the page is computed from the county files or
 * absent. No people words, no licence numbers.
 */
export const SOLD_COPY = {
  eyebrow: "Selling · What sold on your street",
  title: "What sold on your street.",
  lead: "From the county's public record, not an estimate.",
  body: (months: number) =>
    `Type the street and the ZIP. We'll show every qualified, arm's-length sale the property appraiser has recorded there in the last ${months} months: the address, the date, the price, the living area. Nothing typed by hand, and no names.`,
  form: {
    street: "Street",
    streetPlaceholder: "Lilac Sky Dr",
    zip: "ZIP or city",
    zipPlaceholder: "34211",
    submit: "Show the sales",
    searching: "Looking…",
    hint: "Manatee and Sarasota counties. A house number isn't needed; the whole street comes back.",
  },
  results: {
    eyebrow: "01 · The record",
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
      vacant: "Vacant on the roll",
      other: "Other",
    } as const,
    /** Rows the roll has not caught up with: vacant on the roll, a 03/04 code, or built after the sale year. */
    rollChanged:
      "The county's roll lags the closing: these rows are vacant on the roll or were updated after the sale, so the area and year are today's, not the day it sold, and they stay out of the median.",
    partialMatch: "Not quite as typed. The closest the county spells it:",
    fuzzyMatch: "Nothing by that spelling. The county has this one, one letter off:",
    truncated: (shown: number, total: number, hasZip: boolean) => `Showing the newest ${shown} of ${total}.${hasZip ? "" : " Add the ZIP to narrow it."}`,
    zipRequired: (streets: string[], zips: string[]) =>
      streets.length > 1
        ? `More than one street answers to that name (${streets.join(", ")}). Add the ZIP to pick one: ${zips.join(", ")}.`
        : `That street runs through more than one ZIP (${zips.join(", ")}). Add the ZIP to pick the stretch you mean.`,
    empty: (months: number) => `No qualified sales on that street in the county's record for the last ${months} months.`,
    emptyHelp:
      "The record only counts arm's-length sales, so transfers for nominal consideration, foreclosures and new-build closings the roll hasn't caught up with won't appear. Try the street without its suffix, or the ZIP on its own with a shorter name.",
    notLoaded: "The county record isn't loaded on this site yet.",
    notLoadedHelp: "Until it is, tell us the street and we'll pull the sales by hand from the appraiser's file.",
    error: "The record didn't answer. Try once more in a moment.",
    source: (counties: string, asOf: string) => `Source: ${counties}, public record, as of ${asOf}.`,
    sourceDefault: "Manatee County Property Appraiser / Sarasota County Property Appraiser",
    note: "Not MLS data. The county's roll runs a few weeks behind the closing table, and a sale the appraiser didn't qualify as arm's-length isn't shown.",
  },
  summary: {
    /** "{n} qualified sales in the last {months} months on {streets}: {homes} homes, {lots} vacant on the roll; median ${x} per square foot." */
    line: (n: number, months: number, streets: string[]) =>
      `${n} qualified ${n === 1 ? "sale" : "sales"} in the last ${months} months on ${streets.join(" and ")}`,
    split: (homes: number, lots: number) =>
      lots ? `: ${homes} ${homes === 1 ? "home" : "homes"}, ${lots} vacant on the roll` : "",
    perSqft: (x: string, sample: number) => `; median ${x} per square foot across the ${sample} ${sample === 1 ? "home" : "homes"} with a recorded living area.`,
    noPerSqft: ". Too few homes with a recorded living area for a median per square foot.",
  },
  ask: {
    eyebrow: "02 · The ask",
    title: "That's the public record. The number that matters is the one after we walk it.",
    body:
      "Give us the address and we'll come to the house, pull the sales that actually compare to it, and call you with the number and the reason for it. No listing agreement attached; the number is yours either way.",
    submit: "Get the number",
    placeholder: "The year of the roof, anything you already know needs doing, and whether there's a house to buy next.",
  },
} as const;
