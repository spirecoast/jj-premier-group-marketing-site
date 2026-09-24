import { defineArrayMember, defineField, defineType } from "sanity";
import { imageWithAlt, marketField } from "./objects";

export const listingType = defineType({
  name: "listing",
  title: "Listing",
  type: "document",
  groups: [
    { name: "essentials", title: "Essentials", default: true },
    { name: "media", title: "Photos" },
    { name: "detail", title: "Detail" },
    { name: "voice", title: "In our voice" },
  ],
  fields: [
    defineField({ name: "title", type: "string", title: "Title", group: "essentials", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      group: "essentials",
      options: { source: (doc) => `${(doc.address as { street?: string })?.street ?? doc.title} ${(doc.address as { city?: string })?.city ?? ""}` },
      validation: (r) => r.required(),
    }),
    defineField({ name: "address", type: "address", title: "Address", group: "essentials" }),
    defineField({ name: "geo", type: "geopoint", title: "Map point", group: "essentials" }),
    { ...marketField, group: "essentials" },
    defineField({ name: "price", type: "number", title: "Price", group: "essentials", validation: (r) => r.required().positive() }),
    defineField({ name: "beds", type: "number", title: "Beds", group: "essentials", validation: (r) => r.required().min(0) }),
    defineField({ name: "baths", type: "number", title: "Baths", group: "essentials", description: "Halves allowed, e.g. 3.5", validation: (r) => r.required().min(0) }),
    defineField({ name: "sqft", type: "number", title: "Interior SF", group: "essentials", validation: (r) => r.required().positive() }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      group: "essentials",
      options: { list: ["active", "pending", "sold"], layout: "radio" },
      initialValue: "active",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tag",
      type: "string",
      title: "Tag",
      group: "essentials",
      description: "Exactly one tag per listing, or none.",
      options: {
        list: [
          { title: "New listing", value: "new" },
          { title: "Coming soon", value: "coming-soon" },
          { title: "Just reduced", value: "just-reduced" },
          { title: "Under contract", value: "under-contract" },
          { title: "Sold", value: "sold" },
          { title: "Off market", value: "off-market" },
          { title: "Open house", value: "open-house" },
        ],
      },
    }),
    defineField({ name: "featured", type: "boolean", title: "Featured on the home page", group: "essentials", initialValue: false }),
    defineField({
      name: "soldDate",
      type: "date",
      title: "Sold date",
      group: "essentials",
      validation: (r) =>
        r.custom((value, ctx) =>
          (ctx.document as { status?: string })?.status === "sold" && !value
            ? "Sold date is required when status is sold"
            : true,
        ),
    }),
    defineField({ name: "percentOfList", type: "number", title: "Percent of list (sold)", group: "essentials" }),

    { ...imageWithAlt("hero", "Hero photograph", true), group: "media" },
    defineField({
      name: "gallery",
      type: "array",
      title: "Gallery",
      group: "media",
      of: [defineArrayMember(imageWithAlt("photo", "Photograph"))],
    }),

    defineField({ name: "description", type: "blockContent", title: "Description", group: "detail" }),
    defineField({ name: "features", type: "array", title: "Features", group: "detail", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "mlsNumber", type: "string", title: "MLS number", group: "detail" }),
    defineField({ name: "neighborhood", type: "reference", title: "Neighborhood", group: "detail", to: [{ type: "neighborhood" }] }),
    defineField({ name: "agent", type: "reference", title: "Listing agent", group: "detail", to: [{ type: "teamMember" }] }),
    defineField({ name: "lotAcres", type: "number", title: "Lot (acres)", group: "detail" }),
    defineField({ name: "yearBuilt", type: "number", title: "Year built", group: "detail" }),
    defineField({ name: "renovated", type: "string", title: "Renovations", group: "detail", description: "e.g. Kitchen 2019" }),
    defineField({ name: "listedAt", type: "date", title: "Listed", group: "detail" }),
    defineField({ name: "daysOnMarket", type: "number", title: "Days on market", group: "detail" }),
    defineField({ name: "floodZone", type: "string", title: "Flood zone", group: "detail", description: "X, AE, VE…" }),
    defineField({ name: "county", type: "string", title: "County", group: "detail", description: "Only when it differs from the market's county, e.g. Waterside is Sarasota County" }),
    defineField({ name: "annualTaxes", type: "number", title: "Annual taxes", group: "detail" }),
    defineField({ name: "openHouse", type: "string", title: "Open house", group: "detail", description: "e.g. Open Sunday 1–3" }),
    defineField({ name: "cardNote", type: "string", title: "Card note", group: "detail", description: "Short mono line on cards, e.g. POOL · DOCK" }),

    defineField({
      name: "friendNote",
      type: "text",
      title: "What we would tell a friend",
      group: "voice",
      rows: 4,
      description: "The paragraph that is the brand. Specific, honest, one number.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "address.city", media: "hero", status: "status", price: "price" },
    prepare({ title, subtitle, media, status, price }) {
      return {
        title,
        subtitle: [subtitle, status, price ? `$${Number(price).toLocaleString("en-US")}` : null].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
