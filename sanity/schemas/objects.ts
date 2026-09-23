import { defineArrayMember, defineField, defineType } from "sanity";

export const MARKET_OPTIONS = [
  { title: "Lakewood Ranch", value: "lakewood-ranch" },
  { title: "Sarasota", value: "sarasota" },
  { title: "Bradenton", value: "bradenton" },
];

/** Venues reach one more place than the markets: Tampa is on the calendar, not for sale. */
export const REGION_OPTIONS = [...MARKET_OPTIONS, { title: "Tampa", value: "tampa" }];

/** An image that always carries alt text. */
export const imageWithAlt = (name: string, title: string, required = false) =>
  defineField({
    name,
    title,
    type: "image",
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Alt text",
        type: "string",
        description: "Describe the photograph for people who cannot see it.",
        validation: (rule) => rule.required(),
      }),
    ],
    validation: required ? (rule) => rule.required() : undefined,
  });

export const marketField = defineField({
  name: "market",
  title: "Market",
  type: "string",
  options: { list: MARKET_OPTIONS, layout: "radio" },
  validation: (rule) => rule.required(),
});

export const regionField = defineField({
  name: "market",
  title: "Market",
  type: "string",
  options: { list: REGION_OPTIONS, layout: "radio" },
  validation: (rule) => rule.required(),
});

export const addressType = defineType({
  name: "address",
  title: "Address",
  type: "object",
  fields: [
    defineField({ name: "street", type: "string", title: "Street" }),
    defineField({ name: "city", type: "string", title: "City" }),
    defineField({ name: "state", type: "string", title: "State", initialValue: "FL" }),
    defineField({ name: "zip", type: "string", title: "ZIP" }),
  ],
});

export const highlightType = defineType({
  name: "highlight",
  title: "Highlight",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", title: "Label", validation: (r) => r.required() }),
    defineField({ name: "description", type: "string", title: "Description", validation: (r) => r.required() }),
  ],
  preview: { select: { title: "label", subtitle: "description" } },
});

export const licenseType = defineType({
  name: "license",
  title: "License",
  type: "object",
  fields: [
    defineField({ name: "name", type: "string", title: "Agent" }),
    defineField({ name: "number", type: "string", title: "Florida license number (SL…)" }),
  ],
  preview: { select: { title: "name", subtitle: "number" } },
});

export const statType = defineType({
  name: "stat",
  title: "Stat",
  type: "object",
  description: "Every number carries a source and a date or it does not run.",
  fields: [
    defineField({ name: "value", type: "string", title: "Value", validation: (r) => r.required() }),
    defineField({ name: "label", type: "string", title: "Label", validation: (r) => r.required() }),
    defineField({ name: "source", type: "string", title: "Source and date" }),
  ],
  preview: { select: { title: "value", subtitle: "label" } },
});

export const socialLinkType = defineType({
  name: "socialLink",
  title: "Social link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", title: "Label" }),
    defineField({ name: "url", type: "url", title: "URL" }),
  ],
});

export const blockContentType = defineType({
  name: "blockContent",
  title: "Rich text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Pull quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullets", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({ name: "href", type: "url", title: "URL", validation: (r) => r.uri({ scheme: ["http", "https", "mailto", "tel"] }) }),
            ],
          },
        ],
      },
    }),
  ],
});
