import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { approximateLocation } from "@/lib/geo";
import { listingHref } from "@/lib/labels";
import { nightsBetween } from "@/lib/short-stay/stay";
import { propertyImages } from "@/lib/media";
import type { PropertyFilters } from "@/lib/search/filters";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";
import type { ListingStatus, PricePeriod, PropertyMediaRow, PropertyRow } from "@/types/db";
import {
  CARD_SELECT,
  type CardRow,
  PROPERTIES_TAG,
  PUBLIC_STATUSES,
  type PropertyCardData,
  toCardData,
  toNum,
} from "./properties";

/** Statuses shown in search results: available homes, plus under-offer ones. */
export const SEARCH_STATUSES: ListingStatus[] = ["published", "under_offer"];
export const PAGE_SIZE = 12;

export type SearchResult = {
  items: PropertyCardData[];
  total: number;
  page: number;
  pageSize: number;
};

const MEDIA_SELECT =
  "media:property_media ( id, property_id, kind, storage_path, url, alt, caption, room_label, width, height, blur_data, sort_order, is_cover )";

/**
 * Property IDs closed for any night in [checkIn, checkOut). Seasonal-pricing
 * rows (reason = 'pricing') change the rate, not availability, so they are skipped.
 */
async function blockedPropertyIds(f: PropertyFilters): Promise<string[]> {
  if (!f.checkIn || !f.checkOut) return [];
  const { checkIn, checkOut } = f;
  const { data, error } = await createPublicClient()
    .from("short_stay_blocks")
    .select("property_id")
    .lt("starts_on", checkOut)
    .gt("ends_on", checkIn)
    .or("reason.is.null,reason.neq.pricing")
    .overrideTypes<{ property_id: string }[], { merge: false }>();
  if (error) console.error("[blockedPropertyIds]", error.message);
  return [...new Set((data ?? []).map((r) => r.property_id))];
}

/** The filter methods we use, shared by every PostgREST select builder. */
type Filterable<Q> = {
  in(column: string, values: readonly unknown[]): Q;
  eq(column: string, value: unknown): Q;
  gte(column: string, value: unknown): Q;
  lte(column: string, value: unknown): Q;
  contains(column: string, value: readonly unknown[]): Q;
  or(filters: string): Q;
  not(column: string, operator: string, value: unknown): Q;
  textSearch(column: string, query: string, options?: { type?: "plain" | "phrase" | "websearch"; config?: string }): Q;
};

/**
 * Apply filters synchronously. Never make this async: PostgREST builders are
 * thenables, so returning one from an async function would execute the query.
 */
function applyFilters<Q extends Filterable<Q>>(query: Q, f: PropertyFilters, blocked: string[]): Q {
  let q = query.in("status", SEARCH_STATUSES);
  if (f.listing) q = q.eq("listing_type", f.listing);
  if (f.areas.length) q = q.in("area.slug", f.areas);
  if (f.types.length) q = q.in("property_type", f.types);
  if (f.minPrice) q = q.gte("price_kes", f.minPrice);
  if (f.maxPrice) q = q.lte("price_kes", f.maxPrice);
  if (f.beds) q = q.gte("bedrooms", f.beds);
  if (f.baths) q = q.gte("bathrooms", f.baths);
  if (f.furnishing.length) q = q.in("furnishing", f.furnishing);
  if (f.amenities.length) q = q.contains("amenities", f.amenities);
  if (f.available) q = q.or(`available_from.is.null,available_from.lte.${f.available}`);
  if (f.guests) q = q.gte("max_guests", f.guests);
  if (f.checkIn && f.checkOut) {
    q = q.or(`min_nights.is.null,min_nights.lte.${nightsBetween(f.checkIn, f.checkOut)}`);
  }
  if (f.q) q = q.textSearch("search_tsv", f.q, { type: "websearch", config: "english" });
  if (blocked.length) q = q.not("id", "in", `(${blocked.join(",")})`);
  return q;
}

/** Inner-join areas when filtering by area slug, so the filter removes rows. */
const areaJoin = (f: PropertyFilters) => (f.areas.length ? "area:areas!inner" : "area:areas");

function cardSelect(f: PropertyFilters) {
  return CARD_SELECT.replace("area:areas", areaJoin(f));
}

/** One page of results for the listing pages. Cached per filter combination. */
export async function searchProperties(f: PropertyFilters, page = 1): Promise<SearchResult> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("minutes");
  const empty: SearchResult = { items: [], total: 0, page, pageSize: PAGE_SIZE };
  if (!hasSupabaseEnv()) return empty;

  const from = (page - 1) * PAGE_SIZE;
  const base = createPublicClient().from("properties").select(cardSelect(f), { count: "exact" });
  let query = applyFilters(base, f, await blockedPropertyIds(f));

  switch (f.sort) {
    case "price_asc":
      query = query.order("price_kes", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price_kes", { ascending: false, nullsFirst: false });
      break;
    case "popular":
      query = query.order("view_count", { ascending: false });
      break;
    default:
      query = query.order("published_at", { ascending: false, nullsFirst: false });
  }

  const { data, error, count } = await query
    .order("id")
    .range(from, from + PAGE_SIZE - 1)
    .overrideTypes<CardRow[], { merge: false }>();

  if (error) {
    console.error("[searchProperties]", error.message);
    return empty;
  }
  const now = Date.now();
  return { items: (data ?? []).map((r) => toCardData(r, now)), total: count ?? 0, page, pageSize: PAGE_SIZE };
}

/** Result count only (mobile filter sheet: "Show 14 homes"). */
export async function countProperties(f: PropertyFilters): Promise<number> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("minutes");
  if (!hasSupabaseEnv()) return 0;
  const select = f.areas.length ? "id, area:areas!inner ( slug )" : "id";
  const base = createPublicClient().from("properties").select(select, { count: "exact", head: true });
  const { count, error } = await applyFilters(base, f, await blockedPropertyIds(f));
  if (error) console.error("[countProperties]", error.message);
  return count ?? 0;
}

export type MapPoint = {
  id: string;
  title: string;
  href: string;
  lat: number;
  lng: number;
  priceKes: number | null;
  pricePeriod: PricePeriod | null;
  priceOnRequest: boolean;
  image: string | null;
  bedrooms: number | null;
  areaName: string | null;
};

type MapRow = Pick<
  PropertyRow,
  | "id"
  | "slug"
  | "title"
  | "listing_type"
  | "latitude"
  | "longitude"
  | "price_kes"
  | "price_period"
  | "price_on_request"
  | "bedrooms"
> & { area: { name: string; slug: string } | null; media: PropertyMediaRow[] | null };

/** Every matching listing with coordinates (map view), up to 500. */
export async function getMapPoints(f: PropertyFilters): Promise<MapPoint[]> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("minutes");
  if (!hasSupabaseEnv()) return [];

  const select = `id, slug, title, listing_type, latitude, longitude, price_kes, price_period, price_on_request, bedrooms, ${areaJoin(f)} ( name, slug ), ${MEDIA_SELECT}`;
  const base = createPublicClient().from("properties").select(select);
  const query = applyFilters(base, f, await blockedPropertyIds(f));
  const { data, error } = await query
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(500)
    .overrideTypes<MapRow[], { merge: false }>();
  if (error) {
    console.error("[getMapPoints]", error.message);
    return [];
  }
  return (data ?? []).map((r) => {
    const [lat, lng] = approximateLocation(r.id, r.latitude as number, r.longitude as number);
    return {
      id: r.id,
      title: r.title,
      href: listingHref(r.listing_type, r.slug),
      lat,
      lng,
      priceKes: toNum(r.price_kes),
      pricePeriod: r.price_period,
      priceOnRequest: r.price_on_request,
      image: propertyImages(r.media, r.title)[0]?.src ?? null,
      bedrooms: r.bedrooms,
      areaName: r.area?.name ?? null,
    };
  });
}

const UUID = /^[0-9a-f-]{36}$/i;

/** Cards for a list of IDs (favourites), in the given order. Public statuses only. */
export async function getCardsByIds(ids: string[]): Promise<PropertyCardData[]> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("minutes");
  const clean = ids.filter((id) => UUID.test(id)).slice(0, 60);
  if (!hasSupabaseEnv() || clean.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("properties")
    .select(CARD_SELECT)
    .in("id", clean)
    .in("status", PUBLIC_STATUSES)
    .overrideTypes<CardRow[], { merge: false }>();
  if (error) console.error("[getCardsByIds]", error.message);
  const now = Date.now();
  const byId = new Map((data ?? []).map((r) => [r.id, toCardData(r, now)]));
  return clean.flatMap((id) => byId.get(id) ?? []);
}

export type CompareData = PropertyCardData & {
  ensuites: number | null;
  dsq: boolean | null;
  landAcres: number | null;
  furnishing: string | null;
  serviceChargeKes: number | null;
  depositMonths: number | null;
  availableFrom: string | null;
  amenities: string[];
  maxGuests: number | null;
  cleaningFeeKes: number | null;
};

type CompareRow = CardRow &
  Pick<
    PropertyRow,
    | "ensuites"
    | "dsq"
    | "land_size_acres"
    | "furnishing"
    | "service_charge_kes"
    | "deposit_months"
    | "available_from"
    | "amenities"
    | "max_guests"
    | "cleaning_fee_kes"
  >;

/** Detailed rows for /compare (max 3), in the given order. */
export async function getCompareData(ids: string[]): Promise<CompareData[]> {
  "use cache";
  cacheTag(PROPERTIES_TAG);
  cacheLife("minutes");
  const clean = ids.filter((id) => UUID.test(id)).slice(0, 3);
  if (!hasSupabaseEnv() || clean.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("properties")
    .select(
      `${CARD_SELECT}, ensuites, dsq, land_size_acres, furnishing, service_charge_kes, deposit_months, available_from, amenities, max_guests, cleaning_fee_kes`,
    )
    .in("id", clean)
    .in("status", PUBLIC_STATUSES)
    .overrideTypes<CompareRow[], { merge: false }>();
  if (error) console.error("[getCompareData]", error.message);
  const now = Date.now();
  const byId = new Map<string, CompareData>(
    (data ?? []).map((r) => [
      r.id,
      {
        ...toCardData(r, now),
        ensuites: r.ensuites,
        dsq: r.dsq,
        landAcres: toNum(r.land_size_acres),
        furnishing: r.furnishing,
        serviceChargeKes: toNum(r.service_charge_kes),
        depositMonths: toNum(r.deposit_months),
        availableFrom: r.available_from,
        amenities: r.amenities ?? [],
        maxGuests: r.max_guests,
        cleaningFeeKes: toNum(r.cleaning_fee_kes),
      },
    ]),
  );
  return clean.flatMap((id) => byId.get(id) ?? []);
}
