"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { ButtonLink, RuleButton } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { StepBody, StepCard, StepFooter, StepProgress, StepTitle, useStepFocus } from "@/components/ui/stepper";
import { LeadForm } from "@/components/lead-form";
import { ShareButton } from "@/components/share-button";
import { track } from "@/lib/analytics";
import { MARKETS, marketName } from "@/lib/content/markets";
import type { EventCategory, MarketSlug } from "@/lib/content/types";
import { CATEGORY, CATEGORY_ORDER } from "@/lib/encore/categories";
import type { EncoreIndex } from "@/lib/encore/index-format";
import { MAX_DAYS, PRESETS, SHOWINGS, buildPlan, marketList, normalizeDates, planHref, planIcsHref, presetDates, type PlanDay, type PlanState } from "@/lib/encore/plan";
import { addDays, clock, longDay, weekdayShort, type Occ } from "@/lib/encore/select";
import { encoreHref } from "@/lib/encore/url";
import { cn } from "@/lib/utils";
import { NightOut } from "./night-out";
import { SaveButton } from "./tile";
import { useMyList } from "./use-my-list";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNum = (day: string) => Number(day.slice(8, 10));
const monthShort = (day: string) => MONTH_SHORT[Number(day.slice(5, 7)) - 1]!;
const QUESTION_COUNT = 4;

/**
 * Encore Planner. The inputs are a draft until "Build my plan"; the applied
 * state is what the URL, the overview, the day cards, the calendar file and
 * the ask at the end all reflect. The first paint uses the slice the server
 * sent for the applied dates; the full index arrives once so new dates
 * build instantly. `nearby` lists the venues Google Places can search
 * around; without it (no API key) the picks have no Nearby button.
 */
export function VisitPlan({
  initial,
  today,
  initialIndex,
  trimmed: initialTrimmed,
  nearby,
}: {
  initial: PlanState;
  today: string;
  initialIndex: EncoreIndex;
  trimmed: boolean;
  nearby?: string[];
}) {
  const [index, setIndex] = useState<EncoreIndex>(initialIndex);
  const [full, setFull] = useState(false);
  const [draft, setDraft] = useState<PlanState>(initial);
  const [applied, setApplied] = useState<PlanState>(initial);
  const [trimmed, setTrimmed] = useState(initialTrimmed);
  // Zero on the server and at hydration, so both paint the same plan; set once mounted.
  const [nowMs, setNowMs] = useState(0);
  const [copied, setCopied] = useState(false);
  const my = useMyList();
  const nearbyVenues = useMemo(() => new Set(nearby ?? []), [nearby]);
  // One pick's Nearby panel open at a time.
  const [openNear, setOpenNear] = useState<string | null>(null);
  // The form asks one question at a time; after a move the question takes focus.
  const [q, setQ] = useState(0);
  const qTitle = useStepFocus<HTMLHeadingElement>(q);
  const go = (n: number) => setQ(Math.max(0, Math.min(QUESTION_COUNT - 1, n)));

  useEffect(() => {
    setNowMs(Date.now());
    const ctrl = new AbortController();
    fetch("/api/encore/index", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: EncoreIndex) => {
        setIndex(data);
        setFull(true);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // After a build the URL follows the plan and the build is an Explore event.
  // Not on mount: the landing URL (and its utm_* params) stays as it came.
  const built = useRef(false);
  useEffect(() => {
    if (!built.current) return;
    window.history.replaceState(window.history.state, "", planHref(applied));
    track("Explore", { action: "visit-plan" });
  }, [applied]);

  const plan = useMemo(() => buildPlan(index, applied, today, nowMs), [index, applied, today, nowMs]);
  const nights = plan.days.length;
  const all = plan.days.flatMap((d) => [...(d.matinee ? [d.matinee] : []), ...d.picks]);
  const picked = all.length;
  const venues = new Set(all.map((o) => o.e.v)).size;
  const mix = CATEGORY_ORDER.map((c) => ({ c, n: all.filter((o) => o.e.c === c).length })).filter((x) => x.n);
  const stayMarkets = applied.markets.length ? applied.markets : MARKETS.map((m) => m.slug);
  const visiting = !draft.local;

  function build(e: FormEvent) {
    e.preventDefault();
    // Enter on an earlier question moves on; the plan builds from the last one.
    if (q < QUESTION_COUNT - 1) return go(q + 1);
    const dates = normalizeDates(draft.from, draft.to, today);
    const next: PlanState = { ...draft, from: dates.from, to: dates.to };
    setDraft(next);
    setTrimmed(dates.trimmed);
    built.current = true;
    setApplied(next);
    requestAnimationFrame(() => document.getElementById("plan")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  const toggleMarket = (m: MarketSlug) => setDraft((d) => ({ ...d, markets: d.markets.includes(m) ? d.markets.filter((x) => x !== m) : [...d.markets, m] }));
  const toggleCat = (c: EventCategory) => setDraft((d) => ({ ...d, categories: d.categories.includes(c) ? d.categories.filter((x) => x !== c) : [...d.categories, c] }));
  const preset = PRESETS.find((p) => {
    const [f, t] = presetDates(p.id, today);
    return f === draft.from && t === draft.to;
  })?.id;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(planHref(applied), window.location.origin).toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  // The plan's own link goes in the message, so the team gets the plan and not only the prose (it's known once the page is live).
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const askProse = `Arriving ${longDay(applied.from)}, leaving ${longDay(applied.to)}. Looking in ${marketList(stayMarkets)}.`;
  const askMessage = origin ? `${askProse}\n${origin}${planHref(applied)}` : askProse;
  // The form keeps whatever has been typed across rebuilds; the message only
  // refreshes when asked, the way the net-proceeds sheet does it.
  const [sentMessage, setSentMessage] = useState(askMessage);
  useEffect(() => {
    // The first render had no origin yet: add the link to the untouched message.
    if (origin) setSentMessage((m) => (m === askProse ? `${askProse}\n${origin}${planHref(applied)}` : m));
  }, [origin, askProse, applied]);

  return (
    <div className="encore">
      {/* The form: who, when, where, what. */}
      <section className="bg-parchment py-8 sm:py-section" aria-labelledby="plan-inputs-title">
        <div className="container-site">
          <StepCard as="form" onSubmit={build} className="p-6" aria-labelledby="plan-inputs-title">
            <StepProgress step={q + 1} total={QUESTION_COUNT} tone="encore" />

            <StepBody stepKey={q} className="min-h-[260px] gap-7">
              <div className="flex flex-col gap-3">
                <StepTitle id="plan-inputs-title" ref={qTitle}>
                  {q === 0 ? "Who’s it for?" : q === 1 ? (visiting ? "When are you visiting?" : "Which days?") : q === 2 ? (visiting ? "Where do you want to look?" : "Where would you go?") : "What do you like?"}
                </StepTitle>
                {q === 1 ? <p className="t-body text-body">Up to {MAX_DAYS} days.</p> : null}
                {q === 2 ? <p className="t-body text-body">Pick any. Leave them all off and you get all three.</p> : null}
                {q === 3 ? <p className="t-body text-body">Optional. We lean the picks toward these.</p> : null}
              </div>

              {q === 0 ? (
                <div className="grid gap-3 sm:grid-cols-2" role="group" aria-labelledby="plan-inputs-title">
                  <WhoCard
                    on={visiting}
                    onClick={() => setDraft((d) => ({ ...d, local: false }))}
                    title="I’m coming to look at homes"
                    body="We keep ten to four free for showings each day, and fill the evenings."
                    icon={<path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9M10 20v-6h4v6" />}
                  />
                  <WhoCard
                    on={!visiting}
                    onClick={() => setDraft((d) => ({ ...d, local: true }))}
                    title="I live here"
                    body="Afternoon and evening picks for every day, with no showings."
                    icon={<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />}
                  />
                </div>
              ) : null}

              {q === 1 ? (
                <div className="flex flex-col gap-6">
                  <ChipGroup aria-label="Quick dates">
                    {PRESETS.map((p) => (
                      <Chip
                        key={p.id}
                        size="lg"
                        selected={preset === p.id}
                        onClick={() => {
                          const [from, to] = presetDates(p.id, today);
                          setDraft((d) => ({ ...d, from, to }));
                        }}
                      >
                        {p.label}
                      </Chip>
                    ))}
                  </ChipGroup>
                  <div className="grid gap-5 sm:grid-cols-2 lg:max-w-[560px]">
                    <Field id="plan-from" label={visiting ? "Arriving" : "From"}>
                      <Input
                        type="date"
                        value={draft.from}
                        min={today}
                        max={addDays(today, 365)}
                        required
                        onChange={(e) => {
                          const from = e.target.value || today;
                          setDraft((d) => ({ ...d, from, to: d.to < from ? from : d.to > addDays(from, MAX_DAYS - 1) ? addDays(from, MAX_DAYS - 1) : d.to }));
                        }}
                      />
                    </Field>
                    <Field id="plan-to" label={visiting ? "Leaving" : "To"}>
                      <Input type="date" value={draft.to} min={draft.from} max={addDays(draft.from, MAX_DAYS - 1)} required onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value || d.from }))} />
                    </Field>
                  </div>
                </div>
              ) : null}

              {q === 2 ? (
                <ChipGroup aria-labelledby="plan-inputs-title">
                  {MARKETS.map((m) => (
                    <Chip key={m.slug} size="lg" selected={draft.markets.includes(m.slug)} onClick={() => toggleMarket(m.slug)}>
                      {m.name}
                    </Chip>
                  ))}
                </ChipGroup>
              ) : null}

              {q === 3 ? (
                <div className="flex flex-col gap-4">
                  <div className="encore-cats" role="group" aria-labelledby="plan-inputs-title">
                    {CATEGORY_ORDER.map((c) => (
                      <button key={c} type="button" className="encore-cat" aria-pressed={draft.categories.includes(c)} onClick={() => toggleCat(c)}>
                        <i style={{ background: CATEGORY[c].color }} aria-hidden="true" />
                        {CATEGORY[c].label}
                      </button>
                    ))}
                  </div>
                  <Checkbox checked={draft.eveningsOnly} onChange={(e) => setDraft((d) => ({ ...d, eveningsOnly: e.target.checked }))}>
                    {visiting ? "Evenings only. Keep the weekend afternoons for houses." : "Evenings only"}
                  </Checkbox>
                </div>
              ) : null}
            </StepBody>

            <StepFooter
              back={q > 0 ? { label: "Back", onClick: () => go(q - 1) } : undefined}
              next={q < QUESTION_COUNT - 1 ? { label: "Next", onClick: () => go(q + 1) } : { label: "Build my plan" }}
              submit={q === QUESTION_COUNT - 1}
              aside={
                trimmed ? (
                  <p id="plan-form-note" className="t-small text-graphite-500">
                    We trimmed the end to fit {MAX_DAYS} days.
                  </p>
                ) : null
              }
            />
          </StepCard>
        </div>
      </section>

      {/* The plan: a summary, the days at a glance, then each day. */}
      <section id="plan" className="container-site flex scroll-mt-header flex-col gap-10 py-section" aria-labelledby="plan-days-title">
        <div className="encore-stage flex flex-col gap-8 px-5 py-8 sm:p-10">
          <div className="relative grid items-end gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="flex flex-col gap-3">
              <p className="t-body text-encore">{nights === 1 ? longDay(applied.from) : `${longDay(applied.from)} to ${longDay(applied.to)}`}</p>
              <h2 id="plan-days-title" className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-white" aria-live="polite">
                <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] font-light leading-none tabular-nums">{picked}</span>
                <span className="t-h1">
                  {picked === 1 ? "pick" : "picks"} over {nights === 1 ? "one day" : `${nights} days`}
                </span>
              </h2>
              <p className="t-body text-white/75">
                {picked
                  ? `At ${venues} ${venues === 1 ? "venue" : "venues"}, with no show twice.${applied.local ? "" : " Ten to four is held for showings."}`
                  : "Encore has nothing timed on these dates yet. Venues add dates through the season, so check back closer to the day."}
              </p>
            </div>
            {mix.length ? (
              <div className="flex flex-col gap-3">
                <div className="flex h-3 w-full gap-0.5 overflow-hidden bg-white/10" aria-hidden="true">
                  {mix.map(({ c, n }) => (
                    <span key={c} className="h-full" style={{ width: `${(n / picked) * 100}%`, background: CATEGORY[c].color }} />
                  ))}
                </div>
                <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="What’s in the plan">
                  {mix.map(({ c, n }) => (
                    <li key={c} className="t-small inline-flex items-center gap-2 text-white/85">
                      <span className="size-2.5" style={{ background: CATEGORY[c].color }} aria-hidden="true" />
                      {CATEGORY[c].label} <span className="tabular-nums text-white/55">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {nights > 1 ? (
            <nav aria-label="Days in the plan" className="relative">
              <ol className="plan-strip">
                {plan.days.map((d) => {
                  const picks = [...(d.matinee ? [d.matinee] : []), ...d.picks];
                  return (
                    <li key={d.day}>
                      <a href={`#day-${d.day}`} className={cn("plan-strip-day", d.weekend && "is-weekend")}>
                        <span className="t-small text-white/60">{weekdayShort(d.day)}</span>
                        <span className="font-display text-[1.75rem] font-light leading-none text-white tabular-nums">{dayNum(d.day)}</span>
                        <span className="text-[11px] uppercase tracking-[0.12em] text-encore">{monthShort(d.day)}</span>
                        <span className="mt-1 flex h-2 gap-1">
                          <span className="sr-only">
                            {picks.length} {picks.length === 1 ? "pick" : "picks"}
                          </span>
                          {picks.map((o) => (
                            <span key={`${o.e.s}-${o.start}`} className="size-2" style={{ background: CATEGORY[o.e.c].color }} aria-hidden="true" />
                          ))}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}
        </div>

        <div className="plan-days">
          {plan.days.map((d, i) => (
            <DayCard
              key={d.day}
              d={d}
              n={i + 1}
              today={today}
              local={applied.local}
              has={my.has}
              toggle={my.toggle}
              near={{ venues: nearbyVenues, open: openNear, setOpen: setOpenNear }}
            />
          ))}
        </div>
        {!full ? (
          <p className="sr-only" aria-live="polite">
            Loading the full season
          </p>
        ) : null}
        <p className="t-note">Times and prices come from each venue’s own listing. Check with the venue before you go.</p>
      </section>

      {/* Take it with you */}
      <section className="border-y border-hairline bg-sky-50" aria-labelledby="plan-export-title">
        <div className="container-site flex flex-col gap-6 py-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <h2 id="plan-export-title" className="t-h2 text-navy">
              Take the plan with you
            </h2>
            <p className="t-small max-w-[520px] text-body">
              {applied.local
                ? "The calendar file has every pick with its venue. The link rebuilds the plan for whoever opens it."
                : "The calendar file has the showing hours and every pick with its venue. The link rebuilds the plan for whoever opens it."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href={planIcsHref(applied, plan)} className="btn btn-navy" onClick={() => track("Calendar feed", { kind: "plan" })}>
              Add to my calendar
              <span className="btn-dash" aria-hidden="true" />
            </a>
            <ShareButton title="Encore Planner" url={planHref(applied)} what="visit-plan" label="Share" />
            <RuleButton onClick={copyLink} aria-live="polite">
              {copied ? "Link copied" : "Copy the link"}
            </RuleButton>
          </div>
        </div>
      </section>

      {applied.local ? (
        <section className="container-site flex flex-col items-start gap-5 py-section" aria-labelledby="plan-weekly-title">
          <h2 id="plan-weekly-title" className="t-h1 max-w-[720px] text-navy">
            Get Encore every Monday
          </h2>
          <p className="t-body max-w-measure text-body">The week’s shows, concerts and openings in one email.</p>
          <ButtonLink href="/calendar#subscribe" variant="navy" dash>
            Sign up
          </ButtonLink>
        </section>
      ) : (
        <section id="ask" className="scroll-mt-header bg-linen-200">
          <div className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div className="flex flex-col gap-6">
              <h2 className="t-h1 text-navy">Send us your dates and we’ll line up the showings</h2>
              <p className="t-body max-w-[440px] text-body">
                The dates and places from your plan are already in the message. Add what you’re looking for and whether there’s a house to sell first, and one of us will call or
                write back.
              </p>
              {sentMessage !== askMessage ? (
                <RuleButton onClick={() => setSentMessage(askMessage)} className="self-start">
                  Use the dates in this plan
                </RuleButton>
              ) : null}
            </div>
            <div className="border border-hairline bg-white p-6 sm:p-8">
              <LeadForm
                key={sentMessage}
                form="buy"
                fields={["timing", "sellFirst", "name", "email", "phone", "message"]}
                submitLabel="Line up the showings"
                defaultMessage={sentMessage}
                placeholderMessage="Tell us where you’re looking, what you need, and whether there’s a house to sell first."
                hidden={{ market: applied.markets.length === 1 ? applied.markets[0] : undefined, pageTitle: "Encore Planner" }}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function WhoCard({ on, onClick, title, body, icon }: { on: boolean; onClick: () => void; title: string; body: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex items-start gap-4 border p-4 text-left transition-[background-color,border-color] duration-200 sm:p-5",
        on ? "border-navy bg-navy text-linen-100" : "border-hairline bg-white text-navy hover:border-navy",
      )}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={cn("mt-0.5 shrink-0", on ? "text-sky-300" : "text-sky-700")}
      >
        {icon}
      </svg>
      <span className="flex flex-col gap-1">
        <span className="font-display text-[1.125rem] leading-tight">{title}</span>
        <span className={cn("t-small", on ? "text-linen-200" : "text-graphite-600")}>{body}</span>
      </span>
    </button>
  );
}

type ListApi = { has: (slug: string) => boolean; toggle: (slug: string) => void };
type NearApi = { venues: Set<string>; open: string | null; setOpen: (k: string | null) => void };

const occKey = (o: Occ) => `${o.e.s}-${o.start}`;

/** One day: the date, the showing block on a visit, then the afternoon and the evening. */
function DayCard({ d, n, today, local, has, toggle, near }: { d: PlanDay; n: number; today: string; local: boolean; near: NearApi } & ListApi) {
  const everything = encoreHref({ date: d.day });
  /** A pick, and under it the places near its venue when that's open. */
  const row = (o: Occ) => {
    const k = occKey(o);
    const open = near.open === k;
    return (
      <Fragment key={k}>
        <PickRow
          o={o}
          saved={has(o.e.s)}
          onSave={() => toggle(o.e.s)}
          nearby={
            near.venues.has(o.e.v)
              ? {
                  open,
                  controls: `near-${k}`,
                  onToggle: () => {
                    if (!open) track("Explore", { action: "night-out" });
                    near.setOpen(open ? null : k);
                  },
                }
              : undefined
          }
        />
        {open ? <NightOut o={o} id={`near-${k}`} /> : null}
      </Fragment>
    );
  };
  return (
    <article id={`day-${d.day}`} className="plan-day scroll-mt-header" aria-labelledby={`plan-${d.day}`}>
      <h3 id={`plan-${d.day}`} className="plan-dayhead">
        <span className="flex items-center gap-3">
          <span className="font-display text-[2rem] font-light leading-none text-encore tabular-nums" aria-hidden="true">
            {dayNum(d.day)}
          </span>
          <span className="flex flex-col">
            <span className="text-[15px] text-white">
              {d.day === today ? "Today, " : ""}
              {longDay(d.day)}
            </span>
            <span className="t-small text-white/55">Day {n}</span>
          </span>
        </span>
        {d.weekend ? <span className="t-label border border-encore/50 px-2.5 py-1.5 text-encore">Weekend</span> : null}
      </h3>

      {local ? null : (
        <div className="plan-block is-showings">
          <p className="plan-slot">10:00 – 4:00</p>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="plan-title">{SHOWINGS.label}</p>
            <p className="t-small text-body">{d.markets.length > 1 ? `${marketList(d.markets)}, in that order.` : `${marketList(d.markets)}.`}</p>
          </div>
        </div>
      )}

      {d.matinee ? (
        <div className="plan-block is-afternoon">
          <p className="plan-slot">Afternoon</p>
          <ul className="flex min-w-0 flex-1 flex-col">{row(d.matinee)}</ul>
        </div>
      ) : null}

      <div className="plan-block is-evening">
        <p className="plan-slot">Evening</p>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {d.picks.length ? (
            <ul className="flex flex-col">{d.picks.map(row)}</ul>
          ) : (
            <p className="t-body text-body">Nothing timed after five yet. Venues add dates through the season.</p>
          )}
          <Link href={everything} className="link-rule self-start">
            Everything on this day
          </Link>
        </div>
      </div>
    </article>
  );
}

/** A pick: the time, the title (a link to the event page), venue, market and category, Nearby and Save. */
function PickRow({ o, saved, onSave, nearby }: { o: Occ; saved: boolean; onSave: () => void; nearby?: { open: boolean; controls: string; onToggle: () => void } }) {
  const e = o.e;
  return (
    <li className="encore-agenda-row" style={{ "--cat": CATEGORY[e.c].color } as CSSProperties}>
      <Link href={`/calendar/${e.s}`} className="encore-agenda-link">
        <span className="encore-agenda-time">{clock(o.time)}</span>
        <span className="min-w-0 flex-1">
          <span className="encore-agenda-title">{e.t}</span>
          <span className="t-note block">
            {[e.vn, marketName(e.m)].join(" · ")} ·{" "}
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2" style={{ background: CATEGORY[e.c].color }} aria-hidden="true" />
              {CATEGORY[e.c].label}
            </span>
          </span>
        </span>
        <span className="t-small hidden shrink-0 text-graphite-500 sm:block">{e.pr ?? ""}</span>
      </Link>
      {nearby ? (
        <button
          type="button"
          onClick={nearby.onToggle}
          aria-expanded={nearby.open}
          aria-controls={nearby.open ? nearby.controls : undefined}
          aria-label={`Dinner, drinks and hotels near ${e.vn}`}
          className={cn("encore-save encore-agenda-save", nearby.open && "is-open")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
            <circle cx="12" cy="10" r="2.3" />
          </svg>
          <span className="encore-save-label">Nearby</span>
        </button>
      ) : null}
      <SaveButton saved={saved} onToggle={onSave} title={e.t} className="encore-agenda-save" />
    </li>
  );
}
