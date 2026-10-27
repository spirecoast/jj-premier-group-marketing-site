"use client";

import dynamic from "next/dynamic";
import { useId } from "react";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { Checkbox, Field, Select } from "@/components/ui/field";
import { StepBody, StepCard, StepFooter, StepProgress, StepTitle, useStepFocus } from "@/components/ui/stepper";
import { MARKETS } from "@/lib/content/markets";
import { titleCase } from "@/lib/neighborhoods/format";
import type { IndexEntry } from "@/lib/neighborhoods/index-format";
import {
  BUILD_LABEL,
  EVAC_LABEL,
  HOME_TYPES,
  RADII,
  WATER_LABEL,
  WATER_TYPES,
  answered,
  type Answers,
  type Build,
  type EvacPref,
  type Question,
  type QuestionId,
} from "@/lib/neighborhoods/match";

const PointPicker = dynamic(() => import("./point-picker").then((m) => m.PointPicker), {
  ssr: false,
  loading: () => <div className="match-map match-map-loading" aria-hidden="true" />,
});

type Props = {
  question: Question;
  number: number;
  total: number;
  answers: Answers;
  onAnswers: (a: Answers) => void;
  /** Area records with a point, for the distance question. */
  areas: IndexEntry[];
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  count: { total: number; confirmed: number } | null;
  /** True once the visitor has moved between questions, so the new one takes focus. */
  moved?: boolean;
};

/** One question, one screen. The count at the bottom moves as the answer changes. */
export function MatchQuestion({ question: q, number, total, answers, onAnswers, areas, onNext, onBack, onSkip, count, moved = false }: Props) {
  const uid = useId();
  const isAnswered = answered(answers, q.id);
  const strict = answers.strict.includes(q.id);
  const setStrict = (on: boolean) =>
    onAnswers({ ...answers, strict: on ? answers.strict.filter((s) => s !== q.id) : [...new Set([...answers.strict, q.id])] });
  const set = (patch: Partial<Answers>) => onAnswers({ ...answers, ...patch });
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
  const titleRef = useStepFocus<HTMLHeadingElement>(number, moved);

  return (
    <StepCard aria-labelledby={`${uid}-title`}>
      <StepProgress step={number} total={total} />
      <StepBody stepKey={q.id} className="min-h-0 gap-8">
      <div className="flex flex-col gap-4">
        <StepTitle id={`${uid}-title`} ref={titleRef}>
          {q.title}
        </StepTitle>
        <p className="t-body max-w-measure text-body">{q.help}</p>
      </div>

      <div className="flex flex-col gap-5">
        {q.id === "market" ? (
          <Choices
            multi
            items={MARKETS.map((m) => [m.slug, m.name] as const)}
            selected={answers.market}
            onToggle={(v) => set({ market: toggle(answers.market, v) })}
          />
        ) : null}
        {q.id === "county" ? (
          <Choices
            items={[
              ["Manatee", "Manatee County"],
              ["Sarasota", "Sarasota County"],
            ]}
            selected={answers.county ? [answers.county] : []}
            onToggle={(v) => set({ county: answers.county === v ? null : v })}
          />
        ) : null}
        {q.id === "homes" ? (
          <Choices multi items={HOME_TYPES.map((h) => [h, titleCase(h)] as const)} selected={answers.homes} onToggle={(v) => set({ homes: toggle(answers.homes, v) })} />
        ) : null}
        {q.id === "build" ? (
          <Choices
            items={(Object.keys(BUILD_LABEL) as Build[]).map((b) => [b, BUILD_LABEL[b]] as const)}
            selected={answers.build ? [answers.build] : []}
            onToggle={(v) => set({ build: answers.build === v ? null : v })}
          />
        ) : null}
        {q.id === "gated" ? <YesNo yes="Gated" no="Not gated" value={answers.gated} onChange={(v) => set({ gated: v })} /> : null}
        {q.id === "hoa" ? <Choices items={[["1", "Yes, with an HOA"]]} selected={answers.hoa ? ["1"] : []} onToggle={() => set({ hoa: answers.hoa ? null : true })} /> : null}
        {q.id === "cdd" ? <Choices items={[["1", "Yes, with a CDD"]]} selected={answers.cdd ? ["1"] : []} onToggle={() => set({ cdd: answers.cdd ? null : true })} /> : null}
        {q.id === "water" ? (
          <Choices multi items={WATER_TYPES.map((w) => [w, WATER_LABEL[w]] as const)} selected={answers.water} onToggle={(v) => set({ water: toggle(answers.water, v) })} />
        ) : null}
        {q.id === "evac" ? (
          <Choices
            items={(["none", "d", "c", "b"] as EvacPref[]).map((e) => [e, EVAC_LABEL[e]] as const)}
            selected={answers.evac ? [answers.evac] : []}
            onToggle={(v) => set({ evac: answers.evac === v ? null : v })}
          />
        ) : null}
        {q.id === "near" ? <Near answers={answers} areas={areas} set={set} /> : null}

        <Chip
          size="lg"
          className="self-start"
          selected={!isAnswered}
          onClick={() => {
            clearAnswer(q.id, answers, onAnswers);
          }}
        >
          {q.any}
        </Chip>
      </div>

      {isAnswered ? (
        <Checkbox className="max-w-measure" checked={!strict} onChange={(e) => setStrict(e.target.checked)}>
          Keep places we don’t have this detail for
        </Checkbox>
      ) : null}
      </StepBody>

      <StepFooter
        back={number > 1 ? { label: "Back", onClick: onBack } : undefined}
        skip={!isAnswered ? { label: "Skip", onClick: onSkip } : undefined}
        next={{ label: number === total ? "See my matches" : "Next", onClick: onNext }}
      >
        <p className="flex items-baseline gap-3" aria-live="polite">
          {count ? (
            <>
              <span className="font-display text-[2.5rem] font-light leading-none text-navy tabular-nums">{count.total.toLocaleString()}</span>
              <span className="t-body text-body">
                {count.total === 1 ? "place fits" : "places fit"}
                {count.total && count.confirmed !== count.total ? <span className="t-small block text-graphite-500">{count.confirmed.toLocaleString()} confirmed on every answer</span> : null}
              </span>
            </>
          ) : (
            <span className="t-small text-graphite-500">Loading the neighborhoods…</span>
          )}
        </p>
      </StepFooter>
    </StepCard>
  );
}

function clearAnswer(id: QuestionId, a: Answers, onAnswers: (a: Answers) => void) {
  switch (id) {
    case "market":
      return onAnswers({ ...a, market: [] });
    case "county":
      return onAnswers({ ...a, county: null });
    case "homes":
      return onAnswers({ ...a, homes: [] });
    case "build":
      return onAnswers({ ...a, build: null });
    case "gated":
      return onAnswers({ ...a, gated: null });
    case "hoa":
      return onAnswers({ ...a, hoa: null });
    case "cdd":
      return onAnswers({ ...a, cdd: null });
    case "water":
      return onAnswers({ ...a, water: [] });
    case "evac":
      return onAnswers({ ...a, evac: null });
    case "near":
      return onAnswers({ ...a, near: null });
  }
}

function Choices<T extends string>({ items, selected, onToggle }: { items: readonly (readonly [T, string])[]; selected: T[]; onToggle: (v: T) => void; multi?: boolean }) {
  return (
    <ChipGroup>
      {items.map(([v, label]) => (
        <Chip key={v} size="lg" selected={selected.includes(v)} onClick={() => onToggle(v)}>
          {label}
        </Chip>
      ))}
    </ChipGroup>
  );
}

function YesNo({ yes, no, value, onChange }: { yes: string; no: string; value: boolean | null; onChange: (v: boolean | null) => void }) {
  return (
    <Choices
      items={[
        ["1", yes],
        ["0", no],
      ]}
      selected={value === null ? [] : [value ? "1" : "0"]}
      onToggle={(v) => onChange(value === (v === "1") ? null : v === "1")}
    />
  );
}

function Near({ answers, areas, set }: { answers: Answers; areas: IndexEntry[]; set: (p: Partial<Answers>) => void }) {
  const uid = useId();
  const near = answers.near;
  const point = near?.kind === "point" ? { lat: near.lat, lng: near.lng } : null;
  const areaSlug = near?.kind === "area" ? near.slug : "";
  const byMarket = MARKETS.map((m) => ({ market: m, areas: areas.filter((a) => a.m === m.slug) })).filter((g) => g.areas.length);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-10">
      <div className="flex flex-col gap-6">
        <Field id={`${uid}-area`} label="Start from an Atlas area">
          <Select value={areaSlug} onChange={(e) => set({ near: e.target.value ? { kind: "area", slug: e.target.value } : null })}>
            <option value="">Choose an area</option>
            {byMarket.map((g) => (
              <optgroup key={g.market.slug} label={g.market.name}>
                {g.areas.map((a) => (
                  <option key={a.s} value={a.s}>
                    {a.n}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <div className="flex flex-col gap-2">
          <p id={`${uid}-within`} className="field-label">
            How far is close enough?
          </p>
          <ChipGroup aria-labelledby={`${uid}-within`}>
            {RADII.map((r) => (
              <Chip key={r} size="sm" tick={false} selected={answers.within === r} onClick={() => set({ within: r })}>
                {r} miles
              </Chip>
            ))}
          </ChipGroup>
        </div>
        <p className="t-small text-body-muted" aria-live="polite">
          {point ? `Point set at ${point.lat.toFixed(3)}, ${point.lng.toFixed(3)}. Tap the map again to move it.` : areaSlug ? "Or tap the map to use a point instead." : "Or tap the map to drop a point."}
        </p>
      </div>
      <div className="overflow-hidden border border-hairline">
        <PointPicker point={point} onPoint={(p) => set({ near: { kind: "point", lat: p.lat, lng: p.lng } })} />
      </div>
    </div>
  );
}
