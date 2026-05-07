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

const STORAGE_KEY = "utm";

/**
 * First-touch UTM capture. On first visit with utm_* params, persists them in
 * sessionStorage (one origin = one session). Forms read this on submit and
 * attach as hidden fields, ending up in `contacts.utm`.
 *
 * First-touch wins: an existing record is never overwritten in the same
 * session, so a buyer who came from an ad and later browsed organically still
 * gets attributed to the ad.
 */
export function UtmTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const captured: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) captured[k] = v;
    }
    if (Object.keys(captured).length === 0) return;

    captured["captured_at"] = new Date().toISOString();
    captured["landing_path"] = window.location.pathname;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
  }, []);

  return null;
}

/**
 * Read currently-stored UTM values for hidden form fields. Returns empty if
 * none captured yet (client-only).
 */
export function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
