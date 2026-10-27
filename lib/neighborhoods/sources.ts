import type { NeighborhoodSource } from "./types";

/**
 * How a record's sources read on the page. The dataset keeps `supports` as a
 * terse list of field keys with research notes in brackets, and `url` as the
 * exact page that was opened. The Sources panel is where Atlas shows its work,
 * so both get a plain reading here: field keys become short labels, hosts
 * become publishers, and a link that has since gone dead and was swapped for
 * its Wayback copy says so. Nothing in the data changes.
 */

/** Field key (as written in `supports`, brackets removed) to the label a visitor reads. Order sets the label order. */
const LABELS: [RegExp, string][] = [
  [/^(existence|name|alias(es)?|aliases?|former (plan )?name|status-label)$/, "Exists and name"],
  [/^type$/, "Type"],
  [/^(parent|parentslug|parent village|parent village facts|in[- ]lwr[- ]master[- ]plan|neighborhoods|sub-neighborhoods|enclaves|sections|section (list|name|associations merged)|village|phase i village|\d+ neighborhoods|neighborhood names|sub-association names|sub-associations)$/, "Where it sits"],
  [/^(lat|lng|lat\/lng|location|recorded plat.*|address check.*)$/, "Map location"],
  [/^(zips?|zip \d{5}|postal community|postal sarasota|address|city|county|bradentonarea|club address|sales (center|office))$/, "ZIP and address point"],
  [/^(jurisdiction)$/, "Jurisdiction"],
  [/^zonedschools\.checkedaddress$/, "Address point for schools"],
  [/^zonedschools$/, "Zoned schools"],
  [/^evacuationzone$/, "Evacuation zone"],
  [/^(hoa|hoa\.name|hoa\.name confirmed|hoa\.website|hoa website|association|association status active|village association|cc&rs|deed-restricted|maintenance-free|discovery: association website link)$/, "Association"],
  [/^(cdd|cdd existence|no cdd|cdd \d|district .*|special district.*|stewardship district)$/, "Community development district"],
  [/^(status|status-conflict|status evidence.*|opened|broke ground.*)$/, "Selling status"],
  [/^(activebuilders|builders?|builder-list|builder .*|developer)$/, "Builders"],
  [/^(hometypes|townhomes|homesite size)$/, "Home types"],
  [/^(homecount|totalhomes|over \d+ homes|\d+-home village)$/, "Home count"],
  [/^(amenities|village amenities|planned amenities|golf courses)$/, "Amenities"],
  [/^gated$/, "Gated"],
  [/^wateraccess$/, "Water access"],
  [/^(yearsbuilt|established \d{4}|created \d{4}|history)$/, "Years built"],
  [/^(officialurl|official site)$/, "Official site"],
  [/^acreage$/, "Acreage"],
  [/^description$/, "Description"],
  [/^notes$/, "Notes"],
];

/** Drop the bracketed research notes, including a bracket that was never closed. */
function stripNotes(s: string): string {
  let out = "";
  let depth = 0;
  for (const ch of s) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0) out += ch;
  }
  return out;
}

/**
 * "existence,parent (Country Club North roster),hoa,cdd" reads as
 * "Exists and name, Where it sits, Association, Community development district".
 * Keys the table doesn't know are left out rather than shown raw; a source
 * with nothing readable says "Record details".
 */
export function describeSupports(supports: string): string {
  const seen = new Set<string>();
  for (const raw of stripNotes(supports).split(/[,;]/)) {
    const key = raw.trim().replace(/\s+/g, " ").toLowerCase();
    if (!key) continue;
    const hit = LABELS.find(([re]) => re.test(key));
    if (hit) seen.add(hit[1]);
  }
  return seen.size ? [...seen].join(", ") : "Record details";
}

/** Publishers behind the hosts the dataset cites most. A host not listed here shows as itself. */
const PUBLISHERS: [RegExp, string][] = [
  [/^services1\.arcgis\.com\/t03WDvnSR7gSDOB2\//, "Manatee County GIS"],
  [/^(www\.)?mymanatee\.org\/giscomm\//, "Manatee County GIS"],
  [/^(www\.)?mymanatee\.org\//, "Manatee County"],
  [/^manateepao\.gov\//, "Manatee County Property Appraiser"],
  [/^(www\.)?manateeschools\.net\//, "School District of Manatee County"],
  [/^app\.guidek12\.com\/manateefl\//, "School District of Manatee County locator"],
  [/^services6\.arcgis\.com\/wl0q8tN2gn8MMx1p\//, "City of Bradenton GIS"],
  [/^(www\.)?cityofbradenton\.com\//, "City of Bradenton"],
  [/^ags3\.scgov\.net\//, "Sarasota County GIS"],
  [/^services3\.arcgis\.com\/icrWMv7eBkctFu1f\//, "Sarasota County GIS"],
  [/^services3\.arcgis\.com\/AWDwYUpli8WqpWxQ\//, "City of Sarasota GIS"],
  [/^neighborhoods\.scgov\.net\//, "Sarasota County neighborhood associations"],
  [/^ftp\.scgov\.net\//, "Sarasota County"],
  [/^(www\.)?scgov\.net\//, "Sarasota County"],
  [/^(www\.)?sarasotacountyschools\.net\//, "Sarasota County Schools"],
  [/^sarco\.maps\.arcgis\.com\//, "Sarasota County Schools locator"],
  [/^(www\.)?sarasotapropertyappraiser\.gov\//, "Sarasota County Property Appraiser"],
  [/^(www\.)?sarasotafl\.gov\//, "City of Sarasota"],
  [/^services2\.arcgis\.com\/Lu7Uh8HEPwu0SbYS\//, "Town of Longboat Key GIS"],
  [/^(www\.)?longboatkey\.org\//, "Town of Longboat Key"],
  [/^(www\.)?cityofannamaria\.com\//, "City of Anna Maria"],
  [/^content\.civicplus\.com\//, "Lakewood Ranch documents"],
  [/^(www\.)?lakewoodranch\.com\//, "Lakewood Ranch"],
  [/^(www\.)?mylwr\.com\//, "Lakewood Ranch Town Hall"],
  [/^specialdistrictreports\.floridajobs\.org\//, "Florida special district list"],
  [/^(www\.)?flauditor\.gov\//, "Florida Auditor General"],
  [/^search\.sunbiz\.org\//, "Florida Division of Corporations"],
  [/^(www\.)?myfloridalicense\.com\//, "Florida DBPR"],
  [/^(npgallery|mapservices)\.nps\.gov\//, "National Register of Historic Places"],
  [/^tigerweb\.geo\.census\.gov\//, "US Census TIGERweb"],
];

/** Builder and management sites, by host. */
const COMPANIES: Record<string, string> = {
  "drhorton.com": "D.R. Horton",
  "taylormorrison.com": "Taylor Morrison",
  "medallionhome.com": "Medallion Home",
  "lennar.com": "Lennar",
  "homesbywestbay.com": "Homes by WestBay",
  "pulte.com": "Pulte Homes",
  "mihomes.com": "M/I Homes",
  "nealcommunities.com": "Neal Communities",
  "nealsignaturehomes.com": "Neal Signature Homes",
  "kbhome.com": "KB Home",
  "lwhomes.com": "Lee Wetherington Homes",
  "johncannonhomes.com": "John Cannon Homes",
  "meritagehomes.com": "Meritage Homes",
  "delwebb.com": "Del Webb",
  "richmondamerican.com": "Richmond American Homes",
  "ryanhomes.com": "Ryan Homes",
  "cardelhomes.com": "Cardel Homes",
  "mattamyhomes.com": "Mattamy Homes",
  "highlandhomes.org": "Highland Homes",
  "dreamfindershomes.com": "Dream Finders Homes",
  "kolterhomes.com": "Kolter Homes",
  "davidweekleyhomes.com": "David Weekley Homes",
  "tollbrothers.com": "Toll Brothers",
  "ashtonwoods.com": "Ashton Woods",
  "starlighthomes.com": "Starlight Homes",
  "centex.com": "Centex",
  "divosta.com": "DiVosta",
  "perryhomes.com": "Perry Homes",
  "homesbytowne.com": "Homes by Towne",
  "arhomes.com": "AR Homes",
  "minto.com": "Minto",
  "marondahomes.com": "Maronda Homes",
  "anchorbuilders.com": "Anchor Builders",
  "cscmsi.com": "Castle Group",
  "sunstatemanagement.com": "Sunstate Association Management",
};

const WAYBACK = /^https?:\/\/web\.archive\.org\/web\/(\d{4})(\d{2})(\d{2})\d*(?:[a-z_]+)?\/(https?:\/\/.+)$/;

/** A Wayback Machine link: the original URL and the snapshot's date, or null for a live link. */
export function archivedCopy(url: string): { original: string; snapshot: string } | null {
  const m = url.match(WAYBACK);
  return m ? { original: m[4]!, snapshot: `${m[1]}-${m[2]}-${m[3]}` } : null;
}

function hostAndPath(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname}`;
  } catch {
    return url;
  }
}

/** "Sarasota County GIS", "KB Home", or the bare host when nobody is on the list. */
export function publisherOf(url: string): string {
  const target = archivedCopy(url)?.original ?? url;
  const hp = hostAndPath(target);
  const gov = PUBLISHERS.find(([re]) => re.test(hp));
  if (gov) return gov[1];
  const host = hp.split("/")[0]!.replace(/^www\./, "");
  const company = Object.keys(COMPANIES).find((h) => host === h || host.endsWith(`.${h}`));
  return company ? COMPANIES[company]! : host;
}

/** "Sep 23, 2026" from the dataset's YYYY-MM-DD. */
export function checkedOn(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d);
}

export type SourceLine = {
  url: string;
  publisher: string;
  supports: string;
  checked: string;
  /** Set when the link is a Wayback copy of a page that has since gone. */
  archived?: { original: string; snapshot: string };
};

/** One source as the panel prints it. */
export function sourceLine(s: NeighborhoodSource): SourceLine {
  const archived = archivedCopy(s.url) ?? undefined;
  return { url: s.url, publisher: publisherOf(s.url), supports: describeSupports(s.supports), checked: checkedOn(s.checked), archived };
}
