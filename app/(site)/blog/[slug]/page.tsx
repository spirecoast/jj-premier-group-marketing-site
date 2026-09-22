import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { CtaBand } from "@/components/cta-band";
import { LetterForm } from "@/components/letter-form";
import { Photo } from "@/components/photo";
import { RichText } from "@/components/rich-text";
import { getPost, getPostSlugs, getPosts, getSiteSettings, getTeamMember } from "@/lib/content";
import { formatDateLong } from "@/lib/content/format";
import { img } from "@/lib/content/seed/helpers";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, personJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;
const RIVER = img("library/modern-home-pool-dusk", "A modern home lit at dusk, the pool still", "50% 45%");
const noon = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d);

export async function generateStaticParams() {
  return (await getPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Letter not found", robots: { index: false, follow: false } };
  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    fileImage: true, // opengraph-image.tsx beside this page
    type: "article",
  });
}

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const [posts, author, settings] = await Promise.all([getPosts(), getTeamMember(post.author.slug), getSiteSettings()]);
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: absoluteUrl(post.cover.src),
          datePublished: post.publishedAt,
          author: author ? personJsonLd(author, settings) : { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name, url: site.url },
          mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "The Coast Market Report", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <article className="container-site flex flex-col gap-10 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="t-mono-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-graphite-500">
          <Link href="/blog" className="-my-2 inline-block py-2 transition-colors hover:text-navy">
            Market Report
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-navy" aria-current="page">
            {post.edition ?? post.categories[0] ?? post.title}
          </span>
        </nav>
        <div className="relative aspect-[16/9] overflow-hidden bg-linen-100">
          <Photo image={post.cover} priority sizes="(min-width: 1024px) 1248px, 100vw" />
        </div>
        <header className="flex max-w-[900px] flex-col gap-4">
          <p className="t-eyebrow text-amber">{[post.edition, ...post.categories].filter(Boolean).join(" · ")}</p>
          <h1 className="t-display text-navy">{post.title}</h1>
          <p className="t-record text-graphite-600">
            {post.author.name} · {formatDateLong(noon(post.publishedAt))}
          </p>
        </header>
        <RichText value={post.body} className="text-[1.125rem]" />
        {author ? (
          <footer className="flex max-w-measure items-center gap-5 border-t border-hairline pt-8">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-linen-100">
              <Photo image={author.headshot} sizes="64px" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="t-h4 text-navy">{author.name}</p>
              <p className="t-small text-body-muted">
                {author.title} · {author.register}
              </p>
              <Link href={`/about#${author.slug}`} className="t-small text-harbor-700 underline underline-offset-4 hover:text-navy">
                About {author.name.split(" ")[0]}
              </Link>
            </div>
          </footer>
        ) : null}
      </article>

      {more.length ? (
        <section className="container-site flex flex-col gap-8 pb-section" aria-labelledby="more-title">
          <h2 id="more-title" className="t-eyebrow text-amber">
            More letters
          </h2>
          <ul className="grid gap-5 md:grid-cols-2">
            {more.map((p) => (
              <li key={p.slug} className="flex">
                <Link href={`/blog/${p.slug}`} className="card group flex w-full gap-5 border border-hairline bg-white p-4 transition-colors duration-[120ms] hover:border-deep-harbor">
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden bg-linen-100">
                    <Photo image={p.cover} sizes="128px" className="card-img" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sky-700">{p.edition ?? p.categories[0]}</p>
                    <h3 className="t-h3 text-navy">{p.title}</h3>
                    <p className="t-record text-graphite-500">{formatDateLong(noon(p.publishedAt))}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CtaBand image={RIVER} eyebrow="The Coast Market Report, by email" title="One page a quarter, written for you." body="What happened on your street, what it means for you, and what we got wrong last time." minHeight="min-h-[480px]">
        <LetterForm tone="dark" />
      </CtaBand>
    </>
  );
}
