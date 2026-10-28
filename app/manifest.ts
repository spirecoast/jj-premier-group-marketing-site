import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * The web app manifest (/manifest.webmanifest; Next adds the link to every
 * page). It lets a visitor keep the site on a phone's home screen and open it
 * full screen: Encore first, since a saved list is what brings someone back,
 * with Atlas, Tide and the contact page a long press away. `source=pwa` tells
 * Plausible the visit came from the home screen. The icons are the brand seal
 * already in /public; the maskable pair is the same seal on a full navy square,
 * kept inside the safe zone so Android's round and squircle masks never clip
 * the ring. No service worker: nothing here works offline, and nothing claims to.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: site.name,
    short_name: "JJ Premier",
    description: site.description,
    start_url: "/calendar?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#1e3442",
    theme_color: "#1e3442",
    lang: "en-US",
    categories: ["lifestyle", "business"],
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Encore Arts Calendar", short_name: "Encore", url: "/calendar?source=pwa-shortcut", icons: [{ src: "/favicon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Atlas Neighborhoods", short_name: "Atlas", url: "/neighborhoods?source=pwa-shortcut", icons: [{ src: "/favicon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Tide Market Report", short_name: "Tide", url: "/tide?source=pwa-shortcut", icons: [{ src: "/favicon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Call or text us", short_name: "Call us", url: "/contact?source=pwa-shortcut", icons: [{ src: "/favicon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
