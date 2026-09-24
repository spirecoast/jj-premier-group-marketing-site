/**
 * The neighborhood dataset's types, shared with the scripts that maintain it.
 * The schema file is the source of truth; this module re-exports it so app
 * code imports from one place.
 */
export type {
  EvacuationZone,
  HomeType,
  Neighborhood as NeighborhoodRecord,
  NeighborhoodLevel,
  NeighborhoodSearchEntry,
  NeighborhoodSource,
  NeighborhoodStatus,
  NeighborhoodType,
  ResearchDepth,
  WaterAccess,
  ZonedSchools,
} from "../../neighborhood-data/schema/neighborhood";

export const LEVELS = ["area", "community", "enclave"] as const;
export const STATUSES = ["selling", "coming-soon", "established", "built-out"] as const;
export const TYPES = [
  "master-planned community",
  "village",
  "neighborhood",
  "subdivision",
  "gated community",
  "golf community",
  "condo community",
  "historic district",
  "downtown district",
  "island",
] as const;
