import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { approximateLocation } from "@/lib/geo";
import { listingHref } from "@/lib/labels";
import { type ImageData, mediaUrl, propertyImages, storagePublicUrl } from "@/lib/media";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import { nairobiToday } from "@/lib/dates";
import type {
  Furnishing,
  ListingStatus,
  ListingType,
  PricePeriod,
  PropertyMediaRow,
  PropertyRow,
  PropertyType,
} from "@/types/db";
import { CARD_SELECT, type CardRow, PROPERTIES_TAG, PUBLIC_STATUSES, type PropertyCardData, toCardData, toNum } from "./properties";

const NEW_FOR_DAYS = 7;

export type DetailRow = PropertyRow & {
  area: { name: string; slug: string } | null;
  media: PropertyMediaRow[] | null;
  agent: {
    full_name: string | null;
    phone: string | null;
    whatsapp: string | null;
    avatar_url: string | null;
    bio: string | null;
  } | null;
};

export type PropertyAgent = {
  name: string;
  phone: string | null;
  whatsapp: string | null;
  avatar: string | null;
  bio: string | null;
};

export type PropertyVideo = { url: string; title: string };
export type PropertyDocument = { url: string; label: string };

/** Everything the detail page renders. Exact coordinates are never included. */
export type PropertyDetail = {
  id: string;
  refCode: string | null;
  slug: string;
  href: string;
  title: string;
  summary: string | null;
  description: string | null;
  listingType: ListingType;
  status: ListingStatus;
  propertyType: PropertyType;
  area: { name: string; slug: string } | null;
  address: string | null;
  /** Offset for privacy (see lib/geo). */
  location: { lat: number; lng: number } | null;

  priceKes: number | null;
  pricePeriod: PricePeriod | null;
  priceOnRequest: boolean;
  serviceChargeKes: number | null;
  depositMonths: number | null;

  bedrooms: number | null;
  bathrooms: number | null;
  ensuites: number | null;
  dsq: boolean;
  parking: number | null;
  floorArea: number | null;
  landAcres: number | null;
  yearBuilt: number | null;
  furnishing: Furnishing | null;
  availableFrom: string | null;
  /** No move-in date, or it has passed (evaluated when the cache entry was built). */
  availableNow: boolean;

  maxGuests: number | null;
  minNights: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  cleaningFeeKes: number | null;
  houseRules: string | null;

  amenities: string[];
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  priceDrop: boolean;

  images: ImageData[];
  floorPlans: ImageData[];
  documents: PropertyDocument[];
  videos: PropertyVideo[];
  virtualTourUrl: string | null;

  agent: PropertyAgent | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export const DETAIL_SELECT = `
  *,
  area:areas ( name, slug ),
  media:property_media ( id, property_id, kind, storage_path, url, alt, caption, room_label, width, height, blur_data, sort_order, is_cover ),
  agent:profiles ( full_name, phone, whatsapp, avatar_url, bio )
`;

/** Staff may paste a full URL or upload to `site-media`; accept both. */
function resolveAssetUrl(value: string | null, bucket = "site-media"): string | null {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : storagePublicUrl(bucket, value);
}

const isHttps = (u: string | null): u is string => !!u && /^https:\/\//i.test(u);

export function toDetail(row: DetailRow): PropertyDetail {
  const media = row.media ?? [];
  const published = row.published_at ? Date.parse(row.published_at) : null;
  const location =
    row.latitude !== null && row.longitude !== null
      ? (([lat, lng]) => ({ lat, lng }))(approximateLocation(row.id, row.latitude, row.longitude))
      : null;

  const floorPlans: ImageData[] = media
    .filter((m) => m.kind === "floor_plan")
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((m) => {
      const src = mediaUrl(m);
      if (!src) return [];
      return [{ src, alt: m.alt || `Floor plan — ${row.title}`, width: m.width ?? 2000, height: m.height ?? 1400, blurDataURL: m.blur_data, room: null }];
    });
  const legacyPlan = resolveAssetUrl(row.floor_plan_url, "property-media");
  if (legacyPlan && !floorPlans.some((p) => p.src === legacyPlan) && !/\.pdf($|\?)/i.test(legacyPlan)) {
    floorPlans.unshift({ src: legacyPlan, alt: `Floor plan — ${row.title}`, width: 2000, height: 1400, blurDataURL: null, room: null });
  }

  const documents: PropertyDocument[] = media
    .filter((m) => m.kind === "document")
    .flatMap((m) => {
      const url = mediaUrl(m);
      return url ? [{ url, label: m.caption || m.alt || "Document" }] : [];
    });
  const brochure = resolveAssetUrl(row.brochure_url, "property-media");
  if (brochure && !documents.some((d) => d.url === brochure)) documents.unshift({ url: brochure, label: "Brochure (PDF)" });
  if (legacyPlan && /\.pdf($|\?)/i.test(legacyPlan)) documents.push({ url: legacyPlan, label: "Floor plan (PDF)" });

  const videos: PropertyVideo[] = [];
  const pushVideo = (url: string | null, title: string) => {
    if (url && !videos.some((v) => v.url === url)) videos.push({ url, title });
  };
  pushVideo(row.youtube_url, `Video tour: ${row.title}`);
  for (const m of media.filter((x) => x.kind === "video").sort((a, b) => a.sort_order - b.sort_order)) {
    pushVideo(m.url, m.caption || m.alt || `Video: ${row.title}`);
  }
  pushVideo(row.tiktok_url, `${row.title} on TikTok`);
  pushVideo(row.instagram_url, `${row.title} on Instagram`);

  return {
    id: row.id,
    refCode: row.ref_code,
    slug: row.slug,
    href: listingHref(row.listing_type, row.slug),
    title: row.title,
    summary: row.summary,
    description: row.description_md,
    listingType: row.listing_type,
    status: row.status,
    propertyType: row.property_type,
    area: row.area,
    address: row.address_line,
    location,

    priceKes: toNum(row.price_kes),
    pricePeriod: row.price_period,
    priceOnRequest: row.price_on_request,
    serviceChargeKes: toNum(row.service_charge_kes),
    depositMonths: toNum(row.deposit_months),

    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    ensuites: row.ensuites,
    dsq: row.dsq ?? false,
    parking: row.parking_spaces,
    floorArea: toNum(row.floor_area_sqm),
    landAcres: toNum(row.land_size_acres),
    yearBuilt: row.year_built,
    furnishing: row.furnishing,
    availableFrom: row.available_from,
    availableNow: !row.available_from || row.available_from <= nairobiToday(),

    maxGuests: row.max_guests,
    minNights: row.min_nights,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    cleaningFeeKes: toNum(row.cleaning_fee_kes),
    houseRules: row.house_rules_md,

    amenities: row.amenities ?? [],
    tags: row.tags ?? [],
    isFeatured: row.is_featured,
    isNew: published !== null && Date.now() - published < NEW_FOR_DAYS * 86_400_000,
    priceDrop: row.tags?.includes("price_drop") ?? false,

    images: propertyImages(media, row.title),
    floorPlans,
    documents,
    videos,
    virtualTourUrl: isHttps(row.virtual_tour_url) ? row.virtual_tour_url : null,

    agent: row.agent?.full_name
      ? {
          name: row.agent.full_name,
          phone: row.agent.phone,
          whatsapp: row.agent.whatsapp,
          avatar: resolveAssetUrl(row.agent.avatar_url),
          bio: row.agent.bio,
        }
      : null,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export const propertyTag = (slug: string) => `property:${slug}`;

/** One public listing by slug (published, under offer, sold or let), or null. */
export async function getPropertyBySlug(slug: string): Promise<PropertyDetail | null> {
  "use cache";
  cacheTag(PROPERTIES_TAG, propertyTag(slug));
  cacheLife("hours");
  if (!hasSupabaseEnv() || !/^[a-z0-9-]{1,160}$/.test(slug)) return null;

  const { data, error } = await createPublicClient()
    .from("properties")
    .select(DETAIL_SELECT)
    .eq("slug", slug)
    .in("status", PUBLIC_STATUSES)
    .limit(1)
    .overrideTypes<DetailRow[], { merge: false }>();

  if (error) {
    console.error("[getPropertyBySlug]", error.message);
    return null;
  }
  return data?.[0] ? toDetail(data[0]) : null;
}

/** Slugs to prerender at build time, split by detail route. */
export async function getPropertySlugs(kind: "properties" | "short-stays"): Promise<string[]> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];

  const query = createPublicClient().from("properties").select("slug").in("status", PUBLIC_STATUSES).limit(1000);
  const { data, error } = await (kind === "short-stays"
    ? query.eq("listing_type", "short_stay")
    : query.neq("listing_type", "short_stay"));
  if (error) {
    console.error("[getPropertySlugs]", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.slug as string);
}

/**
 * Similar listings: same listing type, available, scored by area, property
 * type, price band and bedrooms. Small catalogue, so score in JS.
 */
export async function getSimilarProperties(
  p: Pick<PropertyDetail, "id" | "listingType" | "propertyType" | "area" | "priceKes" | "bedrooms">,
  limit = 8,
): Promise<PropertyCardData[]> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("hours");
  if (!hasSupabaseEnv()) return [];

  const { data, error } = await createPublicClient()
    .from("properties")
    .select(CARD_SELECT)
    .eq("listing_type", p.listingType)
    .in("status", ["published", "under_offer"])
    .neq("id", p.id)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(60)
    .overrideTypes<CardRow[], { merge: false }>();

  if (error) {
    console.error("[getSimilarProperties]", error.message);
    return [];
  }

  const now = Date.now();
  const score = (c: PropertyCardData) => {
    let s = 0;
    if (p.area && c.areaSlug === p.area.slug) s += 3;
    if (c.propertyType === p.propertyType) s += 1.5;
    if (p.priceKes && c.priceKes) {
      const ratio = c.priceKes / p.priceKes;
      if (ratio > 0.7 && ratio < 1.3) s += 2;
      else if (ratio > 0.5 && ratio < 1.6) s += 1;
    }
    if (p.bedrooms && c.bedrooms) s += Math.max(0, 1 - Math.abs(c.bedrooms - p.bedrooms) * 0.5);
    return s;
  };

  return (data ?? [])
    .map((row) => toCardData(row, now))
    .map((c) => ({ c, s: score(c) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ c }) => c);
}
