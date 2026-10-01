# Copy sweep (wave 3)

The client's four rules, applied to every user-facing string in `app`, `components` and `lib` (including the seed content). Strings only; no layout, component structure, image or section-order changes beyond the minimum JSX needed to remove a line.

1. **No "lands" as a verb.** Rewritten in plain speech ("comes out", "falls in", "arrive", "saved here"). Code comments untouched.
2. **No stacked comma fragments as sentences.** Every "phrase, phrase, phrase." (and the "Houses by day. Encore by night." style) is now a sentence with a verb. The client's own tagline, "Every move, expertly guided from start to finish.", is untouched. Noun-phrase labels, eyebrows, field placeholders that are only examples ("A place, a ZIP, a builder, an HOA"), source citations and data strings were left as labels.
3. **The flippant line under the home product band is gone**, together with its `site` import, and the Tide dateline caption reads "next issue".
4. **Invented personality lines on the team page are gone.** What's left in the bios is the facts the client gave: names, titles, brokerage, the mother-and-daughter line, the three markets. The bios read thin on purpose until the questionnaire comes back.

Counts: rule 1, 17 occurrences (16 distinct strings; the Tide caption sits in two files); rule 2, 124 rows below, 134 string occurrences once the rows shared by two files are counted twice; rule 3, 4 strings (the flippant line and the Tide caption, each in two files); rule 4, four invented lines removed from the two bios plus one invented paragraph on /about. Guide titles were left alone (the guide rewrite is coming separately); only their excerpts and three sentences inside bodies were touched, under rule 2.

## Every changed string

| Rule | File | Before | After |
| --- | --- | --- | --- |
| 1 | `app/(site)/blog/page.tsx` | It lands at the start of the month. | It comes out at the start of the month. |
| 1 | `app/(site)/thanks/[form]/page.tsx` | Encore lands every Monday. | Encore comes out every Monday. |
| 1+2 | `app/(site)/relocate/page.tsx` (description) | Six questions, no email, and a dated relocation plan: … the homestead cycle your move-in lands in, … Every rule with its source. | Six questions, no email, and you get a dated relocation plan: … the homestead cycle your move-in falls in, … Every rule comes with its source. |
| 1 | `components/encore/views.tsx` | Tap Save on any show and it lands here. | Tap Save on any show and it's saved here. |
| 1 | `components/letter-form.tsx` | You are on the list. The next report lands at the start of the month. | You are on the list. The next report comes out at the start of the month. |
| 1 | `components/letter-form.tsx` | You are on the list. Encore lands every Monday. | You are on the list. Encore comes out every Monday. |
| 1 | `lib/relocate/copy.ts` | …the HOA file before you land, walk the house on video… | …the HOA file before you arrive, walk the house on video… |
| 1 | `components/encore/visit-plan.tsx` (eyebrow) | Before you land | Before you arrive |
| 1 | `components/encore/visit-plan.tsx` | Tell us the dates and we'll have the showings lined up before you land. | Tell us the dates and we'll have the showings lined up before you arrive. |
| 1 | `lib/relocate/plan.ts` | …our planning rule, so an accepted offer lands on the dates below. | …our planning rule, so an accepted offer falls on the dates below. |
| 1 | `lib/relocate/plan.ts` | Moving in {date} lands in the {year} cycle. | Moving in {date} falls in the {year} cycle. |
| 1 | `lib/relocate/plan.ts` | …put them on your list for the month after you land. | …put them on your list for the month after you arrive. |
| 1 | `lib/relocate/plan.ts` | Your closing lands in hurricane season | Your closing falls in hurricane season |
| 1 | `lib/relocate/plan.ts` | If closing could land on or before January 1, the exemption would start a year sooner. | If closing could fall on or before January 1, the exemption would start a year sooner. |
| 1 | `app/portal/contacts/page.tsx` | New leads land here as soon as someone submits the contact form… | New leads show up here as soon as someone submits the contact form… |
| 1+3 | `components/home/variants/three-pictures.tsx`, `three-plain.tsx` (Tide caption) | the next report lands | next issue |
| 3 | `components/home/variants/three-pictures.tsx`, `three-plain.tsx` | One email, if you want it: Encore every Monday, Tide once a month. The boxes are further down. | (removed, with the now-unused `site` import) |
| 2 | `components/home/variants/three-pictures.tsx`, `three-plain.tsx` | Atlas, Encore and Tide. The map, the nights out, and the market, kept current. | Atlas is the map, Encore is the nights out and Tide is the market, and we keep all three current. |
| 2 | `components/home/letter-band.tsx` | The three markets, once a month, in plain language. | One page a month on the three markets, written in plain language. |
| 2 | `lib/site.ts` (Tide line) | What the three markets did last month, in plain language, and what it means for you. | What the three markets did last month and what it means for you, in plain language. |
| 2 | `lib/site.ts` (Atlas line) | Every place in Lakewood Ranch, Sarasota and Bradenton on one map, with the facts behind each one. | Every place in Lakewood Ranch, Sarasota and Bradenton is on one map, with the facts behind each one. |
| 2 | `app/(site)/thanks/[form]/page.tsx` (sell) | …the Tide archive is the place: what the three markets did, month by month, in plain language. | …the Tide archive is the place: it says what the three markets did each month, in plain language. |
| 2 | `app/(site)/thanks/[form]/page.tsx` (letter) | Tide goes out once a month. One page, written for you, about what happened on streets like yours and what it means. | Tide goes out once a month. It's one page, written for you, about what happened on streets like yours and what it means. |
| 2 | `app/(site)/thanks/[form]/page.tsx` (calendar) | The full week of shows, concerts and openings, in one email. | The full week of shows, concerts and openings comes in one email. |
| 2 | `app/(site)/thanks/[form]/page.tsx` | Fifteen minutes on the phone, at a time that suits you. | It's fifteen minutes on the phone, at a time that suits you. |
| 2 | `app/(site)/blog/page.tsx` (description) | Once a month, one page on what happened in Lakewood Ranch, Sarasota and Bradenton and what it means for you. Plus guides on flood zones, timing and selling. | Once a month, Tide gives you one page on what happened in Lakewood Ranch, Sarasota and Bradenton and what it means for you, plus guides on flood zones, timing and selling. |
| 2 | `app/(site)/blog/page.tsx` | One page on Lakewood Ranch, Sarasota and Bradenton: what moved, what it means for you, and what we'd do about it. | It's one page on Lakewood Ranch, Sarasota and Bradenton: what moved, what it means for you, and what we'd do about it. |
| 2 | `app/(site)/blog/page.tsx`, `app/(site)/blog/[slug]/page.tsx` (band title) | Once a month, one page, written for you. | Once a month you get one page, written for you. |
| 2 | `app/(site)/calendar/page.tsx` (description) | Tonight, this weekend and the whole season: theater, concerts, … by day, week and month. The Encore Arts Calendar from JJ Premier Group. | Encore lists tonight, this weekend and the whole season: theater, concerts, … by day, week and month. It is the arts calendar from JJ Premier Group. |
| 2 | `app/(site)/calendar/page.tsx` | The week's shows, concerts and openings, in one email every Monday. | The week's shows, concerts and openings come in one email every Monday. |
| 2 | `app/(site)/calendar/plan/page.tsx` (h1) | Houses by day. Encore by night. | Showings fill the day. Encore fills the evening. |
| 2 | `app/(site)/listings/page.tsx` | Two questions, then the homes worth seeing. | Two questions, and then we send the homes worth seeing. |
| 2 | `app/(site)/listings/page.tsx` | Flood zone, HOA, the age of the roof, what the street's been doing. You get the short list… | We check the flood zone, the HOA, the age of the roof and what the street's been doing. You get the short list… |
| 2 | `app/(site)/listings/page.tsx` | The place, the budget, and anything that matters to you. You'll hear back… | Tell us the place, the budget and anything that matters to you. You'll hear back… |
| 2 | `app/(site)/listings/[slug]/page.tsx` | Spoken for, for now. | It's spoken for, for now. |
| 2 | `app/(site)/buy/page.tsx` (description) | …Escrow, inspections, flood insurance and closing costs, explained the way a friend would. | …Escrow, inspections, flood insurance and closing costs are explained the way a friend would. |
| 2 | `app/(site)/buy/page.tsx` | Flood zone, HOA, the age of the roof and what the street's been selling for, before you get in the car. | You'll know the flood zone, the HOA, the age of the roof and what the street's been selling for before you get in the car. |
| 2 | `app/(site)/buy/page.tsx` | Inspection first, then the appraisal, then insurance, then the closing date we picked together on day one. | Inspection comes first, then the appraisal, then insurance, then the closing date we picked together on day one. |
| 2 | `app/(site)/buy/page.tsx` | Four steps, from the first call to the keys. | There are four steps, from the first call to the keys. |
| 2 | `app/(site)/buy/page.tsx`, `components/encore/visit-plan.tsx` (placeholder) | Where you're looking, what you need, and whether there's a house to sell first. | Tell us where you're looking, what you need, and whether there's a house to sell first. |
| 2 | `lib/hubs/page.tsx` (placeholder) | Where in {market} you're looking, what you need, and whether there's a house to sell first. | Tell us where in {market} you're looking, what you need, and whether there's a house to sell first. |
| 2 | `lib/hubs/page.tsx` | Buying here, and selling here. | Here is how buying and selling work here. |
| 2 | `app/(site)/sell/page.tsx` (description) | The sold price, not the list. A number with the four comparable sales behind it, … | We price to the sold price, not the list. You get a number with the four comparable sales behind it, … |
| 2 | `app/(site)/sell/page.tsx` (h1) | The sold price, not the list. | We price to the sold price, not the list. |
| 2 | `app/(site)/sell/page.tsx` (step title) | Paint, light, the front door | Paint, light and the front door come first |
| 2 | `app/(site)/sell/page.tsx` | Photos in the afternoon light, live on a Thursday, showings from Friday. | Photos are taken in the afternoon light, the listing goes live on a Thursday, and showings start Friday. |
| 2 | `app/(site)/sell/page.tsx` | Every offer laid out side by side: … Then inspection, appraisal and closing. | Every offer is laid out side by side: … Then come inspection, appraisal and closing. |
| 2 | `app/(site)/sell/page.tsx` (FAQ) | Recent closed sales near you, adjusted for the things that matter here: … | We start with recent closed sales near you, adjusted for the things that matter here: … |
| 2 | `app/(site)/sell/page.tsx` (FAQ) | Four closed sales from the last six months, inside half a mile, adjusted for … | We pull four closed sales from the last six months, inside half a mile, adjusted for … |
| 2 | `app/(site)/sell/page.tsx` (FAQ) | Three things on the closing statement: the Florida documentary stamp tax … | There are three things on the closing statement: the Florida documentary stamp tax … |
| 2 | `app/(site)/sell/page.tsx` (FAQ) | Three things, all on the closing statement. The state documentary stamp tax on the deed, … The owner's title policy, … And commission, which is negotiable … | There are three things, all on the closing statement. The first is the state documentary stamp tax on the deed, … The second is the owner's title policy, … The third is commission, which is negotiable … |
| 2 | `app/(site)/sell/page.tsx` | Four steps, from the walk-through to the closing table. | There are four steps, from the walk-through to the closing table. |
| 2 | `app/(site)/sell/page.tsx` (eyebrow) | The public record, first | The public record first |
| 2 | `app/(site)/sell/page.tsx` (eyebrow) | Sellers, in their words | Sellers in their words |
| 2 | `app/(site)/sell/page.tsx` | The number, the cost, and the calendar. | They ask about the number, the cost and the calendar. |
| 2 | `app/(site)/sell/page.tsx`, `components/home-value/copy.ts` (placeholder) | The year of the roof, anything you already know needs doing, and whether there's a house to buy next. | Tell us the year of the roof, anything you already know needs doing, and whether there's a house to buy next. |
| 2 | `app/(site)/sell/net-proceeds/page.tsx` | Every rate on the sheet, and the page it was read from. | Here is every rate on the sheet, and the page it was read from. |
| 2 | `app/(site)/sell/net-proceeds/opengraph-image.tsx` | Doc stamps, title, prorations, payoff: the sheet before the listing. | One sheet before the listing covers doc stamps, title, prorations and payoff. |
| 2 | `app/(site)/sell/sold/opengraph-image.tsx` | The public record, by street. | See the public record, street by street. |
| 2 | `app/(site)/sell/sold/opengraph-image.tsx` | Qualified sales from the county appraiser, the last 24 months. | Every qualified sale the county appraiser recorded in the last 24 months. |
| 2 | `app/(site)/valuation/page.tsx` (description, h1) | A real number, from two people who have stood in the house. | You get a real number from two people who have stood in the house. |
| 2 | `app/(site)/valuation/page.tsx` | Recent closed sales nearby, adjusted for the water, the flood zone, and which end of the street. | We pull recent closed sales nearby, adjusted for the water, the flood zone, and which end of the street. |
| 2 | `app/(site)/valuation/page.tsx` | A range in writing with the four addresses behind it, what we'd change before the photos, and what we wouldn't spend a dollar on. | You get a range in writing with the four addresses behind it, what we'd change before the photos, and what we wouldn't spend a dollar on. |
| 2 | `app/(site)/valuation/page.tsx` | Three steps, one phone call. | It takes three steps and one phone call. |
| 2 | `app/(site)/neighborhoods/page.tsx` (dataset description) | {n} areas, communities and enclaves in Lakewood Ranch, Sarasota and Bradenton, with jurisdiction, … | Atlas covers {n} areas, communities and enclaves in Lakewood Ranch, Sarasota and Bradenton, with jurisdiction, … |
| 2 | `app/(site)/neighborhoods/[slug]/page.tsx` (description) | {name}, {market}: jurisdiction, ZIPs, zoned schools, evacuation zone, builders and association, from county and district sources. | {name} is in {market}. This page carries its jurisdiction, ZIPs, zoned schools, evacuation zone, builders and association, from county and district sources. |
| 2 | `app/(site)/neighborhoods/[slug]/page.tsx` (label) | Amenities, per the association or builder | Amenities per the association or builder |
| 2 | `app/(site)/neighborhoods/match/page.tsx` (title) | Atlas match · Ten questions about the place, none about you | Atlas match · Ten questions about the place and none about you |
| 2 | `app/(site)/neighborhoods/match/page.tsx` (description) | …to the ones whose facts fit. No ranking, no score. | …to the ones whose facts fit. There is no ranking and no score. |
| 2 | `app/(site)/neighborhoods/match/page.tsx`, `opengraph-image.tsx` (h1) | Ten questions about the place. None about you. | We ask ten questions about the place and none about you. |
| 2 | `app/(site)/neighborhoods/match/page.tsx` | One field per question, and nothing guessed. | Each question reads one field, and nothing is guessed. |
| 2 | `components/encore/visit-plan.tsx` | When you're here, and where you want to look. | Tell us when you're here and where you want to look. |
| 2 | `components/encore/visit-plan.tsx` | {markets} today, in that order. | Today it's {markets}, in that order. |
| 2 | `components/home-value/copy.ts` | Which zone, the finished floor against base flood elevation, and whether a certificate exists at all. | It comes down to which zone, where the finished floor sits against base flood elevation, and whether a certificate exists at all. |
| 2 | `components/home-value/copy.ts` | Kitchens, baths, floors, windows and what's been permitted and what hasn't. | That means kitchens, baths, floors, windows, and what's been permitted and what hasn't. |
| 2 | `components/home-value/copy.ts` | The dues, the reserves, a pending assessment, a CDD bond still on the tax bill. | That means the dues, the reserves, a pending assessment and a CDD bond still on the tax bill. |
| 2 | `components/home-value/copy.ts` | A range in writing with the addresses behind it, within a day. | You get a range in writing with the addresses behind it, within a day. |
| 2 | `components/home/calendar-preview.tsx` | Theater, music and art this week, close to home. | What's on this week in theater, music and art, close to home. |
| 2 | `components/home/questions.tsx` (FAQ answer) | The documentary stamp tax on the deed at $0.70 per $100 of the price, which … | It's the documentary stamp tax on the deed at $0.70 per $100 of the price, which … |
| 2 | `components/home/questions.tsx` (FAQ answer) | Three things: the documentary stamp tax on the deed, … | There are three things: the documentary stamp tax on the deed, … |
| 2 | `components/home/questions.tsx` (FAQ answer) | Lakewood Ranch, Sarasota and Bradenton, Florida, as a mother and daughter team with Coldwell Banker Realty. Buyers, sellers and investors. | We cover Lakewood Ranch, Sarasota and Bradenton, Florida, as a mother and daughter team with Coldwell Banker Realty. We work with buyers, sellers and investors. |
| 2 | `components/home/questions.tsx` (FAQ answer) | Lakewood Ranch, Sarasota and Bradenton, as a mother and daughter team with Coldwell Banker Realty. Buyers, sellers and investors, first home or fifth. | We cover Lakewood Ranch, Sarasota and Bradenton, as a mother and daughter team with Coldwell Banker Realty. We work with buyers, sellers and investors, first home or fifth. |
| 2 | `components/home/what-we-do-copy.ts` | Flood zone, HOA, the age of the roof, before you get in the car. | You'll know the flood zone, the HOA and the age of the roof before you get in the car. |
| 2 | `components/home/what-we-do-copy.ts` | Escrow, appraisal, insurance, the walk-through. | That covers escrow, appraisal, insurance and the walk-through. |
| 2 | `components/home/what-we-do-copy.ts` | Photos in the afternoon light, live on a Thursday, showings from Friday. | Photos are taken in the afternoon light, the listing goes live on a Thursday, and showings start Friday. |
| 2 | `components/home/what-we-do-copy.ts` | How many came through, what they said, and whether the number is right. In writing, every week the house is on the market. | You hear how many came through, what they said, and whether the number is right. It comes in writing, every week the house is on the market. |
| 2 | `components/home/what-we-do-copy.ts` (step title) | Side by side, then a recommendation | We lay them side by side, then recommend one |
| 2 | `components/home/what-we-do-copy.ts` | Every offer laid out the same way: … | Every offer is laid out the same way: … |
| 2 | `components/home/what-we-do-copy.ts` | Both of us, on every file. | Both of us are on every file. |
| 2 | `components/home/what-we-do-copy.ts` | The seawall, the roof, the flood zone, the kitchen that won't pay for itself. | That means the seawall, the roof, the flood zone and the kitchen that won't pay for itself. |
| 2 | `components/home/what-we-do-copy.ts` | Atlas, the map of every place in Lakewood Ranch, Sarasota and Bradenton. Encore, what's on tonight and this weekend. Tide, one page a month on what the three markets did. Yours whether or not you ever call us. | Atlas is the map of every place in Lakewood Ranch, Sarasota and Bradenton. Encore is what's on tonight and this weekend. Tide is one page a month on what the three markets did. They're yours whether or not you ever call us. |
| 2 | `components/lead-form.tsx` | Tide goes out once a month. One page, written for you. | Tide goes out once a month. It's one page, written for you. |
| 2 | `components/lead-form.tsx` | The full calendar, every Monday. | The full calendar comes every Monday. |
| 2 | `components/net-proceeds/calculator.tsx`, `lib/net-proceeds.ts` | An estimate, not a closing statement. | This is an estimate, not a closing statement. |
| 2 | `lib/channels/copy.ts` | Ten questions about the place, none about you. Atlas narrows every neighborhood… | Atlas asks ten questions about the place and none about you. It narrows every neighborhood… |
| 2 | `lib/channels/copy.ts` | What happened on streets like yours this month, in plain language. One email, and you can stop any time. | Tide tells you what happened on streets like yours this month, in plain language. It's one email, and you can stop any time. |
| 2 | `lib/content/markets.ts` | Villages built around lakes and preserves, each with its own feel, and a Main Street and Waterside that give the evenings somewhere to go. | The villages are built around lakes and preserves, each with its own feel, and Main Street and Waterside give the evenings somewhere to go. |
| 2 | `lib/content/markets.ts`, `lib/hubs/copy.ts` | The bayfront, the keys(,) and the streets west of the Trail, with the opera house, the orchestra and the gallery district a few minutes from any of them. | Sarasota is the bayfront, the keys and the streets west of the Trail, and the opera house, the orchestra and the gallery district are a few minutes from any of them. |
| 2 | `lib/content/markets.ts` | The Manatee River, the Riverwalk, the canal streets west of 75th, and a downtown with the county's theater and an arts village of its own. | Bradenton is the Manatee River, the Riverwalk, the canal streets west of 75th, and a downtown with the county's theater and an arts village of its own. |
| 2 | `lib/hubs/copy.ts` | Villages built around lakes and preserves on both sides of the Manatee–Sarasota county line, with Main Street and Waterside Place to give the evenings somewhere to go. | The villages are built around lakes and preserves on both sides of the Manatee–Sarasota county line, and Main Street and Waterside Place give the evenings somewhere to go. |
| 2 | `lib/hubs/copy.ts` | The Manatee River, the Riverwalk, the canal streets west of 75th reaching Palma Sola Bay, and a downtown with the county's theater and an arts village of its own. | Bradenton is the Manatee River, the Riverwalk, the canal streets west of 75th reaching Palma Sola Bay, and a downtown with the county's theater and an arts village of its own. |
| 2 | `lib/hubs/copy.ts` (three hubs) | On the closing statement: the state documentary stamp tax on the deed, … | The closing statement carries the state documentary stamp tax on the deed, … |
| 2 | `lib/hubs/copy.ts` (FAQ) | The buyer, by custom. It changes at the county line: … | The buyer pays, by custom. It changes at the county line: … |
| 2 | `lib/hubs/copy.ts` (FAQ) | The seller, by custom, and the seller also pays the documentary stamp tax on the deed. | The seller pays, by custom, and the seller also pays the documentary stamp tax on the deed. |
| 2 | `lib/hubs/copy.ts` (FAQ) | The milestone inspection report, which Florida requires …, the structural integrity reserve study, and the current budget. | Ask for the milestone inspection report, which Florida requires …, the structural integrity reserve study, and the current budget. |
| 2 | `lib/hubs/copy.ts` (FAQ) | The building's insurance and reserves, which matter as much as the flood zone, plus the milestone inspection report … | Ask about the building's insurance and reserves, which matter as much as the flood zone, plus the milestone inspection report … |
| 2 | `lib/refer/copy.ts` | Your name and email, their first name, and a note about the timing. | Give us your name and email, their first name, and a note about the timing. |
| 2 | `lib/refer/copy.ts` | To say thank you, and to ask how they'd like to hear from us. | We say thank you and ask how they'd like to hear from us. |
| 2 | `lib/refer/copy.ts` (placeholder) | When they're thinking of moving, where they're looking, anything they've asked you about. | Tell us when they're thinking of moving, where they're looking and anything they've asked you about. |
| 2 | `lib/reviews/copy.ts` (placeholder) | What we did, how it went, what you'd tell someone about to start. | Tell us what we did, how it went and what you'd tell someone about to start. |
| 2 | `lib/relocate/copy.ts` (hint) | Context for us, nothing more. | This is context for us, nothing more. |
| 2 | `lib/relocate/copy.ts` (plan title) | Every date, and the rule behind it. | Every date comes with the rule behind it. |
| 2 | `lib/relocate/copy.ts` (generic plan title) | A plan to read, then adjust. | Read the plan, then adjust it. |
| 2 | `lib/relocate/copy.ts` | Inspection, appraisal, insurance, title: a short note after each one with what happened, what's next and the date it happens. | After inspection, appraisal, insurance and title, you get a short note with what happened, what's next and the date it happens. |
| 2 | `lib/relocate/plan.ts` | The inspector, the termite inspector and, on older homes, the four-point and wind mitigation reports your insurer will want. | Book the inspector, the termite inspector and, on older homes, the four-point and wind mitigation reports your insurer will want. |
| 2 | `lib/relocate/plan.ts` | The title commitment, showing who owns the home and what's recorded against it. | This is the title commitment, showing who owns the home and what's recorded against it. |
| 2 | `lib/relocate/plan.ts` | Homeowners, wind if it's separate, and flood. | Bind homeowners, wind if it's separate, and flood. |
| 2 | `lib/relocate/plan.ts` | Walk-through in the morning, signing after. | The walk-through is in the morning and the signing comes after. |
| 2 | `lib/relocate/plan.ts` | Utilities in your name, mail forwarded, and the first night in the house. | Put the utilities in your name, forward the mail and spend the first night in the house. |
| 2 | `lib/relocate/plan.ts` | Florida title and plates for each car. | Get a Florida title and plates for each car. |
| 2 | `lib/relocate/plan.ts` (title) | Homestead, when you buy | Homestead when you buy |
| 2 | `lib/relocate/plan.ts` (basis) | Our checklist, not a deadline. | This is our checklist, not a deadline. |
| 2 | `lib/content/seed/posts.ts` (excerpt) | HOA dues, CDD assessments, reserves, rules and the estoppel letter. The documents that decide whether a house in a master-planned community is the right one. | HOA dues, CDD assessments, reserves, rules and the estoppel letter are the documents that decide whether a house in a master-planned community is the right one. |
| 2 | `lib/content/seed/posts.ts` (excerpt) | The four-point, the wind mitigation, the termite letter, the roof, the seawall and the dock. Why an inspection here is different from the one you had up north. | An inspection here covers the four-point, the wind mitigation, the termite letter, the roof, the seawall and the dock. Here's why it's different from the one you had up north. |
| 2 | `lib/content/seed/posts.ts` (excerpt) | Out of state, out of season, or handling a home. How a sale runs when the owner isn't here, from the keys to the closing. | Out of state, out of season, or handling a home: here's how a sale runs when the owner isn't here, from the keys to the closing. |
| 2 | `lib/content/seed/posts.ts` (excerpt) | One page, once a quarter. What your street actually did, what it means for you, and what we got wrong last time. | One page comes once a quarter, with what your street actually did, what it means for you, and what we got wrong last time. |
| 2 | `lib/content/seed/posts.ts` (excerpt) | The spring letter, with the winter's predictions marked against what happened. | The spring letter marks the winter's predictions against what happened. |
| 2 | `lib/content/seed/posts.ts` (excerpt) | Flood zones X, AE and VE, elevation certificates, and why the insurance quote is now the first question on any waterfront street. | This one covers flood zones X, AE and VE, elevation certificates, and why the insurance quote is now the first question on any waterfront street. |
| 2 | `lib/content/seed/posts.ts` (report body) | Cliffside Terrace in The Lake Club: four sales, all inside nine days, all at or above list. Waterside Way: three sales, thirty-one, forty and fifty-two days, all below the first price. | Cliffside Terrace in The Lake Club had four sales, all inside nine days, all at or above list. Waterside Way had three sales, at thirty-one, forty and fifty-two days, all below the first price. |
| 2 | `lib/content/seed/guides-wave2-a.ts` (flood guide excerpt) | X, AE and VE on one page. How to look up the exact parcel in either county, … | Zones X, AE and VE are explained on one page: how to look up the exact parcel in either county, … |
| 2 | `lib/content/seed/guides-wave2-a.ts` (flood guide pull quote) | Zone first, certificate second, quote third. Then we can talk about the kitchen. | The zone comes first, the certificate second and the quote third. Then we can talk about the kitchen. |
| 2 | `lib/content/seed/guides-wave2-a.ts` (CDD guide excerpt) | …and Windward's own. Which villages sit in which, the two lines they put on the tax bill, and how to read a parcel's bill before you write an offer. | …and Windward's own. This guide shows which villages sit in which, the two lines they put on the tax bill, and how to read a parcel's bill before you write an offer. |
| 2 | `lib/content/seed/guides-wave2-a.ts` (hurricane guide excerpt) | The season's dates, why an evacuation zone isn't a flood zone, … | This guide covers the season's dates, why an evacuation zone isn't a flood zone, … |
| 2 | `lib/content/seed/guides-wave2-a.ts` (homestead guide excerpt) | The two exemption tiers, the March deadline, the cap … | This guide covers the two exemption tiers, the March deadline, the cap … |
| 2 | `lib/content/seed/guides-wave2-a.ts` (homestead guide body) | Three things, in order. Get the seller's just value … | Do three things, in order. Get the seller's just value … |
| 2 | `lib/content/seed/guides-wave2-b.ts` (insurance guide excerpt) | Roof age, the wind mitigation report, opening protection, the elevation certificate and the zone. Citizens, My Safe Florida Home, NFIP against private flood, the thirty-day wait and the binding stop. What moves the number, and what to do about it. | The quote turns on roof age, the wind mitigation report, opening protection, the elevation certificate and the zone. This guide also covers Citizens, My Safe Florida Home, NFIP against private flood, the thirty-day wait and the binding stop: what moves the number, and what to do about it. |
| 2 | `lib/content/seed/guides-wave2-b.ts` (insurance guide body) | Roof age, first. Florida law says … | Roof age comes first. Florida law says … |
| 2 | `lib/content/seed/guides-wave2-b.ts` (barrier island guide excerpt) | Anna Maria Island's three cities, Longboat Key's two counties, Lido and St. Armands under the city, Siesta Key under the county. Height, short-term rentals and the rebuild rule, with the code behind each one, … | Anna Maria Island has three cities, Longboat Key spans two counties, Lido and St. Armands sit under the city, and Siesta Key sits under the county. This guide covers height, short-term rentals and the rebuild rule, with the code behind each one, … |
| 2 | `lib/content/seed/guides-wave2-b.ts` (condo guide excerpt) | The milestone inspection, the structural integrity reserve study, what 'waived reserves' used to mean and no longer can, and the exact documents … | This guide covers the milestone inspection, the structural integrity reserve study, what 'waived reserves' used to mean and no longer can, and the exact documents … |
| 2 | `lib/content/seed/guides-wave2-b.ts` (getting here guide excerpt) | Four airports, one interstate, the Skyway, the county line through Lakewood Ranch, two bridges to Anna Maria Island and two bus systems. How to measure a commute honestly, … | There are four airports, one interstate, the Skyway, the county line through Lakewood Ranch, two bridges to Anna Maria Island and two bus systems. This guide shows how to measure a commute honestly, … |
| 2 | `app/(site)/about/page.tsx` (value) | The flood zone, the age of the roof, which end of the street is the good one. | We tell you the flood zone, the age of the roof and which end of the street is the good one. |
| 4 | `app/(site)/about/page.tsx` | We like these houses and we like this coast, and we won't call a kitchen stunning when the honest word is rebuilt, and full of light at four in the afternoon. Between the two of us, you're covered from the first call to the keys. | (paragraph removed) |
| 4 | `lib/content/seed/team.ts` (Joelyn) | Joelyn is the mother in this mother and daughter team. She'll walk you through the whole move, explain it twice if you'd like it twice, and tell you the truth about a house even when it isn't what you were hoping to hear. / Ask her anything about the process and you'll get a straight answer. | Joelyn is the mother in this mother and daughter team with Coldwell Banker Realty. She helps people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton. |
| 4 | `lib/content/seed/team.ts` (Jessica) | Jessica is the daughter, and she's the one who'll keep you posted at every step. She reads the contract, watches the dates, and tells you plainly where things stand, so you're never guessing. / If you want the short version, call Jessica. If you want the long version, she'll give you that too. | Jessica is the daughter in this mother and daughter team with Coldwell Banker Realty. She helps people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton. |

## Flagged, not changed (process promises the client is confirming separately)

- `components/home/meet.tsx`: "Wherever your move takes you, we know the market, negotiate with purpose, and keep you informed every step of the way." and "a strategy tailored to your goals". No invented personal traits found there; the paragraph reads as the team's own.
- `components/home/what-we-do-copy.ts`: the timed promises (a pre-approval letter from a local lender on the first call; a written update after every step; the written range "that day or the next"; photos Thursday / showings Friday; the Monday showing report every week; "One of us is always reachable"; the eight-week preparation window).
- `app/(site)/about/page.tsx`: "Call either of us and you'll get an answer, not a call back later." and "You'll always know where things stand, because we'll have told you."
- `app/(site)/sell/page.tsx`: "You'll hear from us on the same three days every week until closing: Monday with the showing report, Wednesday with the file, Friday with the calendar."

## Left as labels on purpose

Guide titles ("CDD fees in Lakewood Ranch, village by village.", "Hurricane season, evacuation zones, and what changed after Helene and Milton."), the hub guide-card sublabels (keyword lists such as "title custom by county, the county line, flood zones, hurricane season"), source citations ("FEMA, Zone AE (glossary)"), example placeholders ("A place, a ZIP, a builder, an HOA"), image alt text and data strings. None of these is a sentence; flag any you want turned into one.

## Checks

`checkFairHousing` over every added line (0 flagged), `npm run check:copy` (232 strings, clean), `npx tsx scripts/check-guides.ts` (387 strings, clean), `npx tsc --noEmit`, `npm run test:unit` (139 pass, no test pinned an old string), `npm run build` (clean).

## Review tightenings

Applied after review, on top of the table above.

| File | Now reads |
|---|---|
| `components/letter-form.tsx` | You’re on the list. (both success strings) |
| `app/(site)/sell/net-proceeds/page.tsx` | Here's every rate on the sheet and the page it came from. |
| `app/(site)/listings/[slug]/page.tsx` | Another buyer has this one under contract. |
| `lib/hubs/page.tsx` | Here’s how buying and selling work here. |
| `lib/content/seed/posts.ts` (excerpt) | Whether you’ve moved away, you’re only here in season, or you’re settling an estate, here’s how a sale runs when the owner isn’t here. |
