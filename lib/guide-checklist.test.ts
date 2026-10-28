import assert from "node:assert/strict";
import { test } from "node:test";
import { checklistIcs, formatDay, parseChecklist, setDone, setDue, summarize, validDay } from "./guide-checklist";

test("validDay accepts real calendar days only", () => {
  assert.equal(validDay("2026-11-04"), "2026-11-04");
  assert.equal(validDay("2028-02-29"), "2028-02-29");
  assert.equal(validDay("2027-02-29"), null);
  assert.equal(validDay("2026-13-01"), null);
  assert.equal(validDay("2026-1-4"), null);
  assert.equal(validDay(""), null);
  assert.equal(validDay(20261104), null);
  assert.equal(validDay("1999-12-31"), null);
});

test("parseChecklist keeps good marks and drops the rest", () => {
  assert.deepEqual(parseChecklist(null), {});
  assert.deepEqual(parseChecklist("nope"), {});
  assert.deepEqual(parseChecklist("[1,2]"), {});
  assert.deepEqual(
    parseChecklist(
      JSON.stringify({
        1: { done: "2026-10-28" },
        2: { due: "2026-11-04", extra: "x" },
        3: { done: "bad", due: "2026-02-30" },
        0: { done: "2026-10-28" },
        21: { done: "2026-10-28" },
        x: { done: "2026-10-28" },
        4: null,
      }),
    ),
    { 1: { done: "2026-10-28" }, 2: { due: "2026-11-04" } },
  );
});

test("setDone and setDue add and take off marks, and an empty step is dropped", () => {
  let list = setDone({}, 3, "2026-10-28");
  assert.deepEqual(list, { 3: { done: "2026-10-28" } });
  list = setDue(list, 3, "2026-11-04");
  assert.deepEqual(list, { 3: { done: "2026-10-28", due: "2026-11-04" } });
  list = setDone(list, 3, null);
  assert.deepEqual(list, { 3: { due: "2026-11-04" } });
  list = setDue(list, 3, "");
  assert.deepEqual(list, {});
  // The input is never changed in place.
  const before = { 1: { due: "2026-11-04" } };
  setDone(before, 1, "2026-10-28");
  assert.deepEqual(before, { 1: { due: "2026-11-04" } });
});

test("summarize counts what's done, finds the next step and sorts the dates", () => {
  const list = { 1: { done: "2026-10-20" }, 2: { due: "2026-12-01" }, 4: { due: "2026-11-10" }, 5: { done: "2026-10-21", due: "2026-10-30" } };
  const s = summarize(list, 10);
  assert.equal(s.done, 2);
  assert.deepEqual(s.next, { step: 2, due: "2026-12-01" });
  assert.deepEqual(s.dated, [
    { step: 4, due: "2026-11-10" },
    { step: 2, due: "2026-12-01" },
  ]);
  assert.equal(s.any, true);
  assert.equal(summarize({}, 8).any, false);
  assert.deepEqual(summarize({}, 8).next, { step: 1 });
  // A step past the guide's length (the guide got shorter) doesn't count.
  assert.equal(summarize({ 12: { done: "2026-10-20" } }, 10).any, false);
});

test("formatDay reads the calendar day, adding the year only when it differs", () => {
  assert.equal(formatDay("2026-11-04", "2026-10-28"), "Wed, Nov 4");
  assert.equal(formatDay("2027-01-15", "2026-10-28"), "Fri, Jan 15, 2027");
});

test("checklistIcs writes one all-day event per dated step not yet done", () => {
  const titles = ["Make your wish list", "Work out your budget", "Get prequalified, with a comma"];
  const ics = checklistIcs({
    guide: "buy",
    list: { 1: { done: "2026-10-20", due: "2026-10-25" }, 3: { due: "2026-11-30" } },
    titles,
    pageUrl: "https://example.com/buy",
    domain: "example.com",
    siteName: "JJ Premier Group",
    now: new Date("2026-10-28T15:00:00Z"),
  });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, 1);
  assert.ok(ics.includes("UID:guide-buy-step-3@example.com"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261130"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20261201"));
  assert.ok(ics.includes("SUMMARY:Step 3: Get prequalified\\, with a comma"));
  assert.ok(ics.includes("URL:https://example.com/buy#step-3"));
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, line);
});
