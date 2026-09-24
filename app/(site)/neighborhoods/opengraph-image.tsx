import { getIndexEntries } from "@/lib/neighborhoods/data";
import { OG_CONTENT_TYPE, OG_SIZE, constellationOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const entries = await getIndexEntries();
  const points = entries.filter((e) => e.x !== null && e.y !== null).map((e): [number, number, number] => [e.x!, e.y!, e.r ? 0.5 : 0.25]);
  return constellationOgImage({
    eyebrow: "Atlas · The neighborhood explorer",
    title: "Every place in Lakewood Ranch, Sarasota and Bradenton.",
    meta: `${entries.length.toLocaleString()} areas, communities and enclaves on one map`,
    points,
  });
}
