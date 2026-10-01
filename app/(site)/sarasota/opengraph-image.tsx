import { OG_CONTENT_TYPE, OG_SIZE, hubOgImage } from "@/lib/hubs/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return hubOgImage("sarasota");
}
