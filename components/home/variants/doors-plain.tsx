import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { DOORS, DOORS_TITLE } from "../doors-copy";

/**
 * "Plain": the Wave 0 doors, kept for comparison. Square corners, hairline
 * borders, a rule that draws on hover, nothing that lifts. No photography.
 */
export function DoorsPlain() {
  return (
    <section className="bg-parchment" aria-labelledby="doors-title">
      <div className="container-site flex flex-col gap-10 py-section">
      <SectionHeading number="03" eyebrow="Buy or sell" size="display" title={<span id="doors-title">{DOORS_TITLE}</span>} titleClassName="max-w-[960px]" />
      <ul className="grid gap-5 md:grid-cols-2">
        {DOORS.map((d) => (
          <li key={d.href} className="flex flex-col gap-4">
            <Link
              href={d.href}
              className="door card group flex w-full flex-1 flex-col gap-6 border border-hairline bg-white p-7 transition-colors hover:border-navy focus-visible:border-navy sm:p-9 lg:p-11"
            >
              <h3 className="font-display text-[clamp(2.25rem,3.6vw,3.25rem)] font-light leading-none text-navy">{d.title}</h3>
              <p className="t-body max-w-[42ch] text-body">{d.first}</p>
              <span className="card-line w-full" aria-hidden="true" />
              <span className="t-label mt-auto inline-flex items-center gap-2 text-harbor-700">
                {d.cta} <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
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
