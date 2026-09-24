import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/cta-band";
import { LetterForm } from "@/components/letter-form";
import { Photo } from "@/components/photo";
import { SectionHeading } from "@/components/section-heading";
import { getPosts } from "@/lib/content";
import { img } from "@/lib/content/seed/helpers";
import { formatDateLong } from "@/lib/content/format";
import type { Post } from "@/lib/content/types";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Tide · The Coast Market Report",
  description:
    "Once a quarter, one page on what happened in Lakewood Ranch, Sarasota and Bradenton and what it means for you. Plus guides on flood zones, timing and selling.",
  path: "/blog",
});

const BAND = img("library/kitchen-navy-island", "A navy kitchen island with woven stools", "40% 50%");

const noon = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d);
const isReport = (p: Post) => p.categories.includes("Market report");

function PostCard({ post, priority }: { post: Post; priority?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} className="card group flex w-full flex-col border border-hairline bg-white transition-colors duration-[120ms] hover:border-deep-harbor">
      <div className="relative aspect-[3/2] overflow-hidden bg-linen-100">
        <Photo image={post.cover} priority={priority} sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="card-img" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-700">{[post.edition, ...post.categories].filter(Boolean).join(" · ")}</p>
        <h3 className="t-h3 text-navy">{post.title}</h3>
        <p className="t-small text-body-muted">{post.excerpt}</p>
        <p className="t-record mt-auto pt-2 text-graphite-500">{formatDateLong(noon(post.publishedAt))}</p>
        <span className="card-line bg-sky-300" aria-hidden="true" />
      </div>
    </Link>
  );
}

export default async function ReportPage() {
  const posts = await getPosts();
  const reports = posts.filter(isReport);
  const guides = posts.filter((p) => !isReport(p));

  return (
    <>
      <section className="container-site flex flex-col gap-12 py-section" aria-labelledby="report-title">
        <SectionHeading
          as="h1"
          size="display"
          eyebrow={site.reportLong}
          title={<span id="report-title">What happened on your street this quarter, in plain language.</span>}
          titleClassName="max-w-[820px]"
        />

        {reports.length ? (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((p, i) => (
              <li key={p.slug} className="flex">
                <PostCard post={p} priority={i === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid gap-8 border border-hairline bg-white p-8 md:grid-cols-[1fr_1fr] md:items-center md:p-10">
            <div className="flex flex-col gap-3">
              <p className="t-eyebrow text-amber">The next report</p>
              <h2 className="t-h1 text-navy">It lands at the start of the quarter.</h2>
              <p className="t-body max-w-measure text-body">
                One page on Lakewood Ranch, Sarasota and Bradenton: what moved, what it means for you, and what we&rsquo;d do about it. Leave your email and it&rsquo;ll come to you.
              </p>
            </div>
            <LetterForm />
          </div>
        )}
      </section>

      {guides.length ? (
        <section className="bg-linen-100" aria-labelledby="guides-title">
          <div className="container-site flex flex-col gap-10 py-section">
            <SectionHeading eyebrow="Guides" title={<span id="guides-title">The things people ask us before they buy or sell.</span>} titleClassName="max-w-[760px]" />
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {guides.map((p) => (
                <li key={p.slug} className="flex">
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <CtaBand image={BAND} eyebrow={`${site.reportName}, by email`} title="Once a quarter, one page, written for you." body="Unsubscribe any time. We never share the list." minHeight="min-h-[480px]" className="scroll-mt-header">
        <LetterForm tone="dark" />
      </CtaBand>
    </>
  );
}
