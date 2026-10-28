"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { LeadForm } from "@/components/lead-form";
import { useSitePhone } from "@/components/site-contact";
import { track } from "@/lib/analytics";
import {
  COUNTY_LABEL,
  ESTOPPEL_CAP,
  NEGATIVE_NET_NOTE,
  NOVEMBER_DISCOUNT_PCT,
  RECORDING_ADDITIONAL_PAGE,
  RECORDING_FIRST_PAGE,
  computeSheet,
  defaultSellerPaysOwnerPolicy,
  formatUsd,
  formatYmd,
  recordingFee,
  summaryText,
  type County,
  type DuesPeriod,
  type NetProceedsInput,
  type Sheet,
} from "@/lib/net-proceeds";
import { EMPTY_FORM, NET_PROCEEDS_DRAFT, NET_PROCEEDS_KEYS, WHAT_IF_STEP, isEmptyForm, parseSheetForm, sheetFormQuery, sheetPath, toNum, type SheetForm, type TitleChoice } from "@/lib/net-proceeds-url";
import { URL_PENDING_STYLE_ID } from "@/lib/url-island";
import { draft } from "@/lib/url-state";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import { KeepEmail, keepPrint } from "@/components/keep/keep-row";
import { KeepSheet } from "@/components/keep/keep-sheet";
import "./net-proceeds.css";

const COUNTIES: readonly { value: County; label: string }[] = [
  { value: "sarasota", label: "Sarasota" },
  { value: "manatee", label: "Manatee" },
];

/** The two-page release the seller records for each loan paid off (FR/BAR 9(a): fees needed to cure title). */
const RELEASE_PAGES = 2;

/** How long a figure takes to count to its new value, and how long a result waits before it is read out. */
const TWEEN_MS = 600;
const ANNOUNCE_MS = 600;
/** The sheet's resting places on a phone, in the order they stack. */
type Stop = "peek" | "half" | "full";
const STOPS: readonly Stop[] = ["peek", "half", "full"];
/** How far a drag on the handle travels before the sheet moves a stop. */
const DRAG_STOP = 72;
/** Where the county came from when the seller didn't tap it: a link, or the sheet kept on this device. */
type CountyFrom = "tap" | "link" | "saved" | null;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Writes the sheet's address without waking Next's router. The router's
 * history patch dispatches inside a React transition, and the view transition
 * that starts swallows what is typed in the next 150 ms or so and puts focus
 * back where it was: a tap on a county tile and then the first digits of the
 * price went missing. Nothing on this page reads the router's search params
 * (the sheet reads the address itself on arrival), so the native call is
 * enough; the entry's own state stays with it.
 */
function replaceAddress(href: string): void {
  const next = new URL(href, window.location.href);
  if (next.pathname === window.location.pathname && next.search === window.location.search) return;
  History.prototype.replaceState.call(window.history, window.history.state, "", `${next.pathname}${next.search}${window.location.hash}`);
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A number that counts to its new value over TWEEN_MS (instant for anyone who
 * asked for reduced motion). `active` false shows the value at once.
 */
function useTweened(value: number, active = true): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  useEffect(() => {
    const from = shownRef.current;
    if (reduced || !active || from === value) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TWEEN_MS);
      const v = t < 1 ? from + (value - from) * ease(t) : value;
      shownRef.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced, active]);
  return shown;
}

/** A dollar figure on its way to `value`: whole dollars while it counts when the target is whole, cents otherwise. */
function tweenUsd(shown: number, value: number): string {
  if (shown === value) return formatUsd(value);
  return formatUsd(Number.isInteger(value) ? Math.round(shown) : Math.round(shown * 100) / 100);
}

function Field({ id, label, hint, children, className }: { id: string; label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("field", className)}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="t-note">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Money({
  id,
  value,
  onChange,
  placeholder = "0",
  described,
  inputRef,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** True when the enclosing Field renders a hint. */
  described?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="field-input tabular-nums"
      aria-describedby={described ? `${id}-hint` : undefined}
    />
  );
}

function Legend({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <legend className="mb-5 flex items-center gap-3">
      <span className="grid size-8 place-items-center rounded-full bg-sky-100 font-display text-[1rem] leading-none text-sky-800 tabular-nums" aria-hidden="true">
        {Number(number)}
      </span>
      <span className="font-display text-[1.5rem] font-light leading-none text-navy">{children}</span>
    </legend>
  );
}

function Check({ checked, onChange, children, hint }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1.5 size-4 shrink-0 accent-sky-700" />
      <span className="flex flex-col gap-0.5">
        <span className="t-body text-body">{children}</span>
        {hint ? <span className="t-small text-graphite-500">{hint}</span> : null}
      </span>
    </label>
  );
}

function Chevron({ up }: { up?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={cn("net-bar-chevron", up && "is-up")}>
      <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M6.4 2.6c.4-.4 1-.3 1.3.1l1.4 1.9c.3.4.3.9 0 1.3l-.9 1.1a9.6 9.6 0 0 0 3.8 3.8l1.1-.9c.4-.3.9-.3 1.3 0l1.9 1.4c.4.3.5.9.1 1.3l-1.2 1.4c-.6.7-1.6 1-2.5.7A13.2 13.2 0 0 1 4.3 6.3c-.3-.9 0-1.9.7-2.5z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The seller net sheet: inputs stacked on the left, the itemized sheet on the
 * right (sticky on desktop). On a phone the net sits in a bar pinned to the
 * bottom edge, and tapping it opens the same sheet as a bottom sheet over the
 * inputs. The inputs live in the address bar (written once per settled change,
 * never per keystroke) and in localStorage, so a reload or a sent link opens
 * the same sheet. All math lives in lib/net-proceeds.ts; this file only turns
 * strings into numbers and draws the result.
 */
export function NetProceedsCalculator() {
  const [f, setF] = useState<SheetForm>(EMPTY_FORM);
  const [countyFrom, setCountyFrom] = useState<CountyFrom>(null);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState<"numbers" | "link" | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sentSummary, setSentSummary] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stop, setStop] = useState<Stop>("half");
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const dialogId = id("sheet-dialog");
  const phone = useSitePhone();
  const reduced = useReducedMotion();

  const priceRef = useRef<HTMLInputElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);

  /* ---- The address bar and the device: read once on arrival, written on settled changes. ---- */
  useIsoLayoutEffect(() => {
    const fromUrl = parseSheetForm(new URLSearchParams(window.location.search));
    if (fromUrl) {
      setF(fromUrl);
      setCountyFrom(fromUrl.county ? "link" : null);
    } else {
      const saved = draft.read<SheetForm>(NET_PROCEEDS_DRAFT);
      let restored: SheetForm | null = null;
      try {
        // Through the query and back, so a stale or hand-edited record can't carry anything the form doesn't take.
        restored = saved ? parseSheetForm(new URLSearchParams(sheetFormQuery({ ...EMPTY_FORM, ...saved }))) : null;
      } catch {
        restored = null;
      }
      if (restored) {
        setF(restored);
        setCountyFrom(restored.county ? "saved" : null);
      }
    }
    document.getElementById(URL_PENDING_STYLE_ID)?.remove();
    setReady(true);
  }, []);

  // The sheet in progress is kept on the device on every change; an empty sheet clears it.
  useEffect(() => {
    if (!ready) return;
    if (isEmptyForm(f)) draft.clear(NET_PROCEEDS_DRAFT);
    else draft.write(NET_PROCEEDS_DRAFT, f);
  }, [f, ready]);

  /** This sheet's address: the page's own query (a campaign tag stays) with the sheet's keys replaced. */
  const hrefFor = useCallback((form: SheetForm) => {
    const sp = new URLSearchParams(window.location.search);
    for (const k of NET_PROCEEDS_KEYS) sp.delete(k);
    new URLSearchParams(sheetFormQuery(form)).forEach((v, k) => sp.set(k, v));
    const q = sp.toString();
    return `${window.location.pathname}${q ? `?${q}` : ""}`;
  }, []);

  // A discrete choice (a tile, a select, a box) is written at once; typing is written when the field loses focus.
  const syncNext = useRef(false);
  useEffect(() => {
    if (!ready || !syncNext.current) return;
    syncNext.current = false;
    replaceAddress(hrefFor(f));
  }, [f, ready, hrefFor]);

  const set = <K extends keyof SheetForm>(k: K, v: SheetForm[K]) => setF((prev) => ({ ...prev, [k]: v }));
  const commit = <K extends keyof SheetForm>(k: K, v: SheetForm[K]) => {
    syncNext.current = true;
    set(k, v);
  };
  const onFormBlur = () => {
    if (ready) replaceAddress(hrefFor(f));
  };

  function pickCounty(c: County) {
    setCountyFrom("tap");
    commit("county", c);
  }
  const onTileKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = f.county === "manatee" ? 1 : 0;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % COUNTIES.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + COUNTIES.length) % COUNTIES.length;
    if (next === null) return;
    e.preventDefault();
    pickCounty(COUNTIES[next]!.value);
    tileRefs.current[next]?.focus();
  };

  /* ---- The sheet. ---- */
  const mortgage = toNum(f.mortgage);
  const second = toNum(f.second);
  const releases = (mortgage && mortgage > 0 ? 1 : 0) + (second && second > 0 ? 1 : 0);
  const recordingDefault = releases ? recordingFee(RELEASE_PAGES) * releases : 0;
  const recordingValue = f.recordingTouched ? f.recording : recordingDefault ? String(recordingDefault) : "";

  const price = toNum(f.price);
  const hasSheet = typeof price === "number" && price > 0 && f.county !== "";

  const input = useMemo<NetProceedsInput>(
    () => ({
      price: price ?? 0,
      county: f.county || "sarasota",
      closingDate: f.closingDate || undefined,
      sellerPaysOwnerPolicy: f.title === "custom" ? undefined : f.title === "seller",
      mortgagePayoff: mortgage,
      secondLienPayoff: second,
      listingCommissionPct: toNum(f.listingPct),
      buyerBrokerPct: toNum(f.buyerPct),
      annualTax: toNum(f.annualTax),
      taxPaid: f.taxPaid,
      foreignSeller: f.foreignSeller,
      hasAssociation: f.hasAssociation,
      duesAmount: toNum(f.dues),
      duesPeriod: f.duesPeriod,
      estoppelFee: toNum(f.estoppel),
      settlementFee: toNum(f.settlement),
      recordingFee: toNum(recordingValue),
      repairsConcessions: toNum(f.repairs),
      stagingPhotos: toNum(f.staging),
      otherCosts: toNum(f.other),
    }),
    [f, price, mortgage, second, recordingValue],
  );
  const sheet = useMemo(() => computeSheet(input), [input]);
  // The What-if row: the same inputs at the price less and plus a step.
  const whatIf = useMemo(() => {
    if (!hasSheet) return null;
    const p = input.price;
    return [
      p - WHAT_IF_STEP > 0 ? { price: p - WHAT_IF_STEP, net: computeSheet({ ...input, price: p - WHAT_IF_STEP }).net } : null,
      { price: p, net: sheet.net, current: true },
      { price: p + WHAT_IF_STEP, net: computeSheet({ ...input, price: p + WHAT_IF_STEP }).net },
    ];
  }, [hasSheet, input, sheet.net]);
  const summary = useMemo(() => (hasSheet ? summaryText(sheet) : ""), [hasSheet, sheet]);

  // One "Explore" event the first time a sheet is produced, not on every keystroke.
  const tracked = useRef(false);
  useEffect(() => {
    if (hasSheet && !tracked.current) {
      tracked.current = true;
      track("Explore", { action: "net-proceeds" });
    }
  }, [hasSheet]);

  // The one live region: the net, read once the typing has settled.
  const liveText = hasSheet ? `Estimated net, ${formatUsd(sheet.net)}` : "";
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setAnnounce(liveText), ANNOUNCE_MS);
    return () => clearTimeout(t);
  }, [liveText]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  async function copyText(text: string, what: "numbers" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      window.prompt(what === "link" ? "Copy this link" : "Copy this summary", text);
    }
  }
  const shareUrl = () => new URL(sheetPath(f), window.location.href).href;
  function copyLink() {
    track("Share", { what: "net-sheet" });
    void copyText(shareUrl(), "link");
  }
  const withLink = () => `${summary}\n\nThis sheet: ${shareUrl()}`;
  function openSend() {
    setSentSummary(withLink());
    setSendOpen(true);
  }

  /** A What-if cell: the price becomes the sheet's, and the Sale price field takes focus so the change is read once. */
  function setPrice(p: number, inDialog: boolean) {
    commit("price", String(p));
    if (inDialog) return;
    priceRef.current?.focus();
  }

  /* ---- The bottom sheet (phones): a native dialog with three stops. ---- */
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (sheetOpen && !el.open) {
      setStop("half");
      el.showModal();
      document.documentElement.style.overflow = "hidden";
      handleRef.current?.focus();
    } else if (!sheetOpen && el.open) {
      el.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [sheetOpen]);
  // From lg the sheet is a column beside the form; a window widened with the sheet open lets it go.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setSheetOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const stepStop = (dir: 1 | -1) => {
    const i = STOPS.indexOf(stop) + dir;
    if (i < 0) closeSheet();
    else setStop(STOPS[Math.min(STOPS.length - 1, i)]!);
  };
  const onHandleKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      stepStop(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      stepStop(-1);
    }
  };
  const drag = useRef<{ y: number; id: number } | null>(null);
  const [dragY, setDragY] = useState(0);
  const onHeadDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHeadMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setDragY(e.clientY - drag.current.y);
  };
  const onHeadUp = () => {
    const d = dragY;
    drag.current = null;
    setDragY(0);
    if (d > DRAG_STOP) stepStop(-1);
    else if (d < -DRAG_STOP) stepStop(1);
  };

  function changeCounty() {
    closeSheet();
    requestAnimationFrame(() => (tileRefs.current[f.county === "manatee" ? 1 : 0] ?? tileRefs.current[0])?.focus());
  }

  const customSeller = f.county ? defaultSellerPaysOwnerPolicy(f.county) : null;
  const countyName = f.county ? COUNTY_LABEL[f.county] : "";
  const negative = hasSheet && sheet.net < 0;
  const barNet = useTweened(hasSheet ? sheet.net : 0, hasSheet);

  const sheetProps = { sheet, hasSheet, countyFrom, whatIf, onChangeCounty: changeCounty, reduced };

  return (
    <div className="net-calc grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-16" data-url-island="">
      {/* Inputs */}
      <form className="flex flex-col gap-12 print:hidden" onSubmit={(e) => e.preventDefault()} onBlur={onFormBlur} aria-label="Net proceeds inputs">
        <fieldset className="flex flex-col gap-6">
          <Legend number="01">The sale</Legend>
          <div className="field">
            <span id={id("county-label")} className="field-label">
              County
            </span>
            <div role="radiogroup" aria-labelledby={id("county-label")} aria-describedby={id("county-hint")} className="grid grid-cols-2 gap-2" onKeyDown={onTileKey}>
              {COUNTIES.map((c, i) => {
                const on = f.county === c.value;
                return (
                  <button
                    key={c.value}
                    ref={(el) => {
                      tileRefs.current[i] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on || (!f.county && i === 0) ? 0 : -1}
                    data-active={on ? "true" : undefined}
                    className="chip net-tile"
                    onClick={() => pickCounty(c.value)}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            <p id={id("county-hint")} className="t-note">
              The two counties this sheet is built for; Miami-Dade&rsquo;s stamp rate differs.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id={id("price")} label="Sale price">
              <Money id={id("price")} value={f.price} onChange={(v) => set("price", v)} placeholder="650,000" inputRef={priceRef} />
            </Field>
            <Field id={id("closing")} label="Closing date" hint="Prorations run through the day before this date.">
              <input id={id("closing")} type="date" value={f.closingDate} onChange={(e) => commit("closingDate", e.target.value)} className="field-input" aria-describedby={`${id("closing")}-hint`} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <Legend number="02">What&rsquo;s owed</Legend>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id={id("mortgage")} label="Mortgage payoff" hint="From the lender's payoff letter, which adds interest to the closing date.">
              <Money id={id("mortgage")} value={f.mortgage} onChange={(v) => set("mortgage", v)} described />
            </Field>
            <Field id={id("second")} label="Second lien (optional)" hint="A HELOC or second mortgage, if there is one.">
              <Money id={id("second")} value={f.second} onChange={(v) => set("second", v)} described />
            </Field>
          </div>
          <Check checked={f.foreignSeller} onChange={(v) => commit("foreignSeller", v)} hint="The buyer then has to withhold part of the price for the IRS (FIRPTA). It's credited against your U.S. tax.">
            I&rsquo;m not a U.S. citizen or resident for tax purposes
          </Check>
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <Legend number="03">Commission, as negotiated</Legend>
          <p className="t-small max-w-[460px] text-graphite-500">
            Both are set in writing before the house goes live, and neither has a suggested number here. What you
            offer a buyer&rsquo;s broker, if anything, is a separate line and a separate decision.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id={id("listingPct")} label="Listing commission, % of price">
              <input id={id("listingPct")} type="text" inputMode="decimal" value={f.listingPct} onChange={(e) => set("listingPct", e.target.value)} placeholder="as negotiated" className="field-input tabular-nums" />
            </Field>
            <Field id={id("buyerPct")} label="Buyer-broker compensation, % of price">
              <input id={id("buyerPct")} type="text" inputMode="decimal" value={f.buyerPct} onChange={(e) => set("buyerPct", e.target.value)} placeholder="as negotiated" className="field-input tabular-nums" />
            </Field>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <Legend number="04">Taxes and dues</Legend>
          <Field id={id("tax")} label="This year's property tax bill" hint={`The bill as printed, CDD included; last year's if this year's isn't out. The sheet takes off the ${NOVEMBER_DISCOUNT_PCT}% early-payment discount, as the Florida contract does.`}>
            <Money id={id("tax")} value={f.annualTax} onChange={(v) => set("annualTax", v)} described />
          </Field>
          <Check checked={f.taxPaid} onChange={(v) => commit("taxPaid", v)} hint="Bills go out in November. If you've paid this year's, the buyer pays you back for the rest of the year.">
            This year&rsquo;s bill is already paid
          </Check>
          <Check checked={f.hasAssociation} onChange={(v) => commit("hasAssociation", v)}>
            The home is in an HOA or condominium association
          </Check>
          {f.hasAssociation ? (
            <div className="grid gap-6 border-l border-hairline pl-5 sm:grid-cols-2">
              <Field id={id("dues")} label="Dues, per period" hint="Dues are billed ahead. If the current period is paid, the unused days come back to you at closing.">
                <Money id={id("dues")} value={f.dues} onChange={(v) => set("dues", v)} described />
              </Field>
              <Field id={id("duesPeriod")} label="Billed">
                <select id={id("duesPeriod")} value={f.duesPeriod} onChange={(e) => commit("duesPeriod", e.target.value as DuesPeriod)} className="field-input">
                  <option value="year">Yearly, calendar year</option>
                  <option value="quarter">Quarterly</option>
                  <option value="month">Monthly</option>
                </select>
              </Field>
              <Field id={id("estoppel")} label="Estoppel certificate fee" hint={`Default: the $${ESTOPPEL_CAP} cap DBPR publishes under F.S. 720.30851 and 718.116. Expedited adds up to $119; a delinquent account up to $179.`} className="sm:col-span-2">
                <Money id={id("estoppel")} value={f.estoppel} onChange={(v) => set("estoppel", v)} described />
              </Field>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <Legend number="05">Title and closing</Legend>
          <Field
            id={id("title")}
            label="Owner's title policy"
            hint={
              customSeller === null
                ? `By custom the buyer pays in ${COUNTY_LABEL.sarasota} and the seller in ${COUNTY_LABEL.manatee}. The contract's paragraph 9(c) can say otherwise.`
                : `By custom the ${customSeller ? "seller" : "buyer"} pays in ${countyName}. The contract's paragraph 9(c) can say otherwise.`
            }
          >
            <select id={id("title")} value={f.title} onChange={(e) => commit("title", e.target.value as TitleChoice)} className="field-input" aria-describedby={`${id("title")}-hint`}>
              <option value="custom">{countyName ? `Follow the ${countyName} custom` : "Follow the county custom"}</option>
              <option value="seller">Seller pays</option>
              <option value="buyer">Buyer pays</option>
            </select>
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id={id("settlement")} label="Settlement or closing fee" hint="Varies by title company; ask for the quote. Left blank until you have it.">
              <Money id={id("settlement")} value={f.settlement} onChange={(v) => set("settlement", v)} placeholder="blank" described />
            </Field>
            <Field
              id={id("recording")}
              label="Recording"
              hint={
                recordingDefault
                  ? `Default: ${releases === 1 ? "one" : "two"} ${RELEASE_PAGES}-page release${releases === 1 ? "" : "s"} of mortgage at the clerk's $${RECORDING_FIRST_PAGE.toFixed(2)} first page and $${RECORDING_ADDITIONAL_PAGE.toFixed(2)} each additional.`
                  : "Nothing by default: the buyer records the deed. Add an amount if you have a lien or correction to record."
              }
            >
              <Money id={id("recording")} value={recordingValue} onChange={(v) => setF((p) => ({ ...p, recording: v, recordingTouched: true }))} described />
            </Field>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <Legend number="06">Optional</Legend>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id={id("repairs")} label="Repairs or concessions" hint="Whatever the inspection turns into: a credit, or work before closing.">
              <Money id={id("repairs")} value={f.repairs} onChange={(v) => set("repairs", v)} described />
            </Field>
            <Field id={id("staging")} label="Staging and photographs" hint="Usually paid before the listing goes live, so it's your money either way.">
              <Money id={id("staging")} value={f.staging} onChange={(v) => set("staging", v)} described />
            </Field>
            <Field id={id("other")} label="Other costs" hint="A home warranty for the buyer, special assessments due, association transfer fees." className="sm:col-span-2">
              <Money id={id("other")} value={f.other} onChange={(v) => set("other", v)} described />
            </Field>
          </div>
        </fieldset>
      </form>

      {/* The sheet, in the flow of the page: the column beside the form on a desktop, the foot of the page on a phone, and what prints. */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-header lg:self-start">
        <KeepSheet tool="tide-sale-calculator">
          <section id="net-sheet" aria-label="Estimated net proceeds" className="scroll-mt-header border border-hairline bg-white p-6 sm:p-8 print:border-0 print:p-0">
            <SheetView {...sheetProps} onPrice={(p) => setPrice(p, false)} />
            <p className="sr-only" aria-live="polite">
              {announce}
            </p>
          </section>
        </KeepSheet>

        {hasSheet ? (
          <div className="flex flex-col gap-5 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={openSend} className="btn btn-navy" aria-expanded={sendOpen} aria-controls={id("send")}>
                Send it to us
              </button>
              <button type="button" onClick={() => keepPrint("tide-sale-calculator")} className="btn btn-outline">
                Print
              </button>
              <button type="button" onClick={() => void copyText(summary, "numbers")} className="btn btn-outline min-w-[150px]">
                <span aria-live="polite">{copied === "numbers" ? "Copied" : "Copy the numbers"}</span>
              </button>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <button type="button" onClick={copyLink} className="link-rule">
                <span aria-live="polite">{copied === "link" ? "Link copied" : "Copy link to this sheet"}</span>
              </button>
              <p className="t-note">The link carries every figure on this sheet.</p>
              <KeepEmail tool="tide-sale-calculator" />
            </div>
            {sendOpen ? (
              <div id={id("send")} className="flex flex-col gap-4 border border-hairline bg-white p-6 sm:p-8">
                <div className="flex flex-col gap-2">
                  <h3 className="t-h3 text-navy">Send it to us</h3>
                  <p className="t-body text-body">We&rsquo;ll check it against recent sales and tell you which lines we&rsquo;d change.</p>
                  {!sentSummary.startsWith(summary) ? (
                    <button type="button" onClick={() => setSentSummary(withLink())} className="link-rule self-start">
                      Use the current numbers
                    </button>
                  ) : null}
                </div>
                <LeadForm
                  key={sentSummary}
                  form="sell"
                  fields={["name", "email", "phone", "message"]}
                  submitLabel="Send it to us"
                  defaultMessage={sentSummary}
                  hidden={{ pageTitle: "Net proceeds sheet" }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Phones: the net pinned to the bottom edge, and the sheet as a bottom sheet over the inputs. Mounted after hydration; the in-flow sheet above is what prints. */}
      {ready ? (
        <>
          <div className="net-bar lg:hidden print:hidden" data-ground="dark">
            <button
              type="button"
              className="net-bar-main"
              aria-expanded={sheetOpen}
              aria-controls={dialogId}
              aria-label={hasSheet ? `What you'd keep, ${formatUsd(sheet.net)}. Open the itemised sheet` : "What you'd keep. Open the itemised sheet"}
              onClick={() => setSheetOpen((o) => !o)}
            >
              <span className="t-label text-linen-200" aria-hidden="true">
                What you&rsquo;d keep
              </span>
              <span className="flex items-center gap-2" aria-hidden="true">
                <span className={cn("net-bar-figure", negative && "is-negative", !hasSheet && "is-empty")}>{hasSheet ? tweenUsd(Math.round(barNet), Math.round(sheet.net)) : "—"}</span>
                <Chevron up={!sheetOpen} />
              </span>
            </button>
            {phone ? (
              <a href={`tel:${phone}`} className="net-bar-call" aria-label="Call us" onClick={() => track("Phone tap", { where: "action-bar" })}>
                <PhoneGlyph />
              </a>
            ) : null}
          </div>

          <dialog
            ref={dialogRef}
            id={dialogId}
            className="net-sheet-dialog lg:hidden print:hidden"
            data-stop={stop}
            aria-label="Estimated net proceeds"
            onClose={closeSheet}
            onCancel={(e) => {
              e.preventDefault();
              closeSheet();
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeSheet();
            }}
            style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
          >
            <div className="net-sheet-head" onPointerDown={onHeadDown} onPointerMove={onHeadMove} onPointerUp={onHeadUp} onPointerCancel={onHeadUp}>
              <button ref={handleRef} type="button" className="net-handle" aria-label={stop === "full" ? "Shrink the sheet" : "Expand the sheet"} onClick={() => stepStop(stop === "full" ? -1 : 1)} onKeyDown={onHandleKey}>
                <span aria-hidden="true" />
              </button>
            </div>
            <div className="net-sheet-body">
              <SheetView {...sheetProps} inDialog onPrice={(p) => setPrice(p, true)} />
            </div>
          </dialog>
        </>
      ) : null}
    </div>
  );
}

/**
 * The itemised sheet: the figure, the county line (or the note that the county
 * came with the link), the rows, the Estimated net block, the What-if row.
 * Rendered in the flow of the page and again inside the phone's bottom sheet.
 */
function SheetView({
  sheet,
  hasSheet,
  countyFrom,
  whatIf,
  onChangeCounty,
  onPrice,
  inDialog,
  reduced,
}: {
  sheet: Sheet;
  hasSheet: boolean;
  countyFrom: CountyFrom;
  whatIf: ({ price: number; net: number; current?: boolean } | null)[] | null;
  onChangeCounty: () => void;
  onPrice: (p: number) => void;
  inDialog?: boolean;
  reduced: boolean;
}) {
  const negative = hasSheet && sheet.net < 0;
  const net = useTweened(hasSheet ? sheet.net : 0, hasSheet);
  // The rule under the headline draws once per settled figure; a new key restarts it.
  const tick = hasSheet ? `${Math.round(sheet.net * 100)}` : "none";
  const defaulted = countyFrom === "link" || countyFrom === "saved";
  const closingLine = sheet.closing ? `closing ${formatYmd(sheet.closing)}` : "closing date not set";
  const notes = sheet.notes.filter((n) => n !== NEGATIVE_NET_NOTE);

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-hairline pb-6">
        <p className="t-small text-graphite-500">What you&rsquo;d keep</p>
        {negative ? <p className="t-small border-l-2 border-warning bg-warning-fill px-3 py-2 text-body">{NEGATIVE_NET_NOTE}</p> : null}
        <p className="font-display text-[clamp(2.75rem,5vw,4rem)] font-light leading-none text-navy tabular-nums" aria-hidden="true">
          <span className="net-headline">
            {hasSheet ? tweenUsd(net, sheet.net) : "—"}
            {hasSheet && !reduced ? <span key={tick} className="net-headline-rule" aria-hidden="true" /> : null}
          </span>
        </p>
        {!hasSheet ? null : defaulted ? (
          <>
            <p role={inDialog ? undefined : "status"} className="t-small border-l-2 border-warning bg-warning-fill px-3 py-2 text-body">
              {COUNTY_LABEL[sheet.county]} came with the {countyFrom === "link" ? "link" : "saved sheet"}, not from you. Check it: the owner&rsquo;s title policy changes by county.{" "}
              {closingLine.charAt(0).toUpperCase() + closingLine.slice(1)}.
            </p>
            <button type="button" className="link-rule self-start" onClick={onChangeCounty}>
              Change county
            </button>
          </>
        ) : (
          <p className="t-small text-graphite-500">
            {COUNTY_LABEL[sheet.county]} · {closingLine}
          </p>
        )}
        <p className="t-small border-l-2 border-tide pl-3 text-graphite-600">
          This is an estimate, built from Florida&rsquo;s standard rates and fees. Your title company&rsquo;s closing statement has the final numbers.
        </p>
      </div>

      {!hasSheet ? (
        <p className="t-body py-8 text-body">Choose a county and enter a sale price to start. Every line says where its number comes from.</p>
      ) : (
        <>
          <dl className="flex flex-col">
            <Row label="Sale price" amount={sheet.price} sign="" strong />
            {sheet.lines.map((l) => (
              <Row key={l.key} label={l.label} basis={l.basis} amount={l.amount} sign={l.kind === "credit" ? "+" : "−"} muted={Boolean(l.empty)} />
            ))}
          </dl>
          <div className="mt-6 flex flex-col gap-1 border-t-2 border-navy pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="t-h4 text-navy">Estimated net</p>
              <p className="t-record text-navy tabular-nums">{formatUsd(sheet.net)}</p>
            </div>
            <p className="t-mono-sm text-graphite-500">
              price − payoffs {formatUsd(sheet.payoffs)} − costs {formatUsd(sheet.costs)}
              {sheet.credits ? ` + credits ${formatUsd(sheet.credits)}` : ""}
            </p>
            {notes.map((n) => (
              <p key={n} className="t-small border-l-2 border-warning bg-warning-fill px-3 py-2 text-body">
                {n}
              </p>
            ))}
          </div>
          {whatIf ? (
            <div className="mt-6 flex flex-col gap-2 print:hidden">
              <p className="t-small text-graphite-500">What if</p>
              <div className="net-whatif" role="group" aria-label="The net at a different price">
                {whatIf.map((c, i) =>
                  c ? (
                    <button key={c.price} type="button" className={cn("net-whatif-cell", c.current && "is-current")} aria-current={c.current ? "true" : undefined} disabled={c.current} onClick={() => onPrice(c.price)}>
                      <span className="t-mono-sm text-graphite-500">
                        {formatUsd(c.price)} · {c.current ? "this sheet" : i === 0 ? `−${formatUsd(WHAT_IF_STEP)}` : `+${formatUsd(WHAT_IF_STEP)}`}
                      </span>
                      <span className="t-record text-navy">{formatUsd(c.net)}</span>
                    </button>
                  ) : (
                    <div key="none" className="net-whatif-cell is-empty" aria-hidden="true">
                      <span className="t-mono-sm text-graphite-500">—</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : null}
          <p className="t-small mt-6 text-graphite-500">
            This is an estimate, not a closing statement. The title company&rsquo;s figures govern; commissions are negotiated.
          </p>
        </>
      )}
    </>
  );
}

function Row({ label, basis, amount, sign, strong, muted }: { label: string; basis?: string; amount: number; sign: string; strong?: boolean; muted?: boolean }) {
  const shown = useTweened(amount, !muted);
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-hairline py-3", muted && "opacity-70")}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className={cn("t-body", strong ? "text-navy" : "text-body")}>{label}</dt>
        {basis ? <dd className="t-mono-sm text-graphite-500">{basis}</dd> : null}
      </div>
      <dd className={cn("shrink-0 font-mono text-[0.9375rem] tabular-nums", strong ? "text-navy" : muted ? "text-graphite-500" : "text-body")}>
        {muted ? "—" : `${sign}${tweenUsd(shown, amount)}`}
      </dd>
    </div>
  );
}
