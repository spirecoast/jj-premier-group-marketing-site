import { getImageProps } from "next/image";
import Link from "next/link";
import { preload } from "react-dom";
import { HeroVideo, HeroVideoControls, HeroVideoStage } from "@/components/home/hero-video";
import { MotionToggle } from "@/components/motion-toggle";
import { Photo } from "@/components/photo";
import type { ImageRef, TeamMember } from "@/lib/content/types";
import { LANDSCAPE_QUERY, PORTRAIT_QUERY, type HeroClip } from "@/lib/hero-video";
import { site } from "@/lib/site";
import { HOME_HERO_SIZES } from "@/lib/image-sizes";
import { cn } from "@/lib/utils";

/** What fills the hero, chosen by `site.homeHero` (lib/site.ts). */
export type HeroPicture = { kind: "photo"; image: ImageRef } | { kind: "video"; clip: HeroClip<ImageRef> };

/**
 * The video's still, the page's largest paint: the portrait cut's first frame
 * on a phone held upright, the landscape one everywhere else, picked by the
 * query that picks the file (lib/hero-video.ts). One <picture>, and a preload
 * for each still behind opposite media queries, so every screen fetches
 * exactly one of them, early and at high priority. (next/image's own preload
 * can't follow a <source>, so it would fetch the landscape still on phones too.)
 */
function HeroStill({ clip }: { clip: HeroClip<ImageRef> }) {
  const { poster, posterPortrait } = clip;
  const { props: landscape } = getImageProps({ src: poster.src, alt: poster.alt, fill: true, sizes: HOME_HERO_SIZES, loading: "eager", fetchPriority: "high" });
  const { props: portrait } = getImageProps({ src: posterPortrait.src, alt: posterPortrait.alt, fill: true, sizes: "100vw" });
  preload(landscape.src, { as: "image", imageSrcSet: landscape.srcSet, imageSizes: landscape.sizes, fetchPriority: "high", media: LANDSCAPE_QUERY });
  preload(portrait.src, { as: "image", imageSrcSet: portrait.srcSet, imageSizes: portrait.sizes, fetchPriority: "high", media: PORTRAIT_QUERY });
  return (
    <picture>
      <source media={PORTRAIT_QUERY} srcSet={portrait.srcSet} sizes={portrait.sizes} />
      <img {...landscape} alt={poster.alt} className="object-cover" style={{ ...landscape.style, objectPosition: poster.position }} />
    </picture>
  );
}

/**
 * The hero. The picture is the layout: type sits in the calm part of the
 * frame. Rise, draw and fade are each used once here and nowhere else on the
 * page. On every screen the headline, its rule and both buttons sit over the
 * picture, the cameo at the top. From `lg` the frame is 780px tall and the type
 * sits at its foot on the left, the sound and pause in the far corner. Below
 * `lg` the frame is most of the first screen and never shorter than what it
 * holds; the type runs the full width at its foot, and the sound and pause sit
 * where they move no text: at the end of the rule's row on a phone, at the end
 * of the buttons' row once the buttons sit side by side (app/globals.css,
 * ".hero-stage"). Nothing here is a figure: the listing card and the ticker
 * return with a data feed.
 *
 * Two pictures, one switch. The photograph has one motion, the slow drift; the
 * veil and the glow came off at the design director's note. The video is the
 * Life Here montage over its own first frame (the still, which is the page's
 * largest paint), with sound and pause; it moves on its own, so the still
 * doesn't drift, and its shade is a little deeper.
 */
export function Hero({ picture, cameo, team }: { picture: HeroPicture; cameo: ImageRef; team: TeamMember[] }) {
  const names = team.map((m) => m.name).join(" & ");
  // The visible names come first, so a voice user can say what they see.
  const meetLabel = team.length ? `${names}, meet the team` : "Meet the team";
  const video = picture.kind === "video";
  // The corner the type leaves free: a cell of the hero's grid below lg (app/globals.css), the frame's far corner from lg.
  const corner = "hero-corner z-10 lg:absolute lg:bottom-[22px] lg:right-[var(--hero-inset)]";

  const stage = (
    <>
      <div className="absolute inset-0 bg-navy">
        {picture.kind === "video" ? (
          <>
            <HeroStill clip={picture.clip} />
            <HeroVideo />
          </>
        ) : (
          <Photo image={picture.image} priority sizes={HOME_HERO_SIZES} className="hero-img" />
        )}
        <div className={video ? "hero-shade hero-shade-video" : "hero-shade"} aria-hidden="true" />

        {/* Cameo: the photograph and the names are one link to the team page. The
            focus ring is the site's own, Sky 300 on this photographic ground. */}
        <div className="rise d2 absolute left-[var(--hero-inset)] top-header pt-4 sm:pt-6 lg:pt-7">
          <Link href="/about" aria-label={meetLabel} className="flex items-center gap-4">
            <div className="cameo-orbit relative flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20 lg:h-[88px] lg:w-[88px]" aria-hidden="true">
              <div className="relative h-[52px] w-[52px] overflow-hidden rounded-full shadow-[0_0_0_2px_rgb(230_221_209/0.9),0_10px_30px_rgb(20_37_48/0.45)] sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]">
                <Photo image={cameo} sizes="72px" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[14px] font-medium text-white text-shadow-photo">{names}</p>
              {/* Over the moving picture the small line carries the names' shadow too. */}
              <p className={cn("font-mono text-[10px] tracking-[0.12em] text-mist", video && "text-shadow-photo")}>
                REALTORS® · {site.brokerage.toUpperCase().replace(" REALTY", "")}
              </p>
            </div>
          </Link>
        </div>

        {/* Scroll cue: desktop furniture */}
        <div
          className="scroll-cue absolute bottom-[22px] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[9px] tracking-[0.18em] text-linen-200 text-shadow-photo xl:flex"
          aria-hidden="true"
        >
          <span>SCROLL</span>
          <span className="h-[26px] w-px bg-sky-300" />
        </div>
      </div>

      {/* The photograph's one control for its drift, or the video's sound and pause. */}
      {video ? <HeroVideoControls className={corner} /> : <MotionToggle className={corner} />}

      {/* Headline block */}
      <div className="hero-copy text-white lg:absolute lg:bottom-16 lg:left-[var(--hero-inset)] lg:flex lg:w-[760px] lg:flex-col lg:gap-6">
        <h1 id="hero-title" className="t-hero text-shadow-photo">
          <span className="hero-line l1">
            <span>Your next home</span>
          </span>
          <span className="hero-line l2">
            <span>is waiting.</span>
          </span>
        </h1>
        <span className="draw hero-rule block h-px w-[120px] bg-sky-300" aria-hidden="true" />
        <div className="rise d4 btn-row hero-actions gap-3.5">
          <Link href="/listings" className="btn border-linen-200 bg-linen-200 text-navy hover:border-linen-100 hover:bg-linen-100">
            Find your home
            <span className="btn-dash" aria-hidden="true" />
          </Link>
          <Link href="/sell/home-value" className="btn border-linen-200/60 bg-transparent text-linen-200 hover:border-linen-200 hover:bg-linen-200/10 hover:text-linen-200">
            What is my home worth
          </Link>
        </div>
      </div>
    </>
  );

  return (
    <section data-header-overlay className="hero-bleed -mt-header bg-paper" aria-labelledby="hero-title">
      <div className="hero-stage relative overflow-hidden bg-navy lg:h-[780px]">
        {picture.kind === "video" ? <HeroVideoStage clip={picture.clip}>{stage}</HeroVideoStage> : stage}
      </div>
    </section>
  );
}
