"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ImageRef } from "@/lib/content/types";
import { bufferedAhead, heroVideoFile, PHONE_VIDEO_QUERY, PORTRAIT_QUERY, savingData, START_BUFFER_S, START_WAIT_MS, videoWanted, type HeroClip } from "@/lib/hero-video";
import { setMotionPaused, useMotionPaused } from "@/lib/motion-pref";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

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

/** Resolves once `v` has START_BUFFER_S seconds buffered ahead of its playhead (or all that's left), or after START_WAIT_MS. */
function whenBuffered(v: HTMLVideoElement, cancelled: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const enough = () => bufferedAhead(v.buffered, v.currentTime) >= Math.min(START_BUFFER_S, (v.duration || Infinity) - v.currentTime - 0.05);
    if (enough()) return resolve();
    const check = () => {
      if (enough() || cancelled()) finish();
    };
    const finish = () => {
      clearTimeout(timer);
      v.removeEventListener("progress", check);
      v.removeEventListener("canplaythrough", check);
      resolve();
    };
    const timer = setTimeout(finish, START_WAIT_MS);
    v.addEventListener("progress", check);
    v.addEventListener("canplaythrough", check);
  });
}

/** Puts `v` back on its first frame (the still's frame), resolving once it's there. */
function rewind(v: HTMLVideoElement): Promise<void> {
  if (v.currentTime < 0.001) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      v.removeEventListener("seeked", done);
      resolve();
    };
    const timer = setTimeout(done, 1000);
    v.addEventListener("seeked", done);
    v.currentTime = 0;
  });
}

/** Calls back once `v` has drawn its next frame (two animation frames where the browser can't say). */
function onNextFrame(v: HTMLVideoElement, cb: () => void) {
  if (typeof v.requestVideoFrameCallback === "function") v.requestVideoFrameCallback(() => cb());
  else requestAnimationFrame(() => requestAnimationFrame(cb));
}

type Stage = {
  /** The callback ref for the <video>. */
  attach: (el: HTMLVideoElement | null) => void;
  src: string;
  position?: string;
  /** The <video> is in the page. */
  show: boolean;
  /** It's playing and has drawn a frame, so it's in front of the still. */
  ready: boolean;
  /** The visitor wants it moving (lib/hero-video.ts, videoWanted). */
  moving: boolean;
  sound: boolean;
  /** The file can't play here; the corner button falls back to pausing the page's other loops. */
  failed: boolean;
  paused: boolean;
  onError: () => void;
  togglePlay: () => void;
  toggleSound: () => void;
};

const StageContext = createContext<Stage | null>(null);

function useStage(): Stage {
  const s = useContext(StageContext);
  if (!s) throw new Error("HeroVideo and HeroVideoControls go inside HeroVideoStage");
  return s;
}

/**
 * The home hero's video, laid over its still. The still is rendered by the
 * server through the image pipeline and stays the page's largest paint; the
 * video isn't requested until the page's load event, so it never takes
 * bandwidth from it. Phones held upright get the portrait cut, other small
 * screens the 720p file (lib/hero-video.ts). It starts muted (browsers only
 * autoplay muted video), and not by itself at all for anyone who asked for
 * reduced motion, whose browser asks to save data (Save-Data, 2G), or who
 * paused it before; they get the still and a Play button. It pauses while the
 * hero is off the screen or the tab is hidden.
 *
 * The first start doesn't show the video until it can run smoothly: it loads
 * held on its first frame (the still's frame) until a few seconds are
 * buffered, then plays from that frame and comes in over the still as soon as
 * it draws, with a fade too short to double the moving picture. So the still
 * simply starts moving, with no hitch from a thin buffer and no ghosting.
 *
 * The stage holds the state; HeroVideo (the picture) and HeroVideoControls
 * (sound, and pause or play) sit where they belong in the hero's markup.
 */
export function HeroVideoStage({ clip, children }: { clip: HeroClip<ImageRef>; children: ReactNode }) {
  const loaded = useSyncExternalStore(onLoad, () => document.readyState === "complete", () => false);
  const reducedMotion = useReducedMotion();
  const paused = useMotionPaused();
  const saving = useSyncExternalStore(onConnection, () => savingData(connection()), () => false);
  const visible = useSyncExternalStore(onVisibility, () => document.visibilityState !== "hidden", () => true);
  // Chosen once, in the browser, with the queries the still's <picture> reads (lib/hero-video.ts).
  const [screen] = useState(() =>
    typeof window === "undefined"
      ? { portrait: false, phone: false }
      : { portrait: window.matchMedia(PORTRAIT_QUERY).matches, phone: window.matchMedia(PHONE_VIDEO_QUERY).matches },
  );
  const [pressedPlay, setPressedPlay] = useState(false);
  const [autoplayRefused, setAutoplayRefused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [inView, setInView] = useState(true);
  const ref = useRef<HTMLVideoElement | null>(null);
  const attach = useCallback((el: HTMLVideoElement | null) => {
    ref.current = el;
  }, []);

  const moving = videoWanted({ paused, reducedMotion, savingData: saving, autoplayRefused, pressedPlay });
  // After the load event, or at once when the visitor presses Play. Once it has played (or the
  // browser refused to start it), a pause keeps it in place, so Play can resume it in the same tap.
  const show = (loaded || pressedPlay) && !failed && (moving || ready || autoplayRefused);
  const src = heroVideoFile(clip, screen);

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
    if (!moving || !inView || !visible) {
      v.pause();
      return;
    }
    // React sets muted as a property only; defaultMuted also writes the attribute iOS checks for autoplay.
    v.defaultMuted = true;
    v.muted = !sound;
    let cancelled = false;
    const refused = (e: unknown) => {
      if (!(e instanceof DOMException) || e.name === "AbortError") return; // a pause before playback began
      if (e.name !== "NotAllowedError") return setFailed(true);
      // Refused: sound without a fresh tap, or no autoplay at all (Low Power Mode).
      if (!v.muted) setSound(false);
      else setAutoplayRefused(true);
    };
    const start = () =>
      v
        .play()
        .then(() => {
          if (!ready) onNextFrame(v, () => !cancelled && setReady(true));
        })
        .catch(refused);
    // In front of the still already, or the visitor just pressed Play: at once.
    if (ready || pressedPlay) {
      start();
      return () => {
        cancelled = true;
      };
    }
    // The first start. play() gets it loading (iOS Safari fetches nothing until it's called), then it
    // waits on its first frame for the buffer, and plays from there.
    v.play()
      .then(() => {
        if (cancelled) return;
        v.pause();
        return whenBuffered(v, () => cancelled);
      })
      .then(() => (cancelled ? undefined : rewind(v)))
      .then(() => {
        if (!cancelled) start();
      })
      .catch(refused);
    return () => {
      cancelled = true;
    };
  }, [show, src, moving, inView, visible, sound, ready, pressedPlay]);

  const stage: Stage = {
    attach,
    src,
    position: clip.poster.position,
    show,
    ready,
    moving,
    sound,
    failed,
    paused,
    onError: () => setFailed(true),
    togglePlay: () => {
      if (failed) return setMotionPaused(!paused);
      if (moving) {
        setMotionPaused(true);
        ref.current?.pause();
        return;
      }
      setMotionPaused(false);
      setPressedPlay(true);
      // Inside the tap, so a browser that refused to autoplay lets it start now.
      ref.current?.play().catch(() => {});
    },
    toggleSound: () => {
      const next = !sound;
      // Inside the tap: browsers only let sound start from one.
      if (ref.current) ref.current.muted = !next;
      setSound(next);
    },
  };

  return <StageContext.Provider value={stage}>{children}</StageContext.Provider>;
}

/** The moving picture, over the still. Hidden from assistive technology: the still's alt text says what it shows. */
export function HeroVideo() {
  const { attach, show, src, sound, ready, position, onError } = useStage();
  if (!show) return null;
  return (
    <video
      ref={attach}
      src={src}
      muted={!sound}
      playsInline
      loop
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      data-ready={ready ? "" : undefined}
      onError={onError}
      className="hero-video absolute inset-0 h-full w-full object-cover"
      style={position ? { objectPosition: position } : undefined}
    />
  );
}

/**
 * Sound, and pause or play, in the corner the type leaves free. The pause
 * button takes the motion toggle's place on the home hero, with the same
 * remembered choice (lib/motion-pref.ts), which also pauses the page's other
 * loops. The sound button appears once there's a video to hear. Both labels
 * say what a press does, so neither carries aria-pressed as well: "Play the
 * video, pressed" would read as a contradiction.
 */
export function HeroVideoControls({ className }: { className?: string }) {
  const s = useStage();
  const what = s.failed ? "the motion" : "the video";
  const stopped = s.failed ? s.paused : !s.moving;
  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      {s.show ? (
        <button type="button" className="hero-control" aria-label={s.sound ? "Turn sound off" : "Turn sound on"} title={s.sound ? "Turn sound off" : "Turn sound on"} onClick={s.toggleSound}>
          {s.sound ? <Volume2 aria-hidden="true" size={18} strokeWidth={1.5} /> : <VolumeX aria-hidden="true" size={18} strokeWidth={1.5} />}
        </button>
      ) : null}
      <button type="button" className="hero-control" aria-label={stopped ? `Play ${what}` : `Pause ${what}`} title={stopped ? "Play" : "Pause"} onClick={s.togglePlay}>
        {stopped ? <Play aria-hidden="true" size={16} strokeWidth={1.5} /> : <Pause aria-hidden="true" size={16} strokeWidth={1.5} />}
      </button>
    </div>
  );
}
