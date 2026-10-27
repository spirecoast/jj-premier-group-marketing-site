import type { Metadata } from "next";
import type { Event, Listing, SiteSettings, TeamMember } from "@/lib/content/types";
import { formatAddress } from "@/lib/content/format";
import { marketName } from "@/lib/content/markets";
import { allSocialLinks, site } from "@/lib/site";
import { curly } from "@/lib/typography";

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

const DEFAULT_OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: `${site.name} · ${site.tagline}`,
};

/**
 * Page metadata with Open Graph defaults.
 *
 * Next.js replaces (does not merge) a parent's `openGraph` object, so the
 * site default image is set here explicitly. Pages with a sibling
 * opengraph-image.tsx pass `fileImage: true` so the `images` key is left
 * out and the file-based image is used.
 */
const SUFFIX = ` · ${site.name}`;
const SEP = " · ";
/** And about 155 of a description: a longer one ends at its last whole sentence, or word, that fits. */
export const DESCRIPTION_MAX = 158;
/** Under this a description leaves most of a search result's two lines empty; tests hold every sitemap page above it. */
export const DESCRIPTION_MIN = 110;

/**
 * Search results cut a title by width, not by count: about 600px of 20px Arial on a desktop. These are
 * Arial's advance widths (per 1,000 units of the em); anything not listed counts as a lowercase letter.
 */
const ARIAL: Record<string, number> = {
  " ": 278, "!": 278, '"': 355, "'": 191, "’": 191, "‘": 191, "“": 333, "”": 333, "(": 333, ")": 333, ",": 278, "-": 333, ".": 278,
  "/": 278, ":": 278, ";": 278, "?": 556, "·": 278, "&": 667, "®": 737, "–": 556, "—": 1000, "…": 1000,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667,
  Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556,
  q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
};
/** The width a search result gives a title, in pixels. */
export const TITLE_PX = 600;
export function titleWidth(text: string): number {
  let units = 0;
  for (const ch of text) units += ARIAL[ch] ?? 556;
  return (units * 20) / 1000;
}
const fits = (text: string) => titleWidth(text) <= TITLE_PX;

/**
 * One title template for every page: the page's title, its qualifiers (a place's town and kind, an
 * event's venue), then " · JJ Premier Group", as much of that as fits a search result. Qualifiers go
 * first, from the last, so "Arboreal · Sarasota · Condominium community" keeps the team's name before
 * it keeps the kind of community; only a title too long to share the line at all stands alone, and
 * then it keeps whatever qualifiers fit. Quotes come out curly.
 */
export function composeTitle(title: string, qualifiers: string[] = [], absolute = false): string | { absolute: string } {
  const segs = [title, ...qualifiers].map(curly);
  if (absolute) return { absolute: segs.join(SEP) };
  for (let n = segs.length; n >= 1; n -= 1) {
    const head = segs.slice(0, n).join(SEP);
    if (fits(head + SUFFIX)) return head;
  }
  for (let n = segs.length; n > 1; n -= 1) {
    const head = segs.slice(0, n).join(SEP);
    if (fits(head)) return { absolute: head };
  }
  return { absolute: segs[0]! };
}

/** Words a full stop follows without ending the sentence: "St. Armands", "D.R. Horton", "N. Orange Ave." */
const ABBREVIATION = /(?:^|\s)(?:[A-Z]|[A-Z]\.[A-Z]|St|Dr|Ave|Blvd|Rd|Ln|Mt|Ft|No|Inc|Co|Corp|Jr|Sr|Mr|Mrs|Ms|vs|approx|e\.g|i\.e)$/;

export function clampDescription(text: string, max = DESCRIPTION_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  let sentence = -1;
  for (const m of cut.matchAll(/[.!?](?=\s)/g)) {
    if (m[0] === "." && ABBREVIATION.test(cut.slice(0, m.index))) continue;
    sentence = m.index;
  }
  if (sentence > max * 0.55) return cut.slice(0, sentence + 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:·–-]+$/, "")}…`;
}

export function pageMetadata({
  title,
  titleQualifiers,
  description,
  path,
  image,
  fileImage,
  type = "website",
  noIndex,
  absoluteTitle,
}: {
  title: string;
  /** Segments after the title that may give way to the team's name in a search result: a place's town and kind, an event's venue. */
  titleQualifiers?: (string | undefined | null | false)[];
  description: string;
  path: string;
  image?: { src: string; alt: string; width?: number; height?: number };
  fileImage?: boolean;
  type?: "website" | "article";
  noIndex?: boolean;
  /** Use the title as-is instead of the root "%s · JJ Premier Group" template. */
  absoluteTitle?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  description = clampDescription(curly(description));
  const qualifiers = (titleQualifiers ?? []).filter((q): q is string => Boolean(q));
  const ogTitle = [title, ...qualifiers].map(curly).join(SEP);
  const images = image
    ? [{ url: image.src, alt: image.alt, width: image.width, height: image.height }]
    : fileImage
      ? undefined
      : [DEFAULT_OG_IMAGE];
  return {
    title: composeTitle(title, qualifiers, absoluteTitle),
    description,
    alternates: { canonical: url },
    // Only set when a page opts out; an explicit `undefined` would override the
    // root layout's NEXT_PUBLIC_ROBOTS_NOINDEX rule instead of inheriting it.
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      url,
      title: ogTitle,
      description,
      siteName: site.name,
      locale: site.locale,
      ...(images ? { images } : {}),
    },
    twitter: { card: "summary_large_image", title: ogTitle, description },
  };
}

function postalAddress(a: { street: string; city: string; state: string; zip: string }) {
  return {
    "@type": "PostalAddress",
    streetAddress: a.street || undefined,
    addressLocality: a.city,
    addressRegion: a.state,
    postalCode: a.zip || undefined,
    addressCountry: "US",
  };
}

/** An article's publisher: the team's RealEstateAgent node, by reference, with its logo. */
export function publisherRef() {
  return { "@type": "Organization", "@id": `${site.url}/#organization`, name: site.name, url: site.url, logo: absoluteUrl("/brand/logo/jj-seal-navy.svg") };
}

/** The site itself, so search engines show its name; the publisher is the team. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: site.name,
    url: site.url,
    inLanguage: "en-US",
    publisher: { "@id": `${site.url}/#organization` },
  };
}

/** RealEstateAgent for the team, used on the home and about pages. */
export function organizationJsonLd(settings: SiteSettings, team: TeamMember[]) {
  const sameAs = allSocialLinks(settings.socialLinks).map((s) => s.url);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/brand/logo/jj-seal-navy.svg"),
    image: absoluteUrl(settings.defaultOgImage.src),
    slogan: site.tagline,
    telephone: settings.primaryPhoneE164,
    email: team[0]?.email,
    parentOrganization: { "@type": "Organization", name: settings.brokerageName },
    address: postalAddress(settings.officeAddress),
    areaServed: ["Lakewood Ranch", "Sarasota", "Bradenton"].map((name) => ({
      "@type": "City",
      name,
    })),
    employee: team.map((m) => personJsonLd(m, settings)),
    // The team's profiles (lib/site.ts socialLinks plus the CMS list); omitted while there are none.
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function personJsonLd(m: TeamMember, settings: SiteSettings) {
  return {
    "@type": "Person",
    "@id": `${site.url}/about#${m.slug}`,
    name: m.name,
    jobTitle: m.title,
    telephone: m.phoneE164,
    email: m.email,
    image: absoluteUrl(m.headshot.src),
    worksFor: { "@type": "Organization", name: settings.brokerageName },
  };
}

export function listingJsonLd(l: Listing) {
  const url = absoluteUrl(`/listings/${l.slug}`);
  const isCondo = /unit|#|tower/i.test(l.address.street) || /tower/i.test(l.title);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": url,
    url,
    name: l.title,
    datePosted: l.listedAt,
    image: [l.hero, ...l.gallery].map((i) => absoluteUrl(i.src)),
    offers: {
      "@type": "Offer",
      price: l.price,
      priceCurrency: "USD",
      availability:
        l.status === "sold"
          ? "https://schema.org/SoldOut"
          : l.status === "pending"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
    },
    about: {
      "@type": isCondo ? "Apartment" : "SingleFamilyResidence",
      name: l.title,
      address: postalAddress(l.address),
      numberOfBedrooms: l.beds,
      numberOfBathroomsTotal: l.baths,
      floorSize: { "@type": "QuantitativeValue", value: l.sqft, unitCode: "FTK" },
      yearBuilt: l.yearBuilt,
      ...(l.geo ? { geo: { "@type": "GeoCoordinates", latitude: l.geo.lat, longitude: l.geo.lng } } : {}),
    },
  };
}

/** Kinds of listing Google should read as an exhibition rather than a dated performance. */
const EXHIBITION = /exhibit|installation|on view|collection/i;

/**
 * schema.org Event for an event page, written to what Google's event
 * results read:
 * - an exhibition (a run with no performance times) is an ExhibitionEvent;
 * - a production with several dates lists only the dates still ahead as
 *   subEvents, and its startDate is the next one;
 * - offers point at the ticket page (the event's, or a date's) and are left
 *   out when there is none, instead of pointing back at this page;
 * - called-off and moved productions say so in eventStatus;
 * - a venue with no page of its own (a placeholder or a home) is named by
 *   its town only.
 */
export function eventJsonLd(e: Event, now: Date = new Date()) {
  const url = absoluteUrl(`/calendar/${e.slug}`);
  const priceMatch = e.priceNote?.match(/\$\s?(\d+)/);
  const isRun = !e.performances?.length && Boolean(e.runsThrough);
  const exhibition = isRun && (e.category === "gallery" || EXHIBITION.test(e.subcategory ?? ""));
  const nowIso = now.toISOString();
  const ahead = (e.performances ?? []).filter((p) => (p.endsAt ?? p.startsAt) >= nowIso);
  const location = e.venue.unlisted
    ? { "@type": "Place", name: `${e.venue.address.city || marketName(e.venue.market)}, FL`, address: postalAddress(e.venue.address) }
    : {
        "@type": "Place",
        name: e.venue.name,
        address: postalAddress(e.venue.address),
        ...(e.venue.geo ? { geo: { "@type": "GeoCoordinates", latitude: e.venue.geo.lat, longitude: e.venue.geo.lng } } : {}),
      };
  const ticketUrl = e.ticketUrl ?? e.live?.dates.find((d) => d.ticketUrl && d.startsAt >= nowIso)?.ticketUrl;
  const eventStatus =
    e.status === "cancelled" ? "https://schema.org/EventCancelled" : e.status === "postponed" ? "https://schema.org/EventPostponed" : "https://schema.org/EventScheduled";
  const last = ahead[ahead.length - 1];
  return {
    "@context": "https://schema.org",
    "@type": exhibition ? "ExhibitionEvent" : "Event",
    "@id": url,
    url,
    name: e.title,
    description: e.summary,
    startDate: isRun && e.firstDate ? e.firstDate : (ahead[0]?.startsAt ?? e.startsAt),
    endDate: isRun ? e.runsThrough : (last?.endsAt ?? last?.startsAt ?? e.endsAt),
    eventStatus,
    ...(e.presenter ? { organizer: { "@type": "Organization", name: e.presenter } } : {}),
    ...(ahead.length > 1
      ? {
          subEvent: ahead.slice(0, 50).map((p) => ({
            "@type": "Event",
            name: e.title,
            startDate: p.startsAt,
            ...(p.endsAt ? { endDate: p.endsAt } : {}),
            eventStatus,
            location,
          })),
        }
      : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: e.image ? absoluteUrl(e.image.src) : undefined,
    location,
    offers: ticketUrl
      ? {
          "@type": "Offer",
          url: ticketUrl,
          ...(e.priceNote?.toLowerCase().startsWith("free")
            ? { price: 0, priceCurrency: "USD" }
            : priceMatch
              ? { price: Number(priceMatch[1]), priceCurrency: "USD" }
              : {}),
          availability: e.status === "sold-out" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
        }
      : undefined,
  };
}

/**
 * ItemList for /calendar: the next events, each by its page, so a crawler
 * reading the calendar finds them without running the page's script.
 */
export function eventListJsonLd(events: Pick<Event, "slug" | "title">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Encore Arts Calendar",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: events.length,
    itemListElement: events.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/calendar/${e.slug}`), name: e.title })),
  };
}

/** FAQPage for a question-and-answer section. Answers are plain text. */
export function faqJsonLd(items: { q: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: curly(i.q),
      acceptedAnswer: { "@type": "Answer", text: curly(i.answer) },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function placeJsonLd(v: { name: string; slug: string; address: Parameters<typeof postalAddress>[0]; website?: string; geo?: { lat: number; lng: number } }) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": absoluteUrl(`/venues/${v.slug}`),
    name: v.name,
    url: v.website,
    address: postalAddress(v.address),
    ...(v.geo ? { geo: { "@type": "GeoCoordinates", latitude: v.geo.lat, longitude: v.geo.lng } } : {}),
  };
}

export { formatAddress };
