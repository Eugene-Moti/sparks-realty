import { z } from "zod";
import { FURNISHINGS, LISTING_TYPES, PROPERTY_TYPES } from "@/lib/search/params";

/** Form fields arrive as strings; these turn "" into null and "1,250,000" into 1250000. */
const blank = (v: unknown) => v === "" || v === undefined || v === null;

export const optNumber = (min: number, max: number, label: string) =>
  z.preprocess(
    (v) => (blank(v) ? null : typeof v === "string" ? Number(v.replace(/[,\s]/g, "")) : v),
    z
      .number({ error: `${label} must be a number.` })
      .min(min, `${label} can't be less than ${min.toLocaleString("en-KE")}.`)
      .max(max, `${label} looks too large.`)
      .nullable(),
  );

export const optInt = (min: number, max: number, label: string) =>
  z.preprocess(
    (v) => (blank(v) ? null : typeof v === "string" ? Number(v.replace(/[,\s]/g, "")) : v),
    z
      .number({ error: `${label} must be a whole number.` })
      .int(`${label} must be a whole number.`)
      .min(min, `${label} can't be less than ${min}.`)
      .max(max, `${label} looks too large.`)
      .nullable(),
  );

export const optText = (max: number, label = "This") =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() || null : (v ?? null)),
    z.string().max(max, `${label} is too long (max ${max.toLocaleString("en-KE")} characters).`).nullable(),
  );

export const optUrl = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.trim() || null : (v ?? null)),
    z.url({ protocol: /^https$/, error: `${label} must be a full https:// link.` }).max(500).nullable(),
  );

const optDate = z.preprocess(
  (v) => (blank(v) ? null : v),
  z.iso.date({ error: "Pick a valid date." }).nullable(),
);

const optTime = z.preprocess(
  (v) => (blank(v) ? null : typeof v === "string" ? v.slice(0, 5) : v),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 14:00.").nullable(),
);

const optUuid = z.preprocess((v) => (blank(v) ? null : v), z.uuid().nullable());

/** Storage path inside property-media (uploaded files), or null. */
const optPath = z.preprocess(
  (v) => (blank(v) ? null : v),
  z.string().max(300).regex(/^[\w\-./]+$/, "Invalid file path.").nullable(),
);

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const EDITABLE_STATUSES = ["draft", "published", "under_offer", "sold", "let", "archived"] as const;

export const propertySchema = z
  .object({
    title: z.string().trim().min(6, "Give the listing a title (at least 6 characters).").max(140, "Keep the title under 140 characters."),
    slug: z.preprocess(
      (v) => (blank(v) ? null : typeof v === "string" ? v.trim().toLowerCase() : v),
      z.string().max(160).regex(SLUG_RE, "Use lowercase letters, numbers and hyphens only.").nullable(),
    ),
    listing_type: z.enum(LISTING_TYPES),
    status: z.enum(EDITABLE_STATUSES),
    property_type: z.enum(PROPERTY_TYPES),
    area_id: optUuid,
    address_line: optText(200, "Address"),
    latitude: optNumber(-5, 5, "Latitude"),
    longitude: optNumber(33, 42, "Longitude"),
    summary: optText(300, "Summary"),
    description_md: optText(20_000, "Description"),

    price_kes: optNumber(0, 50_000_000_000, "Price"),
    price_on_request: z.boolean(),
    service_charge_kes: optNumber(0, 10_000_000, "Service charge"),
    deposit_months: optNumber(0, 24, "Deposit"),

    bedrooms: optInt(0, 50, "Bedrooms"),
    bathrooms: optInt(0, 50, "Bathrooms"),
    ensuites: optInt(0, 50, "Ensuites"),
    dsq: z.boolean(),
    parking_spaces: optInt(0, 200, "Parking"),
    floor_area_sqm: optNumber(0, 1_000_000, "Floor area"),
    land_size_acres: optNumber(0, 100_000, "Land size"),
    year_built: optInt(1900, 2100, "Year built"),
    furnishing: z.preprocess((v) => (blank(v) ? null : v), z.enum(FURNISHINGS).nullable()),
    available_from: optDate,

    max_guests: optInt(1, 50, "Max guests"),
    min_nights: optInt(1, 90, "Minimum nights"),
    check_in_time: optTime,
    check_out_time: optTime,
    cleaning_fee_kes: optNumber(0, 1_000_000, "Cleaning fee"),
    house_rules_md: optText(5_000, "House rules"),

    amenities: z.array(z.string().max(40)).max(60),
    tags: z.array(z.string().max(40)).max(30),
    is_featured: z.boolean(),

    youtube_url: optUrl("YouTube link"),
    tiktok_url: optUrl("TikTok link"),
    instagram_url: optUrl("Instagram link"),
    virtual_tour_url: optUrl("3D tour link"),
    floor_plan_url: optPath,
    brochure_url: optPath,

    agent_id: optUuid,
    seo_title: optText(70, "SEO title"),
    seo_description: optText(170, "SEO description"),
  })
  .superRefine((v, ctx) => {
    if ((v.latitude === null) !== (v.longitude === null)) {
      ctx.addIssue({ code: "custom", path: ["latitude"], message: "Set both latitude and longitude, or neither." });
    }
    if (v.listing_type === "short_stay" && v.max_guests === null && v.status === "published") {
      ctx.addIssue({ code: "custom", path: ["max_guests"], message: "Short stays need a maximum number of guests." });
    }
  });

export type PropertyFormInput = z.input<typeof propertySchema>;
export type PropertyValues = z.output<typeof propertySchema>;

export const pricePeriodFor = (t: (typeof LISTING_TYPES)[number]) => (t === "sale" ? "once" : t === "rent" ? "month" : "night");

/** What stops a listing going live. Shown before the Publish confirmation. */
export function publishProblems(v: PropertyValues, imageCount: number): string[] {
  const out: string[] = [];
  if (!v.area_id) out.push("Choose the area (Basics).");
  if (!v.price_on_request && !v.price_kes) out.push("Add a price, or tick “Price on request” (Pricing).");
  if (imageCount < 1) out.push("Add at least one photo (Media).");
  if (v.listing_type === "short_stay" && !v.max_guests) out.push("Set the maximum number of guests (Short stay).");
  return out;
}

/** "4 Bedroom Maisonette, Kileleshwa" → "4-bedroom-maisonette-kileleshwa". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

/** Listing slug per CLAUDE.md: title + ref code, e.g. 4-bedroom-maisonette-kileleshwa-sp-0012. */
export function listingSlug(title: string, refCode: string | null): string {
  const base = slugify(title) || "listing";
  return refCode ? `${base}-${slugify(refCode)}` : base;
}

export const ROOM_LABELS = [
  "Living room",
  "Dining",
  "Kitchen",
  "Master bedroom",
  "Bedroom",
  "Bathroom",
  "Study",
  "Balcony",
  "Exterior",
  "Garden",
  "Pool",
  "Gym",
  "View",
  "Amenities",
] as const;

export const LISTING_TAGS = [
  { value: "new", label: "New" },
  { value: "diaspora_friendly", label: "Diaspora friendly" },
  { value: "off_plan", label: "Off-plan" },
  { value: "price_drop", label: "Price drop" },
  { value: "pet_friendly", label: "Pet friendly" },
] as const;
