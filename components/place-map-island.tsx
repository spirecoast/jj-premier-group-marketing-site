"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PlacePoint } from "@/components/place-map";
import { explorerHref } from "@/lib/neighborhoods/url";
import { withRetry } from "@/lib/retry";

type MapComponent = typeof import("@/components/place-map").PlaceMap;

/**
 * The map's frame on a neighborhood page. It shows the server-drawn poster
 * (the points as a still picture) and asks for MapLibre's code only when the
 * frame comes within 200 px of the viewport, so the 280 KB chunk and its
 * stylesheet never hold up the first view. If the code doesn't arrive, the
 * poster stays and the explorer link still works.
 */
export function PlaceMapIsland({ slug, points, poster }: { slug: string; points: PlacePoint[]; poster: ReactNode }) {
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
    withRetry(() => import("@/components/place-map"), { retries: 2, baseDelayMs: 600 })
      .then((m) => {
        if (live) setMap(() => m.PlaceMap);
      })
      .catch((err: unknown) => {
        console.warn(`[atlas map] the map's code didn't load: ${err instanceof Error ? err.message : String(err)}`);
      });
    return () => {
      live = false;
    };
  }, [wanted]);

  return (
    <div ref={frame} className="explorer-hero-map">
      {Map ? <Map slug={slug} points={points} /> : poster}
      <Link href={explorerHref({ place: slug })} className="btn btn-navy !min-h-10 !px-4 !text-[11px] absolute bottom-4 left-4 z-10">
        Open in the explorer
        <span className="btn-dash" aria-hidden="true" />
      </Link>
    </div>
  );
}
