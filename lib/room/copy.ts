/**
 * Everything the client room and the team's room console say. The client's
 * own page (/room/<token>) is read by the client, so it's written to them;
 * the console (/q/<team token>/rooms) is written to Joelyn and Jessica.
 * scripts/check-copy.mjs runs these strings through the copy rules under
 * Node's own TypeScript stripping, so this file imports nothing.
 */

type RoomKind = "buying" | "selling" | "both";
type GuideKey = "buy" | "sell";

export const ROOM_COPY = {
  /** The browser tab and the bar. The name stays out of both. */
  title: "Your room",
  bar: "JJ Premier Group",
  privateMark: "Private to this link",
  print: "Print",
  greeting: (name: string) => `Hi ${name}.`,
  lede: "Everything we've talked about, in one place: the neighborhoods we're looking at, your plan and our notes. We update it as we go. Only someone with this link can open it, so keep it to yourself.",
  where: "Where you are",
  stepOf: (n: number, total: number, guide: GuideKey) => `Step ${n} of ${total} in the ${GUIDE_NAME[guide]}`,
  readStep: "Read about this step",
  places: "Neighborhoods we're looking at",
  placesEmpty: "We haven't added neighborhoods yet. They'll show up here as we look together.",
  openAtlas: "Open in Atlas",
  plan: "Your plan",
  movePlan: "Your move plan",
  moveLine: (date: string, county: string) => `Move-in ${date} · ${county}`,
  visitPlan: "Your visit",
  visitLine: (from: string, to: string) => (from === to ? from : `${from} to ${to}`),
  openPlan: "Open the plan",
  openVisit: "Open the visit plan",
  addToCalendar: "Add to calendar",
  planEmpty: "No plan yet. When we build one together, it'll be here.",
  notes: "Notes from Joelyn and Jessica",
  notesEmpty: "Nothing yet. Our notes from each conversation will go here.",
  updated: (when: string) => `Updated ${when}`,
  contact: "Call or text us with anything on your mind.",
  notFoundTitle: "There's nothing at this address.",
  notFoundBody: "If someone sent you this link, ask them for a new one.",
} as const;

export const GUIDE_NAME: Record<GuideKey, string> = { buy: "buyer's guide", sell: "seller's guide" };

export const COUNTY_NAME: Record<string, string> = { sarasota: "Sarasota County", manatee: "Manatee County", both: "either county" };

export const KIND_LABEL: Record<RoomKind, string> = { buying: "Buying", selling: "Selling", both: "Buying and selling" };

export const TEAM_COPY = {
  heading: "Client rooms",
  intro:
    "A private page for one client: the neighborhoods you've picked together, their plan and your notes, at a link only they have. There's no sign-in. We don't keep a copy of the link, so if it's lost, make a new one from their room.",
  missing: "The database isn't connected, so rooms can't be made yet.",
  error: "The database didn't answer. Try again in a moment.",
  invalid: "Something in the form wasn't right. Check it and try again.",
  newHeading: "New room",
  nameLabel: "Their first name",
  nameHint: "Just a first name. It's on their page and in this list; nothing else about them is stored.",
  kindLabel: "They're",
  create: "Make the room",
  making: "Making the room",
  made: (name: string) => `${name}'s room is ready.`,
  linkOnce: "Copy the link now. It won't be shown again; you can make a new one from the room at any time.",
  copy: "Copy link",
  copied: "Copied",
  listHeading: "Rooms",
  listEmpty: "No rooms yet.",
  open: "Open",
  closedMark: "Closed",
  updatedAgo: (when: string) => `updated ${when}`,
  back: "All rooms",
  roomOf: (name: string) => `${name}'s room`,
  about: "About",
  stepLabel: "Where they are",
  stepNone: "Not started",
  stepOption: (n: number, title: string, guide: GuideKey) => `${n}. ${title} (${GUIDE_NAME[guide]})`,
  placesHeading: "Neighborhoods",
  placesHint: "Search Atlas and add the ones you've looked at together. They'll see each one with a link to its page.",
  searchLabel: "Add a neighborhood",
  searchPlaceholder: "Type a name",
  noMatches: "Nothing matches.",
  add: "Add",
  remove: "Remove",
  placesFull: (max: number) => `That's ${max}, the most a room holds.`,
  indexFailed: "Atlas didn't load. The rest still saves.",
  plansHeading: "Plans",
  moveLabel: "Move plan",
  moveHint: "Build it with them on Atlas Move, then paste that page's address here.",
  visitLabel: "Visit plan",
  visitHint: "From the Encore Planner, the same way.",
  badMove: "That isn't an Atlas Move link.",
  badVisit: "That isn't an Encore Planner link.",
  clear: "Clear",
  notesHeading: "Notes",
  notesHint: "They'll read these exactly as written. A blank line starts a new paragraph.",
  save: "Save",
  saving: "Saving",
  saved: "Saved",
  theirLink: "Their link",
  theirLinkBody: "We don't keep it. If they've lost it, or you want the old one to stop working, make a new one.",
  newLink: "Make a new link",
  newLinkConfirm: "The old link stops working the moment a new one is made. Continue?",
  closeRoom: "Close this room",
  closeHint: "Their link stops working. Everything here is kept, and you can reopen it.",
  reopen: "Reopen",
  isClosed: "This room is closed. Their link doesn't open it.",
  preview: "What they see",
  previewNote: "Their page, as it is right now.",
} as const;

/** Every string, for the copy check. The functions are called with sample values. */
export function roomStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const add = (key: string, text: string) => out.push({ where: `lib/room/copy.ts: ${key}`, text });
  for (const [k, v] of Object.entries(ROOM_COPY)) {
    if (typeof v === "string") add(`ROOM_COPY.${k}`, v);
  }
  add("ROOM_COPY.greeting", ROOM_COPY.greeting("Sam"));
  add("ROOM_COPY.stepOf", ROOM_COPY.stepOf(4, 10, "buy"));
  add("ROOM_COPY.moveLine", ROOM_COPY.moveLine("Feb 15, 2027", COUNTY_NAME.manatee!));
  add("ROOM_COPY.visitLine", ROOM_COPY.visitLine("Nov 6, 2026", "Nov 8, 2026"));
  add("ROOM_COPY.updated", ROOM_COPY.updated("yesterday"));
  for (const [k, v] of Object.entries(TEAM_COPY)) {
    if (typeof v === "string") add(`TEAM_COPY.${k}`, v);
  }
  add("TEAM_COPY.made", TEAM_COPY.made("Sam"));
  add("TEAM_COPY.updatedAgo", TEAM_COPY.updatedAgo("3 days ago"));
  add("TEAM_COPY.roomOf", TEAM_COPY.roomOf("Sam"));
  add("TEAM_COPY.stepOption", TEAM_COPY.stepOption(2, "Set the price", "sell"));
  add("TEAM_COPY.placesFull", TEAM_COPY.placesFull(24));
  for (const v of Object.values(GUIDE_NAME)) add("GUIDE_NAME", v);
  for (const v of Object.values(COUNTY_NAME)) add("COUNTY_NAME", v);
  for (const v of Object.values(KIND_LABEL)) add("KIND_LABEL", v);
  return out;
}
