import type { ListingType } from "@/types/db";
import type { SearchParamsState, SortKey } from "./params";

/** Normalised, serializable filters passed to the cached query functions. */
export type PropertyFilters = {
  listing: ListingType | null;
  areas: string[];
  types: string[];
  minPrice: number | null;
  maxPrice: number | null;
  beds: number | null;
  baths: number | null;
  furnishing: string[];
  amenities: string[];
  available: string | null;
  q: string | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number | null;
  sort: SortKey;
};

/** Values a route pins (e.g. /buy pins listing = sale; /areas/kileleshwa pins the area). */
export type FixedFilters = { listing?: ListingType; area?: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = (v: string | null) => (v && ISO_DATE.test(v) ? v : null);
const positive = (v: number | null) => (v !== null && Number.isFinite(v) && v > 0 ? v : null);

export function toFilters(state: SearchParamsState, fixed: FixedFilters = {}): PropertyFilters {
  const listing = fixed.listing ?? state.listing ?? null;
  const areas = fixed.area ? [fixed.area] : [...new Set(state.area)].sort();
  const checkIn = listing === "short_stay" ? date(state.checkIn) : null;
  const checkOut = listing === "short_stay" ? date(state.checkOut) : null;
  return {
    listing,
    areas,
    types: [...new Set(state.type)].sort(),
    // Price only makes sense within one listing type.
    minPrice: listing ? positive(state.minPrice) : null,
    maxPrice: listing ? positive(state.maxPrice) : null,
    beds: positive(state.beds),
    baths: positive(state.baths),
    furnishing: [...new Set(state.furnishing)].sort(),
    amenities: [...new Set(state.amenities)].sort(),
    available: listing === "short_stay" ? null : date(state.available),
    q: state.q?.trim().slice(0, 100) || null,
    checkIn: checkIn && checkOut && checkOut > checkIn ? checkIn : null,
    checkOut: checkIn && checkOut && checkOut > checkIn ? checkOut : null,
    guests: listing === "short_stay" ? positive(state.guests) : null,
    sort: state.sort,
  };
}

/** Number of active filters the visitor set (excludes route-pinned ones and sort). */
export function countActive(f: PropertyFilters, fixed: FixedFilters = {}): number {
  let n = 0;
  if (f.listing && !fixed.listing) n++;
  if (!fixed.area) n += f.areas.length;
  n += f.types.length + f.furnishing.length + f.amenities.length;
  for (const v of [f.minPrice, f.maxPrice, f.beds, f.baths, f.available, f.q, f.checkIn, f.guests]) if (v) n++;
  return n;
}

// ---------- Price slider steps (KES) per listing type ----------

export const PRICE_STEPS: Record<ListingType, number[]> = {
  sale: [
    0, 2_000_000, 5_000_000, 8_000_000, 10_000_000, 12_500_000, 15_000_000, 20_000_000, 25_000_000, 30_000_000,
    40_000_000, 50_000_000, 60_000_000, 75_000_000, 100_000_000, 125_000_000, 150_000_000, 200_000_000, 300_000_000,
  ],
  rent: [
    0, 20_000, 30_000, 40_000, 50_000, 70_000, 90_000, 120_000, 150_000, 180_000, 220_000, 250_000, 300_000, 400_000,
    500_000, 750_000, 1_000_000,
  ],
  short_stay: [0, 3_000, 5_000, 7_500, 10_000, 12_500, 15_000, 20_000, 25_000, 35_000, 50_000, 75_000, 100_000],
};

// ---------- Amenities ----------

export const AMENITIES: { value: string; label: string }[] = [
  { value: "pool", label: "Swimming pool" },
  { value: "gym", label: "Gym" },
  { value: "lift", label: "Lift" },
  { value: "borehole", label: "Borehole" },
  { value: "backup_generator", label: "Backup generator" },
  { value: "dsq", label: "DSQ" },
  { value: "garden", label: "Garden" },
  { value: "balcony", label: "Balcony" },
  { value: "pet_friendly", label: "Pet friendly" },
  { value: "cctv", label: "CCTV" },
  { value: "wifi", label: "Wi-Fi" },
];

export const amenityLabel = (v: string) => AMENITIES.find((a) => a.value === v)?.label ?? v.replace(/_/g, " ");

// ---------- Nearby areas for empty states ----------

export const NEARBY_AREAS: Record<string, string[]> = {
  kileleshwa: ["lavington", "kilimani", "westlands"],
  westlands: ["parklands", "riverside", "kileleshwa"],
  kilimani: ["kileleshwa", "upper-hill", "lavington"],
  lavington: ["kileleshwa", "spring-valley", "kitisuru"],
  riverside: ["westlands", "spring-valley", "kileleshwa"],
  parklands: ["westlands", "riverside", "spring-valley"],
  karen: ["runda", "lavington", "hurlingham"],
  runda: ["kitisuru", "spring-valley", "karen"],
  kitisuru: ["runda", "spring-valley", "lavington"],
  "spring-valley": ["riverside", "kitisuru", "lavington"],
  "upper-hill": ["kilimani", "hurlingham", "westlands"],
  hurlingham: ["kilimani", "upper-hill", "kileleshwa"],
  syokimau: ["upper-hill", "kilimani", "ruaka"],
  ruaka: ["runda", "kitisuru", "westlands"],
};
