import { DATASET_VERSION, getIndexEntries } from "@/lib/neighborhoods/data";

/**
 * The explorer's search index: every place with its short facts and a
 * normalized search string, about 90KB gzipped. Built once at deploy time
 * and cached hard; the client appends the dataset version to bust it.
 */
export const dynamic = "force-static";

export async function GET() {
  const entries = await getIndexEntries();
  return Response.json(
    { version: DATASET_VERSION, entries },
    { headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
