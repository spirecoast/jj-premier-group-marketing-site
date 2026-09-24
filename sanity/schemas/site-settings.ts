import { defineArrayMember, defineField, defineType } from "sanity";
import { imageWithAlt } from "./objects";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "brokerageName", type: "string", title: "Brokerage name", initialValue: "Coldwell Banker Realty" }),
    imageWithAlt("brokerageLogo", "Brokerage logo"),
    defineField({ name: "officeAddress", type: "address", title: "Office address" }),
    defineField({ name: "licenses", type: "array", title: "License numbers", of: [defineArrayMember({ type: "license" })] }),
    defineField({ name: "socialLinks", type: "array", title: "Social links", of: [defineArrayMember({ type: "socialLink" })] }),
    imageWithAlt("defaultOgImage", "Default social image"),
    defineField({ name: "footerDisclosure", type: "text", title: "Footer disclosure", rows: 3 }),
    defineField({ name: "mlsAttribution", type: "text", title: "MLS attribution (listing pages)", rows: 3 }),
    defineField({ name: "stats", type: "array", title: "Home page stats", of: [defineArrayMember({ type: "stat" })] }),
    defineField({ name: "ticker", type: "array", title: "Marquee lines", of: [defineArrayMember({ type: "string" })] }),
    defineField({ name: "primaryPhoneDisplay", type: "string", title: "Primary phone (display)" }),
    defineField({ name: "primaryPhoneE164", type: "string", title: "Primary phone (E.164)" }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
