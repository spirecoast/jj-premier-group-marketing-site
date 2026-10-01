import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { checkFairHousing } from "./fair-housing";
import {
  CHECKED,
  ESTOPPEL_CAP,
  SOURCES,
  computeSheet,
  dayOfYear,
  daysInYear,
  defaultSellerPaysOwnerPolicy,
  docStamps,
  formatUsd,
  ownerPolicyPremium,
  parseYmd,
  prorateAdvanceDues,
  prorateTaxes,
  recordingFee,
  summaryText,
} from "./net-proceeds";

describe("doc stamps: $0.70 per $100 or portion thereof", () => {
  test("even hundreds", () => {
    assert.equal(docStamps(650_000), 4550);
    assert.equal(docStamps(1_000_000), 7000);
  });
  test("a fraction of $100 counts as a full $100", () => {
    assert.equal(docStamps(650_050), 4550.7);
    assert.equal(docStamps(101), 1.4);
    assert.equal(docStamps(99), 0.7);
    assert.equal(docStamps(100), 0.7);
  });
  test("zero, negative and NaN are zero", () => {
    assert.equal(docStamps(0), 0);
    assert.equal(docStamps(-5), 0);
    assert.equal(docStamps(Number.NaN), 0);
  });
});

describe("owner's policy at the promulgated rate (Rule 69O-186.003)", () => {
  test("first tier: $5.75 per $1,000 to $100,000", () => {
    assert.equal(ownerPolicyPremium(100_000), 575);
    assert.equal(ownerPolicyPremium(50_000), 287.5);
  });
  test("second tier: add $5.00 per $1,000 to $1,000,000", () => {
    assert.equal(ownerPolicyPremium(250_000), 1325);
    assert.equal(ownerPolicyPremium(1_000_000), 5075);
  });
  test("any fraction of $100 counts as a full $100 before the per-$1,000 rate", () => {
    assert.equal(ownerPolicyPremium(487_350), 2512);
    assert.equal(ownerPolicyPremium(487_301), 2512);
    assert.equal(ownerPolicyPremium(487_300), 2511.5);
  });
  test("upper tiers: $2.50, $2.25, $2.00", () => {
    assert.equal(ownerPolicyPremium(2_000_000), 7575);
    assert.equal(ownerPolicyPremium(5_000_000), 15_075);
    assert.equal(ownerPolicyPremium(10_000_000), 26_325);
    assert.equal(ownerPolicyPremium(12_000_000), 30_325);
  });
  test("minimum premium is $100; nothing on zero", () => {
    assert.equal(ownerPolicyPremium(10_000), 100);
    assert.equal(ownerPolicyPremium(0), 0);
  });
});

describe("county custom for the owner's policy", () => {
  test("Manatee: seller pays by custom", () => {
    assert.equal(defaultSellerPaysOwnerPolicy("manatee"), true);
    const s = computeSheet({ price: 1_000_000, county: "manatee" });
    const line = s.lines.find((l) => l.key === "ownerPolicy");
    assert.equal(line?.amount, 5075);
    assert.match(line?.basis ?? "", /Manatee County custom, seller pays/);
  });
  test("Sarasota: buyer pays by custom, so the seller's line is empty", () => {
    assert.equal(defaultSellerPaysOwnerPolicy("sarasota"), false);
    const s = computeSheet({ price: 1_000_000, county: "sarasota" });
    const line = s.lines.find((l) => l.key === "ownerPolicy");
    assert.equal(line?.amount, 0);
    assert.equal(line?.empty, true);
    assert.match(line?.basis ?? "", /buyer pays/);
  });
  test("the contract can override either custom", () => {
    const s = computeSheet({ price: 1_000_000, county: "sarasota", sellerPaysOwnerPolicy: true });
    const line = s.lines.find((l) => l.key === "ownerPolicy");
    assert.equal(line?.amount, 5075);
    assert.match(line?.basis ?? "", /contract overrides the Sarasota County custom/);
    const m = computeSheet({ price: 1_000_000, county: "manatee", sellerPaysOwnerPolicy: false });
    assert.equal(m.lines.find((l) => l.key === "ownerPolicy")?.amount, 0);
  });
});

describe("prorations through the day before closing (Standard K)", () => {
  test("calendar helpers", () => {
    assert.equal(daysInYear(2024), 366);
    assert.equal(daysInYear(2025), 365);
    assert.equal(daysInYear(2100), 365);
    assert.equal(daysInYear(2000), 366);
    assert.equal(dayOfYear({ y: 2024, m: 3, d: 1 }), 61);
    assert.equal(dayOfYear({ y: 2025, m: 3, d: 1 }), 60);
    assert.equal(parseYmd("2024-02-30"), undefined);
    assert.equal(parseYmd("nonsense"), undefined);
    assert.deepEqual(parseYmd("2024-02-29"), { y: 2024, m: 2, d: 29 });
  });
  test("taxes on a leap year: March 1 is 60 seller days of 366", () => {
    const p = prorateTaxes(3660, { y: 2024, m: 3, d: 1 });
    assert.equal(p.sellerDays, 60);
    assert.equal(p.periodDays, 366);
    assert.equal(p.amount, 600);
  });
  test("taxes on a common year: March 1 is 59 seller days of 365", () => {
    const p = prorateTaxes(3650, { y: 2025, m: 3, d: 1 });
    assert.equal(p.sellerDays, 59);
    assert.equal(p.periodDays, 365);
    assert.equal(p.amount, 590);
  });
  test("closing on January 1 owes nothing; December 31 owes all but one day", () => {
    assert.equal(prorateTaxes(3650, { y: 2025, m: 1, d: 1 }).amount, 0);
    assert.equal(prorateTaxes(3650, { y: 2025, m: 12, d: 31 }).sellerDays, 364);
  });
  test("prepaid dues come back for closing day through the end of the period", () => {
    const year = prorateAdvanceDues(3660, "year", { y: 2024, m: 3, d: 1 });
    assert.deepEqual(year, { amount: 3060, remainingDays: 306, periodDays: 366, periodLabel: "calendar year 2024" });
    const quarter = prorateAdvanceDues(910, "quarter", { y: 2024, m: 3, d: 1 });
    assert.deepEqual(quarter, { amount: 310, remainingDays: 31, periodDays: 91, periodLabel: "Q1 2024" });
    const month = prorateAdvanceDues(290, "month", { y: 2024, m: 2, d: 15 });
    assert.deepEqual(month, { amount: 150, remainingDays: 15, periodDays: 29, periodLabel: "2024-02" });
  });
});

describe("recording allowance at the clerks' rates", () => {
  test("$10 first page, $8.50 each additional", () => {
    assert.equal(recordingFee(1), 10);
    assert.equal(recordingFee(2), 18.5);
    assert.equal(recordingFee(0), 0);
  });
});

describe("the sheet", () => {
  test("zero and blank inputs give a zero sheet with no NaN", () => {
    const s = computeSheet({ price: 0, county: "sarasota" });
    assert.equal(s.net, 0);
    assert.equal(s.costs, 0);
    assert.equal(s.credits, 0);
    for (const l of s.lines) assert.ok(Number.isFinite(l.amount), l.key);
    const blank = computeSheet({ price: Number.NaN, county: "manatee", mortgagePayoff: Number.NaN, listingCommissionPct: Number.NaN, annualTax: -1 });
    assert.equal(blank.net, 0);
    assert.ok(blank.lines.every((l) => Number.isFinite(l.amount)));
  });
  test("a negative net says what it means", () => {
    const s = computeSheet({ price: 300_000, county: "manatee", mortgagePayoff: 310_000 });
    assert.ok(s.net < 0);
    assert.ok(s.notes.some((n) => /bring the difference to closing/.test(n)));
    assert.match(summaryText(s), /bring the difference to closing/);
  });
  test("a hand-typed percent is kept to three decimals, in the math and the basis", () => {
    const s = computeSheet({ price: 100_000, county: "manatee", listingCommissionPct: 2.12345 });
    const line = s.lines.find((l) => l.key === "listingCommission");
    assert.equal(line?.amount, 2123);
    assert.match(line?.basis ?? "", /^2\.123% of price/);
  });
  test("commissions are blank until entered", () => {
    const s = computeSheet({ price: 650_000, county: "manatee" });
    assert.equal(s.lines.find((l) => l.key === "listingCommission")?.empty, true);
    assert.equal(s.lines.find((l) => l.key === "buyerBroker")?.empty, true);
    const t = computeSheet({ price: 650_000, county: "manatee", listingCommissionPct: 2.5, buyerBrokerPct: 2 });
    assert.equal(t.lines.find((l) => l.key === "listingCommission")?.amount, 16_250);
    assert.equal(t.lines.find((l) => l.key === "buyerBroker")?.amount, 13_000);
  });
  test("prorations wait for a closing date and say so", () => {
    const s = computeSheet({ price: 650_000, county: "manatee", annualTax: 7300, hasAssociation: true, duesAmount: 1200 });
    assert.ok(s.notes.some((n) => /closing date/.test(n)));
    assert.equal(s.lines.find((l) => l.key === "taxProration"), undefined);
  });
  test("a full Manatee sheet adds up", () => {
    const s = computeSheet({
      price: 650_000,
      county: "manatee",
      closingDate: "2026-07-01",
      mortgagePayoff: 300_000,
      listingCommissionPct: 2.5,
      buyerBrokerPct: 2.5,
      annualTax: 7300,
      hasAssociation: true,
      duesAmount: 1200,
      duesPeriod: "year",
      estoppelFee: ESTOPPEL_CAP,
    });
    const by = Object.fromEntries(s.lines.map((l) => [l.key, l.amount]));
    assert.equal(by.docStamps, 4550);
    assert.equal(by.ownerPolicy, 3325);
    assert.equal(by.taxProration, 3620); // 181 of 365 days
    assert.equal(by.estoppel, 299);
    assert.equal(by.duesCredit, 604.93); // 184 of 365 days
    assert.equal(s.payoffs, 300_000);
    assert.equal(s.costs, 44_294);
    assert.equal(s.credits, 604.93);
    assert.equal(s.net, 306_310.93);
    assert.match(s.lines.find((l) => l.key === "taxProration")?.basis ?? "", /prorated 181 of 365 days/);
  });
  test("the estoppel line flags a fee above the cap", () => {
    const s = computeSheet({ price: 500_000, county: "sarasota", hasAssociation: true, estoppelFee: 418 });
    assert.match(s.lines.find((l) => l.key === "estoppel")?.basis ?? "", /above the \$299 DBPR cap/);
  });
  test("the summary carries every line, the net and the caveat", () => {
    const s = computeSheet({ price: 650_000, county: "sarasota", closingDate: "2026-07-01", mortgagePayoff: 300_000, annualTax: 7300 });
    const text = summaryText(s);
    assert.match(text, /Sarasota County · closing 2026-07-01/);
    assert.match(text, /- Documentary stamps on the deed  \$4,550/);
    assert.match(text, /= Estimated net  \$341,830/);
    assert.match(text, /not a closing statement/);
    assert.match(text, new RegExp(CHECKED));
  });
  test("currency formatting", () => {
    assert.equal(formatUsd(4550), "$4,550");
    assert.equal(formatUsd(4550.7), "$4,550.70");
    assert.equal(formatUsd(-12.5), "-$12.50");
  });
});

describe("Fair Housing", () => {
  test("every string the module can put on the page passes", () => {
    const strings: string[] = [];
    for (const s of Object.values(SOURCES)) strings.push(s.title, s.publisher, s.figure);
    const full = computeSheet({
      price: 650_000,
      county: "manatee",
      closingDate: "2026-07-01",
      mortgagePayoff: 300_000,
      secondLienPayoff: 10_000,
      listingCommissionPct: 2.5,
      buyerBrokerPct: 2.5,
      annualTax: 7300,
      hasAssociation: true,
      duesAmount: 1200,
      estoppelFee: 400,
      settlementFee: 500,
      recordingFee: 18.5,
      repairsConcessions: 1000,
      stagingPhotos: 800,
    });
    const sparse = computeSheet({ price: 650_000, county: "sarasota", sellerPaysOwnerPolicy: true, annualTax: 100, hasAssociation: true, duesAmount: 10 });
    for (const sheet of [full, sparse]) {
      for (const l of sheet.lines) strings.push(l.label, l.basis);
      strings.push(...sheet.notes, summaryText(sheet));
    }
    for (const s of strings) {
      const r = checkFairHousing(s);
      assert.equal(r.passed, true, `flagged: ${s} ${JSON.stringify(r)}`);
    }
  });
});
