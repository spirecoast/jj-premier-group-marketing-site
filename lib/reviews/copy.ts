/**
 * The words on /reviews, and the confirmation after the review-permission form.
 *
 * Plain strings and no imports, so scripts/check-copy.mjs can run the Fair
 * Housing check over every sentence. The page shows no reviews and no
 * ratings: nothing from the form appears on the site until a person enters
 * the words by hand, with the permission on file.
 */

export const REVIEWS = {
  title: "Reviews · Tell us how it went",
  description:
    "Bought or sold with Joelyn and Jessica? Tell us how it went: a review on Google, or your own words on this site, with your permission.",
  eyebrow: "Reviews",
  heading: "Bought or sold with us? Tell us how it went.",
  lead: "There are two ways to do it, and both are up to you. We don’t put anything about you on the site without asking first.",
  google: {
    title: "A review on Google",
    body: "It’s the one people read before they call. A few sentences about what we did and how it went is plenty.",
    label: "Write a Google review",
    soon: "Our Google review link is coming soon. Until then, the form on this page reaches us directly.",
  },
  permission: {
    title: "Your words on this site",
    body: "Send us what you’d like to say. If you tick the box, we can use it here with your first name and the place you bought or sold, and nothing else. We’ll check the wording with you before anything goes up, and we’ll take it down whenever you ask.",
  },
  form: {
    message: "The words you’d like to share",
    placeholder: "What we did, how it went, what you’d tell someone about to start.",
    submit: "Send",
  },
  note: "Nothing from this form appears on the site by itself.",
  success: {
    title: "Thank you.",
    body: "Your words are with Joelyn and Jessica. Nothing goes on the site until one of us has checked it with you.",
  },
  thanks: {
    title: "Thank you.",
    body: "Your words are with Joelyn and Jessica. Nothing goes on the site until one of us has checked the wording with you, and you can change your mind any time by telling either of us.",
    line: "In the meantime, Encore has what’s on tonight, this weekend and all season, at every stage, hall and gallery near you.",
  },
} as const;

export function reviewsStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const add = (where: string, text: string) => out.push({ where: `reviews: ${where}`, text });
  add("title", REVIEWS.title);
  add("description", REVIEWS.description);
  add("eyebrow", REVIEWS.eyebrow);
  add("heading", REVIEWS.heading);
  add("lead", REVIEWS.lead);
  for (const [k, v] of Object.entries(REVIEWS.google)) add(`google ${k}`, v);
  for (const [k, v] of Object.entries(REVIEWS.permission)) add(`permission ${k}`, v);
  for (const [k, v] of Object.entries(REVIEWS.form)) add(`form ${k}`, v);
  add("note", REVIEWS.note);
  add("success", `${REVIEWS.success.title} ${REVIEWS.success.body}`);
  add("thanks", `${REVIEWS.thanks.title} ${REVIEWS.thanks.body} ${REVIEWS.thanks.line}`);
  return out;
}
