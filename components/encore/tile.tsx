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
import { shortDay, through, timeLabel, weekdayShort, type Occ } from "@/lib/encore/select";
import { cn } from "@/lib/utils";
import { Bookmark } from "./glyphs";
import "./encore.css";

/**
 * Save: the 44px quiet square with a bookmark; the word stays in the label
 * and the tooltip. With `word` it is the 36px quiet button with the word
 * beside the glyph (the event page, where a lone square would be a riddle).
 */
export function SaveButton({ saved, onToggle, className, title, word = false }: { saved: boolean; onToggle: () => void; className?: string; title: string; word?: boolean }) {
  const label = saved ? `Remove ${title} from my list` : `Save ${title} to my list`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "Saved" : "Save"}
      className={cn("btn-quiet", !word && "is-square", className)}
    >
      <Bookmark />
      {word ? <span>{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}

/** Venue · Town · (dot) Kind. The venue line under every title. */
export function Meta({ e }: { e: EncoreEvent }) {
  const sub = subcategoryLabel(e.sc) ?? CATEGORY[e.c].label;
  return (
    <span className="encore-meta">
      {[e.vn, marketName(e.m)].filter(Boolean).join(" · ")}
      {" · "}
      <span className="encore-meta-kind">
        <i aria-hidden="true" />
        {sub}
      </span>
    </span>
  );
}

/**
 * The card's picture: the presenter's own image, credited, or key art for the
 * category. Promotional images come in every shape; the index carries no
 * dimensions, so the shape is read when the image loads, and one far from
 * the card's 3:2 (a poster, a season banner) sits whole on a blurred copy
 * of itself, as the event hero does (components/photo.tsx).
 */
function TileImage({ e, art }: { e: EncoreEvent; art?: number }) {
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
        <KeyArt category={e.c} seed={e.s} subcategory={e.sc} ratio={3 / 2} pick={art} />
      )}
    </SharedFrame>
  );
}

/** A spotlight card: the picture, the time large, the title, the venue. The category is a tick of color. */
export function EventTile({ o, saved, onSave, showDay, art, i }: { o: Occ; saved: boolean; onSave: () => void; showDay?: boolean; art?: number; i?: number }) {
  const e = o.e;
  return (
    <SharedLink href={`/calendar/${e.s}`} shared={`evt-${e.s}`} className={cn("encore-tile", i !== undefined && "encore-rise")} style={{ ["--cat" as string]: CATEGORY[e.c].color, ["--i" as string]: i }}>
      <TileImage e={e} art={art} />
      <div className="flex items-baseline justify-between gap-3">
        <span className="encore-tile-time">
          {showDay ? (
            <span className="encore-tile-day">
              {weekdayShort(o.day)} {shortDay(o.day)}
            </span>
          ) : null}
          {o.time ? timeLabel(o) : <span className="encore-tile-allday">{timeLabel(o)}</span>}
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

/** One line in the agenda: a time column, the title, the venue line, the price, Save. */
export function AgendaRow({ o, saved, onSave, i }: { o: Occ; saved: boolean; onSave: () => void; i?: number }) {
  const e = o.e;
  return (
    <li className={cn("encore-agenda-row", i !== undefined && "encore-rise")} style={{ ["--cat" as string]: CATEGORY[e.c].color, ["--i" as string]: i }}>
      <Link href={`/calendar/${e.s}`} className="encore-agenda-link">
        <span className="encore-agenda-time">{timeLabel(o)}</span>
        <span className="min-w-0 flex-1">
          <span className="encore-agenda-title">{e.t}</span>
          <Meta e={e} />
        </span>
        <span className={cn("t-mono-sm hidden shrink-0 sm:block", e.so ? "text-amber" : "text-graphite-500")}>{e.so ? "Sold out" : (e.pr ?? "")}</span>
        <span className="encore-agenda-arrow" aria-hidden="true">
          →
        </span>
      </Link>
      <SaveButton saved={saved} onToggle={onSave} title={e.t} className="encore-agenda-save" />
    </li>
  );
}

/** An exhibition card for the On view grid. */
export function RunCard({ e, today, saved, onSave, art, i }: { e: EncoreEvent; today: string; saved: boolean; onSave: () => void; art?: number; i?: number }) {
  const closing = e.r && e.r <= addDaysStr(today, 14);
  const opening = e.f && e.f > today;
  return (
    <SharedLink href={`/calendar/${e.s}`} shared={`evt-${e.s}`} className={cn("encore-run", i !== undefined && "encore-rise")} style={{ ["--cat" as string]: CATEGORY[e.c].color, ["--i" as string]: i }}>
      <TileImage e={e} art={art} />
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
