import type { Adapter } from "../types";
import { icalAdapter } from "./ical";
import { mpacAdapter } from "./mpac";
import { ovationtixAdapter } from "./ovationtix";
import { jsonLdAdapter, pagesAdapter } from "./pages";
import { sillAdapter } from "./sill";
import { squarespaceAdapter } from "./squarespace";
import { ticketspiceAdapter } from "./ticketspice";
import { tnewAdapter } from "./tnew";
import { tribeAdapter } from "./tribe";
import { vanWezelAdapter } from "./vanwezel";

/** Every adapter by the name a source's `adapter` field uses. "manual" sources have none. */
export const ADAPTERS: Record<string, Adapter> = Object.fromEntries(
  [tribeAdapter, icalAdapter, jsonLdAdapter, pagesAdapter, squarespaceAdapter, tnewAdapter, ovationtixAdapter, ticketspiceAdapter, vanWezelAdapter, sillAdapter, mpacAdapter].map((a) => [a.name, a]),
);
