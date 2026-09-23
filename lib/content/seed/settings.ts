import type { SiteSettings, Testimonial } from "../types";

export const SITE_SETTINGS: SiteSettings = {
  brokerageName: "Coldwell Banker Realty",
  brokerageLogo: {
    src: "/brand/cb/coldwell-banker-horz-cbblue.svg",
    alt: "Coldwell Banker",
    width: 492,
    height: 67,
  },
  // Street address pending brokerage confirmation (BUILD-PLAN Phase 0).
  // The footer renders whatever is present here.
  officeAddress: { street: "", city: "Lakewood Ranch", state: "FL", zip: "" },
  licenses: [
    { name: "Jessica Garza", number: "SL3658907" },
    { name: "Joelyn Nauman", number: "" },
  ],
  socialLinks: [],
  defaultOgImage: {
    src: "/og-image.png",
    alt: "JJ Premier Group · Every move, expertly guided.",
    width: 1200,
    height: 630,
  },
  // No IDX feed yet (COMPLIANCE.md §5): the site carries the brokerage's own
  // listings and disclaimer. The Stellar MLS attribution, courtesy line and ©
  // notice are added here the day the data licence is signed.
  footerDisclosure:
    "Information deemed reliable but not guaranteed · For consumers’ personal, non-commercial use · Equal Housing Opportunity",
  mlsAttribution:
    "Listing courtesy of Coldwell Banker Realty · Information deemed reliable but not guaranteed · For consumers’ personal, non-commercial use",
  // No figures until a data feed supplies them: nothing on the site is hand-typed.
  stats: [],
  ticker: [],
  primaryPhoneE164: "+19419071033",
  primaryPhoneDisplay: "(941) 907-1033",
};

/**
 * Nothing sample here: reviews go live only as real clients give them, with
 * permission on file, through the Sanity testimonial document.
 */
export const TESTIMONIALS: Testimonial[] = [];
