import { cardsTokenOk } from "@/lib/cards/access";
import { CARD_SIZES, type CardKind, type CardSize } from "@/lib/cards/copy";
import { isCardChannel, loadCard, shortUrl } from "@/lib/cards/data";
import { renderCard } from "@/lib/cards/render";

export const dynamic = "force-dynamic";

const KINDS: CardKind[] = ["tide", "week", "place", "street"];

/**
 * GET /cards/<token>/image?card=tide|week|place|street&size=feed|story&channel=<network>[&q=…][&download=1]:
 * one card as a PNG. 404 for a wrong token, an unknown card, or a card whose caption is held.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!cardsTokenOk(token)) return new Response("Not found", { status: 404 });
  const u = new URL(request.url);
  const kind = u.searchParams.get("card") as CardKind;
  const size = (u.searchParams.get("size") === "story" ? "story" : "feed") as CardSize;
  const channel = u.searchParams.get("channel");
  if (!KINDS.includes(kind) || !isCardChannel(channel)) return new Response("Not found", { status: 404 });
  const card = await loadCard(kind, { channel, size, q: (u.searchParams.get("q") ?? "").slice(0, 120) });
  if (!card || card.held) return new Response("Not found", { status: 404 });
  const png = await renderCard(card, size, shortUrl(channel));
  const headers = new Headers({ "Content-Type": "image/png", "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" });
  if (u.searchParams.get("download")) {
    const name = `jj-${kind}${card.kind === "place" || card.kind === "street" ? `-${card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` : ""}-${channel}-${CARD_SIZES[size].width}x${CARD_SIZES[size].height}.png`;
    headers.set("Content-Disposition", `attachment; filename="${name}"`);
  }
  return new Response(new Uint8Array(await png.arrayBuffer()), { headers });
}
