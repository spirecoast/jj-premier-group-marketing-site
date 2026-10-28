/**
 * The sales pages' number, date and address formats, with no "use client",
 * so a server component (components/sales/place-sales.tsx) and the client
 * table (sales-table.tsx) format the same way.
 */

export const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const int = new Intl.NumberFormat("en-US");
const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : dateFmt.format(d);
}

/** "LILAC SKY DR" → "Lilac Sky Dr"; ordinals and directionals keep their case. */
export function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (/^(n|s|e|w|ne|nw|se|sw)$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}
