import { SITE_TIMEZONE } from "@/lib/content/format";

const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: SITE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** YYYY-MM-DD in the site's timezone. Shared by the server and the browser (the static calendar checks "today" on arrival). */
export function localDay(ms: number): string {
  const p = Object.fromEntries(dayFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
