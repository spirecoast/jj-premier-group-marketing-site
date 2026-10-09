/**
 * An address setting that can name more than one inbox (TEAM_NOTIFY_EMAIL,
 * LEAD_ALERT_EMAIL): addresses separated by commas or semicolons, all of them
 * on the one email. Blank entries and repeats drop out.
 */
export function emailList(value: string | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of (value ?? "").split(/[,;]/)) {
    const address = part.trim();
    if (!address || seen.has(address.toLowerCase())) continue;
    seen.add(address.toLowerCase());
    out.push(address);
  }
  return out;
}
