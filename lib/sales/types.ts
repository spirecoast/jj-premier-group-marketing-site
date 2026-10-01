/**
 * The shape of one row in data/sales/<county>.json.gz. Shared by the server
 * module (lib/sales/index.ts), the pure parcel matcher and the unit tests;
 * nothing here reads a file. Names are stripped at ingest and have no field.
 */

export type County = "manatee" | "sarasota";
export type PropertyUse = "single-family" | "condo" | "townhome" | "villa" | "vacant" | "other";

export type Sale = {
  county: County;
  parcelId: string;
  number: string;
  predir: string;
  street: string;
  suffix: string;
  postdir: string;
  unit: string;
  city: string;
  zip: string;
  lat?: number;
  lng?: number;
  /** ISO date, YYYY-MM-DD. */
  saleDate: string;
  salePrice: number;
  qualified: boolean;
  /** FDOR qualification code: 01 deed, 02 evidence, 03/04 qualified but the roll changed since. */
  qualCode: string;
  instrument: string;
  livingArea: number | null;
  lotSqft: number | null;
  yearBuilt: number | null;
  beds: number | null;
  baths: number | null;
  propertyUse: PropertyUse;
};
