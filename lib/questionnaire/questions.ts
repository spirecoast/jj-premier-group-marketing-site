/**
 * The website questionnaire for Joelyn and Jessica: every section and question,
 * copied verbatim from the questionnaire artifact (its QDATA block). Wording and
 * ids are the record; answers in Postgres are keyed by `id`, so never rename one.
 *
 * Pure data, no server imports, so the client form, the compiled view, the
 * exports and the unit tests all read the same list. Helpers are in ./model.ts.
 */

export type QuestionType = "short" | "long" | "choice" | "promise" | "faq" | "email" | "url";

type Base = {
  /** Stable key, e.g. "joelyn.grew-up". Stored with every answer. */
  id: string;
  /** The question as asked. For promise and faq questions, the line quoted from the site. */
  q: string;
  /** Small caps label above the question (where on the site it comes from). */
  tag?: string;
  hint?: string;
};

export type ShortQuestion = Base & { type: "short" };
export type LongQuestion = Base & { type: "long" };
export type EmailQuestion = Base & { type: "email" };
export type UrlQuestion = Base & { type: "url" };
/** One of `options`, plus an optional free-text note when `note` names it. */
export type ChoiceQuestion = Base & { type: "choice"; options: string[]; note?: string };
/** A process promise from the home page: Yes / Change it / Drop it, plus a note. */
export type PromiseQuestion = Base & { type: "promise"; body: string };
/** A first-questions answer as it reads on the site now (`current`), with room to rewrite it. */
export type FaqQuestion = Base & { type: "faq"; current: string };

export type Question =
  | ShortQuestion
  | LongQuestion
  | EmailQuestion
  | UrlQuestion
  | ChoiceQuestion
  | PromiseQuestion
  | FaqQuestion;

export type Section = {
  id: string;
  /** Short name for the section index. */
  nav: string;
  title: string;
  intro?: string;
  /** "What the site says now", shown on parchment above the questions. */
  says?: { label: string; text: string[] };
  qs: Question[];
};

export const PROMISE_OPTIONS = ["Yes", "Change it", "Drop it"] as const;

/* QDATA-START */
export const SECTIONS: Section[] = [
  {
    id: "joelyn", nav: "Joelyn", title: "Joelyn, in your words",
    intro: "This one’s for Joelyn. The About page and your profile card are written from these answers.",
    says: { label: "Your bio on the site now", text: [
      "Joelyn is the mother in this mother and daughter team. She’ll walk you through the whole move, explain it twice if you’d like it twice, and tell you the truth about a house even when it isn’t what you were hoping to hear.",
      "Ask her anything about the process and you’ll get a straight answer."
    ] },
    qs: [
      { id: "joelyn.grew-up", type: "short", q: "Where did you grow up?", hint: "Leave it blank if you’d rather the site didn’t say." },
      { id: "joelyn.moved", type: "short", q: "What year did you move to the Lakewood Ranch, Sarasota and Bradenton area?", hint: "If you’ve always lived here, say so." },
      { id: "joelyn.licensed", type: "short", q: "What year were you first licensed to sell real estate, and in which state?" },
      { id: "joelyn.license-no", type: "short", q: "What’s your Florida license number, as it reads on your DBPR record?", hint: "We keep it on file. The site doesn’t show license numbers." },
      { id: "joelyn.before", type: "long", q: "What did you do for work before real estate, if you’d like it on the site?" },
      { id: "joelyn.designations", type: "long", q: "Which designations or certifications do you hold? Write each one exactly as it’s printed on the certificate, with the year.", hint: "Write “none” if there aren’t any. Nothing goes on the site without the certificate on file." },
      { id: "joelyn.memberships", type: "long", q: "Which professional associations are you a member of? Write each name exactly as it’s printed on your card." },
      { id: "joelyn.areas", type: "long", q: "Which communities or kinds of property do you know best?", hint: "Name them the way you’d say them to a client." },
      { id: "joelyn.likes", type: "long", q: "Which part of the job do you like most?", hint: "One or two sentences is plenty." },
      { id: "joelyn.story", type: "long", q: "Tell one client story the site could use, without names: what they needed, what you did, and how it ended." },
      { id: "joelyn.story-ok", type: "choice", q: "Has that client said it’s fine to share the story, even without names?", options: ["Yes", "Not yet"], note: "Anything to leave out of it" },
      { id: "joelyn.one-line", type: "short", q: "How would you describe yourself in one line to someone you’ve just met?" },
      { id: "joelyn.never", type: "long", q: "Is there anything the site should never claim about you or say on your behalf?" },
      { id: "joelyn.bio-check", type: "long", q: "Read your bio above. What’s wrong in it, and what’s missing?" }
    ]
  },
  {
    id: "jessica", nav: "Jessica", title: "Jessica, in your words",
    intro: "This one’s for Jessica. Same questions, so the two profiles read as a pair.",
    says: { label: "Your bio on the site now", text: [
      "Jessica is the daughter, and she’s the one who’ll keep you posted at every step. She reads the contract, watches the dates, and tells you plainly where things stand, so you’re never guessing.",
      "If you want the short version, call Jessica. If you want the long version, she’ll give you that too."
    ] },
    qs: [
      { id: "jessica.grew-up", type: "short", q: "Where did you grow up?", hint: "Leave it blank if you’d rather the site didn’t say." },
      { id: "jessica.moved", type: "short", q: "What year did you move to the Lakewood Ranch, Sarasota and Bradenton area?", hint: "If you’ve always lived here, say so." },
      { id: "jessica.licensed", type: "short", q: "What year were you first licensed to sell real estate, and in which state?" },
      { id: "jessica.license-no", type: "short", q: "We have SL3658907 on file as your Florida license number. Is that current?", hint: "We keep it on file. The site doesn’t show license numbers." },
      { id: "jessica.before", type: "long", q: "What did you do for work before real estate, if you’d like it on the site?" },
      { id: "jessica.designations", type: "long", q: "Which designations or certifications do you hold? Write each one exactly as it’s printed on the certificate, with the year.", hint: "Write “none” if there aren’t any. Nothing goes on the site without the certificate on file." },
      { id: "jessica.memberships", type: "long", q: "Which professional associations are you a member of? Write each name exactly as it’s printed on your card." },
      { id: "jessica.areas", type: "long", q: "Which communities or kinds of property do you know best?", hint: "Name them the way you’d say them to a client." },
      { id: "jessica.likes", type: "long", q: "Which part of the job do you like most?", hint: "One or two sentences is plenty." },
      { id: "jessica.story", type: "long", q: "Tell one client story the site could use, without names: what they needed, what you did, and how it ended." },
      { id: "jessica.story-ok", type: "choice", q: "Has that client said it’s fine to share the story, even without names?", options: ["Yes", "Not yet"], note: "Anything to leave out of it" },
      { id: "jessica.one-line", type: "short", q: "How would you describe yourself in one line to someone you’ve just met?" },
      { id: "jessica.never", type: "long", q: "Is there anything the site should never claim about you or say on your behalf?" },
      { id: "jessica.bio-check", type: "long", q: "Read your bio above. What’s wrong in it, and what’s missing?" }
    ]
  },
  {
    id: "team", nav: "The team", title: "The two of you as a team",
    intro: "How the work actually splits, so the site describes it the way a client will see it.",
    says: { label: "What the site says now", text: [
      "Both of us, on every file. One of us is always reachable, and both of us know where your deal stands on any given day.",
      "Joelyn and Jessica both know your file. Call either of us and you’ll get an answer, not a call back later."
    ] },
    qs: [
      { id: "team.lead", type: "long", q: "When a new client calls, how do you decide which of you leads the file?" },
      { id: "team.split-buy", type: "long", q: "On a purchase, which parts does Joelyn usually handle, and which does Jessica?" },
      { id: "team.split-sell", type: "long", q: "On a listing, which parts does Joelyn usually handle, and which does Jessica?" },
      { id: "team.two-agents", type: "long", q: "The site says “two agents on every file.” What does that look like for a client in a normal week?", hint: "Who goes to showings, who reads the contract, who sends the updates." },
      { id: "team.either", type: "long", q: "The About page says “Call either of us and you’ll get an answer, not a call back later.” Is that how it works?" },
      { id: "team.phone", type: "short", q: "When someone calls (941) 907-1033, the main number on the site, whose phone rings first?" },
      { id: "team.voicemail", type: "short", q: "If nobody picks up, who calls back, and how soon?" },
      { id: "team.response", type: "long", q: "How fast will you reply to a new inquiry on a weekday? And in the evening or on a weekend?", hint: "This becomes a promise on the contact page, so pick what you can keep." },
      { id: "team.hours", type: "short", q: "Which days and hours are you available for calls and showings?" },
      { id: "team.mix", type: "long", q: "The site says you help buyers, sellers and investors. Is that the right order to list them in?" },
      { id: "team.wont", type: "long", q: "What won’t you do for a client, and what kinds of work do you refer to someone else?" },
      { id: "team.partners", type: "long", q: "Are there lenders, inspectors or title companies you usually recommend? Should the site name any of them?" }
    ]
  },
  {
    id: "promises", nav: "Process promises", title: "The process promises",
    intro: "The home page lists what a buyer and a seller get from you, step by step. Each one is a promise a client can hold you to. Mark each one, and if it needs changing, say it the way you’d say it to a client.",
    qs: [
      { id: "promise.buy-first-call", type: "promise", tag: "For a buyer · The first call", q: "Two questions before we look at anything", body: "When do you need to be in, and is there a house to sell first? Those two answers set the budget, the streets and which Saturday we start." },
      { id: "promise.buy-preapproval", type: "promise", tag: "For a buyer · The first call", q: "A pre-approval letter from a local lender", body: "Then a pre-approval letter from a local lender, because that’s the first thing a seller here reads." },
      { id: "promise.buy-vetting", type: "promise", tag: "For a buyer · Showings", q: "We go through the listings before you do", body: "We go through the listings before you do and tell you which ones we’d actually go and see. Flood zone, HOA, the age of the roof, before you get in the car." },
      { id: "promise.buy-video", type: "promise", tag: "For a buyer · Showings", q: "Video walk-throughs for buyers from away", body: "If you’re buying from away, we walk the house on video, slowly, and open the closets." },
      { id: "promise.buy-listing-agent", type: "promise", tag: "For a buyer · Offer", q: "We call the listing agent before we write", body: "We talk to the listing agent before we write anything, then write to what the street has sold for." },
      { id: "promise.buy-inspection", type: "promise", tag: "For a buyer · Inspection", q: "Inspection findings sorted three ways", body: "Inside the inspection period a licensed inspector goes through the house, and we sort what they find into cosmetic, ask the seller, and walk away." },
      { id: "promise.buy-updates", type: "promise", tag: "For a buyer · After every step", q: "A written update after every step", body: "A short note after every step: what happened, what’s next, and the date it happens. Escrow, appraisal, insurance, the walk-through. You never have to ask where things stand." },
      { id: "promise.sell-walk", type: "promise", tag: "For a seller · Day one", q: "Both of us walk every listing", body: "Both of us come to the house and walk it the way a buyer will: the roof, the water, which end of the street." },
      { id: "promise.sell-range", type: "promise", tag: "For a seller · That day or the next", q: "A written range, with the sales behind it", body: "You get the number in writing with the recent closed sales it came from, adjusted for the things that matter here. A number without the sales behind it is a guess, and we don’t send those." },
      { id: "promise.sell-prep", type: "promise", tag: "For a seller · The weeks before", q: "The preparation list", body: "A short list of what we’d change before the photos, in the order buyers notice: paint, light, the front door. A new kitchen often doesn’t pay for itself before you sell, and we’ll say so before you spend a dollar." },
      { id: "promise.sell-launch", type: "promise", tag: "For a seller · Going live", q: "Photos in the afternoon light, live on a Thursday", body: "Photos in the afternoon light, live on a Thursday, showings from Friday. Nothing goes live until the house is ready." },
      { id: "promise.sell-monday", type: "promise", tag: "For a seller · Every Monday", q: "The written report every Monday", body: "How many came through, what they said, and whether the number is right. In writing, every week the house is on the market." },
      { id: "promise.sell-offers", type: "promise", tag: "For a seller · At offers", q: "Offers side by side, then a recommendation", body: "Every offer laid out the same way: price, financing, deposit, inspection period, whether the buyer has a house to sell. The highest isn’t always the one to take, and we’ll tell you which one is and why." },
      { id: "promise.both-reachable", type: "promise", tag: "Both get", q: "Two agents on every file, one always reachable", body: "Both of us, on every file. One of us is always reachable, and both of us know where your deal stands on any given day." },
      { id: "promise.both-straight", type: "promise", tag: "Both get", q: "Straight answers, including the expensive parts", body: "The seawall, the roof, the flood zone, the kitchen that won’t pay for itself. If we’d wait, we’ll say so." },
      { id: "promise.both-tools", type: "promise", tag: "Both get", q: "Three free tools: Atlas, Encore and Tide", body: "Atlas, the map of every place in Lakewood Ranch, Sarasota and Bradenton. Encore, what’s on tonight and this weekend. Tide, one page a month on what the three markets did. Yours whether or not you ever call us." }
    ]
  },
  {
    id: "faq", nav: "First questions", title: "The questions people ask first",
    intro: "These are the answers on the home, buy and sell pages now. They’re accurate but they could be anyone’s. Tell us what you’d actually say across the table.",
    qs: [
      { id: "faq.home-sell-first", type: "faq", tag: "Home page", q: "Do I need to sell my current home before I buy?", current: "Usually not. A contract with post-closing occupancy of a few weeks is common on the Suncoast, and the standard Florida contract has a rider for it. We line up both closings on purpose." },
      { id: "faq.home-cost-sell", type: "faq", tag: "Home page", q: "What does it cost to sell a home in Florida?", current: "The documentary stamp tax on the deed at $0.70 per $100 of the price, which the seller pays by custom on this coast; the owner’s title policy, which depends on the county; and commission, which is negotiable and set in the listing agreement." },
      { id: "faq.home-flood", type: "faq", tag: "Home page", q: "Do I need flood insurance in Lakewood Ranch, Sarasota or Bradenton?", current: "If the home is in a FEMA special flood hazard area, zones AE or VE, and you have a mortgage, your lender will require it. In zone X it is optional, though quotes tend to be low and we often recommend it. We pull the flood map before you see the house." },
      { id: "faq.home-how-long", type: "faq", tag: "Home page", q: "How long does it take to buy a home here?", current: "Three to four months from the first call to keys is typical when there is no house to sell first. Contract to close is the fixed part: thirty to forty-five days financed and about fourteen for cash." },
      { id: "faq.home-areas", type: "faq", tag: "Home page", q: "Which areas does JJ Premier Group cover?", current: "Lakewood Ranch, Sarasota and Bradenton, Florida, as a mother and daughter team with Coldwell Banker Realty. Buyers, sellers and investors." },
      { id: "faq.buy-escrow", type: "faq", tag: "Buy page", q: "What is escrow, and where does my deposit go?", current: "A neutral third party, usually the title company, holds your deposit and the paperwork until both sides have done what they promised. Under the standard Florida contract the deposit is due within three days of the effective date, and if the deal ends for a reason the contract allows, the money comes back to you from escrow." },
      { id: "faq.buy-inspection", type: "faq", tag: "Buy page", q: "What gets inspected, and what happens if something is wrong?", current: "Inside the inspection period, fifteen days on the Florida AS IS contract unless we write in something shorter, a licensed inspector and a termite inspector go through the house, and on older homes we also order the four-point and wind mitigation reports your insurer will ask for. Then we sort the findings into cosmetic, ask the seller, and walk away. On an AS IS contract you can cancel inside the period and keep your deposit." },
      { id: "faq.buy-flood", type: "faq", tag: "Buy page", q: "Do I need flood insurance?", current: "If the house is in a FEMA special flood hazard area, zones AE and VE on this coast, and you have a mortgage, your lender will require it. In zone X it is optional, though we often recommend it because the quotes tend to come in low. A policy bought outside a closing takes thirty days to begin, and Florida sellers must disclose past flood claims in writing." },
      { id: "faq.buy-closing-costs", type: "faq", tag: "Buy page", q: "What do closing costs come to, and who pays what?", current: "Plan on roughly two to five percent of the price on top of the down payment: lender fees, the documentary stamp tax on the note, the intangible tax on the mortgage, prepaid taxes and insurance, and title. Who pays the owner’s title policy depends on the county, and everything is negotiable in the contract. You see the estimate before you sign anything." },
      { id: "faq.buy-timing", type: "faq", tag: "Buy page", q: "How long does it take, and when is the best time of year?", current: "Three to four months from the first call to keys is typical when there is no house to sell first. Contract to close is the fixed part: thirty to forty-five days financed and about fourteen for cash. Listings arrive in February and thin out by August, and hurricane season, June through November, can pause a closing when a storm is named." },
      { id: "faq.buy-offer", type: "faq", tag: "Buy page", q: "How do we write an offer that wins without overpaying?", current: "Price is one of five things a seller weighs, next to financing, deposit, inspection period and the closing date they need. We talk to the listing agent before we write anything, then we write to what the last sales on that street closed for, not the asking price." },
      { id: "faq.sell-number", type: "faq", tag: "Sell page", q: "How do you arrive at the number?", current: "Recent closed sales near you, adjusted for the things that matter here: the water, the flood zone, the year of the roof, and which end of the street. Then we walk your house the way a buyer will. You get the number and the sales behind it in writing. A comparative market analysis from a REALTOR is not an appraisal; the buyer’s lender orders that later." },
      { id: "faq.sell-prep", type: "faq", tag: "Sell page", q: "What should I do to the house before it goes on the market?", current: "Interior paint, updated light fixtures and a repainted front door are the cheapest changes buyers notice first. A new kitchen rarely returns its cost before you sell. Preparation takes about eight weeks and good photographers book early, so if you want to be live in March, start in October." },
      { id: "faq.sell-cost", type: "faq", tag: "Sell page", q: "What does it cost to sell?", current: "Three things on the closing statement: the Florida documentary stamp tax on the deed at $0.70 per $100 of the price, which the seller pays by custom on this coast; the owner’s title policy, which the seller customarily pays in Manatee County and the buyer pays in Sarasota County; and commission, which is negotiable and set in the listing agreement. Add a few hundred dollars of title and recording fees and prorated taxes or HOA dues." },
      { id: "faq.sell-when", type: "faq", tag: "Sell page", q: "When is the best time to list?", current: "Buyers who close in this market arrive in February and are mostly gone by May, so the strongest listings go live in late January or February. A house that is ready and priced to the comps sells in summer too. The first weekend matters more than the month, so nothing goes live until the house is ready." },
      { id: "faq.sell-after-offer", type: "faq", tag: "Sell page", q: "What happens after we accept an offer?", current: "The buyer has an inspection period, usually seven to fifteen days, then the appraisal, then the lender’s clear to close. Financed deals close in thirty to forty-five days, cash in about fourteen. Expect a request for a credit after the inspection, and expect us to say what is normal here and what is not." },
      { id: "faq.sell-sell-first", type: "faq", tag: "Sell page", q: "Do I need to sell before I buy?", current: "Usually it is a bridge of a few weeks, not a choice. A contract on your house with post-closing occupancy of up to sixty days is common here, and the standard Florida contract has a rider for it. We run both files from one desk so the closing dates line up on purpose." },
      { id: "faq.missing", type: "long", q: "Which questions do clients ask you first that aren’t on this list?", hint: "Write the question the way they say it." }
    ]
  },
  {
    id: "facts", nav: "Footer and legal", title: "Facts for the footer and legal pages",
    intro: "Some of these you’ll need to get from the brokerage. If you don’t know, write who would.",
    says: { label: "What the footer says now", text: [
      "Coldwell Banker Realty · Lakewood Ranch, FL · Information deemed reliable but not guaranteed · For consumers’ personal, non-commercial use · Equal Housing Opportunity"
    ] },
    qs: [
      { id: "facts.address", type: "long", q: "What’s the office street address, suite and ZIP, written exactly the way the brokerage writes it?", hint: "The footer shows only “Lakewood Ranch, FL” until we have it. Your Google Business Profile has to match it character for character." },
      { id: "facts.compliance-name", type: "short", q: "Who’s the brokerage compliance contact who’ll sign off on the site?" },
      { id: "facts.compliance-email", type: "email", q: "What’s that person’s email address?" },
      { id: "facts.broker", type: "short", q: "Who’s the broker of record for your office?" },
      { id: "facts.license-show", type: "choice", q: "The site shows no license numbers, by design. Florida’s rules allow that, but the brokerage has to confirm its own policy. What did the broker say?", options: ["Leave them off", "Show both numbers", "Haven’t asked yet"], note: "Anything the broker added" },
      { id: "facts.realtor-joelyn", type: "short", q: "Is Joelyn a current REALTOR® member, and through which local association?", hint: "The site titles both of you REALTOR®, and the title needs current membership." },
      { id: "facts.realtor-jessica", type: "short", q: "Is Jessica a current REALTOR® member, and through which local association?" },
      { id: "facts.equal-housing", type: "choice", q: "The footer reads “Equal Housing Opportunity” next to the Equal Housing logo. Has the compliance contact approved that?", options: ["Approved", "Not yet", "Wants changes"], note: "What they want changed" },
      { id: "facts.team-name", type: "choice", q: "Has the brokerage approved “JJ Premier Group” as the team name, written exactly that way?", options: ["Yes", "Not yet", "Approved with different wording"], note: "The approved wording" },
      { id: "facts.consent", type: "choice", q: "Has the compliance contact or an attorney reviewed the call and text consent wording on the site’s forms?", options: ["Yes", "Not yet"], note: "Who reviewed it, and when" },
      { id: "facts.legal-review", type: "short", q: "Who will review the privacy policy and terms of use before the “draft” label comes off?" }
    ]
  },
  {
    id: "tools", nav: "Accounts and tools", title: "Accounts and tools",
    intro: "These tell us how leads reach you and where the newsletters send from. Most take a minute of clicking in the Home Platform.",
    qs: [
      { id: "tools.zapier-conn", type: "choice", q: "In the Home Platform, does Zapier show up as a connected app?", options: ["Yes", "No", "Not sure where to look"], note: "Whose login it’s connected under" },
      { id: "tools.lead-owner", type: "short", q: "Which Home Platform account should new website leads go to?", hint: "Leads go into that person’s Contacts." },
      { id: "tools.marketing-center", type: "choice", q: "Does your Home Platform have a Marketing Center that can send an email to a list you import?", options: ["Yes, it sends to a list", "It has one, but not list sends", "No Marketing Center", "Not sure"], note: "Anything you noticed about it" },
      { id: "tools.lead-flows", type: "short", q: "In CRM settings, under Lead Flows, is there an email address that takes in leads? Paste it here, or write “none.”" },
      { id: "tools.platform-site", type: "url", q: "Does the Home Platform or Coldwell Banker give you a website or a listing search page of your own? Paste the link.", hint: "Write “none” if there isn’t one." },
      { id: "tools.mailbox", type: "choice", q: "Where do you read your cbrealty.com email?", options: ["Outlook (Microsoft 365)", "Gmail (Google)", "Not sure"] },
      { id: "tools.mailbox-it", type: "short", q: "Has the brokerage said whether Zapier may connect to your Outlook mailbox?", hint: "Their IT admin may need to approve it." },
      { id: "tools.registrar", type: "short", q: "Which company is jjpremiergroup.com registered with?" },
      { id: "tools.registrar-login", type: "short", q: "Who holds the login for that registrar account?" },
      { id: "tools.cloudflare", type: "short", q: "Who holds the login for the Cloudflare account that runs the domain’s settings?" },
      { id: "tools.listing-url", type: "url", q: "What’s the link to the page that shows your current listings?", hint: "It needs to open without a login." },
      { id: "tools.idx", type: "choice", q: "Has the broker been asked in writing for a Stellar MLS IDX feed?", options: ["Yes", "Not yet", "Not sure"], note: "The date you asked" },
      { id: "tools.gbp", type: "url", q: "What’s the link to your Google Business Profile?" },
      { id: "tools.gbp-review", type: "url", q: "What’s the review link from the profile’s “Get more reviews” button?" },
      { id: "tools.instagram", type: "url", q: "What’s the link to your Instagram profile?", hint: "Only profiles you keep up. The team’s profile if there is one, otherwise each of yours." },
      { id: "tools.facebook", type: "url", q: "What’s the link to your Facebook page?" },
      { id: "tools.youtube", type: "url", q: "What’s the link to your YouTube channel?" },
      { id: "tools.linkedin", type: "url", q: "What’s the link to your LinkedIn profile?" },
      { id: "tools.nextdoor", type: "url", q: "What’s the link to your Nextdoor business page?" },
      { id: "tools.zillow", type: "url", q: "What’s the link to your Zillow agent profile?" }
    ]
  },
  {
    id: "photos", nav: "Photos", title: "Photos",
    intro: "This form can’t take uploads. Give us file names or a link to a shared folder, and we’ll collect the files from there.",
    qs: [
      { id: "photos.current", type: "choice", q: "The site uses three photos of you now: Joelyn on a white background, Jessica on a white background, and the two of you together. Do you want to keep all three?", options: ["Keep all three", "Replace some"], note: "Which ones, and with what" },
      { id: "photos.allowed", type: "long", q: "Which other photos of you may the site use? Give the file names or paste a link to the folder." },
      { id: "photos.never", type: "long", q: "Are there photos of you that should never be used?" },
      { id: "photos.credit", type: "long", q: "Who took your photos, and do you have their permission to use them on a website?" },
      { id: "photos.bradenton", type: "long", q: "Please re-send the Bradenton photo. Paste a shared link, or give the file name and where you sent it." },
      { id: "photos.venues", type: "long", q: "Do you own photos of local venues the Encore pages could use? Which venues, and where are the files?", hint: "Without a venue photo, an event shows drawn artwork instead." },
      { id: "photos.places", type: "long", q: "Do you have neighborhood or street photos you took yourselves that the site may use? Where are they?" }
    ]
  },
  {
    id: "issues", nav: "Tide and Encore", title: "Tide and Encore",
    intro: "Tide is the one-page monthly note on what the three markets did. Encore is the weekly Monday list of what’s on. Both go out with your names on them.",
    qs: [
      { id: "issues.tide-1", type: "short", q: "What topic do you want covered in the first Tide?" },
      { id: "issues.tide-2", type: "short", q: "What topic do you want covered in the second Tide?" },
      { id: "issues.tide-3", type: "short", q: "What topic do you want covered in the third Tide?" },
      { id: "issues.encore", type: "long", q: "Which events or venues do you want Encore to feature?" },
      { id: "issues.off-limits", type: "long", q: "Is anything off-limits for either one?" },
      { id: "issues.from", type: "short", q: "Whose name should the emails come from?" },
      { id: "issues.start", type: "short", q: "When do you want the first Tide and the first Encore to go out?" }
    ]
  },
  {
    id: "else", nav: "Anything else", title: "Anything else",
    intro: "Last two. Anything goes.",
    qs: [
      { id: "else.wrong", type: "long", q: "Is there anything on the site now that’s wrong, or that you’d rather it didn’t say?" },
      { id: "else.other", type: "long", q: "Anything else we should know?" }
    ]
  }
];
/* QDATA-END */
