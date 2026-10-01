import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { channelFromPath } from "../components/utm-tracker";
import { CHANNELS } from "./channels/copy";
import { LEAD_CHANNELS, LEAD_FORMS, LEAD_GOAL, leadSchema } from "./leads";
import { allSocialLinks, socialLinks, socialNetwork } from "./site";

const base = { email: "pat@example.com" };

describe("lead forms: referral and review-permission", () => {
  it("both are form kinds with a goal", () => {
    assert.ok(LEAD_FORMS.includes("referral"));
    assert.ok(LEAD_FORMS.includes("review-permission"));
    assert.equal(LEAD_GOAL.referral, "Lead");
    assert.equal(LEAD_GOAL["review-permission"], "Review permission");
  });

  it("a referral needs the referrer's name and the person's first name", () => {
    const missing = leadSchema.safeParse({ ...base, form: "referral", firstName: "Pat" });
    assert.equal(missing.success, false);
    assert.ok(!missing.success && missing.error.flatten().fieldErrors.referredName);
    const ok = leadSchema.safeParse({ ...base, form: "referral", firstName: "Pat", referredName: "Sam", message: "Moving in spring" });
    assert.ok(ok.success);
    assert.equal(ok.success && ok.data.referredName, "Sam");
  });

  it("a review permission needs the words and the ticked box", () => {
    const noBox = leadSchema.safeParse({ ...base, form: "review-permission", firstName: "Pat", message: "Thank you both." });
    assert.equal(noBox.success, false);
    assert.ok(!noBox.success && noBox.error.flatten().fieldErrors.reviewConsent);
    const noWords = leadSchema.safeParse({ ...base, form: "review-permission", firstName: "Pat", reviewConsent: "on" });
    assert.equal(noWords.success, false);
    const ok = leadSchema.safeParse({ ...base, form: "review-permission", firstName: "Pat", message: "Thank you both.", reviewConsent: "on" });
    assert.ok(ok.success);
    assert.equal(ok.success && ok.data.reviewConsent, true);
  });
});

describe("channel source", () => {
  it("keeps a known channel and drops anything else without an error", () => {
    const yt = leadSchema.safeParse({ ...base, form: "letter", source: "youtube" });
    assert.ok(yt.success && yt.data.source === "youtube");
    const junk = leadSchema.safeParse({ ...base, form: "letter", source: "<script>" });
    assert.ok(junk.success);
    assert.equal(junk.success && junk.data.source, undefined);
  });

  it("reads the channel from a /from/ path only", () => {
    assert.equal(channelFromPath("/from/youtube"), "youtube");
    assert.equal(channelFromPath("/from/nextdoor/"), "nextdoor");
    assert.equal(channelFromPath("/from/tiktok"), null);
    assert.equal(channelFromPath("/from/youtube/extra"), null);
    assert.equal(channelFromPath("/relocate"), null);
  });

  it("every channel has its copy and the right primary action", () => {
    for (const c of LEAD_CHANNELS) assert.equal(CHANNELS[c].slug, c);
    assert.equal(CHANNELS.youtube.cta.href, "/relocate");
    assert.equal(CHANNELS.instagram.cta.href, "/relocate");
    assert.equal(CHANNELS.facebook.cta.href, "/sell/sold");
    assert.equal(CHANNELS.nextdoor.cta.href, "/sell/sold");
  });
});

describe("social links", () => {
  it("ship empty until the client sends the URLs", () => {
    assert.equal(socialLinks.length, 0);
    assert.deepEqual(allSocialLinks([]), []);
  });

  it("name the network from the host and drop duplicates and blanks", () => {
    assert.equal(socialNetwork("https://www.youtube.com/@jjpremier"), "youtube");
    assert.equal(socialNetwork("https://instagram.com/jj"), "instagram");
    assert.equal(socialNetwork("https://g.page/r/abc/review"), "google");
    assert.equal(socialNetwork("https://example.com"), "other");
    assert.equal(socialNetwork("not a url"), "other");
    const merged = allSocialLinks([
      { label: "Instagram", url: "https://instagram.com/jj" },
      { label: "Instagram again", url: "https://instagram.com/jj" },
      { label: "Blank", url: " " },
    ]);
    assert.deepEqual(merged, [{ network: "instagram", label: "Instagram", url: "https://instagram.com/jj" }]);
  });
});
