"use client";

import { MY_PLACES_KEY } from "@/lib/neighborhoods/my-places";
import { createSlugListStore } from "@/lib/slug-list-store";

/** The neighborhoods someone has saved, kept in this browser; one list for the explorer, Atlas Match, the place pages and the compare page. */
export const useMyPlaces = createSlugListStore(MY_PLACES_KEY);
