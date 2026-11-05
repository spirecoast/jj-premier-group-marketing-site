import { fill } from "@/lib/issues/copy";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";
import { TIDE_WEB_COPY as W } from "@/lib/tide/copy";
import { isIssueMonth } from "@/lib/tide/issues";
import { loadIssueModel } from "@/lib/tide/load";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The issue's share card: the issue by its own month, its cover line (or headline), and the three places. The data month isn't on it. */
export default async function Image({ params }: { params: Promise<{ issue: string }> }) {
  const { issue } = await params;
  const model = isIssueMonth(issue) ? await loadIssueModel(issue) : null;
  if (!model) return brandOgImage({ eyebrow: W.cardEyebrow, title: "Issue not found." });
  return brandOgImage({
    eyebrow: fill(W.coverEyebrow, { issue: model.issueLabel }),
    title: model.coverTitle ?? model.headline,
    meta: W.ogMeta,
    photo: model.cover.src,
  });
}
