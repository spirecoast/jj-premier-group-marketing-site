import type { NeighborhoodLevel, NeighborhoodStatus, NeighborhoodType } from "./types";

export const LEVEL_LABEL: Record<NeighborhoodLevel, string> = { area: "Area", community: "Community", enclave: "Enclave" };

export const STATUS_LABEL: Record<NeighborhoodStatus, string> = {
  selling: "New homes selling",
  "coming-soon": "Coming soon",
  established: "Established",
  "built-out": "Built out",
};

export const TYPE_LABEL: Record<NeighborhoodType, string> = {
  "downtown district": "Downtown district",
  island: "Island",
  "historic district": "Historic district",
  neighborhood: "Neighborhood",
  "master-planned community": "Master-planned community",
  village: "Village",
  "golf community": "Golf community",
  "gated community": "Gated community",
  "condo community": "Condominium community",
  subdivision: "Subdivision",
};

/** "Sep 2026" from an ISO date. */
export function monthYear(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

export function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
