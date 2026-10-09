import { HOME_PLATFORM_PIXEL_ELEMENT_ID, HOME_PLATFORM_PIXEL_SRC, homePlatformPixelId } from "@/lib/home-platform";

/**
 * Home Platform's lead pixel (lib/home-platform.ts): the tag exactly as Lead
 * Flows issues it. Rendered from the server so it's in the page's HTML and
 * loads before the window `load` event, which is when the pixel starts; React
 * hoists an async script into <head>. Only in production builds, and only
 * under the (site) layout, so the questionnaire, the unsubscribe page and the
 * Studio never carry it.
 */
export function HomePlatformPixel() {
  const clientId = homePlatformPixelId();
  if (!clientId) return null;
  return <script async src={HOME_PLATFORM_PIXEL_SRC} id={HOME_PLATFORM_PIXEL_ELEMENT_ID} data-client-id={clientId} />;
}
