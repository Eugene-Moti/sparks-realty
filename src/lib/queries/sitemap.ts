import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { listingHref } from "@/lib/labels";
import { mediaUrl } from "@/lib/media";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { ListingType } from "@/types/db";
import { AREAS_TAG } from "./areas";
import { POSTS_TAG } from "./content";
import { PROPERTIES_TAG, PUBLIC_STATUSES } from "./properties";

export type SitemapEntry = { path: string; lastModified?: string; image?: string | null };

/** Every public listing, area and insight, for sitemap.ts. */
export async function getSitemapEntries(): Promise<{ listings: SitemapEntry[]; areas: SitemapEntry[]; posts: SitemapEntry[] }> {
  "use cache";
  cacheTag(PROPERTIES_TAG, AREAS_TAG, POSTS_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return { listings: [], areas: [], posts: [] };

  const supabase = createPublicClient();
  type ListingRow = { slug: string; listing_type: ListingType; updated_at: string; media: { url: string | null; storage_path: string | null; is_cover: boolean; kind: string }[] };
  const [listings, areas, posts] = await Promise.all([
    supabase
      .from("properties")
      .select("slug, listing_type, updated_at, media:property_media(url, storage_path, is_cover, kind)")
      .in("status", PUBLIC_STATUSES)
      .limit(5000)
      .overrideTypes<ListingRow[], { merge: false }>(),
    supabase.from("areas").select("slug").overrideTypes<{ slug: string }[], { merge: false }>(),
    supabase
      .from("posts")
      .select("slug, updated_at, published_at, cover_image")
      .eq("published", true)
      .overrideTypes<{ slug: string; updated_at: string | null; published_at: string | null; cover_image: string | null }[], { merge: false }>(),
  ]);
  for (const r of [listings, areas, posts]) if (r.error) console.error("[sitemap]", r.error.message);

  return {
    listings: (listings.data ?? []).map((l) => {
      const images = (l.media ?? []).filter((m) => m.kind === "image");
      const cover = images.find((m) => m.is_cover) ?? images[0];
      return { path: listingHref(l.listing_type, l.slug), lastModified: l.updated_at, image: cover ? mediaUrl(cover) : null };
    }),
    areas: (areas.data ?? []).map((a) => ({ path: `/areas/${a.slug}` })),
    posts: (posts.data ?? []).map((p) => ({ path: `/insights/${p.slug}`, lastModified: p.updated_at ?? p.published_at ?? undefined, image: p.cover_image })),
  };
}
