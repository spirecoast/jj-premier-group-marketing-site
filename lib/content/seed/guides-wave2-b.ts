import type { PortableTextBlock } from "next-sanity";
import type { Post, RichText } from "../types";
import { h, img, quote, rich } from "./helpers";

/**
 * Tide guides, wave two (set B): getting here. Insurance, the barrier islands
 * and the condo documents left with their guides (lib/guides/slugs.ts,
 * REMOVED_GUIDES). Every figure and date is tied to a source the reader can
 * open; the sources sit at the end with the day they were last checked.
 * Places and rules, never people.
 */

const CHECKED = "checked 2026-10-01";

let n = 0;
const key = (prefix: string) => `w2b-${prefix}${(n += 1)}`;

const span = (text: string) => ({ _type: "span", _key: key("s"), text, marks: [] as string[] });

/**
 * One Portable Text block from a string that may carry inline links written
 * as [text](href). Links render through components/rich-text.tsx.
 */
function block(text: string, style = "normal", listItem?: "bullet"): PortableTextBlock {
  const children: PortableTextBlock["children"] = [];
  const markDefs: NonNullable<PortableTextBlock["markDefs"]> = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) children.push(span(text.slice(last, m.index)));
    const k = key("l");
    markDefs.push({ _type: "link", _key: k, href: m[2] });
    children.push({ _type: "span", _key: key("s"), text: m[1], marks: [k] });
    last = m.index + m[0].length;
  }
  if (last < text.length) children.push(span(text.slice(last)));
  return {
    _type: "block",
    _key: key("b"),
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  };
}

/** Paragraphs with inline links. */
const pl = (...paragraphs: string[]): RichText => paragraphs.map((t) => block(t));

/** A bulleted list with inline links. */
const list = (...items: string[]): RichText => items.map((t) => block(t, "normal", "bullet"));

/** The sources footer: one bullet per source, each with the day it was checked. */
const sources = (...items: string[]): RichText => rich(h(2, "Sources"), list(...items.map((s) => `${s} (${CHECKED})`)));

export const WAVE2_GUIDES_B: Post[] = [
  {
    _id: "post-guide-getting-here",
    title: "Getting here and getting around",
    slug: "getting-here-and-getting-around",
    cover: img("library/place-skyway-bridge", "The Sunshine Skyway Bridge over lower Tampa Bay"),
    excerpt: "The airports, the roads, the bridges and the buses, and how to test a drive before you count on it.",
    publishedAt: "2026-09-29",
    author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
    categories: ["Guides"],
    body: rich(
      pl(
        "The coast is a corridor. The interstate runs down the inland side, the old Tamiami Trail runs along the bay, and the islands hang off the mainland on bridges. How long anything takes depends on the hour, the month and whether a bridge is open for a sailboat, which is why you won’t find a drive time on this page. We’ll give you the map and the method instead.",
      ),
      h(2, "Four airports"),
      pl(
        "Sarasota Bradenton International, SRQ, sits between the two cities and is the one we use. The airport keeps its own list of nonstop destinations by airline and season; read it there rather than here, because it changes every schedule ([SRQ, nonstop destinations](https://flysrq.com/nonstop-destinations)).",
        "Tampa International, TPA, is across the Skyway. St. Pete–Clearwater, PIE, is on the Pinellas side. Southwest Florida International, RSW, is down the interstate at Fort Myers. Each airport publishes its own routes: [TPA](https://www.tampaairport.com/), [PIE](https://flypie.com/), [RSW](https://www.flylcpa.com/). We don’t count destinations for any of them; the airports do that better.",
      ),
      h(2, "I-75, the Trail and the county line"),
      pl(
        "I-75 is the spine, with an exit for each of the markets we work. US 41, the Tamiami Trail, is the older road along the bay, and the streets between the two are where most of Sarasota and Bradenton live. Live traffic on both is on the state’s own map ([FL511](https://fl511.com/)).",
        "Lakewood Ranch straddles the Manatee–Sarasota county line, and the line changes the property tax rate and who customarily pays for the owner’s title policy. We explain it on the [Lakewood Ranch page](/lakewood-ranch) and on the [Waterside page](/neighborhoods/waterside); for the drive, it’s the same road either side.",
      ),
      h(2, "The Skyway"),
      pl(
        "The Sunshine Skyway carries I-275 across the mouth of Tampa Bay, from Manatee County to Pinellas; the state lists it as a toll facility serving Pinellas, Hillsborough and Manatee counties ([Florida’s Turnpike, Sunshine Skyway](https://floridasturnpike.com/wp-content/uploads/2023/06/Sunshine_Skyway.pdf)). The Skyway’s 2023 rate sheet still lists SunPass and cash rates; the state’s electronic-tolling page lists the bridge among the locations where cash isn’t taken ([Florida’s Turnpike, electronic toll collection](https://floridasturnpike.com/tolls/electronic-toll-collection/)). Get a transponder before your first drive and you don’t have to settle the question.",
      ),
      h(2, "The island bridges"),
      pl(
        "Anna Maria Island is reached by two bridges from the mainland: Manatee Avenue, which is State Road 64, and Cortez Road, State Road 684. A drawbridge opens for boats, so an island trip has a variable in it that a mainland trip doesn’t.",
        "The Anna Maria Island Bridge on Manatee Avenue is a bascule bridge, the kind that lifts for boats, which the state plans to replace with a high-level fixed bridge; the project is in design, with construction letting estimated for 2028 ([FDOT, Anna Maria Island Bridge replacement](https://www.swflroads.com/project/408185-3)).",
        "The Cortez Bridge is already under construction, with traffic shifts scheduled in phases over the next few years ([FDOT, Cortez Bridge project](https://www.swflroads.com/project/430204-2)). For a buyer that means lane shifts on the way to the beach for a while. Read both project pages before you decide which end of the island suits you.",
        "Longboat Key is reached from the north through Anna Maria Island and from the south through St. Armands; Siesta Key has a north and a south bridge of its own ([the Siesta Key page](/neighborhoods/siesta-key)). Every one of them is a place where the hour matters.",
      ),
      h(2, "How to measure a commute honestly"),
      pl(
        "Drive it at the hour, twice. Once on a weekday in the winter months, when the coast is full, and once in summer, when it isn’t. Leave from the house at the time you’d actually leave and go to the door you’d actually walk through. Set a departure time in a map app before you come so you know what you’re testing ([Google Maps](https://www.google.com/maps)).",
        "Count the bridge and the light at the Trail separately, because those are the parts that don’t smooth out. A map app’s estimate is a starting point, and a Saturday in March is not a Tuesday in August. If you’re relocating, our [relocation planner](/relocate) puts the visit on the calendar so the test drive happens before the offer, not after.",
      ),
      h(2, "Buses and the trolleys"),
      pl(
        "Manatee County Area Transit, MCAT, runs the routes on the Manatee side, including the Anna Maria Island Trolley along the island and routes through Bradenton, Palmetto and Ellenton ([Manatee County, MCAT](https://www.mymanatee.org/departments/mcat)).",
        "Sarasota County’s service is Breeze. The county’s pages wouldn’t open for us while we wrote this, so we won’t describe the routes; find them on the county’s own site ([Sarasota County, Breeze Transit](https://www.scgov.net/government/breeze-transit)).",
      ),
      quote("Go see it at six. Then go see it at eight in February. The house will be the same. The drive won’t."),
      pl(
        "Tell us where you’ll be driving to and at what hour. We’ll time the showings so the test drive is part of the visit, and we’ll tell you which bridge we’d live behind.",
      ),
      sources(
        "[Sarasota Bradenton International Airport, nonstop destinations](https://flysrq.com/nonstop-destinations)",
        "[Tampa International Airport](https://www.tampaairport.com/), [St. Pete–Clearwater International Airport](https://flypie.com/) and [Southwest Florida International Airport](https://www.flylcpa.com/); these three sites blocked our automated check, so we link them without describing them",
        "[FL511, Florida’s traffic map](https://fl511.com/)",
        "[Florida’s Turnpike, Sunshine Skyway Bridge](https://floridasturnpike.com/wp-content/uploads/2023/06/Sunshine_Skyway.pdf) and [electronic toll collection](https://floridasturnpike.com/tolls/electronic-toll-collection/)",
        "[FDOT, Anna Maria Island Bridge replacement, project 408185-3](https://www.swflroads.com/project/408185-3)",
        "[FDOT, Cortez Bridge, project 430204-2](https://www.swflroads.com/project/430204-2)",
        "[Manatee County Area Transit](https://www.mymanatee.org/departments/mcat)",
        "[Sarasota County, Breeze Transit](https://www.scgov.net/government/breeze-transit); unreachable when we checked",
        "[Google Maps](https://www.google.com/maps)",
      ),
    ),
  },
];

/** Every string in these guides, for the Fair Housing check. */
export function wave2GuidesBStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const post of WAVE2_GUIDES_B) {
    out.push({ where: `${post.slug}: title`, text: post.title });
    out.push({ where: `${post.slug}: excerpt`, text: post.excerpt });
    out.push({ where: `${post.slug}: cover alt`, text: post.cover.alt });
    post.body.forEach((b, i) => {
      const text = (b.children as { text?: string }[] | undefined)?.map((c) => c.text ?? "").join("") ?? "";
      if (text) out.push({ where: `${post.slug}: block ${i + 1}`, text });
    });
  }
  return out;
}
