import type { Post, RichText } from "../types";
import { h, img, quote, rich } from "./helpers";

/**
 * Wave 2 guides, set A: flood zones and elevation certificates, CDDs in
 * Lakewood Ranch, hurricane season and the 2024 storms, homestead and
 * portability.
 *
 * Every figure and date in the body links to the page it came from, and the
 * Sources list at the foot of each guide says when that page was opened.
 * Where a page would not load for us, the list says so instead of guessing
 * what it would have said. Places and rules, never people; no dollar amounts
 * for assessments or premiums; no calculators.
 */

const CHECKED = "checked October 1, 2026";

type Seg = string | { text: string; href: string };
const a = (text: string, href: string): Seg => ({ text, href });

let n = 0;
const key = (prefix: string) => `${prefix}w2a${(n += 1)}`;

/** A Portable Text block whose segments may carry a link mark. */
function block(segs: Seg[], opts: { style?: string; bullet?: boolean } = {}): RichText {
  const markDefs: { _type: "link"; _key: string; href: string }[] = [];
  const children = segs.map((s) => {
    if (typeof s === "string") return { _type: "span", _key: key("s"), text: s, marks: [] as string[] };
    const k = key("l");
    markDefs.push({ _type: "link", _key: k, href: s.href });
    return { _type: "span", _key: key("s"), text: s.text, marks: [k] };
  });
  return [
    {
      _type: "block",
      _key: key("b"),
      style: opts.style ?? "normal",
      ...(opts.bullet ? { listItem: "bullet", level: 1 } : {}),
      markDefs,
      children,
    },
  ];
}

const p = (...segs: Seg[]): RichText => block(segs);
const li = (...segs: Seg[]): RichText => block(segs, { bullet: true });

type Source = { label: string; href?: string; note?: string };

/** The "Sources" footer: one line per page, with the day it was opened. A source without an href is one that would not load. */
function sources(...items: Source[]): RichText {
  return rich(
    h(2, "Sources"),
    ...items.map((s) =>
      s.href
        ? li(a(s.label, s.href), ` · ${CHECKED}${s.note ? `. ${s.note}` : ""}`)
        : li(`${s.label} · ${s.note ?? "did not load when we checked"}, ${CHECKED}`),
    ),
  );
}

const JOELYN = { name: "Joelyn Nauman", slug: "joelyn-nauman" };
const JESSICA = { name: "Jessica Garza", slug: "jessica-garza" };

/* ---- URLs, named once ------------------------------------------------------ */

const FEMA_ZONES = "https://www.fema.gov/glossary/flood-zones";
const FEMA_ZONE_AE = "https://www.fema.gov/about/glossary/zone-ae";
const FEMA_BFE = "https://www.fema.gov/about/glossary/base-flood-elevation-bfe";
const FEMA_COASTAL = "https://www.fema.gov/flood-maps/coastal/insurance-rate-maps";
const FLOODSMART_ZONE = "https://www.floodsmart.gov/flood-zones-and-maps/what-is-my-flood-zone";
const FEMA_MSC = "https://msc.fema.gov/portal/search";
const MANATEE_FLOODPLAIN = "https://www.mymanatee.org/departments/building___development_services/floodplain_management";
const MANATEE_FORERUNNER = "https://manateecountyfl.withforerunner.com/";
const SARASOTA_CITY_MAPS = "https://www.sarasotafl.gov/Department-Pages/Development-Services/Flood-Information/Map-Information";
const FLOODSMART_EC = "https://agents.floodsmart.gov/write-policy/elevation-certificates";
const RR2_FAQ = "https://agents.floodsmart.gov/sites/default/files/media/document/2025-07/fema-nfip-risk-rating-2.0-FAQs.pdf";
const FEMA_WAIT = "https://www.fema.gov/fema-common-faq/waiting-period-activating-flood-policy";
const CFO_FLOOD = "https://www.myfloridacfo.com/division/consumers/storm/flood-disaster-faqs";
const FS_689_302 = "https://www.flsenate.gov/Laws/Statutes/2026/689.302";
const HB_1049 = "https://www.flsenate.gov/Session/Bill/2024/1049";
const FBC_FLOOD = "https://www.floridabuilding.org/fbc/thecode/2017-6edition/basf_2017_flood_061217.pdf";

const FS_190_003 = "https://www.flsenate.gov/Laws/Statutes/2024/190.003";
const FS_190_021 = "https://www.flsenate.gov/Laws/Statutes/2024/190.021";
const FS_197_3632 = "https://www.flsenate.gov/Laws/Statutes/2024/197.3632";
const FS_197_162 = "https://www.flsenate.gov/Laws/Statutes/2024/197.162";
const LWR_FAQ = "https://content.civicplus.com/api/assets/a5c987e7-c178-4ef2-9144-231beaad61fb";
const LWR_CEVA_MANUAL = "https://content.civicplus.com/api/assets/07e300e3-1105-41c9-b71a-8f514fb7521e";
const LWR_SRVA_MANUAL = "https://content.civicplus.com/api/assets/7dc73591-51b1-47f7-ac5a-58486c64b67a";
const LWR_GBVA_MANUAL = "https://content.civicplus.com/api/assets/911c1c9c-dea8-4f3c-ac9a-7e405457b0e0";
const LWRSD = "https://lakewoodranchstewardship.com/";
const LWRSD_GUIDE = "https://lakewoodranch.com/wp-content/uploads/2025/09/LWRSD-FAQ-Guide-9-16-25.pdf";
const WINDWARD_CDD = "https://windwardatlakewoodranchcdd.com/about";
const MANATEE_TC_2025 = "https://www.taxcollector.com/news.cfm?key=2025_open_collection";
const SARASOTA_TC = "https://www.sarasotataxcollector.gov/";
const SARASOTA_PAO_DATES = "https://www.sarasotapropertyappraiser.gov/appraisal-info/important-dates/";
const MANATEE_PAO_DATES = "https://www.manateepao.gov/important-dates/";

const NHC_CLIMO = "https://www.nhc.noaa.gov/climo/";
const CITIZENS_BINDING = "https://www.citizensfla.com/-/20260719-citizens-is-under-binding-suspension";
const FDEM_ZONE = "https://www.floridadisaster.org/knowyourzone/";
const MANATEE_EVAC = "https://www.mymanatee.org/services-and-amenities/service-listing/service-details/know-your-evacuation-level";
const SARASOTA_EVAC_LAYER = "https://services3.arcgis.com/icrWMv7eBkctFu1f/arcgis/rest/services/StormEvacuationZoneWM/FeatureServer/0";
const NHC_HELENE = "https://www.nhc.noaa.gov/data/tcr/AL092024_Helene.pdf";
const NHC_MILTON = "https://www.nhc.noaa.gov/data/tcr/AL142024_Milton.pdf";
const FEMA_DR_4828 = "https://www.fema.gov/disaster/4828";
const FEMA_DR_4834 = "https://www.fema.gov/disaster/4834";
const FEMA_FACT_076 = "https://www.fema.gov/fact-sheet/florida-helene-and-milton-recovery-fact-sheet-076";
const FEMA_SUBSTANTIAL = "https://www.fema.gov/about/glossary/substantial-damage";
const FEMA_FREEBOARD = "https://www.fema.gov/glossary/freeboard";

const DOR_PT113 = "https://floridarevenue.com/property/Documents/pt113.pdf";
const DOR_PT112 = "https://floridarevenue.com/property/Documents/pt112.pdf";
const FS_196_031 = "https://www.flsenate.gov/Laws/Statutes/2024/196.031";
const FS_196_011 = "https://www.flsenate.gov/Laws/Statutes/2024/196.011";
const FS_193_155 = "https://www.flsenate.gov/Laws/Statutes/2024/193.155";
const MANATEE_PAO_SOH = "https://www.manateepao.gov/definitions/exemptions-save-our-homes/";
const MANATEE_PAO_PORT = "https://www.manateepao.gov/definitions/portability-of-save-our-homes/";
const SARASOTA_PAO_SOH = "https://www.sarasotapropertyappraiser.gov/exemptions/homestead/save-our-homesportability/";

const GUIDE_INSPECTIONS = "/guides/inspections-on-the-suncoast-what-a-good-one-covers";
const GUIDE_FLOOD = "/guides/flood-zones-and-elevation-certificates-on-the-suncoast";
const GUIDE_GATED = "/blog/what-to-ask-before-you-buy-in-a-gated-community";
const ATLAS = "/neighborhoods";
const village = (slug: string) => `${ATLAS}/${slug}`;

/* ---- The guides ------------------------------------------------------------ */

export const WAVE2_GUIDES_A: Post[] = [
  {
    _id: "post-guide-flood-zones",
    title: "Flood zones and flood insurance, explained",
    slug: "flood-zones-and-elevation-certificates-on-the-suncoast",
    cover: img("library/bradenton-canal-ranch-twilight", "A canal-front ranch house at twilight in West Bradenton"),
    excerpt:
      "What a flood zone is, how to find the zone for a house, and what to check before you make an offer.",
    publishedAt: "2026-10-01",
    author: JESSICA,
    categories: ["Guides"],
    body: rich(
      p(
        "One letter decides the insurance quote, the lender’s requirement, and often whether a house is worth the drive. Here’s how to read it, how to look up the exact parcel, and what the paperwork behind it does and doesn’t do anymore.",
      ),
      h(2, "The three letters"),
      p(
        "A flood zone is FEMA’s label for how likely a piece of ground is to flood. The high-risk zones make up what FEMA calls the special flood hazard area: ground with at least a ",
        a("1 percent chance of flooding in any given year", FEMA_ZONES),
        ". On this coast that means zones AE and VE.",
      ),
      p(
        "Zone X is outside that area. Federal rules don’t require flood insurance there, and a quote is usually modest. Much of Lakewood Ranch and many inland streets in Sarasota and Bradenton sit in X on ",
        a("FEMA’s map", FEMA_MSC),
        ", and FEMA’s own line on it is that ",
        a("a low risk of flooding doesn’t mean no risk", FEMA_COASTAL),
        ". We usually recommend the policy anyway.",
      ),
      p(
        "Zone AE is ",
        a("the base floodplain, with a base flood elevation printed on the map", FEMA_ZONE_AE),
        ". The base flood elevation, or BFE, is ",
        a("the height the water is expected to reach in the flood that has that one-in-a-hundred chance each year", FEMA_BFE),
        ". With a federally backed mortgage, ",
        a("flood insurance is mandatory", FLOODSMART_ZONE),
        " here. Much of Siesta Key and the bayfront is AE on ",
        a("FEMA’s map", FEMA_MSC),
        ".",
      ),
      p(
        "Zone VE is the coastal high hazard area: the same flood, with waves on top. FEMA draws it where ",
        a("wave action and fast-moving water can cause extensive damage during the base flood", FEMA_COASTAL),
        ", which in practice means beachfront and open-bay lots. The building rules are stricter and the quotes higher. The newer maps also draw a line inside AE for moderate wave action, marking a coastal A zone where ",
        a("the building code applies its coastal rules", FBC_FLOOD),
        ".",
      ),
      h(2, "Look up the parcel, not the street"),
      p(
        "Zones change block to block, so look up the exact parcel. ",
        a("The FEMA Map Service Center", FEMA_MSC),
        " takes an address and gives you a printable map of the panel it sits on, plus any revisions since the map’s effective date. That’s the official map, and the one the insurer uses.",
      ),
      p(
        "Manatee County also runs a public flood site called ",
        a("ForeRunner", MANATEE_FORERUNNER),
        " that returns the flood records the county holds for an address, and ",
        a("the county’s floodplain page", MANATEE_FLOODPLAIN),
        " explains its land-development map, which has a FEMA Flood layer you can switch on and search by owner, address or parcel number.",
      ),
      p(
        "Sarasota County and the City of Sarasota are on maps that took effect on ",
        a("March 27, 2024", SARASOTA_CITY_MAPS),
        ", which replaced the previous set and added the moderate-wave line. The city’s page links the county’s own zone map; the county’s floodmaps page wouldn’t load for us when we checked, so we point people to the city’s.",
      ),
      h(2, "The elevation certificate"),
      p(
        "An elevation certificate is a surveyor’s form that records the height of the lowest floor against the base flood elevation, along with the zone, the foundation type and the flood openings. Manatee County required one for any house in the hazard area whose construction started after the beginning of ",
        a("1975", MANATEE_FLOODPLAIN),
        ", and its records office keeps copies.",
      ),
      p(
        "Here’s what changed. Under FEMA’s current pricing, called Risk Rating 2.0, ",
        a("you don’t need a certificate to buy a federal flood policy", FLOODSMART_EC),
        "; FEMA rates the building from its own elevation data. You can still hand one to the agent, and ",
        a("the insurer will check whether it lowers the premium", RR2_FAQ),
        ". A certificate that shows the floor higher than FEMA assumed can still bring a quote down more than anything else you hand the agent.",
      ),
      p(
        "So: ask the seller for it, and if there isn’t one, order it during the inspection period. In zones AE and VE the building department may also ",
        a("need it to confirm the house meets the local floodplain ordinance", FLOODSMART_EC),
        ". ",
        a("Our inspections guide", GUIDE_INSPECTIONS),
        " covers who orders what, and when.",
      ),
      h(2, "The thirty-day wait"),
      p("A new federal flood policy normally ", a("takes 30 days to go into effect", FEMA_WAIT), ". Buy it the day you close and you’re uncovered for a month."),
      p(
        "The exception is the one most buyers use. ",
        a("When the policy is bought in connection with making, increasing, extending or renewing a loan, there’s no waiting period", CFO_FLOOD),
        ". It starts at closing.",
      ),
      p(
        "The other exception is narrow: ",
        a("a policy bought in the 13 months after a community’s flood map is revised takes effect after a single day", CFO_FLOOD),
        ". Cash buyers get neither, so we put the flood application on the calendar the day the contract is signed, not the week of closing.",
      ),
      h(2, "What the seller has to tell you"),
      p(
        "Since ",
        a("October 1, 2024", HB_1049),
        ", Florida has required the seller of a home to hand the buyer ",
        a("a flood disclosure at or before the contract is signed", FS_689_302),
        ". Since October 1, 2025, it states whether the seller knows of flooding that damaged the property while they owned it, whether they’ve filed a flood insurance claim on it, and whether they’ve received assistance for flood damage to it, from FEMA or anyone else. It also reminds you that a homeowners policy doesn’t cover floods.",
      ),
      p(
        "Read it next to the elevation certificate and the claims history. A house that flooded once and was repaired properly can be a fine house. A disclosure that’s blank because the seller never carried flood insurance is a question, not an answer.",
      ),
      quote("The zone comes first, the certificate second and the quote third. Then we can talk about the kitchen."),
      p(
        "Send us the address and we’ll pull the zone, the certificate and the disclosure before you write an offer. If the three don’t agree, that’s the conversation to have first.",
      ),
      sources(
        { label: "FEMA, Flood zones (glossary)", href: FEMA_ZONES },
        { label: "FEMA, Zone AE (glossary)", href: FEMA_ZONE_AE },
        { label: "FEMA, Base flood elevation (glossary)", href: FEMA_BFE },
        { label: "FEMA, Features of flood insurance rate maps in coastal areas", href: FEMA_COASTAL },
        { label: "FloodSmart, What is my flood zone", href: FLOODSMART_ZONE },
        { label: "FEMA Flood Map Service Center", href: FEMA_MSC },
        { label: "Manatee County, Floodplain management", href: MANATEE_FLOODPLAIN },
        { label: "Manatee County, ForeRunner flood portal", href: MANATEE_FORERUNNER, note: "The portal opens as an application; we confirmed it loads, and we take its description from the county’s floodplain page" },
        { label: "City of Sarasota, Flood map information", href: SARASOTA_CITY_MAPS },
        { label: "Sarasota County, scgov.net/floodmaps", note: "returned an access error" },
        { label: "FloodSmart for agents, Elevation certificate questions", href: FLOODSMART_EC },
        { label: "FEMA and NFIP, Risk Rating 2.0 frequently asked questions (PDF)", href: RR2_FAQ },
        { label: "FEMA, Waiting period for a flood policy", href: FEMA_WAIT },
        { label: "Florida Chief Financial Officer, Flood insurance questions", href: CFO_FLOOD },
        { label: "Florida Statutes 689.302, flood disclosure", href: FS_689_302 },
        { label: "Florida Senate, CS/CS/HB 1049 (2024), chapter 2024-215, effective October 1, 2024", href: HB_1049 },
        { label: "Florida Building Code, flood-resistant construction guide (6th edition)", href: FBC_FLOOD },
      ),
    ),
  },

  {
    _id: "post-guide-cdd-villages",
    title: "CDD fees in Lakewood Ranch, explained",
    slug: "cdd-fees-in-lakewood-ranch-village-by-village",
    cover: img("library/lwr-fairways-bay-aerial", "Lakewood Ranch fairways and lakes from the air"),
    excerpt: "What a community development district is, which district your village is in, and how to read the two lines on your tax bill.",
    publishedAt: "2026-10-01",
    author: JOELYN,
    categories: ["Guides", "Lakewood Ranch"],
    body: rich(
      p(
        "Nearly every house in Lakewood Ranch pays a district assessment on its property tax bill, and the first question we get from anyone moving here is whether it ever goes away. The answer depends on which of the Ranch’s three kinds of district your village sits in. Here’s the map, the two lines on the bill, and how to read a parcel’s bill; no dollar figures, on purpose.",
      ),
      h(2, "What a district is"),
      p(
        "A community development district, or CDD, is ",
        a("a local unit of special-purpose government", FS_190_003),
        " created under state law for a community’s infrastructure. It borrows against bonds to build the roads, lakes and drainage up front, then ",
        a("levies assessments on the lots to repay the bonds and to maintain what was built", FS_190_021),
        ". It isn’t the homeowners association or the county; it’s a third thing, with its own board and its own budget.",
      ),
      p(
        "Those assessments are non-ad valorem, which means ",
        a("they aren’t based on the value of your house", FS_197_3632),
        ". Each district sets a figure per lot for its neighborhood, and the county tax collector collects it with your property taxes. Paying off the mortgage doesn’t touch it; the state defines it as a charge that can become a lien even on a homestead.",
      ),
      h(2, "The numbered districts"),
      p(
        "The original villages are divided into ",
        a("five numbered districts", LWR_FAQ),
        ", run from Town Hall, the office of the Lakewood Ranch Inter-District Authority, which calls this part of the Ranch Phase I. Our Atlas carries the district for every researched neighborhood, from the villages’ own manuals, and it sorts like this:",
      ),
      li("CDD 1: ", a("Summerfield", village("summerfield")), " and ", a("Riverwalk", village("riverwalk")), "."),
      li("CDD 2: ", a("Country Club South", village("country-club-south")), " and ", a("Edgewater", village("edgewater")), "."),
      li("CDD 4: ", a("Greenbrook", village("greenbrook")), "."),
      li("CDD 5: ", a("Country Club North", village("country-club-north")), "."),
      li("CDD 6: ", a("Country Club West", village("country-club-west")), "."),
      p(
        "There’s no district three on that list. The village manuals describe the districts’ job today as maintenance: ",
        a("the infrastructure, the common landscaping and the gates", LWR_CEVA_MANUAL),
        ". Town Hall’s guide adds the detail that matters on an older bill: ",
        a("the debt line reads zero once a district’s original bonds are paid in full, while the maintenance line continues indefinitely", LWR_FAQ),
        ".",
      ),
      h(2, "The Stewardship District"),
      p(
        "Everything the numbered districts don’t cover belongs to the Lakewood Ranch Stewardship District, ",
        a("created by a special act of the Legislature in 2005", LWRSD),
        " and covering land in both Manatee and Sarasota counties. It’s one district across many villages, with ",
        a("assessments that vary by neighborhood according to what was built to serve it", LWRSD_GUIDE),
        ". Day-to-day upkeep of each village stays with its homeowners association, not the district.",
      ),
      p(
        "The Atlas places these villages in the Stewardship District, each from a district or association record: ",
        a("Country Club East", village("country-club-east")),
        ", ",
        a("The Lake Club", village("the-lake-club")),
        ", ",
        a("Lorraine Lakes", village("lorraine-lakes")),
        ", ",
        a("Polo Run", village("polo-run")),
        ", ",
        a("Star Farms", village("star-farms")),
        ", ",
        a("Azario", village("azario")),
        ", ",
        a("Cresswind", village("cresswind")),
        ", ",
        a("Del Webb", village("del-webb")),
        ", ",
        a("Indigo", village("indigo")),
        ", ",
        a("Lakewood National", village("lakewood-national-golf-club")),
        ", ",
        a("The Isles", village("the-isles")),
        ", ",
        a("Sweetwater", village("sweetwater")),
        " and ",
        a("Central Park", village("central-park")),
        ". ",
        a("Waterside", village("waterside")),
        ", on the Sarasota County side, isn’t tagged with a district in our data yet, so for a Waterside address we read the parcel’s bill rather than assume.",
      ),
      h(2, "Windward"),
      p(
        a("Windward", village("windward")),
        ", also on the Sarasota County side, has its own community development district, ",
        a("created by county ordinance in December 2019", WINDWARD_CDD),
        ". When we checked, its page said the district hadn’t yet raised the funding for its planned improvements, so its bill won’t look like an older village’s. Read the current year’s bill, not a neighbor’s.",
      ),
      h(2, "The two lines on the bill"),
      p(
        "Whichever district you’re in, the assessment arrives as two lines in the non-ad valorem section of the bill. The first is the debt line, ",
        a("labeled I&S on the Ranch, which Town Hall’s FAQ calls debt service", LWR_FAQ),
        ": the lot’s share of repaying the bonds that built the infrastructure. The Stewardship District describes its capital assessment as ",
        a("fixed once set, repaid over about thirty years, and payable in full at closing if a buyer prefers", LWRSD_GUIDE),
        ".",
      ),
      p(
        "The second is operations and maintenance, or O&M, ",
        a("which funds the year’s upkeep and can change from year to year", LWRSD_GUIDE),
        ". When someone tells you a village has paid off its CDD, they usually mean the first line; ask about the second.",
      ),
      h(2, "How to read a parcel’s bill"),
      p(
        "Pull the bill for the exact parcel. In Manatee County ",
        a("the tax collector’s site", MANATEE_TC_2025),
        " lets you search an address and print a duplicate bill; in Sarasota County the search runs through ",
        a("the tax collector’s online portal", SARASOTA_TC),
        ". Find the section headed non-ad valorem assessments and read the district’s name beside each line: debt, then maintenance.",
      ),
      p(
        "Then check the August notice: the property appraiser’s notice of proposed property taxes, the TRIM notice, which ",
        a("lists the proposed non-ad valorem assessments for the coming bill alongside the taxes", SARASOTA_PAO_DATES),
        "; ",
        a("Manatee’s calendar", MANATEE_PAO_DATES),
        " runs the same way. If you’re buying in the fall, it’s a better preview of next year’s bill than the seller’s last one.",
      ),
      p(
        "Two more things. The bills go out in November ",
        a("with a discount for paying that month", FS_197_162),
        ", so a fall closing usually prorates a bill that’s already been issued; ",
        a("Manatee’s collector announces the mailing each year", MANATEE_TC_2025),
        ". And because it’s collected with the taxes rather than by the association, it appears on the tax bill, not on the estoppel letter, the association’s statement of what a seller owes.",
      ),
      quote("The district built the lake you’re looking at. The bill is how the lake gets paid for. Read it before you fall for the view."),
      p(
        "We don’t print dollar amounts because they differ by neighborhood and year, and a figure without a parcel attached would be wrong for most readers. Send us the address and we’ll pull the bill, the district and the August notice and read them with you.",
      ),
      sources(
        { label: "Lakewood Ranch Town Hall, CDD and HOA frequently asked questions (PDF)", href: LWR_FAQ },
        { label: "Country Club/Edgewater Village Association, homeowners’ manual (PDF), CDD 2 and CDD 5", href: LWR_CEVA_MANUAL },
        { label: "Summerfield/Riverwalk Village Association, homeowners’ manual (PDF), CDD 1", href: LWR_SRVA_MANUAL },
        { label: "Greenbrook Village Association, homeowners’ manual (PDF), CDD 4", href: LWR_GBVA_MANUAL },
        { label: "Lakewood Ranch Stewardship District", href: LWRSD },
        { label: "A Guide to the Lakewood Ranch Stewardship District (PDF, September 2025)", href: LWRSD_GUIDE },
        { label: "Windward at Lakewood Ranch CDD, About the district", href: WINDWARD_CDD },
        { label: "Florida Statutes 190.003, definition of a community development district", href: FS_190_003 },
        { label: "Florida Statutes 190.021, district assessments", href: FS_190_021 },
        { label: "Florida Statutes 197.3632, non-ad valorem assessments", href: FS_197_3632 },
        { label: "Florida Statutes 197.162, discounts for early payment", href: FS_197_162 },
        { label: "Manatee County Tax Collector, collection of 2025 property taxes", href: MANATEE_TC_2025 },
        { label: "Sarasota County Tax Collector", href: SARASOTA_TC },
        { label: "Sarasota County Property Appraiser, Important dates", href: SARASOTA_PAO_DATES },
        { label: "Manatee County Property Appraiser, Important dates", href: MANATEE_PAO_DATES },
        { label: "The Atlas, Lakewood Ranch villages, each with its sourced district record", href: `${ATLAS}?market=lakewood-ranch` },
        { label: "Town Hall’s district pages at mylwr.com", note: "open as an application with no readable text, so the district assignments above come from the village manuals and Town Hall’s own FAQ" },
      ),
    ),
  },

  {
    _id: "post-guide-hurricane-season",
    title: "Hurricane season, evacuation zones and the 2024 storms, explained",
    slug: "hurricane-season-evacuation-zones-and-what-changed-after-helene-and-milton",
    cover: img("library/place-storm-gulf", "A storm over the Gulf"),
    excerpt: "What an evacuation zone is, what Helene and Milton did to this coast, and what to ask about a house that was rebuilt since.",
    publishedAt: "2026-10-01",
    author: JOELYN,
    categories: ["Guides"],
    body: rich(
      p(
        "Two storms in the fall of 2024 changed how this coast thinks about water, and showed what the rules already on the books do. Here’s the calendar, the letters, what happened to the places we sell, and what we now ask about any house repaired afterward. We’ll keep to places and rules.",
      ),
      h(2, "The season"),
      p(
        a("The Atlantic hurricane season runs from the first of June through the end of November", NHC_CLIMO),
        ", and the National Hurricane Center puts the statistical peak on September 10.",
      ),
      p(
        "The practical effect on a purchase is binding. Citizens, the state-backed insurer, ",
        a("stops binding new policies and coverage increases whenever the National Weather Service issues a tropical storm or hurricane watch or warning for any part of Florida", CITIZENS_BINDING),
        ", until the suspension is lifted. A closing that needs a new policy can wait a few days, so from June on we build that into the contract dates.",
      ),
      h(2, "An evacuation zone is not a flood zone"),
      p(
        "Evacuation levels are drawn by county emergency management from storm-surge modeling: ",
        a("how high salt water could push inland in a hurricane", MANATEE_EVAC),
        ", by address. Flood zones are FEMA’s insurance maps, covering flooding from any source. Manatee County says it plainly: ",
        a("evacuation levels are not the same as flood zones and don’t correspond to a storm’s category", MANATEE_EVAC),
        ". The two maps answer different questions, so a house can sit outside FEMA’s hazard area and still inside an evacuation level.",
      ),
      p(
        "Both counties use letters A through E, with A evacuated first; ",
        a("the state’s Know Your Zone page", FDEM_ZONE),
        " explains the lettering statewide. Manatee County publishes its levels on ",
        a("a lookup page with an interactive map", MANATEE_EVAC),
        ", and Sarasota County publishes ",
        a("a storm evacuation zone layer", SARASOTA_EVAC_LAYER),
        " that ties each letter to a surge height; the county’s own lookup page wouldn’t load for us, so we cite the layer. Every researched place in ",
        a("our Atlas", ATLAS),
        " carries the level we checked, with the county’s link beside it.",
      ),
      h(2, "What Helene did"),
      p(
        "Helene never came ashore here. It ran north well offshore on ",
        a("September 26, 2024", NHC_HELENE),
        " toward a Big Bend landfall, and the size of its wind field pushed a surge down the whole west coast.",
      ),
      p(
        "The Hurricane Center’s report records ",
        a("peak inundation of 5 to 7 feet above ground from the Anclote River south to Longboat Key", NHC_HELENE),
        ", where a sensor measured a storm tide of 6.68 feet above the normal high-tide mark.",
      ),
      p(
        "On Anna Maria Island, the report relays emergency managers’ estimate that ",
        a("90 to 95 percent of the structures on Bradenton Beach were destroyed by the surge", NHC_HELENE),
        ", and it records numerous structures damaged along Sarasota County’s coast.",
      ),
      h(2, "What Milton did"),
      p(
        "Milton made landfall on Siesta Key on the evening of ",
        a("October 9, 2024", NHC_MILTON),
        " as a major hurricane, after reaching the top of the scale over the Gulf earlier that week.",
      ),
      p(
        "Near the landfall the report records ",
        a("inundation of 4 to 6 feet from Longboat Key to Venice", NHC_MILTON),
        ", with waves on top, and notes that the shoreline was still carrying Helene’s erosion and debris, which compounded the damage. Inland, Milton was a wind and rain storm with a tornado outbreak across the peninsula.",
      ),
      p(
        "Each storm became its own federal disaster declaration for Florida within days (",
        a("Helene", FEMA_DR_4828),
        ", ",
        a("Milton", FEMA_DR_4834),
        "), and ",
        a("FEMA’s running tally of the two", FEMA_FACT_076),
        " shows most of the federal flood-insurance claims paid in the state came from Helene, the water storm, rather than Milton, the wind storm.",
      ),
      h(2, "The rules that bite after a storm"),
      p(
        "The rule this coast learned the name of is substantial damage. FEMA defines it as ",
        a("damage of any origin where the cost of restoring the building to its condition before the damage would equal or exceed 50 percent of the building’s market value before the damage", FEMA_SUBSTANTIAL),
        ". Cross that line in a flood hazard area and the building has to be brought up to today’s floodplain rules, which usually means elevating or rebuilding; ",
        a("Manatee County’s floodplain page", MANATEE_FLOODPLAIN),
        " uses the same definition.",
      ),
      p(
        "Today’s rules include freeboard, ",
        a("an additional amount of height above the base flood elevation", FEMA_FREEBOARD),
        ", the base flood elevation being the height FEMA expects the water to reach in the flood its maps are drawn for. ",
        a("The Florida Building Code requires the lowest floor in a flood hazard area to sit at least a foot above that elevation", FBC_FLOOD),
        ", or higher where a local ordinance says so. That’s why a substantially damaged house on a low lot often became an elevated rebuild rather than a repair, and why the county’s determination letter matters as much as the contractor’s invoice.",
      ),
      h(2, "What to ask about a house that was rebuilt"),
      li("The permit history for the work, from the county or city building department, and whether any of it was permitted as repair of substantial damage."),
      li("The substantial damage determination, if one was issued, and what it required."),
      li(
        "A new elevation certificate if the floor was raised, and the flood policy’s claims history. ",
        a("The seller’s flood disclosure has to say whether they know of flood damage while they owned the house, whether they filed a flood claim and whether they received assistance for flood damage", FS_689_302),
        "; ",
        a("our flood-zone guide", GUIDE_FLOOD),
        " covers it.",
      ),
      li("The evacuation level and the flood zone, separately, from the county’s lookup and FEMA’s map."),
      quote("Helene showed this coast the water. Milton showed it the wind. The rules were already written, and the paperwork is where you can see them work."),
      p("We walked these streets in the weeks after and keep notes by block. Ask us what a street did; it’s a better question than what the listing says."),
      sources(
        { label: "National Hurricane Center, season climatology", href: NHC_CLIMO },
        { label: "Citizens Property Insurance, binding suspension notice", href: CITIZENS_BINDING, note: "Citizens’ own rule; private carriers set their own" },
        { label: "Florida Division of Emergency Management, Know Your Zone", href: FDEM_ZONE },
        { label: "Manatee County, Know your evacuation level", href: MANATEE_EVAC },
        { label: "Sarasota County, storm evacuation zone layer (ArcGIS feature service)", href: SARASOTA_EVAC_LAYER },
        { label: "Sarasota County, Know your evacuation zone page", note: "returned an access error" },
        { label: "National Hurricane Center, tropical cyclone report on Hurricane Helene (PDF)", href: NHC_HELENE },
        { label: "National Hurricane Center, tropical cyclone report on Hurricane Milton (PDF)", href: NHC_MILTON },
        { label: "FEMA, Florida Hurricane Helene, DR-4828", href: FEMA_DR_4828 },
        { label: "FEMA, Florida Hurricane Milton, DR-4834", href: FEMA_DR_4834 },
        { label: "FEMA, Florida Helene and Milton recovery fact sheet 076 (February 2026)", href: FEMA_FACT_076 },
        { label: "FEMA, Substantial damage (glossary)", href: FEMA_SUBSTANTIAL },
        { label: "FEMA, Freeboard (glossary)", href: FEMA_FREEBOARD },
        { label: "Manatee County, Floodplain management", href: MANATEE_FLOODPLAIN },
        { label: "Florida Building Code, flood-resistant construction guide (6th edition)", href: FBC_FLOOD },
        { label: "Florida Statutes 689.302, flood disclosure", href: FS_689_302 },
      ),
    ),
  },

  {
    _id: "post-guide-homestead",
    title: "Homestead, Save Our Homes and portability, explained",
    slug: "homestead-save-our-homes-and-portability",
    cover: img("library/kitchen-white-palms", "A white kitchen with palms outside the window"),
    excerpt: "Why the tax on a listing isn’t yours, what homestead takes off your bill, and what you can carry to the next house.",
    publishedAt: "2026-10-01",
    author: JESSICA,
    categories: ["Guides"],
    body: rich(
      p(
        "The tax figure on a listing is the seller’s bill, not yours. Here’s the arithmetic behind that sentence, in the order it hits a new owner: the exemption, the cap, the reset, and the part you can bring with you.",
      ),
      h(2, "Homestead: the two tiers"),
      p("Homestead is the exemption Florida gives a home that’s ", a("your permanent residence on January 1 of the tax year", DOR_PT113), ". It comes in two pieces."),
      li(a("The first $25,000 of assessed value is exempt from every property tax, including the school district’s levy", DOR_PT113), "."),
      li(
        "The second tier is worth up to the same amount again, but ",
        a("it applies only to the slice of assessed value above $50,000, and not to school taxes", FS_196_031),
        ".",
      ),
      p(
        "The second tier has been ",
        a("adjusted for inflation each January since 2025", DOR_PT113),
        " in years when the consumer price index rises, so its exact figure drifts; the Department of Revenue’s brochure prints the current one. The first tier doesn’t move.",
      ),
      p(
        "You apply once, with the county property appraiser, ",
        a("by March 1 of the first year you want it", FS_196_011),
        "; ",
        a("Manatee’s appraiser takes it online", MANATEE_PAO_SOH),
        ", and ",
        a("Sarasota’s calendar shows the same cut-off", SARASOTA_PAO_DATES),
        ". Miss the date and you wait a year, paying the full bill in the meantime.",
      ),
      h(2, "Save Our Homes: the cap"),
      p(
        "Once a home has homestead, Save Our Homes limits how much its assessed value can rise each year: ",
        a("3 percent or the change in the consumer price index, whichever is lower", DOR_PT112),
        ". The market value, which the appraiser calls just value, can jump. The assessed value the tax is figured on can’t keep up. The gap between the two is the owner’s benefit, and after a long run of rising prices it can be most of the house.",
      ),
      p(
        "Which is the whole point about the listing. The seller’s bill was figured on an assessed value capped for as long as they’ve owned the place, minus their exemptions. None of that is attached to the house. It’s attached to them.",
      ),
      h(2, "The reset"),
      p(
        "When a homestead changes hands, the property is ",
        a("assessed at just value on the following January 1", FS_193_155),
        ". The seller’s exemption and cap ",
        a("stay on the bill through the end of the year of the sale and come off on the first of the next year", MANATEE_PAO_SOH),
        ". Your first full-year bill is built on roughly what you paid, less your own exemption if you filed in time.",
      ),
      p(
        "So the bill runs in steps. In the year you buy, you inherit the seller’s capped assessment and settle their prorated bill at closing, prorated meaning split by the days each of you owned the house. The next year the assessment resets to just value and your homestead comes off that. The year after, the cap starts working for you, because ",
        a("it limits the increase from the first assessment made after your exemption", DOR_PT112),
        ". Budget on the reset, not on the listing.",
      ),
      h(2, "Portability: what you can carry"),
      p(
        "If you’re moving from one Florida homestead to another, you can transfer some or all of the Save Our Homes benefit, that gap between just and assessed value, to the new house. ",
        a("The most that can move is $500,000", FS_193_155),
        ".",
      ),
      p(
        "The window is three years. ",
        a("You have to establish the new homestead within three years of January 1 of the year you gave up the old one", DOR_PT112),
        ", which the Department of Revenue is careful to say is not three years from the sale date. Sell in the spring, and the clock started the January before.",
      ),
      p(
        "Moving up, you carry the whole gap, up to the cap. Moving down, you carry ",
        a("the same share of value rather than the same dollars", MANATEE_PAO_PORT),
        ": ",
        a("the new home’s assessed value becomes its just value divided by the old home’s just value, times the old assessed value", FS_193_155),
        ". Either way it’s a separate form, the transfer of homestead assessment difference, ",
        a("filed with the homestead application by the same March deadline", DOR_PT112),
        ". The homestead application alone doesn’t move it.",
      ),
      h(2, "What to do with this"),
      p(
        "Do three things, in order. Get the seller’s just value and assessed value from the property appraiser’s record, because the difference is what you’ll lose and what they could carry. Run your own first full-year bill off just value, the two tiers and the millage, the tax rate per thousand dollars of value, which the August notice of proposed property taxes, the TRIM notice, spells out. And if you’re selling a Florida homestead to buy here, put the portability form on the moving checklist with a date beside it.",
      ),
      quote("The listing’s tax line belongs to the seller. Yours starts the January after you close."),
      p(
        a("Our relocation planner", "/relocate"),
        " lays those dates out around your closing, including the March filing. Send us the address and we’ll pull the appraiser’s record and walk through yours.",
      ),
      sources(
        { label: "Florida Department of Revenue, PT-113, property tax information for homestead exemption (PDF)", href: DOR_PT113 },
        { label: "Florida Department of Revenue, PT-112, Save Our Homes assessment limitation and portability transfer (PDF)", href: DOR_PT112 },
        { label: "Florida Statutes 196.031, homestead exemptions", href: FS_196_031 },
        { label: "Florida Statutes 196.011, applications for exemptions", href: FS_196_011 },
        { label: "Florida Statutes 193.155, homestead assessments, the cap, the reset and portability", href: FS_193_155 },
        { label: "Manatee County Property Appraiser, Exemptions and Save Our Homes", href: MANATEE_PAO_SOH },
        { label: "Manatee County Property Appraiser, Portability of Save Our Homes", href: MANATEE_PAO_PORT },
        { label: "Manatee County Property Appraiser, Important dates", href: MANATEE_PAO_DATES },
        { label: "Sarasota County Property Appraiser, Save Our Homes and portability", href: SARASOTA_PAO_SOH },
        { label: "Sarasota County Property Appraiser, Important dates", href: SARASOTA_PAO_DATES },
      ),
    ),
  },
];
