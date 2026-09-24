import { getEncoreIndex } from "@/lib/encore/data";

/** The calendar's client index. Static, regenerated hourly, cached for an hour at the edge. */
export const revalidate = 3600;

export async function GET() {
  return Response.json(getEncoreIndex(), { headers: { "Cache-Control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400" } });
}
