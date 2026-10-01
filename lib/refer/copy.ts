/**
 * The words on /refer, and the confirmation after the referral form.
 *
 * Plain strings and no imports, so scripts/check-copy.mjs can run the Fair
 * Housing check over every sentence. The person being referred hasn't agreed
 * to anything: the form asks only for their first name, and the copy says we
 * reach out only after the referrer has told them. No gifts or rewards are
 * mentioned (Florida limits paying unlicensed people for referrals; anything
 * like that is cleared with the brokerage first).
 */

export const REFER = {
  title: "Refer someone · Know someone moving here?",
  description:
    "Know someone moving to Lakewood Ranch, Sarasota or Bradenton? Tell us the timing and we’ll take it from there, once you’ve told them we’ll be in touch.",
  eyebrow: "Refer someone",
  heading: "Know someone moving here?",
  lead: "Tell us the timing and we’ll take it from there.",
  body: "Give us your details, their first name and whatever you know: when they’re thinking of moving, where they’re looking, what they’ve asked you about the coast. We won’t contact them on the strength of this form. We’ll write back to you first, and we only reach out once you’ve told them we’ll be in touch.",
  steps: [
    { when: "First", title: "You tell us", body: "Your name and email, their first name, and a note about the timing." },
    { when: "Then", title: "We write back to you", body: "To say thank you, and to ask how they’d like to hear from us." },
    { when: "After that", title: "You tell them", body: "We only reach out once you have, and we go at their pace." },
  ],
  form: {
    name: "Your first name",
    email: "Your email",
    referredName: "Their first name",
    message: "A note about the timing",
    placeholder: "When they’re thinking of moving, where they’re looking, anything they’ve asked you about.",
    submit: "Send",
  },
  privacy: "We don’t ask for their number or email here. That’s theirs to give.",
  success: {
    title: "Thank you.",
    body: "We’ll write back to you first. We only reach out to them once you’ve told them we’ll be in touch.",
  },
  thanks: {
    title: "Thank you.",
    body: "We’ll write back to you first, and we only reach out to them once you’ve told them we’ll be in touch. If the timing changes on their side, tell us and we’ll go at their pace.",
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
