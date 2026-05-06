/**
 * Locale-stable formatters for server-rendered dashboard cells.
 * Hardcoded to en-US so server/client never disagree.
 */
const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return dateFmt.format(d);
}

export function formatDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  return dateTimeFmt.format(d);
}

export function formatRelative(d: Date | null | undefined): string {
  if (!d) return "—";
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(d);
}
