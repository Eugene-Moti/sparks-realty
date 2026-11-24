import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Reveal, RevealGroup } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { PostSummary } from "@/lib/queries/content";

const dateFmt = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" });

export function LatestInsights({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="insights-title" className="mx-auto w-full max-w-[90rem] px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
      <SectionHeading
        id="insights-title"
        eyebrow="Insights"
        title="Market notes from the ground"
        action={
          <Button asChild variant="gold-outline">
            <Link href="/insights">
              All insights <ArrowRightIcon />
            </Link>
          </Button>
        }
      />
      <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <Reveal key={post.id} as="article" className="group flex flex-col gap-5">
            <Link href={`/insights/${post.slug}`} className="relative block aspect-3/2 overflow-hidden rounded-(--radius-card) bg-surface-2" tabIndex={-1} aria-hidden="true">
              {post.cover_image ? (
                <Image
                  src={post.cover_image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] ease-(--ease-out-brand) group-hover:scale-[1.05]"
                />
              ) : null}
            </Link>
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-3 text-muted text-xs">
                {post.category ? <span className="eyebrow">{post.category}</span> : null}
                {post.published_at ? <time dateTime={post.published_at}>{dateFmt.format(new Date(post.published_at))}</time> : null}
                <span>· {post.readingMinutes} min read</span>
              </p>
              <h3 className="font-display text-2xl leading-snug">
                <Link href={`/insights/${post.slug}`} className="transition-colors hover:text-accent">
                  {post.title}
                </Link>
              </h3>
              {post.excerpt ? <p className="line-clamp-3 text-muted text-sm leading-relaxed">{post.excerpt}</p> : null}
            </div>
          </Reveal>
        ))}
      </RevealGroup>
    </section>
  );
}
