import { notFound } from "next/navigation";
import { CopyCaption } from "@/components/cards/copy-caption";
import { cardsTokenOk } from "@/lib/cards/access";
import { CARD_SIZES, CARDS_COPY as C, type CardKind, type CardSize } from "@/lib/cards/copy";
import { CARD_CHANNELS, isCardChannel, loadCard, type CardChannel, type CardModel } from "@/lib/cards/data";

/** The data moves (Encore's week, a new Tide issue); never cache a render. */
export const dynamic = "force-dynamic";

type Search = Promise<{ channel?: string; place?: string; street?: string }>;
type ImageHref = (kind: CardKind, size: CardSize, extra?: Record<string, string>, download?: boolean) => string;

/** One card: its feed-size preview, the two downloads and the caption; or why there's none. */
function Card({ img, card, kind, extra = {}, missing }: { img: ImageHref; card: CardModel | null; kind: CardKind; extra?: Record<string, string>; missing?: string }) {
  if (!card) return missing ? <p className="t-body text-graphite-500">{missing}</p> : null;
  if (card.held) return <p className="t-body text-navy">{C.held}</p>;
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-12">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img(kind, "feed", extra)} alt={`${card.title}: the card at feed size`} width={1080} height={1350} loading="lazy" className="h-auto w-full max-w-[320px] bg-linen-100" />
      <div className="flex flex-col gap-6">
        <div className="btn-row gap-3">
          {(Object.keys(CARD_SIZES) as CardSize[]).map((size) => (
            <a key={size} href={img(kind, size, extra, true)} download className={size === "feed" ? "btn btn-navy" : "btn btn-outline"}>
              {C.download[size]}
            </a>
          ))}
        </div>
        <p className="t-mono-sm text-graphite-500">{`${CARD_SIZES.feed.label} · ${CARD_SIZES.story.label}`}</p>
        <CopyCaption id={`caption-${kind}`} text={card.caption} label={C.captionLabel} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-t border-hairline pt-10">
      <h2 className="t-h3 text-navy">{title}</h2>
      {children}
    </section>
  );
}

/**
 * /cards/<token>: cards for Joelyn and Jessica to post, drawn from the site's own data and
 * photographs (Tide's medians, Encore's week, a place's facts, a street's sales), each at feed
 * and story size with its caption. Every caption runs through the Fair Housing check first.
 */
export default async function CardsPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Search }) {
  const { token } = await params;
  if (!cardsTokenOk(token)) notFound();
  const sp = await searchParams;
  const channel: CardChannel = isCardChannel(sp.channel) ? sp.channel : "instagram";
  const place = (sp.place ?? "").slice(0, 120);
  const street = (sp.street ?? "").slice(0, 120);
  const [tide, week, placeCard, streetCard] = await Promise.all([
    loadCard("tide", { channel, size: "feed" }),
    loadCard("week", { channel, size: "feed" }),
    place ? loadCard("place", { channel, size: "feed", q: place }) : Promise.resolve(null),
    street ? loadCard("street", { channel, size: "feed", q: street }) : Promise.resolve(null),
  ]);
  const base = `/cards/${token}`;
  const q = (o: Record<string, string>) => new URLSearchParams({ channel, ...(place ? { place } : {}), ...(street ? { street } : {}), ...o }).toString();
  const img: ImageHref = (kind, size, extra = {}, download = false) =>
    `${base}/image?${new URLSearchParams({ card: kind, size, channel, ...extra, ...(download ? { download: "1" } : {}) }).toString()}`;

  return (
    <main className="mx-auto flex max-w-[64rem] flex-col gap-12 px-4 py-14 sm:px-8 md:py-20">
      <header className="flex flex-col gap-5">
        <h1 className="t-display text-navy">{C.pageTitle}</h1>
        <p className="t-lead max-w-[40rem] text-body">{C.pageLead}</p>
        <nav aria-label={C.channelLabel} className="flex flex-col gap-3">
          <span className="field-label">{C.channelLabel}</span>
          <div className="flex flex-wrap gap-2">
            {CARD_CHANNELS.map((c) => (
              <a key={c.slug} href={`${base}?${q({ channel: c.slug })}`} className="chip" data-active={c.slug === channel ? "true" : undefined} aria-current={c.slug === channel ? "page" : undefined}>
                {c.name}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <Section title={C.tide.title}>
        <Card img={img} card={tide} kind="tide" missing={C.tide.missing} />
      </Section>

      <Section title={C.week.title}>
        <Card img={img} card={week} kind="week" missing={C.week.missing} />
      </Section>

      <Section title={C.placeLabel}>
        <form method="get" action={base} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <input type="hidden" name="channel" value={channel} />
          {street ? <input type="hidden" name="street" value={street} /> : null}
          <label className="field flex-1">
            <span className="field-label">{C.placeLabel}</span>
            <input name="place" defaultValue={place} className="field-input" autoComplete="off" aria-describedby="place-hint" />
            <span id="place-hint" className="t-small text-graphite-500">{C.placeHint}</span>
          </label>
          <button type="submit" className="btn btn-navy">{C.show}</button>
        </form>
        {place ? <Card img={img} card={placeCard} kind="place" extra={{ q: place }} missing={C.placeNone(place)} /> : null}
      </Section>

      <Section title={C.streetLabel}>
        <form method="get" action={base} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <input type="hidden" name="channel" value={channel} />
          {place ? <input type="hidden" name="place" value={place} /> : null}
          <label className="field flex-1">
            <span className="field-label">{C.streetLabel}</span>
            <input name="street" defaultValue={street} className="field-input" autoComplete="off" aria-describedby="street-hint" />
            <span id="street-hint" className="t-small text-graphite-500">{C.streetHint}</span>
          </label>
          <button type="submit" className="btn btn-navy">{C.show}</button>
        </form>
        {street ? <Card img={img} card={streetCard} kind="street" extra={{ q: street }} missing={C.streetNone(street)} /> : null}
      </Section>
    </main>
  );
}
