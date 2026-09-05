import { defineArrayMember, defineField, defineType } from "sanity";
import { imageWithAlt } from "./objects";

export const postType = defineType({
  name: "post",
  title: "Letter / post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", title: "Title", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", title: "Slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "edition", type: "string", title: "Edition", description: "e.g. Q3 2026 for the quarterly letter" }),
    imageWithAlt("cover", "Cover photograph", true),
    defineField({ name: "excerpt", type: "text", title: "Excerpt", rows: 3 }),
    defineField({ name: "body", type: "blockContent", title: "Body" }),
    defineField({ name: "publishedAt", type: "datetime", title: "Published", validation: (r) => r.required() }),
    defineField({ name: "author", type: "reference", title: "Author", to: [{ type: "teamMember" }] }),
    defineField({ name: "categories", type: "array", title: "Categories", of: [defineArrayMember({ type: "string" })], options: { layout: "tags" } }),
  ],
  orderings: [{ title: "Newest", name: "publishedAt", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "edition", media: "cover" } },
});
