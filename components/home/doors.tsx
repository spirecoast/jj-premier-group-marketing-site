import Link from "next/link";
import { Photo } from "@/components/photo";
import { DOORS } from "./doors-copy";

export { DOORS, type Door } from "./doors-copy";

/**
 * Buyer, seller, or moving here. Three photographs side by side from 768
 * under a navy tint, the word set large on each, nothing else. The section
 * heading is for screen readers only; the words say it. On hover the tint
 * lifts, the photograph eases in, the word rises and a sky rule draws under it.
 */
export function Doors() {
  return (
    <section className="bg-parchment" aria-labelledby="doors-title">
      <div className="container-site py-section">
        <h2 id="doors-title" className="sr-only">
          Buyer, seller, or moving here
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {DOORS.map((d, i) => (
            <li key={d.href} className="sr" style={{ ["--sr-i" as string]: i }}>
              <Link
                href={d.href}
                className="door-tile group relative flex aspect-[16/11] w-full items-end overflow-hidden bg-navy text-white md:aspect-[4/5] lg:aspect-[4/3]"
              >
                <Photo image={{ ...d.image, alt: "" }} sizes="(min-width: 768px) 33vw, 100vw" className="place-img" />
                <div className="door-tint absolute inset-0" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-harbor-950/70 to-transparent" aria-hidden="true" />
                <div className="door-word relative flex w-full items-end justify-between gap-5 p-6 lg:p-8">
                  <div className="flex min-w-0 flex-col gap-3">
                    <h3 className="font-display text-[clamp(2.25rem,3.4vw,3rem)] font-light leading-[1.02] text-balance text-white text-shadow-photo">{d.title}</h3>
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
