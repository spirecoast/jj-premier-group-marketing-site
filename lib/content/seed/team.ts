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
    bio: p(
      "Joelyn is the mother in this mother and daughter team, and the one who takes the long view. She will tell you why a street matters more than a kitchen, why the same house sells differently in September than in March, and what to do about it.",
      "Her clients are the people who want the plan explained twice, and she is happy to. First-time buyers hear what happens on Tuesday and why. Sellers hear the number, the reason for it, and then hear it again with the comparable sales on the table.",
    ),
    phone: "(309) 258-0225",
    phoneE164: "+13092580225",
    email: "joelyn.nauman@cbrealty.com",
    order: 1,
    register: "The long view",
  },
  {
    _id: "team-jessica-garza",
    name: "Jessica Garza",
    slug: "jessica-garza",
    headshot: img("photos/jessica-white-vert", "Jessica Garza", "50% 18%"),
    title: "REALTOR®",
    licenseNumber: "SL3658907",
    bio: p(
      "Jessica is the daughter, and the one who reads a contract the way other people read a menu. Shorter sentences, the number first, a decision at the end. She runs the offer table and the inspection negotiation, and she is the one who will tell you no when no is the right answer.",
      "Clients who want the honest version of the market call her first. She will say which of the three houses she would buy, and why the fourth one is priced the way it is.",
    ),
    phone: "(941) 306-8699",
    phoneE164: "+19413068699",
    email: "jessica.garza@cbrealty.com",
    order: 2,
    register: "The sharp read",
  },
];
