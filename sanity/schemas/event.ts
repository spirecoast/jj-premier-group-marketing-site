import { defineField, defineType } from "sanity";
import { imageWithAlt } from "./objects";

export const eventType = defineType({
  name: "event",
  title: "Calendar event",
  type: "document",
  description: "About the venue, never the listing. The only thing here for sale is a Tuesday evening.",
  fields: [
    defineField({ name: "title", type: "string", title: "Title", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", title: "Slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "summary", type: "text", title: "Summary", rows: 2, description: "One or two sentences." }),
    defineField({ name: "startsAt", type: "datetime", title: "Starts", validation: (r) => r.required() }),
    defineField({ name: "endsAt", type: "datetime", title: "Ends" }),
    defineField({ name: "allDay", type: "boolean", title: "All day", initialValue: false }),
    defineField({ name: "venue", type: "reference", title: "Venue", to: [{ type: "venue" }], validation: (r) => r.required() }),
    defineField({
      name: "category",
      type: "string",
      title: "Category",
      options: { list: ["music", "theater", "gallery", "festival", "family", "market"], layout: "radio" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "ticketUrl", type: "url", title: "Tickets URL" }),
    defineField({ name: "priceNote", type: "string", title: "Price note", description: 'e.g. "Free" or "$15 at the door"' }),
    imageWithAlt("image", "Photograph"),
    defineField({ name: "source", type: "string", title: "Source", description: "Where the listing came from" }),
    defineField({ name: "sourceUrl", type: "url", title: "Source URL" }),
    defineField({ name: "featured", type: "boolean", title: "Featured", initialValue: false }),
    defineField({ name: "description", type: "blockContent", title: "Description" }),
  ],
  orderings: [{ title: "Soonest", name: "startsAt", by: [{ field: "startsAt", direction: "asc" }] }],
  preview: {
    select: { title: "title", startsAt: "startsAt", venue: "venue.name", media: "image" },
    prepare({ title, startsAt, venue, media }) {
      return { title, subtitle: [startsAt?.slice(0, 10), venue].filter(Boolean).join(" · "), media };
    },
  },
});
