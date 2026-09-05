import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { LetterForm } from "@/components/letter-form";
import { Photo } from "@/components/photo";
import { RichText } from "@/components/rich-text";
import { getPost, getPostSlugs, getPosts, getSiteSettings, getTeamMember } from "@/lib/content";
import { formatDateLong } from "@/lib/content/format";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, personJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

type Params = Promise<{ slug: string }>;
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
    image: post.cover,
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
          { name: "The Quarterly Letter", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <article className="container-site flex flex-col gap-10 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="t-mono-sm flex flex-wrap items-center gap-x-3 gap-y-1 text-graphite-500">
          <Link href="/blog" className="transition-colors hover:text-navy">
            The Letter
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

      <section className="bg-navy text-linen-200">
        <div className="container-site grid items-center gap-8 py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-3">
            <p className="t-eyebrow text-mist">The letter, by email</p>
            <h2 className="t-h1 font-light text-white">One page, once a quarter, no pitch.</h2>
          </div>
          <LetterForm tone="dark" />
        </div>
      </section>
    </>
  );
}
