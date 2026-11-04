import type { TeamMember } from "../types";
import { img, p } from "./helpers";

export const TEAM: TeamMember[] = [
  {
    _id: "team-joelyn-nauman",
    name: "Joelyn Nauman",
    slug: "joelyn-nauman",
    headshot: img("photos/joelyn-blue-threeqtr", "Joelyn Nauman", "50% 50%"),
    title: "REALTOR®",
    // Florida DBPR number outstanding. Nothing carrying her name goes to press
    // until it is confirmed (Compliance §02). Editable in siteSettings.
    licenseNumber: "",
    // Her own words (November 2026).
    bio: p(
      "With 14 years of calling Florida home, Joelyn brings a personal understanding of the Gulf Coast lifestyle and a passion for helping others find their place within it. Her appreciation for the area’s distinctive communities, dining, arts and entertainment allows her to offer clients more than a perspective on real estate—she shares what makes living here so special.",
      "Joelyn’s background in customer service and administrative work has shaped her commitment to professionalism, organization, and thoughtful attention to detail. She understands that every client has unique goals and believes exceptional service begins with listening and building genuine relationships.",
      "Whether buying, selling, or investing, Joelyn approaches every opportunity with dedication, integrity, and a commitment to putting her clients’ interests first.",
      "Her goal is simple: to provide a personalized real estate experience built on trust, communication, and genuine care.",
    ),
    phone: "(309) 258-0225",
    phoneE164: "+13092580225",
    email: "joelyn.nauman@cbrealty.com",
    order: 1,
    // Her Coldwell Banker Realty agent page (Lakewood Ranch office), found October 27, 2026.
    profiles: ["https://www.coldwellbankerhomes.com/fl/lakewood-ranch/agent/joelyn-nauman/aid_271042/"],
  },
  {
    _id: "team-jessica-garza",
    name: "Jessica Garza",
    slug: "jessica-garza",
    headshot: img("photos/jessica-navy-threeqtr", "Jessica Garza", "50% 50%"),
    title: "REALTOR®",
    licenseNumber: "SL3658907",
    // Her own words (November 2026).
    bio: p(
      "Born in Illinois and a proud Gulf Coast resident for the past 14 years, Jessica knows firsthand what it takes to pack up a life up north and start fresh in Florida. That experience allows her to guide clients through every step of a long-distance move with clarity, patience, and personal attention.",
      "Jessica’s background in hospitality has taught her how to read people, anticipate needs, and make every interaction feel easy and personal. She brings that same warmth to real estate, along with a modern, tech-savvy approach that keeps clients informed and connected, whether they’re touring homes in person or from a thousand miles away.",
      "From the arts and theater scene to the welcoming communities of Lakewood Ranch and Bradenton, Jessica loves showing newcomers the lifestyle that drew her here, so they can picture themselves living it, not just buying a house.",
      "Her goal is to make every move feel less like a leap and more like coming home.",
    ),
    phone: "(941) 306-8699",
    phoneE164: "+19413068699",
    email: "jessica.garza@cbrealty.com",
    order: 2,
    // No Coldwell Banker agent page found for her on October 27, 2026; add it here when the team sends it.
    profiles: [],
  },
];
