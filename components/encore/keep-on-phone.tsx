"use client";

import { useState, useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";

/*
 * "Keep Encore on your phone": a quiet row under My list once someone has
 * saved two shows, since the list lives in this browser and a home-screen
 * icon is the easy way back to it (app/manifest.ts). On Android and desktop
 * Chromium it offers the browser's own install prompt; on an iPhone or iPad,
 * which has no prompt, one line says where Add to Home Screen is. It never
 * shows inside the installed app, nowhere a browser can't install, and not
 * again once dismissed on this device.
 */

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISSED_KEY = "encore:keep-on-phone";

// Chromium fires beforeinstallprompt once, often before the list view mounts,
// so the event is caught when this module loads and kept for the row.
let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

type Kind = "prompt" | "ios" | null;

function standalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** iPhone and iPad Safari (iPadOS reports itself as a Mac with a touch screen). */
function iosBrowser(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** What this device allows, read in the browser only: the server can't know it. */
type Device = "server" | "skip" | "ios" | "other";
function readDevice(): Device {
  try {
    if (window.localStorage.getItem(DISMISSED_KEY) === "1") return "skip";
  } catch {
    /* blocked storage: show it; a dismissal holds for this page */
  }
  if (standalone()) return "skip";
  return iosBrowser() ? "ios" : "other";
}
const still = () => () => {};

export function KeepOnPhone({ saved }: { saved: number }) {
  const prompt = useSyncExternalStore(subscribe, () => deferred, () => null);
  const device = useSyncExternalStore(still, readDevice, (): Device => "server");
  const [hiddenNow, setHidden] = useState(false);

  const kind: Kind = device === "server" || device === "skip" ? null : prompt ? "prompt" : device === "ios" ? "ios" : null;
  if (saved < 2 || hiddenNow || !kind) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* fine: hidden for this page */
    }
  };

  const install = async () => {
    if (!prompt) return;
    track("Explore", { action: "install", where: "encore-my-list" });
    await prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    deferred = null;
    listeners.forEach((l) => l());
    if (choice?.outcome === "accepted") setHidden(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border border-hairline bg-parchment px-5 py-4" role="group" aria-label="Keep Encore on your phone">
      <p className="t-small min-w-0 flex-1 basis-[16rem] text-body">
        <span className="font-medium text-navy">Keep Encore on your phone.</span>{" "}
        {kind === "ios" ? (
          <>
            Your list is saved in this browser. Tap Share{" "}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" aria-hidden="true" className="inline-block -translate-y-px align-middle">
              <path d="M12 3.5v12M7.5 8 12 3.5 16.5 8M5 13.5v6.5h14v-6.5" />
            </svg>{" "}
            then Add to Home Screen.
          </>
        ) : (
          "Your list is saved in this browser. Add Encore to your home screen and it opens straight to the calendar."
        )}
      </p>
      <div className="flex items-center gap-5">
        {kind === "prompt" ? (
          <button type="button" className="btn btn-navy !min-h-11" onClick={install}>
            Add to home screen
          </button>
        ) : null}
        <button type="button" className="btn-quiet" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
