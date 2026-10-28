import { createHash } from "node:crypto";

/**
 * The pure half of scripts/forget.ts: reading the request, the hashes kept
 * as the record, and the receipt. The database work is in the script.
 */

export type EraseRequest = { email: string | null; phone: string | null; confirm: boolean };

export function normalizeEmail(value: string | null | undefined): string | null {
  const e = (value ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

/** The last ten digits of a US number ("(941) 555-0100", "+1 941 555 0100" → "9415550100"); null when fewer than ten. */
export function normalizePhone(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

/** `--email a@b.com`, `--phone "(941) 555-0100"`, `--confirm`. Throws a plain message on bad input. */
export function parseEraseArgs(argv: string[]): EraseRequest {
  const value = (flag: string): string | null => {
    const i = argv.findIndex((a) => a === flag || a.startsWith(`${flag}=`));
    if (i < 0) return null;
    const a = argv[i]!;
    return a.includes("=") ? a.slice(a.indexOf("=") + 1) : (argv[i + 1] ?? null);
  };
  const rawEmail = value("--email");
  const rawPhone = value("--phone");
  const email = normalizeEmail(rawEmail);
  const phone = normalizePhone(rawPhone);
  if (rawEmail && !email) throw new Error(`"${rawEmail}" isn't an email address.`);
  if (rawPhone && !phone) throw new Error(`"${rawPhone}" doesn't have ten digits.`);
  if (!email && !phone) throw new Error("Give --email, --phone or both.");
  return { email, phone, confirm: argv.includes("--confirm") };
}

/** What one erasure found (a dry run) or removed, per table. */
export type EraseCounts = Record<string, number>;

/** The labels the receipt uses, in the order it lists them. */
export const ERASE_TABLES: [key: string, label: string][] = [
  ["leads", "form submissions (leads, with their delivery records)"],
  ["referrals", "referrals naming this person, scrubbed from the referrer's record"],
  ["contacts", "contact records (contacts, with their events)"],
  ["events", "other events naming this person, scrubbed"],
  ["subscriptions", "newsletter subscriptions"],
  ["deliveries", "newsletter email records"],
  ["watches", "Street Watch watches"],
  ["watchDigests", "Street Watch digest records"],
];

/** The text a person can be sent: what was done, when, and what is held elsewhere. */
export function eraseReceipt(req: Pick<EraseRequest, "email" | "phone" | "confirm">, counts: EraseCounts, at: Date): string {
  const who = [req.email, req.phone ? `phone ending ${req.phone.slice(-4)}` : null].filter(Boolean).join(" and ");
  const lines = [
    req.confirm ? `Erased from the site database on ${at.toISOString()}: ${who}.` : `Dry run on ${at.toISOString()} for ${who}. Nothing was changed; add --confirm to erase.`,
    "",
    ...ERASE_TABLES.map(([key, label]) => `  ${String(counts[key] ?? 0).padStart(4)}  ${label}`),
    "",
  ];
  if (req.confirm) {
    lines.push(
      "Kept: one row in `erasures` with the date, these counts and a SHA-256 of the address and number, so the request can be shown to have been done. Not the address itself.",
      "",
    );
  }
  lines.push(
    "Held outside the site database, to handle by hand:",
    "  - Home Platform (the CRM): delete the contact there, under the brokerage's policy.",
    "  - Zapier: task history for the lead Zap keeps each payload for its own retention period; delete the runs in Zapier → Zap history if needed.",
    "  - The team's inboxes: the \"New lead\" emails for this person.",
    "  - Resend: the site keeps no contact list there; its logs of emails sent expire on Resend's own schedule.",
  );
  return lines.join("\n");
}
