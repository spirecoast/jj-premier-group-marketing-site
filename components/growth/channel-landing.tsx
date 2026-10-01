import { LetterForm } from "@/components/letter-form";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { TrackedLink } from "@/components/tracked-link";
import { MORE, type ChannelCopy } from "@/lib/channels/copy";
import { img } from "@/lib/content/seed/helpers";

/**
 * One page for every /from/<channel> link: a line in the team's voice, one
 * primary action, then Atlas match, the Encore visit planner and the Tide bar.
 * Every click here is an `Explore` goal with the channel attached, and the
 * Tide bar sends `source=<channel>` so the lead is tagged `source:<channel>`.
 * The visit's channel is also remembered by components/utm-tracker.tsx, so a
 * lead sent from the planner or the sold search afterwards carries it too.
 */
export function ChannelLanding({ copy, phone }: { copy: ChannelCopy; phone: { e164: string; display: string } }) {
  const photo = img(copy.image.name, copy.image.alt, copy.image.position);
  const where = `from-${copy.slug}`;
  const cards = [
    { key: "atlas", ...MORE.atlas },
    { key: "encore", ...MORE.encore },
  ] as const;

  return (
    <>
      <section className="container-site grid gap-12 py-section lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20" aria-labelledby="from-title">
        <div className="flex flex-col gap-8">
          <SectionHeading as="h1" size="display" eyebrow={copy.eyebrow} title={<span id="from-title">{copy.heading}</span>} />
          <p className="t-lead max-w-measure text-body">{copy.line}</p>
          <div className="flex flex-col gap-4">
            <TrackedLink
              href={copy.cta.href}
              event="Explore"
              props={{ action: "channel-cta", channel: copy.slug, to: copy.cta.href }}
              className="btn btn-navy self-start"
            >
              {copy.cta.label}
              <span className="btn-dash" aria-hidden="true" />
            </TrackedLink>
            <p className="t-small max-w-[440px] text-graphite-500">{copy.cta.note}</p>
          </div>
          <p className="t-small text-body">
            {MORE.talk}{" "}
            <TrackedLink href={`tel:${phone.e164}`} event="Phone tap" props={{ where }} className="font-mono text-navy underline underline-offset-4 hover:text-harbor-700">
              {phone.display}
            </TrackedLink>
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-linen-100 lg:aspect-[4/5]">
          <Photo image={photo} priority sizes="(min-width: 1024px) 520px, 100vw" />
        </div>
      </section>

      <section className="bg-linen-200" aria-labelledby="from-more-title">
        <div className="container-site flex flex-col gap-10 py-section">
          <SectionHeading eyebrow={MORE.eyebrow} title={<span id="from-more-title">{MORE.heading}</span>} />
          <ul className="grid gap-10 md:grid-cols-3 md:gap-8">
            {cards.map((c) => (
              <li key={c.key} className="relative flex flex-col gap-4 border-t border-rule pt-7">
                <span className="absolute -top-px left-0 h-px w-12 bg-amber" aria-hidden="true" />
                <h3 className="t-h3 text-navy">{c.name}</h3>
                <p className="t-body max-w-[40ch] text-body">{c.line}</p>
                <TrackedLink href={c.href} event="Explore" props={{ action: "channel-more", channel: copy.slug, to: c.href }} className="link-rule mt-auto self-start">
                  {c.label}
                </TrackedLink>
              </li>
            ))}
            <li className="relative flex flex-col gap-4 border-t border-rule pt-7">
              <span className="absolute -top-px left-0 h-px w-12 bg-amber" aria-hidden="true" />
              <h3 className="t-h3 text-navy">{MORE.tide.name}</h3>
              <p className="t-body max-w-[40ch] text-body">{MORE.tide.line}</p>
              <LetterForm form="letter" label={MORE.tide.label} source={copy.slug} className="mt-auto" />
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
