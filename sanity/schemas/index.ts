import { eventType } from "./event";
import { listingType } from "./listing";
import { neighborhoodType } from "./neighborhood";
import {
  addressType,
  blockContentType,
  highlightType,
  licenseType,
  socialLinkType,
  statType,
} from "./objects";
import { postType } from "./post";
import { siteSettingsType } from "./site-settings";
import { teamMemberType } from "./team-member";
import { testimonialType } from "./testimonial";
import { venueType } from "./venue";

export const schemaTypes = [
  // documents
  listingType,
  eventType,
  venueType,
  neighborhoodType,
  postType,
  teamMemberType,
  testimonialType,
  siteSettingsType,
  // objects
  addressType,
  highlightType,
  licenseType,
  statType,
  socialLinkType,
  blockContentType,
];
