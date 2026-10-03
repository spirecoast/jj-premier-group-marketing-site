/**
 * Every string on /sell/home-value, in one place so the Fair Housing check
 * (lib/fair-housing.ts) runs over all of it in lib/sales/parcel.test.ts.
 * Nothing here is a number: the page never shows a value, a range or an
 * estimate, and every figure on it is computed from the county files or
 * absent. No people words, no licence numbers.
 */
export const HOME_VALUE_COPY = {
  eyebrow: "Selling · What your house is worth",
  title: "What the public record says about your house.",
  lead: "No algorithm guess. Type the address and we'll show you the county's own record for it, then tell you what that record can't see.",
  body: (months: number) =>
    `Two county property appraisers publish every qualified, arm's-length sale as public record. Give us the house number, the street and the ZIP, and this page lays out the last ${months} months on your street, the last sale the roll has for your address, and the things that move the number that aren't in any file.`,
  mono: "Public record first · a written range after the walk-through · never a number from a formula",
  form: {
    address: "Street address",
    addressPlaceholder: "9403 9th Ave NW",
    zip: "ZIP",
    zipPlaceholder: "34209",
    submit: "Show the record",
    searching: "Reading the roll…",
    hint: "Manatee and Sarasota counties. House number and street, then the ZIP; add the unit for a condo.",
    needNumber: "Add the house number so we can look up the address itself, not only the street.",
    needStreet: "Add the street after the house number.",
    needZip: "The ZIP is needed: a number and a street can repeat across towns.",
  },
  street: {
    eyebrow: "01 · Your street on the public record",
    title: (months: number) => `The last ${months} months on your street.`,
    partialMatch: "Not quite as typed. The closest the county spells it:",
    fuzzyMatch: "Nothing by that spelling. The county has this one, one letter off:",
    truncated: (shown: number, total: number) => `Showing the newest ${shown} of ${total}.`,
    empty: (months: number) => `No qualified sales on that street in the county's record for the last ${months} months.`,
    emptyHelp:
      "The record only counts arm's-length sales, so transfers for nominal consideration, foreclosures and new-build closings the roll hasn't caught up with won't appear. That's not nothing: it means the number for your house will lean on the streets around it, which is what the walk-through is for.",
    /** "{n} qualified sales in the last {months} months on {streets}: {homes} homes, {lots} vacant on the roll; median ${x} per square foot." */
    line: (n: number, months: number, streets: string[]) => `${n} qualified ${n === 1 ? "sale" : "sales"} in the last ${months} months on ${streets.join(" and ")}`,
    split: (homes: number, lots: number) => (lots ? `: ${homes} ${homes === 1 ? "home" : "homes"}, ${lots} vacant on the roll` : ""),
    perSqft: (x: string, sample: number) => `; median ${x} per square foot across the ${sample} ${sample === 1 ? "home" : "homes"} with a recorded living area.`,
    noPerSqft: ". Too few homes with a recorded living area for a median per square foot.",
    rollChanged:
      "The county's roll lags the closing: these rows are vacant on the roll or were updated after the sale, so the area and year are today's, not the day it sold, and they stay out of the median.",
    note: "Not MLS data. The county's roll runs a few weeks behind the closing table, and a sale the appraiser didn't qualify as arm's-length isn't shown.",
  },
  parcel: {
    eyebrow: "02 · This address on the record",
    title: "What the roll has for the house itself.",
    /** The last qualified sale on the parcel; the computed price follows on the page. */
    lastSale: (date: string) => `Last qualified sale on the record, ${date}:`,
    facts: {
      livingArea: "Living area on the roll",
      yearBuilt: "Year built on the roll",
      type: "Use on the roll",
      instrument: "Instrument",
      earlier: "Earlier qualified sales in the window",
    },
    rollNote:
      "The county roll is what it is: the living area and year built are what the appraiser carries today, not a measurement, and a permit the roll hasn't picked up won't show. If a figure here looks wrong to you, that's worth knowing before a buyer's appraiser sees it.",
    none: (address: string, months: number) =>
      `No qualified sale at ${address} in the county's record for the last ${months} months.`,
    noneHelp:
      "That's the common case: most houses on a street haven't changed hands in two years. It means the street's sales above, and the ones on the streets around it, are what the number will rest on.",
    noNumber: "Type a house number and we'll look up the address itself, not only the street.",
    units: (count: number) => `That number has ${count} units on the roll. The newest sale among them is below; add the unit (#) to the address to see one.`,
    dagger: "The roll's building facts changed after this sale, so the area and year are today's, not the day it sold.",
  },
  cant: {
    eyebrow: "03 · What the record can't tell you",
    title: "What moves the number here that isn't in any file.",
    intro: "The roll knows the lot, the living area and the year. It has no idea about the things a buyer's inspector, insurer and lender will ask about first:",
    items: [
      {
        title: "The roof and the wind mitigation.",
        body: "The year of the roof and what the mitigation report says about straps and openings set the insurance quote, and the quote is in every buyer's monthly number. The roll carries neither.",
      },
      {
        title: "The elevation certificate and the flood zone.",
        body: "It comes down to which zone, where the finished floor sits against base flood elevation, and whether a certificate exists at all. Two houses on one street can sit in different zones.",
      },
      {
        title: "The seawall and the dock.",
        body: "On the water, the cap, the panels and the dock's pilings are the line items a buyer prices before anything inside. The roll records waterfront; it doesn't walk the seawall.",
      },
      {
        title: "The condition inside.",
        body: "That means kitchens, baths, floors, windows, and what's been permitted and what hasn't. The roll's year built says when the house went up, not what's been done since.",
      },
      {
        title: "The HOA or CDD position.",
        body: "That means the dues, the reserves, a pending assessment and a CDD bond still on the tax bill. The buyer's lender reads the estoppel; the roll doesn't.",
      },
    ],
    outro: "None of that is a reason to guess. It's the reason the number comes after we've stood in the house.",
  },
  ask: {
    eyebrow: "04 · The ask",
    title: "That's the public record. The number that matters is the one after we walk it.",
    body:
      "Give us the address and the timing, and Joelyn or Jessica will pull the four comparable sales, drive the street, and call you with the number and the reason for it. You get a range in writing with the addresses behind it, within a day. No listing agreement attached; the number is yours either way.",
    submit: "Get the number",
    placeholder: "Tell us the year of the roof, anything you already know needs doing, and whether there's a house to buy next.",
    /** Carried into the message so the call starts from the record the seller already saw. */
    messageIntro: (address: string) => `Public record for ${address}:`,
    messageNoParcel: "No qualified sale at this address in the window.",
    messageParcel: (date: string, price: string, area: string | null, year: number | null) =>
      `Last qualified sale at this address: ${date}, ${price}${area ? `, ${area} sq ft on the roll` : ""}${year ? `, built ${year}` : ""}.`,
    disclaimer:
      "This is a comparative market analysis from a licensed REALTOR®, not an appraisal. If you sell, your buyer's lender orders the appraisal; pricing to the comps is how it comes in at contract.",
  },
  results: {
    notLoaded: "The county record isn't loaded on this site yet.",
    notLoadedHelp: "Until it is, send the address below and we'll pull the record by hand from the appraiser's file.",
    error: "The record didn't answer. Try once more in a moment.",
  },
  source: (counties: string, asOf: string) => `Source: ${counties}, public record, as of ${asOf}.`,
  sourceDefault: "Manatee County Property Appraiser and Sarasota County Property Appraiser",
  links: {
    sold: "Just the street, without the house: what sold on your street",
    valuation: "Skip the record and ask for the number",
  },
} as const;

/** Every string above, with the templated ones filled in with sample values, for the Fair Housing test. */
export function homeValueStrings(): string[] {
  const C = HOME_VALUE_COPY;
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(C);
  out.push(
    C.body(24),
    C.street.title(24),
    C.street.truncated(50, 80),
    C.street.empty(24),
    C.street.line(3, 24, ["9th Ave NW", "9th Ave W"]),
    C.street.split(2, 1),
    C.street.perSqft("X", 2),
    C.parcel.lastSale("Mar 2, 2026"),
    C.parcel.none("9403 9th Ave NW, 34209", 24),
    C.parcel.units(2),
    C.ask.messageIntro("9403 9th Ave NW, 34209"),
    C.ask.messageParcel("Mar 2, 2026", "X", "N", 1985),
    C.source(C.sourceDefault, "2026-10-01"),
  );
  return out;
}
