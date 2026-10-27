"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { resultsBucket } from "@/lib/search/types";

/**
 * Fires the Plausible `Search` goal once per query shown, with the size of
 * the answer as a bucket and, when the query read as a street, an address or
 * a ZIP, the intent. The query itself is never sent: people type names and
 * addresses into search boxes.
 */
export function SearchGoal({ q, count, intent }: { q: string; count: number; intent?: "street" | "address" | "zip" }) {
  useEffect(() => {
    if (q) track("Search", intent ? { results: resultsBucket(count), intent } : { results: resultsBucket(count) });
  }, [q, count, intent]);
  return null;
}
