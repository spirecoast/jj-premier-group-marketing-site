import { img } from "@/lib/content/seed/helpers";
import type { Block, Guide, Source } from "./types";

/**
 * Selling a home you don't live in, explained.
 *
 * Written plainly on purpose, to the template in docs/GUIDES.md: short
 * sentences, everyday words, one idea at a time, and every official term
 * explained the first time it appears. scripts/check-guides.ts measures the
 * reading grade of the running text and fails the build if it drifts up.
 *
 * No links inside the paragraphs. Each figure carries one source line and
 * each section lists its sources at the foot. The facts are the ones the
 * October 2, 2026 fact check verified against the cited pages. How we run a
 * sale for an owner who is away (the keys, the showings, the weekly report)
 * is our own practice and is labelled as such.
 */

const CHECKED = "checked October 2, 2026";

/* ---- URLs, named once ------------------------------------------------------ */

const FS_668_50 = "https://www.flsenate.gov/Laws/Statutes/2026/668.50";
const FS_117_265 = "https://www.flsenate.gov/Laws/Statutes/2026/117.265";
const FS_117_285 = "https://www.flsenate.gov/Laws/Statutes/2026/117.285";
const FS_689_01 = "https://www.flsenate.gov/Laws/Statutes/2026/689.01";
const FS_695_03 = "https://www.flsenate.gov/Laws/Statutes/2026/695.03";
const FS_695_26 = "https://www.flsenate.gov/Laws/Statutes/2026/695.26";
const FS_709_2105 = "https://www.flsenate.gov/Laws/Statutes/2026/709.2105";
const FS_709_2104 = "https://www.flsenate.gov/Laws/Statutes/2026/709.2104";
const FS_709_2109 = "https://www.flsenate.gov/Laws/Statutes/2026/709.2109";
const FS_709_2119 = "https://www.flsenate.gov/Laws/Statutes/2026/709.2119";
const FS_736_0816 = "https://www.flsenate.gov/Laws/Statutes/2026/736.0816";
const FS_736_1017 = "https://www.flsenate.gov/Laws/Statutes/2026/736.1017";
const FS_733_613 = "https://www.flsenate.gov/Laws/Statutes/2026/733.613";
const FS_196_011 = "https://www.flsenate.gov/Laws/Statutes/2026/196.011";
const FLA_BAR_PROBATE = "https://www.floridabar.org/public/consumer/pamphlet026/";
const III_VACANCY = "https://www.iii.org/blog/when-no-ones-home-understanding-roleof-vacancy-insurance/";
const NAIC_MOVE = "https://content.naic.org/article/consumer-insight-leaving-home-insurance-considerations-move";
const IRS_FIRPTA = "https://www.irs.gov/individuals/international-taxpayers/firpta-withholding";
const IRS_FIRPTA_EXCEPTIONS = "https://www.irs.gov/individuals/international-taxpayers/exceptions-from-firpta-withholding";

/* ---- Sources, named once --------------------------------------------------- */

const src = (label: string, href?: string, note?: string): Source => ({ label, href, note });

const S = {
  practice: src("JJ Premier Group, how we run a sale for an owner who is away (our practice)", undefined, "the keys, the showings, the weekly report and the timeline are our own practice, not a rule"),
  esign: src("Florida Statutes 668.50, Uniform Electronic Transaction Act, subsections (5) and (7)", FS_668_50),
  ron: src("Florida Statutes 117.265, Online notarization procedures", FS_117_265),
  ronWitness: src("Florida Statutes 117.285, Supervising the witnessing of electronic records", FS_117_285),
  deed: src("Florida Statutes 689.01, How real estate conveyed", FS_689_01),
  ack: src("Florida Statutes 695.03, Acknowledgment and proof, subsections (1) to (3)", FS_695_03),
  record: src("Florida Statutes 695.26, Requirements for recording instruments affecting real property", FS_695_26),
  poaExec: src("Florida Statutes 709.2105, Qualifications of agent; execution of power of attorney", FS_709_2105),
  poaDurable: src("Florida Statutes 709.2104, Durable power of attorney", FS_709_2104),
  poaEnds: src("Florida Statutes 709.2109, Termination or suspension of power of attorney", FS_709_2109),
  poaAccept: src("Florida Statutes 709.2119, Acceptance of and reliance upon power of attorney", FS_709_2119),
  trustPowers: src("Florida Statutes 736.0816, Specific powers of trustee", FS_736_0816),
  trustCert: src("Florida Statutes 736.1017, Certification of trust", FS_736_1017),
  probate: src("The Florida Bar, Probate in Florida (consumer pamphlet)", FLA_BAR_PROBATE),
  prSale: src("Florida Statutes 733.613, Personal representative’s right to sell real property", FS_733_613),
  homestead: src("Florida Statutes 196.011(10)(a), the duty to tell the property appraiser when an exemption no longer applies", FS_196_011),
  iii: src("Insurance Information Institute, When no one’s home: understanding the role of vacancy insurance, June 3, 2025", III_VACANCY),
  naic: src("National Association of Insurance Commissioners, Leaving home: insurance considerations for a move", NAIC_MOVE),
  irs: src("IRS, FIRPTA withholding", IRS_FIRPTA),
  irsExceptions: src("IRS, Exceptions from FIRPTA withholding", IRS_FIRPTA_EXCEPTIONS),
};

/* ---- Block helpers --------------------------------------------------------- */

const p = (...text: string[]): Block => ({ kind: "paragraph", segs: [text.join(" ")] });
const def = (term: string, definition: string, source?: Source): Block => ({ kind: "definition", term, definition, source });
const sub = (text: string): Block => ({ kind: "subhead", text });

/* ---- The guide ------------------------------------------------------------- */

export const SELLING_FROM_AWAY_GUIDE: Guide = {
  slug: "selling-a-home-you-dont-live-in",
  title: "Selling a home you don’t live in",
  promise: "How a sale runs when you’re away, what you can sign from where you are, and what the title company will ask for.",
  howToUse: [
    "Read this guide once, start to finish. Then use the checklist at the end in the weeks before the listing goes live.",
    "Laws and forms change. Each part of this guide says where its facts come from. Before you count on them for your sale, check with the title company and, if you need one, a lawyer.",
  ],
  questions: ["Who has the keys?", "What can you sign from where you are?", "Whose name is on the deed?"],
  cover: img("library/moment-contract", "A contract on a kitchen island"),
  author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
  publishedAt: "2026-07-22",
  updatedAt: "2026-10-02",
  checked: CHECKED,

  sections: [
    /* ---- 01 ---------------------------------------------------------------- */
    {
      id: "what-is-different",
      title: "What’s different when you’re away",
      lead: "The sale runs the same way it would if you were here. A few parts need a plan, and this guide covers each one.",
      blocks: [
        p(
          "Picture a house on a canal in Bradenton. The owner is a thousand miles away.",
          "The house still has to be shown, inspected, photographed and sold.",
        ),
        p(
          "Some owners move before the house sells. Some are only here part of the year.",
          "Some are settling an estate.",
        ),
        p(
          "The sale runs the same way. The house gets shown. A buyer makes an offer. The papers get signed, and the money is sent to you.",
          "What changes is who does what, and where.",
        ),
        p(
          "We do the parts that need a person at the house. You do the parts that need the owner, from wherever you are.",
          "Being away shouldn’t mean knowing less. We can send you a written report every week.",
        ),
        {
          kind: "figure",
          eyebrow: "Who does what",
          title: "What happens at the house, and what happens where you are",
          reading: "Read each side. The left side is our job. The right side is yours, and none of it needs a trip.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "At the house, we",
                title: "Handle the parts that need a person here",
                items: [
                  "Hold the keys and set the rules for showings",
                  "Check the house after each showing",
                  "Meet the photographer, the inspector and the appraiser",
                  "Send you a written report every week",
                ],
              },
              {
                eyebrow: "Where you are, you",
                title: "Handle the parts that need the owner",
                items: [
                  "Sign the listing papers online",
                  "Read the weekly report and the offers",
                  "Decide on the price and the offers",
                  "Sign the closing papers in front of a notary",
                ],
              },
            ],
          },
          note: "The left side is how we work. The right side follows Florida’s signing rules, which sections 03 and 04 explain.",
          source: { label: "Our practice; the signing rules come from Florida Statutes 668.50, 689.01 and 695.03, cited in sections 03 and 04", href: FS_668_50 },
        },
        p(
          "Here’s what the weekly report holds. Who came to see the house, and what they said. What sold on the street, and our read on it.",
          "When an offer comes in, you get it the same way, with our advice and the reason for it.",
        ),
      ],
      sources: [S.practice, S.esign, S.ack],
    },

    /* ---- 02 ---------------------------------------------------------------- */
    {
      id: "the-keys-and-the-empty-house",
      title: "The keys and the empty house",
      lead: "Someone has to hold the keys, watch the house and keep the air running. Here’s what we do, and the two calls you should make.",
      blocks: [
        p(
          "We can hold the keys, set the rules for showings and check the house after each one.",
          "If the house is empty, we can make sure the air conditioning stays on.",
        ),
        p("If the house is furnished, we tell you what to leave and what to clear before the photos. An empty room and a full one each need a plan."),
        p(
          "Now the two calls. First, call your insurance company. Most homeowners policies change what they cover once a house sits empty for a month or two.",
          "Tell them the house is empty and ask what to do. Some will add a vacancy endorsement, which is a short add-on to the policy.",
        ),
        p(
          "Second, if you’ve moved away for good, call the property appraiser. Florida gives a tax break, called the homestead exemption, to a home you live in.",
          "The law says to tell the property appraiser when something changes that affects it. If you don’t, you can owe back taxes plus a penalty.",
        ),
        {
          kind: "figure",
          eyebrow: "Before you leave",
          title: "Six things to settle before you leave the house",
          reading: "Go in order. The first three we do with you. The last three are calls you make.",
          figure: {
            type: "checklist",
            items: [
              { text: "Give us a set of keys and the alarm code", detail: "We hold them, set the rules for showings and check the house after each one." },
              { text: "Leave the air conditioning on", detail: "An empty house still needs the air running. We check it when we’re there." },
              { text: "Tell us what stays and what goes", detail: "If the house is furnished, we’ll say what to leave for the photos." },
              { text: "Call your insurance company", detail: "Say the house is empty, and ask what changes. Many policies cover less after a month or two." },
              { text: "Call the property appraiser if you’ve moved for good", detail: "The homestead exemption is for a home you live in. The law says to report the change." },
              { text: "Tell us your travel dates", detail: "We set the timeline around them, so a signing never falls on a travel day." },
            ],
          },
          source: {
            label: "Our practice; Insurance Information Institute, When no one’s home (June 3, 2025); National Association of Insurance Commissioners, Leaving home; Florida Statutes 196.011(10)(a)",
            href: III_VACANCY,
          },
        },
      ],
      sources: [S.practice, S.iii, S.naic, S.homestead],
    },

    /* ---- 03 ---------------------------------------------------------------- */
    {
      id: "what-you-can-sign-from-where-you-are",
      title: "What you can sign from where you are",
      lead: "Most of the papers can be signed online. The deed is the exception. It needs witnesses and a notary, and there are two ways to do that from away.",
      blocks: [
        p(
          "Florida law treats an electronic signature like a signature in ink. So the listing agreement, the flood form, offers and the contract can all be signed on your phone or computer.",
          "We send them, you read them, and you sign. The one rule is that everyone agrees to sign that way. You do that once, up front.",
        ),
        p(
          "The deed is different. The deed is the paper that passes the house to the buyer.",
          "Florida law says you must sign it in front of two witnesses. A notary must sign it too, or the county won’t record it.",
        ),
        def(
          "Notary",
          "A person the state licenses to watch you sign a paper, check who you are, and stamp the paper to say so. Every state has them, and so do most countries.",
          S.ack,
        ),
        p("That leaves two ways to sign the deed from where you are. You can sign on paper in front of a notary near you, or you can sign by video with a Florida notary."),
        sub("On paper, with a notary near you"),
        p(
          "Florida accepts a notary from any state. It also accepts a notary from another country, if that notary has an official seal, and it accepts a U.S. consul there.",
          "The title company sends you the papers. You sign them in front of the notary and send them back.",
        ),
        sub("By video, with a Florida notary"),
        p(
          "Florida calls this online notarization. A Florida notary meets you on a video call, checks your ID on camera, and watches you sign on screen.",
          "You can be in any state or any country. The two witnesses can join by video too, but they must be in the United States.",
        ),
        p(
          "Which way? That depends on the title company. Some accept video signing and some don’t.",
          "We ask on the first call, and we’ll tell you plainly if a trip is needed.",
        ),
        {
          kind: "figure",
          eyebrow: "Three ways to sign",
          title: "How each paper gets signed when you’re away",
          reading: "Most papers use the first card. The deed and the closing papers use the second or the third.",
          figure: {
            type: "zone-cards",
            labels: { lender: "Can you do it from where you are?", build: "Which papers" },
            cards: [
              {
                code: "Online",
                name: "An e-signature",
                tone: "lower",
                means: "You sign on your phone or computer. No witness, no notary.",
                lender: { mark: "yes", text: "Yes, from anywhere" },
                build: "The listing agreement, the flood form, offers and the contract",
              },
              {
                code: "Video",
                name: "An online notary",
                tone: "high",
                means: "A Florida notary meets you on a video call, checks your ID and watches you sign.",
                lender: { mark: "maybe", text: "If the title company accepts it. Then from any state or country" },
                build: "The deed and the other closing papers",
              },
              {
                code: "Paper",
                name: "A notary near you",
                tone: "highest",
                means: "You sign on paper in front of a notary where you are, then send the papers back.",
                lender: { mark: "yes", text: "Yes, in any state, or abroad with a notary who has an official seal" },
                build: "The deed and the other closing papers",
              },
            ],
          },
          note: "Some papers, like a power of attorney, have extra rules for video signing. Ask the title company before you count on it.",
          source: { label: "Florida Statutes 668.50(7); 689.01; 695.03; 695.26; 117.265; 117.285", href: FS_117_265 },
        },
      ],
      sources: [S.esign, S.deed, S.ack, S.record, S.ron, S.ronWitness, S.practice],
    },

    /* ---- 04 ---------------------------------------------------------------- */
    {
      id: "if-someone-signs-for-you",
      title: "If someone signs for you",
      lead: "A power of attorney lets a person you trust sign in your place. It has to be done right, and the title company has to see it early.",
      blocks: [
        p(
          "Sometimes the owner can’t sign, even by video. A power of attorney solves that.",
          "It’s a paper that names a person, called your agent, to act for you.",
        ),
        p(
          "Florida has rules for it. You sign it in front of two witnesses and a notary. The agent must be 18 or older.",
          "Two more rules matter. It ends when you die. And if you want it to keep working if you ever can’t make decisions, it needs special words that make it durable.",
        ),
        p(
          "The title company will read it before closing. The law lets them ask your agent to sign a sworn statement that you’re alive and haven’t cancelled it.",
          "So have it drafted for this sale, and send it in weeks ahead, not the week of closing.",
        ),
        {
          kind: "figure",
          eyebrow: "The power of attorney",
          title: "Four questions the title company will ask about it",
          reading: "Each one needs a yes before closing day.",
          figure: {
            type: "questions",
            answers: ["Yes", "No"],
            items: [
              { question: "Was it signed in front of two witnesses and a notary?", note: "That’s what Florida law requires." },
              { question: "Does it let your agent sell this house?", note: "Have it drafted for this sale. A general form may not say enough." },
              { question: "Is it still in force?", note: "It ends when you die, and you can cancel it. The title company can ask your agent to swear it still stands." },
              { question: "Did the title company get it early?", note: "Send it weeks ahead, so there’s time to fix anything." },
            ],
          },
          note: "These are plain-language questions, not a form. The title company has its own list.",
          source: { label: "Florida Statutes 709.2105, 709.2104, 709.2109 and 709.2119; the fourth question is our practice", href: FS_709_2105 },
        },
      ],
      sources: [S.poaExec, S.poaDurable, S.poaEnds, S.poaAccept, S.practice],
    },

    /* ---- 05 ---------------------------------------------------------------- */
    {
      id: "trusts-and-estates",
      title: "When a trust or an estate owns the house",
      lead: "If the deed isn’t in your name, the title company needs the papers that show who has the power to sell. Get them in order before the listing goes live.",
      blocks: [
        p(
          "Look at the deed first. Sometimes the owner is a trust. Sometimes the owner has died, and the house is part of the estate.",
          "Each one adds a step, and each step takes time.",
        ),
        sub("If a trust owns the house"),
        p(
          "A trust is run by a trustee. Florida law lets a trustee sell trust property.",
          "To prove it, the trustee gives the title company a short paper called a certification of trust. It names the trustee and says what the trustee can do, without showing the whole trust.",
        ),
        p("The title company can also ask for the pages of the trust that name the trustee and give the power to sell. Keep them handy."),
        sub("If the owner has died"),
        p(
          "The house is part of the estate. A court names a person to handle the estate, called the personal representative.",
          "The court gives that person a paper called letters of administration. It proves they have the power to act.",
        ),
        p(
          "Can the personal representative sell the house? If the will says so, yes.",
          "If the will doesn’t say so, the court has to approve the sale first.",
        ),
        p(
          "Getting these papers in order before the listing goes live is the one thing that keeps a closing on time.",
          "We’ll tell you what the title company will ask for on the first call.",
        ),
        {
          kind: "figure",
          eyebrow: "Two kinds of owner",
          title: "What the title company asks for",
          reading: "Find the side that matches the deed. Each item is a paper to gather.",
          figure: {
            type: "decides",
            panels: [
              {
                eyebrow: "If a trust owns the house",
                title: "The trustee signs",
                items: [
                  "A certification of trust, which names the trustee and the trustee’s powers",
                  "The trust pages that name the trustee and allow a sale, if the title company asks",
                ],
              },
              {
                eyebrow: "If the owner has died",
                title: "The personal representative signs",
                items: [
                  "The court’s letters of administration, which name the personal representative",
                  "The will, if it gives the power to sell",
                  "A court order approving the sale, if the will doesn’t",
                ],
              },
            ],
          },
          source: { label: "Florida Statutes 736.0816 and 736.1017; The Florida Bar, Probate in Florida; Florida Statutes 733.613", href: FS_736_1017 },
        },
      ],
      sources: [S.trustPowers, S.trustCert, S.probate, S.prSale, S.practice],
    },

    /* ---- 06 ---------------------------------------------------------------- */
    {
      id: "a-tax-rule-for-sellers-from-other-countries",
      title: "A tax rule for sellers from other countries",
      lead: "A U.S. tax rule called FIRPTA can hold back part of the price at closing. It’s not a fee. It’s a deposit against your tax bill.",
      blocks: [
        p(
          "Picture a condo on Siesta Key. The seller lives in Canada and pays taxes there, not here.",
          "When the condo sells, the buyer must hold back 15 percent of the price and send it to the IRS.",
        ),
        p(
          "The IRS applies this rule to sellers it calls foreign persons. In plain words, that’s a seller who isn’t a U.S. citizen and isn’t a U.S. resident for tax purposes.",
          "If you’re not sure which you are, ask a tax advisor before you list.",
        ),
        p(
          "The money isn’t gone. It’s a deposit against the tax you may owe on the sale.",
          "You file a U.S. tax return, and the amount held back counts toward what you owe.",
        ),
        p(
          "There are exceptions. If the buyer will live in the home and the price is 300,000 dollars or less, nothing is held back.",
          "And you can ask the IRS ahead of time for a certificate that lowers the amount.",
        ),
        p(
          "The buyer’s side handles the paperwork at closing. You get a copy of the form that shows what was held back. Keep it for your tax return.",
          "If you’re a U.S. citizen or resident, you sign a short statement saying so, and the rule doesn’t apply.",
        ),
        {
          kind: "figure",
          eyebrow: "What the buyer holds back",
          title: "Where the price goes at closing under FIRPTA",
          reading: "Each bar is a share of the price. The hatched bar is the part the IRS holds until your tax return is filed.",
          figure: {
            type: "bar",
            unit: "percent of the price",
            max: 100,
            rows: [
              {
                label: "The rest of the price, usual rule",
                sub: "Before your other closing costs come out",
                segments: [{ label: "85 percent", value: 85, series: 0 }],
              },
              {
                label: "Held for the IRS, usual rule",
                sub: "Held until your tax return is filed",
                segments: [{ label: "15 percent", value: 15, series: 1, hatched: true }],
              },
              {
                label: "The whole price, home exception",
                sub: "The buyer will live there, and the price is 300,000 dollars or less. Other closing costs still come out",
                segments: [{ label: "100 percent", value: 100, series: 0 }],
              },
            ],
            legend: [
              { label: "Not held back", series: 0 },
              { label: "Held for the IRS", series: 1, hatched: true },
            ],
          },
          note: "The share is set by the IRS. The money held back counts toward the tax you may owe, and a withholding certificate from the IRS can lower it.",
          source: { label: "IRS, FIRPTA withholding; IRS, Exceptions from FIRPTA withholding", href: IRS_FIRPTA },
        },
      ],
      sources: [S.irs, S.irsExceptions],
    },

    /* ---- 07 ---------------------------------------------------------------- */
    {
      id: "before-the-listing-goes-live",
      title: "Before the listing goes live",
      lead: "Use this list in the weeks before the listing goes live. Most of it is one call or one email, and all of it is easier early.",
      blocks: [
        {
          kind: "figure",
          eyebrow: "The checklist",
          title: "Six things to settle before the listing goes live",
          reading: "Go in order. Each one is easier to fix in week one than in the week of closing.",
          figure: {
            type: "checklist",
            items: [
              { text: "Set up e-signing", detail: "Most papers get signed on your phone or computer. Agree to sign that way once, up front." },
              { text: "Ask the title company how you’ll sign the deed", detail: "By video with a Florida notary, or on paper with a notary near you." },
              { text: "If someone will sign for you, get the power of attorney drafted now", detail: "Two witnesses and a notary. Send it to the title company weeks ahead." },
              { text: "If a trust or an estate owns the house, gather its papers", detail: "The certification of trust, or the court’s letters and the will." },
              { text: "If you pay taxes in another country, ask about FIRPTA", detail: "The buyer may hold back 15 percent of the price for the IRS." },
              { text: "Tell us your travel dates", detail: "We set the timeline around them, not the other way around." },
            ],
          },
          source: { label: "Each step comes from the section it sums up. The sources are listed there and at the end of this guide", href: FS_668_50 },
          tool: { tool: "contact", cta: "Tell us where you are" },
        },
      ],
      sources: [S.esign, S.ron, S.poaExec, S.trustCert, S.probate, S.irs, S.practice],
    },
  ],

  onOnePage: {
    title: "Your sale on one page",
    reading: "Fill in the right side before the listing goes live.",
    rows: [
      { label: "Where you’ll be", value: "City and time zone" },
      { label: "Who has the keys", value: "Us, and anyone else" },
      { label: "Insurance company told the house is empty", value: "Date of the call" },
      { label: "Property appraiser told, if you moved for good", value: "Date of the call" },
      { label: "How you’ll sign the deed", value: "Video, or paper with a notary near you" },
      { label: "Power of attorney, if needed", value: "Drafted on; sent to the title company on" },
      { label: "Whose name is on the deed", value: "You, a trust or an estate" },
      { label: "Trust or estate papers", value: "Certification of trust, or letters and the will" },
      { label: "FIRPTA", value: "Applies or doesn’t; tax advisor asked" },
      { label: "Travel dates", value: "Days a signing can’t fall on" },
    ],
  },

  next: {
    eyebrow: "The next step",
    title: "Tell us where you are and where the house is.",
    body: "We’ll set the timeline around your travel, not the other way around, and we’ll say on the first call what the title company will ask for. If you’d rather start on your own, this guide is the order we’d do it in.",
    cta: "Tell us about the house",
    tool: "contact",
  },
};
