// The round-four deck: 14 families, 10 templates each. Copy, photo and register for every piece.
import { A } from "./deck-a.mjs";
import { B } from "./deck-b.mjs";

/** Each family has one job from the social plan, the way the Virtus v3 set did. */
export const FAMILIES = [
  { n: "01", name: "Plain Talk", job: "reach", register: "Golden Hour and Quiet", thesis: "One sincere line to one person, over a calm photograph. Are you thinking about moving? No pitch, no punch. These are the posts that earn the right to post everything else." },
  { n: "02", name: "Listings", job: "click", register: "All twelve, one per piece", thesis: "The same listing told ten ways: Coldwell Banker Blue for the brokerage feed, Gallery and Golden Hour for the top of the market, Elevation, Cut Paper, Poster, Cinema and Harbor Night for the weeks the feed needs a change. Every one carries the Equal Housing mark and says it is a sample." },
  { n: "03", name: "One Number", job: "share", register: "Big Type", thesis: "A single figure from Tide, set huge, with one plain sentence that says what it means and one line that says where it came from. Nothing posts without the source and the pull date." },
  { n: "04", name: "Before You", job: "save", register: "Checklist on a photo", thesis: "Three or four things to do before you list, offer, close, or buy behind a gate. The lists are short on purpose; the save is the point, and the caption asks people to share it if it would help someone." },
  { n: "05", name: "On the Calendar", job: "save", register: "Date block on a photo", thesis: "The dates that actually matter here: March 1, June 1, November 30, the tax discount, a flood policy's 30 days, and a few opening nights. Each one says what to do, not just when." },
  { n: "06", name: "What People Think", job: "share", register: "Paper card on a photo", thesis: "The thing people believe, struck through, and the thing that's true, said kindly. Insurance, flood zones, homestead, condo fees, the roof. The corrections people forward to a friend who's about to buy." },
  { n: "07", name: "Which Would You", job: "comment", register: "Split photograph", thesis: "Two pictures, one honest question. Beach or market, canal or lake, matinee or opening night. There is never a wrong answer, and the caption says so." },
  { n: "08", name: "Drawn", job: "save", register: "Chart Room", thesis: "Simple charts drawn from the county record and the Atlas data: medians, a year of closings, what sold by type, every neighborhood as a dot. One idea per chart and the source under it." },
  { n: "09", name: "The Questions", job: "comment", register: "Interface on a dimmed photo", thesis: "The questions people actually send us, shown the way they arrive: a text thread, a search bar, a note on the fridge, a lock screen in closing week. Plain answers, in our voice, inside the frame." },
  { n: "10", name: "Swipe", job: "save", register: "Carousel", thesis: "Two five-slide carousels: the week before closing, told day by day, and a night at the Opera House planned to the minute. Each ends with the same quiet ask: save it, and send it to someone who'd use it." },
  { n: "11", name: "Encore", job: "follow", register: "Harbor Night, Poster, Gallery, Cinema, Edition, Quiet", thesis: "The culture series. Real shows at real venues, named properly, with one honest line about why we'd go. Nothing is for sale. Every date was checked against the Encore calendar and gets checked again the week it posts." },
  { n: "12", name: "Around Here", job: "reach", register: "Suncoast Posters, Golden Hour, Quiet", thesis: "Places, not houses. The Skyway, the Riverwalk, the islands, the live oaks, the beach. One true thing about each, the kind of thing you only know from living here." },
  { n: "13", name: "Stories", job: "comment and click", register: "9:16 with drawn sticker placeholders", thesis: "Polls, question boxes, link stickers, countdowns and two Reel covers. Type stays clear of the top 250 and bottom 320 pixels. The stickers are drawn placeholders; the real ones go on when posting." },
  { n: "14", name: "Thank You and Please Share", job: "share", register: "Moments and panels", thesis: "Closing day, the homeversary, Thanksgiving, the holidays, the new year, and the plainest referral ask we could write. These are the posts that sound most like the two of them." },
];

export const DECK = [...A, ...B].map((t) => ({ family: t.id.slice(0, 2), ...t }));
