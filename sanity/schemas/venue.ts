import { defineField, defineType } from "sanity";
import { imageWithAlt, regionField } from "./objects";

export const venueType = defineType({
  name: "venue",
  title: "Venue",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", title: "Name", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", title: "Slug", options: { source: "name" }, validation: (r) => r.required() }),
    defineField({ name: "address", type: "address", title: "Address" }),
    defineField({ name: "geo", type: "geopoint", title: "Map point" }),
    regionField,
    defineField({ name: "neighborhood", type: "reference", title: "Neighborhood", to: [{ type: "neighborhood" }] }),
    defineField({ name: "website", type: "url", title: "Website" }),
    imageWithAlt("image", "Photograph"),
    defineField({ name: "about", type: "blockContent", title: "About the venue" }),
  ],
  preview: { select: { title: "name", subtitle: "address.city", media: "image" } },
});
