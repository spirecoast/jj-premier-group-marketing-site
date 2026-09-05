import type { Metadata } from "next";
import Link from "next/link";
import { LetterForm } from "@/components/letter-form";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { getPosts } from "@/lib/content";
import { formatDateLong } from "@/lib/content/format";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "The Quarterly Letter",
  description:
    "One page, once a quarter, no pitch. What your street actually did on the Suncoast, and what we got wrong last time. Plus guides on flood zones, timing and selling.",
  path: "/blog",
});

const noon = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d);

export default async function BlogPage() {
  const posts = await getPosts();
  const [latest, ...rest] = posts;

  return (
    <>
      <section className="container-site flex flex-col gap-12 py-section" aria-labelledby="letter-title">
        <SectionHeading
          as="h1"
          size="display"
          eyebrow="The quarterly letter"
          title={<span id="letter-title">One page, once a quarter, no pitch.</span>}
          aside={
            <p className="t-small max-w-[300px] text-body-muted md:text-right">
              What your street actually did, and what we got wrong last time. Four hundred words, maximum.
            </p>
          }
        />

        {latest ? (
          <Link href={`/blog/${latest.slug}`} className="card group grid gap-8 border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor lg:grid-cols-[1.3fr_1fr]">
            <div className="relative aspect-[16/9] overflow-hidden bg-linen-100 lg:aspect-auto lg:min-h-[420px]">
              <Photo image={latest.cover} priority sizes="(min-width: 1024px) 720px, 100vw" className="card-img" />
            </div>
            <div className="flex flex-col gap-4 p-7 lg:p-10">
              <p className="t-eyebrow text-amber">{[latest.edition, ...latest.categories].filter(Boolean).join(" · ")}</p>
              <h2 className="t-display text-navy">{latest.title}</h2>
              <p className="t-body text-body">{latest.excerpt}</p>
              <p className="t-record mt-auto text-graphite-500">
                {latest.author.name} · {formatDateLong(noon(latest.publishedAt))}
              </p>
              <span className="card-line bg-sky-300" aria-hidden="true" />
            </div>
          </Link>
        ) : null}

        {rest.length ? (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <li key={p.slug} className="flex">
                <Link href={`/blog/${p.slug}`} className="card group flex w-full flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor">
                  <div className="relative aspect-[3/2] overflow-hidden bg-linen-100">
                    <Photo image={p.cover} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="card-img" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-700">{[p.edition, ...p.categories].filter(Boolean).join(" · ")}</p>
                    <h3 className="t-h3 text-navy">{p.title}</h3>
                    <p className="t-small text-body-muted">{p.excerpt}</p>
                    <p className="t-record mt-auto pt-2 text-graphite-500">{formatDateLong(noon(p.publishedAt))}</p>
                    <span className="card-line bg-sky-300" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section id="subscribe" className="scroll-mt-header bg-navy text-linen-200">
        <div className="container-site grid items-center gap-8 py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-3">
            <p className="t-eyebrow text-mist">The letter, by email</p>
            <h2 className="t-h1 font-light text-white">The next one lands in October.</h2>
            <p className="t-body max-w-measure text-linen-200">One page a quarter. Unsubscribe with one click, and we never share the list.</p>
          </div>
          <LetterForm tone="dark" />
        </div>
      </section>
    </>
  );
}
