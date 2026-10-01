import type { TeamMember } from "../types";
import { img, p } from "./helpers";

export const TEAM: TeamMember[] = [
  {
    _id: "team-joelyn-nauman",
    name: "Joelyn Nauman",
    slug: "joelyn-nauman",
    headshot: img("photos/joelyn-white-vert", "Joelyn Nauman", "50% 20%"),
    title: "REALTOR®",
    // Florida DBPR number outstanding. Nothing carrying her name goes to press
    // until it is confirmed (Compliance §02). Editable in siteSettings.
    licenseNumber: "",
    bio: p("Joelyn is the mother in this mother and daughter team with Coldwell Banker Realty. She helps people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton."),
    phone: "(309) 258-0225",
    phoneE164: "+13092580225",
    email: "joelyn.nauman@cbrealty.com",
    order: 1,
  },
  {
    _id: "team-jessica-garza",
    name: "Jessica Garza",
    slug: "jessica-garza",
    headshot: img("photos/jessica-white-vert", "Jessica Garza", "50% 18%"),
    title: "REALTOR®",
    licenseNumber: "SL3658907",
    bio: p("Jessica is the daughter in this mother and daughter team with Coldwell Banker Realty. She helps people buy, sell and invest in Lakewood Ranch, Sarasota and Bradenton."),
    phone: "(941) 306-8699",
    phoneE164: "+19413068699",
    email: "jessica.garza@cbrealty.com",
    order: 2,
  },
];
