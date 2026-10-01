import { getGuide, guideReadingMinutes } from "@/lib/guides";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuide(slug);
  if (!g) return brandOgImage({ eyebrow: "Guide", title: "Guide not found." });
  return brandOgImage({
    eyebrow: `Guide · ${g.sections.length} sections · ${guideReadingMinutes(g)} min read`,
    title: g.title,
    meta: `By ${g.author.name}`,
    photo: g.cover.src,
  });
}
