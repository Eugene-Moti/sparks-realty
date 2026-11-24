import type { ListingStatus, ListingType, PropertyRow, PropertyType } from "@/types/db";

/** Form state: inputs hold strings; the zod schema converts on save. */
export type EditorValues = {
  title: string;
  slug: string;
  listing_type: ListingType;
  status: ListingStatus;
  property_type: PropertyType;
  area_id: string;
  address_line: string;
  latitude: string;
  longitude: string;
  summary: string;
  description_md: string;
  price_kes: string;
  price_on_request: boolean;
  service_charge_kes: string;
  deposit_months: string;
  bedrooms: string;
  bathrooms: string;
  ensuites: string;
  dsq: boolean;
  parking_spaces: string;
  floor_area_sqm: string;
  land_size_acres: string;
  year_built: string;
  furnishing: string;
  available_from: string;
  max_guests: string;
  min_nights: string;
  check_in_time: string;
  check_out_time: string;
  cleaning_fee_kes: string;
  house_rules_md: string;
  amenities: string[];
  tags: string[];
  is_featured: boolean;
  youtube_url: string;
  tiktok_url: string;
  instagram_url: string;
  virtual_tour_url: string;
  floor_plan_url: string;
  brochure_url: string;
  agent_id: string;
  seo_title: string;
  seo_description: string;
};

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function toEditorValues(row: PropertyRow | null, defaultAgentId: string | null): EditorValues {
  return {
    title: s(row?.title),
    slug: "",
    listing_type: row?.listing_type ?? "sale",
    status: row?.status ?? "draft",
    property_type: row?.property_type ?? "apartment",
    area_id: s(row?.area_id),
    address_line: s(row?.address_line),
    latitude: s(row?.latitude),
    longitude: s(row?.longitude),
    summary: s(row?.summary),
    description_md: s(row?.description_md),
    price_kes: row?.price_kes === null || row?.price_kes === undefined ? "" : String(Math.round(Number(row.price_kes))),
    price_on_request: row?.price_on_request ?? false,
    service_charge_kes: row?.service_charge_kes ? String(Math.round(Number(row.service_charge_kes))) : "",
    deposit_months: s(row?.deposit_months === null || row?.deposit_months === undefined ? "" : Number(row.deposit_months)),
    bedrooms: s(row?.bedrooms),
    bathrooms: s(row?.bathrooms),
    ensuites: s(row?.ensuites),
    dsq: row?.dsq ?? false,
    parking_spaces: s(row?.parking_spaces),
    floor_area_sqm: row?.floor_area_sqm ? String(Number(row.floor_area_sqm)) : "",
    land_size_acres: row?.land_size_acres ? String(Number(row.land_size_acres)) : "",
    year_built: s(row?.year_built),
    furnishing: s(row?.furnishing),
    available_from: s(row?.available_from),
    max_guests: s(row?.max_guests),
    min_nights: s(row?.min_nights ?? (row ? "" : "1")),
    check_in_time: s(row?.check_in_time).slice(0, 5),
    check_out_time: s(row?.check_out_time).slice(0, 5),
    cleaning_fee_kes: row?.cleaning_fee_kes ? String(Math.round(Number(row.cleaning_fee_kes))) : "",
    house_rules_md: s(row?.house_rules_md),
    amenities: row?.amenities ?? [],
    tags: row?.tags ?? [],
    is_featured: row?.is_featured ?? false,
    youtube_url: s(row?.youtube_url),
    tiktok_url: s(row?.tiktok_url),
    instagram_url: s(row?.instagram_url),
    virtual_tour_url: s(row?.virtual_tour_url),
    floor_plan_url: s(row?.floor_plan_url),
    brochure_url: s(row?.brochure_url),
    agent_id: s(row?.agent_id ?? defaultAgentId),
    seo_title: s(row?.seo_title),
    seo_description: s(row?.seo_description),
  };
}

export type EditorTab = "basics" | "pricing" | "details" | "media" | "stay" | "seo";

/** Which tab shows each field (to jump to the first error). */
export const FIELD_TABS: Partial<Record<keyof EditorValues, EditorTab>> = {
  price_kes: "pricing",
  price_on_request: "pricing",
  service_charge_kes: "pricing",
  deposit_months: "pricing",
  bedrooms: "details",
  bathrooms: "details",
  ensuites: "details",
  parking_spaces: "details",
  floor_area_sqm: "details",
  land_size_acres: "details",
  year_built: "details",
  furnishing: "details",
  available_from: "details",
  amenities: "details",
  tags: "details",
  youtube_url: "media",
  tiktok_url: "media",
  instagram_url: "media",
  virtual_tour_url: "media",
  floor_plan_url: "media",
  brochure_url: "media",
  max_guests: "stay",
  min_nights: "stay",
  check_in_time: "stay",
  check_out_time: "stay",
  cleaning_fee_kes: "stay",
  house_rules_md: "stay",
  seo_title: "seo",
  seo_description: "seo",
  slug: "seo",
};
