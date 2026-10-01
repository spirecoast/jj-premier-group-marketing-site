import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";

/**
 * 02 · Buy or sell. Two doors, one line each on what happens first, and a
 * quiet third link for the people arriving from somewhere else. Square
 * corners, hairline borders, a rule that draws on hover, nothing that lifts.
 */
const DOORS = [
  {
    href: "/buy",
    title: "I’m buying",
    first:
      "First, one call and two questions: when do you need to be in, and is there a house to sell first? Those two answers set everything else.",
    cta: "How buying goes",
  },
  {
    href: "/sell",
    title: "I’m selling",
    first:
      "First, we come to the house, both of us, and walk it the way a buyer will. You get the number in writing that day or the next, with the sales behind it.",
    cta: "How selling goes",
  },
] as const;

export function Doors() {
  return (
    <section className="container-site flex flex-col gap-10 py-section" aria-labelledby="doors-title">
      <SectionHeading
        number="02"
        eyebrow="Buy or sell"
        size="display"
        title={<span id="doors-title">Tell us which one, and we&rsquo;ll start there.</span>}
        titleClassName="max-w-[960px]"
      />
      <ul className="grid gap-5 md:grid-cols-2">
        {DOORS.map((d) => (
          <li key={d.href} className="flex">
            <Link
              href={d.href}
              className="door card group flex w-full flex-col gap-6 border border-hairline bg-white p-7 transition-colors hover:border-navy focus-visible:border-navy sm:p-9 lg:p-11"
            >
              <h3 className="font-display text-[clamp(2.25rem,3.6vw,3.25rem)] font-light leading-none text-navy">{d.title}</h3>
              <p className="t-body max-w-[42ch] text-body">{d.first}</p>
              <span className="card-line w-full" aria-hidden="true" />
              <span className="t-label mt-auto inline-flex items-center gap-2 text-harbor-700">
                {d.cta} <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="t-body text-body-muted">
        <Link href="/buy" className="link-rule">
          Moving here from somewhere else?
        </Link>
      </p>
    </section>
  );
}
