import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { LetterForm } from "@/components/letter-form";
import { Photo } from "@/components/photo";
import { img } from "@/lib/content/seed/helpers";
import { SectionHeading } from "@/components/section-heading";
import type { Event } from "@/lib/content/types";
import { site } from "@/lib/site";

/** A theater interior above the cards, so the section reads as a night out before it reads as a list. */
const HOUSE = img("library/culture-opera-house-red-seats", "A theater auditorium before the house lights go down", "50% 60%");

/**
 * 09 · Encore Arts Calendar. Theater, music and art, carried with the same
 * weight as the homes. The Monday sign-up lives inside the section, with the
 * full calendar one link away.
 */
export function CalendarPreview({ events }: { events: Event[] }) {
  const [feature, ...rows] = events;
  if (!feature) return null;
  return (
    <section className="bg-parchment" aria-labelledby="encore-title">
      <div className="container-site flex flex-col gap-12 py-section">
        <SectionHeading
          number="09"
          eyebrow={site.calendarName}
          size="display"
          title={<span id="encore-title">What’s on this week in theater, music and art, close to home.</span>}
          titleClassName="max-w-[820px]"
          aside={
            <Link href="/calendar" className="link-rule">
              The full calendar
            </Link>
          }
        />
        <div className="relative aspect-[16/7] max-h-[440px] w-full overflow-hidden bg-navy">
          <Photo image={HOUSE} sizes="(min-width: 1280px) 1200px, 100vw" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <EventCard variant="feature" event={feature} />
          <div className="flex flex-col gap-5 lg:justify-between">
            {rows.slice(0, 3).map((e) => (
              <EventCard key={e.slug} variant="row" event={e} />
            ))}
            <div id="encore-subscribe" className="flex flex-col gap-4 bg-navy p-6 text-white">
              <p className="font-display text-[22px] font-light italic leading-[1.2]">Get {site.calendarShort} every Monday.</p>
              <p className="t-small text-mist">
                What’s on this week in Lakewood Ranch, Sarasota and Bradenton, in one email. No listings in it.
              </p>
              <LetterForm form="calendar" label={`Send me ${site.calendarShort}`} tone="dark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
