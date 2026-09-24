import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { SectionHeading } from "@/components/section-heading";
import type { Event } from "@/lib/content/types";
import { site } from "@/lib/site";

/** 06 · Encore Arts Calendar. Theater, music and art, carried with the same weight as the homes. */
export function CalendarPreview({ events }: { events: Event[] }) {
  const [feature, ...rows] = events;
  if (!feature) return null;
  return (
    <section className="bg-linen-100" aria-labelledby="encore-title">
      <div className="container-site flex flex-col gap-12 py-section">
        <SectionHeading
          number="07"
          eyebrow={site.calendarName}
          size="display"
          title={<span id="encore-title">Theater, music and art this week, close to home.</span>}
          titleClassName="max-w-[820px]"
        />
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <EventCard variant="feature" event={feature} />
          <div className="flex flex-col gap-5 lg:justify-between">
            {rows.slice(0, 3).map((e) => (
              <EventCard key={e.slug} variant="row" event={e} />
            ))}
            <Link
              href="/calendar#subscribe"
              className="flex items-center justify-between gap-6 bg-sky-700 px-6 py-[22px] text-white transition-colors hover:bg-sky-800"
            >
              <span className="font-display text-[20px] font-light italic">Get {site.calendarShort} every Monday.</span>
              <span className="t-label shrink-0 whitespace-nowrap text-mist">Subscribe →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
