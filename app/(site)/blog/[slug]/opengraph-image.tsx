import { getPost } from "@/lib/content";
import { formatDateLong } from "@/lib/content/format";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return brandOgImage({ eyebrow: "The Coast Market Report", title: "Report not found." });
  return brandOgImage({
    eyebrow: [p.edition ?? "The Coast Market Report", ...p.categories].join(" · "),
    title: p.title,
    meta: `${p.author.name} · ${formatDateLong(/^\d{4}-\d{2}-\d{2}$/.test(p.publishedAt) ? `${p.publishedAt}T12:00:00` : p.publishedAt)}`,
    photo: p.cover.src,
  });
}
