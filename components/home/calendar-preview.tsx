import Link from "next/link";
import { Emblem } from "@/components/brand/emblem";
import { EventCard } from "@/components/event-card";
import { LetterForm } from "@/components/letter-form";
import { Photo } from "@/components/photo";
import { img } from "@/lib/content/seed/helpers";
import { SectionHeading } from "@/components/section-heading";
import type { Event } from "@/lib/content/types";
import { products, site } from "@/lib/site";

/** The theater interior, as the strip the module's lockup and its three views sit on, so the section still reads as a night out before it reads as a list. */
const HOUSE = img("library/culture-opera-house-red-seats", "A theater auditorium before the house lights go down", "50% 60%");

const encore = products.find((p) => p.key === "encore")!;

/**
 * Encore Arts Calendar. Theater, music and art, carried with the same
 * weight as the homes. The photograph is the module's masthead: a short
 * strip carrying the Encore lockup and the three views people ask for first
 * (tonight, this weekend, on view) with the full calendar beside them, so
 * the first event sits one strip under the title. The Monday sign-up lives
 * inside the section.
 */
export function CalendarPreview({ events }: { events: Event[] }) {
  const [feature, ...rows] = events;
  if (!feature) return null;
  return (
    <section className="bg-parchment" aria-labelledby="encore-title">
      <div className="container-site flex flex-col gap-10 py-section">
        <SectionHeading size="display" className="sr" title={<span id="encore-title">This week in theater, music and art, close to home.</span>} titleClassName="max-w-[820px]" />
        <Link href="/calendar" aria-label={`${encore.name}, ${encore.tag}: the full calendar`} className="sr-img card group relative block min-h-[120px] overflow-hidden bg-navy text-white lg:min-h-[140px]">
          <Photo image={HOUSE} sizes="(min-width: 1280px) 1200px, 100vw" className="card-img" />
          <div className="scrim" aria-hidden="true" />
          <div className="relative flex min-h-[inherit] flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center lg:px-8">
            <span className="flex items-baseline gap-3">
              <Emblem family="encore" className="size-7 self-center" />
              <span className="font-display text-[32px] font-light italic leading-none text-white text-shadow-photo lg:text-[36px]">{encore.name}</span>
              <span className="t-mono-sm text-sky-300" aria-hidden="true">
                {encore.tag}
              </span>
            </span>
            <span className="link-rule !border-linen-200/50 !text-linen-200 group-hover:!border-linen-200 group-hover:!text-white">The full calendar</span>
          </div>
        </Link>
        {/* The three views people ask for first, as links the team can share. */}
        <div className="sr -mt-4 flex flex-wrap gap-2" aria-label="Open the calendar on">
          <Link href="/calendar?when=tonight" className="chip">
            Tonight
          </Link>
          <Link href="/calendar?when=weekend" className="chip">
            This weekend
          </Link>
          <Link href="/calendar?view=onview" className="chip">
            On view
          </Link>
        </div>
        <div className="sr grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <EventCard variant="feature" event={feature} />
          <div className="flex flex-col gap-5 lg:justify-between">
            {rows.slice(0, 3).map((e) => (
              <EventCard key={e.slug} variant="row" event={e} />
            ))}
            <div id="encore-subscribe" className="flex flex-col gap-4 bg-navy p-6 text-white">
              <p className="font-display text-[22px] font-light italic leading-[1.2]">Get {site.calendarShort} every Monday.</p>
              <p className="t-small text-mist">
                This week’s shows, concerts and openings in Lakewood Ranch, Sarasota and Bradenton, in one email. No listings in it.
              </p>
              <LetterForm form="calendar" label={`Send me ${site.calendarShort}`} tone="dark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
