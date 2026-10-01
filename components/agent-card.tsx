import type { TeamMember } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";
import { RichText } from "./rich-text";

/**
 * The two agent cards: portrait, name, how to reach them, and a short bio.
 *
 * `full` is the team page: the portrait is a 4:5 no wider than 360px, set
 * beside the name and the bio from the tablet up and at half the width on a
 * phone, so the words and the face arrive together. Without `full` (the
 * listing sidebar) the portrait sits above the contact lines as before.
 */
export function AgentCard({ member, className, full, as: Heading = "h3" }: { member: TeamMember; className?: string; full?: boolean; as?: "h2" | "h3" }) {
  if (full) {
    return (
      <article id={member.slug} className={cn("grid gap-8 scroll-mt-24 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)] sm:gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-14", className)}>
        <div className="relative aspect-[4/5] w-1/2 overflow-hidden bg-linen-100 sm:w-full">
          {/* Half the phone's width, then the column: 320px from the tablet, 360px from the desktop. */}
          <Photo image={member.headshot} sizes="(min-width: 1024px) 360px, (min-width: 640px) 320px, 50vw" />
        </div>
        <div className="flex flex-col gap-6">
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
          <RichText value={member.bio} />
          {member.quote ? (
            <blockquote className="border-l-2 border-navy pl-5 font-display text-[22px] font-light italic leading-[1.3] text-navy">
              “{member.quote}”
            </blockquote>
          ) : null}
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
