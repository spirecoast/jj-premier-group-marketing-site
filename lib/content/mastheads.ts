import { img } from "./seed/helpers";
import type { ImageRef } from "./types";

/**
 * The masthead slots: one piece per route, for the full-width band that
 * opens the page (components/masthead.tsx). A slot is a photograph from the
 * registered library (lib/content/image-dims.ts) or a piece of art drawn on
 * the server from the product's own data (components/art). To swap a
 * photograph, change the `photo` name (a file under public/images, without
 * the extension), the focal point and the alt text here and nowhere else.
 * The band runs the viewport's width, so a photograph needs a source at
 * least 2000px wide (lib/content/mastheads.test.ts holds every slot to it).
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

export type PhotoSlot = {
  kind: "photo";
  /** Image name under public/images, e.g. "library/venice-pier-sunrise". */
  photo: string;
  /** CSS object-position for the crop, e.g. "50% 45%". */
  position: string;
  alt: string;
};

/** A piece drawn from the product's own data, never a file: Tide's ridgeline of sale prices (components/art/tide-art.tsx). */
export type ArtSlot = {
  kind: "art";
  art: "tide";
  alt: string;
};

export type MastheadSlot = PhotoSlot | ArtSlot;

/** Tide's one slot, shared by the archive, the issue index and every issue page. */
const TIDE: ArtSlot = {
  kind: "art",
  art: "tide",
  alt: "The shape of home sale prices in Lakewood Ranch, Sarasota and Bradenton, drawn from the county record: one line for each month, the oldest at the back and the newest at the front.",
};

export const MASTHEADS: Record<MastheadRoute, MastheadSlot> = {
  "/calendar": {
    kind: "photo",
    photo: "library/culture-opera-house-red-seats",
    position: "50% 58%",
    alt: "Rows of red velvet seats in an opera house, empty before the show",
  },
  "/blog": TIDE,
  "/tide": TIDE,
  "/tide/[issue]": TIDE,
  "/neighborhoods/match": {
    kind: "photo",
    photo: "library/lwr-fairways-bay-aerial",
    position: "50% 55%",
    alt: "Fairways, lakes and rooftops in Lakewood Ranch from the air",
  },
  "/relocate": {
    kind: "photo",
    photo: "library/lakes-aerial-sunset",
    position: "50% 50%",
    alt: "Lakefront streets from the air at sunset",
  },
  "/sell/sold": {
    kind: "photo",
    photo: "library/listing-hero-estate-twilight",
    position: "50% 55%",
    alt: "A house lit at twilight, the pool still in front of it",
  },
  "/sell/home-value": {
    kind: "photo",
    photo: "library/kitchen-white-palms",
    position: "50% 55%",
    alt: "A white kitchen with palms outside the window and stools at the island",
  },
  "/sell/net-proceeds": {
    kind: "photo",
    photo: "library/kitchen-navy-island",
    position: "40% 55%",
    alt: "A navy kitchen island with woven stools under pendant lights",
  },
};

/** The slot for a route. */
export function mastheadSlot(route: MastheadRoute): MastheadSlot {
  return MASTHEADS[route];
}

/** A photo slot's photograph, as the ImageRef the Photo component takes. */
export function mastheadPhoto(slot: PhotoSlot): ImageRef {
  return img(slot.photo, slot.alt, slot.position);
}
