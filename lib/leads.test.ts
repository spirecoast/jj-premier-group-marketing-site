import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { channelFromPath } from "../components/utm-tracker";
import { CHANNELS } from "./channels/copy";
import { checkFairHousing } from "./fair-housing";
import { LEAD_CHANNELS, LEAD_FORMS, LEAD_GOAL, REFERRAL_CONSENT_WORDING, REFERRAL_PLANS, leadSchema } from "./leads";
import { REFER, referStrings } from "./refer/copy";
import { allSocialLinks, socialLinks, socialNetwork } from "./site";

const base = { email: "pat@example.com" };

describe("lead forms: referral and review-permission", () => {
  it("both are form kinds with a goal", () => {
    assert.ok(LEAD_FORMS.includes("referral"));
    assert.ok(LEAD_FORMS.includes("review-permission"));
    assert.equal(LEAD_GOAL.referral, "Lead");
    assert.equal(LEAD_GOAL["review-permission"], "Review permission");
  });

  it("a referral needs the referrer's name, the person's first name, a way to reach them and the ticked box", () => {
    const missing = leadSchema.safeParse({ ...base, form: "referral", firstName: "Pat" });
    assert.equal(missing.success, false);
    const errors = !missing.success ? missing.error.flatten().fieldErrors : {};
    assert.ok(errors.referredName);
    assert.ok(errors.referredEmail);
    assert.ok(errors.referralConsent);

    const noReach = leadSchema.safeParse({ ...base, form: "referral", firstName: "Pat", referredName: "Sam", referralConsent: "on" });
    assert.ok(!noReach.success && noReach.error.flatten().fieldErrors.referredEmail);

    const badEmail = leadSchema.safeParse({ ...base, form: "referral", firstName: "Pat", referredName: "Sam", referredEmail: "not-an-email", referralConsent: "on" });
    assert.ok(!badEmail.success && badEmail.error.flatten().fieldErrors.referredEmail);

    const phoneOnly = leadSchema.safeParse({ ...base, form: "referral", firstName: "Pat", referredName: "Sam", referredPhone: "(941) 555-0100", referralConsent: "on" });
    assert.ok(phoneOnly.success);

    const ok = leadSchema.safeParse({
      ...base,
      form: "referral",
      firstName: "Pat",
      lastName: "Example",
      referredName: "Sam",
      referredLastName: "Referred",
      referredEmail: "Sam@Example.com",
      referredPlan: "Moving here",
      referralConsent: "on",
      message: "Moving in spring",
    });
    assert.ok(ok.success);
    assert.equal(ok.success && ok.data.referredName, "Sam");
    assert.equal(ok.success && ok.data.referredPlan, "Moving here");
    assert.equal(ok.success && ok.data.referralConsent, true);

    const junkPlan = leadSchema.safeParse({ ...base, form: "referral", firstName: "Pat", referredName: "Sam", referredPhone: "1", referredPlan: "Renting", referralConsent: "on" });
    assert.ok(junkPlan.success);
    assert.equal(junkPlan.success && junkPlan.data.referredPlan, undefined);
  });

  it("the referral form's labels, the box and the plans pass the Fair Housing check", () => {
    for (const { where, text } of referStrings()) {
      const result = checkFairHousing(text);
      assert.ok(result.passed, `${where}: ${JSON.stringify(result)}`);
    }
    for (const text of [REFERRAL_CONSENT_WORDING, ...REFERRAL_PLANS, ...Object.values(REFER.form)]) {
      assert.ok(checkFairHousing(text).passed, text);
    }
    assert.deepEqual([...REFERRAL_PLANS], ["Buying", "Selling", "Moving here"]);
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
