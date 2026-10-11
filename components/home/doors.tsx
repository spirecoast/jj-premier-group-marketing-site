import Link from "next/link";
import { Photo } from "@/components/photo";
import { DOORS } from "./doors-copy";

export { DOORS, type Door } from "./doors-copy";

/**
 * Buyer or seller. Two photographs side by side from 768, the word set large
 * on each, nothing else. The section heading is for screen readers only; the
 * two words say it. On hover the photograph eases in and the word lifts, the
 * same card grammar as the place cards.
 */
export function Doors() {
  return (
    <section className="bg-parchment" aria-labelledby="doors-title">
      <div className="container-site py-section">
        <h2 id="doors-title" className="sr-only">
          Buyer or seller
        </h2>
        <ul className="grid gap-5 md:grid-cols-2">
          {DOORS.map((d) => (
            <li key={d.href}>
              <Link
                href={d.href}
                className="door card group relative flex aspect-[4/3] w-full items-end overflow-hidden bg-navy text-white md:aspect-[5/4] xl:aspect-[4/3]"
              >
                <Photo image={{ ...d.image, alt: "" }} sizes="(min-width: 768px) 50vw, 100vw" className="card-img" />
                <div className="scrim" aria-hidden="true" />
                <h3 className="relative flex w-full items-end justify-between gap-6 p-7 font-display text-[clamp(2.75rem,5vw,4.5rem)] font-light leading-none text-white text-shadow-photo lg:p-10">
                  {d.title}
                  <span aria-hidden="true" className="mb-2 text-[22px] transition-transform duration-300 group-hover:translate-x-1 lg:text-[26px]">
                    →
                  </span>
                </h3>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
