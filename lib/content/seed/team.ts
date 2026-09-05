import type { TeamMember } from "../types";
import { img, p } from "./helpers";

export const TEAM: TeamMember[] = [
  {
    _id: "team-joelyn-nauman",
    name: "Joelyn Nauman",
    slug: "joelyn-nauman",
    headshot: img("photos/joelyn-white-vert", "Joelyn Nauman", "50% 20%"),
    title: "Broker Associate",
    // Florida DBPR number outstanding. Nothing carrying her name goes to press
    // until it is confirmed (Compliance §02). Editable in siteSettings.
    licenseNumber: "",
    bio: p(
      "Joelyn has sold on the Suncoast for nineteen years, which is long enough to remember which canals used to flood and which streets were dirt. She explains why: why the seawall matters more than the kitchen, why a September listing sits, why the house two doors down sold for less.",
      "Her clients are the ones who need the plan twice. First-time buyers hear what escrow is and what happens on Tuesday. Sellers hear the number and the reason for it, then hear it again with the comps on the table.",
      "She lives in Lakewood Ranch and has an opinion about every one of its villages.",
    ),
    phone: "(309) 258-0225",
    phoneE164: "+13092580225",
    email: "joelyn.nauman@cbrealty.com",
    order: 1,
    register: "The long view · nineteen years here",
    quote:
      "That canal used to flood every August until they redid the outfall in 2016. It has not since. I checked.",
  },
  {
    _id: "team-jessica-garza",
    name: "Jessica Garza",
    slug: "jessica-garza",
    headshot: img("photos/jessica-white-vert", "Jessica Garza", "50% 18%"),
    title: "Broker Associate",
    licenseNumber: "SL3658907",
    bio: p(
      "Jessica grew up in Bradenton and reads a contract the way other people read a menu. Shorter sentences, the number first, a decision at the end. She runs the offer table and the inspection negotiation, and she is the one who will tell you no.",
      "Her register is the sharp read: sixty thousand in seawall inside three years, two better houses on the same water, let's go see them Saturday. Clients who want the honest version of the market call her first.",
      "She covers Bradenton, Anna Maria, and Tampa, and she knows where to eat after a showing in all three.",
    ),
    phone: "(941) 306-8699",
    phoneE164: "+19413068699",
    email: "jessica.garza@cbrealty.com",
    order: 2,
    register: "The sharp read · Bradenton native",
    quote:
      "Sixty thousand in seawall inside three years. There are two better houses on the same water. Let's go see them Saturday.",
  },
];
