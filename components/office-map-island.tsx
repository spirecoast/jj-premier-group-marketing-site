"use client";

import { useEffect, useRef, useState } from "react";
import type { OfficeMapProps } from "@/components/office-map";
import { MAP_COLORS } from "@/lib/neighborhoods/map-style";
import { withRetry } from "@/lib/retry";

type MapComponent = typeof import("@/components/office-map").OfficeMap;

/**
 * The map's frame on /contact. It shows a still poster (the marker on linen,
 * drawn here so it is in the HTML and costs nothing) and asks for MapLibre's
 * code only when the frame comes within 200 px of the viewport, so the map
 * chunk never holds up the form. If the code doesn't arrive, the poster
 * stays and the Google Maps link under the frame still works.
 */
export function OfficeMapIsland(props: OfficeMapProps) {
  const frame = useRef<HTMLDivElement>(null);
  const [Map, setMap] = useState<MapComponent | null>(null);
  // A browser without IntersectionObserver gets the map at once; the server never asks for it.
  const [wanted, setWanted] = useState(() => typeof window !== "undefined" && typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = frame.current;
    if (!el || wanted) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setWanted(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [wanted]);

  useEffect(() => {
    if (!wanted) return;
    let live = true;
    withRetry(() => import("@/components/office-map"), { retries: 2, baseDelayMs: 600 })
      .then((m) => {
        if (live) setMap(() => m.OfficeMap);
      })
      .catch((err: unknown) => {
        console.warn(`[office map] the map's code didn't load: ${err instanceof Error ? err.message : String(err)}`);
      });
    return () => {
      live = false;
    };
  }, [wanted]);

  return (
    <div ref={frame} className="office-map relative aspect-[4/3] overflow-hidden border border-hairline bg-[#f7f3ec] sm:aspect-[3/2]">
      {Map ? <Map {...props} /> : <OfficePoster label={props.label} place={props.place} />}
    </div>
  );
}

/** The still picture before the map: the marker and its label on linen with the map's faint survey grid. */
function OfficePoster({ label, place }: { label: string; place: string }) {
  const c = MAP_COLORS;
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Map of ${place}`}>
      <defs>
        <pattern id="office-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={c.navy} strokeOpacity="0.07" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="600" height="400" fill="#f7f3ec" />
      <rect width="600" height="400" fill="url(#office-grid)" />
      <circle cx="300" cy="200" r="18" fill={c.navy} opacity="0.16" />
      <circle cx="300" cy="200" r="8" fill={c.navy} stroke="#fff" strokeWidth="2.5" />
      <text x="300" y="228" textAnchor="middle" fontFamily="var(--font-body), sans-serif" fontSize="12" fill={c.graphiteDark} stroke={c.paper} strokeWidth="3" paintOrder="stroke">
        {label}
      </text>
    </svg>
  );
}
