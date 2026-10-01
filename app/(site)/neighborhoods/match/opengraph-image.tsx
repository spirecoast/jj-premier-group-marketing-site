import { getIndexEntries } from "@/lib/neighborhoods/data";
import { QUESTIONS } from "@/lib/neighborhoods/match";
import { OG_CONTENT_TYPE, OG_SIZE, constellationOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const entries = await getIndexEntries();
  const points = entries.filter((e) => e.x !== null && e.y !== null).map((e): [number, number, number] => [e.x!, e.y!, e.r ? 0.5 : 0.25]);
  return constellationOgImage({
    eyebrow: "Atlas match",
    title: "Ten questions about the place. None about you.",
    meta: `${QUESTIONS.length} questions · ${entries.length.toLocaleString()} places · no ranking, no score`,
    points,
  });
}
