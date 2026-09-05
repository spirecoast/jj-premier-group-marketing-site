import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { SectionHeading } from "@/components/section-heading";
import type { Event } from "@/lib/content/types";

/** 06 · The Suncoast Calendar. Carries the same weight as the listings. */
export function CalendarPreview({ events }: { events: Event[] }) {
  const [feature, ...rows] = events;
  if (!feature) return null;
  return (
    <section className="container-site flex flex-col gap-12 py-section">
      <SectionHeading
        number="06"
        eyebrow="The Suncoast Calendar"
        title="Where to go this week, in the four places we sell."
        titleClassName="max-w-[760px] t-display"
        aside={
          <p className="t-small max-w-[300px] text-body-muted md:text-right">
            About the venue, never the listing. The only thing here for sale is a Tuesday evening.
          </p>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <EventCard variant="feature" event={feature} />
        <div className="flex flex-col gap-5">
          {rows.slice(0, 3).map((e) => (
            <EventCard key={e.slug} variant="row" event={e} />
          ))}
          <Link
            href="/calendar#subscribe"
            className="flex items-center justify-between gap-6 bg-sky-700 px-6 py-[22px] text-white transition-colors hover:bg-sky-800"
          >
            <span className="font-display text-[20px] font-light italic">The full calendar, every Monday.</span>
            <span className="t-label shrink-0 whitespace-nowrap text-mist">Subscribe →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
