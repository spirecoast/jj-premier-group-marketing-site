import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EncoreIndex } from "../encore/index-format";
import { encorePicks } from "./encore";

const ms = (day: string, t = "19:30") => Date.parse(`${day}T${t}:00-04:00`);
const INDEX: EncoreIndex = {
  generated: "2026-10-01T00:00:00Z",
  events: [
    { s: "lwr-a", t: "A", c: "music", v: "v1", vn: "V1", m: "lakewood-ranch" },
    { s: "lwr-b", t: "B", c: "music", v: "v2", vn: "V2", m: "lakewood-ranch", img: "/b.jpg" },
    { s: "sar-a", t: "C", c: "theater", v: "v3", vn: "V3", m: "sarasota", so: 1 },
    { s: "sar-b", t: "D", c: "theater", v: "v4", vn: "V4", m: "sarasota" },
    { s: "sep", t: "E", c: "music", v: "v5", vn: "V5", m: "bradenton" },
    { s: "run", t: "F", c: "gallery", v: "v6", vn: "V6", m: "bradenton", x: 1 },
  ],
  perfs: [
    [0, "2026-10-03", "19:30", ms("2026-10-03"), ms("2026-10-03")],
    [1, "2026-10-03", "20:00", ms("2026-10-03", "20:00"), ms("2026-10-03", "20:00")],
    [1, "2026-10-10", "20:00", ms("2026-10-10", "20:00"), ms("2026-10-10", "20:00")],
    [2, "2026-10-04", "19:30", ms("2026-10-04"), ms("2026-10-04")],
    [3, "2026-10-03", "14:00", ms("2026-10-03", "14:00"), ms("2026-10-03", "14:00")],
    [3, "2026-10-12", "14:00", ms("2026-10-12", "14:00"), ms("2026-10-12", "14:00")],
    [4, "2026-09-28", "19:30", ms("2026-09-28"), ms("2026-09-28")],
    [5, "2026-10-05", "", ms("2026-10-05", "00:00"), ms("2026-10-05", "23:59")],
  ],
  venues: [],
};

describe("out this month", () => {
  it("takes one event per market in the issue month, with a picture first, spread over different days, none sold out", () => {
    const picks = encorePicks(INDEX, "2026-10", 3, "2026-10-02");
    assert.deepEqual(
      picks.map((p) => [p.slug, p.market, p.at.startsAt]),
      [
        ["lwr-b", "lakewood-ranch", new Date(ms("2026-10-03", "20:00")).toISOString()],
        ["sar-b", "sarasota", new Date(ms("2026-10-12", "14:00")).toISOString()],
        ["lwr-a", "lakewood-ranch", new Date(ms("2026-10-03")).toISOString()],
      ],
    );
  });
  it("leaves out what's already past and returns nothing for a month with nothing on", () => {
    assert.deepEqual(encorePicks(INDEX, "2026-10", 3, "2026-10-11").map((p) => p.slug), ["sar-b"]);
    assert.deepEqual(encorePicks(INDEX, "2026-12", 3), []);
  });
});
