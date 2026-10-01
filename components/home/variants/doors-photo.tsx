import Link from "next/link";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { DOORS, DOORS_TITLE } from "../doors-copy";

/**
 * "Photo": each door is a split card. The left leaf is a photograph of the
 * moment (walking into the empty room; the house the way a buyer sees it)
 * with the door's name set over it; the right leaf is the one line on what
 * happens first and the way in. On hover the photograph eases 3.5% and the
 * Sky rule draws under the copy, the same card grammar as everywhere else.
 *
 * The split needs a door about 540px wide for the words to breathe, so the
 * doors run one per row until 1024 and split from 640; from 1024 they sit
 * two per row, where each door is only 400–530 wide, so the photograph goes
 * above the words there, and the split returns from 1280. The photograph is
 * decorative (alt ""): the link is named by the door's own heading.
 */
export function DoorsPhoto() {
  return (
    <section className="bg-parchment" aria-labelledby="doors-title">
      <div className="container-site flex flex-col gap-10 py-section">
        <SectionHeading number="03" eyebrow="Buy or sell" size="display" title={<span id="doors-title">{DOORS_TITLE}</span>} titleClassName="max-w-[960px]" />
        <ul className="grid gap-5 lg:grid-cols-2">
          {DOORS.map((d) => (
            <li key={d.href} className="flex flex-col gap-4">
              <Link
                href={d.href}
                className="door card group grid w-full flex-1 border border-hairline bg-white transition-colors hover:border-navy focus-visible:border-navy sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-cols-1 xl:min-h-[420px] xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-navy sm:aspect-auto sm:min-h-[320px] lg:aspect-[16/10] lg:min-h-0 xl:aspect-auto xl:min-h-[320px]">
                  {/* sizes is the drawn width of the cover crop: 420px tall at the split (760), 16:10 strips and the 320px-tall tablet split (600). */}
                  <Photo image={{ ...d.image, alt: "" }} sizes="(min-width: 1280px) 760px, (min-width: 640px) 600px, 100vw" className="card-img" />
                  <div className="absolute inset-0 bg-linear-to-t from-harbor-950/80 via-harbor-950/25 via-50% to-transparent" aria-hidden="true" />
                  <h3 className="absolute inset-x-0 bottom-0 p-6 font-display text-[clamp(2.25rem,3vw,2.75rem)] font-light leading-none text-white text-shadow-photo lg:p-7">
                    {d.title}
                  </h3>
                </div>
                <div className="flex flex-col gap-6 p-7 sm:p-8 lg:p-9">
                  <p className="t-body text-body">{d.first}</p>
                  <span className="card-line mt-auto w-full" aria-hidden="true" />
                  <span className="t-label inline-flex items-center gap-2 text-harbor-700">
                    {d.cta} <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
              <Link href={d.also.href} className="link-rule self-start">
                {d.also.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
