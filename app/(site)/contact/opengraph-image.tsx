import { getSiteSettings } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** The contact page: its heading, the office number, and Joelyn and Jessica. */
export default async function Image() {
  const settings = await getSiteSettings();
  return brandOgImage({
    eyebrow: "Joelyn & Jessica",
    title: "Tell us the timing.",
    meta: `Call or text ${settings.primaryPhoneDisplay}`,
    photo: "/images/photos/duo-whitenavy-wide.jpg",
  });
}
