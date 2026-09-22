import type { Metadata } from "next";
import type { Event, Listing, SiteSettings, TeamMember } from "@/lib/content/types";
import { formatAddress } from "@/lib/content/format";
import { site } from "@/lib/site";

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
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
export function pageMetadata({
  title,
  description,
  path,
  image,
  fileImage,
  type = "website",
  noIndex,
  absoluteTitle,
}: {
  title: string;
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
  const images = image
    ? [{ url: image.src, alt: image.alt, width: image.width, height: image.height }]
    : fileImage
      ? undefined
      : [DEFAULT_OG_IMAGE];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    // Only set when a page opts out; an explicit `undefined` would override the
    // root layout's NEXT_PUBLIC_ROBOTS_NOINDEX rule instead of inheriting it.
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: site.name,
      ...(images ? { images } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
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

/** RealEstateAgent for the team, used on the home and about pages. */
export function organizationJsonLd(settings: SiteSettings, team: TeamMember[]) {
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
    sameAs: settings.socialLinks.map((s) => s.url),
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
    ...(m.licenseNumber
      ? {
          hasCredential: {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "license",
            name: `Florida real estate license ${m.licenseNumber}`,
          },
        }
      : {}),
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

export function eventJsonLd(e: Event) {
  const url = absoluteUrl(`/calendar/${e.slug}`);
  const priceMatch = e.priceNote?.match(/\$\s?(\d+)/);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": url,
    url,
    name: e.title,
    description: e.summary,
    startDate: e.startsAt,
    endDate: e.endsAt,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: e.image ? absoluteUrl(e.image.src) : undefined,
    location: {
      "@type": "Place",
      name: e.venue.name,
      address: postalAddress(e.venue.address),
      ...(e.venue.geo
        ? { geo: { "@type": "GeoCoordinates", latitude: e.venue.geo.lat, longitude: e.venue.geo.lng } }
        : {}),
    },
    offers: e.ticketUrl || e.priceNote
      ? {
          "@type": "Offer",
          url: e.ticketUrl ?? url,
          ...(e.priceNote?.toLowerCase().startsWith("free")
            ? { price: 0, priceCurrency: "USD" }
            : priceMatch
              ? { price: Number(priceMatch[1]), priceCurrency: "USD" }
              : {}),
          availability: "https://schema.org/InStock",
        }
      : undefined,
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
