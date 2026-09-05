import type { TeamMember } from "@/lib/content/types";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";
import { RichText } from "./rich-text";

/** Two agent cards with license numbers, as the brief specifies. */
export function AgentCard({ member, className, full }: { member: TeamMember; className?: string; full?: boolean }) {
  return (
    <article id={member.slug} className={cn("flex flex-col gap-6 scroll-mt-24", className)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-linen-100">
        <Photo image={member.headshot} sizes="(min-width: 1024px) 40vw, 100vw" />
      </div>
      <div className="flex flex-col gap-3">
        {member.register ? <p className="t-eyebrow text-amber">{member.register}</p> : null}
        <h3 className="t-h1 text-navy">{member.name}</h3>
        <p className="t-record text-graphite-600">
          {member.title} · {member.licenseNumber ? `FL ${member.licenseNumber}` : "FL license pending"}
        </p>
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
      {full ? (
        <>
          <RichText value={member.bio} />
          {member.quote ? (
            <blockquote className="border-l-2 border-navy pl-5 font-display text-[22px] font-light italic leading-[1.3] text-navy">
              “{member.quote}”
            </blockquote>
          ) : null}
        </>
      ) : null}
    </article>
  );
}
