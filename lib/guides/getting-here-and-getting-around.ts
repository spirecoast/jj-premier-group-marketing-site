import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Getting here and getting around.
 *
 * Plain on purpose: short sentences, everyday words, one idea at a time.
 * No drive times anywhere, because the minutes depend on the hour, the
 * month and the bridge; the guide gives the map and the method instead.
 * The facts are the ones the October 2, 2026 fact check verified against
 * the cited pages. Three airports' own sites and Sarasota County's site
 * blocked our check, and the guide says so.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const SRQ_NONSTOP = "https://flysrq.com/nonstop-destinations";
const FDOT_PROFILES = "https://www.fdot.gov/aviation/fas-profiles.shtm";
const FDOT_SRQ = "https://www.fdot.gov/aviation/airportslist/SRQ";
const FDOT_TPA = "https://www.fdot.gov/aviation/airportslist/TPA";
const FDOT_PIE = "https://www.fdot.gov/aviation/airportslist/PIE";
const FDOT_RSW = "https://www.fdot.gov/aviation/airportslist/RSW";
const TPA_SITE = "https://www.tampaairport.com/";
const PIE_SITE = "https://flypie.com/";
const RSW_SITE = "https://www.flylcpa.com/";
const FL511 = "https://fl511.com/";
const SKYWAY_SHEET = "https://floridasturnpike.com/wp-content/uploads/2023/06/Sunshine_Skyway.pdf";
const TURNPIKE_ETC = "https://floridasturnpike.com/tolls/electronic-toll-collection/";
const FDOT_AMI_BRIDGE = "https://www.swflroads.com/project/408185-3";
const FDOT_CORTEZ = "https://www.swflroads.com/project/430204-2";
const FDOT_LONGBOAT = "https://www.swflroads.com/project/436676-1";
const FDOT_SARASOTA_ROADWATCH = "https://www.swflroads.com/roadwatch/County/Sarasota";
const CFR_117_287 = "https://www.law.cornell.edu/cfr/text/33/117.287";
const LWR_FACTS = "http://lakewoodranch.com/wp-content/uploads/2022/10/lwr_fact_sheet.pdf";
const LBK_TAXES = "https://www.longboatkey.org/434/Ad-valorem-Taxes";
const MCAT = "https://www.mymanatee.org/departments/mcat";
const MCAT_TROLLEY = "https://www.mymanatee.org/services-and-amenities/service-listing/service-details/ride-route-5-anna-maria-island-trolley";
const MCAT_NEWS = "https://www.mymanatee.org/connect/news-and-information/news-and-information/article-detail/manatee-county-area-transit-mcat-posts/2025/01/02/public-transportation-mcat";
const BREEZE = "https://www.scgov.net/government/breeze-transit";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  srq: src("Sarasota Bradenton International Airport, Nonstop destinations", SRQ_NONSTOP),
  fdotProfiles: src("Florida Department of Transportation, Airport air service profiles", FDOT_PROFILES),
  fdotSrq: src("Florida Department of Transportation, Airport data: Sarasota Bradenton International (SRQ)", FDOT_SRQ),
  fdotTpa: src("Florida Department of Transportation, Airport data: Tampa International (TPA)", FDOT_TPA),
  fdotPie: src("Florida Department of Transportation, Airport data: St Pete–Clearwater International (PIE)", FDOT_PIE),
  fdotRsw: src("Florida Department of Transportation, Airport data: Southwest Florida International (RSW)", FDOT_RSW),
  tpa: src("Tampa International Airport", undefined, "the airport’s site blocked our automated check, so we link it without describing it"),
  pie: src("St. Pete–Clearwater International Airport", undefined, "the airport’s site blocked our automated check, so we link it without describing it"),
  rsw: src("Southwest Florida International Airport", undefined, "the airport’s site blocked our automated check, so we link it without describing it"),
  fl511: src("FL511, Florida’s official source for real-time traffic information", FL511),
  skyway: src("Florida’s Turnpike, Sunshine Skyway Bridge toll rate sheet, effective July 1, 2023 (PDF)", SKYWAY_SHEET),
  etc: src("Florida’s Turnpike, Electronic toll collection", TURNPIKE_ETC),
  amiBridge: src("FDOT, Anna Maria Bridge replacement, project 408185-3", FDOT_AMI_BRIDGE),
  cortez: src("FDOT, Cortez Bridge, project 430204-2", FDOT_CORTEZ),
  longboat: src("FDOT, SR 789 (Longboat Key) project development and environment study, project 436676-1", FDOT_LONGBOAT),
  roadwatch: src("FDOT, Sarasota County RoadWatch", FDOT_SARASOTA_ROADWATCH),
  cfr: src("33 CFR 117.287, drawbridge schedules on the Gulf Intracoastal Waterway (Legal Information Institute)", CFR_117_287),
  lwr: src("Lakewood Ranch, Fact sheet (PDF)", LWR_FACTS),
  lbkTaxes: src("Town of Longboat Key, Ad valorem taxes", LBK_TAXES),
  mcat: src("Manatee County Area Transit (MCAT)", MCAT),
  trolley: src("Manatee County, Ride Route 5, the Anna Maria Island Trolley", MCAT_TROLLEY),
  mcatNews: src("Manatee County, Public transportation (MCAT), January 2, 2025", MCAT_NEWS),
  breeze: src("Sarasota County, Breeze Transit", undefined, "returned an access error when we checked, so the guide does not describe its routes or fares"),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });

/* ---- The guide ------------------------------------------------------------- */

export const GETTING_HERE_GUIDE: Guide = {
  slug: "getting-here-and-getting-around",
  title: "Getting here and getting around",
  promise: "The airports, the roads, the bridges and the buses, and how to test a drive before you count on it.",
  howToUse: [
    "Read this guide once before your first visit. Then use the checklist at the end for each house you’re serious about.",
    "You won’t find a drive time on these pages. The minutes change with the hour, the month and the bridge, so the guide shows you how to get your own number instead.",
  ],
  questions: ["Which door will you drive to most?", "Is there a drawbridge on the way?", "Have you driven it at the real hour?"],
  cover: img("guides/getting-here-and-getting-around", "A causeway crossing the bay into Sarasota, from the air", "50% 55%"),
  author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
  publishedAt: "2026-09-29",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "the-shape-of-the-coast",
      title: "The shape of the coast",
      lead: "The coast is a long strip. One big road runs inland, one runs along the bay, and the islands hang off the edge on bridges.",
      blocks: [
        p(
          "Picture a map with the Gulf on the left. Next to the Gulf is a chain of thin islands. Behind them is the bay, and then the mainland.",
        ),
        p(
          "Two roads run the length of the mainland. I-75, the interstate, runs down the inland side. US 41, called the Tamiami Trail, runs along the bay through the towns.",
          "Most of the streets you’ll look at sit between those two roads.",
        ),
        p(
          "Lakewood Ranch is east of the interstate. You reach it from four exits: University Parkway, State Road 70, State Road 64 and Fruitville Road.",
          "The line between Manatee County and Sarasota County runs through it. Each county sets its own property tax rate, so the line matters.",
        ),
        p("The islands sit off the coast on bridges. Anna Maria Island, Longboat Key, Lido Key and Siesta Key each have their own."),
        {
          kind: "figure",
          eyebrow: "The map",
          title: "The roads, from the Skyway to the islands",
          reading: "North is at the top. The numbers mark the places the rest of this guide talks about.",
          figure: {
            type: "sketch",
            scene: "corridor",
            marks: [
              { code: "1", name: "The Sunshine Skyway", body: "Carries I-275 across the mouth of Tampa Bay, from Manatee County to Pinellas County. A toll bridge, with no cash taken." },
              { code: "2", name: "I-75", body: "The interstate. It runs down the inland side of the coast." },
              { code: "3", name: "US 41, the Tamiami Trail", body: "The older road along the bay. It runs through Bradenton and Sarasota." },
              { code: "4", name: "Sarasota Bradenton International Airport", body: "Called SRQ. It sits in Sarasota, between the two cities." },
              { code: "5", name: "Lakewood Ranch and the county line", body: "East of the interstate, with the Manatee–Sarasota county line running through it." },
              { code: "6", name: "The island bridges", body: "Two to Anna Maria Island, a causeway to St. Armands and Lido, and two to Siesta Key. Most of them open for boats." },
            ],
          },
          note: "This drawing shows the idea, not a real map. The roads and the islands are not to scale.",
          source: {
            label: "FDOT, Sarasota County RoadWatch (I-75 and US 41); Lakewood Ranch, Fact sheet; Florida’s Turnpike, Sunshine Skyway Bridge toll rate sheet; FDOT, Airport data (SRQ); 33 CFR 117.287",
            href: FDOT_SARASOTA_ROADWATCH,
          },
        },
      ],
      sources: [S.roadwatch, S.lwr, S.lbkTaxes, S.skyway, S.fdotSrq, S.cfr],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "four-airports",
      title: "Four airports",
      lead: "The closest airport is in Sarasota. Three more are a longer drive away, and each one has its own set of flights.",
      blocks: [
        p(
          "Sarasota Bradenton International, called SRQ, is in Sarasota. It keeps a list of its nonstop flights by airline.",
          "Each one is marked year-round or seasonal, and the list changes with each schedule. So read it on the airport’s site, not here.",
        ),
        p(
          "Tampa International, called TPA, is in Tampa, across the Skyway. St. Pete–Clearwater, called PIE, is in St. Petersburg, in Pinellas County.",
          "Southwest Florida International, called RSW, is in Fort Myers, down the interstate.",
        ),
        p("All four are on the state’s list of airports with airline service. We don’t count the flights at any of them. The airports do that better, and the counts change."),
        p(
          "When you compare them, look at the list of nonstop cities, not the size of the airport. A flight home with no change can be worth a longer drive.",
          "And check the list for the months you’ll fly, since some flights run only in season.",
        ),
        {
          kind: "figure",
          eyebrow: "The airports",
          title: "Four airports, and where each one is",
          reading: "Each card is one airport. The link opens the airport’s own site.",
          figure: {
            type: "map-callout",
            places: [
              { name: "Sarasota Bradenton International", covers: "SRQ · Sarasota", body: "In Sarasota. Its nonstop list is on its site, by airline, and marked year-round or seasonal.", href: SRQ_NONSTOP, cta: "flysrq.com" },
              { name: "Tampa International", covers: "TPA · Tampa", body: "In Tampa, in Hillsborough County, across the Skyway.", href: TPA_SITE, cta: "tampaairport.com" },
              { name: "St. Pete–Clearwater International", covers: "PIE · St. Petersburg", body: "In St. Petersburg, in Pinellas County.", href: PIE_SITE, cta: "flypie.com" },
              { name: "Southwest Florida International", covers: "RSW · Fort Myers", body: "In Fort Myers, in Lee County, down the interstate.", href: RSW_SITE, cta: "flylcpa.com" },
            ],
          },
          note: "The cities and counties come from the state’s airport data pages. Three airports’ own sites blocked our check, so we link them without describing them.",
          source: { label: "FDOT, Airport data pages for SRQ, TPA, PIE and RSW; FDOT, Airport air service profiles; Sarasota Bradenton International Airport, Nonstop destinations", href: FDOT_PROFILES },
        },
      ],
      sources: [S.srq, S.fdotProfiles, S.fdotSrq, S.fdotTpa, S.fdotPie, S.fdotRsw, S.tpa, S.pie, S.rsw],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "the-skyway",
      title: "The Skyway",
      lead: "The Sunshine Skyway carries I-275 across the mouth of Tampa Bay. There’s a toll, and no one takes cash.",
      blocks: [
        p("The bridge joins Manatee County to Pinellas County. The state lists it under Pinellas, Hillsborough and Manatee counties. It’s the way north to St. Petersburg and the Tampa airport."),
        p(
          "The toll is collected without a booth. If you have a SunPass, the toll comes off your account.",
          "If you don’t, a camera takes a photo of your plate. The toll becomes a TOLL-BY-PLATE charge, and a bill goes to the car’s registered owner, with an extra charge added.",
        ),
        p("So get a SunPass before your first drive. It settles the question, and it works on the state’s other electronic toll roads too."),
        {
          kind: "figure",
          eyebrow: "The toll",
          title: "Two ways to pay the same toll",
          reading: "Read each side. One way costs the toll. The other costs the toll plus a bill in the mail.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "With a SunPass",
                title: "Drive through",
                items: ["The toll comes off your account", "Nothing to stop for"],
              },
              {
                eyebrow: "Without one",
                title: "A bill comes in the mail",
                items: ["A camera takes a photo of the plate", "The toll becomes a TOLL-BY-PLATE charge", "An invoice goes to the car’s registered owner", "An administrative charge is added"],
              },
            ],
          },
          source: { label: "Florida’s Turnpike, Electronic toll collection; Florida’s Turnpike, Sunshine Skyway Bridge toll rate sheet", href: TURNPIKE_ETC },
        },
      ],
      sources: [S.skyway, S.etc],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "the-island-bridges",
      title: "The island bridges",
      lead: "Every island trip crosses a bridge, and most of them open for boats. That adds a wait a mainland trip doesn’t have.",
      blocks: [
        p(
          "Two bridges lead from the mainland to Anna Maria Island: Manatee Avenue, which is State Road 64, and Cortez Road, which is State Road 684.",
          "Both are drawbridges. From 6 a.m. to 7 p.m., each opens for boats at a quarter past and a quarter to the hour. At other times it opens when a boat asks.",
        ),
        p(
          "Siesta Key has two bridges of its own: Siesta Drive at the north end and Stickney Point Road at the south end.",
          "Both are drawbridges too. From 6 a.m. to 7 p.m., each opens on the hour and the half hour.",
        ),
        p(
          "Those times matter to you, not just to boats. When the bridge opens, the cars wait. So if you reach a Siesta Key bridge on the half hour, you may sit while a sailboat goes through.",
        ),
        p(
          "Longboat Key has a bridge at each end. At the north end, a bridge over Longboat Pass joins it to Anna Maria Island.",
          "At the south end, State Road 789 runs through St. Armands and over the Ringling Causeway to Sarasota.",
        ),
        p(
          "Three of these bridges are changing. The state is building a new Cortez Bridge now, in two phases, over about 1,200 days.",
          "It plans to replace the Manatee Avenue drawbridge with a fixed bridge 65 feet above the water. Construction is set to be let in July 2028.",
          "And it’s studying what to do with the Longboat Pass bridge: repair it, build a tall fixed bridge, or build a new drawbridge.",
        ),
        p("The Siesta Drive bridge is being repaired, with the work expected to finish in late 2026. Check FL511 before you drive. It shows live traffic and whether a drawbridge is open."),
        {
          kind: "figure",
          eyebrow: "The projects",
          title: "Three bridge projects to read before you pick an end of the island",
          reading: "Each card is one bridge. The link opens the state’s page for the project, which changes as the work goes on.",
          figure: {
            type: "map-callout",
            places: [
              {
                name: "Cortez Bridge, State Road 684",
                covers: "Under construction",
                body: "A new bridge built in two phases, so traffic keeps moving. The first traffic shift was expected by the end of 2026 and the second in mid-2028. About 1,200 days of work.",
                href: FDOT_CORTEZ,
                cta: "swflroads.com",
              },
              {
                name: "Anna Maria Island Bridge, State Road 64",
                covers: "In design",
                body: "A fixed bridge 65 feet above the water will replace the drawbridge on Manatee Avenue. Construction is set to be let on July 26, 2028.",
                href: FDOT_AMI_BRIDGE,
                cta: "swflroads.com",
              },
              {
                name: "Longboat Pass bridge, State Road 789",
                covers: "Being studied",
                body: "The state is weighing a repair, a tall fixed bridge or a new drawbridge. The study began in early 2020 and was expected to finish in mid-2026.",
                href: FDOT_LONGBOAT,
                cta: "swflroads.com",
              },
            ],
          },
          source: { label: "FDOT, Anna Maria Bridge replacement, project 408185-3; FDOT, Cortez Bridge, project 430204-2; FDOT, SR 789 (Longboat Key) project development and environment study, project 436676-1", href: FDOT_CORTEZ },
        },
      ],
      sources: [S.cfr, S.amiBridge, S.cortez, S.longboat, S.roadwatch, S.fl511],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "how-to-test-a-drive",
      title: "How to test a drive before you count on it",
      lead: "We don’t print drive times. They change with the hour, the month and the bridge. Here’s how to get your own number.",
      blocks: [
        p("Picture the same drive on two days. A Tuesday in August, and a Saturday in March. The house is the same. The drive isn’t."),
        p(
          "So drive it yourself, twice. Leave from the house at the time you’d really leave. Go to the door you’d really walk through.",
          "Do it once in winter and once in summer, if you can. A map app’s estimate is a starting point, not an answer.",
        ),
        p(
          "Count the bridge and the Trail on their own. Those are the parts that don’t smooth out.",
          "A drawbridge opening adds minutes you can’t plan around. A long light on the Trail does the same.",
        ),
        p(
          "Write down the time you left, the time you arrived, and where you waited. Do it again on the second day.",
          "Now you have two numbers of your own, and you know which one is the winter number.",
        ),
        p("FL511 is the state’s traffic map. It shows live speeds, cameras, road work, and whether a drawbridge is open. Look at it at the hour you’d drive."),
        {
          kind: "figure",
          eyebrow: "The test",
          title: "Four questions to answer before you count on a drive",
          reading: "Answer each one for the house. If any answer is no, the drive isn’t tested yet.",
          figure: {
            type: "questions",
            answers: ["Yes", "Not yet"],
            items: [
              { question: "Have you driven it at the hour you’d really leave?" },
              { question: "Did you start at the house and end at the door?" },
              { question: "Have you driven it in winter and in summer?", note: "The two can be very different drives." },
              { question: "Do you know every drawbridge and every Trail light on the way?", note: "Count them. They’re the parts that don’t smooth out." },
            ],
          },
          source: { label: "The method is ours. The live traffic map and the drawbridge status are from FL511", href: FL511 },
          tool: { tool: "relocate", cta: "Plan the visit" },
        },
      ],
      sources: [S.fl511, S.cfr],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "buses-and-the-trolley",
      title: "Buses and the island trolley",
      lead: "Two counties, two bus systems. On Anna Maria Island, a free trolley runs the length of the island all day.",
      blocks: [
        p(
          "Manatee County’s buses are run by Manatee County Area Transit, called MCAT. Its routes have numbers, and you need exact fare or a bus pass to ride.",
        ),
        p(
          "Route 5 is the Anna Maria Island Trolley. It runs along Gulf Drive from the City Pier at the north end to Coquina Beach at the south end.",
          "It comes every 20 minutes, from 6 a.m. to 10:30 p.m., every day of the year. The trolley is free, and donations are accepted.",
        ),
        p("The trolley is a good way to see the island before you pick an end of it. Ride it from the pier to Coquina Beach and back, and you’ve seen the whole length of it."),
        p("Sarasota County’s bus service is called Breeze. Look up its routes and fares on the county’s site."),
        {
          kind: "figure",
          eyebrow: "Two counties",
          title: "Who runs the bus in each county",
          reading: "Read each side. The left side is Manatee County. The right side is Sarasota County.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "Manatee County: MCAT",
                title: "Numbered routes and the island trolley",
                items: [
                  "Numbered bus routes; have exact fare or a bus pass ready",
                  "Route 5, the Anna Maria Island Trolley, runs Gulf Drive from the City Pier to Coquina Beach",
                  "Every 20 minutes, 6 a.m. to 10:30 p.m., every day of the year",
                  "The trolley is free, and donations are accepted",
                ],
              },
              {
                eyebrow: "Sarasota County: Breeze",
                title: "The county’s own site has the routes",
                items: ["Breeze is Sarasota County’s bus service", "Look up routes and fares on scgov.net"],
              },
            ],
          },
          note: "This guide covers Manatee County’s routes. For Breeze, use the county’s site.",
          source: { label: "Manatee County, Ride Route 5, the Anna Maria Island Trolley; Manatee County, Public transportation (MCAT); Sarasota County, Breeze Transit", href: MCAT_TROLLEY },
        },
      ],
      sources: [S.mcat, S.trolley, S.mcatNews, S.breeze],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "before-you-choose-a-house",
      title: "Before you choose a house",
      lead: "Use this list for each house you’re serious about. Do the test drives before you make an offer, not after.",
      blocks: [
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Seven things to do before you choose",
          reading: "Go in order. The first two take a visit. The rest take a few minutes each.",
          figure: {
            type: "checklist",
            items: [
              { text: "Pick the door you’ll drive to most", detail: "The office, the airport, the beach, the boat. Be exact." },
              { text: "Drive it at the real hour, from the house to that door", detail: "Once in winter and once in summer, if you can." },
              { text: "Count every drawbridge and every Trail light on the way", detail: "Those are the parts that don’t smooth out." },
              { text: "Check FL511 at the hour you’d drive", detail: "Live traffic, road work and drawbridge status." },
              { text: "Read the state’s project page for any bridge on your route", detail: "The Cortez, Manatee Avenue and Longboat Pass bridges are all changing." },
              { text: "Get a SunPass if you’ll cross the Skyway", detail: "No cash is taken. Without one, a bill comes in the mail with a charge added." },
              { text: "Look up the bus or trolley if you’ll use one", detail: "MCAT in Manatee County, Breeze in Sarasota County." },
            ],
          },
          source: { label: "Each step comes from the section it sums up. The sources are listed there and at the end of this guide", href: FL511 },
          tool: { tool: "contact", cta: "Tell us where you’ll drive" },
        },
      ],
      sources: [S.fl511, S.cfr, S.cortez, S.amiBridge, S.longboat, S.etc, S.trolley],
    },
  ],

  onOnePage: {
    title: "Your drive notes for one house",
    reading: "Fill in the right side for the house you’re looking at.",
    rows: [
      { label: "Address", value: "Write it here" },
      { label: "The door you’ll drive to most", value: "Name it" },
      { label: "Winter test drive", value: "Date, hour, and how it went" },
      { label: "Summer test drive", value: "Date, hour, and how it went" },
      { label: "Drawbridges on the way", value: "Which ones, and when they open" },
      { label: "Trail lights on the way", value: "How many" },
      { label: "Nearest airport", value: "SRQ, TPA, PIE or RSW" },
      { label: "SunPass", value: "Set up before the first Skyway drive" },
      { label: "Bus or trolley", value: "Route, if you’ll use one" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Tell us where you’ll be driving to.",
    body: "We can set the showings so the test drive is part of the visit, at the hour you’d really leave. If you’d rather do it yourself, this guide is the order we’d do it in.",
    cta: "Plan a visit",
    tool: "contact",
  },
};
