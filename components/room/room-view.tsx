import type { Route } from "next";
import Link from "next/link";
import { getSiteSettings, getTeam } from "@/lib/content";
import { marketName } from "@/lib/content/markets";
import { localDay } from "@/lib/encore/day";
import { parsePlanState } from "@/lib/encore/plan";
import { getIndexEntries } from "@/lib/neighborhoods/data";
import { LEVEL_LABEL, TYPE_LABEL } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import { icsPath, parseAnswers, planPath } from "@/lib/relocate/url";
import { COUNTY_NAME, ROOM_COPY as C } from "@/lib/room/copy";
import { GUIDE_PATH, GUIDE_STEPS, dayLabel, noteParagraphs, stepTitle, updatedLabel, type Room } from "@/lib/room/model";
import { cn } from "@/lib/utils";

/** The room's places, in the order the team added them, from the Atlas index. */
async function placesFor(slugs: string[]): Promise<IndexEntry[]> {
  if (!slugs.length) return [];
  const entries = await getIndexEntries();
  const by = new Map(entries.map((e) => [e.s, e]));
  return slugs.flatMap((s) => {
    const e = by.get(s);
    return e ? [e] : [];
  });
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mt-12 border-t border-hairline pt-8 print:break-inside-avoid", className)}>
      <h2 className="t-h3 text-navy">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/**
 * The client's page: a greeting, where they are in the guide, the places
 * the team has picked with them, their plans, the team's notes, and how to
 * reach the team. Rendered on the server for the client's link and again,
 * unchanged, as the preview in the team's console.
 */
export async function RoomView({ room }: { room: Room }) {
  const { content } = room;
  const [places, team, settings] = await Promise.all([placesFor(content.places), getTeam(), getSiteSettings()]);
  const today = localDay(Date.now());
  const step = content.step;
  const title = stepTitle(step);
  const move = content.movePlan ? parseAnswers(Object.fromEntries(new URLSearchParams(content.movePlan)), today) : null;
  const visit = content.visitPlan ? parsePlanState(Object.fromEntries(new URLSearchParams(content.visitPlan)), today).state : null;
  const notes = noteParagraphs(content.notes);
  const hasPlan = Boolean(move || visit);

  return (
    <article className="flex flex-col">
      <h1 className="t-h1 text-balance text-navy">{C.greeting(room.name)}</h1>
      <p className="t-body mt-5 max-w-[38em]">{C.lede}</p>

      {step && title ? (
        <Section title={C.where}>
          <p className="t-body">
            {C.stepOf(step.n, GUIDE_STEPS[step.guide].length, step.guide)}: <strong className="font-medium text-navy">{title}</strong>
          </p>
          <Link href={GUIDE_PATH[step.guide] as Route} className="link-rule mt-3 inline-block print:hidden">
            {C.readStep}
          </Link>
        </Section>
      ) : null}

      <Section title={C.places}>
        {places.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {places.map((e) => (
              <li key={e.s} className="flex flex-col gap-1 border border-hairline bg-white p-5">
                <span className="font-display text-[1.375rem] font-light leading-tight text-navy">{e.n}</span>
                <span className="t-mono-sm text-graphite-500">
                  {marketName(e.m)} · {LEVEL_LABEL[e.l]}
                  {e.t ? ` · ${TYPE_LABEL[e.t]}` : ""}
                </span>
                <Link href={`/neighborhoods/${e.s}` as Route} className="link-rule mt-3 self-start print:hidden">
                  {C.openAtlas}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="t-body text-graphite-600">{C.placesEmpty}</p>
        )}
      </Section>

      <Section title={C.plan}>
        {hasPlan ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {move ? (
              <div className="flex flex-col gap-1 border border-hairline bg-white p-5">
                <span className="font-display text-[1.375rem] font-light leading-tight text-navy">{C.movePlan}</span>
                <span className="t-mono-sm text-graphite-500">{C.moveLine(dayLabel(move.moveInDate), COUNTY_NAME[move.county] ?? move.county)}</span>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 print:hidden">
                  <Link href={planPath(move) as Route} className="link-rule">
                    {C.openPlan}
                  </Link>
                  <a href={icsPath(move)} className="link-rule">
                    {C.addToCalendar}
                  </a>
                </div>
              </div>
            ) : null}
            {visit ? (
              <div className="flex flex-col gap-1 border border-hairline bg-white p-5">
                <span className="font-display text-[1.375rem] font-light leading-tight text-navy">{C.visitPlan}</span>
                <span className="t-mono-sm text-graphite-500">{C.visitLine(dayLabel(visit.from), dayLabel(visit.to))}</span>
                <Link href={`/calendar/plan?${content.visitPlan}` as Route} className="link-rule mt-3 self-start print:hidden">
                  {C.openVisit}
                </Link>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="t-body text-graphite-600">{C.planEmpty}</p>
        )}
      </Section>

      <Section title={C.notes}>
        {notes.length ? (
          <div className="flex flex-col gap-4">
            {notes.map((p, i) => (
              <p key={i} className="t-body whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="t-body text-graphite-600">{C.notesEmpty}</p>
        )}
      </Section>

      <footer className="mt-14 border-t border-hairline pt-8">
        <p className="t-body text-navy">{C.contact}</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {team.map((m) => (
            <li key={m.slug} className="flex flex-col gap-0.5">
              <span className="font-display text-[1.25rem] font-light leading-tight text-navy">{m.name}</span>
              <a href={`tel:${m.phoneE164}`} className="t-small text-body underline-offset-4 hover:underline">
                {m.phone}
              </a>
              <a href={`mailto:${m.email}`} className="t-small break-all text-body underline-offset-4 hover:underline">
                {m.email}
              </a>
            </li>
          ))}
        </ul>
        <p className="t-mono-sm mt-8 text-graphite-500">
          {settings.primaryPhoneDisplay} · {C.updated(updatedLabel(room.updatedAt))}
        </p>
      </footer>
    </article>
  );
}
