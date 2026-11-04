import type { SiteSettings, Testimonial } from "../types";

export const SITE_SETTINGS: SiteSettings = {
  brokerageName: "Coldwell Banker Realty",
  brokerageLogo: {
    src: "/brand/cb/coldwell-banker-horz-cbblue.svg",
    alt: "Coldwell Banker",
    width: 492,
    height: 67,
  },
  // The Coldwell Banker Realty office the team works from, as the owners wrote it (November 2026).
  // The footer, /contact, the JSON-LD, llms.txt and the emails all read it from here, so it reads
  // the same everywhere Google compares it with the Business Profile.
  officeAddress: { street: "8334 Market St", city: "Lakewood Ranch", state: "FL", zip: "34202" },
  // The office's point for the /contact map: the U.S. Census geocoder (Public_AR_Current) for the
  // address above, read November 4, 2026. It places the number along the street, so it can sit a
  // lot or two off; at the map's zoom it's the building.
  officeGeo: { lat: 27.39038, lng: -82.44238 },
  licenses: [
    { name: "Jessica Garza", number: "SL3658907" },
    { name: "Joelyn Nauman", number: "" },
  ],
  socialLinks: [],
  defaultOgImage: {
    src: "/og-image.jpg",
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
  // One number for the team, everywhere on the site: Joelyn's, at the owners' direction (November
  // 2026). Jessica's own number shows only on her card on /about.
  primaryPhoneE164: "+13092580225",
  primaryPhoneDisplay: "(309) 258-0225",
};

/**
 * Nothing sample here: reviews go live only as real clients give them, with
 * permission on file, through the Sanity testimonial document.
 */
export const TESTIMONIALS: Testimonial[] = [];
