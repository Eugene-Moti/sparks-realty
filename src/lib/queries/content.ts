import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { listingHref } from "@/lib/labels";
import type { ListingType, PostRow, TestimonialRow, VideoRow } from "@/types/db";

export const TESTIMONIALS_TAG = "testimonials";
export const POSTS_TAG = "posts";
export const VIDEOS_TAG = "videos";

export type Testimonial = Pick<TestimonialRow, "id" | "author" | "role" | "quote" | "rating" | "avatar_url">;

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheTag(TESTIMONIALS_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await createPublicClient()
    .from("testimonials")
    .select("id, author, role, quote, rating, avatar_url")
    .eq("published", true)
    .order("sort_order")
    .overrideTypes<Testimonial[], { merge: false }>();
  if (error) console.error("[getTestimonials]", error.message);
  return data ?? [];
}

export type PostSummary = Pick<
  PostRow,
  "id" | "slug" | "title" | "excerpt" | "cover_image" | "category" | "published_at"
> & { readingMinutes: number };

export async function getLatestPosts(limit = 3): Promise<PostSummary[]> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await createPublicClient()
    .from("posts")
    .select("id, slug, title, excerpt, cover_image, category, published_at, body_md")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)
    .overrideTypes<(Omit<PostSummary, "readingMinutes"> & { body_md: string | null })[], { merge: false }>();
  if (error) console.error("[getLatestPosts]", error.message);
  return (data ?? []).map(({ body_md, ...post }) => ({
    ...post,
    readingMinutes: Math.max(1, Math.round((body_md ?? "").split(/\s+/).length / 220)),
  }));
}

export type Video = Pick<VideoRow, "id" | "platform" | "url" | "title" | "thumbnail" | "is_featured">;

export async function getVideos(limit = 12): Promise<Video[]> {
  "use cache";
  cacheTag(VIDEOS_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await createPublicClient()
    .from("videos")
    .select("id, platform, url, title, thumbnail, is_featured")
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .limit(limit)
    .overrideTypes<Video[], { merge: false }>();
  if (error) console.error("[getVideos]", error.message);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Insights (Phase 7)
// ---------------------------------------------------------------------------

const readingMinutes = (md: string | null) => Math.max(1, Math.round((md ?? "").trim().split(/\s+/).filter(Boolean).length / 220));

/** Every published insight, newest first (for /insights). */
export async function getAllPosts(): Promise<(PostSummary & { tags: string[] })[]> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];
  const { data, error } = await createPublicClient()
    .from("posts")
    .select("id, slug, title, excerpt, cover_image, category, published_at, body_md, tags")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(200)
    .overrideTypes<(Omit<PostSummary, "readingMinutes"> & { body_md: string | null; tags: string[] | null })[], { merge: false }>();
  if (error) console.error("[getAllPosts]", error.message);
  return (data ?? []).map(({ body_md, tags, ...post }) => ({ ...post, tags: tags ?? [], readingMinutes: readingMinutes(body_md) }));
}

export type PostDetail = PostSummary & {
  body_md: string;
  tags: string[];
  updated_at: string | null;
  author: { name: string; avatarUrl: string | null } | null;
};

/** One published insight by slug (null if missing or unpublished). */
export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv() || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  type Row = Omit<PostDetail, "readingMinutes" | "author" | "tags" | "body_md"> & {
    body_md: string | null;
    tags: string[] | null;
    author: { full_name: string | null; avatar_url: string | null } | null;
  };
  const { data, error } = await createPublicClient()
    .from("posts")
    .select("id, slug, title, excerpt, cover_image, category, published_at, updated_at, body_md, tags, author:profiles(full_name, avatar_url)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle<Row>();
  if (error) console.error("[getPostBySlug]", error.message);
  if (!data) return null;
  const { author, ...post } = data;
  return {
    ...post,
    body_md: post.body_md ?? "",
    tags: post.tags ?? [],
    readingMinutes: readingMinutes(post.body_md),
    // RLS only returns authors who chose to appear on "Our Team".
    author: author?.full_name ? { name: author.full_name, avatarUrl: author.avatar_url } : null,
  };
}

export async function getPostSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];
  const { data } = await createPublicClient().from("posts").select("slug").eq("published", true).overrideTypes<{ slug: string }[], { merge: false }>();
  return (data ?? []).map((p) => p.slug);
}

/** Up to `limit` other insights, preferring the same category, then shared tags, then newest. */
export async function getRelatedPosts(post: Pick<PostDetail, "id" | "category" | "tags">, limit = 3): Promise<PostSummary[]> {
  const all = await getAllPosts();
  const score = (p: (typeof all)[number]) =>
    (post.category && p.category === post.category ? 10 : 0) + p.tags.filter((t) => post.tags.includes(t)).length;
  return all
    .filter((p) => p.id !== post.id)
    .map((p, i) => ({ p, s: score(p), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map(({ p }) => p);
}

// ---------------------------------------------------------------------------
// House tours (Phase 7)
// ---------------------------------------------------------------------------

export type TourVideo = Video & { listing: { title: string; href: string } | null };

/** Every house tour, featured first, with the linked listing when it's public. */
export async function getAllVideos(): Promise<TourVideo[]> {
  "use cache";
  cacheTag(VIDEOS_TAG, "properties");
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];
  type Row = Video & { property: { title: string; slug: string; listing_type: ListingType } | null };
  const { data, error } = await createPublicClient()
    .from("videos")
    .select("id, platform, url, title, thumbnail, is_featured, property:properties(title, slug, listing_type)")
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .limit(200)
    .overrideTypes<Row[], { merge: false }>();
  if (error) console.error("[getAllVideos]", error.message);
  return (data ?? []).map(({ property, ...v }) => ({
    ...v,
    listing: property
      ? { title: property.title, href: listingHref(property.listing_type, property.slug) }
      : null,
  }));
}
