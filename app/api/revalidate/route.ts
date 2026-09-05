import { parseBody } from "next-sanity/webhook";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Sanity GROQ-powered webhook → on-demand ISR.
 *
 * Configure in Sanity Manage with the secret in SANITY_REVALIDATE_SECRET and a
 * projection of `{ _type, "slug": slug.current }`. Requests without a valid
 * signature are rejected. Expiry is by tag (document type) plus the specific
 * detail path, never the whole site.
 */

type WebhookBody = { _type?: string; slug?: string | null };

const DETAIL_PATH: Record<string, string> = {
  listing: "/listings",
  event: "/calendar",
  venue: "/venues",
  neighborhood: "/neighborhoods",
  post: "/blog",
};

/** Types whose change affects other pages too. */
const RELATED_TAGS: Record<string, string[]> = {
  venue: ["event"],
  teamMember: ["post", "listing"],
  listing: ["neighborhood"],
  event: ["neighborhood"],
};

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "SANITY_REVALIDATE_SECRET is not set" }, { status: 500 });
  }

  try {
    const { isValidSignature, body } = await parseBody<WebhookBody>(request, secret);
    if (!isValidSignature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
    if (!body?._type) {
      return NextResponse.json({ message: "Bad request: missing _type" }, { status: 400 });
    }

    const tags = [body._type, ...(RELATED_TAGS[body._type] ?? [])];
    for (const tag of tags) revalidateTag(tag, "max");

    const paths: string[] = [];
    const base = DETAIL_PATH[body._type];
    if (base) {
      paths.push(base);
      if (body.slug) paths.push(`${base}/${body.slug}`);
    }
    // The home page composes most types.
    paths.push("/");
    if (body._type === "event" || body._type === "venue") paths.push("/api/calendar.ics");
    if (body._type === "siteSettings" || body._type === "teamMember") paths.push("/about", "/contact");
    for (const path of paths) revalidatePath(path);

    return NextResponse.json({ revalidated: true, tags, paths, now: Date.now() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[revalidate] failed", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
