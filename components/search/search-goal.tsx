"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { resultsBucket } from "@/lib/search/types";

/**
 * Fires the Plausible `Search` goal once per query shown, with the size of
 * the answer as a bucket and, when the query read as a street, an address or
 * a ZIP, the intent, and when the answer card showed, which kind of answer
 * it was. The query itself is never sent: people type names and addresses
 * into search boxes.
 */
export function SearchGoal({ q, count, intent, answer }: { q: string; count: number; intent?: "street" | "address" | "zip"; answer?: "faq" | "definition" | "fact" | "decline" }) {
  useEffect(() => {
    if (q) track("Search", { results: resultsBucket(count), ...(intent ? { intent } : {}), ...(answer ? { answer } : {}) });
  }, [q, count, intent, answer]);
  return null;
}
