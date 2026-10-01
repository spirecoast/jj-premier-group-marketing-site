import Link from "next/link";
import { Photo } from "@/components/photo";
import type { Guide } from "@/lib/guides/types";
import { guideHref, guideReadingMinutes } from "@/lib/guides";

/** A rebuilt guide's card: cover, title, promise, reading time. Used on /guides and /blog. */
export function GuideCard({ guide, priority }: { guide: Guide; priority?: boolean }) {
  const minutes = guideReadingMinutes(guide);
  return (
    <Link href={guideHref(guide.slug)} className="card group flex w-full flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor">
      <div className="relative aspect-[3/2] overflow-hidden bg-linen-100">
        <Photo image={guide.cover} priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="card-img" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-700">
          Guide · {guide.sections.length} sections · {minutes} min read
        </p>
        <h3 className="t-h3 text-navy">{guide.title}</h3>
        <p className="t-small text-body-muted">{guide.promise}</p>
        <p className="t-record mt-auto pt-2 text-graphite-500">By {guide.author.name}</p>
        <span className="card-line bg-sky-300" aria-hidden="true" />
      </div>
    </Link>
  );
}
