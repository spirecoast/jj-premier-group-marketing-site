/** The live numbers on the home band, from the same data the products run on (app/(site)/page.tsx builds it). */
export type ThreeFacts = {
  atlas: { places: number; areas: number; points: [number, number][] };
  encore: { tonight: number; weekend: number; weekendLabel: string; titles: string[] };
  tide: { nextMonth: string; guides: { title: string; slug: string }[] };
};
