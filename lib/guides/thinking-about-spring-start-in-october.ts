import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Getting a house ready to sell, explained.
 *
 * Rebuilt from the post "Thinking about spring? Start in October." The slug
 * is kept so the old link still works. Written plainly on purpose, to the
 * template in docs/GUIDES.md: short sentences, everyday words, one idea at a
 * time, and every official term explained the first time it appears.
 * scripts/check-guides.ts measures the reading grade of the running text and
 * fails the build if it drifts up.
 *
 * The timings are of two kinds and the text says which is which: the
 * eight-week plan, the photographers' lead time and the lists of what to fix
 * are our own practice, labelled as such; every other timing (the estoppel
 * certificate's ten business days, the five years a wind mitigation form is
 * good for, the roof-age rule) comes from the page cited beside it, as the
 * October 2, 2026 fact check verified.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const FS_627_7011 = "https://www.flsenate.gov/Laws/Statutes/2026/627.7011";
const MANATEE_PAO_SALES = "https://www.manateepao.gov/cama-reports/";
const FS_627_0629 = "https://www.flsenate.gov/Laws/Statutes/2026/627.0629";
const FS_627_711 = "https://www.flsenate.gov/Laws/Statutes/2026/627.711";
const OIR_WIND = "https://floir.gov/consumers/wind-mitigation-resources";
const CITIZENS_INSPECTIONS = "https://www.citizensfla.com/inspections";
const CITIZENS_FOUR_POINT_FAQ = "https://securesupport.citizensfla.com/app/answers/list/search/1/kw/4%20point%20inspection/suggested/1";
const CITIZENS_FORM_NOTICE = "https://www.citizensfla.com/-/20260319-uniform-mitigation-verification-inspection-form-changes";
const MANATEE_PERMITS_PAGE = "https://www.mymanatee.org/services-and-amenities/service-listing/service-details/apply-search-and-manage-building-permits";
const MANATEE_PERMITS = "https://aca-prod.accela.com/manatee/";
const SARASOTA_CO_PERMITS = "https://aca-prod.accela.com/SARASOTACO/Default.aspx";
const SARASOTA_CITY_PERMITS = "https://ftgportal.sarasotafl.gov/Permits/Search.aspx?microapp=c";
const FS_689_302 = "https://www.flsenate.gov/Laws/Statutes/2026/689.302";
const FS_720_401 = "https://www.flsenate.gov/Laws/Statutes/2026/720.401";
const FS_718_503 = "https://www.flsenate.gov/Laws/Statutes/2026/718.503";
const FS_720_30851 = "https://www.flsenate.gov/Laws/Statutes/2026/720.30851";
const FS_718_116 = "https://www.flsenate.gov/Laws/Statutes/2026/718.116";
const JOHNSON_V_DAVIS = "https://case-law.vlex.com/vid/johnson-v-davis-no-885096307";
const FEMA_UEC = "https://www.fema.gov/fact-sheet/understanding-elevation-certificates";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  practice: src("JJ Premier Group, how we prepare a listing (our practice)", undefined, "the eight-week plan, the lists of what to fix and the pricing method are our advice, not a rule"),
  sales: src("Manatee and Sarasota County Property Appraisers, qualified home sales by month, October 2024 to September 2026 (our count of the counties’ sales files)", MANATEE_PAO_SALES, "the Sarasota County file comes from the county’s download page; March 2026 had the most sales and April 2025 the most the year before"),
  roof: src("Florida Statutes 627.7011(5)(b) and (c), roof age and homeowners’ policies", FS_627_7011),
  windCredits: src("Florida Statutes 627.0629(1), discounts for windstorm mitigation", FS_627_0629),
  windForm: src("Florida Statutes 627.711, notice of discounts and the uniform mitigation verification form", FS_627_711),
  oir: src("Florida Office of Insurance Regulation, Wind mitigation resources", OIR_WIND),
  citizens: src("Citizens Property Insurance Corporation, Inspections", CITIZENS_INSPECTIONS),
  citizensFaq: src("Citizens Property Insurance Corporation, four-point inspection questions", CITIZENS_FOUR_POINT_FAQ),
  citizensForm: src("Citizens Property Insurance Corporation, Uniform mitigation verification inspection form changes, March 19, 2026", CITIZENS_FORM_NOTICE),
  manateePermits: src("Manatee County, Apply, search and manage building permits", MANATEE_PERMITS_PAGE),
  sarasotaCoPermits: src("Sarasota County, Accela Citizen Access (permit search)", SARASOTA_CO_PERMITS),
  cityPermits: src("City of Sarasota, Building permit lookup", SARASOTA_CITY_PERMITS),
  flood: src("Florida Statutes 689.302, Disclosure of flood risks to prospective purchaser", FS_689_302),
  hoaDisclosure: src("Florida Statutes 720.401, the homeowners’ association disclosure summary", FS_720_401),
  condoDocs: src("Florida Statutes 718.503(2), condominium resale documents", FS_718_503),
  hoaEstoppel: src("Florida Statutes 720.30851, homeowners’ association estoppel certificates", FS_720_30851),
  condoEstoppel: src("Florida Statutes 718.116(8), condominium estoppel certificates", FS_718_116),
  disclosure: src("Johnson v. Davis, 480 So. 2d 625 (Fla. 1985), the seller’s duty to disclose", JOHNSON_V_DAVIS, "the page shows a preview of the opinion, with its holding in the headnote"),
  fema: src("FEMA, Understanding elevation certificates (fact sheet)", FEMA_UEC),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });
const sub = (text: string): Block => ({ kind: "subhead", text });

/* ---- The guide ------------------------------------------------------------- */

export const READY_TO_SELL_GUIDE: Guide = {
  slug: "thinking-about-spring-start-in-october",
  title: "Getting your house ready to sell",
  promise: "What to do before you list, in what order, and how long each step takes.",
  howToUse: [
    "Read this guide once, start to finish. Then use the plan at the end to set your own dates.",
    "The timings in this guide are our own plan, unless a source says otherwise. Each part says where its facts come from. Before you count on a rule, check it with your insurance agent, your association and the title company.",
  ],
  questions: ["When do you want to list?", "What will the buyer’s insurance company ask?", "Which papers do you need to find?"],
  cover: img("guides/thinking-about-spring-start-in-october", "Sabal palms by a quiet waterway at golden hour", "50% 60%"),
  author: { name: "Jessica Garza", slug: "jessica-garza" },
  publishedAt: "2026-08-28",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "start-two-months-ahead",
      title: "Start about two months before you list",
      lead: "A good plan for getting a house ready runs about eight weeks. Pick your listing date, then count back.",
      blocks: [
        p(
          "Picture a house on the Ranch that goes on the market in the middle of February. The photos were taken in January.",
          "The painting was done in November. The owner called us in October.",
        ),
        p(
          "County records show that home sales here peaked in March and April in each of the last two years.",
          "To be on the market before then, the work starts in the fall. That’s why this guide says to start early.",
        ),
        p(
          "Here’s a typical eight-week plan. In weeks one and two, we walk the house with you and agree on what to change.",
          "Weeks three to six are the work. Weeks seven and eight are staging and photos. Then the listing goes live.",
        ),
        p(
          "Good photographers can be booked up weeks ahead. So book the photos in week one, before the first can of paint is open.",
          "Some houses need less than eight weeks, and some need more. The plan is a starting point, not a rule.",
        ),
        {
          kind: "figure",
          eyebrow: "The plan",
          title: "Eight weeks, from the first walk to listing day",
          reading: "Each bar is one stage. Read from left to right. The line at the end is the day the listing goes live.",
          figure: {
            type: "timeline",
            max: 8,
            unit: "weeks",
            ticks: [
              { at: 2, label: "Week 2" },
              { at: 4, label: "Week 4" },
              { at: 6, label: "Week 6" },
            ],
            markers: [{ at: 8, label: "Listing goes live" }],
            lanes: [
              { label: "Walk the house and make the list", sub: "Weeks 1 and 2", start: 0, end: 2, series: 0, text: "Plan" },
              { label: "The work", sub: "Weeks 3 to 6", start: 2, end: 6, series: 1, text: "Paint and repairs" },
              { label: "Staging and photos", sub: "Weeks 7 and 8", start: 6, end: 8, series: 2, text: "Photos" },
            ],
            legend: [
              { label: "Plan", series: 0 },
              { label: "The work", series: 1 },
              { label: "Staging and photos", series: 2 },
            ],
          },
          note: "These are typical weeks for a house that needs paint and small repairs. Your house gets its own plan on the first walk.",
          source: { label: "Our advice for a typical house", note: "the weeks are a plan, not a rule" },
        },
      ],
      sources: [S.sales, S.practice],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "pick-what-to-fix",
      title: "Pick what to fix, and what to leave alone",
      lead: "Most houses need a few small fixes, not a remodel. We walk the house with you in week one and make the list.",
      blocks: [
        p(
          "On the first walk, we look at the house the way a buyer will. From the street first. Then the front door. Then every room.",
          "Often the list is short.",
        ),
        p(
          "The work that pays is the plain work. Paint. Small repairs. The pool cage screens. A deep clean, and less stuff in every room.",
          "It makes the house look cared for, and that’s what the photos need to show.",
        ),
        p(
          "Then there’s the work we’d skip. We don’t ask sellers to redo a kitchen before a sale.",
          "A new kitchen costs a lot, and the sale rarely pays it back.",
        ),
        p(
          "The roof is the one we talk about most. Don’t replace it just to sell.",
          "Replace it if it won’t pass the checks a buyer’s insurance company asks for. The next section explains those.",
        ),
        {
          kind: "figure",
          eyebrow: "Three lists",
          title: "What we’d do, what we’d ask about, and what we’d skip",
          reading: "Each card is one list. Start with the first one.",
          figure: {
            type: "zone-cards",
            labels: { lender: "Does it help the sale?", build: "What’s on the list" },
            cards: [
              {
                code: "Do",
                name: "Nearly always",
                tone: "lower",
                means: "Plain work that makes the house look cared for.",
                lender: { mark: "yes", text: "Yes" },
                build: "Paint, the front door, small repairs, the pool cage screens, a deep clean",
              },
              {
                code: "Ask",
                name: "It depends",
                tone: "high",
                means: "Work that pays on some houses and not on others.",
                lender: { mark: "maybe", text: "Sometimes. We’ll tell you for your house" },
                build: "The roof, the seawall, and anything a buyer’s inspector would flag",
              },
              {
                code: "Skip",
                name: "Rarely",
                tone: "highest",
                means: "Big projects that cost more than they return at the sale.",
                lender: { mark: "no", text: "Not usually" },
                build: "A new kitchen, or a new roof when the old one still passes inspection",
              },
            ],
          },
          note: "This is our advice, not a rule. Your house gets its own list on the first walk.",
          source: { label: "Our practice, from the way we advise sellers before a listing", note: "not a rule" },
        },
      ],
      sources: [S.practice],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "what-the-buyers-insurer-asks",
      title: "What the buyer’s insurance company will ask",
      lead: "A buyer with a loan needs insurance on the house. The insurance company will ask three things about it. Get the answers ready.",
      blocks: [
        p(
          "Picture a buyer who loves the house. Their lender says, get insurance first.",
          "The insurance company says, first tell us about the roof.",
        ),
        sub("The roof’s age"),
        p(
          "Under Florida law, an insurer can’t turn down a house just because the roof is under 15 years old.",
          "If the roof is 15 or older, you can have it inspected. If the inspection says it has 5 or more years of life left, the insurer can’t turn it down for its age alone.",
        ),
        p(
          "Citizens is the state-backed insurer. It asks for proof of 5 more years once a shingle roof passes 25 years, or a tile or metal roof passes 50.",
          "Find the permit from the last roof job. Its date is the roof’s age.",
        ),
        sub("The wind mitigation report"),
        p(
          "This is a short state form. An inspector checks how the roof is attached, the shape of the roof, and whether the windows and doors have storm protection.",
          "Insurers must offer discounts for those features, so the report can lower the buyer’s premium.",
        ),
        p(
          "The form is good for up to five years, as long as the house hasn’t changed.",
          "A licensed home inspector, contractor, engineer or architect can do it.",
        ),
        sub("The four-point inspection"),
        p(
          "It covers four things: the roof, the electrical system, the plumbing, and the heating and air.",
          "Citizens asks for one on any house more than 20 years old, and the report has to be less than a year old.",
        ),
        p("Having these three answers ready removes three surprises later."),
        {
          kind: "figure",
          eyebrow: "The insurance questions",
          title: "Three questions a buyer’s insurance company asks about a house",
          reading: "Get a yes on each one before the listing goes live, or know why not.",
          figure: {
            type: "questions",
            answers: ["Yes", "No"],
            items: [
              {
                question: "Is the roof under 15 years old, or does an inspection show 5 more years of life?",
                note: "Florida law stops an insurer from turning down the house for roof age alone when either is true.",
              },
              {
                question: "Is there a wind mitigation report?",
                note: "The state form, OIR-B1-1802. It’s good for up to five years if the house hasn’t changed.",
              },
              {
                question: "Is there a four-point inspection?",
                note: "Roof, electrical, plumbing, and heating and air. Citizens asks for one on homes more than 20 years old, dated within the last year.",
              },
            ],
          },
          note: "These are plain-language questions, not a form. Each insurance company has its own list.",
          source: {
            label: "Florida Statutes 627.7011(5), 627.0629 and 627.711; Florida Office of Insurance Regulation, Wind mitigation resources; Citizens, Inspections and four-point inspection questions",
            href: OIR_WIND,
          },
        },
      ],
      sources: [S.roof, S.windCredits, S.windForm, S.oir, S.citizensForm, S.citizens, S.citizensFaq, S.practice],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "check-the-permits",
      title: "Check the permits before the buyer does",
      lead: "If work was done on the house, the county should have a permit for it. Look it up now, because the buyer’s side will.",
      blocks: [
        p(
          "Picture a house with a new screened porch. The seller had it built five years ago.",
          "The buyer’s inspector asks, was it permitted? If no one knows, the sale waits while someone finds out.",
        ),
        p(
          "Both counties let you search permits online for free. Type in the address.",
          "You’ll see each permit, what it was for and its status.",
        ),
        p(
          "Look for two things. Work you had done with no permit on file. And permits that were opened but never finished.",
          "If you find either one, tell us. The fix is often simple, but it takes time, so it belongs in the eight weeks and not in the contract period.",
        ),
        p("If the house is inside a city, the city may keep the records instead. The City of Sarasota has its own search. Ask us which site to use."),
        {
          kind: "figure",
          eyebrow: "Where to look",
          title: "Three places to look up a permit",
          reading: "Pick the one for where the house is. Type in the address.",
          figure: {
            type: "map-callout",
            places: [
              {
                name: "Manatee County permit search",
                covers: "Manatee County",
                body: "Search building permits by address on the county’s portal. You can look without an account.",
                href: MANATEE_PERMITS,
                cta: "Open Manatee’s portal",
              },
              {
                name: "Sarasota County permit search",
                covers: "Sarasota County",
                body: "Search building permits on the county’s portal. You can look without an account.",
                href: SARASOTA_CO_PERMITS,
                cta: "Open the county’s portal",
              },
              {
                name: "City of Sarasota permit search",
                covers: "City of Sarasota",
                body: "Search by address, owner or contractor. Some permits from before 1997 aren’t online.",
                href: SARASOTA_CITY_PERMITS,
                cta: "Open the city’s search",
              },
            ],
          },
          note: "If the house is inside another city, ask us which site to use.",
          source: { label: "Manatee County, Apply, search and manage building permits; Sarasota County, Accela Citizen Access; City of Sarasota, Building permit lookup", href: MANATEE_PERMITS_PAGE },
        },
      ],
      sources: [S.manateePermits, S.sarasotaCoPermits, S.cityPermits, S.practice],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "gather-the-papers",
      title: "Gather the papers",
      lead: "A sale runs on paper. Some of it you already have. Some of it takes days to get, so start in week one.",
      blocks: [
        p(
          "Start with what’s in the file drawer. The deed. The survey from when you bought. Your title insurance policy.",
          "Warranties for the roof, the air conditioner and the appliances. And the permit from the last roof job.",
        ),
        p(
          "Then the papers the law requires. Florida law says a seller must give the buyer a flood form at or before the time the contract is signed.",
          "It asks three yes-or-no questions about flooding and flood claims while you owned the house. Our flood guide explains it.",
        ),
        p(
          "Florida’s courts also say a seller must tell the buyer about problems the seller knows of. That means problems that affect the value, and that a buyer couldn’t easily see.",
          "We’ll give you a disclosure form to fill out. Answer it fully.",
        ),
        p(
          "If the house is in a homeowners association, the buyer gets a disclosure summary before signing.",
          "If it’s a condo, the buyer gets the condo documents. Then the buyer has seven days to back out, not counting weekends and holidays.",
        ),
        def(
          "Estoppel certificate",
          "The association’s signed statement of what you owe it, and of any fees or approvals that come with a sale. The law gives the association 10 business days to issue it once it’s asked, so it gets ordered early.",
          S.hoaEstoppel,
        ),
        p("If you have an elevation certificate, find it. It’s the form that shows how high the house sits. FEMA says a former owner or the local floodplain office may have one."),
        {
          kind: "figure",
          eyebrow: "The papers",
          title: "The papers to gather, and who has them",
          reading: "Tick each one as you find it. The last three take days, so ask for them in week one.",
          figure: {
            type: "checklist",
            items: [
              { text: "The deed, the survey and your title policy", detail: "From when you bought. The title company will want them." },
              { text: "Warranties, and the permit from the last roof job", detail: "The roof permit’s date is the roof’s age." },
              { text: "The elevation certificate, if there is one", detail: "A former owner or the county may have one. Our flood guide explains it." },
              { text: "The flood form", detail: "Three yes-or-no questions. The buyer gets it at or before the contract." },
              { text: "The seller’s disclosure", detail: "Problems you know of that a buyer couldn’t easily see. Florida’s courts say you must tell them." },
              { text: "The association’s disclosure summary, or the condo documents", detail: "An HOA buyer gets the summary before signing. A condo buyer gets the documents, and has seven days to think." },
              { text: "The estoppel certificate", detail: "The association’s statement of what you owe. The law gives it 10 business days." },
              { text: "A wind mitigation report and a four-point inspection", detail: "See section 03. Order them if you don’t have current ones." },
            ],
          },
          source: {
            label: "Florida Statutes 689.302, 720.401, 718.503(2), 720.30851 and 718.116(8); Johnson v. Davis (Fla. 1985); FEMA, Understanding elevation certificates",
            href: FS_689_302,
          },
        },
      ],
      sources: [S.flood, S.disclosure, S.hoaDisclosure, S.condoDocs, S.hoaEstoppel, S.condoEstoppel, S.fema, S.practice],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "set-the-price",
      title: "Set the price",
      lead: "The first price is the one that matters most. We set it from what sold near you, not from what’s for sale.",
      blocks: [
        p(
          "Picture two houses on the same street. One is for sale at a high price and has sat for months. The other sold last month.",
          "Which one tells you what your house is worth? The one that sold.",
        ),
        p("Don’t price to the listing next door. Price to the sale two doors down."),
        p(
          "We look at what sold in the last few months. How close it is, how much it’s like your house, and how long it took.",
          "Then we show you the numbers and the price we’d set, and why.",
        ),
        p(
          "We don’t price from online estimates. They haven’t seen the inside.",
          "You can look at the sales yourself. Our sold search shows what closed near an address.",
        ),
        {
          kind: "figure",
          eyebrow: "What sets the price",
          title: "What we look at, and what we set aside",
          reading: "The left side is what we use. The right side is what we set aside.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "We look at",
                title: "What sold near you",
                items: [
                  "Homes that sold in the last few months",
                  "How close they are, and how much like yours",
                  "How long each one took to sell",
                  "What each one first asked, and what it got",
                ],
              },
              {
                eyebrow: "We set aside",
                title: "What hasn’t sold",
                items: ["The asking price next door", "Online estimates", "What you paid, and what you’ve spent"],
              },
            ],
          },
          source: { label: "Our practice, from the way we price a listing", note: "not a rule" },
          tool: { tool: "sold", cta: "See what sold near you" },
        },
      ],
      sources: [S.practice],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "staging-photos-and-listing-day",
      title: "Staging, photos and listing day",
      lead: "The last two weeks are about how the house looks in pictures. The photos are the first showing.",
      blocks: [
        p(
          "In week seven, we stage. That means clearing the counters, moving some furniture out, and setting each room so a camera can see the space.",
          "A staged room isn’t fancy. It’s just clear.",
        ),
        p(
          "In week eight, the photographer comes. Late afternoon is a good time for the shoot, when the light is warm and soft.",
          "The video walk-through is shot at the same time.",
        ),
        p("Then the listing goes live, with the photos, the papers and the price all ready. That’s what the eight weeks were for."),
        {
          kind: "figure",
          eyebrow: "The last week",
          title: "Before the photographer comes",
          reading: "Do these in the week before the shoot.",
          figure: {
            type: "checklist",
            items: [
              { text: "Finish the paint and the repairs", detail: "Touch up the spots the first walk found." },
              { text: "Clear the counters and the floors", detail: "Less in every room. The camera needs to see the space." },
              { text: "Move out what we agreed to move out", detail: "Furniture that crowds a room, and anything personal." },
              { text: "Clean the windows, the pool and the pool cage", detail: "Water shows up in every photo of the back of the house." },
              { text: "Paint the front door", detail: "It’s the first thing a buyer touches, and it’s in the first photo." },
              { text: "On the day, turn on every light and open every blind", detail: "The photographer will tell us the time." },
            ],
          },
          source: { label: "Our practice, from the way we prepare a house for photos", note: "not a rule" },
          tool: { tool: "contact", cta: "Tell us your date" },
        },
      ],
      sources: [S.practice],
    },
  ],

  onOnePage: {
    title: "Your plan on one page",
    reading: "Fill in the right side. Count back from your listing date.",
    rows: [
      { label: "Listing date", value: "The day it goes live" },
      { label: "First walk with us", value: "About eight weeks before" },
      { label: "The three things to fix", value: "From the first walk" },
      { label: "Photographer booked for", value: "Book it in week one" },
      { label: "Roof age, from the permit", value: "Years" },
      { label: "Wind mitigation report", value: "Date, within five years" },
      { label: "Four-point inspection", value: "Date, within a year" },
      { label: "Permits", value: "All closed, or what’s open" },
      { label: "Estoppel certificate ordered", value: "Date; 10 business days" },
      { label: "The price", value: "From what sold near you" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Tell us when you’d like to list.",
    body: "We’ll count back eight weeks, walk the house with you and make the list. If you’d rather start on your own, this guide is the order we’d do it in.",
    cta: "Set a date",
    tool: "contact",
  },
};
