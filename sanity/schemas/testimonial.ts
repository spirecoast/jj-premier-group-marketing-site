import { defineField, defineType } from "sanity";
import { MARKET_OPTIONS } from "./objects";

export const testimonialType = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  description: "Runs with written permission; never edited beyond trimming.",
  fields: [
    defineField({ name: "quote", type: "text", title: "Quote", rows: 3, validation: (r) => r.required() }),
    defineField({ name: "attribution", type: "string", title: "Attribution", description: "Seller, Buyer…", validation: (r) => r.required() }),
    defineField({ name: "market", type: "string", title: "Market", options: { list: MARKET_OPTIONS } }),
    defineField({ name: "date", type: "string", title: "Date", description: "e.g. April 2026" }),
  ],
  preview: { select: { title: "quote", subtitle: "attribution" } },
});
