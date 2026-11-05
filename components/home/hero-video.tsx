"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MotionToggle } from "@/components/motion-toggle";
import { Photo } from "@/components/photo";
import type { ImageRef } from "@/lib/content/types";
import { HERO_STILL_QUALITY, PHONE_VIDEO_QUERY, requestedClip, savingData, type HeroClip } from "@/lib/hero-video";
import { useMotionPaused } from "@/lib/motion-pref";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type Clip = HeroClip<ImageRef>;
type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

/**
 * The preview-only clip switch. Next writes the deployment's name in at build
 * time, so on production this is false and the switch is compiled out; the
 * page passes no alternates there either (heroCompareAllowed).
 */
const COMPARE = process.env.NEXT_PUBLIC_VERCEL_ENV !== "production";

const connection = () => (navigator as Navigator & { connection?: Connection }).connection;
function onConnection(cb: () => void) {
  const c = connection();
  c?.addEventListener("change", cb);
  return () => c?.removeEventListener("change", cb);
}
function onVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}
function onLoad(cb: () => void) {
  window.addEventListener("load", cb);
  return () => window.removeEventListener("load", cb);
}
const never = () => () => {};

/* Whether this visit can have the video at all, so the corner control can say what it pauses. */
let available = true;
const availableListeners = new Set<() => void>();
function setAvailable(next: boolean) {
  if (next === available) return;
  available = next;
  availableListeners.forEach((l) => l());
}
function onAvailable(cb: () => void) {
  availableListeners.add(cb);
  return () => {
    availableListeners.delete(cb);
  };
}

/**
 * The home hero's moving picture, laid over its still. The still is the
 * poster, which the server renders through the image pipeline and which stays
 * the page's largest paint: the video isn't requested until the page has
 * loaded, so it never takes bandwidth from the still. No video at all for
 * anyone who asked for reduced motion, who paused the site's motion, or whose
 * browser asks to save data (Save-Data, 2G). Phones get the 720p file. Muted,
 * inline, looping, no controls and hidden from assistive technology (the
 * poster's alt text says what the picture shows). It fades in once it plays,
 * pauses while the hero is off the screen or the tab is hidden, and the
 * corner control pauses and plays it.
 */
export function HeroVideo({ clip, alternates, sizes }: { clip: Clip; alternates?: Record<string, Clip>; sizes: string }) {
  const hydrated = useSyncExternalStore(never, () => true, () => false);
  const loaded = useSyncExternalStore(onLoad, () => document.readyState === "complete", () => false);
  const reduced = useReducedMotion();
  const paused = useMotionPaused();
  const saving = useSyncExternalStore(onConnection, () => savingData(connection()), () => false);
  const visible = useSyncExternalStore(onVisibility, () => document.visibilityState !== "hidden", () => true);
  // Decided once, in the browser: a preview's ?hero= choice and the file for this screen.
  const [pick] = useState(() => {
    if (typeof window === "undefined") return null;
    const name = COMPARE && alternates ? requestedClip(window.location.search, Object.keys(alternates)) : null;
    return { name, phone: window.matchMedia(PHONE_VIDEO_QUERY).matches };
  });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(true);
  const ref = useRef<HTMLVideoElement>(null);

  const swapped = pick?.name && alternates ? alternates[pick.name] : null;
  const active = swapped ?? clip;
  const src = pick?.phone ? active.phone : active.desktop;
  // Once it has played, a pause holds the frame; a visitor who arrives paused gets the still.
  const show = loaded && !reduced && !saving && !failed && (!paused || ready);

  useEffect(() => setAvailable(!saving && !failed), [saving, failed]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(v);
    return () => io.disconnect();
  }, [show]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (paused || !inView || !visible) {
      v.pause();
      return;
    }
    // React sets muted as a property only; defaultMuted also writes the attribute iOS checks for autoplay.
    v.defaultMuted = true;
    v.muted = true;
    v.play().catch((e: unknown) => {
      // A pause before playback began aborts play(); a refusal (Low Power Mode, autoplay off) leaves the still.
      if (e instanceof DOMException && e.name !== "AbortError") setFailed(true);
    });
  }, [show, src, paused, inView, visible]);

  return (
    <>
      {hydrated && swapped ? <Photo image={swapped.poster} quality={HERO_STILL_QUALITY} sizes={sizes} /> : null}
      {show ? (
        <video
          ref={ref}
          src={src}
          muted
          playsInline
          loop
          autoPlay
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          data-ready={ready ? "" : undefined}
          onPlaying={() => setReady(true)}
          onError={() => setFailed(true)}
          className="hero-video absolute inset-0 h-full w-full object-cover"
          style={active.poster.position ? { objectPosition: active.poster.position } : undefined}
        />
      ) : null}
    </>
  );
}

/** The corner control, named for what it pauses here: the video, or the loops where there's no video. */
export function HeroMotionToggle({ className }: { className?: string }) {
  const video = useSyncExternalStore(onAvailable, () => available, () => true);
  return <MotionToggle className={className} what={video ? "the video" : "the motion"} />;
}
