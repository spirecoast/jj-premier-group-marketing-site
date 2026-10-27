/**
 * Phone numbers as the forms take them. No imports, so the browser and the
 * server run the same code: the forms tidy a number when the field loses
 * focus, and the server schema (lib/leads/schema.ts) decides.
 *
 * A US or Canadian number (the North American plan) is ten digits, with or
 * without a leading 1, an area code and an exchange that don't start with 0
 * or 1. It comes back as "(941) 555-0100" and "+19415550100". A number that
 * starts with "+" and isn't +1 is kept as the visitor typed it (spacing
 * tidied) with 8 to 15 digits, for someone moving here from abroad.
 * Anything else, "941" or "call me after 5", is not a phone number.
 *
 * A small rule set rather than libphonenumber-js: the forms only need this
 * much, and the rules are short enough to test in full.
 */

export type Phone = { display: string; e164: string; country: "US" | "intl" };

const ALLOWED = /^[\d\s().+\-–—/]+$/;

export function parsePhone(raw: string | null | undefined): Phone | null {
  const text = (raw ?? "").trim();
  if (!text || !ALLOWED.test(text)) return null;
  const digits = text.replace(/\D/g, "");
  const plus = text.startsWith("+");
  if (plus && !digits.startsWith("1")) {
    if (digits.length < 8 || digits.length > 15) return null;
    return { display: text.replace(/\s+/g, " "), e164: `+${digits}`, country: "intl" };
  }
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(national)) return null;
  return {
    display: `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`,
    e164: `+1${national}`,
    country: "US",
  };
}
