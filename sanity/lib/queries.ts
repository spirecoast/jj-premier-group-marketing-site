import { defineQuery } from "next-sanity";

/**
 * GROQ, written with defineQuery so Sanity TypeGen can type the results.
 * Collections are fetched whole (they are small) and filtered in
 * lib/content/index.ts so the seed and Sanity behave identically.
 */

const image = /* groq */ `{
  alt, hotspot, crop,
  asset->{ url, metadata { dimensions { width, height }, lqip } }
}`;

const ref = /* groq */ `{ name, "slug": slug.current }`;

export const listingsQuery = defineQuery(`*[_type == "listing" && defined(slug.current)] | order(featured desc, listedAt desc) {
  _id, title, "slug": slug.current, address, geo, price, beds, baths, sqft, status, tag, market,
  lotAcres, yearBuilt, renovated, listedAt, daysOnMarket, floodZone, annualTaxes, cardNote,
  friendNote, percentOfList, openHouse, mlsNumber, featured, soldDate, description, features,
  "hero": hero ${image},
  "gallery": gallery[] ${image},
  "neighborhood": neighborhood->${ref},
  "agent": agent->${ref}
}`);

export const eventsQuery = defineQuery(`*[_type == "event" && defined(slug.current) && defined(venue)] | order(startsAt asc) {
  _id, title, "slug": slug.current, summary, startsAt, endsAt, allDay, category, ticketUrl,
  priceNote, source, sourceUrl, featured, description,
  "image": image ${image},
  "venue": venue->{ name, "slug": slug.current, market, address, geo }
}`);

export const venuesQuery = defineQuery(`*[_type == "venue" && defined(slug.current)] | order(name asc) {
  _id, name, "slug": slug.current, address, geo, website, market, about,
  "image": image ${image},
  "neighborhood": neighborhood->${ref}
}`);

export const neighborhoodsQuery = defineQuery(`*[_type == "neighborhood" && defined(slug.current)] | order(name asc) {
  _id, name, "slug": slug.current, market, tagline, overview, highlights, stat,
  "hero": hero ${image},
  "featuredListings": featuredListings[]->slug.current
}`);

export const postsQuery = defineQuery(`*[_type == "post" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc) {
  _id, title, "slug": slug.current, excerpt, body, publishedAt, categories, edition,
  "cover": cover ${image},
  "author": author->${ref}
}`);

export const teamQuery = defineQuery(`*[_type == "teamMember" && defined(slug.current)] | order(order asc) {
  _id, name, "slug": slug.current, title, licenseNumber, bio, phone, phoneE164, email, order, register, quote,
  "headshot": headshot ${image}
}`);

export const testimonialsQuery = defineQuery(`*[_type == "testimonial"] | order(_createdAt desc) {
  _id, quote, attribution, market, date
}`);

export const siteSettingsQuery = defineQuery(`*[_type == "siteSettings"][0] {
  brokerageName, officeAddress, licenses, socialLinks, footerDisclosure, mlsAttribution,
  stats, ticker, primaryPhoneE164, primaryPhoneDisplay,
  "brokerageLogo": brokerageLogo ${image},
  "defaultOgImage": defaultOgImage ${image}
}`);

/** Events whose end is more than twelve months past — the archive cron's target. */
export const staleEventIdsQuery = defineQuery(`*[_type == "event" && dateTime(coalesce(endsAt, startsAt)) < dateTime($cutoff)]._id`);
