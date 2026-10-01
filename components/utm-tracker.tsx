"use client";

import { useEffect } from "react";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

/** localStorage key for the first-touch record. The old sessionStorage key was "utm". */
export const FIRST_TOUCH_KEY = "first-touch";
/** First touch is kept for 90 days, then the next visit starts a new one. */
export const FIRST_TOUCH_TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * What a visitor's first touch looked like. Every value is a string so the
 * forms can forward the whole record as `utm__<key>` hidden fields without
 * knowing the keys, and `actions/submit-lead.ts` stores it as `contacts.utm`.
 */
export type FirstTouch = Partial<Record<(typeof UTM_KEYS)[number], string>> & {
  /** ISO timestamp of the capture; also the expiry clock. */
  captured_at: string;
  /** Path of the first page the visitor landed on. */
  landing_path: string;
  /** The referring site, when it was not this one. */
  referrer?: string;
};

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isFresh(record: FirstTouch): boolean {
  const at = Date.parse(record.captured_at);
  return Number.isFinite(at) && Date.now() - at < FIRST_TOUCH_TTL_MS;
}

function readStored(): FirstTouch | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(FIRST_TOUCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FirstTouch;
    if (!parsed || typeof parsed.captured_at !== "string") return null;
    if (!isFresh(parsed)) {
      store.removeItem(FIRST_TOUCH_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function externalReferrer(): string | undefined {
  const ref = document.referrer;
  if (!ref) return undefined;
  try {
    const host = new URL(ref).host;
    return host && host !== window.location.host ? ref : undefined;
  } catch {
    return undefined;
  }
}

/**
 * First-touch attribution. On a visitor's first page in 90 days this stores
 * the landing path, the external referrer, a timestamp and any utm_*, gclid
 * or fbclid params in localStorage. Forms read it on submit and attach it as
 * hidden fields, ending up in `contacts.utm`.
 *
 * First-touch wins: an existing, unexpired record is never overwritten, so a
 * buyer who came from an ad and returns next week from a search still gets
 * attributed to the ad. No cookies: nothing here is sent to the server until
 * the visitor submits a form.
 */
export function UtmTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const store = storage();
    if (!store) return;
    if (readStored()) return;

    const params = new URLSearchParams(window.location.search);
    const record: FirstTouch = {
      captured_at: new Date().toISOString(),
      landing_path: window.location.pathname,
    };
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) record[k] = v.slice(0, 200);
    }
    const referrer = externalReferrer();
    if (referrer) record.referrer = referrer.slice(0, 200);

    try {
      store.setItem(FIRST_TOUCH_KEY, JSON.stringify(record));
    } catch {
      // Storage full or blocked; attribution is best effort.
    }
  }, []);

  return null;
}

/**
 * Read the stored first touch for hidden form fields. Returns empty if none
 * captured yet or the record has expired (client-only). The forms forward
 * every key as `utm__<key>`.
 */
export function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const record = readStored();
  if (!record) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(record)) {
    if (typeof v === "string" && v) out[k] = v;
  }
  return out;
}

/** The typed first-touch record, for anything that wants more than flat strings. */
export function readFirstTouch(): FirstTouch | null {
  if (typeof window === "undefined") return null;
  return readStored();
}
