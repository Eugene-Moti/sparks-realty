import { ArrowLeftIcon, WhatsappLogoIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/content/markdown";
import { PostCard, postDateFmt } from "@/components/content/post-card";
import { Breadcrumbs } from "@/components/layout/page-hero";
import { ShareButton } from "@/components/property/detail/share-button";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/config/site";
import { whatsappLink } from "@/lib/format";
import { getPostBySlug, getPostSlugs, getRelatedPosts } from "@/lib/queries/content";
import { getSiteSettings } from "@/lib/queries/site-settings";

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  // At least one param is required for build-time validation with Cache Components.
  return (slugs.length ? slugs : ["sample-insight"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/insights/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Insight not found" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/insights/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? undefined,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      ...(post.cover_image ? { images: [{ url: post.cover_image }] } : {}),
    },
  };
}

export default async function InsightPage({ params }: PageProps<"/insights/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const [related, settings] = await Promise.all([getRelatedPosts(post), getSiteSettings()]);
  const url = absoluteUrl(`/insights/${post.slug}`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt ?? undefined,
          image: post.cover_image ? [post.cover_image] : undefined,
          datePublished: post.published_at ?? undefined,
          dateModified: post.updated_at ?? post.published_at ?? undefined,
          mainEntityOfPage: url,
          author: post.author ? { "@type": "Person", name: post.author.name } : { "@type": "Organization", name: settings.companyName },
          publisher: { "@type": "Organization", name: settings.companyName, logo: { "@type": "ImageObject", url: absoluteUrl("/icon-512.png") } },
          keywords: post.tags.length ? post.tags.join(", ") : undefined,
        }}
      />

      <article>
        <header className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-10 pb-10 sm:px-6 lg:pt-14">
          <Breadcrumbs
            items={[
              { name: "Insights", href: "/insights" },
              { name: post.title, href: `/insights/${post.slug}` },
            ]}
          />
          {post.category ? <p className="eyebrow">{post.category}</p> : null}
          <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05]">{post.title}</h1>
          {post.excerpt ? <p className="text-lg text-muted leading-relaxed">{post.excerpt}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-4 border-hairline border-y py-4">
            <div className="flex items-center gap-3 text-sm">
              {post.author?.avatarUrl ? (
                <Image src={post.author.avatarUrl} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
              ) : null}
              <p className="flex flex-col">
                <span className="font-medium">{post.author?.name ?? settings.companyName}</span>
                <span className="text-muted text-xs">
                  {post.published_at ? <time dateTime={post.published_at}>{postDateFmt.format(new Date(post.published_at))}</time> : null}
                  {" · "}
                  {post.readingMinutes} min read
                </span>
              </p>
            </div>
            <ShareButton url={url} title={post.title} text={`${post.title} — Sparks Properties`} variant="full" />
          </div>
        </header>

        {post.cover_image ? (
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="relative aspect-video overflow-hidden rounded-(--radius-card) bg-surface-2">
              <Image src={post.cover_image} alt="" fill priority sizes="(min-width: 1152px) 1152px, 100vw" className="object-cover" />
            </div>
          </div>
        ) : null}

        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <Markdown source={post.body_md} />

          {post.tags.length ? (
            <ul className="mt-12 flex flex-wrap gap-2" aria-label="Tags">
              {post.tags.map((t) => (
                <li key={t} className="rounded-full border border-hairline px-3 py-1 text-muted text-xs">
                  {t}
                </li>
              ))}
            </ul>
          ) : null}

          <aside className="dark grain relative mt-14 flex flex-col gap-4 overflow-hidden rounded-(--radius-card) bg-ink p-7 text-ivory sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl">Questions about this?</p>
              <p className="mt-1 text-ivory/65 text-sm">Our agents answer on WhatsApp during office hours.</p>
            </div>
            <Button asChild variant="green-solid" className="shrink-0">
              <a href={whatsappLink(`Hi Sparks Properties, I just read "${post.title}" and have a question.`, settings.whatsapp)} target="_blank" rel="noopener noreferrer">
                <WhatsappLogoIcon weight="fill" /> Ask on WhatsApp
              </a>
            </Button>
          </aside>

          <Link href="/insights" className="mt-10 inline-flex items-center gap-2 text-muted text-sm hover:text-foreground">
            <ArrowLeftIcon /> All insights
          </Link>
        </div>
      </article>

      {related.length ? (
        <section aria-labelledby="related-title" className="border-hairline border-t">
          <div className="mx-auto w-full max-w-[90rem] px-4 py-20 sm:px-6 lg:px-10">
            <h2 id="related-title" className="mb-10 font-display text-[clamp(1.75rem,3vw,2.5rem)]">
              Keep reading
            </h2>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
