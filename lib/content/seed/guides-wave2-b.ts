import type { PortableTextBlock } from "next-sanity";
import type { Post, RichText } from "../types";
import { h, img, quote, rich } from "./helpers";

/**
 * Tide guides, wave two (set B): insurance, the barrier islands, condominium
 * and HOA documents, and getting here. Every figure and date in these pages
 * is tied to a source the reader can open; the sources sit at the end of each
 * guide with the day they were last checked. Places and rules, never people.
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

const INSPECTIONS = "/blog/inspections-on-the-suncoast-what-a-good-one-covers";
const FLOOD_GUIDE = "/blog/flood-zones-and-elevation-certificates-on-the-suncoast";
const GATED = "/blog/what-to-ask-before-you-buy-in-a-gated-community";

export const WAVE2_GUIDES_B: Post[] = [
  {
    _id: "post-guide-wind-flood-insurance",
    title: "Wind and flood insurance on this coast: what drives the quote.",
    slug: "homeowners-wind-and-flood-insurance-on-this-coast",
    cover: img("library/place-storm-gulf", "A storm building over the Gulf"),
    excerpt:
      "The quote turns on roof age, the wind mitigation report, opening protection, the elevation certificate and the zone. This guide also covers Citizens, My Safe Florida Home, NFIP against private flood, the thirty-day wait and the binding stop: what moves the number, and what to do about it.",
    publishedAt: "2026-09-23",
    author: { name: "Jessica Garza", slug: "jessica-garza" },
    categories: ["Guides"],
    body: rich(
      pl(
        "The insurance quote is the first number we ask for on any house near the water, because it can change whether the house pencils. An underwriter reads the same short list on every file. Here’s the list.",
      ),
      h(2, "The roof"),
      pl(
        "Roof age comes first. Florida law says an insurer can’t refuse to write or renew a policy solely because of the roof’s age when the roof is under fifteen years old ([Florida Statutes 627.7011(5)](https://www.flsenate.gov/Laws/Statutes/2024/627.7011)). Ask for the permit for the last replacement; its date is the age the insurer uses.",
        "Past that age, the same statute gives you a path: an inspection showing five or more years of useful life left, and the insurer can’t turn the policy down on age alone. It doesn’t stop them pricing the roof, so plan the replacement in your number if it’s near the end.",
      ),
      h(2, "The wind mitigation report"),
      pl(
        "A wind mitigation inspection is a short report on how the house is built against wind: the roof shape, how the deck is attached, whether the roof is strapped to the walls, whether there’s a secondary water barrier, and whether every opening has rated shutters or impact glass. Florida requires insurers to file credits for construction that cuts windstorm loss, roof-to-wall strength and opening protection among them ([Florida Statutes 627.0629(1)](https://www.flsenate.gov/Laws/Statutes/2024/627.0629)); the state’s uniform mitigation form captures the full list. The report is cheap and the credits can be the difference. The [Inspections guide](" + INSPECTIONS + ").",
      ),
      h(2, "Citizens, and why your policy might move"),
      pl(
        "Citizens Property Insurance is the state’s insurer of last resort, created for property owners who can’t find coverage in the private market; the Legislature set it up in 2002 as a not-for-profit government entity ([Citizens, who we are](https://www.citizensfla.com/who-we-are)), for applicants entitled to coverage in the voluntary market who can’t get it ([Florida Statutes 627.351(6)(a)](https://www.flsenate.gov/Laws/Statutes/2024/627.351)). Its policyholders can be assessed after a bad storm.",
        "Depopulation is the program that moves policies back out: Citizens matches policyholders with private insurers that want their policies ([Citizens, depopulation](https://www.citizensfla.com/depopulation)), and the policyholder gets a new offer of coverage with a date on the offer form to answer by ([Citizens, personal lines depopulation](https://www.citizensfla.com/depoppl)). The rule has teeth. An offer that is not more than 20 percent above Citizens’ estimated renewal premium makes the policy ineligible to stay with Citizens, under the same page. Buy a house with a Citizens policy and expect that letter. Read the offer and the premium side by side before the date on the form, and ask about the private carrier’s rating.",
      ),
      h(2, "My Safe Florida Home"),
      pl(
        "My Safe Florida Home is a state program run by the Department of Financial Services ([DFS, My Safe Florida Home](https://www.myfloridacfo.com/mysafeflhome)): a free wind mitigation inspection and, for eligible homes, grant assistance toward the upgrades the inspection recommends ([the program’s site](https://mysafeflhome.com/)). The grant is matched, two state dollars for each of yours up to a cap the statute names ([Florida Statutes 215.5586(2)(c)](https://www.flsenate.gov/Laws/Statutes/2024/215.5586)). Eligibility turns on the homestead, the type of house, its insured value, when it was permitted and income-based tiers that set the order applications are taken in; the figures are in the statute ([Florida Statutes 215.5586](https://www.flsenate.gov/Laws/Statutes/2024/215.5586)).",
        "When we checked, the program’s own page said new inspection applications were paused while grant applications continued ([program FAQ](https://mysafeflhome.com/faq)). Check the status the week you need it.",
      ),
      h(2, "Flood is a separate policy"),
      pl(
        "A homeowners policy doesn’t cover flood. That’s a second policy, and the state’s consumer page walks through the ways to buy one ([Florida CFO, flood questions](https://www.myfloridacfo.com/division/consumers/storm/flood-disaster-faqs)). Many are written through the National Flood Insurance Program and priced under its Risk Rating 2.0 method, which weighs the distance to water, the kind of flooding, the elevation and the cost to rebuild ([FEMA, Risk Rating 2.0](https://www.fema.gov/flood-insurance/risk-rating)).",
        "Private flood policies exist too. Florida law sets out the kinds a carrier can write, from a standard policy mirroring the federal one to broader forms, and lets the policy state whether it meets the federal lender rule ([Florida Statutes 627.715](https://www.flsenate.gov/Laws/Statutes/2024/627.715)). Get both quotes. On a street in flood zone AE, the high-risk zone the lender cares about, the private one sometimes wins.",
      ),
      h(2, "The zone and the elevation certificate"),
      pl(
        "The flood zone decides whether the lender requires the policy; the elevation certificate, a surveyor’s page that states the finished floor against the base flood elevation, is the document that can lower the quote. Ask for both before the offer. The [flood zones guide](" + FLOOD_GUIDE + ") explains the three letters.",
      ),
      h(2, "The thirty-day wait and the binding stop"),
      pl(
        "A new federal flood policy normally takes thirty days to go into effect, with exceptions such as a policy bought with the mortgage at closing ([FEMA, the waiting period](https://www.fema.gov/fema-common-faq/waiting-period-activating-flood-policy); [Florida CFO, flood questions](https://www.myfloridacfo.com/division/consumers/storm/flood-disaster-faqs)). Order it the day you go under contract.",
        "Then the stop. Citizens suspends binding of new policies and coverage increases whenever the National Weather Service issues a tropical storm or hurricane watch or warning for any part of Florida ([Citizens binding notice](https://www.citizensfla.com/-/20260719-citizens-is-under-binding-suspension)). Private carriers are reported to do the same; that part isn’t from their pages. A closing with no bound policy waits for the all-clear.",
      ),
      quote("Bind the policy the week the contract is signed. In season, that sentence is the whole plan."),
      pl(
        "Here’s what we’d do: get the roof permit and the wind mitigation report, ask for the elevation certificate, run the quote past more than one carrier and a private flood market, and bind before the first watch. Send us the address and we’ll start the list.",
      ),
      sources(
        "[Florida Statutes 627.7011, roof age](https://www.flsenate.gov/Laws/Statutes/2024/627.7011)",
        "[Florida Statutes 627.0629, windstorm mitigation credits](https://www.flsenate.gov/Laws/Statutes/2024/627.0629)",
        "[Florida Statutes 627.351(6), Citizens Property Insurance](https://www.flsenate.gov/Laws/Statutes/2024/627.351)",
        "[Citizens, who we are](https://www.citizensfla.com/who-we-are)",
        "[Citizens, depopulation](https://www.citizensfla.com/depopulation) and [personal lines depopulation](https://www.citizensfla.com/depoppl)",
        "[Citizens, binding suspension notice](https://www.citizensfla.com/-/20260719-citizens-is-under-binding-suspension)",
        "[Florida DFS, My Safe Florida Home](https://www.myfloridacfo.com/mysafeflhome), [the program’s site](https://mysafeflhome.com/) and the [program FAQ](https://mysafeflhome.com/faq)",
        "[Florida Statutes 215.5586, My Safe Florida Home, with the match in (2)(c)](https://www.flsenate.gov/Laws/Statutes/2024/215.5586)",
        "[Florida CFO, flood insurance questions](https://www.myfloridacfo.com/division/consumers/storm/flood-disaster-faqs)",
        "[FEMA, Risk Rating 2.0](https://www.fema.gov/flood-insurance/risk-rating)",
        "[FEMA, the waiting period for a flood policy](https://www.fema.gov/fema-common-faq/waiting-period-activating-flood-policy)",
        "[Florida Statutes 627.715, private flood insurance](https://www.flsenate.gov/Laws/Statutes/2024/627.715)",
      ),
    ),
  },

  {
    _id: "post-guide-barrier-island-rules",
    title: "Barrier island rules, island by island.",
    slug: "barrier-island-rules-island-by-island",
    cover: img("library/gulf-beach-aerial", "A barrier island beach from the air"),
    excerpt:
      "Anna Maria Island has three cities, Longboat Key spans two counties, Lido and St. Armands sit under the city, and Siesta Key sits under the county. This guide covers height, short-term rentals and the rebuild rule, with the code behind each one, and where we couldn’t verify a rule, we say so.",
    publishedAt: "2026-09-25",
    author: { name: "Joelyn Nauman", slug: "joelyn-nauman" },
    categories: ["Guides"],
    body: rich(
      pl(
        "From the water the islands look alike: low roofs, sea oats, a bridge at each end. The rules don’t. Anna Maria Island is three cities, Longboat Key is one town in two counties, Lido Key and St. Armands belong to the City of Sarasota, and Siesta Key sits in unincorporated Sarasota County. Three questions come up on each: how tall can I build, can I rent it by the week, and what happens if a storm takes half the house. Here’s what each government’s pages say.",
      ),
      h(2, "The fifty percent rule, first, because it’s everywhere"),
      pl(
        "The rule that shapes what gets rebuilt on every island is federal. A substantial improvement is work whose cost equals or exceeds half the building’s market value, and a substantially damaged building counts the same way ([FEMA, substantial improvement](https://www.fema.gov/glossary/substantial-improvement)). Cross the line and the building has to meet the requirements for a new one, which on these islands means elevated ([Holmes Beach, flood protection](https://www.holmesbeachfl.org/i_want_to/flood___hurricane_protection_information.php)).",
        "The counting matters. Manatee County adds up improvements over a one-year period, so a kitchen this spring and a roof next winter can be one project in the county’s eyes ([Manatee County, floodplain management](https://www.mymanatee.org/departments/building___development_services/floodplain_management)). Ask the building department for a determination, not a guess.",
      ),
      h(2, "Anna Maria Island: three cities"),
      pl(
        "The City of Anna Maria, at the north end, licenses vacation rentals under Chapter 108 of its code: a city registration, a state lodging license and tax registration, and a passed inspection before the first advertisement ([Anna Maria, vacation rental rules](https://www.cityofannamaria.com/208/Vacation-Rental-Rules-Regulations)). The page doesn’t state a minimum stay, and we couldn’t read the city’s height limit from its code; check both with the city.",
        "Holmes Beach, in the middle, requires a vacation rental certificate for every rental, and the minimum stay follows the zoning district. In the R-1 and R-1AA districts a property can be rented no more than once in any thirty-day period, and each stay must be thirty consecutive days ([Holmes Beach, vacation rental certificates](https://www.holmesbeachfl.org/departments/vacation_rental_certificates.php)).",
        "In Holmes Beach’s R-2, R-3 and R-4 districts the same page sets the minimum at seven consecutive days, so we look up the district, not the island.",
        "Holmes Beach’s height is in its comprehensive plan: a maximum of 36 feet, measured from the crown of the abutting road to the highest point of the roof ([Holmes Beach, comprehensive plan](https://cms9files1.revize.com/holmesbeachfl/Comprehensive%20Plan%20Adopted%202022.pdf)).",
        "Bradenton Beach, at the south end, measures height from the flood protection elevation and caps a building at 29 feet in its R-2 district sheet from the land development code, which also limits the number of stories ([Bradenton Beach, R-2 district](https://www.cityofbradentonbeach.com/DocumentCenter/View/6224/R-2-Zoning-revised-02-06-20-PDF)).",
        "Bradenton Beach’s code page defines a short-term rental by how often a unit is rented in a year for stays shorter than thirty days, and requires state registration plus a city transient public lodging license ([Bradenton Beach, common code violations](https://www.cityofbradentonbeach.com/165/Common-Code-Violations)).",
      ),
      h(2, "Longboat Key: one town, two counties"),
      pl(
        "The county line crosses the island, and the town says so plainly: it sits in two counties, each setting its own millage, the property tax rate, and moving across the line within the town means re-registering to vote ([Longboat Key, ad valorem taxes](https://www.longboatkey.org/434/Ad-valorem-Taxes); [Longboat Key, elections](https://www.longboatkey.org/281/Elections)). The county also sets the title custom, so we check the parcel’s county first.",
        "Rentals are the town’s rule. Longboat Key keeps a Residential Rental Registry under Chapter 115 of its code for residentially zoned property rented for less than six months; registering means a town inspection and a certificate in every advertisement ([Longboat Key, Residential Rental Registry](https://www.longboatkey.org/243/Residential-Rental-Registry)). The registry took effect on October 1, 2023.",
        "The minimum rental period in residential zoning is thirty consecutive days or one entire calendar month, unless the property is grandfathered as a tourism use or sits in a tourism district ([Longboat Key, short term rentals](https://www.longboatkey.org/221/Short-Term-Rentals)). We didn’t find a height figure on the town’s pages; ask the planning division.",
      ),
      h(2, "Lido Key and St. Armands: the City of Sarasota"),
      pl(
        "The city’s vacation rental chapter applies citywide to one- to four-unit dwellings in residential districts: a certificate of registration and an inspection before you advertise, with the minimum stay set at seven full days and seven full nights ([City of Sarasota, vacation rentals](https://www.sarasotafl.gov/government/development-services/vacation-rentals)).",
        "The same page exempts owner-occupied rentals, condominiums, cooperatives and stays of thirty consecutive days or more; a condominium on Lido answers to its own documents instead.",
        "Height on the coastal islands is set by the city plan’s Coastal Islands Maximum Building Height Overlay Map, which caps parts of Lido and St. Armands at 35 feet above the minimum FEMA elevation while the Gulf-front resort districts go much taller ([Sarasota City Plan, Environmental Protection and Coastal Islands chapter](https://www.sarasotafl.gov/files/assets/city/v/1/planning/documents/chapter4_environmentalplanaccessible.pdf)). The parcel’s district is on the city’s zoning map ([City of Sarasota, zoning](https://www.sarasotafl.gov/government/development-services/zoning)).",
      ),
      h(2, "Siesta Key: Sarasota County"),
      pl(
        "Siesta Key has no city; its rules are Sarasota County’s, and we couldn’t open the county’s pages from where we wrote this, so we won’t tell you what they say. The county’s planning and development services department publishes the vacation rental and floodplain rules, and the code itself is on Municode ([Sarasota County code](https://library.municode.com/fl/sarasota_county/codes/code_of_ordinances)); check with the county. The [Siesta Key page](/neighborhoods/siesta-key) on the Atlas covers the zones and the bridges.",
      ),
      quote("The island is the view. The district is the rule. We look up the second before we fall for the first."),
      pl(
        "Tell us the address and we’ll pull the district, read the rule with you, and call the city when the page doesn’t say.",
      ),
      sources(
        "[FEMA, substantial improvement](https://www.fema.gov/glossary/substantial-improvement)",
        "[Manatee County, floodplain management](https://www.mymanatee.org/departments/building___development_services/floodplain_management)",
        "[Holmes Beach, flood and hurricane protection](https://www.holmesbeachfl.org/i_want_to/flood___hurricane_protection_information.php)",
        "[City of Anna Maria, vacation rental rules and regulations](https://www.cityofannamaria.com/208/Vacation-Rental-Rules-Regulations)",
        "[Holmes Beach, vacation rental certificates](https://www.holmesbeachfl.org/departments/vacation_rental_certificates.php)",
        "[Holmes Beach, comprehensive plan](https://cms9files1.revize.com/holmesbeachfl/Comprehensive%20Plan%20Adopted%202022.pdf)",
        "[Bradenton Beach, R-2 district sheet](https://www.cityofbradentonbeach.com/DocumentCenter/View/6224/R-2-Zoning-revised-02-06-20-PDF) and [common code violations](https://www.cityofbradentonbeach.com/165/Common-Code-Violations)",
        "[Longboat Key, ad valorem taxes](https://www.longboatkey.org/434/Ad-valorem-Taxes), [elections](https://www.longboatkey.org/281/Elections), [Residential Rental Registry](https://www.longboatkey.org/243/Residential-Rental-Registry) and [short term rentals](https://www.longboatkey.org/221/Short-Term-Rentals)",
        "[City of Sarasota, vacation rentals](https://www.sarasotafl.gov/government/development-services/vacation-rentals) and [zoning](https://www.sarasotafl.gov/government/development-services/zoning)",
        "[Sarasota City Plan, Environmental Protection and Coastal Islands chapter](https://www.sarasotafl.gov/files/assets/city/v/1/planning/documents/chapter4_environmentalplanaccessible.pdf)",
        "[Sarasota County code of ordinances](https://library.municode.com/fl/sarasota_county/codes/code_of_ordinances); the county’s own pages were unreachable when we checked",
      ),
    ),
  },

  {
    _id: "post-guide-condo-hoa-documents",
    title: "Condo and HOA documents after the 2022 law.",
    slug: "condo-and-hoa-documents-after-the-2022-law",
    cover: img("library/sarasota-bayfront-blue-hour", "Sarasota’s bayfront towers at blue hour"),
    excerpt:
      "This guide covers the milestone inspection, the structural integrity reserve study, what ‘waived reserves’ used to mean and no longer can, and the exact documents to ask for in the inspection period: the report, the study, the budget, the estoppel certificate and the association’s website.",
    publishedAt: "2026-09-27",
    author: { name: "Jessica Garza", slug: "jessica-garza" },
    categories: ["Guides"],
    body: rich(
      pl(
        "The monthly number is the first thing a buyer asks about a condominium and the last thing that should decide it. Buying one on this coast now means reading two documents that didn’t exist a few years ago. The Legislature rewrote the rules for condominium buildings in 2022 ([Florida Statutes 553.899](https://www.flsenate.gov/Laws/Statutes/2025/553.899), history note). Here’s what the law requires and what we ask for in the inspection period.",
      ),
      h(2, "The milestone inspection"),
      pl(
        "A milestone inspection is a structural inspection of a condominium or cooperative building that is three habitable stories or more, done by an architect or engineer licensed in Florida ([Florida Statutes 553.899(2), (3)](https://www.flsenate.gov/Laws/Statutes/2025/553.899)).",
        "The first one is due by the end of the year the building turns thirty, counted from its certificate of occupancy, under the same section.",
        "The local building authority can move that to twenty-five years where local conditions, including proximity to salt water, justify it ([553.899(3)(b)](https://www.flsenate.gov/Laws/Statutes/2025/553.899)). On the bayfront and the keys, ask which clock the building is on.",
        "After the first, the inspection repeats every ten years. It runs in phases: a visual examination, then testing if the first phase finds substantial structural deterioration ([553.899(7)](https://www.flsenate.gov/Laws/Statutes/2025/553.899)).",
        "The association has to send the inspector’s summary to every owner within forty-five days of receiving the report and post it where owners can see it ([553.899(9)](https://www.flsenate.gov/Laws/Statutes/2025/553.899)).",
      ),
      h(2, "The structural integrity reserve study"),
      pl(
        "A structural integrity reserve study, the SIRS, is a reserve study for the parts of the building that keep it standing and dry: the roof, the structure including load-bearing walls, fireproofing and fire protection, plumbing, electrical, waterproofing and exterior painting, windows and exterior doors, and any other item whose replacement cost crosses the threshold in the statute ([Florida Statutes 718.112(2)(g)](https://www.flsenate.gov/Laws/Statutes/2025/718.112)). A licensed engineer, architect or certified reserve specialist has to do or verify it.",
        "A condominium association must have one for each building that is three habitable stories or higher, and update it at least every ten years, under the same paragraph.",
        "The first studies were due by December 31, 2025, with a later date allowed where the study was done alongside a milestone inspection ([718.112(2)(g)7](https://www.flsenate.gov/Laws/Statutes/2025/718.112)). Ask for it by name.",
      ),
      h(2, "What ‘waived reserves’ meant, and no longer can"),
      pl(
        "For years the owners of a condominium could vote each budget to fund no reserves, or less than the full amount, and many did. The dues stayed low and the roof got older.",
        "That vote is gone for the items in the SIRS. For budgets adopted on or after December 31, 2024, a unit-owner-controlled association that must have a study may not decide to provide no reserves or less than required for those items ([718.112(2)(f)2.b](https://www.flsenate.gov/Laws/Statutes/2025/718.112)). Reserves for other items can still be waived by a majority vote, so read the budget line by line.",
        "The latest amendments added two pressure valves: an association may pause or reduce reserve contributions for up to two consecutive budgets to fund repairs a milestone inspection recommended, and it may borrow to fund capital work the inspection requires ([718.112(2)(f)2.c and 2.e](https://www.flsenate.gov/Laws/Statutes/2025/718.112)). A paused reserve is a loan from the future. Ask what happens when it restarts.",
      ),
      h(2, "What to ask for in the inspection period"),
      list(
        "The milestone inspection summary and, if there was a second phase, the full report. In a resale the seller has to give you the summary, along with the declaration, articles, bylaws, rules, the annual budget and financial statement, and the question-and-answer sheet ([Florida Statutes 718.503(2)(a)](https://www.flsenate.gov/Laws/Statutes/2025/718.503)).",
        "The structural integrity reserve study, or the association’s statement that one isn’t required, under the same subsection.",
        "The current budget with the reserve schedule, read beside the study: are the reserves it calls for being funded?",
        "The estoppel certificate: the association’s signed statement of what the seller owes and what transfers with the unit, including pending special assessments, violations, approval requirements and any transfer or capital fee ([Florida Statutes 718.116(8)](https://www.flsenate.gov/Laws/Statutes/2024/718.116) for a condominium; [720.30851](https://www.flsenate.gov/Laws/Statutes/2024/720.30851) for a homeowners association).",
        "In a homeowners association, the disclosure summary before you sign; if it wasn’t given, the contract can be voided within three days of receiving it, until closing ([Florida Statutes 720.401](https://www.flsenate.gov/Laws/Statutes/2025/720.401)).",
      ),
      pl(
        "On the estoppel: the association has to issue it within ten business days of a written request, and it can’t collect more from a buyer who relied on it than the certificate states ([720.30851, opening paragraph and (3)](https://www.flsenate.gov/Laws/Statutes/2024/720.30851)). Order it early.",
        "On the condominium resale: the contract has to give you a cancellation right after you receive the documents, seven days not counting weekends and legal holidays, ending at closing ([718.503(2)(d)](https://www.flsenate.gov/Laws/Statutes/2025/718.503)).",
      ),
      h(2, "The HOA website rule"),
      pl(
        "Since House Bill 1203 became law as Chapter 2024-221 ([the bill](https://www.flsenate.gov/Session/Bill/2024/1203)), a homeowners association with a hundred or more parcels must keep digital copies of its records on a website or app: the declaration and amendments, articles, bylaws, current rules, budgets, financial reports, insurance policies, contracts and meeting notices, behind a portal for owners ([Florida Statutes 720.303(4)(b)](https://www.flsenate.gov/Laws/Statutes/2024/720.303)).",
        "The posting deadline was January 1, 2025, under the same subsection. For the master-planned communities on the Ranch, the documents our [gated community guide](" + GATED + ") tells you to read should already be a login away.",
      ),
      quote("The monthly number is the start of the conversation. The study tells you where it’s going."),
      pl(
        "Here’s the decision rule: a covered building with a milestone summary, a current study and reserves funded to it is a building you can price. Send us the address and we’ll request the set the day you go under contract.",
      ),
      sources(
        "[Florida Statutes 553.899, milestone inspections](https://www.flsenate.gov/Laws/Statutes/2025/553.899)",
        "[Florida Statutes 718.112(2)(f) and (g), reserves and the structural integrity reserve study](https://www.flsenate.gov/Laws/Statutes/2025/718.112)",
        "[Florida Statutes 718.503, condominium resale disclosures](https://www.flsenate.gov/Laws/Statutes/2025/718.503)",
        "[Florida Statutes 718.116(8), condominium estoppel certificate](https://www.flsenate.gov/Laws/Statutes/2024/718.116)",
        "[Florida Statutes 720.30851, homeowners association estoppel certificate](https://www.flsenate.gov/Laws/Statutes/2024/720.30851)",
        "[Florida Statutes 720.401, homeowners association disclosure summary](https://www.flsenate.gov/Laws/Statutes/2025/720.401)",
        "[Florida Statutes 720.303(4)(b), association websites](https://www.flsenate.gov/Laws/Statutes/2024/720.303)",
        "[CS/CS/HB 1203 (2024), Chapter 2024-221](https://www.flsenate.gov/Session/Bill/2024/1203)",
        "[CS/CS/HB 913 (2025), Chapter 2025-175](https://www.flsenate.gov/Session/Bill/2025/913)",
      ),
    ),
  },

  {
    _id: "post-guide-getting-here",
    title: "Getting here and getting around.",
    slug: "getting-here-and-getting-around",
    cover: img("library/place-skyway-bridge", "The Sunshine Skyway Bridge over lower Tampa Bay"),
    excerpt:
      "There are four airports, one interstate, the Skyway, the county line through Lakewood Ranch, two bridges to Anna Maria Island and two bus systems. This guide shows how to measure a commute honestly, with no minutes anywhere, because the minutes are yours to drive.",
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
