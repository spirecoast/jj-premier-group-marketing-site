import type { TeamMember } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";
import { RichText } from "./rich-text";

/**
 * The two agent cards: portrait, name, how to reach them, and a short bio.
 *
 * `full` is the team page: the home page's "meet" split, the portrait at 3:4
 * across five of twelve columns from lg, and beside it, centred on the
 * portrait, the name, the ways to reach them as a record (call, text, email,
 * the contact page's own links), the bio, and the quote in the agent's own
 * voice as a t-quote line. The frame is built for the bios the owners are
 * writing. Without `full` (the listing sidebar) the portrait sits above the
 * contact lines as before.
 */
export function AgentCard({ member, className, full, as: Heading = "h3" }: { member: TeamMember; className?: string; full?: boolean; as?: "h2" | "h3" }) {
  const first = member.name.split(" ")[0];
  if (full) {
    return (
      <article id={member.slug} className={cn("grid gap-8 scroll-mt-24 sm:gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-14", className)}>
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-linen-100 sm:max-w-[400px] lg:col-span-5 lg:max-w-none">
          {/* The phone's width, then 400px, then five columns of the frame. */}
          <Photo image={member.headshot} sizes="(min-width: 1024px) 520px, (min-width: 640px) 400px, 100vw" />
        </div>
        <div className="flex flex-col gap-8 lg:col-span-7">
          <div className="flex flex-col gap-3">
            <Heading className="t-h1 text-navy">{member.name}</Heading>
            <p className="t-record text-graphite-600">{member.title}</p>
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-8 border-t border-hairline">
            <dt className="t-mono-sm border-b border-hairline py-3 text-graphite-500">Call</dt>
            <dd className="border-b border-hairline py-3">
              <a href={`tel:${member.phoneE164}`} className="t-record text-navy transition-colors hover:text-harbor-700">
                {member.phone}
              </a>
            </dd>
            <dt className="t-mono-sm border-b border-hairline py-3 text-graphite-500">Text</dt>
            <dd className="border-b border-hairline py-3">
              <a href={`sms:${member.phoneE164}`} className="t-record text-navy transition-colors hover:text-harbor-700">
                Text {first}
              </a>
            </dd>
            <dt className="t-mono-sm border-b border-hairline py-3 text-graphite-500">Email</dt>
            <dd className="min-w-0 border-b border-hairline py-3">
              <a href={`mailto:${member.email}`} className="t-record break-all text-navy transition-colors hover:text-harbor-700">
                {member.email}
              </a>
            </dd>
          </dl>
          <RichText value={member.bio} />
          {member.quote ? <blockquote className="t-quote max-w-measure text-navy">“{member.quote}”</blockquote> : null}
        </div>
      </article>
    );
  }
  return (
    <article id={member.slug} className={cn("flex flex-col gap-6 scroll-mt-24", className)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-linen-100">
        <Photo image={member.headshot} sizes="(min-width: 1024px) 40vw, 100vw" />
      </div>
      <div className="flex flex-col gap-3">
        <Heading className="t-h1 text-navy">{member.name}</Heading>
        <p className="t-record text-graphite-600">{member.title}</p>
        <ul className="flex flex-col gap-1 pt-1">
          <li>
            <a href={`tel:${member.phoneE164}`} className="font-mono text-[15px] text-navy hover:text-harbor-700">
              {member.phone}
            </a>
          </li>
          <li>
            <a href={`mailto:${member.email}`} className="t-small break-all text-harbor-700 hover:text-navy">
              {member.email}
            </a>
          </li>
        </ul>
      </div>
    </article>
  );
}
