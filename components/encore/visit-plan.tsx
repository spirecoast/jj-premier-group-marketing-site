"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/buttons";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { ShareButton } from "@/components/share-button";
import { track } from "@/lib/analytics";
import { MARKETS, marketName } from "@/lib/content/markets";
import type { EventCategory, MarketSlug } from "@/lib/content/types";
import { CATEGORY, CATEGORY_ORDER } from "@/lib/encore/categories";
import type { EncoreIndex } from "@/lib/encore/index-format";
import { MAX_DAYS, SHOWINGS, buildPlan, marketList, normalizeDates, planHref, planIcsHref, type PlanDay, type PlanState } from "@/lib/encore/plan";
import { addDays, clock, longDay, shortDay, type Occ } from "@/lib/encore/select";
import { encoreHref } from "@/lib/encore/url";
import { cn } from "@/lib/utils";
import { SaveButton } from "./tile";
import { useMyList } from "./use-my-list";

/**
 * The visit planner. The inputs are a draft until "Build the plan"; the
 * applied state is what the URL, the day cards, the calendar file and the
 * ask at the end all reflect. The first paint uses the slice the server
 * sent for the applied dates; the full index arrives once so new dates
 * build instantly.
 */
export function VisitPlan({ initial, today, initialIndex, trimmed: initialTrimmed }: { initial: PlanState; today: string; initialIndex: EncoreIndex; trimmed: boolean }) {
  const [index, setIndex] = useState<EncoreIndex>(initialIndex);
  const [full, setFull] = useState(false);
  const [draft, setDraft] = useState<PlanState>(initial);
  const [applied, setApplied] = useState<PlanState>(initial);
  const [trimmed, setTrimmed] = useState(initialTrimmed);
  // Zero on the server and at hydration, so both paint the same plan; set once mounted.
  const [nowMs, setNowMs] = useState(0);
  const my = useMyList();

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
  const picked = plan.days.reduce((n, d) => n + d.picks.length + (d.matinee ? 1 : 0), 0);
  const stayMarkets = applied.markets.length ? applied.markets : MARKETS.map((m) => m.slug);

  function build(e: FormEvent) {
    e.preventDefault();
    const dates = normalizeDates(draft.from, draft.to, today);
    const next: PlanState = { ...draft, from: dates.from, to: dates.to };
    setDraft(next);
    setTrimmed(dates.trimmed);
    built.current = true;
    setApplied(next);
  }
  const toggleMarket = (m: MarketSlug) => setDraft((d) => ({ ...d, markets: d.markets.includes(m) ? d.markets.filter((x) => x !== m) : [...d.markets, m] }));
  const toggleCat = (c: EventCategory) => setDraft((d) => ({ ...d, categories: d.categories.includes(c) ? d.categories.filter((x) => x !== c) : [...d.categories, c] }));

  const askMessage = `Arriving ${longDay(applied.from)}, leaving ${longDay(applied.to)}. Looking in ${marketList(stayMarkets)}.`;
  // The form keeps whatever has been typed across rebuilds; the message only
  // refreshes when asked, the way the net-proceeds sheet does it.
  const [sentMessage, setSentMessage] = useState(askMessage);

  return (
    <div className="encore">
      {/* 02 · The dates and the places */}
      <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="plan-inputs-title">
        <SectionHeading number="02" eyebrow="The dates and the places" title={<span id="plan-inputs-title">When you&rsquo;re here, and where you want to look.</span>} />
        <form onSubmit={build} className="plan-form" aria-describedby="plan-form-note">
          <div className="grid gap-6 sm:grid-cols-2 lg:max-w-[560px]">
            <div className="field">
              <label htmlFor="plan-from" className="field-label">
                Arriving
              </label>
              <input
                id="plan-from"
                type="date"
                className="field-input"
                value={draft.from}
                min={today}
                max={addDays(today, 365)}
                required
                onChange={(e) => {
                  const from = e.target.value || today;
                  setDraft((d) => ({ ...d, from, to: d.to < from ? from : d.to }));
                }}
              />
            </div>
            <div className="field">
              <label htmlFor="plan-to" className="field-label">
                Leaving
              </label>
              <input
                id="plan-to"
                type="date"
                className="field-input"
                value={draft.to}
                min={draft.from}
                max={addDays(draft.from, MAX_DAYS - 1)}
                required
                onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value || d.from }))}
              />
            </div>
          </div>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="field-label mb-3">Where you want to look</legend>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map((m) => (
                <button key={m.slug} type="button" className="chip" aria-pressed={draft.markets.includes(m.slug)} onClick={() => toggleMarket(m.slug)}>
                  {m.name}
                </button>
              ))}
            </div>
            <p className="t-small text-graphite-500">Pick one, two or all three. Over a stay we take them a day at a time; leave them all off and all three are in.</p>
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="field-label mb-3">
              What you&rsquo;d go out for <span className="normal-case tracking-normal opacity-70">(optional)</span>
            </legend>
            <div className="encore-cats" role="group" aria-label="Category preferences">
              {CATEGORY_ORDER.map((c) => (
                <button key={c} type="button" className="encore-cat" aria-pressed={draft.categories.includes(c)} onClick={() => toggleCat(c)}>
                  <i style={{ background: CATEGORY[c].color }} aria-hidden="true" />
                  {CATEGORY[c].label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="t-small flex cursor-pointer items-start gap-3 text-body">
            <input type="checkbox" className="mt-1 size-4 shrink-0 accent-sky-700" checked={draft.eveningsOnly} onChange={(e) => setDraft((d) => ({ ...d, eveningsOnly: e.target.checked }))} />
            <span>Evenings only. Skip the weekend matinee and keep the afternoons for houses.</span>
          </label>

          <div className="flex flex-wrap items-center gap-6">
            <Button type="submit" dash>
              Build the plan
            </Button>
            <p id="plan-form-note" className="t-small max-w-[420px] text-graphite-500">
              Up to {MAX_DAYS} days. {trimmed ? "We trimmed the end of the stay to fit." : "Showings run ten to four; Encore fills the evenings."}
            </p>
          </div>
        </form>
      </section>

      {/* 03 · Day by day */}
      <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="plan-days-title">
        <SectionHeading
          number="03"
          eyebrow="Day by day"
          title={
            <span id="plan-days-title">
              {nights === 1 ? "One day" : `${nights} days`} from {shortDay(applied.from)}
              {nights > 1 ? ` to ${shortDay(applied.to)}` : ""}.
            </span>
          }
          aside={
            <p className="t-small max-w-[360px] text-graphite-500">
              {picked ? `${picked} ${picked === 1 ? "pick" : "picks"} from Encore, no production twice, spread across venues and categories.` : "Encore has nothing timed on these evenings yet."}
            </p>
          }
        />
        <div className="plan-days">
          {plan.days.map((d, i) => (
            <DayCard key={d.day} d={d} n={i + 1} today={today} has={my.has} toggle={my.toggle} />
          ))}
        </div>
        {!full ? (
          <p className="sr-only" aria-live="polite">
            Loading the full season
          </p>
        ) : null}
        <p className="t-mono-sm text-graphite-500">Times and prices come from each venue&rsquo;s own listing; confirm before you go.</p>
      </section>

      {/* 04 · Take it with you */}
      <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="plan-export-title">
        <SectionHeading number="04" eyebrow="Take it with you" title={<span id="plan-export-title">Put it in your calendar, or send it on.</span>} />
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <a href={planIcsHref(applied, plan)} className="btn btn-navy" onClick={() => track("Calendar feed", { kind: "plan" })}>
            Add this plan to my calendar
            <span className="btn-dash" aria-hidden="true" />
          </a>
          <ShareButton title="Encore visit plan" url={planHref(applied)} what="visit-plan" label="Share this plan" />
        </div>
        <p className="t-small max-w-[560px] text-graphite-500">
          The showing blocks go in as ten to four on each day, the picks go in with their venue and a link back to Encore, and the link carries the dates and places so the plan rebuilds for whoever opens it.
        </p>
      </section>

      {/* 05 · Before you land */}
      <section id="ask" className="scroll-mt-header border-t border-hairline bg-linen-200">
        <div className="container-site grid gap-10 py-section lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <SectionHeading number="05" eyebrow="Before you land" title="Tell us the dates and we’ll have the showings lined up before you land." />
            <p className="t-body max-w-[440px] text-body">
              The dates and places below are the ones in your plan. Add what you&rsquo;re looking for and whether there&rsquo;s a house to sell first, and one of us will call or write back.
            </p>
            {sentMessage !== askMessage ? (
              <button type="button" onClick={() => setSentMessage(askMessage)} className="link-rule self-start">
                Use the dates in this plan
              </button>
            ) : null}
          </div>
          <div className="border border-hairline bg-white p-6 sm:p-8">
            <LeadForm
              key={sentMessage}
              form="buy"
              fields={["name", "email", "phone", "message"]}
              submitLabel="Line up the showings"
              defaultMessage={sentMessage}
              placeholderMessage="Where you’re looking, what you need, and whether there’s a house to sell first."
              hidden={{ market: applied.markets.length === 1 ? applied.markets[0] : undefined, pageTitle: "Encore visit plan" }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

type ListApi = { has: (slug: string) => boolean; toggle: (slug: string) => void };

/** One day: the sticky date, the showing block, then the evening's picks. */
function DayCard({ d, n, today, has, toggle }: { d: PlanDay; n: number; today: string } & ListApi) {
  const everything = encoreHref({ date: d.day });
  return (
    <article className="plan-day" aria-labelledby={`plan-${d.day}`}>
      <h3 id={`plan-${d.day}`} className="plan-dayhead">
        <span>
          Day {n} · {d.day === today ? "Today · " : ""}
          {longDay(d.day)}
        </span>
        {d.weekend ? (
          <span className="t-mono-sm text-graphite-500">
            <span className="sr-only">, </span>Weekend
          </span>
        ) : null}
      </h3>

      <div className="plan-block is-showings">
        <p className="plan-slot">10:00 – 4:00</p>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="plan-title">{SHOWINGS.label}</p>
          <p className="t-small text-body">
            {d.markets.length > 1 ? `${marketList(d.markets)} today, in that order.` : `${marketList(d.markets)} today.`}
          </p>
        </div>
      </div>

      {d.matinee ? (
        <div className="plan-block">
          <p className="plan-slot">Matinee</p>
          <ul className="flex min-w-0 flex-1 flex-col">
            <PickRow o={d.matinee} saved={has(d.matinee.e.s)} onSave={() => toggle(d.matinee!.e.s)} />
          </ul>
        </div>
      ) : null}

      <div className="plan-block">
        <p className="plan-slot">Evening</p>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {d.picks.length ? (
            <ul className="flex flex-col">
              {d.picks.map((o) => (
                <PickRow key={`${o.e.s}-${o.start}`} o={o} saved={has(o.e.s)} onSave={() => toggle(o.e.s)} />
              ))}
            </ul>
          ) : (
            <p className="t-body text-body">Encore has nothing timed after five on this evening. Venues add dates through the season, so check again closer to the day.</p>
          )}
          <Link href={everything} className="link-rule self-start">
            Show everything on this evening
          </Link>
        </div>
      </div>
    </article>
  );
}

/** A pick: the time, the title (a link to the event page), venue, market and category, and Save. */
function PickRow({ o, saved, onSave }: { o: Occ; saved: boolean; onSave: () => void }) {
  const e = o.e;
  return (
    <li className="encore-agenda-row" style={{ ["--cat" as string]: CATEGORY[e.c].color }}>
      <Link href={`/calendar/${e.s}`} className="encore-agenda-link">
        <span className="encore-agenda-time">{clock(o.time)}</span>
        <span className="min-w-0 flex-1">
          <span className="encore-agenda-title">{e.t}</span>
          <span className="t-mono-sm block text-graphite-500">{[e.vn, marketName(e.m), CATEGORY[e.c].label].join(" · ")}</span>
        </span>
        <span className={cn("t-mono-sm hidden shrink-0 sm:block", "text-graphite-500")}>{e.pr ?? ""}</span>
      </Link>
      <SaveButton saved={saved} onToggle={onSave} title={e.t} className="encore-agenda-save" />
    </li>
  );
}
