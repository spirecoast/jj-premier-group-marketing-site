import { defineArrayMember, defineField, defineType } from "sanity";
import { imageWithAlt, marketField } from "./objects";

export const neighborhoodType = defineType({
  name: "neighborhood",
  title: "Neighborhood",
  type: "document",
  description: "Describe the place, never the people: geography, HOA mechanics, history, distances.",
  fields: [
    defineField({ name: "name", type: "string", title: "Name", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", title: "Slug", options: { source: "name" }, validation: (r) => r.required() }),
    marketField,
    defineField({ name: "county", type: "string", title: "County", description: "Only when it differs from the market's county" }),
    defineField({ name: "tagline", type: "string", title: "Tagline" }),
    imageWithAlt("hero", "Hero photograph", true),
    defineField({ name: "overview", type: "blockContent", title: "Overview" }),
    defineField({ name: "highlights", type: "array", title: "Highlights", of: [defineArrayMember({ type: "highlight" })] }),
    defineField({ name: "stat", type: "stat", title: "Headline stat" }),
    defineField({
      name: "featuredListings",
      type: "array",
      title: "Featured listings (optional curation)",
      of: [defineArrayMember({ type: "reference", to: [{ type: "listing" }] })],
    }),
  ],
  preview: { select: { title: "name", subtitle: "market", media: "hero" } },
});
