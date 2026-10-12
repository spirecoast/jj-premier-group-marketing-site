import { notFound } from "next/navigation";
import { Blocks, GuidePhoto } from "@/components/guides/blocks";
import { Wordmark } from "@/components/wordmark";
import { getSiteSettings, getTeam } from "@/lib/content";
import { formatDateLong } from "@/lib/content/format";
import { getGuide, getGuideSlugs, guideNumber, guideReadingMinutes, guideSources } from "@/lib/guides";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;
const noon = (d: string) => `${d}T12:00:00`;

export async function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({ slug }));
}

/**
 * A guide as a document for print, set for US Letter: a cover, a page with how
 * to use it, what's inside and the three questions, then every section from a
 * new page with its number and title, the worksheet, the sources, and a back
 * page with the two of us and the brokerage. The running foot and the page
 * numbers come from the @page rules in globals.css (.pdf-doc). The PDF on the
 * site is this page printed by scripts/guides-pdf.mjs.
 */
export default async function GuidePrint({ params }: { params: Params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const [settings, team] = await Promise.all([getSiteSettings(), getTeam()]);
  const minutes = guideReadingMinutes(guide);
  const updated = formatDateLong(noon(guide.updatedAt));
  const no = guideNumber(guide.slug);
  let figureCount = 0;
  const firstFigure = guide.sections.map((s) => {
    const first = figureCount + 1;
    figureCount += s.blocks.filter((b) => b.kind === "figure").length;
    return first;
  });
  const office = `${settings.officeAddress.city}, ${settings.officeAddress.state}`;

  return (
    <article className="pdf-guide" data-title={guide.title}>
      {/* The running head: the guide's name, on every page but the cover and the back. */}
      <style>{`@page { @top-left { content: ${JSON.stringify(guide.title)}; font-family: var(--font-newsreader), serif; font-style: italic; font-size: 8.5pt; color: #63666a; } }`}</style>
      {/* Cover */}
      <section className="pdf-cover">
        <div className="pdf-cover-photo">
          {/* The original JPEG, so the PDF carries it as a JPEG (next/image would hand Chromium WebP, which it stores uncompressed). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={guide.cover.src} alt={guide.cover.alt} style={{ objectPosition: guide.cover.position ?? "50% 50%" }} />
        </div>
        <div className="pdf-cover-panel">
          <div className="pdf-cover-top">
            <span>JJ Premier Group</span>
            <span>{no ? `Guide No. ${String(no).padStart(2, "0")}` : "Guide"}</span>
          </div>
          <h1 className="pdf-cover-title">{guide.title}</h1>
          <p className="pdf-cover-promise">{guide.promise}</p>
          <div className="pdf-cover-foot">
            <span>
              By {guide.author.name} · Updated {updated} · {minutes} min read
            </span>
            <span>
              {site.name} · {settings.brokerageName}
            </span>
          </div>
        </div>
      </section>

      {/* How to use · inside · the three questions */}
      <section className="pdf-page pdf-intro">
        <h2 className="pdf-h2">How to use this guide</h2>
        {guide.howToUse.map((t, i) => (
          <p key={i} className="guide-text">
            {t}
          </p>
        ))}
        <h2 className="pdf-h2 pdf-gap">Inside this guide</h2>
        <ol className="pdf-contents">
          {guide.sections.map((s, i) => (
            <li key={s.id}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </li>
          ))}
          <li>
            <span>{String(guide.sections.length + 1).padStart(2, "0")}</span>
            {guide.onOnePage.title}
          </li>
        </ol>
        <div className="pdf-questions">
          <p className="pdf-questions-title">As you read, keep coming back to three questions</p>
          <ol>
            {guide.questions.map((q, i) => (
              <li key={q}>
                <span aria-hidden="true">{i + 1}</span>
                {q}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The sections, each from a new page */}
      {guide.sections.map((s, i) => (
        <section key={s.id} className="pdf-section">
          <header className="pdf-section-head">
            <span className="pdf-section-no" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="pdf-section-title">{s.title}</h2>
            <p className="pdf-section-lead">{s.lead}</p>
          </header>
          {s.photo ? <GuidePhoto photo={s.photo} /> : null}
          <Blocks blocks={s.blocks} firstFigure={firstFigure[i]!} />
        </section>
      ))}

      {/* The worksheet */}
      <section className="pdf-section pdf-worksheet">
        <header className="pdf-section-head">
          <span className="pdf-section-no" aria-hidden="true">
            {String(guide.sections.length + 1).padStart(2, "0")}
          </span>
          <h2 className="pdf-section-title">{guide.onOnePage.title}</h2>
          <p className="pdf-section-lead">{guide.onOnePage.reading}</p>
        </header>
        <ol className="pdf-sheet">
          {guide.onOnePage.rows.map((r) => (
            <li key={r.label}>
              <span>{r.label}</span>
              <span>{r.value}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Sources */}
      <section className="pdf-page pdf-sources">
        <h2 className="pdf-h2">Sources</h2>
        <ol>
          {guideSources(guide).map((src) => (
            <li key={src.label}>
              {src.label}
              {src.href ? <span className="pdf-url">{src.href.replace(/^https?:\/\//, "")}</span> : null}
            </li>
          ))}
        </ol>
        <p className="pdf-fine">
          This guide is general information about places and rules, written for {site.region}. It is not legal, insurance or tax advice, and nothing in it is a figure
          for any particular house.
        </p>
      </section>

      {/* Back page */}
      <section className="pdf-back">
        <div className="pdf-back-inner">
          <Wordmark variant="waterline" tone="light" ground="bg-navy" />
          <p className="pdf-back-brokerage">{settings.brokerageName}</p>
          <p className="pdf-back-line">{guide.next.title}</p>
          <p className="pdf-back-body">{guide.next.body}</p>
          <div className="pdf-back-team">
            {team.map((m) => (
              <div key={m.slug}>
                <p className="pdf-back-name">{m.name}</p>
                <p>{m.phone}</p>
                <p>{m.email}</p>
              </div>
            ))}
          </div>
          <p className="pdf-back-web">{site.url.replace(/^https?:\/\//, "")}/guides/{guide.slug}</p>
          <p className="pdf-fine pdf-back-fine">
            {site.name} is a real estate team: {team.map((m) => m.name).join(" and ")}, licensed Florida real estate agents with {settings.brokerageName}, {office}. Real
            estate services are provided through {settings.brokerageName}. Equal Housing Opportunity.
          </p>
        </div>
      </section>
    </article>
  );
}
