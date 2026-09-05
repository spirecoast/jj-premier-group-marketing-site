"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId, studioBasePath } from "./sanity/env";
import { schemaTypes } from "./sanity/schemas";

const SINGLETONS = new Set(["siteSettings"]);

export default defineConfig({
  name: "jj-premier-group",
  title: "JJ Premier Group",
  projectId,
  dataset,
  basePath: studioBasePath,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Site settings")
              .id("siteSettings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.divider(),
            S.documentTypeListItem("listing").title("Listings"),
            S.documentTypeListItem("neighborhood").title("Neighborhoods"),
            S.divider(),
            S.documentTypeListItem("event").title("Calendar"),
            S.documentTypeListItem("venue").title("Venues"),
            S.divider(),
            S.documentTypeListItem("post").title("Letters and posts"),
            S.documentTypeListItem("teamMember").title("Team"),
            S.documentTypeListItem("testimonial").title("Testimonials"),
          ]),
    }),
    presentationTool({
      previewUrl: {
        previewMode: { enable: "/api/draft-mode/enable", disable: "/api/draft-mode/disable" },
      },
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter((t) => !SINGLETONS.has(t.schemaType)),
  },
  document: {
    actions: (actions, ctx) =>
      SINGLETONS.has(ctx.schemaType)
        ? actions.filter((a) => a.action && ["publish", "discardChanges", "restore"].includes(a.action))
        : actions,
  },
});
