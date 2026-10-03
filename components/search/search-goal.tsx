"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { resultsBucket } from "@/lib/search/types";

/**
 * Fires the Plausible `Search` goal once per query shown, with the size of
 * the answer as a bucket. The query itself is never sent: people type names
 * and addresses into search boxes.
 */
export function SearchGoal({ q, count }: { q: string; count: number }) {
  useEffect(() => {
    if (q) track("Search", { results: resultsBucket(count) });
  }, [q, count]);
  return null;
}
