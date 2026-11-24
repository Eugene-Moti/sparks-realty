import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { listingHref } from "@/lib/labels";
import { type ImageData, propertyImages } from "@/lib/media";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { ListingStatus, ListingType, PricePeriod, PropertyMediaRow, PropertyRow, PropertyType } from "@/types/db";

export const PROPERTIES_TAG = "properties";

/** Statuses the public can see (matches the RLS policy). */
export const PUBLIC_STATUSES: ListingStatus[] = ["published", "under_offer", "sold", "let"];

const NEW_FOR_DAYS = 7;

/** Columns needed to render a PropertyCard. */
export const CARD_SELECT = `
  id, ref_code, slug, title, listing_type, status, property_type, address_line,
  price_kes, price_period, price_on_request, bedrooms, bathrooms, parking_spaces, floor_area_sqm,
  tags, is_featured, youtube_url, published_at,
  area:areas ( name, slug ),
  media:property_media ( id, property_id, kind, storage_path, url, alt, caption, room_label, width, height, blur_data, sort_order, is_cover )
`;

export type CardRow = Pick<
  PropertyRow,
  | "id"
  | "ref_code"
  | "slug"
  | "title"
  | "listing_type"
  | "status"
  | "property_type"
  | "address_line"
  | "price_kes"
  | "price_period"
  | "price_on_request"
  | "bedrooms"
  | "bathrooms"
  | "parking_spaces"
  | "floor_area_sqm"
  | "tags"
  | "is_featured"
  | "youtube_url"
  | "published_at"
> & {
  area: { name: string; slug: string } | null;
  media: PropertyMediaRow[] | null;
};

/** Serializable data for <PropertyCard>. */
export type PropertyCardData = {
  id: string;
  refCode: string | null;
  href: string;
  title: string;
  listingType: ListingType;
  status: ListingStatus;
  propertyType: PropertyType;
  areaName: string | null;
  areaSlug: string | null;
  address: string | null;
  priceKes: number | null;
  pricePeriod: PricePeriod | null;
  priceOnRequest: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  floorArea: number | null;
  images: ImageData[];
  isFeatured: boolean;
  isNew: boolean;
  priceDrop: boolean;
  youtubeUrl: string | null;
};

export function toNum(v: number | string | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function toCardData(row: CardRow, now = Date.now()): PropertyCardData {
  const published = row.published_at ? Date.parse(row.published_at) : null;
  return {
    id: row.id,
    refCode: row.ref_code,
    href: listingHref(row.listing_type, row.slug),
    title: row.title,
    listingType: row.listing_type,
    status: row.status,
    propertyType: row.property_type,
    areaName: row.area?.name ?? null,
    areaSlug: row.area?.slug ?? null,
    address: row.address_line,
    priceKes: toNum(row.price_kes),
    pricePeriod: row.price_period,
    priceOnRequest: row.price_on_request,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parking: row.parking_spaces,
    floorArea: toNum(row.floor_area_sqm),
    images: propertyImages(row.media, row.title).slice(0, 6),
    isFeatured: row.is_featured,
    isNew: published !== null && now - published < NEW_FOR_DAYS * 86_400_000,
    priceDrop: row.tags?.includes("price_drop") ?? false,
    youtubeUrl: row.youtube_url,
  };
}

/**
 * Listings for the homepage: featured first, then newest. Includes under-offer
 * / sold / let so the agency's track record shows (with ribbons).
 */
export async function getHomepageListings(limit = 24): Promise<PropertyCardData[]> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];

  const { data, error } = await createPublicClient()
    .from("properties")
    .select(CARD_SELECT)
    .in("status", PUBLIC_STATUSES)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)
    .overrideTypes<CardRow[], { merge: false }>();

  if (error) {
    console.error("[getHomepageListings]", error.message);
    return [];
  }
  const now = Date.now();
  return (data ?? []).map((row) => toCardData(row, now));
}

export type ListingCounts = Record<ListingType, number>;

/** Number of available (published) listings per type, for the "three ways" tiles. */
export async function getListingCounts(): Promise<ListingCounts> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("hours");
  const empty: ListingCounts = { sale: 0, rent: 0, short_stay: 0 };
  if (!hasSupabaseEnv()) return empty;

  const supabase = createPublicClient();
  const types: ListingType[] = ["sale", "rent", "short_stay"];
  const results = await Promise.all(
    types.map((t) =>
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .eq("listing_type", t),
    ),
  );
  return Object.fromEntries(types.map((t, i) => [t, results[i].count ?? 0])) as ListingCounts;
}
