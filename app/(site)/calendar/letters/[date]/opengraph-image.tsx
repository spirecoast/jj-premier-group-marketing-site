import { fill } from "@/lib/issues/copy";
import { LETTER_COPY as L, NEWSLETTERS_COPY as C } from "@/lib/newsletters/copy";
import { encoreLetterWeeks, loadEncoreLetter } from "@/lib/newsletters/encore";
import { encoreLetterAnswer } from "@/lib/newsletters/weeks";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The Encore masthead's photograph (lib/content/mastheads.ts), so a shared issue looks like the calendar it comes from. */
const PHOTO = "/images/library/culture-opera-house-red-seats.jpg";

/** A Monday issue's share card: its title, and the picks out of the week's performances. */
export default async function Image({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const { current, listed } = await encoreLetterWeeks();
  if (encoreLetterAnswer(date, listed, current) !== "page") return brandOgImage({ eyebrow: L.ogEyebrow, title: C.heading, meta: C.ogMeta, photo: PHOTO });
  const { issue } = await loadEncoreLetter(date);
  const performances = new Intl.NumberFormat("en-US").format(issue.performances);
  return brandOgImage({
    eyebrow: L.ogEyebrow,
    title: issue.title,
    meta: issue.picks.length ? fill(L.ogMeta, { picks: issue.picks.length, performances }) : C.cardDataEmpty,
    photo: PHOTO,
  });
}
