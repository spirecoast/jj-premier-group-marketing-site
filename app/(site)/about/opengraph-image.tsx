import { OG_CONTENT_TYPE, OG_SIZE, brandOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandOgImage({
    eyebrow: "Joelyn Nauman and Jessica Garza",
    title: "A mother and daughter team.",
    meta: "Coldwell Banker Realty · Lakewood Ranch, Sarasota and Bradenton",
    photo: "/images/photos/duo-square.jpg",
  });
}
