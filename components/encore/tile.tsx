"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { KeyArt } from "@/components/key-art";
import { SharedFrame } from "@/components/shared-frame";
import { SharedLink } from "@/components/shared-link";
import { marketName } from "@/lib/content/markets";
import { CATEGORY, subcategoryLabel } from "@/lib/encore/categories";
import type { EncoreEvent } from "@/lib/encore/index-format";
import { coversFrame } from "@/lib/photo-fit";
import { clock, shortDay, through, weekdayShort, type Occ } from "@/lib/encore/select";
import { cn } from "@/lib/utils";

export function SaveButton({ saved, onToggle, className, title }: { saved: boolean; onToggle: () => void; className?: string; title: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from my list` : `Save ${title} to my list`}
      className={cn("encore-save", saved && "is-saved", className)}
    >
      <span aria-hidden="true">{saved ? "✓" : "+"}</span>
      <span className="encore-save-label">{saved ? "Saved" : "Save"}</span>
    </button>
  );
}

function Meta({ e }: { e: EncoreEvent }) {
  const sub = subcategoryLabel(e.sc);
  return (
    <p className="t-mono-sm text-graphite-500">
      {[e.vn, marketName(e.m), sub].filter(Boolean).join(" · ")}
    </p>
  );
}

/**
 * The card's picture: the presenter's own image, credited, or key art for the
 * category. Promotional images come in every shape; the index carries no
 * dimensions, so the shape is read when the image loads, and one far from
 * the card's 3:2 (a poster, a season banner) sits whole on a blurred copy
 * of itself, as the event hero does (components/photo.tsx).
 */
function TileImage({ e }: { e: EncoreEvent }) {
  const [whole, setWhole] = useState(false);
  const sizes = "(min-width: 1024px) 300px, (min-width: 640px) 45vw, 80vw";
  return (
    <SharedFrame name={`evt-${e.s}`} role="source" className="encore-tile-img">
      {e.img ? (
        <>
          {whole ? <Image src={e.img} alt="" aria-hidden="true" fill sizes="64px" quality={30} className="photo-fill" /> : null}
          <Image
            src={e.img}
            alt=""
            fill
            sizes={sizes}
            className={whole ? "object-contain" : "object-cover"}
            style={whole ? undefined : { objectPosition: "50% 38%" }}
            onLoad={(ev) => {
              const img = ev.currentTarget;
              if (img.naturalWidth && img.naturalHeight) setWhole(!coversFrame(img.naturalWidth / img.naturalHeight, 3 / 2));
            }}
          />
          {e.ic ? <span className="image-credit-on">Image: {e.ic}</span> : null}
        </>
      ) : (
        <KeyArt category={e.c} seed={e.s} subcategory={e.sc} ratio={3 / 2} />
      )}
    </SharedFrame>
  );
}

/** A spotlight card: the picture, the time large, the title, the venue. The category is a tick of color. */
export function EventTile({ o, saved, onSave, showDay }: { o: Occ; saved: boolean; onSave: () => void; showDay?: boolean }) {
  const e = o.e;
  return (
    <SharedLink href={`/calendar/${e.s}`} shared={`evt-${e.s}`} className="encore-tile" style={{ ["--cat" as string]: CATEGORY[e.c].color }}>
      <TileImage e={e} />
      <div className="flex items-baseline justify-between gap-3">
        <span className="encore-tile-time">
          {showDay ? <span className="encore-tile-day">{weekdayShort(o.day)} {shortDay(o.day)}</span> : null}
          {o.time ? clock(o.time) : <span className="encore-tile-allday">All day</span>}
        </span>
        <span className="t-mono-sm text-graphite-500">{CATEGORY[e.c].label}</span>
      </div>
      <h3 className="encore-tile-title">{e.t}</h3>
      <Meta e={e} />
      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
        <span className={cn("t-mono-sm", e.so ? "text-amber" : "text-graphite-600")}>{e.so ? "Sold out" : (e.pr ?? "Tickets at the venue")}</span>
        <SaveButton saved={saved} onToggle={onSave} title={e.t} />
      </div>
    </SharedLink>
  );
}

/** One line in the agenda: a time column, the title, the venue, the price. */
export function AgendaRow({ o, saved, onSave }: { o: Occ; saved: boolean; onSave: () => void }) {
  const e = o.e;
  return (
    <li className="encore-agenda-row" style={{ ["--cat" as string]: CATEGORY[e.c].color }}>
      <Link href={`/calendar/${e.s}`} className="encore-agenda-link">
        <span className="encore-agenda-time">{o.time ? clock(o.time) : "All day"}</span>
        <span className="min-w-0 flex-1">
          <span className="encore-agenda-title">{e.t}</span>
          <Meta e={e} />
        </span>
        <span className={cn("t-mono-sm hidden shrink-0 sm:block", e.so ? "text-amber" : "text-graphite-500")}>{e.so ? "Sold out" : (e.pr ?? "")}</span>
      </Link>
      <SaveButton saved={saved} onToggle={onSave} title={e.t} className="encore-agenda-save" />
    </li>
  );
}

/** An exhibition card for the On view grid. */
export function RunCard({ e, today, saved, onSave }: { e: EncoreEvent; today: string; saved: boolean; onSave: () => void }) {
  const closing = e.r && e.r <= addDaysStr(today, 14);
  const opening = e.f && e.f > today;
  return (
    <SharedLink href={`/calendar/${e.s}`} shared={`evt-${e.s}`} className="encore-run" style={{ ["--cat" as string]: CATEGORY[e.c].color }}>
      <TileImage e={e} />
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-mono-sm text-graphite-500">{CATEGORY[e.c].label}</span>
        {opening ? <span className="encore-tag">Opens {shortDay(e.f!)}</span> : closing ? <span className="encore-tag is-closing">Closing soon</span> : null}
      </div>
      <h3 className="encore-tile-title">{e.t}</h3>
      <Meta e={e} />
      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
        <span className="t-mono-sm text-graphite-600">{opening && e.r ? `${shortDay(e.f!)} – ${shortDay(e.r)}` : (through(e) ?? "")}</span>
        <SaveButton saved={saved} onToggle={onSave} title={e.t} />
      </div>
    </SharedLink>
  );
}

function addDaysStr(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
