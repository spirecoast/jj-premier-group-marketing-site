/**
 * The words on /refer, and the confirmation after the referral form.
 *
 * Plain strings and no imports, so scripts/check-copy.mjs can run the Fair
 * Housing check over every sentence. The form is two groups: about you (the
 * referrer) and about them (the person moving: name, email or phone, what
 * they are planning, a note), and a required box confirming they know their
 * details are being passed along (REFERRAL_CONSENT_WORDING and REFERRAL_PLANS
 * in lib/leads.ts, checked by the same script). No gifts or rewards are mentioned (Florida
 * limits paying unlicensed people for referrals; anything like that is
 * cleared with the brokerage first).
 */

export const REFER = {
  title: "Refer someone · Know someone moving here?",
  description:
    "If you know someone moving to Lakewood Ranch, Sarasota or Bradenton, let them know you’re passing their details along, then tell us the timing and we’ll take it from there.",
  eyebrow: "Refer someone",
  heading: "Know someone moving here?",
  lead: "Tell us the timing and we’ll take it from there.",
  body: "Give us your details and theirs, and tell us whatever you know about the move: when they’re thinking of going, where they’re looking and what they’ve asked you about the coast. Tell them first that you’re passing their details along. We’ll write back to you, and we’ll reach out to them at their pace.",
  steps: [
    { when: "First", title: "You tell them", body: "Tell them you’re passing their details to us and that we’ll be in touch." },
    { when: "Then", title: "You tell us", body: "Give us your name and email, their name and a way to reach them, and a note about the timing." },
    { when: "After that", title: "We take it from there", body: "We write back to you to say thank you, and we reach out to them at their pace." },
  ],
  form: {
    aboutYou: "About you",
    name: "Your first name",
    lastName: "Your last name",
    email: "Your email",
    phone: "Your phone",
    aboutThem: "About them",
    referredName: "Their first name",
    referredLastName: "Their last name",
    referredEmail: "Their email",
    referredPhone: "Their phone",
    reach: "Their email or their phone is enough. You don’t need both.",
    referredPlan: "What they’re planning",
    planPrompt: "Choose one",
    message: "A note about the timing",
    placeholder: "Tell us when they’re thinking of moving, where they’re looking and anything they’ve asked you about.",
    submit: "Send",
  },
  privacy: "We hold their details the same way we hold yours, and we only use them to get in touch about the move.",
  success: {
    title: "Thank you.",
    body: "We’ll write back to you first, and we’ll reach out to them at their pace.",
  },
  thanks: {
    title: "Thank you.",
    body: "We’ll write back to you first, and we’ll reach out to them at their pace. If the timing changes on their side, tell us and we’ll follow it.",
    line: "If they’re still deciding where, Atlas has every place we work on one map, with the facts behind each one. It’s worth sending them the link.",
  },
} as const;

export function referStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const add = (where: string, text: string) => out.push({ where: `refer: ${where}`, text });
  add("title", REFER.title);
  add("description", REFER.description);
  add("eyebrow", REFER.eyebrow);
  add("heading", REFER.heading);
  add("lead", REFER.lead);
  add("body", REFER.body);
  REFER.steps.forEach((s, i) => add(`step ${i + 1}`, `${s.when}. ${s.title}. ${s.body}`));
  for (const [k, v] of Object.entries(REFER.form)) add(`form ${k}`, v);
  add("privacy", REFER.privacy);
  add("success", `${REFER.success.title} ${REFER.success.body}`);
  add("thanks", `${REFER.thanks.title} ${REFER.thanks.body} ${REFER.thanks.line}`);
  return out;
}
