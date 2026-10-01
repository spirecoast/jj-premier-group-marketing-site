import { HubPage, hubMetadata } from "@/lib/hubs/page";

/** Hourly ISR: the Encore week is relative to the request. */
export const revalidate = 3600;
export const metadata = hubMetadata("lakewood-ranch");

export default function Page() {
  return <HubPage market="lakewood-ranch" />;
}
