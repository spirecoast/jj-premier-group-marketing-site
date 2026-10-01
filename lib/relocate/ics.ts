/**
 * The plan as an iCalendar file: one single-day all-day VEVENT per dated
 * milestone, with the basis, the window if any, and the source URL in the
 * description. Same escaping and
 * folding rules as app/api/calendar.ics/route.ts.
 */
import { formatDate, parseISO, type Plan } from "./plan";

/** RFC 5545 text escaping. */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** UTC timestamp in iCalendar basic format. */
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

/** YYYY-MM-DD to YYYYMMDD. */
const day = (iso: string) => iso.replace(/-/g, "");

/** The day after, for an all-day DTEND (exclusive). */
function nextDay(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return day(new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10));
}

/** Fold lines longer than 75 octets (RFC 5545 §3.1). */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (Buffer.byteLength(current + ch, "utf8") > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}

export function planToIcs(plan: Plan, opts: { siteName: string; domain: string; pageUrl: string; now: Date }): string {
  const { siteName, domain, pageUrl, now } = opts;
  const events = plan.milestones
    .filter((m) => m.date)
    .flatMap((m) => {
      // One day per event, on the milestone's own date; a window is described, not drawn as a banner.
      const start = m.date!;
      const end = m.date!;
      const description = [
        m.body,
        `Why this date: ${m.basis}`,
        m.source ? `Source: ${m.source.label}` : undefined,
        m.source?.url,
        m.dateRange ? `Window: ${formatDate(m.dateRange.start)} to ${formatDate(m.dateRange.end)}` : undefined,
        `Your plan: ${pageUrl}`,
      ]
        .filter(Boolean)
        .join("\n");
      return [
        "BEGIN:VEVENT",
        `UID:relocate-${m.id}-${day(m.date!)}@${domain}`,
        `DTSTAMP:${stamp(now)}`,
        `DTSTART;VALUE=DATE:${day(start)}`,
        `DTEND;VALUE=DATE:${nextDay(end)}`,
        `SUMMARY:${esc(m.title)}`,
        `DESCRIPTION:${esc(description)}`,
        `URL:${m.source?.url ?? pageUrl}`,
        `CATEGORIES:${esc(m.phase.toUpperCase())}`,
        "END:VEVENT",
      ];
    });

  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${siteName}//Relocation Planner//EN`,
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${esc(`Moving to the Suncoast · ${formatDate(plan.answers.moveInDate)} · ${siteName}`)}`,
      "X-WR-TIMEZONE:America/New_York",
      `X-WR-CALDESC:${esc("Your relocation plan: the contract dates, the closing week and the days Florida gives a new resident, each with its source.")}`,
      ...events,
      "END:VCALENDAR",
    ]
      .map(fold)
      .join("\r\n") + "\r\n"
  );
}
