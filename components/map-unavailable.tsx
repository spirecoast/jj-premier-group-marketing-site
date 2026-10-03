"use client";

import { cn } from "@/lib/utils";

/**
 * What sits in the map's place when the map can't be drawn: no WebGL, a
 * provider that's down, code that didn't arrive. One plain sentence and a way
 * to try again; the rest of the page carries on around it.
 */
export function MapUnavailable({ message, onRetry, className }: { message: string; onRetry: () => void; className?: string }) {
  return (
    <div className={cn("map-unavailable", className)} role="status">
      <div className="map-unavailable-note">
        <p className="t-mono-sm text-graphite-600">{message}</p>
        <button type="button" className="btn btn-outline !min-h-10 !px-4 !text-[11px]" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}
