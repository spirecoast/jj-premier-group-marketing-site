/**
 * Everything the questionnaire pages say around the questions. The questions
 * themselves are the client's record (./questions.ts) and are not edited here.
 * scripts/check-copy.mjs runs these strings through the copy rules, under
 * Node's own TypeScript stripping, so this file imports nothing.
 */

type Respondent = "joelyn" | "jessica";
const RESPONDENT_NAME: Record<Respondent, string> = { joelyn: "Joelyn", jessica: "Jessica" };

const other = (r: Respondent): Respondent => (r === "joelyn" ? "jessica" : "joelyn");

export const Q_COPY = {
  barName: "Website questionnaire",
  eyebrow: "JJ Premier Group · Coldwell Banker Realty",
  heading: (r: Respondent) => `${RESPONDENT_NAME[r]}, the website needs a few facts from you.`,
  lede: "Here’s what the website needs from you. Short answers are fine; we’ll write the prose.",
  how: "Every answer saves as you type, so you can stop and come back to this link any time. Skip anything you don’t know yet, and say “not sure” rather than guess. Nothing here goes on the site until you’ve read the finished wording.",
  ownLink: (r: Respondent) =>
    `${RESPONDENT_NAME[other(r)]} has a link of her own, so answer for yourself. This link is just for you, so please don’t forward it.`,
  sectionsLabel: "Sections",
  partOf: (i: number, n: number) => `Part ${i} of ${n}`,
  promiseSays: "The home page says",
  faqSays: "The answer on the site now",
  promiseLegend: "Keep this promise?",
  promiseNote: "Say it the way you’d say it to a client",
  faqNote: "Is this true for you? What would you actually say?",
  optional: (label: string) => `${label} (optional)`,
  answered: (n: number, total: number) => `${n} of ${total} answered`,
  readBack: "Read back",
  backToForm: "Back to the form",
  readBackTitle: "Your answers so far",
  readBackIntro: "Every question with your answer so far. Switch back to the form to keep going.",
  noAnswer: "No answer yet",
  foot: "Questions about this form go to whoever sent you the link. Thank you.",
  status: {
    saving: "Saving",
    saved: "Saved",
    failed: "Couldn’t save, kept on this device",
    local: "Kept on this device",
  },
  bannerMissing:
    "Your answers are kept on this device until the site’s database is connected. Come back on this same phone or computer, and they’ll be sent the first time you open the link after that.",
  bannerError:
    "The site’s database didn’t answer just now, so your answers are kept on this device for the moment. They’ll be sent with your next change, or the next time you open the link.",
} as const;

export const ADMIN_COPY = {
  eyebrow: "Compiled answers",
  heading: "Website questionnaire: both sets of answers",
  intro:
    "Joelyn’s and Jessica’s answers side by side, in the order the questions were asked. This page shows the latest saved answers each time it’s opened.",
  downloadMd: "Download Markdown",
  downloadCsv: "Download CSV",
  print: "Print",
  missing:
    "The site’s database isn’t connected, so there’s nothing to compile here yet. Until it is, answers stay on the phone or computer each person typed them on. Once DATABASE_URL is set, each person’s answers are sent the next time they open their link.",
  error: "The site’s database didn’t answer just now. Reload this page in a minute.",
  lastUpdated: (when: string) => `Last updated ${when}`,
  nothingYet: "Nothing saved yet",
  differ: "Answers differ",
  onSiteNow: "On the site now",
} as const;

/** For scripts/check-copy.mjs. */
export function questionnaireStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const add = (key: string, text: string) => out.push({ where: `lib/questionnaire/copy.ts: ${key}`, text });
  for (const r of ["joelyn", "jessica"] as const) {
    add(`Q_COPY.heading(${r})`, Q_COPY.heading(r));
    add(`Q_COPY.ownLink(${r})`, Q_COPY.ownLink(r));
  }
  add("Q_COPY.partOf", Q_COPY.partOf(3, 10));
  add("Q_COPY.optional", Q_COPY.optional("Note"));
  add("Q_COPY.answered", Q_COPY.answered(12, 107));
  add("ADMIN_COPY.lastUpdated", ADMIN_COPY.lastUpdated("October 2, 2026"));
  for (const [group, obj] of [["Q_COPY", Q_COPY], ["Q_COPY.status", Q_COPY.status], ["ADMIN_COPY", ADMIN_COPY]] as const) {
    for (const [k, v] of Object.entries(obj)) if (typeof v === "string") add(`${group}.${k}`, v);
  }
  return out;
}
