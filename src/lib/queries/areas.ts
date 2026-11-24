import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { AreaRow, ListingType, PricePeriod } from "@/types/db";
import { PROPERTIES_TAG } from "./properties";

export const AREAS_TAG = "areas";

export type AreaSummary = {
  id: string;
  name: string;
  slug: string;
  heroImage: string | null;
  summary: string | null;
  listingCount: number;
  /** Average monthly rent of available rentals, if any. */
  avgRentKes: number | null;
  /** Average asking price of available sales, if any. */
  avgSaleKes: number | null;
};

type PriceRow = {
  area_id: string | null;
  listing_type: ListingType;
  price_kes: number | string | null;
  price_period: PricePeriod | null;
};

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** All areas in staff-defined order, with live listing counts and average prices. */
export async function getAreasWithStats(): Promise<AreaSummary[]> {
  "use cache";
  cacheTag(AREAS_TAG, PROPERTIES_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];

  const supabase = createPublicClient();
  const [areasRes, pricesRes] = await Promise.all([
    supabase
      .from("areas")
      .select("id, name, slug, hero_image, summary, sort_order")
      .order("sort_order")
      .overrideTypes<Pick<AreaRow, "id" | "name" | "slug" | "hero_image" | "summary" | "sort_order">[], { merge: false }>(),
    supabase
      .from("properties")
      .select("area_id, listing_type, price_kes, price_period")
      .eq("status", "published")
      .overrideTypes<PriceRow[], { merge: false }>(),
  ]);

  if (areasRes.error) {
    console.error("[getAreasWithStats]", areasRes.error.message);
    return [];
  }

  const byArea = new Map<string, { count: number; rents: number[]; sales: number[] }>();
  for (const p of pricesRes.data ?? []) {
    if (!p.area_id) continue;
    const entry = byArea.get(p.area_id) ?? { count: 0, rents: [], sales: [] };
    entry.count += 1;
    const price = Number(p.price_kes);
    if (Number.isFinite(price) && price > 0) {
      if (p.listing_type === "rent" && p.price_period === "month") entry.rents.push(price);
      if (p.listing_type === "sale") entry.sales.push(price);
    }
    byArea.set(p.area_id, entry);
  }

  return (areasRes.data ?? []).map((a) => {
    const stats = byArea.get(a.id);
    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      heroImage: a.hero_image,
      summary: a.summary,
      listingCount: stats?.count ?? 0,
      avgRentKes: avg(stats?.rents ?? []),
      avgSaleKes: avg(stats?.sales ?? []),
    };
  });
}

export type AreaDetail = Pick<AreaRow, "id" | "name" | "slug" | "county" | "hero_image" | "summary" | "guide_md" | "latitude" | "longitude">;

/** One area by slug (null if it doesn't exist). */
export async function getAreaBySlug(slug: string): Promise<AreaDetail | null> {
  "use cache";
  cacheTag(AREAS_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv() || !/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  const { data, error } = await createPublicClient()
    .from("areas")
    .select("id, name, slug, county, hero_image, summary, guide_md, latitude, longitude")
    .eq("slug", slug)
    .maybeSingle<AreaDetail>();
  if (error) console.error("[getAreaBySlug]", error.message);
  return data ?? null;
}

/** Slugs for generateStaticParams. */
export async function getAreaSlugs(): Promise<string[]> {
  "use cache";
  cacheTag(AREAS_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];
  const { data } = await createPublicClient().from("areas").select("slug").overrideTypes<{ slug: string }[], { merge: false }>();
  return (data ?? []).map((a) => a.slug);
}
