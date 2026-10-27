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
    bio: p("Joelyn is the mother in this mother and daughter team with Coldwell Banker Realty. She helps people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton."),
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
    bio: p("Jessica is the daughter in this mother and daughter team with Coldwell Banker Realty. She helps people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton."),
    phone: "(941) 306-8699",
    phoneE164: "+19413068699",
    email: "jessica.garza@cbrealty.com",
    order: 2,
    // No Coldwell Banker agent page found for her on October 27, 2026; add it here when the team sends it.
    profiles: [],
  },
];
