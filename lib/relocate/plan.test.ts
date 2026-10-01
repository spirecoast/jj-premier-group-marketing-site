import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFairHousing } from "../fair-housing";
import { RELOCATE_COPY } from "./copy";
import { planToIcs } from "./ics";
import { HOMESTEAD_AMOUNTS, addDays, buildPlan, daysBetween, defaultAnswers, formatDate, homesteadCycle, inHurricaneSeason, inspectionRunsPastBind, isISODate, type Answers, type Milestone } from "./plan";
import { FACTS, SOURCE_LIST } from "./sources";
import { answersToQuery, parseAnswers } from "./url";

const TODAY = "2026-10-01";

const SAMPLE: Answers = {
  moveInDate: "2027-02-15",
  path: "buying",
  homeToSell: "no",
  fromState: "NY",
  work: "remote",
  county: "manatee",
  financing: "financed",
  closingOffset: 3,
};

const byId = (ms: Milestone[], id: string) => ms.find((m) => m.id === id);
const dateOf = (ms: Milestone[], id: string) => byId(ms, id)?.date;

describe("dates", () => {
  it("validates ISO days, including impossible ones", () => {
    assert.equal(isISODate("2027-02-15"), true);
    assert.equal(isISODate("2027-02-30"), false);
    assert.equal(isISODate("2027-2-5"), false);
    assert.equal(isISODate("2028-02-29"), true);
    assert.equal(isISODate("2027-02-29"), false);
  });

  it("handles leap years", () => {
    assert.equal(addDays("2028-02-28", 1), "2028-02-29");
    assert.equal(addDays("2027-02-28", 1), "2027-03-01");
    assert.equal(addDays("2028-03-01", -7), "2028-02-23");
    assert.equal(daysBetween("2028-01-01", "2029-01-01"), 366);
    assert.equal(daysBetween("2027-01-01", "2028-01-01"), 365);
    const plan = buildPlan({ ...SAMPLE, moveInDate: "2028-03-01", closingOffset: 0 }, TODAY);
    assert.equal(dateOf(plan.milestones, "closing"), "2028-03-01");
    assert.equal(dateOf(plan.milestones, "bind-by"), "2028-02-23");
  });

  it("formats without a timezone shift", () => {
    assert.equal(formatDate("2027-02-15"), "Feb 15, 2027");
    assert.equal(formatDate("2027-02-15", "long"), "February 15, 2027");
  });

  it("knows the season", () => {
    assert.equal(inHurricaneSeason("2027-06-01"), true);
    assert.equal(inHurricaneSeason("2027-11-30"), true);
    assert.equal(inHurricaneSeason("2027-05-31"), false);
    assert.equal(inHurricaneSeason("2027-12-01"), false);
  });
});

describe("the sample plan (financed, Manatee, from New York, move-in 2027-02-15)", () => {
  const plan = buildPlan(SAMPLE, TODAY);
  const ms = plan.milestones;

  it("chains backward from move-in through the contract defaults", () => {
    assert.equal(dateOf(ms, "closing"), "2027-02-12");
    assert.equal(dateOf(ms, "bind-by"), "2027-02-05");
    assert.equal(dateOf(ms, "effective"), "2026-12-29");
    assert.equal(dateOf(ms, "flood-disclosure"), "2026-12-29");
    assert.equal(dateOf(ms, "loan-application"), "2027-01-03");
    assert.equal(dateOf(ms, "inspection"), "2027-01-13");
    assert.equal(dateOf(ms, "flood-elevation"), "2027-01-18");
    assert.equal(dateOf(ms, "loan-approval"), "2027-01-28");
    assert.equal(dateOf(ms, "title-evidence"), "2027-01-28");
    assert.deepEqual(byId(ms, "visit")?.dateRange, { start: "2026-11-17", end: "2026-12-15" });
    assert.equal(dateOf(ms, "preapproval"), "2026-11-03");
  });

  it("chains forward into residency", () => {
    assert.equal(dateOf(ms, "move-in"), "2027-02-15");
    assert.equal(dateOf(ms, "vehicles"), "2027-02-25");
    assert.equal(dateOf(ms, "license"), "2027-03-17");
    assert.equal(byId(ms, "voter")?.date, undefined);
    assert.match(byId(ms, "voter")!.body, /29 days/);
    assert.equal(dateOf(ms, "homestead"), "2028-03-01");
    assert.equal(plan.homestead.exemptionYear, 2028);
    assert.ok(byId(ms, "homestead")?.flags.includes("homesteadNextYear"));
  });

  it("is ordered by phase, then by date, undated last in each phase", () => {
    const order = { before: 0, contract: 1, closing: 2, after: 3 };
    for (let i = 1; i < ms.length; i++) {
      const a = ms[i - 1]!;
      const b = ms[i]!;
      assert.ok(order[a.phase] <= order[b.phase], `${a.id} before ${b.id}`);
      if (a.phase === b.phase && a.date && b.date) assert.ok(a.date <= b.date, `${a.id} (${a.date}) before ${b.id} (${b.date})`);
      if (a.phase === b.phase && !a.date) assert.ok(!b.date, `undated ${a.id} must not precede dated ${b.id}`);
    }
  });

  it("names the prior state and skips portability", () => {
    assert.ok(byId(ms, "prior-state")?.title.includes("New York"));
    assert.equal(byId(ms, "portability"), undefined);
    assert.equal(plan.callouts.find((c) => c.id === "portability"), undefined);
  });

  it("is not in hurricane season", () => {
    assert.equal(plan.callouts.find((c) => c.id === "hurricane"), undefined);
    assert.deepEqual(byId(ms, "closing")?.flags, []);
  });

  it("carries a source or a stated planning rule on every milestone", () => {
    for (const m of ms) {
      assert.ok(m.basis.length > 10, m.id);
      if (!m.source) assert.ok(/ask us|our (planning rule|checklist)|no (florida )?deadline|no date/i.test(m.basis), `${m.id} has no source and no stated rule: ${m.basis}`);
      else assert.ok(m.source.url.startsWith("https://"), m.id);
    }
  });

  it("summarises the answers and the key dates", () => {
    assert.match(plan.summary, /Move-in Feb 15, 2027/);
    assert.match(plan.summary, /from New York/);
    assert.match(plan.summary, /Closing day: Feb 12, 2027/);
    assert.match(plan.summary, /Homestead filing by Mar 1, 2028/);
  });
});

describe("financed vs cash", () => {
  const financed = buildPlan({ ...SAMPLE, financing: "financed" }, TODAY);
  const cash = buildPlan({ ...SAMPLE, financing: "cash" }, TODAY);

  it("financed plans to a 45-day contract with loan dates", () => {
    assert.equal(daysBetween(dateOf(financed.milestones, "effective")!, dateOf(financed.milestones, "closing")!), 45);
    assert.ok(byId(financed.milestones, "loan-application"));
    assert.ok(byId(financed.milestones, "loan-approval"));
    assert.ok(byId(financed.milestones, "preapproval"));
    assert.equal(byId(financed.milestones, "nfip-order"), undefined);
    assert.equal(financed.callouts.find((c) => c.id === "nfip"), undefined);
  });

  it("cash plans to a 30-day contract and orders the flood policy on the effective date", () => {
    const ms = cash.milestones;
    assert.equal(daysBetween(dateOf(ms, "effective")!, dateOf(ms, "closing")!), 30);
    assert.equal(byId(ms, "loan-application"), undefined);
    assert.equal(byId(ms, "loan-approval"), undefined);
    assert.equal(byId(ms, "preapproval"), undefined);
    const nfip = byId(ms, "nfip-order");
    assert.ok(nfip);
    assert.equal(nfip.date, dateOf(ms, "effective"));
    assert.equal(daysBetween(nfip.date!, dateOf(ms, "closing")!), FACTS.nfip.waitDays);
    assert.ok(nfip.flags.includes("nfip30"));
    assert.ok(cash.callouts.find((c) => c.id === "nfip"));
  });

  it("cash title evidence is due 5 days before closing (paragraph 8(a) checked); financed 15", () => {
    assert.equal(daysBetween(dateOf(cash.milestones, "title-evidence")!, dateOf(cash.milestones, "closing")!), 5);
    assert.equal(daysBetween(dateOf(financed.milestones, "title-evidence")!, dateOf(financed.milestones, "closing")!), 15);
    assert.match(byId(cash.milestones, "title-evidence")!.basis, /8\(a\)/);
  });

  it("the cash chain is in order: effective, inspection, bind-by, closing, for every closing offset", () => {
    for (let off = 0; off <= 7; off++) {
      const p = buildPlan({ ...SAMPLE, financing: "cash", closingOffset: off }, TODAY);
      const ms = p.milestones;
      const effective = dateOf(ms, "effective")!;
      const inspection = dateOf(ms, "inspection")!;
      const bind = dateOf(ms, "bind-by")!;
      const closing = dateOf(ms, "closing")!;
      assert.ok(effective < inspection && inspection < bind && bind < closing, `offset ${off}: ${effective} ${inspection} ${bind} ${closing}`);
      assert.ok(dateOf(ms, "nfip-order")! >= effective, `offset ${off}: NFIP order before the contract exists`);
      assert.equal(p.callouts.find((c) => c.id === "tight"), undefined, `offset ${off}`);
    }
  });

  it("the guard catches an inspection that ends after the bind-by date", () => {
    assert.equal(inspectionRunsPastBind("2027-02-06", "2027-02-05"), true);
    assert.equal(inspectionRunsPastBind("2027-02-05", "2027-02-05"), false);
    assert.equal(inspectionRunsPastBind("2027-01-13", "2027-02-05"), false);
  });
});

describe("the homestead year", () => {
  it("a December 15 move-in files by March 1 of the next year", () => {
    const h = homesteadCycle("2026-12-15");
    assert.equal(h.ownAndResideBy, "2027-01-01");
    assert.equal(h.fileBy, "2027-03-01");
    assert.equal(h.exemptionYear, 2027);
  });
  it("a January 15 move-in misses January 1 and waits a year", () => {
    const h = homesteadCycle("2027-01-15");
    assert.equal(h.ownAndResideBy, "2028-01-01");
    assert.equal(h.fileBy, "2028-03-01");
    assert.equal(h.exemptionYear, 2028);
    assert.equal(h.pushedAYear, true);
    assert.equal(h.missedByDays, 14);
  });
  it("a January 1 move-in makes that year", () => {
    const h = homesteadCycle("2027-01-01");
    assert.equal(h.exemptionYear, 2027);
    assert.equal(h.pushedAYear, false);
  });
  it("the two plans differ by a year, and only the near miss gets the flag", () => {
    const dec = buildPlan({ ...SAMPLE, moveInDate: "2026-12-15" }, TODAY);
    const jan = buildPlan({ ...SAMPLE, moveInDate: "2027-01-15" }, TODAY);
    assert.equal(dateOf(dec.milestones, "homestead"), "2027-03-01");
    assert.equal(dateOf(jan.milestones, "homestead"), "2028-03-01");
    assert.match(jan.callouts.find((c) => c.id === "homestead")!.body, /Worth asking the seller/);
    assert.ok(jan.milestones.find((m) => m.id === "homestead")!.flags.includes("homesteadNextYear"));
    assert.ok(!dec.milestones.find((m) => m.id === "homestead")!.flags.includes("homesteadNextYear"));
    assert.doesNotMatch(dec.callouts.find((c) => c.id === "homestead")!.body, /cycle has passed/);
  });

  it("states the exemption the way the Department of Revenue does", () => {
    assert.equal(FACTS.homestead.exemptFirst, 25_000);
    assert.equal(FACTS.homestead.additionalExemption, 25_000);
    assert.deepEqual(FACTS.homestead.additionalBand, { from: 50_000, to: 75_000 });
    assert.match(HOMESTEAD_AMOUNTS, /first \$25,000 of assessed value is exempt from all property taxes, including school taxes/);
    assert.match(HOMESTEAD_AMOUNTS, /up to \$25,000 applies to the assessed value between \$50,000 and \$75,000 and doesn't apply to school taxes/);
    assert.match(HOMESTEAD_AMOUNTS, /inflation since 2025/);
    assert.doesNotMatch(HOMESTEAD_AMOUNTS, /\$50,000 of assessed/);
    const dec = buildPlan({ ...SAMPLE, moveInDate: "2026-12-15" }, TODAY);
    assert.ok(dec.callouts.find((c) => c.id === "homestead")!.body.includes(HOMESTEAD_AMOUNTS));
  });

  it("cites the statute for the reset and the portability cap", () => {
    const fl = buildPlan({ ...SAMPLE, fromState: "FL" }, TODAY);
    assert.equal(fl.callouts.find((c) => c.id === "assessment")!.source.id, "fs-193-155-3");
    assert.equal(fl.callouts.find((c) => c.id === "portability")!.source.id, "fs-193-155-8");
    assert.match(fl.milestones.find((m) => m.id === "portability")!.basis, /193\.155\(8\)/);
  });
});

describe("where you're moving from", () => {
  it("Florida movers get portability, nobody else does", () => {
    const fl = buildPlan({ ...SAMPLE, fromState: "FL" }, TODAY);
    const ny = buildPlan({ ...SAMPLE, fromState: "NY" }, TODAY);
    const other = buildPlan({ ...SAMPLE, fromState: "other" }, TODAY);
    assert.ok(byId(fl.milestones, "portability"));
    assert.ok(fl.callouts.find((c) => c.id === "portability"));
    assert.equal(byId(fl.milestones, "prior-state"), undefined);
    assert.ok(fl.documents.some((d) => /portability/.test(d)));
    assert.equal(byId(ny.milestones, "portability"), undefined);
    assert.equal(byId(other.milestones, "portability"), undefined);
    assert.ok(byId(other.milestones, "prior-state")?.title.includes("where you're coming from"));
  });
});

describe("county", () => {
  it("Sarasota: buyer pays for title", () => {
    const p = buildPlan({ ...SAMPLE, county: "sarasota" }, TODAY);
    assert.equal(p.counties.length, 1);
    assert.match(p.counties[0]!.titleCustom, /buyer customarily pays/);
    assert.match(p.counties[0]!.clerk.url, /sarasotaclerk/);
    assert.match(p.counties[0]!.pao.url, /sarasotapropertyappraiser/);
  });
  it("Manatee: seller pays for title", () => {
    const p = buildPlan({ ...SAMPLE, county: "manatee" }, TODAY);
    assert.equal(p.counties.length, 1);
    assert.match(p.counties[0]!.titleCustom, /seller customarily pays/);
    assert.match(p.counties[0]!.clerk.url, /manateeclerk/);
    assert.match(p.counties[0]!.pao.url, /manateepao/);
  });
  it("both: both notes", () => {
    const p = buildPlan({ ...SAMPLE, county: "both" }, TODAY);
    assert.deepEqual(
      p.counties.map((c) => c.key),
      ["sarasota", "manatee"],
    );
  });
});

describe("hurricane season", () => {
  it("flags a closing in season and adds the weather callouts", () => {
    const p = buildPlan({ ...SAMPLE, moveInDate: "2027-08-15" }, TODAY);
    const closing = byId(p.milestones, "closing")!;
    assert.ok(closing.flags.includes("hurricaneSeason"));
    assert.ok(closing.flags.includes("forceMajeure"));
    assert.ok(byId(p.milestones, "bind-by")!.flags.includes("hurricaneSeason"));
    assert.ok(p.callouts.find((c) => c.id === "hurricane"));
    assert.ok(p.callouts.find((c) => c.id === "forceMajeure"));
  });
  it("flags a bind-by date that falls in season even when closing is after", () => {
    const p = buildPlan({ ...SAMPLE, moveInDate: "2027-12-03", closingOffset: 0 }, TODAY);
    assert.equal(dateOf(p.milestones, "closing"), "2027-12-03");
    assert.equal(dateOf(p.milestones, "bind-by"), "2027-11-26");
    assert.ok(byId(p.milestones, "bind-by")!.flags.includes("hurricaneSeason"));
    assert.ok(p.callouts.find((c) => c.id === "hurricane"));
  });
});

describe("paths", () => {
  it("renting first drops the contract and closing phases", () => {
    const p = buildPlan({ ...SAMPLE, path: "renting-first" }, TODAY);
    assert.ok(p.milestones.every((m) => m.phase !== "contract" && m.phase !== "closing"));
    assert.ok(byId(p.milestones, "homestead-later"));
    assert.equal(byId(p.milestones, "homestead"), undefined);
    assert.ok(p.callouts.find((c) => c.id === "renting"));
  });
  it("undecided draws the buying version and says so", () => {
    const p = buildPlan({ ...SAMPLE, path: "undecided" }, TODAY);
    assert.ok(byId(p.milestones, "closing"));
    assert.ok(p.callouts.find((c) => c.id === "undecided"));
  });
  it("a home to sell adds the listing window; already listed adds the undated line-up", () => {
    const yes = buildPlan({ ...SAMPLE, homeToSell: "yes" }, TODAY);
    const listed = buildPlan({ ...SAMPLE, homeToSell: "listed" }, TODAY);
    assert.deepEqual(byId(yes.milestones, "list-home")?.dateRange, { start: "2026-11-17", end: "2026-12-17" });
    assert.equal(byId(listed.milestones, "listed-home")?.date, undefined);
  });
  it("a commute shows up in the visit", () => {
    const p = buildPlan({ ...SAMPLE, work: "commute", commuteTo: "Downtown Sarasota" }, TODAY);
    assert.match(byId(p.milestones, "visit")!.body, /driving to Downtown Sarasota/);
  });
});

describe("answers in the URL", () => {
  it("round-trips", () => {
    const a: Answers = { ...SAMPLE, work: "commute", commuteTo: "the airport" };
    const q = answersToQuery(a);
    const back = parseAnswers(Object.fromEntries(new URLSearchParams(q)), TODAY);
    assert.deepEqual(back, a);
  });
  it("falls back to defaults on junk", () => {
    const back = parseAnswers({ in: "2027-02-30", path: "flying", from: "zz", off: "99", county: "pinellas" }, TODAY);
    const d = defaultAnswers(TODAY);
    assert.equal(back.moveInDate, d.moveInDate);
    assert.equal(back.path, d.path);
    assert.equal(back.fromState, "other");
    assert.equal(back.closingOffset, 7);
    assert.equal(back.county, "both");
  });
  it("defaults to the first of a month about four months out", () => {
    assert.equal(defaultAnswers("2026-10-01").moveInDate, "2027-02-01");
    assert.equal(defaultAnswers("2026-12-31").moveInDate, "2027-04-01");
  });
});

describe("the calendar file", () => {
  it("draws one single-day event per dated milestone, with the window and the source in the description", () => {
    const plan = buildPlan({ ...SAMPLE, homeToSell: "yes" }, TODAY);
    const ics = planToIcs(plan, { siteName: "Test", domain: "example.com", pageUrl: "https://example.com/relocate", now: new Date("2026-10-01T12:00:00Z") });
    const events = ics.split("BEGIN:VEVENT").slice(1);
    assert.equal(events.length, plan.milestones.filter((m) => m.date).length);
    const visit = events.find((e) => e.includes("SUMMARY:The visit trip"))!;
    assert.match(visit, /DTSTART;VALUE=DATE:20261117/);
    assert.match(visit, /DTEND;VALUE=DATE:20261118/);
    assert.match(visit.replace(/\r\n /g, ""), /Window: Nov 17\\, 2026 to Dec 15\\, 2026/);
    const inspection = events.find((e) => e.includes("SUMMARY:Inspection period ends"))!.replace(/\r\n /g, "");
    assert.match(inspection, /Why this date: 15 days after the effective date/);
    assert.match(inspection, /https:\/\/www\.floridarealtors\.org/);
    assert.ok(!ics.includes("SUMMARY:Register to vote"));
  });
});

describe("fair housing", () => {
  it("every page string passes", () => {
    for (const s of RELOCATE_COPY) {
      const r = checkFairHousing(s);
      assert.ok(r.passed, `${s}\n${JSON.stringify(r)}`);
    }
  });
  it("every generated plan string passes, across the answer space", () => {
    const variants: Partial<Answers>[] = [
      SAMPLE,
      { ...SAMPLE, financing: "cash", fromState: "FL", county: "sarasota", homeToSell: "yes", work: "commute", commuteTo: "Downtown Sarasota" },
      { ...SAMPLE, path: "renting-first", homeToSell: "listed", fromState: "other", county: "both" },
      { ...SAMPLE, path: "undecided", moveInDate: "2027-08-15", closingOffset: 0 },
      { ...SAMPLE, moveInDate: "2027-01-15" },
    ];
    for (const v of variants) {
      const p = buildPlan(v, TODAY);
      const strings = [
        ...p.milestones.flatMap((m) => [m.title, m.body, m.basis, m.link?.label ?? ""]),
        ...p.callouts.flatMap((c) => [c.title, c.body]),
        ...p.documents,
        ...p.counties.flatMap((c) => [c.titleCustom, c.clerk.label, c.pao.label]),
        p.summary,
      ].filter(Boolean);
      for (const s of strings) {
        const r = checkFairHousing(s);
        assert.ok(r.passed, `${s}\n${JSON.stringify(r)}`);
      }
    }
  });
  it("every source is https and dated", () => {
    for (const s of SOURCE_LIST) {
      assert.match(s.url, /^https:\/\//, s.id);
      assert.match(s.checked, /^\d{4}-\d{2}-\d{2}$/, s.id);
      assert.ok(s.label.length > 5, s.id);
    }
  });
});
