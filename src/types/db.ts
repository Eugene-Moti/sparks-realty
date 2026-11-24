/**
 * Hand-written row types for the tables the public site reads, mirroring
 * supabase/migrations. Replace with generated types (`npm run db:types`)
 * once the Supabase CLI is logged in.
 */

export type ListingType = "sale" | "rent" | "short_stay";
export type ListingStatus = "draft" | "published" | "under_offer" | "sold" | "let" | "archived";
export type PropertyType =
  | "apartment"
  | "maisonette"
  | "townhouse"
  | "villa"
  | "bungalow"
  | "penthouse"
  | "studio"
  | "duplex"
  | "land"
  | "commercial"
  | "office";
export type Furnishing = "unfurnished" | "semi_furnished" | "furnished";
export type PricePeriod = "once" | "month" | "night";

/** Postgres numeric arrives as string or number depending on the driver. */
export type Numeric = number | string | null;

export type PropertyMediaRow = {
  id: string;
  property_id: string;
  kind: "image" | "video" | "floor_plan" | "document";
  storage_path: string | null;
  url: string | null;
  alt: string | null;
  caption: string | null;
  room_label: string | null;
  width: number | null;
  height: number | null;
  blur_data: string | null;
  sort_order: number;
  is_cover: boolean;
};

export type AreaRow = {
  id: string;
  name: string;
  slug: string;
  county: string;
  hero_image: string | null;
  summary: string | null;
  guide_md: string | null;
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
};

export type PropertyRow = {
  id: string;
  ref_code: string | null;
  slug: string;
  title: string;
  summary: string | null;
  description_md: string | null;
  listing_type: ListingType;
  status: ListingStatus;
  property_type: PropertyType;
  area_id: string | null;
  address_line: string | null;
  latitude: number | null;
  longitude: number | null;
  price_kes: Numeric;
  price_period: PricePeriod | null;
  price_on_request: boolean;
  service_charge_kes: Numeric;
  deposit_months: Numeric;
  bedrooms: number | null;
  bathrooms: number | null;
  ensuites: number | null;
  dsq: boolean | null;
  parking_spaces: number | null;
  floor_area_sqm: Numeric;
  land_size_acres: Numeric;
  year_built: number | null;
  furnishing: Furnishing | null;
  available_from: string | null;
  max_guests: number | null;
  min_nights: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  cleaning_fee_kes: Numeric;
  house_rules_md: string | null;
  amenities: string[];
  tags: string[];
  is_featured: boolean;
  youtube_url: string | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  virtual_tour_url: string | null;
  floor_plan_url: string | null;
  brochure_url: string | null;
  agent_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  view_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TestimonialRow = {
  id: string;
  author: string;
  role: string | null;
  quote: string;
  rating: number | null;
  avatar_url: string | null;
  published: boolean;
  sort_order: number;
};

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string | null;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  published: boolean;
  published_at: string | null;
  author_id: string | null;
};

export type VideoRow = {
  id: string;
  platform: "youtube" | "tiktok" | "instagram" | "facebook";
  url: string;
  title: string | null;
  thumbnail: string | null;
  property_id: string | null;
  is_featured: boolean;
  sort_order: number;
};

export type ShortStayBlockRow = {
  id: string;
  property_id: string;
  starts_on: string;
  /** Exclusive: the check-out day. */
  ends_on: string;
  reason: string | null;
  nightly_override_kes: Numeric;
  created_at: string;
};

export type EnquiryKind = "general" | "property" | "viewing" | "short_stay" | "list_with_us" | "diaspora";
export type EnquiryStatus = "new" | "contacted" | "qualified" | "closed" | "spam";

export type EnquiryRow = {
  id: string;
  kind: EnquiryKind;
  status: EnquiryStatus;
  property_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  message: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  budget_min_kes: Numeric;
  budget_max_kes: Numeric;
  source: string | null;
  assigned_to: string | null;
  notes: string | null;
  consent_given: boolean;
  marketing_opt_in: boolean;
  consent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  role: "admin" | "agent" | "editor";
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  created_at: string;
};

export type SavedSearchRow = {
  id: string;
  email: string;
  filters: Record<string, unknown>;
  consent_given: boolean;
  marketing_opt_in: boolean;
  consent_at: string | null;
  created_at: string;
};
