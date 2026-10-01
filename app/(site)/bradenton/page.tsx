import { HubPage, hubMetadata } from "@/lib/hubs/page";

/** Hourly ISR: the Encore week is relative to the request. */
export const revalidate = 3600;
export const metadata = hubMetadata("bradenton");

export default function Page() {
  return <HubPage market="bradenton" />;
}
