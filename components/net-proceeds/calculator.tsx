"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LeadForm } from "@/components/lead-form";
import { track } from "@/lib/analytics";
import {
  COUNTY_LABEL,
  ESTOPPEL_CAP,
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
} from "@/lib/net-proceeds";
import { cn } from "@/lib/utils";

type TitleChoice = "custom" | "seller" | "buyer";

type Form = {
  price: string;
  county: County;
  closingDate: string;
  title: TitleChoice;
  mortgage: string;
  second: string;
  listingPct: string;
  buyerPct: string;
  annualTax: string;
  hasAssociation: boolean;
  dues: string;
  duesPeriod: DuesPeriod;
  estoppel: string;
  settlement: string;
  recording: string;
  recordingTouched: boolean;
  repairs: string;
  staging: string;
};

const EMPTY: Form = {
  price: "",
  county: "sarasota",
  closingDate: "",
  title: "custom",
  mortgage: "",
  second: "",
  listingPct: "",
  buyerPct: "",
  annualTax: "",
  hasAssociation: false,
  dues: "",
  duesPeriod: "year",
  estoppel: String(ESTOPPEL_CAP),
  settlement: "",
  recording: "",
  recordingTouched: false,
  repairs: "",
  staging: "",
};

/** "650,000" or "$650000.50" to a number; undefined when blank or not a number. */
function toNum(s: string): number | undefined {
  const cleaned = s.replace(/[$,\s]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/** The two-page release the seller records for each loan paid off (FR/BAR 9(a): fees needed to cure title). */
const RELEASE_PAGES = 2;

function Field({
  id,
  label,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("field", className)}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="t-mono-sm text-graphite-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Money({ id, value, onChange, placeholder = "0", described }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; /** True when the enclosing Field renders a hint. */ described?: boolean }) {
  return (
    <input
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
    <legend className="t-eyebrow mb-5 text-amber">
      {number} · {children}
    </legend>
  );
}

/**
 * The seller net sheet: inputs stacked on the left, the itemized sheet on the
 * right (sticky on desktop). All math lives in lib/net-proceeds.ts; this file
 * only turns strings into numbers and draws the result.
 */
export function NetProceedsCalculator() {
  const [f, setF] = useState<Form>(EMPTY);
  const [copied, setCopied] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sentSummary, setSentSummary] = useState("");
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const mortgage = toNum(f.mortgage);
  const second = toNum(f.second);
  const releases = (mortgage && mortgage > 0 ? 1 : 0) + (second && second > 0 ? 1 : 0);
  const recordingDefault = releases ? recordingFee(RELEASE_PAGES) * releases : 0;
  const recordingValue = f.recordingTouched ? f.recording : recordingDefault ? String(recordingDefault) : "";

  const price = toNum(f.price);
  const hasSheet = typeof price === "number" && price > 0;

  const sheet = useMemo(
    () =>
      computeSheet({
        price: price ?? 0,
        county: f.county,
        closingDate: f.closingDate || undefined,
        sellerPaysOwnerPolicy: f.title === "custom" ? undefined : f.title === "seller",
        mortgagePayoff: mortgage,
        secondLienPayoff: second,
        listingCommissionPct: toNum(f.listingPct),
        buyerBrokerPct: toNum(f.buyerPct),
        annualTax: toNum(f.annualTax),
        hasAssociation: f.hasAssociation,
        duesAmount: toNum(f.dues),
        duesPeriod: f.duesPeriod,
        estoppelFee: toNum(f.estoppel),
        settlementFee: toNum(f.settlement),
        recordingFee: toNum(recordingValue),
        repairsConcessions: toNum(f.repairs),
        stagingPhotos: toNum(f.staging),
      }),
    [f, price, mortgage, second, recordingValue],
  );
  const summary = useMemo(() => (hasSheet ? summaryText(sheet) : ""), [hasSheet, sheet]);

  // One "Explore" event the first time a sheet is produced, not on every keystroke.
  const tracked = useRef(false);
  useEffect(() => {
    if (hasSheet && !tracked.current) {
      tracked.current = true;
      track("Explore", { action: "net-proceeds" });
    }
  }, [hasSheet]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      window.prompt("Copy this summary", summary);
    }
  }

  function openSend() {
    setSentSummary(summary);
    setSendOpen(true);
  }

  const customSeller = defaultSellerPaysOwnerPolicy(f.county);

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-16">
      {/* Inputs */}
      <form className="flex flex-col gap-12 print:hidden" onSubmit={(e) => e.preventDefault()} aria-label="Net proceeds inputs">
        <fieldset className="flex flex-col gap-6">
          <Legend number="01">The sale</Legend>
          <Field id={id("price")} label="Sale price">
            <Money id={id("price")} value={f.price} onChange={(v) => set("price", v)} placeholder="650,000" />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id={id("county")} label="County" hint="The two counties this sheet is built for; Miami-Dade's stamp rate differs.">
              <select id={id("county")} value={f.county} onChange={(e) => set("county", e.target.value as County)} className="field-input" aria-describedby={`${id("county")}-hint`}>
                <option value="sarasota">{COUNTY_LABEL.sarasota}</option>
                <option value="manatee">{COUNTY_LABEL.manatee}</option>
              </select>
            </Field>
            <Field id={id("closing")} label="Closing date" hint="Prorations run through the day before this date.">
              <input id={id("closing")} type="date" value={f.closingDate} onChange={(e) => set("closingDate", e.target.value)} className="field-input" aria-describedby={`${id("closing")}-hint`} />
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
          <Field id={id("tax")} label="This year's property tax bill" hint={`Enter the bill at the ${NOVEMBER_DISCOUNT_PCT}% November discount; use last year's if this year's isn't out yet. Taxes are paid in arrears, so you credit the buyer for January 1 through the day before closing. Include CDD assessments; they're on the same bill.`}>
            <Money id={id("tax")} value={f.annualTax} onChange={(v) => set("annualTax", v)} described />
          </Field>
          <label className="flex cursor-pointer items-start gap-3 t-body text-body">
            <input type="checkbox" checked={f.hasAssociation} onChange={(e) => set("hasAssociation", e.target.checked)} className="mt-1.5 size-4 shrink-0 accent-sky-700" />
            <span>The home is in an HOA or condominium association</span>
          </label>
          {f.hasAssociation ? (
            <div className="grid gap-6 border-l border-hairline pl-5 sm:grid-cols-2">
              <Field id={id("dues")} label="Dues, per period" hint="Dues are billed ahead. If the current period is paid, the unused days come back to you at closing.">
                <Money id={id("dues")} value={f.dues} onChange={(v) => set("dues", v)} described />
              </Field>
              <Field id={id("duesPeriod")} label="Billed">
                <select id={id("duesPeriod")} value={f.duesPeriod} onChange={(e) => set("duesPeriod", e.target.value as DuesPeriod)} className="field-input">
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
          <Field id={id("title")} label="Owner's title policy" hint={`By custom the ${customSeller ? "seller" : "buyer"} pays in ${COUNTY_LABEL[f.county]}. The contract's paragraph 9(c) can say otherwise.`}>
            <select id={id("title")} value={f.title} onChange={(e) => set("title", e.target.value as TitleChoice)} className="field-input" aria-describedby={`${id("title")}-hint`}>
              <option value="custom">Follow the {COUNTY_LABEL[f.county]} custom</option>
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
          </div>
        </fieldset>
      </form>

      {/* The sheet */}
      <div className="flex flex-col gap-6 lg:sticky lg:top-header lg:self-start">
        <section id="net-sheet" aria-label="Estimated net proceeds" className="border border-hairline bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-2 border-b border-hairline pb-5">
            <p className="t-eyebrow text-amber">Estimated net proceeds</p>
            <p className="t-mono-sm text-graphite-500">
              {COUNTY_LABEL[sheet.county]}
              {sheet.closing ? ` · closing ${formatYmd(sheet.closing)}` : " · closing date not set"}
            </p>
          </div>

          {!hasSheet ? (
            <p className="t-body py-8 text-body">Enter a sale price and the sheet fills in from there. Every line says where its number comes from.</p>
          ) : (
            <>
              <dl className="flex flex-col">
                <Row label="Sale price" amount={sheet.price} sign="" strong />
                {sheet.lines.map((l) => (
                  <Row key={l.key} label={l.label} basis={l.basis} amount={l.amount} sign={l.kind === "credit" ? "+" : "−"} muted={Boolean(l.empty)} />
                ))}
              </dl>
              <div className="mt-6 flex flex-col gap-1 border-t-2 border-navy pt-5" aria-live="polite">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="t-eyebrow text-navy">Estimated net</p>
                  <p className="t-record text-navy tabular-nums">{formatUsd(sheet.net)}</p>
                </div>
                <p className="t-mono-sm text-graphite-500">
                  price − payoffs {formatUsd(sheet.payoffs)} − costs {formatUsd(sheet.costs)}
                  {sheet.credits ? ` + credits ${formatUsd(sheet.credits)}` : ""}
                </p>
                {sheet.notes.map((n) => (
                  <p key={n} className="t-small text-amber">
                    {n}
                  </p>
                ))}
              </div>
              <p className="t-small mt-6 text-graphite-500">
                An estimate, not a closing statement. The title company&rsquo;s figures govern; commissions are negotiated.
              </p>
            </>
          )}
        </section>

        {hasSheet ? (
          <div className="flex flex-col gap-5 print:hidden">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <button type="button" onClick={copy} className="link-rule" aria-live="polite">
                {copied ? "Copied" : "Copy a summary"}
              </button>
              <button type="button" onClick={() => window.print()} className="link-rule">
                Print
              </button>
              <button type="button" onClick={openSend} className="link-rule" aria-expanded={sendOpen} aria-controls={id("send")}>
                Send me this sheet
              </button>
            </div>
            {sendOpen ? (
              <div id={id("send")} className="flex flex-col gap-4 border border-hairline bg-white p-6 sm:p-8">
                <div className="flex flex-col gap-2">
                  <p className="t-eyebrow text-amber">Send me this sheet</p>
                  <p className="t-body text-body">
                    The sheet goes in the message as it stands. We&rsquo;ll read it against the comps and tell you which lines we&rsquo;d change.
                  </p>
                  {sentSummary !== summary ? (
                    <button type="button" onClick={() => setSentSummary(summary)} className="link-rule self-start">
                      Use the current numbers
                    </button>
                  ) : null}
                </div>
                <LeadForm
                  key={sentSummary}
                  form="sell"
                  fields={["name", "email", "phone", "message"]}
                  submitLabel="Send me this sheet"
                  defaultMessage={sentSummary}
                  hidden={{ pageTitle: "Net proceeds sheet" }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, basis, amount, sign, strong, muted }: { label: string; basis?: string; amount: number; sign: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-hairline py-3", muted && "opacity-70")}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className={cn("t-body", strong ? "text-navy" : "text-body")}>{label}</dt>
        {basis ? <dd className="t-mono-sm text-graphite-500">{basis}</dd> : null}
      </div>
      <dd className={cn("shrink-0 font-mono text-[0.9375rem] tabular-nums", strong ? "text-navy" : muted ? "text-graphite-500" : "text-body")}>
        {muted ? "—" : `${sign}${formatUsd(amount)}`}
      </dd>
    </div>
  );
}

