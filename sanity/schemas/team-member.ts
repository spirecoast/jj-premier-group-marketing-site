import { defineField, defineType } from "sanity";
import { imageWithAlt } from "./objects";

export const teamMemberType = defineType({
  name: "teamMember",
  title: "Team member",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", title: "Name", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", title: "Slug", options: { source: "name" }, validation: (r) => r.required() }),
    imageWithAlt("headshot", "Headshot", true),
    defineField({ name: "title", type: "string", title: "Title", initialValue: "Broker Associate" }),
    defineField({ name: "licenseNumber", type: "string", title: "Florida license number (SL…)", description: "Leave empty until confirmed; nothing prints without it." }),
    defineField({ name: "bio", type: "blockContent", title: "Bio" }),
    defineField({ name: "phone", type: "string", title: "Phone (display)", description: "(941) 555-0100" }),
    defineField({ name: "phoneE164", type: "string", title: "Phone (E.164)", description: "+19415550100 — used for tel: and sms: links" }),
    defineField({ name: "email", type: "string", title: "Email" }),
    defineField({ name: "order", type: "number", title: "Order", initialValue: 1 }),
    defineField({ name: "register", type: "string", title: "Register", description: "One line, e.g. The long view · nineteen years here" }),
    defineField({ name: "quote", type: "text", title: "In her own words", rows: 3 }),
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "title", media: "headshot" } },
});
