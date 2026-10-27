import type { IssueFigures } from "../issue";
import s2026_10 from "./2026-10.json";

/**
 * The frozen figures of every published Tide issue, one JSON file per issue,
 * written by `npm run tide:freeze -- <issue>` once the issue is out (docs/ISSUES.md,
 * "Freezing an issue"). The loader draws a published issue from its snapshot,
 * so the weekly sales refresh never changes a page a reader has already seen.
 * The freeze script rewrites this file from the folder's listing; add an
 * issue by running it, not by hand.
 */
// prettier-ignore
export const SNAPSHOTS: Readonly<Record<string, IssueFigures>> = {
  "2026-10": s2026_10 as IssueFigures,
};

export function snapshotFor(issue: string): IssueFigures | undefined {
  return SNAPSHOTS[issue];
}
