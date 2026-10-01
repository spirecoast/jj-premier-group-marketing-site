import { img } from "./seed/helpers";
import type { ImageRef } from "./types";

/**
 * The masthead slots: one photograph per route, for the full-width band that
 * opens the page (components/masthead.tsx). The client will supply generated
 * key art for these later; until then each slot carries a photograph from the
 * registered library (lib/content/image-dims.ts). To swap one, change the
 * `photo` name (a file under public/images, without the extension), the
 * focal point and the alt text here and nowhere else.
 *
 * Alt text describes the place or the thing in the frame, never who lives or
 * belongs anywhere (Fair Housing).
 */
export type MastheadRoute =
  | "/calendar"
  | "/blog"
  | "/tide"
  | "/tide/[issue]"
  | "/neighborhoods/match"
  | "/relocate"
  | "/sell/sold"
  | "/sell/home-value"
  | "/sell/net-proceeds";

export type MastheadSlot = {
  /** Image name under public/images, e.g. "library/venice-pier-sunrise". */
  photo: string;
  /** CSS object-position for the crop, e.g. "50% 45%". */
  position: string;
  alt: string;
};

/** Tide's one slot, shared by the archive, the issue index and every issue page. */
const TIDE: MastheadSlot = {
  // Not the pier: the footer band above every page already uses it.
  photo: "library/sarasota-bayfront-blue-hour",
  position: "50% 48%",
  alt: "Sailboats on the Sarasota bayfront at blue hour, the Van Wezel and the lit towers reflected in the water",
};

export const MASTHEADS: Record<MastheadRoute, MastheadSlot> = {
  "/calendar": {
    photo: "library/culture-opera-house-red-seats",
    position: "50% 58%",
    alt: "Rows of red velvet seats in an opera house, empty before the show",
  },
  "/blog": TIDE,
  "/tide": TIDE,
  "/tide/[issue]": TIDE,
  "/neighborhoods/match": {
    photo: "library/lwr-fairways-bay-aerial",
    position: "50% 55%",
    alt: "Fairways, lakes and rooftops in Lakewood Ranch from the air",
  },
  "/relocate": {
    photo: "library/lakes-aerial-sunset",
    position: "50% 50%",
    alt: "Lakefront streets from the air at sunset",
  },
  "/sell/sold": {
    photo: "library/listing-hero-estate-twilight",
    position: "50% 55%",
    alt: "A house lit at twilight, the pool still in front of it",
  },
  "/sell/home-value": {
    photo: "library/moment-poolside",
    position: "50% 60%",
    alt: "Two lounge chairs beside a pool, the hedge trimmed behind them",
  },
  "/sell/net-proceeds": {
    photo: "library/moment-contract",
    position: "50% 62%",
    alt: "A contract, a pen and a set of keys on a wooden table",
  },
};

/** The masthead photograph for a route, as an ImageRef the Photo component takes. */
export function masthead(route: MastheadRoute): ImageRef {
  const slot = MASTHEADS[route];
  return img(slot.photo, slot.alt, slot.position);
}
