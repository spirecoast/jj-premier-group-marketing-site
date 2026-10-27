import Link from "next/link";
import { Photo } from "@/components/photo";
import { DOORS } from "./doors-copy";

export { DOORS, type Door } from "./doors-copy";

/**
 * Buyer or seller. Two photographs side by side from 768 under a navy tint,
 * the word set large on each, nothing else. The section heading is for
 * screen readers only; the two words say it. On hover the tint lifts, the
 * photograph eases in, the word rises and a sky rule draws under it.
 */
export function Doors() {
  return (
    <section className="bg-parchment" aria-labelledby="doors-title">
      <div className="container-site py-section">
        <h2 id="doors-title" className="sr-only">
          Buyer or seller
        </h2>
        <ul className="grid gap-5 md:grid-cols-2">
          {DOORS.map((d, i) => (
            <li key={d.href} className="sr" style={{ ["--sr-i" as string]: i }}>
              <Link
                href={d.href}
                className="door-tile group relative flex aspect-[16/11] w-full items-end overflow-hidden bg-navy text-white md:aspect-[16/10] lg:aspect-[16/9]"
              >
                <Photo image={{ ...d.image, alt: "" }} sizes="(min-width: 768px) 50vw, 100vw" className="place-img" />
                <div className="door-tint absolute inset-0" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-harbor-950/70 to-transparent" aria-hidden="true" />
                <div className="door-word relative flex w-full items-end justify-between gap-6 p-7 lg:p-9">
                  <div className="flex flex-col gap-3">
                    <h3 className="font-display text-[clamp(2.5rem,4.2vw,3.75rem)] font-light leading-none text-white text-shadow-photo">{d.title}</h3>
                    <span className="door-rule block h-px w-24 bg-sky-300" aria-hidden="true" />
                  </div>
                  <span
                    aria-hidden="true"
                    className="mb-1 grid h-11 w-11 shrink-0 place-items-center border border-white/50 text-[18px] transition-colors duration-(--dur-panel) group-hover:border-white group-hover:bg-white group-hover:text-navy"
                  >
                    →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
