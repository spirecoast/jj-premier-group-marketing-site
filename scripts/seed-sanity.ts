/**
 * Push the sample content into a Sanity dataset so an editor has something to
 * open on day one. Idempotent: documents use stable ids and createOrReplace.
 *
 *   npx sanity exec scripts/seed-sanity.ts --with-user-token
 *
 * Requires NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET in the
 * environment (sanity.cli.ts reads them). Images are uploaded from /public.
 * Written against the schema in sanity/schemas; not yet run against a live
 * project — review the first run's output before publishing.
 */
import { createReadStream } from "node:fs";
import path from "node:path";
import { getCliClient } from "sanity/cli";
import { EVENTS } from "../lib/content/seed/events";
import { LISTINGS } from "../lib/content/seed/listings";
import { NEIGHBORHOODS } from "../lib/content/seed/neighborhoods";
import { POSTS } from "../lib/content/seed/posts";
import { SITE_SETTINGS, TESTIMONIALS } from "../lib/content/seed/settings";
import { TEAM } from "../lib/content/seed/team";
import { VENUES } from "../lib/content/seed/venues";
import type { ImageRef } from "../lib/content/types";

const client = getCliClient({ apiVersion: "2026-09-01" });
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

const assetIds = new Map<string, string>();

async function image(ref: ImageRef | undefined) {
  if (!ref) return undefined;
  let assetId = assetIds.get(ref.src);
  if (!assetId) {
    const file = path.join(PUBLIC_DIR, ref.src);
    const asset = await client.assets.upload("image", createReadStream(file), {
      filename: path.basename(file),
    });
    assetId = asset._id;
    assetIds.set(ref.src, assetId);
    console.log("uploaded", ref.src);
  }
  const hotspot = ref.position
    ? (() => {
        const [x, y] = ref.position.split(" ").map((v) => Number.parseFloat(v) / 100);
        return { _type: "sanity.imageHotspot", x, y, width: 1, height: 1 };
      })()
    : undefined;
  return {
    _type: "image",
    asset: { _type: "reference", _ref: assetId },
    alt: ref.alt,
    ...(hotspot ? { hotspot } : {}),
  };
}

const slug = (current: string) => ({ _type: "slug", current });
const ref = (id: string) => ({ _type: "reference", _ref: id });
const neighborhoodId = (s: string) => NEIGHBORHOODS.find((n) => n.slug === s)?._id;
const venueId = (s: string) => VENUES.find((v) => v.slug === s)?._id;
const teamId = (s: string) => TEAM.find((t) => t.slug === s)?._id;

async function run() {
  const docs: Record<string, unknown>[] = [];

  for (const m of TEAM) {
    docs.push({
      _id: m._id, _type: "teamMember", name: m.name, slug: slug(m.slug), title: m.title,
      licenseNumber: m.licenseNumber, bio: m.bio, phone: m.phone, phoneE164: m.phoneE164,
      email: m.email, order: m.order, register: m.register, quote: m.quote,
      headshot: await image(m.headshot),
    });
  }
  for (const n of NEIGHBORHOODS) {
    docs.push({
      _id: n._id, _type: "neighborhood", name: n.name, slug: slug(n.slug), market: n.market,
      tagline: n.tagline, overview: n.overview, stat: n.stat ? { _type: "stat", ...n.stat } : undefined,
      highlights: n.highlights.map((h, i) => ({ _type: "highlight", _key: `h${i}`, ...h })),
      hero: await image(n.hero),
    });
  }
  for (const v of VENUES) {
    docs.push({
      _id: v._id, _type: "venue", name: v.name, slug: slug(v.slug), address: { _type: "address", ...v.address },
      geo: v.geo ? { _type: "geopoint", lat: v.geo.lat, lng: v.geo.lng } : undefined,
      market: v.market, website: v.website, about: v.about, image: await image(v.image),
      neighborhood: v.neighborhood ? ref(neighborhoodId(v.neighborhood.slug)!) : undefined,
    });
  }
  for (const l of LISTINGS) {
    docs.push({
      _id: l._id, _type: "listing", title: l.title, slug: slug(l.slug), address: { _type: "address", ...l.address },
      geo: l.geo ? { _type: "geopoint", lat: l.geo.lat, lng: l.geo.lng } : undefined,
      market: l.market, price: l.price, beds: l.beds, baths: l.baths, sqft: l.sqft, status: l.status, tag: l.tag,
      featured: l.featured, soldDate: l.soldDate, percentOfList: l.percentOfList, description: l.description,
      features: l.features, mlsNumber: l.mlsNumber, lotAcres: l.lotAcres, yearBuilt: l.yearBuilt,
      renovated: l.renovated, listedAt: l.listedAt, daysOnMarket: l.daysOnMarket, floodZone: l.floodZone,
      annualTaxes: l.annualTaxes, openHouse: l.openHouse, cardNote: l.cardNote, friendNote: l.friendNote,
      hero: await image(l.hero),
      gallery: (await Promise.all(l.gallery.map(image))).map((g, i) => ({ ...g, _key: `g${i}` })),
      neighborhood: l.neighborhood ? ref(neighborhoodId(l.neighborhood.slug)!) : undefined,
      agent: l.agent ? ref(teamId(l.agent.slug)!) : undefined,
    });
  }
  for (const e of EVENTS) {
    docs.push({
      _id: e._id, _type: "event", title: e.title, slug: slug(e.slug), summary: e.summary, startsAt: e.startsAt,
      endsAt: e.endsAt, allDay: e.allDay, venue: ref(venueId(e.venue.slug)!), category: e.category,
      ticketUrl: e.ticketUrl, priceNote: e.priceNote, source: e.source, sourceUrl: e.sourceUrl,
      featured: e.featured, description: e.description, image: await image(e.image),
    });
  }
  for (const p of POSTS) {
    docs.push({
      _id: p._id, _type: "post", title: p.title, slug: slug(p.slug), edition: p.edition, excerpt: p.excerpt,
      body: p.body, publishedAt: p.publishedAt, categories: p.categories, cover: await image(p.cover),
      author: ref(teamId(p.author.slug)!),
    });
  }
  for (const t of TESTIMONIALS) {
    docs.push({ _id: t._id, _type: "testimonial", quote: t.quote, attribution: t.attribution, market: t.market, date: t.date });
  }
  docs.push({
    _id: "siteSettings", _type: "siteSettings", brokerageName: SITE_SETTINGS.brokerageName,
    officeAddress: { _type: "address", ...SITE_SETTINGS.officeAddress },
    licenses: SITE_SETTINGS.licenses.map((l, i) => ({ _type: "license", _key: `l${i}`, ...l })),
    socialLinks: SITE_SETTINGS.socialLinks.map((l, i) => ({ _type: "socialLink", _key: `s${i}`, ...l })),
    footerDisclosure: SITE_SETTINGS.footerDisclosure, mlsAttribution: SITE_SETTINGS.mlsAttribution,
    stats: SITE_SETTINGS.stats.map((s, i) => ({ _type: "stat", _key: `st${i}`, ...s })),
    ticker: SITE_SETTINGS.ticker, primaryPhoneDisplay: SITE_SETTINGS.primaryPhoneDisplay,
    primaryPhoneE164: SITE_SETTINGS.primaryPhoneE164,
    brokerageLogo: await image(SITE_SETTINGS.brokerageLogo),
    defaultOgImage: await image(SITE_SETTINGS.defaultOgImage),
  });

  let tx = client.transaction();
  for (const d of docs) tx = tx.createOrReplace(d as { _id: string; _type: string });
  const result = await tx.commit();
  console.log(`seeded ${docs.length} documents · transaction ${result.transactionId}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
