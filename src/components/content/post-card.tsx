import Image from "next/image";
import Link from "next/link";
import { cn } from "@/helpers/classname-helper";
import type { PostSummary } from "@/lib/queries/content";

export const postDateFmt = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" });

/** Insight card (cover, category, date, reading time, title, excerpt). `large` for the lead story. */
export function PostCard({ post, large = false, headingLevel = 3 }: { post: PostSummary; large?: boolean; headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <article className={cn("group flex flex-col gap-5", large && "lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center lg:gap-12")}>
      <Link
        href={`/insights/${post.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-3/2 overflow-hidden rounded-(--radius-card) bg-surface-2"
      >
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt=""
            fill
            sizes={large ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition-transform duration-[1.2s] ease-(--ease-out-brand) group-hover:scale-[1.05]"
          />
        ) : (
          <span aria-hidden="true" className="grain absolute inset-0 grid place-items-center bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG */}
            <img src="/brand/mark.svg" alt="" className="size-20 opacity-50" />
          </span>
        )}
      </Link>
      <div className="flex flex-col gap-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted text-xs">
          {post.category ? <span className="eyebrow">{post.category}</span> : null}
          {post.published_at ? <time dateTime={post.published_at}>{postDateFmt.format(new Date(post.published_at))}</time> : null}
          <span>· {post.readingMinutes} min read</span>
        </p>
        <H className={cn("font-display leading-snug", large ? "text-[clamp(1.9rem,3vw,2.75rem)] leading-[1.1]" : "text-2xl")}>
          <Link href={`/insights/${post.slug}`} className="transition-colors hover:text-accent">
            {post.title}
          </Link>
        </H>
        {post.excerpt ? <p className={cn("text-muted leading-relaxed", large ? "line-clamp-4" : "line-clamp-3 text-sm")}>{post.excerpt}</p> : null}
      </div>
    </article>
  );
}
